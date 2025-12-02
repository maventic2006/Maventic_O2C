import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_leave_assignment_config } from 'o2c_v2/entity_gen/d_leave_assignment_config';
import { d_o2c_emp_leave_quota } from 'o2c_v2/entity_gen/d_o2c_emp_leave_quota';
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';
import { d_o2c_leave_management } from 'o2c_v2/entity_gen/d_o2c_leave_management';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_leave_manage")
export default class p_leave_manage extends KloController {
	public userid;
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter(oEvent) {
		this.userid = (await this.transaction.get$User()).login_id;
		const semDrop = new Map();
		semDrop.set(1, 'sem 1'); semDrop.set(2, 'sem 2'); semDrop.set(3, 'sem 3'); semDrop.set(4, 'sem 4');
		semDrop.set(5, 'sem 5'); semDrop.set(6, 'sem 6'); semDrop.set(7, 'sem 7'); semDrop.set(8, 'sem 8');
		let semData = Array.from(semDrop, ([id, name]) => ({ id, name }));
		try {

			this.tm.getTN('sem_drop_down').setData(semData);
			this.tm.getTN('exam_leave_assign').setData({});
			this.tm.getTN('maternity_leave_assign').setData({});
			this.tm.getTN('paternity_leave_assign').setData({});

		} catch (e) {

		}
	}
	public async navgate(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		await this.navTo(({ SS: 'pa_details' }), oEvent);
	}
	public async onExamLeaveAssign() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.setText("Assigining")
		oBusyDailog.open()
		let exam_leave = this.tm.getTN('exam_leave_assign').getData()
		let data = this.tm.getTN('employee_lists').getActiveData();
		let assign_data = <KloEntitySet<d_leave_assignment_config>>await this.transaction.getExecutedQuery('d_leave_assignment_config', { 'employee_id': data.employee_id, 'leave_type': 'Exam', skipMap: true, loadAll: true });
		let already_assign_leave = assign_data.find(({ exam_sem }) => parseFloat(exam_sem) == parseFloat(exam_leave.sem))

		if (already_assign_leave == undefined) {
			let org_data = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': data.employee_id, 'is_primary': true, loadAll: true });
			let leave_quota = await this.transaction.getExecutedQuery('d_o2c_leave_category', { 'company_code': org_data[0].company_code, 'business_area': org_data[0].business_area, 'leave_types': "Exam", loadAll: true });
			await this.transaction.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: new Date(exam_leave.end_date), valid_from: new Date(exam_leave.start_date), used_leave: 0, unused_leave: leave_quota[0].quota, seq_id: data.employee_id, no_of_days: leave_quota[0].quota, lmi: data.line_manager, employee_id: data.employee_id, company_code: org_data[0].company_code, category_id: leave_quota[0].category_id, business_area: org_data[0].business_area, category_description: leave_quota[0].category_description, leave_types: leave_quota[0].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: leave_quota[0].quota });
			await this.transaction.createEntityP('d_leave_assignment_config', { s_object_type: -1, valid_to: new Date(exam_leave.end_date), valid_from: new Date(exam_leave.start_date), employee_id: data.employee_id, exam_sem: exam_leave.sem, category_id: leave_quota[0].category_id, leave_type: leave_quota[0].leave_types, leave_frequency: assign_data.length });
			await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
		} else {
			sap.m.MessageToast.show("leave already assign for this semester", { duration: 2000 });

		}

		oBusyDailog.close()

	}

	public async onmaternityAssign() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		let maternity_leave = this.tm.getTN('maternity_leave_assign').getData();
		let data = this.tm.getTN('employee_lists').getActiveData();
		let assign_data = <KloEntitySet<d_leave_assignment_config>>await this.transaction.getExecutedQuery('d_leave_assignment_config', { 'employee_id': data.employee_id, 'leave_type': 'Maternity', skipMap: true, loadAll: true });
		let start_date = new Date(maternity_leave.start_date)
		start_date.setMonth(start_date.getMonth() + 8)
		let end_date = new Date(start_date)
		await this.tm.getTN('maternity_leave_assign').setProperty('end_date', end_date)
		if (assign_data.length < 2) {
			let org_data = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': data.employee_id, 'is_primary': true, loadAll: true });
			let leave_quota = await this.transaction.getExecutedQuery('d_o2c_leave_category', { 'company_code': org_data[0].company_code, 'business_area': org_data[0].business_area, 'leave_types': 'Maternity', loadAll: true });
			await this.transaction.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: end_date, valid_from: new Date(maternity_leave.start_date), used_leave: 0, unused_leave: leave_quota[0].quota, seq_id: data.employee_id, no_of_days: leave_quota[0].quota, lmi: data.line_manager, employee_id: data.employee_id, company_code: org_data[0].company_code, category_id: leave_quota[0].category_id, business_area: org_data[0].business_area, category_description: leave_quota[0].category_description, leave_types: leave_quota[0].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: leave_quota[0].quota });
			await this.transaction.createEntityP('d_leave_assignment_config', { s_object_type: -1, valid_to: end_date, valid_from: new Date(maternity_leave.start_date), employee_id: data.employee_id, category_id: leave_quota[0].category_id, leave_type: leave_quota[0].leave_types, leave_frequency: assign_data.length });
			await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
		} else {
			sap.m.MessageToast.show("you are not allowed to take maternity leave quota", { duration: 2000 });
		}
		oBusyDailog.close()
	}

	public async onPaternityAssign() {

		let oBusyDailog = new sap.m.BusyDialog().open();
		let maternity_leave = this.tm.getTN('paternity_leave_assign').getData();
		let data = this.tm.getTN('employee_lists').getActiveData();
		let assign_data = <KloEntitySet<d_leave_assignment_config>>await this.transaction.getExecutedQuery('d_leave_assignment_config', { 'employee_id': data.employee_id, 'leave_type': 'Paternity', skipMap: true });
		let start_date = new Date(maternity_leave.start_date)
		start_date.setMonth(start_date.getMonth() + 3) // according to condition
		let end_date = new Date(start_date)
		await this.tm.getTN('paternity_leave_assign').setProperty('end_date', end_date)
		if (assign_data.length < 2) {
			let org_data = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': data.employee_id, 'is_primary': true, loadAll: true });
			let leave_quota = await this.transaction.getExecutedQuery('d_o2c_leave_category', { 'company_code': org_data[0].company_code, 'business_area': org_data[0].business_area, 'leave_types': 'Paternity', loadAll: true });
			await this.transaction.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: end_date, valid_from: new Date(maternity_leave.start_date), used_leave: 0, unused_leave: leave_quota[0].quota, seq_id: data.employee_id, no_of_days: leave_quota[0].quota, lmi: data.line_manager, employee_id: data.employee_id, company_code: org_data[0].company_code, category_id: leave_quota[0].category_id, business_area: org_data[0].business_area, category_description: leave_quota[0].category_description, leave_types: leave_quota[0].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: leave_quota[0].quota });
			await this.transaction.createEntityP('d_leave_assignment_config', { s_object_type: -1, valid_to: end_date, valid_from: new Date(maternity_leave.start_date), employee_id: data.employee_id, category_id: leave_quota[0].category_id, leave_type: leave_quota[0].leave_types, leave_frequency: assign_data.length });
			await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
		} else {
			sap.m.MessageToast.show("you are not allowed to take Paternity leave quota", { duration: 2000 });
		}

		oBusyDailog.close()
	}

	public async getImgPath(oEvent) {
		let attachment = await oEvent.getAttachmentP();
		return attachment;
	}


	/* 	<-----------------   LEAVE ASSIGNMENT CLOSE HERE    -----------------> */

	/* APPROVED LEAVE CANCEL BY ADMIN */

	/* 	<-----------------   LEAVE CANCELLATION START HERE    -----------------> */


	/* OPEN DAILOGBOX */
	public async onLeaveClick(oEvent: sap.ui.base.Event, param) {
		let path = this.getPathFromEvent(oEvent);
		await this.transaction.rollback();
		this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
		await this.openDialog(param.dialog_pa);

	}

	/* REFRENCE DATA */
	public async onRefrenceLeaveQuota(leavecategory, employeeid, quotaId) {
		//let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime() });
		if (quotaId != "" && quotaId != undefined && quotaId != null) {


			let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'quota_id': quotaId });

			return leaveData1;
		}else{
			sap.m.MessageToast.show("Quota Id Not Maintained.", { 
				duration: 5000,
				my : 'BeginTop'
			})
		}
		return []
	}

	/* UPDATED QUOTA DATA */
	public async onUpdatedLeaveQuota(leavecategory, employeeid, quotaId) {
		//let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime(), skipMap: true });

		if (quotaId != "" && quotaId != undefined && quotaId != null) {
			let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'quota_id': quotaId, skipMap: true });

			return leaveData;
		}else{
			sap.m.MessageToast.show("Quota Id Not Maintained.", { 
				duration: 5000,
				my : 'BeginTop'
			})
		}
		return []

	}
	/* CURRENT OPENED UPDATED LEAVE DATA */
	public async currentLeaveData(lvid) {
		let lv_data = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', { leave_id: lvid, skipMap: true, loadAll: true })
		return lv_data[0];
	}


	public async onLeaveCancelSubmit(oEvent: sap.ui.base.Event, param) {
		let oBusyDailog = new sap.m.BusyDialog().setText("cancelling...").open();
		this.closeDialog(param.dialog_pa);// fetching transnode data from ui

		const managementData = this.tm.getTN(param.trans_node).getData();// Getting data from 
		let leavedata = await this.onUpdatedLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
		let leavedata1 = await this.onRefrenceLeaveQuota(managementData.leave_catagory, managementData.employee_id, managementData.quota_id)
		let entity = await this.currentLeaveData(managementData.leave_id);

		if (entity.leave_status == "Approved" && leavedata.length) {
			this.cancel_Approved_leave(entity, managementData, leavedata, leavedata1)

		} else if (entity.leave_status == "Applied" && leavedata.length) {
			leavedata1[0].requested_leave = 0.1;
			leavedata1[0].requested_leave = parseFloat(leavedata[0].requested_leave) - parseFloat(managementData.no_of_days);
			leavedata1[0].rem_carry_forward = parseFloat(leavedata[0].rem_carry_forward) + parseFloat(entity.carry_forward_leave);

			managementData.leave_status = "Cancelled";

			await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By Admin", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "Admin" }, true)


			await this.leave_reject_quota(leavedata[0], managementData)
			await this.tm.commitP("Cancelled", "Failed to Cancel", true, true);
			sap.m.MessageBox.success("You Have Successfully Cancelled Applied Leave ", {
				title: "Alert",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})
		}
		else {
			managementData.leave_status = entity.leave_status;
			sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
			await this.transaction.rollback();
		}
		oBusyDailog.close()

	}

	/* APPROVED LEAVE CANCEL CALCULATION START */

	public async cancel_Approved_leave(entity, managementData, leavedata, leavedata1) {
		if (true) {
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
			managementData.leave_status = "Cancelled";

			//REMARK
			// Nasim's code
			await this.task_cancel(entity);
			// Nasim's code

			await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: managementData.leave_id, approver_remark: "Cancelled By Admin", approval_status: "Cancelled", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "Admin" }, true)
			await this.leave_reject_quota(leavedata[0], managementData)
			await this.tm.commitP("Saved ", "Save Failed", true, true);
			sap.m.MessageBox.success("You Have Successfully Cancelled Approved Leave ", {
				title: "Alert",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})
		}
	}


	/* 	<-----------------   LEAVE ASSIGNMENT CLOSE HERE    -----------------> */

	/* LEAVE APPROVAL BY ADMIN */

	/* 	<-----------------   LEAVE CANCELLATION START HERE    -----------------> */


	public async onleaveApproveSubmit(oEvent: sap.ui.base.Event, param) {


		let leave_data = this.tm.getTN('leave_history_detail').getData();
		let entity = await this.currentLeaveData(leave_data.leave_id);//updated data

		let leaveData = await this.onUpdatedLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);
		let leaveData1 = await this.onRefrenceLeaveQuota(entity.leave_catagory, entity.employee_id, entity.quota_id);
		let oBusyDailog = new sap.m.BusyDialog().open();

		if (leaveData.length) {

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
					await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approver_remark: "Approved By Admin", approval_status: "Approved", approval_sequence: "1", action_required_by: this.userid, approved_on: new Date(), approver: "Admin" }, true)
					leave_data.leave_status = "Approved"
					// nasim's code
					await this.leave_task_assign(entity);
					// nasim's code  
					this.tm.commitP("Approved", "Failed to Approved", true, true);
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


			this.closeDialog(param.dialog_pa)
			setTimeout(async () => { oBusyDailog.close() }, 500)

			sap.m.MessageBox.success("You Have Successfully Approved Applied Leave ", {
				title: "Alert",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})


		}else{
			sap.m.MessageToast.show("Quota Id Not Maintained.", { 
				duration: 5000,
				my : 'BeginTop'
			})
		}
		oBusyDailog.close()
	}

	// LEAVE TASK ASSIGN // Nasims code
	public async leave_task_assign(entity) {

		let lv_start_date = entity.start_date;
		let firstDay = entity.start_date;
		let lv_end_date = entity.end_date;
		let lastDay = entity.end_date;
		let isFirstHalf = entity.half_day_enddate;
		let isSecondHalf = entity.half_day_startdate;

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
					if (!weekendsMap.has(tempDate.toISOString()) && tempDate <= lv_end_date && tempDate >= lv_start_date) {
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
				let empDetails = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': entity.employee_id, loadAll: true });
				let task_assignment = await this.transaction.createEntityP('d_o2c_task_assignment', {
					task_type: 'Leave',
					employee_id: entity.employee_id,
					employee_name: entity.applied_by_employee,
					assigned_on: new Date(),
					assigned_by: empDetails[0].line_manager,
					project_name: 'Leave',
					project_id: 'leave',
					task_start_date: newdate,
					task_end_date: lastDate,
					task_name: 'Leave Task'
				});

				let tempDate = new Date(newdate)

				while (tempDate <= lv_end_date && tempDate <= lastDate) {
					if (!weekendsMap.has(tempDate.toISOString()) && tempDate <= lv_end_date && tempDate >= lv_start_date) {

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

	// leave cancelation carry quota
	public async leave_reject_quota(leavedata, leave_management_data) {
		let current_date = new Date();
		if (leavedata.valid_to.getTime() < current_date.getTime() && leavedata.leave_types == "Casual") {


			let newYearQuota = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_quota_adjust', { loadAll: true, 'category_id': leavedata.category_id, 'employee_id': leavedata.employee_id, 'vailld_from': new Date(new Date().getFullYear(), 0, 1).getTime(), 'vallid_to': new Date(new Date().getFullYear(), 11, 31).getTime(), skipMap: true });
			let newYearQuotarefrence = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_quota_adjust', { loadAll: true, 'category_id': leavedata.category_id, 'employee_id': leavedata.employee_id, 'vailld_from': new Date(new Date().getFullYear(), 0, 1).getTime(), 'vallid_to': new Date(new Date().getFullYear(), 11, 31).getTime() });

			if (newYearQuota.length == 1) {

				newYearQuotarefrence[0].carry_forward = parseFloat(newYearQuota[0].carry_forward) + parseFloat(leave_management_data.no_of_days)
				newYearQuotarefrence[0].rem_carry_forward = parseFloat(newYearQuota[0].rem_carry_forward) + parseFloat(leave_management_data.no_of_days)
				if (parseFloat(newYearQuotarefrence[0].carry_forward) > parseFloat(leavedata.unused_leave) && leave_management_data.leave_status == "Applied") {
					newYearQuotarefrence[0].carry_forward = parseFloat(leavedata.unused_leave)
					newYearQuotarefrence[0].rem_carry_forward = parseFloat(leavedata.unused_leave)
				}

			}
		}
	}
}