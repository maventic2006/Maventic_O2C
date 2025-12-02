import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_leave_management } from 'o2c_v2/entity/d_o2c_leave_management';
import { d_o2c_emp_leave_quota } from 'o2c_v2/entity_gen/d_o2c_emp_leave_quota';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_leave_report")
export default class p_o2c_leave_report extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public status;
	public employee_leave;
	public roleid;
	public login_id;
	public async onPageEnter() {
		//  this.tm.getTN("profit_srch").setProperty('profit_center','MPC1');
		//  await this.tm.getTN("profit_srch").executeP()
		await this.tm.getTN("date_search_store").setData({});
		await this.tm.getTN("ending_month_store").setData({});
		await this.tm.getTN("line_manager").setData({});
		await this.tm.getTN("emp_other").setData({});
		await this.tm.getTN("statuss").setData({});
		await this.tm.getTN("leave_type").setData({});
		await this.tm.getTN("grid_visible").setData({});
		this.roleid = (await this.transaction.get$Role()).role_id;
		this.login_id = (await this.transaction.get$User()).login_id;
		await this.tm.getTN("profit_list").setProperty('role_id', this.roleid);
		await this.tm.getTN("profit_list").executeP();
		if(this.roleid == "MANAGER"){
			await this.tm.getTN("line_manager").setData({ 'mngr': this.login_id.toUpperCase() });
		}
		// console.log(this.login_id);

		//add
		if (this.roleid == "TEAM_HEAD") {

			let profit_team_search = this.tm.getTN("profit_team_search");
			await profit_team_search.setProperty('employee_id', this.login_id);
			await profit_team_search.setProperty('active_till', new Date());
			await profit_team_search.executeP();
		}

		await this.tm.getTN("emp_role").setData({});
		let emp_designation = await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.login_id, fdate: new Date().getTime(), tdate: new Date().getTime() });
		if (emp_designation.length > 0) {
			let emp_designation_name = await this.transaction.getExecutedQuery('d_o2c_designation_master', { loadAll: true, 'designation_id': emp_designation[0].designation });
			let name = emp_designation_name[0].name.toUpperCase();
			this.roleid = name;
		}
		await this.tm.getTN("emp_role").setProperty('roler', this.roleid);



		await this.tm.getTN("team_head").setData({});
		let emp_profit_cntr = await this.transaction.getExecutedQuery('d_o2c_employee_org', { loadAll: true, 'employee_id': this.login_id, 'is_primary': true });
		if(emp_profit_cntr.length > 0){
			await this.tm.getTN("team_head").setData({ profit: emp_profit_cntr[0].profit_centre });
		}
		// await this.tm.getTN("team_head").setData({ profit: emp_profit_cntr[0].profit_centre });

		if (!window['XLSX']) {//
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}

		//setting the leave status vh in search
		let lv_status =[
			{lv_sttus: "Applied"}, {lv_sttus: "Approved"}, {lv_sttus: "Rejected"},  {lv_sttus: "Cancelled"}
		];
		await this.tm.getTN("leave_status").setData(lv_status);

		//setting the leave type vh in search
		let lv_type = [
			{lv_typ: "Sick"},{lv_typ: "Casual"},{lv_typ: "Paternity"},{lv_typ: "Exam"},{lv_typ: "Maternity"},{lv_typ: "Trainee_c"},{lv_typ: "Probation_c"}
		]
		await this.tm.getTN("type").setData(lv_type);
		
	}


	public async onChangeStatus(oEvent) {
		await this.tm.getTN("statuss").setData({ status_mnu: oEvent.getSource().getSelectedKey() });
	}

	public async onChangeLeaveType(oEvent) {
		await this.tm.getTN("leave_type").setData({ type: oEvent.getSource().getSelectedKey() });
	}

	public async lmChange(oEvent){
		await this.tm.getTN("line_manager").setData({mngr : oEvent.getSource().getSelectedKey()});
	}


	public async search() {
		let list;
		this.tm.getTN("grid_visible").setData({ visible: "true" });
		this.login_id = (await this.transaction.get$User()).login_id;
		let emp_profit_cntr = await this.transaction.getExecutedQuery('d_o2c_employee_org', { loadAll: true, 'employee_id': this.login_id, 'is_primary': true })
		let profit_center = await this.tm.getTN("team_head").getData().profit;
		let start = await this.tm.getTN("date_search_store").getData().date;
		let start_date = new Date(start);
		let end = await this.tm.getTN("ending_month_store").getData().end_date;
		let end_date = new Date(end);
		let leave_type = await this.tm.getTN("leave_type").getData().type;
		let line_manager = await this.tm.getTN("line_manager").getData().mngr;
		let employee_id = await this.tm.getTN("emp_other").getData().employee_id;
		let status = await this.tm.getTN("statuss").getData().status_mnu;
		// if (this.status == "" || this.status == undefined)
		// 	this.status = await this.tm.getTN("statuss").getData().status_mnu;
		// else {
		// 	status = this.status;
		// 	this.status == "";
		// }
		let company_code;
		/*await this.tm.getTN("data_search").setProperty('company_code',emp_profit_cntr[0].company_code);
		await this.tm.getTN("data_search").setProperty('profit_center',profit_center);
		await this.tm.getTN("data_search").setProperty('start_date',start_date);
		await this.tm.getTN("data_search").setProperty('end_date',end_date);
		await this.tm.getTN("data_search").setProperty('leave_type',leave_type);
		await this.tm.getTN("data_search").executeP()*/
		if (this.roleid == "ADMIN") {
			company_code = undefined;
		}
		else {
			company_code = emp_profit_cntr[0].company_code
		}
		if (leave_type == "All" || leave_type == "" || leave_type == undefined) {

			if (status == "All" || status == "" || status == undefined) {
				list = await this.transaction.getExecutedQuery('q_leave_report', { loadAll: true, 'company_code': company_code, 'profit_center': profit_center, 'start_date': start_date, 'end_date': end_date, line_mngr: line_manager, 'employee_id': employee_id })
			}
			else {
				list = await this.transaction.getExecutedQuery('q_leave_report', { loadAll: true, 'company_code': company_code, 'profit_center': profit_center, 'start_date': start_date, 'end_date': end_date, line_mngr: line_manager, 'status': status, 'employee_id': employee_id })
			}
		}
		else if (leave_type != "All" && leave_type != "") {
			if (status == "All" || status == "") {
				list = await this.transaction.getExecutedQuery('q_leave_report', { loadAll: true, 'company_code': company_code, 'profit_center': profit_center, 'start_date': start_date, 'end_date': end_date, 'leave_type': leave_type, line_mngr: line_manager, 'employee_id': employee_id })
			}
			else {
				list = await this.transaction.getExecutedQuery('q_leave_report', { loadAll: true, 'company_code': company_code, 'profit_center': profit_center, 'start_date': start_date, 'end_date': end_date, 'leave_type': leave_type, line_mngr: line_manager, 'status': status, 'employee_id': employee_id })
			}

		}
		//let list=await this.tm.getTN("emp_leave").getData();
		let arrayMap = new Map();
		let array_lmiMap = new Map();
		// let array = [];
		// let array_lmi = [];
		for (let i = 0; i < list.length; i++) {
			arrayMap.set(list[i].employee_id, list[i]);
			array_lmiMap.set(list[i].lmi, list[i]);
			// array[i] = list[i].employee_id;
			// array_lmi[i] = list[i].lmi;
		}
		let array = Array.from(arrayMap.keys());
		let array_lmi = Array.from(array_lmiMap.keys());
		let emp_lmi = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, employee_id: array_lmi });
		let emp_list = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, employee_id: array });
		let emp_leave_quota = await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', { loadAll: true, employee_id: array });
		// let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', {loadAll: true,'employee_id': array, 'valid_till': new Date().getTime(), skipMap: true });
		// console.table(leaveData)
		let i;
		let j;
		try {
			let leave_list = new Set();
			for (i = 0; i < list.length; i++) {
				let is_fresher = false
				let extend_leave;
				let is_active = false;
				let unused_leave;
				let half = "No";
				let lmi_name;
				let mail_id;
				let lmi_mail_id;
				for (let j = 0; j < emp_list.length; j++) {
					if (emp_list[j].employee_id.toUpperCase() == list[i].employee_id.toUpperCase()) {
						is_fresher = emp_list[j].is_fresher;
						is_active = emp_list[j].is_active;
						mail_id = emp_list[j].official_mail;
						break;
					}
				}
				for (let j = 0; j < emp_lmi.length; j++) {
					if (emp_lmi[j].employee_id.toUpperCase() == list[i].lmi.toUpperCase()) {
						lmi_name = emp_lmi[j].full_name;
						lmi_mail_id = emp_lmi[j].official_mail;
						break;
					}
				}
				for (j = 0; j < emp_leave_quota.length; j++) {
					let validtill = new Date(emp_leave_quota[j].valid_to)
					validtill.getDay() + 1;
					if ((emp_leave_quota[j].employee_id.toUpperCase() == list[i].employee_id.toUpperCase()) && emp_leave_quota[j].category_id == list[i].leave_catagory && list[i].s_created_on.getTime() <= validtill.getTime() && list[i].s_created_on.getTime() >= emp_leave_quota[j].valid_from.getTime()) {
						extend_leave = emp_leave_quota[j].extended;
						unused_leave = emp_leave_quota[j].unused_leave;
						break;
					}
					if (list[i].half_day_startdate || list[i].half_day_enddate)
						half = "Yes"
				}
				let employee_table = { leave_id: list[i].leave_id, employee_id: list[i].employee_id, is_fresher: is_fresher, applied_by_employee: list[i].applied_by_employee, request_date: list[i].request_date, start_date: list[i].start_date, end_date: list[i].end_date, request_reason: list[i].request_reason, leave_status: list[i].leave_status, no_of_days: list[i].no_of_days, leave_discription: list[i].leave_discription, extended: extend_leave, is_active: is_active, unused_leave: unused_leave, half: half, lmi: list[i].lmi, lmi_name: lmi_name, mail_id: mail_id, lmi_mail_id: lmi_mail_id }
				leave_list.add(employee_table);
				this.employee_leave = Array.from(leave_list)

			}
			if (list.length == 0) {
				this.employee_leave = "";

			}
		} catch (e) {
			console.log(i + " " + j);
		}
		await this.tm.getTN("is_trainee").setData(this.employee_leave);
		await this.tm.getTN("is_trainee").refresh()
		// await this.reset();
		/*let Array = [];
		for(let i=0;i<list.length;i++){
			Array[i] = list[i].employee_id;	
		}
		let emp_list = await this.transaction.getExecutedQuery('d_o2c_employee', {employee_id:Array});
		console.log(emp_list)
		for(let i=0;i<emp_list.length;i++){
		await this.tm.getTN("is_trainee").setData({is_fresher:emp_list[i].is_fresher})
		}*/
	}


	public async profit_change() {
		let profit = this.tm.getTN("team_head").getData().profit;
		await this.tm.getTN("line_manager_search").setProperty('profit_centre', profit)
		await this.tm.getTN("line_manager_search").executeP()
	}
	public download_excel_file() {
		let file_name = "TimesheetReport_".concat(".xlsx");
		console.log(file_name);
		var ws = XLSX.utils.json_to_sheet(this.employee_leave);
		var wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "TimeSheetReport");
		XLSX.writeFile(wb, file_name, { compression: true });
		//XLSX.writeFile(wb, "TimeSheetReport.xlsx", { compression: true }).
	}
	public async reset() {
		let selectStatus = await this.tm.getTN("statuss").getData();
		selectStatus.status_mnu = null;
		// await this.tm.getTN("leave_status").refresh();
		let selectType = await this.tm.getTN("leave_type").getData();
		selectType.type = null;
		// await this.tm.getTN("leave_type").refresh();
		await this.tm.getTN("ending_month_store").setData({})
		await this.tm.getTN("date_search_store").setData({})
		
	}
	public async onApprove(oEvent) { // Function of Corfirmation for Cancelling Changes in Detail
		let sPath: string = this.getPathFromEvent(oEvent);
		sap.m.MessageBox.confirm("Are You Sure You want to Approve", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onConfirmApprove(sPath);
				}
			}
		})
	}
	public async onLeaveReject(oEvent: sap.ui.base.Event) { // Function of Corfirmation for Cancelling Changes in Detail
		let sPath: string = this.getPathFromEvent(oEvent);
		sap.m.MessageBox.confirm("Are You Sure You want to Reject", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onReject(sPath);
				}
			}
		})
	}
	public async onConfirmApprove(sPath) {
		sPath = sPath;
		let oBusyDailog = new sap.m.BusyDialog().open();
		let index = parseInt(sPath.replace("/is_trainee/", ''));
		// this.tm.getTN("is_trainee").setActive(index);
		//let leave_data =this.tm.getTN("is_trainee").getActiveData();
		let leave_data = this.tm.getTN("is_trainee").getData()[index];
		const userid = (await this.transaction.get$User()).login_id;
		let entity = await this.currentLeaveData(leave_data.leave_id);//updated data
		let status = entity.leave_status;
		try {
			await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approver_remark: "Approved By ADMIN", approval_status: "Approved", approval_sequence: "1", action_required_by: userid, approved_on: new Date(), approver: "ADMIN" }, true)
			let leaveData = await this.onUpdatedLeaveQuota(entity.leave_catagory, entity.employee_id);
			let leaveData1 = await this.onRefrenceLeaveQuota(entity.leave_catagory, entity.employee_id);
			leaveData1[0].requested_leave = parseFloat(leaveData[0].requested_leave) - parseFloat(entity.no_of_days);
			leaveData1[0].rem_carry_forward = parseFloat(leaveData[0].rem_carry_forward) - parseFloat(entity.no_of_days);
			leaveData1[0].used_carry_forward = parseFloat(leaveData[0].used_carry_forward) + parseFloat(entity.no_of_days);
			if (parseFloat(leaveData1[0].rem_carry_forward) < 0) {
				leaveData1[0].rem_carry_forward = parseFloat("0")
				leaveData1[0].used_carry_forward = parseFloat(leaveData[0].used_carry_forward)
			}
			leaveData1[0].used_leave = parseFloat(leaveData[0].used_leave) + parseFloat(entity.no_of_days);
			if (parseFloat(leaveData1[0].used_leave) > parseFloat(leaveData[0].no_of_days)) {
				leaveData1[0].used_leave = parseFloat(leaveData[0].no_of_days);
			}
			leaveData1[0].unused_leave = parseFloat(leaveData[0].unused_leave) - parseFloat(entity.no_of_days);
			if (parseFloat(leaveData1[0].unused_leave) < 0) {
				leaveData1[0].extended = parseFloat(leaveData[0].extended) - parseFloat(leaveData1[0].unused_leave);
				leaveData1[0].unused_leave = parseFloat("0");
			}
			entity.leave_status = "Approved";
			if (parseFloat(leave_data.no_of_days) == parseFloat(entity.no_of_days) && leave_data.leave_status == status) {
				await this.tm.commitP("Approved", "Failed to Approved", true, true);
				await this.tm.getTN('o2c_leave_approval_lists').resetP(true);
			} else {
				sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
				await this.transaction.rollback();
			}
		} catch (e) {
			oBusyDailog.close()
			console.log(e)
		}
		this.tm.getTN("statuss").setData({ status_mnu: this.status })
		await this.search();
		oBusyDailog.close()
	}
	public async onReject(sPath) {
		sPath = sPath;
		let oBusyDailog = new sap.m.BusyDialog().open();
		let index = parseInt(sPath.replace("/is_trainee/", ''));
		let leave_data = this.tm.getTN("is_trainee").getData()[index];
		const userid = (await this.transaction.get$User()).login_id;
		//ex
		//ex
		let entity = await this.currentLeaveData(leave_data.leave_id);
		let status = entity.leave_status

		await this.transaction.createEntityP('d_o2c_leave_approval', { leave_id: entity.leave_id, approver_remark: "Rejected By ADMIN", approval_status: "Rejected", approval_sequence: "1", action_required_by: userid, approved_on: new Date(), approver: "ADMIN" }, true)
		let leaveData = await this.onUpdatedLeaveQuota(entity.leave_catagory, entity.employee_id);
		let leaveData1 = await this.onRefrenceLeaveQuota(entity.leave_catagory, entity.employee_id);
		leaveData1[0].requested_leave = 0.1;
		leaveData1[0].requested_leave = parseFloat(leaveData[0].requested_leave) - parseFloat(entity.no_of_days);
		try {
			entity.leave_status = "Rejected"
			if (parseFloat(leave_data.no_of_days) == parseFloat(entity.no_of_days) && leave_data.leave_status == status) {
				await this.tm.commitP("Rejected", "Unable to Reject", true, true);
			} else {
				sap.m.MessageToast.show("Rolling back please try again ", { duration: 5000 });
				await this.transaction.rollback();
			}
		} catch (e) {
			oBusyDailog.close()
		}
		this.tm.getTN("statuss").setData({ status_mnu: this.status })
		await this.search();
		oBusyDailog.close()
	}
	public async currentLeaveData(lvid) {
		// let lv_data = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', {loadAll: true,leave_id: lvid})
		let lv_data = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', { leave_id: lvid, skipMap: true, loadAll: true })

		return lv_data[0];
	}
	public async onUpdatedLeaveQuota(leavecategory, employeeid) {
		//let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', {loadAll: true,'category_id': leavecategory, 'employee_id': employeeid, skipMap: true })
		let leaveData = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime(), skipMap: true });

		return leaveData;
	}
	public async onRefrenceLeaveQuota(leavecategory, employeeid) {
		//let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', {loadAll: true,'category_id': leavecategory, 'employee_id': employeeid })
		let leaveData1 = <KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('q_leave_current_quota', { loadAll: true, 'category_id': leavecategory, 'employee_id': employeeid, 'valid_till': new Date().getTime() });

		return leaveData1;
	}
}
//loadAll true