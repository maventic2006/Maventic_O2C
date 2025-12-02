import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { KloController } from 'kloTouch/jspublic/KloController';
import kloAttach from 'kloTouch/KloControl/KloAttach';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloTransaction } from 'kloBo/KloTransaction';
import { css } from 'jquery';
import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_business_area } from 'o2c_v2/entity/d_o2c_business_area';
import { d_o2c_holiday_calendar } from 'o2c_v2/entity_gen/d_o2c_holiday_calendar';
import { d_o2c_emp_leave_quota } from 'o2c_v2/entity_gen/d_o2c_emp_leave_quota';
import { d_o2c_leave_management } from 'o2c_v2/entity/d_o2c_leave_management';
import { d_o2c_leave_approval } from 'o2c_v2/entity_gen/d_o2c_leave_approval';
import { error } from 'console';
import { d_o2c_employee_designation } from 'o2c_v2/entity_gen/d_o2c_employee_designation';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_leave_category } from 'o2c_v2/entity_gen/d_o2c_leave_category';
import { d_leave_approval_master } from 'o2c_v2/entity_gen/d_leave_approval_master';
import { d_o2c_task_assignment } from 'o2c_v2/entity_gen/d_o2c_task_assignment';
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_emp_leave_quot")
export default class p_o2c_emp_leave_quot extends KloController {
	public fileup; // variable for taking file data
	public filenm; // variable for taking file name
	public roleid; // variable for rolee
	public userid
	public fileeditname
	public fileeditupload
	public other_calendar_id;
	public other_holidaylist;
	public other_calendar_len = 0;
	public leave_days;
	public employee_id_name
	public array_list = new Set();
	public is_line_mgr;
	public projectManager = new Map();
	public employeeArray = [];

	public onInit() {
	}
	public onBeforeRendering() {
	}
	public async onAfterRendering() {
	}
	public async onPageEnter(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let holidaylist, calendar_id;
		this.userid = (await this.transaction.get$User()).login_id;
		// getting list data according to date validation
		this.tm.getTN("o2c_emp_le_search").setProperty('employee_id', this.userid);
		this.tm.getTN("o2c_emp_le_search").setProperty('valid_to_lv', new Date().setHours(0, 0, 0, 0));
		await this.tm.getTN("o2c_emp_le_search").executeP();

		// getting role of the login employee
		this.roleid = (await this.transaction.get$Role()).role_id;

		let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.userid, fdate: new Date().getTime(), tdate: new Date().getTime() });
		if (emp_designation.length > 0) {
			let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { 'designation_id': emp_designation[0].designation, loadAll: true });
			let name = emp_designation_name[0].name.toUpperCase();
			this.roleid = name;
		} else {
			this.roleid = (await this.transaction.get$Role()).role_id;
		}
		let xyz = 'a';
		if (this.roleid)
			xyz = this.roleid


		this.tm.getTN("o2c_approval_search").setProperty('usr_role', xyz);
		//
		await this.tm.getTN("o2c_approval_search").executeP();
		//check

		//this.tm.getTN('o2c_emp_le_list').setActiveFirst();
		let listData = this.tm.getTN('o2c_emp_le_list').getData();
		//SETTING DATA FOR DROPDOWN	
		this.employee_id_name = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_emp_filter', { loadAll: true })
		let profit_center = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == this.userid.toLocaleLowerCase())
		// console.log(await profit_center.r_employee_org.fetch());
		const setemployeeData = new Map();
		for (let emp_le of this.employee_id_name) {
			setemployeeData.set(emp_le.employee_id, emp_le.full_name)
		}
		let employeeData = Array.from(setemployeeData, ([employee_id, name]) => ({ employee_id, name }));

		this.tm.getTN('o2c_mantees_dropdown').setData(employeeData);

		if (this.employee_id_name.length > 1 || this.roleid == "HR" || this.roleid == "MANAGER") {
			this.is_line_mgr = true;
		}
		//SETTING DATA FOR CALENDER

		if (listData.length) {


			try {
				this.other_calendar_id = await this.transaction.getExecutedQuery('d_o2c_business_area', { company_code: listData[0].company_code, partialSelect: ['office_calender', 'name', 'company_code', 'business_area'], loadAll: true })
				calendar_id = this.other_calendar_id.find(({ company_code, business_area }) => company_code == listData[0].company_code && business_area == listData[0].business_area)
				holidaylist = <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: calendar_id.office_calender });
				await this.tm.getTN('holiday_list').setData(holidaylist);
				this.setDateForCalendar(this.userid);
				this.tm.getTN("cmp_branch_search").setProperty('company_code', listData[0].company_code);
				await this.tm.getTN("cmp_branch_search").executeP();
			} catch (e) {
				console.log(e)
				//
			}

		}



		//SETTING DATA FOR OTHER TRANSNODE
		try {
			this.tm.getTN('o2c_leave_management').setData({});
			this.tm.getTN('comp_oth_dropdown').setData({});
			this.tm.getTN('o2c_mantees_history').setData({});
			this.tm.getTN('leave_quota_detail').setData({});
			this.tm.getTN('leave_app_rej_tbl').setData({});
			await this.tm.getTN('o2c_leave_management').setProperty('roles', this.roleid)
			await this.tm.getTN('o2c_leave_management').setProperty('lineManager', this.is_line_mgr)
			this.tm.getTN('comp_oth_dropdown').setData({ office_cal: calendar_id.office_calender });
			await this.tm.getTN('o2c_leave_management').setProperty('approval_name', await this.approverName(listData[0].lmi))
			//SETTING DATA FOR DONUT CHART
			// let chartData = this.tm.getTN('o2c_emp_le_list').getActiveData();
			// this.tm.getTN('o2c_pie_chart').setData([{ "leave": chartData.used_leave, "type": "Approved" }, { "leave": chartData.extended, "type": "Extended" }, { "leave": chartData.unused_leave, "type": "Remaining" }]);
			// this.onChartRender();
			//OTHER BUSINESS AREA CALENDER

			//this.tm.getTN('o2c_office_holiday').setData(holidaylist);

			// this.tm.getTN('o2c_office_holiday').setProperty();
			this.leave_status_detail(this.userid);
		} catch (e) {
			console.log(e)
			sap.m.MessageToast.show("Leave is Not Assigned For you.Please contact your manager.", { duration: 5000 });
		}
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "holiday_color");
		oBusyDailog.close();

		await this.onLeaveCalendar(await profit_center.r_employee_org.fetch());
		this.tm.getTN('o2c_office_holiday').setProperty('office_caender_name', calendar_id.name)





		//Setting and executing query for Reporting Line Team Members..
		await this.tm.getTN("reporting_line_member_search").setProperty("employee_id", this.employeeArray);
		await this.tm.getTN("reporting_line_member_search").executeP();

	}
	public onExit() {
	}
	// NAVIGATION TO DETAILS
	public async onQuotaDetails(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		await this.navTo(({ SS: 'pa_relation_detail' }), oEvent);
		// let chartData = await this.tm.getTN('o2c_emp_le_list').getProperty(parseInt(path.replace("/o2c_emp_le_list/", '')));
		// this.tm.getTN('o2c_pie_chart').setData([{ "leave": chartData.used_leave, "type": "Approved" }, { "leave": chartData.extended, "type": "Extended" }, { "leave": chartData.unused_leave, "type": "Remaining" }]);
		this.onEndDateSelect()
		// this.onChartRender();

		//  let data = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('q_leave_apr_rej', { loadAll: true })
		//  let ad = data
		//  let data1 = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('q_mantees_leaves', { loadAll: true })
		//  let bd = data1
	}
	// APPLYING LEAVE
	public async getDataForManagement(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog().setText("Applying...").open();
		let checkLeaveDate, emp_id, line_manager, emp_name;
		let listData = await this.tm.getTN('o2c_emp_le_list').getActiveData();
		let managementData = await this.tm.getTN('o2c_leave_management').getData();
		if (managementData.start_date && managementData.end_date && managementData.request_reason && managementData.quota_id) {
			let leaveData = this.tm.getTN('o2c_emp_le_detail').getProperty('r_leave_quota_management')
			//Checking loging as a manager 
			if (this.is_line_mgr) {
				if (managementData.mantees) {
					if (managementData.mantees.toLocaleLowerCase() == this.userid.toLocaleLowerCase()) {
						checkLeaveDate = await d_o2c_leave_management.checkLeaveDate(new Date(managementData.start_date).getTime(), new Date(managementData.end_date).getTime(), managementData.mantees, this.transaction)
						emp_id = managementData.mantees.toLocaleLowerCase();
						line_manager = listData.lmi
						emp_name = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == managementData.mantees.toLocaleLowerCase())
					} else {
						checkLeaveDate = await d_o2c_leave_management.checkLeaveDate(new Date(managementData.start_date).getTime(), new Date(managementData.end_date).getTime(), managementData.mantees, this.transaction)
						emp_id = managementData.mantees.toLocaleLowerCase()
						line_manager = this.userid
						emp_name = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == managementData.mantees.toLocaleLowerCase())
					}
				} else {
					checkLeaveDate = await d_o2c_leave_management.checkLeaveDate(new Date(managementData.start_date).getTime(), new Date(managementData.end_date).getTime(), this.userid, this.transaction)
					emp_id = this.userid.toLocaleUpperCase()
					line_manager = listData.lmi
					emp_name = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == this.userid.toLocaleLowerCase())
				}
			} else {
				checkLeaveDate = await d_o2c_leave_management.checkLeaveDate(new Date(managementData.start_date).getTime(), new Date(managementData.end_date).getTime(), this.userid, this.transaction)
				emp_id = this.userid.toLocaleUpperCase()
				line_manager = listData.lmi
				emp_name = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == this.userid.toLocaleLowerCase())
			}
			if (checkLeaveDate == 0 || (listData.leave_types == 'Maternity' || listData.leave_types == 'Paternity')) {
				// EXAM LEAVE
				if (listData.leave_types == 'Exam') {
					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(listData, managementData, emp_id, 1);

					if (this.fileup != null && this.filenm != null) {
						let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)

						let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", leave_catagory: listData.category_id, quota_id: listData.quota_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;
						await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)
						listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(managementData.no_of_days.toFixed(2));
						let newAttech = await this.tm.getTN("o2c_emp_le_detail").getProperty('r_leave_quota_management')[0].r_manag_attch.newEntityP()
						await newAttech.attachment_url.setAttachmentP(this.fileup, this.filenm);
						// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
						await this.retrySave("Applied Successfully", "Save Failed");
						this.setDateForCalendar(emp_id);
					} else {
						sap.m.MessageToast.show("please upload a file.", { duration: 2000 });
					}


				}//SICK LEAVE
				else if (listData.leave_types == 'Sick') {
					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(listData, managementData, emp_id, 1);
					if (managementData.no_of_days > 2) {
						if (this.fileup != null && this.filenm != null) {
							let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)

							let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", quota_id: listData.quota_id, leave_catagory: listData.category_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;
							await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)
							listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(quota);
							let newAttech = await this.tm.getTN("o2c_emp_le_detail").getProperty('r_leave_quota_management')[0].r_manag_attch.newEntityP()
							await newAttech.attachment_url.setAttachmentP(this.fileup, this.filenm);
							// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
							await this.retrySave("Applied Successfully", "Save Failed");
							this.setDateForCalendar(emp_id);
						} else {
							sap.m.MessageToast.show("please upload a file.", { duration: 2000 });
						}
					} else {
						let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)

						let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", quota_id: listData.quota_id, leave_catagory: listData.category_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;
						await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)
						listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(quota);
						// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
						await this.retrySave("Applied Successfully", "Save Failed");
						this.setDateForCalendar(emp_id);
					}
				} //MATERNITY LEAVE
				else if (listData.leave_types == 'Maternity') {
					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(listData, managementData, emp_id, 1);
					if (managementData.no_of_days >= listData.no_of_days) {// 168 here
						let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)

						let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", quota_id: listData.quota_id, leave_catagory: listData.category_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;
						if (this.fileup != null && this.filenm != null) {
							let newAttech = await this.tm.getTN("o2c_emp_le_detail").getProperty('r_leave_quota_management')[0].r_manag_attch.newEntityP()
							await newAttech.attachment_url.setAttachmentP(this.fileup, this.filenm);
						}

						await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)

						listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(managementData.no_of_days.toFixed(2));
						// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
						await this.retrySave("Applied Successfully", "Save Failed");
						this.setDateForCalendar(emp_id);
					} else {
						sap.m.MessageToast.show("minimum of 3 days to be applied...", { duration: 2000 });

					}

				} //PATERNITY LEAVE
				else if (listData.leave_types == 'Paternity') {
					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(listData, managementData, emp_id, 1);

					if (listData.no_of_days <= managementData.no_of_days) {
						if (this.fileup != null && this.filenm != null) {
							let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)

							let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", quota_id: listData.quota_id, leave_catagory: listData.category_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;
							await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)

							listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(managementData.no_of_days.toFixed(2));
							let newAttech = await this.tm.getTN("o2c_emp_le_detail").getProperty('r_leave_quota_management')[0].r_manag_attch.newEntityP()
							await newAttech.attachment_url.setAttachmentP(this.fileup, this.filenm);
							// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
							await this.retrySave("Applied Successfully", "Save Failed");
							this.setDateForCalendar(emp_id);
						} else {
							sap.m.MessageToast.show("please upload a file.", { duration: 2000 });
						}
					} else {
						sap.m.MessageToast.show("no of days should be less then remaining date ", { duration: 2000 });
					}

				}
				else {
					// CASUAL LEAVE // OTHER LEAVE
					let [carry, quota] = await this.leave_management_history(managementData, listData, emp_id, line_manager, emp_name)
					listData.requested_leave = parseFloat(listData.requested_leave) + parseFloat(managementData.no_of_days.toFixed(2));

					let entity = await leaveData.newEntityP(0, { start_date: new Date(managementData.start_date), request_reason: managementData.request_reason, no_of_days: managementData.no_of_days, leave_status: "Applied", quota_id: listData.quota_id, leave_catagory: listData.category_id, leave_discription: listData.leave_types, end_date: new Date(managementData.end_date), employee_id: emp_id, request_date: new Date(), lmi: line_manager, half_day_enddate: managementData.half_day_enddate, half_day_startdate: managementData.half_day_startdate, applied_by_employee: emp_name.full_name, carry_forward_leave: carry, quota_leave: quota }, true);//leaveData[0].employee_id = managementData.mantees;

					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(listData, managementData, emp_id, 1);
					await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData)

					// await this.leaveNotification(entity, projectManager);

					// await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
					await this.retrySave("Applied Successfully", "Save Failed");
					this.setDateForCalendar(emp_id);
				}
			}
			else {
				sap.m.MessageToast.show("You have already taken leave for this range.", { duration: 2000 });
			}
			oBusyDailog.close();
			managementData.start_date = managementData.end_date = managementData.request_reason = managementData.no_of_days = "";
			managementData.half_day_enddate = managementData.half_day_startdate = false;
			managementData.startDtate_error = managementData.endDate_error = managementData.request_error = "None"
		} else {
			if (!managementData.start_date) { await this.tm.getTN('o2c_leave_management').setProperty('startDtate_error', 'Error') }
			else { await this.tm.getTN('o2c_leave_management').setProperty('startDtate_error', 'Success') }
			if (!managementData.end_date) { await this.tm.getTN('o2c_leave_management').setProperty('endDate_error', 'Error') }
			else { await this.tm.getTN('o2c_leave_management').setProperty('endDate_error', 'Success') }
			if (!managementData.request_reason) { await this.tm.getTN('o2c_leave_management').setProperty('request_error', 'Error') }
			else { await this.tm.getTN('o2c_leave_management').setProperty('request_error', 'Success') }
			if (!managementData.quota_id) { await this.tm.getTN('o2c_leave_management').setProperty('quota_error', 'Error') }
			else { await this.tm.getTN('o2c_leave_management').setProperty('quota_error', 'Success') }
			this.tm.getTN('o2c_leave_management').resetP(true)
			sap.m.MessageToast.show("please fill required data", { duration: 2000 });
			oBusyDailog.close();
		}
	}

	//
	//carry forward calculation

	public async leave_management_history(managementData, listData, emp_id, line_manager, emp_name) {

		const holidayDate = this.tm.getTN('holiday_list').getData();
		let carry, quota, days, rem_days = 0;
		let current_date = new Date();
		current_date.setHours(0, 0, 0, 0)
		if (listData.carry_forward_till != null && (current_date.getTime() <= listData.carry_forward_till.getTime())) {
			if ((listData.carry_forward_till.getTime() <= new Date(managementData.end_date).getTime()) && (listData.carry_forward_till.getTime() >= new Date(managementData.start_date).getTime())) {
				// Current date is before the start date
				let one_day_after_carry = new Date(listData.carry_forward_till)
				one_day_after_carry.setDate(one_day_after_carry.getDate() + 1);
				let days_after_expire = d_o2c_leave_management.calculateBusinessDays(one_day_after_carry, new Date(new Date(managementData.end_date)), holidayDate, listData.leave_types)
				rem_days = days_after_expire
				days = parseFloat(managementData.no_of_days.toFixed(2)) - parseFloat(rem_days.toFixed(2));

			} else if (listData.carry_forward_till.getTime() > new Date(managementData.end_date).getTime()) {
				// Current date is after the end date
				days = managementData.no_of_days;

			} else if (listData.carry_forward_till.getTime() < new Date(managementData.end_date).getTime() && listData.carry_forward_till.getTime() < new Date(managementData.start_date).getTime()) {
				days = 0;
				rem_days = parseFloat(managementData.no_of_days.toFixed(2))
			}
			listData.rem_carry_forward = parseFloat(listData.rem_carry_forward) - parseFloat(days.toFixed(2));
			if (parseFloat(listData.rem_carry_forward) < 0) {
				carry = parseFloat(days.toFixed(2)) + (parseFloat(listData.rem_carry_forward));
				quota = parseFloat(days.toFixed(2)) - carry + rem_days;
				listData.rem_carry_forward = 0;
			} else {
				carry = parseFloat(days.toFixed(2))
				quota = rem_days;
			}
			return [carry, quota]
		} else {
			carry = 0
			quota = parseFloat(managementData.no_of_days.toFixed(2))
			return [carry, quota]
		}
	}
	// Check All project managers ->

	public async onAprflow_prjmgr_filter(listData, managementData, emp_id, lavel) {
		let main_table = <KloEntitySet<d_leave_approval_master>>await this.transaction.getExecutedQuery('d_leave_approval_master', { 'company_code': listData.company_code, 'business_area': listData.business_area, 'leave_types': listData.leave_types, loadAll: true })
		let masterTable = main_table.filter(item => (parseFloat(item.approval_level) == parseFloat(lavel)));
		let prjmgr = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('q_assigned_project', { loadAll: true, 'tstart_date': new Date(managementData.start_date).getTime(), 'tend_date': new Date(managementData.end_date).getTime(), 'employee_id': emp_id, 'line_mgr': listData.lmi });
		let prjmgr_mmid = [];
		let org_code = [{ company_code: listData.company_code, business_area: listData.business_area }]
		for (let i = 0; i < prjmgr.length; i++) {
			prjmgr_mmid.push(prjmgr[i].assigned_by)
		}
		let emporglist = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': prjmgr_mmid, 'is_primary': true, loadAll: true });
		const projectManager = new Map();
		for (let emp_le of prjmgr) {
			projectManager.set(emp_le.assigned_by, emp_le)
		}
		return [masterTable, org_code, projectManager, emporglist, main_table]
	}
	//<-

	// APPLYING leave

	public async onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, listData) {
		if (projectManager.size) {
			if (masterTable[0].leave_roles == 'Project Manager') {
				const keys = Array.from(projectManager.keys());
				
				for (let i = 0; i < keys.length; i++) {
					const empOrgs = emporglist.filter(item => item.employee_id.toLowerCase() === keys[i].toLowerCase());
		
					if (empOrgs.length > 0) {
						await this.transaction.createEntityP('d_o2c_leave_approval', {
							leave_id: entity.leave_id,
							approval_status: "Pending",
							approval_sequence: "1",
							approver: masterTable[0].leave_roles,
							company_code: empOrgs[0].company_code,
							business_area: empOrgs[0].business_area,
							action_required_by: keys[i]
						});
					}
				}
			} else {
				if (masterTable[0].leave_roles == 'Line Manager') {
					org_code = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': listData.lmi, 'is_primary': true, loadAll: true });
				}
				await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approval_status: "Pending", approval_sequence: "1", approver: masterTable[0].leave_roles, company_code: org_code[0].company_code, business_area: org_code[0].business_area });
			}
		} else if (projectManager.size == 0) {
			if (masterTable[0].leave_roles == 'Project Manager') {
				let nextLavel = parseFloat(masterTable[0].approval_level) + 1;
				let nextLeaveApprovalMaster = main_table.filter(item => (parseFloat(item.approval_level) == parseFloat(nextLavel)));
				if (nextLeaveApprovalMaster[0].leave_roles == 'Line Manager') {
					org_code = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': listData.lmi, 'is_primary': true, loadAll: true });
				}
				await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approval_status: "Pending", approval_sequence: "1", approver: nextLeaveApprovalMaster[0].leave_roles, company_code: org_code[0].company_code, business_area: org_code[0].business_area });
			} else {
				if (masterTable[0].leave_roles == 'Line Manager') {
					org_code = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': listData.lmi, 'is_primary': true, loadAll: true });
				}
				await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approval_status: "Pending", approval_sequence: "1", approver: masterTable[0].leave_roles, company_code: listData.company_code, business_area: listData.business_area });
			}
		}

	}
	//end leave apply
	//REFRESHING TABS

	// public async leaveNotification(entity, pm) {
	// 	await this.tm.getTN("leave_notification").setProperty('pm', 'mm0054');
	// 	Array.from(pm.keys())

	// 	await this.tm.getTN("leave_notification").setProperty('line_manager', entity.lmi);
	// 	// await this.tm.getTN("leave_notification").setProperty('emp_id', listData.employee_id);
	// 	const jsonString = JSON.stringify(entity, this.getCircularReplacer());
	// 	await this.tm.getTN("leave_notification").setProperty('leave_obj', jsonString);
	// 	await this.tm.getTN("leave_notification").executeP();
	// }

	public getCircularReplacer() {
		const seen = new WeakSet();
		return (key, value) => {
			if (typeof value === "object" && value !== null) {
				if (seen.has(value)) {
					return;
				}
				seen.add(value);
			}
			return value;
		};
	}



	// public async leave_history_function() { await this.tm.getTN('o2c_managers_leave_lists').resetP(true); }
	// public async leave_approval_function(oEvent) { await this.tm.getTN('o2c_leave_approval_lists').resetP(true); }
	// public async mantees_leave_history_function() { await this.tm.getTN('o2c_mantees_leave_list').resetP(true); }
	public async tabRefresh(oEvent) {
		if (oEvent.mParameters.selectedKey == 'o2c_leave_history') {
			await this.tm.getTN('o2c_managers_leave_lists').resetP(true);
			await this.tm.getTN('o2c_managers_leave_lists').refresh();
		}
		if (oEvent.mParameters.selectedKey == 'pa_mantees_leave') {
			await this.tm.getTN('o2c_mantees_leave_list').resetP(true);
			await this.tm.getTN('o2c_mantees_leave_list').refresh();
		}
		if (oEvent.mParameters.selectedKey == 's_o2c_leave_approval') {
			await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
			await this.tm.getTN('o2c_leave_approval_lists').refresh();
		}
		if (oEvent.mParameters.selectedKey == 'pa_leave_calendar') {
			let date = new Date();
			if (this.employeeArray.length == 0) {
				this.employeeArray = ["NA"];
			}
			//JANUARY
			this.tm.getTN("search_january").setProperty('start_date', new Date(date.getFullYear(), 0, 1).getTime());
			this.tm.getTN("search_january").setProperty('end_date', new Date(date.getFullYear(), 0 + 1, 0).getTime());
			this.tm.getTN("search_january").setProperty('employee_id', this.employeeArray);
			//FABRUARY
			this.tm.getTN("search_february").setProperty('start_date', new Date(date.getFullYear(), 1, 1).getTime());
			this.tm.getTN("search_february").setProperty('end_date', new Date(date.getFullYear(), 1 + 1, 0).getTime());
			this.tm.getTN("search_february").setProperty('employee_id', this.employeeArray);
			//MARCH
			this.tm.getTN("search_march").setProperty('start_date', new Date(date.getFullYear(), 2, 1).getTime());
			this.tm.getTN("search_march").setProperty('end_date', new Date(date.getFullYear(), 2 + 1, 0).getTime());
			this.tm.getTN("search_march").setProperty('employee_id', this.employeeArray);
			//APRIL
			this.tm.getTN("search_april").setProperty('start_date', new Date(date.getFullYear(), 3, 1).getTime());
			this.tm.getTN("search_april").setProperty('end_date', new Date(date.getFullYear(), 3 + 1, 0).getTime());
			this.tm.getTN("search_april").setProperty('employee_id', this.employeeArray);
			//MAY
			this.tm.getTN("search_may").setProperty('start_date', new Date(date.getFullYear(), 4, 1).getTime());
			this.tm.getTN("search_may").setProperty('end_date', new Date(date.getFullYear(), 4 + 1, 0).getTime());
			this.tm.getTN("search_may").setProperty('employee_id', this.employeeArray);
			//JUNE
			this.tm.getTN("search_june").setProperty('start_date', new Date(date.getFullYear(), 5, 1).getTime());
			this.tm.getTN("search_june").setProperty('end_date', new Date(date.getFullYear(), 5 + 1, 0).getTime());
			this.tm.getTN("search_june").setProperty('employee_id', this.employeeArray);
			//JULY
			this.tm.getTN("search_july").setProperty('start_date', new Date(date.getFullYear(), 6, 1).getTime());
			this.tm.getTN("search_july").setProperty('end_date', new Date(date.getFullYear(), 6 + 1, 0).getTime());
			this.tm.getTN("search_july").setProperty('employee_id', this.employeeArray);
			//AUGUST
			this.tm.getTN("search_august").setProperty('start_date', new Date(date.getFullYear(), 7, 1).getTime());
			this.tm.getTN("search_august").setProperty('end_date', new Date(date.getFullYear(), 7 + 1, 0).getTime());
			this.tm.getTN("search_august").setProperty('employee_id', this.employeeArray);
			//SEPTEMBER
			this.tm.getTN("search_september").setProperty('start_date', new Date(date.getFullYear(), 8, 1).getTime());
			this.tm.getTN("search_september").setProperty('end_date', new Date(date.getFullYear(), 8 + 1, 0).getTime());
			this.tm.getTN("search_september").setProperty('employee_id', this.employeeArray);
			//OCTOBER
			this.tm.getTN("search_october").setProperty('start_date', new Date(date.getFullYear(), 9, 1).getTime());
			this.tm.getTN("search_october").setProperty('end_date', new Date(date.getFullYear(), 9 + 1, 0).getTime());
			this.tm.getTN("search_october").setProperty('employee_id', this.employeeArray);

			//NOVEMBER
			this.tm.getTN("search_november").setProperty('start_date', new Date(date.getFullYear(), 10, 1).getTime());
			this.tm.getTN("search_november").setProperty('end_date', new Date(date.getFullYear(), 10 + 1, 0).getTime());
			this.tm.getTN("search_november").setProperty('employee_id', this.employeeArray);
			//DECEMBER
			this.tm.getTN("search_december").setProperty('start_date', new Date(date.getFullYear(), 11, 1).getTime());
			this.tm.getTN("search_december").setProperty('end_date', new Date(date.getFullYear(), 11 + 1, 0).getTime());
			this.tm.getTN("search_december").setProperty('employee_id', this.employeeArray);



			await this.tm.getTN("search_january").executeP();
			await this.tm.getTN("search_february").executeP();
			await this.tm.getTN("search_march").executeP();
			await this.tm.getTN("search_april").executeP();
			await this.tm.getTN("search_may").executeP();
			await this.tm.getTN("search_june").executeP();
			await this.tm.getTN("search_july").executeP();
			await this.tm.getTN("search_august").executeP();
			await this.tm.getTN("search_september").executeP();
			await this.tm.getTN("search_october").executeP();
			await this.tm.getTN("search_november").executeP();
			await this.tm.getTN("search_december").executeP();


		}


	}
	//OTHER NODE LEAVE CALCULATION
	public async onEndDateSelect() {
		let listData = await this.tm.getTN('o2c_emp_le_list').getActiveData();
		const managementData = this.tm.getTN('o2c_leave_management').getData();
		// if(listData.leave_types == "Maternity" && managementData.start_date){
		// 	let endd = new Date(managementData.start_date)
		// 	endd.setDate(endd.getDay() + 168)
		// 	sap.m.MessageToast.show('end Date should '+endd, { duration: 2000 });
		// }
		if (new Date(managementData.start_date).getTime() > new Date(managementData.end_date).getTime()) {
			managementData.start_date = "";
			managementData.end_date = "";
			managementData.no_of_days = "";
			sap.m.MessageToast.show("Start date and end date should be proper", { duration: 2000 });
		} else {
			const holidayDate = this.tm.getTN('holiday_list').getData();
			let holiday_flag = true;
			let days = d_o2c_leave_management.calculateBusinessDays(new Date(managementData.start_date), new Date(managementData.end_date), holidayDate, listData.leave_types)
			if (managementData.half_day_startdate && days > 0) {
				days = days - 0.5;
			}
			if (managementData.half_day_enddate && days > 0) {
				days = days - 0.5;
			}
			if (new Date(managementData.start_date).getTime() == new Date(managementData.end_date).getTime()) {
				for (let hl of holidayDate) {
					if (new Date(hl.holiday_date).getTime() == new Date(managementData.start_date).getTime()) {
						holiday_flag = false;
						break;
					}
				}
			}
			if (days == 0 && managementData.half_day_enddate && managementData.half_day_startdate && holiday_flag) {
				days = 1;
			}
			if (days == 0 || days) {
				if (listData.leave_types == "Maternity") {
					if (days >= (listData.no_of_days)) {// here 168 
						managementData.no_of_days = days;
					} else {
						managementData.end_date = "";
						sap.m.MessageToast.show("whole quota should apply in one shot. ", { duration: 5000 });
					}
				} else {
					managementData.no_of_days = days;
				}
			}
		}
	}
	public async onRefrenceLeaveQuota(leavecategory, employeeid, quotaId) {
		// let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', { 'category_id': leavecategory, 'employee_id': employeeid ,loadAll: true})
		// let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime() });
		if (quotaId != "" && quotaId != undefined && quotaId != null) {

			let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'quota_id': quotaId });

			return leaveData1;
		} else {
			sap.m.MessageToast.show("Quota Id Not Maintained.", {
				duration: 5000,
				my: 'BeginTop'
			})
		}

		return [];

	}
	// MANAGER'S LEAVE EDIT CHANGE
	public async onDateChange(oEvent, param) {
		let managementData = this.tm.getTN(param.trans_node).getData();
		const holidayDate = this.tm.getTN('holiday_list').getData();
		let noOf_days = d_o2c_leave_management.calculateBusinessDays(new Date(managementData.start_date), new Date(managementData.end_date), holidayDate, managementData.leave_discription);
		let holiday_flag = true;

		if (managementData.start_date <= managementData.end_date) {
			managementData.no_of_days = noOf_days;
			if (managementData.half_day_enddate && managementData.no_of_days > 0 && (new Date(managementData.start_date).getTime() <= new Date(managementData.end_date).getTime())) { managementData.no_of_days = managementData.no_of_days - 0.5; }
			if (managementData.half_day_startdate && managementData.no_of_days > 0 && (new Date(managementData.start_date).getTime() <= new Date(managementData.end_date).getTime())) { managementData.no_of_days = managementData.no_of_days - 0.5; }
		}
		if (new Date(managementData.start_date).getTime() == new Date(managementData.end_date).getTime()) {
			for (let hl of holidayDate) {
				if (new Date(hl.holiday_date).getTime() == new Date(managementData.start_date).getTime()) { holiday_flag = false; break; }
			}
		}
		if (managementData.no_of_days == 0 && managementData.half_day_enddate && managementData.half_day_startdate && holiday_flag && (new Date(managementData.start_date).getTime() <= new Date(managementData.end_date).getTime())) { managementData.no_of_days = 1; }
	}
	// OPEN LEAVE HISTORY DIALOG BOX EDIT 
	public async onLeaveEdit(oEvent: sap.ui.base.Event, param) {
		let path = this.getPathFromEvent(oEvent);
		await this.transaction.rollback();
		await this.openDialog(param.dialog_pa);
		this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
		let managementData = await this.tm.getTN(param.trans_node).getProperty(parseInt(path.replace(`/${param.trans_node}/`, '')));
		this.leave_days = managementData.no_of_days;
		this.fileeditupload = null
		this.fileeditname = null
	}
	// SUBMIT LEAVE EDIT DIALOG 
	public async onLeaveEditSubmit(oEvent, param) {
		let managementData = this.tm.getTN(param.trans_node).getData();
		//let checkLeaveDate = await d_o2c_leave_management.checkLeaveDate(new Date(managementData.start_date).getTime(), new Date(managementData.end_date).getTime(), managementData.employee_id, this.transaction)

		this.closeDialog(param.dialog_pa);
		try {

			let diff = managementData.no_of_days - this.leave_days;
			let leavedata = await this.onUpdatedLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
			let leavedata1 = await this.onRefrenceLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
			leavedata1[0].requested_leave = 0.1;
			leavedata1[0].requested_leave = parseFloat(leavedata[0].requested_leave) + parseFloat(diff);
			let entity = await this.currentLeaveData(managementData.leave_id);
			if (managementData.leave_status == entity.leave_status) {
				if (this.fileeditname && this.fileeditupload) {
					let newAttech = await this.tm.getTN(param.trans_node).getProperty('r_manag_attch').newEntityP()
					await newAttech.attachment_url.setAttachmentP(this.fileeditupload, this.fileeditname);
				}
				// if (checkLeaveDate == 0) {
				// await this.tm.commitP("Updated Successfully", "Failed to Update", true, true);
				await this.retrySave("Updated Successfully", "Failed to Update");
				//}
				//else {
				// sap.m.MessageToast.show("You have already taken leave for this date range. Rolling back ", { duration: 5000 });
				// await this.transaction.rollback();
				//}

			} else {
				managementData.leave_status = entity.leave_status;
				sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
				await this.transaction.rollback();
			}
			this.setDateForCalendar(managementData.employee_id);
			this.fileeditupload = null
			this.fileeditname = null
			// let chartData = this.tm.getTN('o2c_emp_le_list').getActiveData();
			// this.tm.getTN('o2c_pie_chart').setData([{ "leave": chartData.used_leave, "type": "Approved" }, { "leave": chartData.extended, "type": "Extended" }, { "leave": chartData.unused_leave, "type": "Remaining" }]);
			// this.onChartRender()
		}
		catch (e) { console.log(e) }
	}
	// CLOSE LEAVE EDIT DIALOG.
	public async onLeaveEditClose(oEvent, param) {
		await this.transaction.rollback();
		this.fileeditupload = null
		this.fileeditname = null
		this.closeDialog(param.dilog_pa);
	}
	// OPEN LEAVE CANCEL DIALOG
	public async onLeaveCancel(oEvent: sap.ui.base.Event, param) {
		let path = this.getPathFromEvent(oEvent);
		await this.transaction.rollback();
		this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
		await this.openDialog(param.dialog_pa);
		this.fileeditupload = null
		this.fileeditname = null
	}
	// ON LEAVE CANCEL
	public async onLeaveCancelSubmit(oEvent: sap.ui.base.Event, param) {
		let oBusyDailog = new sap.m.BusyDialog().setText("cancelling...").open();
		this.closeDialog(param.dialog_pa);// fatching transnode data from ui
		this.fileeditupload = null
		this.fileeditname = null
		const managementData = this.tm.getTN(param.trans_node).getData();// Getting data from 
		let leavedata = await this.onUpdatedLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
		let leavedata1 = await this.onRefrenceLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
		let entity = await this.currentLeaveData(managementData.leave_id);

		if (entity.leave_status == "Approved" && leavedata.length) {


			this.cancel_Approved_leave(entity, managementData, leavedata, leavedata1);


		} else if (entity.leave_status == "Applied" && leavedata.length) {
			leavedata1[0].requested_leave = 0.1;
			leavedata1[0].requested_leave = parseFloat(leavedata[0].requested_leave) - parseFloat(managementData.no_of_days);
			leavedata1[0].rem_carry_forward = parseFloat(leavedata[0].rem_carry_forward) + parseFloat(entity.carry_forward_leave);

			managementData.leave_status = "Cancelled";

			let cancelation_flow = <KloEntitySet<d_o2c_leave_approval>>await this.transaction.getExecutedQuery('d_o2c_leave_approval', { leave_id: managementData.leave_id, approval_status: "Pending", approver: "Line Manager", loadAll: true })
			if (leavedata[0].lmi.toLocaleLowerCase() == this.userid.toLocaleLowerCase()) {
				if (cancelation_flow.length) {
					cancelation_flow[0].approval_status = "Cancelled";
					cancelation_flow[0].approved_on = new Date();
					cancelation_flow[0].action_required_by = this.userid;
				}
				else {
					await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By Line Manager", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "Line Manager" }, true)

				}
			} else {
				await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By User", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "User" }, true)
			}
			await this.leave_reject_quota(leavedata[0], managementData)
			await this.tm.commitP("Cancelled", "Failed to Cancel", true, true);

		}
		else {
			managementData.leave_status = entity.leave_status;
			sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
			await this.transaction.rollback();
		}
		oBusyDailog.close()
		this.setDateForCalendar(managementData.employee_id);

	}
	//approve leave cancel
	public async cancel_Approved_leave(entity, managementData, leavedata, leavedata1) {

		let current_date = new Date();
		current_date.setHours(0, 0, 0, 0);
		if (current_date.getTime() < new Date(managementData.start_date).getTime()) {
			leavedata1[0].rem_carry_forward = parseFloat(leavedata[0].rem_carry_forward) + parseFloat(managementData.carry_forward_leave);
			leavedata1[0].used_carry_forward = parseFloat(leavedata[0].used_carry_forward) - parseFloat(managementData.carry_forward_leave);
			leavedata1[0].requested_leave = parseFloat(leavedata[0].requested_leave);
			if (parseFloat(leavedata[0].no_of_days) == parseFloat(leavedata[0].used_leave)) {
				if (parseFloat(leavedata[0].extended) > 0) {
					leavedata1[0].extended = parseFloat(leavedata[0].extended) - parseFloat(managementData.quota_leave);
					if (parseFloat(leavedata1[0].extended) < 0) {
						leavedata1[0].used_leave = parseFloat(leavedata[0].used_leave) + parseFloat(leavedata1[0].extended);
						leavedata1[0].unused_leave = parseFloat(leavedata[0].unused_leave) - parseFloat(leavedata1[0].extended);
						leavedata1[0].extended = parseFloat("0");
					}
				} else if (parseFloat(leavedata[0].extended) == 0) {
					leavedata1[0].used_leave = parseFloat(leavedata[0].used_leave) - parseFloat(managementData.quota_leave)
					leavedata1[0].unused_leave = parseFloat(leavedata[0].unused_leave) + parseFloat(managementData.quota_leave)

				}
			} else if (parseFloat(leavedata[0].no_of_days) > parseFloat(leavedata[0].used_leave)) {
				leavedata1[0].used_leave = parseFloat(leavedata[0].used_leave) - parseFloat(managementData.quota_leave)
				leavedata1[0].unused_leave = parseFloat(leavedata[0].unused_leave) + parseFloat(managementData.quota_leave)
			}

			//REMARK
			managementData.leave_status = "Cancelled";
			let cancelation_flow = <KloEntitySet<d_o2c_leave_approval>>await this.transaction.getExecutedQuery('d_o2c_leave_approval', { leave_id: managementData.leave_id, approval_status: "Pending", approver: "Line Manager", loadAll: true })
			if (leavedata[0].lmi.toLocaleLowerCase() == this.userid.toLocaleLowerCase()) {
				if (cancelation_flow.length) {
					cancelation_flow[0].approval_status = "Cancelled";
					cancelation_flow[0].approved_on = new Date();
					cancelation_flow[0].action_required_by = this.userid;
				}
				else {
					await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By Line Manager", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "Line Manager" }, true)
				}
			} else {
				await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By User", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "User" }, true)

			}
			// Nasim's
			await this.task_cancel(entity);
			//ends 
			await this.leave_reject_quota(leavedata[0], managementData)
			await this.tm.commitP("Cancelled approved Leave", "Failed to Cancel", true, true);
			sap.m.MessageBox.success("You Have Successfully Cancelled Approved Leave ", {
				title: "Alert",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})
		} else {
			sap.m.MessageBox.error("You Are Not Allowed to Cancel ", {
				title: "Alert",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})
		}
	}


	// ON LEAVE CANCEL CLOSE
	public async onLeaveCancelClose(oEvent: sap.ui.base.Event, param) {
		await this.transaction.rollback();
		this.fileeditupload = null
		this.fileeditname = null
		this.closeDialog(param.dialog_pa);
	}
	// manager's,mantees leave edit ends here
	// DOCUMENT UPLOAD
	public async documentUpload(oEvent) {
		this.fileup = oEvent.mParameters.files[0];
		this.filenm = oEvent.mParameters.files[0].name;
	}
	public async documentUploadEdit(oEvent) {

		if (oEvent.mParameters.files[0]) {
			this.fileeditupload = oEvent.mParameters.files[0];
			this.fileeditname = oEvent.mParameters.files[0].name;
		} else {
			this.fileeditupload = null
			this.fileeditname = null
		}
	}
	//OPEN DAILOG FOR LEAVE APPROVAL
	public async onLeaveApproval(oEvent: sap.ui.base.Event) {
		let sPath = this.getPathFromEvent(oEvent);
		let oBusyDailog = new sap.m.BusyDialog().open();
		await this.transaction.rollback();
		this.tm.getTN('o2c_leave_approval_lists').setActive(parseInt(sPath.replace("/o2c_leave_approval_lists/", '')))
		let data = this.tm.getTN('o2c_leave_approval_lists').getActiveData();
		await this.leave_pnding_status(data.employee_id);
		await this.openDialog('pa_approval_reject');
		oBusyDailog.close()
	}
	// ON LEAVE APPROVED
	public async onApprove(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let oBusyDailog = new sap.m.BusyDialog().open();
		let leave_data = this.tm.getTN('o2c_leave_approval_details').getData();
		let entity = await this.currentLeaveData(leave_data.leave_id);//updated data
		let leaveData = await this.onUpdatedLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);
		let leaveData1 = await this.onRefrenceLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);
		let approval_role = <KloEntitySet<d_o2c_leave_approval>>await this.transaction.getExecutedQuery('d_o2c_leave_approval', { leave_id: leave_data.leave_id, approval_status: "Pending", loadAll: true, skipMap: true })
		if (approval_role.length != 0 && leaveData.length) {
			let approver_master = <KloEntitySet<d_leave_approval_master>>await this.transaction.getExecutedQuery('d_leave_approval_master', { 'company_code': leaveData[0].company_code, 'business_area': leaveData[0].business_area, 'leave_types': entity.leave_discription, loadAll: true })
			let currLeaveApprovalMaster = approver_master.filter(item => (item.leave_roles == approval_role[0].approver));
			let nextLavel = parseFloat(currLeaveApprovalMaster[0].approval_level) + 1;
			let nextLeaveApprovalMaster = approver_master.filter(item => (parseFloat(item.approval_level) == parseFloat(nextLavel)));
			let prj_mgr_apr = approval_role.filter(item => (item.action_required_by == this.userid));
			if (prj_mgr_apr.length) {
				prj_mgr_apr[0].approval_status = "Approved"
				prj_mgr_apr[0].approved_on = new Date();
				prj_mgr_apr[0].action_required_by = this.userid;
				prj_mgr_apr[0].approver_remark = leave_data.approver_remark;
				leave_data.approver_remark = "";
				if (approval_role.length == 1) {
					if (nextLeaveApprovalMaster[0]) {
						// approval_role[0].approval_status = "Approved"
						// approval_role[0].approved_on = new Date();
						// approval_role[0].action_required_by = this.userid;
						// approval_role[0].approver_remark = leave_data.approver_remark;
						// leave_data.approver_remark="";

						let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(leaveData[0], entity, entity.employee_id, nextLavel)
						await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, leaveData[0])
						await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
						await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
						this.tm.getTN('o2c_leave_approval_lists').setActive(0);
						if (await this.tm.getTN('o2c_leave_approval_lists').getData().length == 0)
							await this.closeDialog('pa_approval_reject');

					} else {
						await this.on_data_Approved(entity, leaveData1, leaveData, leave_data, approval_role)
					}
				} else {
					await this.tm.commitP("Approved", "Failed to Approved", true, true);
					await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
					this.tm.getTN('o2c_leave_approval_lists').setActive(0);
					if (await this.tm.getTN('o2c_leave_approval_lists').getData().length == 0)
						await this.closeDialog('pa_approval_reject');

				}
			} else {
				if (nextLeaveApprovalMaster[0]) {
					approval_role[0].approval_status = "Approved"
					approval_role[0].approved_on = new Date();
					approval_role[0].action_required_by = this.userid;
					approval_role[0].approver_remark = leave_data.approver_remark;
					leave_data.approver_remark = "";
					let [masterTable, org_code, projectManager, emporglist, main_table] = await this.onAprflow_prjmgr_filter(leaveData[0], entity, entity.employee_id, nextLavel)
					await this.onLeaveApply(masterTable, org_code, entity, emporglist, projectManager, main_table, leaveData[0])
					await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
					await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
					this.tm.getTN('o2c_leave_approval_lists').setActive(0);
					if (await this.tm.getTN('o2c_leave_approval_lists').getData().length == 0)
						await this.closeDialog('pa_approval_reject');
				} else {
					await this.on_data_Approved(entity, leaveData1, leaveData, leave_data, approval_role)
				}
			}
		}
		await this.tm.getTN('o2c_leave_approval_lists').resetP(true)
		oBusyDailog.close()


	}
	// approved trigger
	public async on_data_Approved(entity, leaveData1, leaveData, leave_data, approval_role) {
		let oBusyDailog = new sap.m.BusyDialog().open();

		const userid = (await this.transaction.get$User()).login_id;
		let status = entity.leave_status;
		try {
			//await this.tm.getTN('o2c_leave_approval_details').getProperty('r_leave_management_approval').newEntityP(0, { leave_id: entity.leave_id, approver_remark: entity.approver_remark, approval_status: "Approved", approval_sequence: "1", approver: userid, approved_on: new Date() }, true)

			leaveData1[0].requested_leave = parseFloat(leaveData[0].requested_leave) - parseFloat(entity.no_of_days);
			// leaveData1[0].rem_carry_forward = parseFloat(leaveData[0].rem_carry_forward) - parseFloat(entity.no_of_days);
			leaveData1[0].used_carry_forward = parseFloat(leaveData[0].used_carry_forward) + parseFloat(entity.carry_forward_leave);
			leaveData1[0].rem_carry_forward = parseFloat(leaveData[0].rem_carry_forward);

			// if (parseFloat(leaveData1[0].rem_carry_forward) < 0) {
			// 	leaveData1[0].rem_carry_forward = parseFloat("0")
			// 	leaveData1[0].used_carry_forward = parseFloat(leaveData[0].used_carry_forward)
			// }
			leaveData1[0].used_leave = parseFloat(leaveData[0].used_leave) + parseFloat(entity.quota_leave);
			if (parseFloat(leaveData1[0].used_leave) > parseFloat(leaveData[0].no_of_days)) {
				leaveData1[0].used_leave = parseFloat(leaveData[0].no_of_days);
			}
			leaveData1[0].unused_leave = parseFloat(leaveData[0].unused_leave) - parseFloat(entity.quota_leave);
			if (parseFloat(leaveData1[0].unused_leave) < 0) {
				leaveData1[0].extended = parseFloat(leaveData[0].extended) - parseFloat(leaveData1[0].unused_leave);
				leaveData1[0].unused_leave = parseFloat("0");
			}
			entity.leave_status = "Approved"
			if (parseFloat(leave_data.no_of_days) == parseFloat(entity.no_of_days) && leave_data.leave_status == status) {
				approval_role[0].approval_status = "Approved"
				approval_role[0].approved_on = new Date();
				approval_role[0].action_required_by = this.userid;
				approval_role[0].approver_remark = leave_data.approver_remark;
				entity.approver_remark = leave_data.approver_remark;
				//nasim's code
				await this.leave_task_assign(entity);
				//ends here  
				await this.tm.commitP("Approved", "Failed to Approved", true, true);
				await this.leaveApprovalNotification(entity);
				await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
				//this.setDateForCalendar(entity.employee_id)
				// let chartData = this.tm.getTN('o2c_emp_le_list').getActiveData();
				// this.tm.getTN('o2c_pie_chart').setData([{ "leave": chartData.used_leave, "type": "Approved" }, { "leave": chartData.extended, "type": "Extended" }, { "leave": chartData.unused_leave, "type": "Remaining" }]);
				// this.onChartRender()

				this.tm.getTN('o2c_leave_approval_lists').setActive(0);
				let cur_data = this.tm.getTN('o2c_leave_approval_lists').getActiveData();
				await this.leave_pnding_status(cur_data.employee_id);


			} else {
				sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
				await this.transaction.rollback();
			}
		} catch (e) {
			oBusyDailog.close()
			console.log(e)
		}


		setTimeout(async () => { oBusyDailog.close() }, 500)
		console.log("i am here...")
		console.log(await this.tm.getTN('o2c_leave_approval_lists').getData().length)



		if (await this.tm.getTN('o2c_leave_approval_lists').getData().length == 0)
			await this.closeDialog('pa_approval_reject');
	}

	public async leaveApprovalNotification(entity) {
		await this.tm.getTN("leave_notification").setProperty('leave_id', entity.leave_id);
		await this.tm.getTN("leave_notification").setProperty('type', "LeaveApprove");
		// 	const jsonString = JSON.stringify(entity, this.getCircularReplacer());
		// 	await this.tm.getTN("leave_notification").setProperty('leave_obj', jsonString);
		await this.tm.getTN("leave_notification").executeP();
	}

	// ON LEAVE REJECTED
	public async onLeaveReject(oEvent: sap.ui.base.Event) {
		let oBusyDailog = new sap.m.BusyDialog().open().setText("rejecting");
		let leave_data = await this.tm.getTN('o2c_leave_approval_details').getData();
		const userid = (await this.transaction.get$User()).login_id;
		let entity = await this.currentLeaveData(leave_data.leave_id);
		let rem = leave_data.approver_remark;
		let status = entity.leave_status
		//await this.tm.getTN('o2c_leave_approval_details').getProperty('r_leave_management_approval').newEntityP(0, { leave_id: entity.leave_id, approver_remark: entity.approver_remark, approval_status: "Rejected", approval_sequence: "1", approver: userid, approved_on: new Date() }, true)
		let leaveData = await this.onUpdatedLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);
		let leaveData1 = await this.onRefrenceLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);

		if (leaveData.length) {
			leaveData1[0].requested_leave = 0.1;
			leaveData1[0].requested_leave = parseFloat(leaveData[0].requested_leave) - parseFloat(entity.no_of_days);
			leaveData1[0].rem_carry_forward = parseFloat(leaveData[0].rem_carry_forward) + parseFloat(entity.carry_forward_leave);
			try {
				entity.leave_status = "Rejected"
				if (parseFloat(leave_data.no_of_days) == parseFloat(entity.no_of_days) && leave_data.leave_status == status) {
					let rejected_flow = <KloEntitySet<d_o2c_leave_approval>>await this.transaction.getExecutedQuery('d_o2c_leave_approval', { leave_id: leave_data.leave_id, approval_status: "Pending", loadAll: true, skipMap: true })
					let prj_mgr_apr = rejected_flow.filter(item => (item.action_required_by == this.userid));
					if (prj_mgr_apr.length) {
						prj_mgr_apr[0].approval_status = "Rejected";
						prj_mgr_apr[0].approved_on = new Date();
						prj_mgr_apr[0].approver_remark = rem;

					} else {
						rejected_flow[0].approval_status = "Rejected";
						rejected_flow[0].approved_on = new Date();
						rejected_flow[0].action_required_by = this.userid;
						rejected_flow[0].approver_remark = rem;

					}
					entity.approver_remark = rem;
					await this.leave_reject_quota(leaveData[0], entity)
					await this.tm.commitP("Rejected", "Unable to Reject", true, true);
					await this.tm.getTN('o2c_leave_approval_lists').resetP(true)
					//this.setDateForCalendar(entity.employee_id)
					// let chartData = this.tm.getTN('o2c_emp_le_list').getActiveData();
					// this.tm.getTN('o2c_pie_chart').setData([{ "leave": chartData.used_leave, "type": "Approved" }, { "leave": chartData.extended, "type": "Extended" }, { "leave": chartData.unused_leave, "type": "Remaining" }]);
					// this.onChartRender()
					this.tm.getTN('o2c_leave_approval_lists').setActive(0);
					let cur_data = this.tm.getTN('o2c_leave_approval_lists').getActiveData();
					await this.leave_pnding_status(cur_data.employee_id);
					await this.leaveApprovalNotification(entity);
				} else {
					sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
					await this.transaction.rollback();
				}
			} catch (e) {
				oBusyDailog.close()
			}
		} else {
			sap.m.MessageToast.show("Quota Id not Maintained. ", { duration: 5000 });

		}
		oBusyDailog.close()
		if (this.tm.getTN('o2c_leave_approval_lists').getData().length == 0)
			await this.closeDialog('pa_approval_reject');
	}
	// NEXT PREVIOUS BUTTON FOR APPROVAL/REJECT DIALOG
	public async onApproveNext() {
		this.tm.getTN('o2c_leave_approval_lists').setActiveNext();
		let cur_data = this.tm.getTN('o2c_leave_approval_lists').getActiveData();
		await this.leave_pnding_status(cur_data.employee_id);
	}
	public async onPrevious() {
		this.tm.getTN('o2c_leave_approval_lists').setActivePrivious();
		let cur_data = this.tm.getTN('o2c_leave_approval_lists').getActiveData();
		await this.leave_pnding_status(cur_data.employee_id);
	}
	// CLOSE DIALOG FOR APPROVAL AND REJECT
	public async onApprovalRejectClose() {
		await this.transaction.rollback();
		await this.closeDialog('pa_approval_reject')
	}
	//APPROVAL REJECT CLOSED
	//FILTER EMPLOYEE LIST 
	public onFilter() {
	}
	public async vhr() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		let mantees_id, manteesquota;
		const userid = (await this.transaction.get$User()).login_id;;
		let managementData = await this.tm.getTN('o2c_leave_management').getData();
		if (managementData.mantees) {
			this.tm.getTN("o2c_emp_le_search").setProperty('employee_id', managementData.mantees);
			this.tm.getTN("o2c_emp_le_search").setProperty('valid_to_lv', new Date().getTime());

			await this.tm.getTN("o2c_emp_le_search").executeP();
			mantees_id = managementData.mantees
		} else {
			this.tm.getTN("o2c_emp_le_search").setProperty('employee_id', " ");
			this.tm.getTN("o2c_emp_le_search").setProperty('valid_to_lv', new Date().getTime());
			this.tm.getTN("o2c_emp_le_search").executeP();
			mantees_id = " "
		}
		//let manteesquota = await this.tm.getTN('o2c_emp_le_list').getData();//after on change issue solve then this will work
		if (mantees_id)
			manteesquota = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', { employee_id: mantees_id, loadAll: true })
		try {
			let calendar_id = await this.other_calendar_id.find(({ company_code, business_area }) => company_code == manteesquota[0].company_code && business_area == manteesquota[0].business_area)
			if (calendar_id) {
				let holidaylist = <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: calendar_id.office_calender });
				this.tm.getTN('holiday_list').setData(holidaylist)
			} else {
				this.tm.getTN('holiday_list').setData({})
			}
			this.setDateForCalendar(mantees_id)
			// this.tm.getTN('o2c_pie_chart').setData([{ "leave": manteesquota[0].used_leave, "type": "Approved" }, { "leave": manteesquota[0].extended, "type": "Extended" }, { "leave": manteesquota[0].unused_leave, "type": "Remaining" }]);
			// this.onChartRender();
			let approver = this.employee_id_name.find(({ employee_id }) => employee_id.toLocaleLowerCase() == manteesquota[0].lmi.toLocaleLowerCase());
			if (approver)
				managementData.approval_name = approver.full_name;
			else
				managementData.approval_name = this.approverName(manteesquota[0].lmi)

			this.tm.getTN('o2c_emp_le_list').setActive(0)
			managementData.start_date = managementData.end_date = managementData.request_reason = "";
			managementData.half_day_enddate = managementData.half_day_startdate = false;
			managementData.startDtate_error = managementData.endDate_error = managementData.request_error = "None"
			approver = null
		} catch (e) { console.log(e) }
		oBusyDailog.close()
		manteesquota = null
	}
	// SETTING LEAVE AND HOLIDAY IN CALENDER UI
	public async setDateForCalendar(id) {
		let setLeaveDates = [];
		let sflag = 0, eflag = 0, sDate, eDate, hsDate, heDate, leave_status, dates;
		let leaveData = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', { 'employee_id': id, loadAll: true })
		let holidays = this.tm.getTN('holiday_list').getData();
		for (let emp_le of holidays) {
			let dates = { "startDate": new Date(emp_le.holiday_date), "endDate": new Date(emp_le.holiday_date), "color": "#9e050a" }
			setLeaveDates.push(dates)
		}
		for (let leaves of leaveData) {
			sflag = 0; eflag = 0; sDate = leaves.start_date; eDate = leaves.end_date; hsDate = leaves.half_day_startdate; heDate = leaves.half_day_enddate; leave_status = leaves.leave_status;
			for (let i = sDate; i <= eDate; i.setDate(i.getDate() + 1)) {
				if (i.getDay() !== 6 && i.getDay() !== 0) {
					if (leave_status == "Applied") {
						dates = { "startDate": new Date(i), "endDate": new Date(i), "color": "#0407cc" }
						setLeaveDates.push(dates)
					} else if (leave_status == "Cancelled" || leave_status == "Rejected") { }
					else {
						if ((hsDate && sflag == 0) || (heDate && eflag == 0)) {
							if (hsDate && sflag == 0) {
								sflag = 1;
								setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#0af034" })
							} else if (heDate && eflag == 0) {
								i.setHours(0, 0, 0, 1);  // Start just after midnight
								eDate.setHours(0, 0, 0, 1);
								if (i.getTime() === eDate.getTime()) {
									eflag = 1;
									setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#0af034" })
								} else {
									setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613" })
								}
							} else {
								setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613" })
							}

						} else {
							setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613" })
						}
					}
				}
			}
		}
		await this.tm.getTN('o2c_calendar').setData(setLeaveDates);
	}
	// FILTRING MANTEES LEAVE HISTORY 
	public async onmanteeshistory() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		this.tm.getTN('o2c_mantees_leave_list').applyfilterP('employee_id', await this.tm.getTN('o2c_mantees_history').getData().mantees);
		oBusyDailog.close()
	}
	// DOWNLOAD ATTECHMENT 
	public async onDownloadAttech(oEvent, param) {
		let path = this.getPathFromEvent(oEvent);
		this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
		console.log(path)
		//await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();
		let docdownload = await this.tm.getTN(param.trans_node).getActiveData()//.getProperty('r_manag_attch');
		await docdownload.attachment_url.downloadAttachP();
	}
	// FINDING APPROVER NAME
	public async approverName(id) {
		let approver = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': id, partialSelect: ['first_name', 'last_name','full_name'], loadAll: true })
		if (approver.length > 0 && id) { return approver[0].full_name };
		return "___"
	}
	// REMOVING DETAIL FROM THE CHART
	public onChartRender() {
		// setTimeout(() => {
		// 	this.getActiveControlById('piechart', 'section01', 'p_o2c_emp_leave_quot')._chart.legend.valueLabels.template.disabled = true
		// 	this.getActiveControlById('piechart', 'section01', 'p_o2c_emp_leave_quot')._chart.legend.labels.template.disabled = true
		// 	this.getActiveControlById('piechart', 'section01', 'p_o2c_emp_leave_quot')._chart.legend.markers.template.disabled = true
		// }, 10)
	}
	// CURRENT LEAVE DATA
	public async currentLeaveData(lvid) {
		let lv_data = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', { leave_id: lvid, skipMap: true, loadAll: true })
		return lv_data[0];


	}

	public async choose_holiday() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		let data = await this.tm.getTN('comp_oth_dropdown').getData().office_cal;
		if (data) {
			this.tm.getTN('o2c_office_holiday').setData(await this.onOtherCalenderPress(data));
		}

		oBusyDailog.close()
	}
	public async onOtherCalenderPress(office_cal) {
		return <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: office_cal, s_date: new Date(new Date().getFullYear(), 0, 1).setHours(0, 0, 0, 0), e_date: new Date(new Date().getFullYear(), 11, 31).setHours(0, 0, 0, 0) });
	}
	public async onUpdatedLeaveQuota(leavecategory, employeeid, quotaId) {
		//let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', { 'category_id': leavecategory, 'employee_id': employeeid, skipMap: true,loadAll: true})
		//let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime(), skipMap: true });

		if (quotaId != "" && quotaId != undefined && quotaId != null) {

			let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'quota_id': quotaId, skipMap: true });

			return leaveData;
		} else {
			sap.m.MessageToast.show("Quota Id Not Maintained.", {
				duration: 5000,
				my: 'BeginTop'
			})
		}

		return []


	}
	public holidayColor(value, oEvent) {
		if (value < new Date())
			oEvent.getParent().addStyleClass("holidaycss");
		return value;
	}

	public async tsch() {
		//checking ........]
		//bjshcvihoijhoij 

	}
	public async mantees_dropdown(oEvent) {
		let x = oEvent.mParameters.value
		await this.tm.getTN("mantee_drop_list").applyfilterP('full_name', x);
		await this.tm.getTN("mantee_drop_list").refresh();

	}

	// Current panding leave status while approving...

	public async leave_pnding_status(employee_id) {
		let x = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_o2c_emp_leave_quota', { loadAll: true, employee_id: employee_id, valid_to_lv: new Date().getTime() })
		this.tm.getTN('leave_app_rej_tbl').setData(x);
	}
	public async leave_status_detail(employee_id) {
		let leaveQuota = Array.from(<KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_o2c_emp_leave_quota', { loadAll: true, employee_id: employee_id, valid_to_lv: new Date().getTime() }));
		let index = leaveQuota.indexOf(leaveQuota.find(({ leave_types }) => leave_types.toString() == "Casual" || leave_types.toString() == "Trainee_c" || leave_types.toString() == "Probation_c"))

		//swap
		let temp = leaveQuota[0];
		leaveQuota[0] = leaveQuota[index];
		leaveQuota[index] = temp
		// [leaveQuota[0], leaveQuota[index]] = [leaveQuota[index], leaveQuota[0]];


		// const totalCasualLeave = (parseFloat(leaveQuota[0].assign_quota) + parseFloat(leaveQuota[0].earned_leave) + parseFloat(leaveQuota[0].allegiant_leave)).toFixed(2);
		// const casual_remaining_leave = (parseFloat(leaveQuota[0].rem_carry_forward) > 0 ? totalCasualLeave : leaveQuota[0].unused_leave);
		// const approved_leaves = (parseFloat(leaveQuota[0].used_leave) - parseFloat(leaveQuota[0].used_carry_forward)).toFixed(2)
		// const casual_approved_leave = (parseFloat(leaveQuota[0].rem_carry_forward) > 0 ? "0.00" : approved_leaves);

		const totalCasualLeave = (parseFloat(leaveQuota[0].assign_quota) + parseFloat(leaveQuota[0].earned_leave) + parseFloat(leaveQuota[0].allegiant_leave)).toFixed(2);
		const casual_remaining_leave = leaveQuota[0].unused_leave;
		//const approved_leaves = parseFloat(leaveQuota[0].used_leave)
		const casual_approved_leave = leaveQuota[0].used_leave;
		//m

		const casualLeave = {
			leave_types: "Total Casual",
			assign_quota: totalCasualLeave,
			unused_leave: casual_remaining_leave,
			used_leave: casual_approved_leave,
			valid_to: new Date(new Date().getFullYear(), 11, 31)
		};

		const carryForwardLeave = {
			leave_types: "Carry Forward",
			assign_quota: leaveQuota[0].carry_forward,
			unused_leave: leaveQuota[0].rem_carry_forward,
			used_leave: leaveQuota[0].used_carry_forward,
			valid_to: new Date(new Date().getFullYear(), 2, 31)
		};

		leaveQuota.shift()
		const leaveStatus = [casualLeave, carryForwardLeave, ...leaveQuota];
		await this.tm.getTN('leave_quota_detail').setData(leaveStatus);
	}


	public async attechmentList(oEvent, param) {
		await this.openDialog(param.dialog_pa);
		// let q = await this.transaction.getExecutedQuery("d_o2c_leave_manage_attch",{leave_id:"LEAVE22460"})
		// console.log(q);
	}
	public async getImgPath(path) {
		let attachment = await path.getAttachmentP();
		return attachment;
	}


	// LEAVE CALENDAR

	public async onLeaveCalendar(profit_center) {
		let vi = true;
		let size;
		let current_date = new Date();
		current_date.setHours(0, 0, 0, 0);
		let tempsize = 0;
		let tempArray = [];
		tempArray[0] = this.userid;
		// tempArray[0] = manager_line;
		let mp = new Map();
		// for(let profitCenter of profit_center){
		// 	if( new Date(profitCenter.active_from).getTime() <= current_date.getTime() && new Date(profitCenter.active_till).getTime() >= current_date.getTime())
		// 	tempArray.push(profitCenter.profit_centre)
		// }

		// let managerList = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { profit_centre: tempArray, partialSelect: ['employee_id', 'profit_centre'], loadAll: true  })

		// for (let employee of managerList) {
		// 			size = mp.set(employee.employee_id, employee.employee_id)
		// 			if (size.size > tempsize) {
		// 				this.employeeArray.push(employee.employee_id);

		// 			}
		// 			tempsize = size.size;
		// 		}
		let flag = true;
		//
		while (vi) {
			let managerList = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_line_manager_h_list', { line_manager: tempArray, loadAll: true })
			tempArray = [];
			for (let employee of managerList) {
				size = mp.set(employee.employee_id, employee.employee_id)
				if (size.size > tempsize) {
					this.employeeArray.push(employee.employee_id);
					tempArray.push(employee.employee_id);
				}
				tempsize = size.size;
			}
			// if (flag) {
			// 	tempArray = [];
			// 	tempArray[0] = this.userid;
			// 	flag = false;
			// }
			if (managerList.length == 0) {
				vi = false;
			}
		}
		// employeeArray.push(managerList)
		// console.log(this.employeeArray)
		// q_line_manager_h_list
		//  console.log(this.employeeArray)
	}

	//




	// LEAVE TASK ASSIGN // Nasims code
	public async leave_task_assign(entity) {
		let empOrg = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: entity.employee_id, is_primary: true, loadAll: true });
		let other_calendar_id = <KloEntitySet<d_o2c_business_area>>await this.transaction.getExecutedQuery('d_o2c_business_area', { company_code: empOrg[0].company_code, partialSelect: ['office_calender', 'name', 'company_code', 'business_area'], loadAll: true })
		let calendar_id = other_calendar_id.find(({ company_code, business_area }) => company_code == empOrg[0].company_code && business_area == empOrg[0].business_area)
		let holidaylist = <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: calendar_id.office_calender });
		let lv_start_date = entity.start_date;
		let firstDay = entity.start_date;
		let lv_end_date = entity.end_date;
		let lastDay = entity.end_date;
		let isFirstHalf = entity.half_day_startdate;
		let isSecondHalf = entity.half_day_enddate;

		while (lv_start_date <= new Date(lv_end_date)) {
			console.log(lv_start_date.toISOString().split('T')[0]); // Print the current date in YYYY-MM-DD format


			let newdate = new Date(lv_start_date.getFullYear(), lv_start_date.getMonth(), 1);
			let lastDate = new Date(lv_start_date.getFullYear(), lv_start_date.getMonth() + 1, 0);
			let weekendsMap = await this.getWeekendsOfMonth(lv_start_date.getMonth(), lv_start_date.getFullYear());
			let assign_task_data = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('d_o2c_task_assignment', { 'employee_id': entity.employee_id, 'task_type': "Leave", 'task_start_date': newdate, loadAll: true });

			if (assign_task_data.length) {
				let tempDate = new Date(newdate);
				let timesheet_timebooking = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', { 'task_id': assign_task_data[0].task_id, loadAll: true });
				let timebooking_map = new Map();

				for (let i = 0; i < timesheet_timebooking.length; i++) {
					timebooking_map.set(new Date(timesheet_timebooking[i].booking_date).toISOString(), i);
				}

				while (tempDate <= lv_end_date && tempDate <= lastDate) {
					if (!weekendsMap.has(tempDate.toISOString()) && tempDate <= lv_end_date && tempDate >= lv_start_date && !this.isHoliday(tempDate, holidaylist)) {
						let hoursWorked = 0;
						if ((tempDate.toISOString() === firstDay.toISOString() && isFirstHalf) || (tempDate.toISOString() === lastDay.toISOString() && isSecondHalf)) {
							hoursWorked = 4;
						} else {
							hoursWorked = 8;
						}

						if (timebooking_map.has(tempDate.toISOString())) {
							timesheet_timebooking[timebooking_map.get(tempDate.toISOString())].hours_worked = hoursWorked;
						} else {
							await this.transaction.createEntityP('d_o2c_timesheet_time_booking', {
								"task_id": assign_task_data[0].task_id,
								"booking_date": tempDate,
								"hours_worked": hoursWorked
							});
						}


					}
					tempDate.setDate(tempDate.getDate() + 1);
				}
			} else {
				let task_assignment = await this.transaction.createEntityP('d_o2c_task_assignment', {
					task_type: 'Leave',
					employee_id: entity.employee_id,
					employee_name: entity.applied_by_employee,
					assigned_on: new Date(),
					assigned_by: this.userid,
					project_name: 'Leave',
					project_id: 'leave',
					task_start_date: newdate,
					task_end_date: lastDate,
					task_name: 'Leave Task'
				});

				let tempDate = new Date(newdate)

				while (tempDate <= lv_end_date && tempDate <= lastDate) {
					if (!weekendsMap.has(tempDate.toISOString()) && tempDate <= lv_end_date && tempDate >= lv_start_date && !this.isHoliday(tempDate,holidaylist)) {

						let hoursWorked = 0;
						if ((tempDate.toISOString() === firstDay.toISOString() && isFirstHalf) || (tempDate.toISOString() === lastDay.toISOString() && isSecondHalf)) {
							hoursWorked = 4;
						} else {
							hoursWorked = 8;
						}

						await this.transaction.createEntityP('d_o2c_timesheet_time_booking', {
							"task_id": task_assignment.task_id,
							"booking_date": tempDate,
							"hours_worked": hoursWorked
						});
					}
					tempDate.setDate(tempDate.getDate() + 1);
				}


			}
			// Increment the month
			lv_start_date.setMonth(lv_start_date.getMonth() + 1);

			// adjust it back to the correct day. This handles edge cases like incrementing from Jan 31 to Feb 28/29.
			// if (lv_start_date.getMonth() !== new Date(lv_start_date).getMonth()) {
			lv_start_date.setDate(1);
			// }
		}
		// await this.tm.commitP("Saved Successfully", "Save Failed", true, true);

	}

	//Checking if the date is a holiday
	public isHoliday(checkDate: Date, holidaylist: KloEntitySet<d_o2c_holiday_calendar>): boolean {
		return holidaylist.some(holiday => {
			const holidayDate = new Date(holiday.holiday_date);
	
			return (
				checkDate.getFullYear() === holidayDate.getFullYear() &&
				checkDate.getMonth() === holidayDate.getMonth() &&
				checkDate.getDate() === holidayDate.getDate()
			);
		});
	}
	
	public async getWeekendsOfMonth(month, year) {
		// Adjust month to be zero-indexed for the JavaScript Date object
		let date = new Date(year, month, 1);
		let weekends = new Map();

		// Iterate through all days of the month
		while (date.getMonth() === month) {
			let day = date.getDay();
			if (day === 0 || day === 6) { // Sunday = 0, Saturday = 6

				weekends.set(new Date(date).toISOString(), true);
			}
			date.setDate(date.getDate() + 1); // Move to the next day
		}

		return weekends;
	}

	public async task_cancel(entity) {

		let lv_start_date = entity.start_date;
		let lv_end_date = entity.end_date;

		while (lv_start_date <= new Date(lv_end_date)) {

			let newdate = new Date(lv_start_date.getFullYear(), lv_start_date.getMonth(), 1);
			let lastDate = new Date(lv_start_date.getFullYear(), lv_start_date.getMonth() + 1, 0);
			// let weekendsMap = await this.getWeekendsOfMonth(lv_start_date.getMonth(), lv_start_date.getFullYear());
			let assign_task_data = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('d_o2c_task_assignment', { 'employee_id': entity.employee_id, 'task_type': "Leave", 'task_start_date': newdate, loadAll: true });
			if (assign_task_data.length) {
				let timesheet_timebooking = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', { 'task_id': assign_task_data[0].task_id, loadAll: true });
				let tempDate = new Date(newdate);
				let timebooking_map = new Map();

				for (let i = 0; i < timesheet_timebooking.length; i++) {
					timebooking_map.set(new Date(timesheet_timebooking[i].booking_date).toISOString(), i);
				}
				// (!weekendsMap.has(tempDate.toISOString())
				while (tempDate <= lv_end_date && tempDate <= lastDate) {
					if (timebooking_map.has(tempDate.toISOString()) && tempDate <= lv_end_date && tempDate >= lv_start_date) {
						let hoursWorked = 0;
						timesheet_timebooking[timebooking_map.get(tempDate.toISOString())].hours_worked = hoursWorked;
					}
					tempDate.setDate(tempDate.getDate() + 1);
				}
			}


			lv_start_date.setMonth(lv_start_date.getMonth() + 1);
			lv_start_date.setDate(1);
		}
		// await this.tm.commitP("Cancelled approved Leave", "Failed to Cancel", true, true);
	}

	// Downloading the Reporting Line Members Report
	public async onExcelDownload() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait. Downloading..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}
		let all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true });
		let report_data = await this.tm.getTN("reporting_line_member_list").getData();

		let jsonData = [];

		// Build the jsonData array using the fetched data
		for (let index = 0; index < report_data.length; index++) {
			const emp = all_emp.find((item) => item.employee_id.toLowerCase() == report_data[index].employee_id.toLowerCase())
			const lm = all_emp.find((item) => item.employee_id.toLowerCase() == report_data[index].lmi?.toLowerCase())

			jsonData.push({
				'Employee Id': report_data[index]?.employee_id,
				'Employee Name': emp?.full_name,
				'Leave Type': report_data[index]?.category_description,
				'No of Days': report_data[index]?.no_of_days,
				'Approved': report_data[index]?.used_leave,
				'Remaining': report_data[index]?.unused_leave,
				'Requested Leave': report_data[index]?.requested_leave,
				'Valid Till': report_data[index]?.valid_to,
				'Extended': report_data[index]?.extended,
				'Employee Mail': emp?.official_mail,
				'Line Manager': report_data[index]?.lmi,
				'Line Manager Name': lm?.full_name
			});
		}

		const worksheet = XLSX.utils.json_to_sheet(jsonData);
		const workbook = XLSX.utils.book_new();

		// Set column widths
		worksheet['!cols'] = [
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 30 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 }
		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = {
				fill: {
					fgColor: { rgb: "FFFF00" }
				}
			};
		});

		XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

		// Write workbook to a file
		const filePath = 'reporting line team members_data.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();

	}

	// leave cancelation carry quota
	public async leave_reject_quota(leavedata, leave_management_data) {
		let current_date = new Date();
		if (leavedata.valid_to.getTime() < current_date.getTime() && leavedata.leave_types == "Casual") {


			let newYearQuota = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_quota_adjust', { loadAll: true, 'category_id': leavedata.category_id, 'employee_id': leavedata.employee_id, 'vailld_from': new Date(new Date().getFullYear(), 0, 1).getTime(), 'vallid_to': new Date(new Date().getFullYear(), 11, 31).getTime(), skipMap: true });
			let newYearQuotarefrence = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_quota_adjust', { loadAll: true, 'category_id': leavedata.category_id, 'employee_id': leavedata.employee_id, 'vailld_from': new Date(new Date().getFullYear(), 0, 1).getTime(), 'vallid_to': new Date(new Date().getFullYear(), 11, 31).getTime() });

			if (newYearQuota.length == 1) {

				newYearQuotarefrence[0].carry_forward = parseFloat(newYearQuota[0].carry_forward) + parseFloat(leave_management_data.no_of_days)
				newYearQuotarefrence[0].rem_carry_forward = parseFloat(newYearQuota[0].rem_carry_forward) + parseFloat(leave_management_data.no_of_days)
				//
				if (parseFloat(newYearQuotarefrence[0].carry_forward) > parseFloat(leavedata.unused_leave) && leave_management_data.leave_status == "Applied") {
					newYearQuotarefrence[0].carry_forward = parseFloat(leavedata.unused_leave)
					newYearQuotarefrence[0].rem_carry_forward = parseFloat(leavedata.unused_leave)
				}

			}


		}



	}


	public async quotaChange() {
		let quotachangeid = await this.tm.getTN('o2c_leave_management').getData()
		let listtrans = await this.tm.getTN('o2c_emp_le_list').getData()
		for (let i = 0; i < listtrans.length; i++) {
			if (listtrans[i].quota_id == quotachangeid.quota_id) {
				await this.tm.getTN('o2c_emp_le_list').setActive(i)
			}
		}
	}

	public async retrySave(sSuccessMessage: string, sErrMessage: string) {
        // Retry logic for commit operation
        let retryCount = 0;
        const maxRetries = 5;
        let commitSuccess = false;

        while (retryCount < maxRetries && !commitSuccess) {
            try {
                await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
                commitSuccess = true;
            } catch (error) {
                retryCount++;
                console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

                if (retryCount >= maxRetries) {
                    sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
                    throw error;
                }
                // Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            }
        }
    }
}

