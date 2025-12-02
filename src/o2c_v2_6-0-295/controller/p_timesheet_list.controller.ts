import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee_designation } from 'o2c_v2/entity/d_o2c_employee_designation';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_timesheet_list")
export default class p_timesheet_list extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	onCalendarChange() {
	}
	public employee_status;
	public array_list = new Set();
	public roleid;
	public datecheck;
	public login_id
	public async onPageEnter() {
		this.login_id = (await this.transaction.get$User()).login_id;
		this.roleid = (await this.transaction.get$Role()).role_id;
		let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.login_id, fdate: new Date().getTime(), tdate: new Date().getTime() });
		if (emp_designation.length > 0) {
			let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { loadAll: true, 'designation_id': emp_designation[0].designation });
			let name = emp_designation_name[0].name.toUpperCase();
			if (this.roleid == undefined)
				this.roleid = name;
		}
		this.roleid = this.roleid.toUpperCase();
		await this.tm.getTN("emp_role").setData({});
		await this.tm.getTN("emp_role").setProperty('roler', this.roleid);
		if (this.roleid == 'HR' || this.roleid == 'FINANCE' || this.roleid == 'TOP MANAGEMENT' || this.roleid == 'MANAGER' || this.roleid == 'TEAM HEAD' || this.roleid == 'TEAM_HEAD' || this.roleid == 'LEGAL') {
			let from_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
			let result = from_date.toLocaleDateString();
			this.datecheck = result;
			let emp_profit_cntr = await this.transaction.getExecutedQuery('d_o2c_employee_org', { loadAll: true, 'employee_id': this.login_id, 'is_primary': true })
			let employee_new = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.login_id })
			this.tm.getTN("date_search_store").setData({});
			this.tm.getTN("ending_month_store").setData({});
			this.tm.getTN("employee_store").setData({});
			this.tm.getTN("profit_center").setData({});
			// this.tm.getTN("profit_center").setData({profit:emp_profit_cntr[0].profit_centre});
			this.tm.getTN("profit_center").getData().profit = emp_profit_cntr[0].profit_centre
			this.tm.getTN("profit_center").getData().line_manager = this.login_id
			this.ListFetching(result);
			if (!window['XLSX']) {//
				// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
				let path = "kloExternal/xlsx.bundle"
				let data = await import(path)
			}
		}
	}
	public async onDateFilterChange(oEvent) {

		if (this.roleid == 'HR' || this.roleid == 'FINANCE' || this.roleid == 'TOP MANAGEMENT' || this.roleid == 'MANAGER' || this.roleid == 'TEAM HEAD' || this.roleid == 'TEAM_HEAD' || this.roleid == 'LEGAL') {
			this.array_list.clear()
			let oBusyDailog = new sap.m.BusyDialog();
			oBusyDailog.open();
			let datefilter = this.tm.getTN("profit_center").getData().date;
			let endDateFiler = this.tm.getTN("profit_center").getData().end_date;
			let start_month = new Date(datefilter).getMonth()
			let end_month = new Date(endDateFiler).getMonth() + (new Date(endDateFiler).getFullYear() - new Date(datefilter).getFullYear()) * 12;
			this.datecheck = datefilter;
			for (let i = start_month; i <= end_month; i++) {
				let month = new Date(new Date(datefilter).getFullYear(), i, 1);
				await this.ListFetching(month);
			}
			if (endDateFiler != undefined) {
				this.employee_status = Array.from(this.array_list);

				this.tm.getTN("employee_store").setData(this.employee_status);

			}

			setTimeout(async () => { oBusyDailog.close() }, 1500)
		}
		this.tm.getTN("employee_store").applysortP("employee_id", "DESC")
		this.tm.getTN("employee_store").refresh()
	}
	public async ListFetching(from_date) {
		let submission;
		let submit_task_list;
		let approved_task_list;
		let timesheet_index;
		let profit_center_index;
		let profit_id = this.tm.getTN("profit_center").getData().profit;
		let line_manager_id = this.tm.getTN("profit_center").getData().line_manager;
		let first_day = new Date(new Date(from_date).getFullYear(), new Date(from_date).getMonth(), 1);
		let end_day = new Date(new Date(from_date).getFullYear(), new Date(from_date).getMonth() + 1, 0);
		//let time_sheet =<KloEntitySet<d_o2c_timesheet_header>> await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {loadAll: true,"from_date":from_date})
		let time_sheet = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery('q_o2c_timesheet_list', { loadAll: true, date_of_search: first_day, date_of_end: end_day });
		let submit_id_array = time_sheet.map(a => a.submit_id);
		let employee = await this.transaction.getExecutedQuery('q_employee_timesheet', { loadAll: true, is_active: true, profit_centers: profit_id, line_manager: line_manager_id })
		let timesheet_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery('d_o2c_timesheet_task', { loadAll: true, "submit_id": submit_id_array })
		let profit_center = await this.transaction.getExecutedQuery('d_o2c_employee_org', { loadAll: true, 'is_primary': true })
		let full_employee = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, is_active: true });
		for (let i = 0; i < employee.length; i++) {
			submission = false;
			approved_task_list = 0;
			submit_task_list = 0;
			for (let j = 0; j < time_sheet.length; j++) {
				if (employee[i].employee_id == time_sheet[j].employee_id) {
					submission = true;
					timesheet_index = j;
					break;
				}
			}
			for (let k = 0; k < profit_center.length; k++) {
				if (employee[i].employee_id == profit_center[k].employee_id) {
					profit_center_index = k;
					break;
				}
			}
			let line_manager_email;
			let line_manager_nme;
			for (let l = 0; l < full_employee.length; l++) {
				if (employee[i].line_manager == full_employee[l].employee_id) {
					line_manager_email = full_employee[l].official_mail;
					line_manager_nme = full_employee[l].full_name;
					break;
				}
			}
			if (submission == true) {
				for (let k = 0; k < timesheet_task.length; k++) {
					if (time_sheet[timesheet_index].submit_id == timesheet_task[k].submit_id) {
						submit_task_list = submit_task_list + 1;
						if (timesheet_task[k].status == "Approved") {
							approved_task_list = approved_task_list + 1;
						}
					}
				}
				// if (approved_task_list < submit_task_list && approved_task_list != 0 && time_sheet[timesheet_index].over_all_status == "Submitted")
				if (time_sheet[timesheet_index].over_all_status == "Partially Approved") {
					let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Partially Approved", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
					this.array_list.add(employee_table);
				}
				else if (time_sheet[timesheet_index].over_all_status == "Approved") {
					let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Approved", submitted_on: time_sheet[timesheet_index].submitted_on, approved_on: time_sheet[timesheet_index].s_modified_on, mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
					this.array_list.add(employee_table);
				}
				else if (time_sheet[timesheet_index].over_all_status == "Submitted") {
					let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Submitted", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
					this.array_list.add(employee_table);
				}
				else if (time_sheet[timesheet_index].over_all_status == "Rejected") {
					let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Rejected", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
					this.array_list.add(employee_table);
				}
				else {
					let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Not Submitted", mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
					this.array_list.add(employee_table);
				}
			}
			else if (submission == false && (!employee[i].last_working_day || first_day <= employee[i].last_working_day) && employee[i].timesheet_not_required != true) {
				let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_status: employee[i].s_status, location: profit_center[profit_center_index].business_area, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Not Submitted", mail_id: employee[i].official_mail, profit_name: profit_center[profit_center_index].profit_centre, is_active: employee[i].is_active, send_reminder: false, line_id: line_manager_email, line_manager_name: line_manager_nme }
				this.array_list.add(employee_table);
			}
		}

	}
	public download_excel_file() {
		let file_name = "TimesheetReport_".concat(this.datecheck, ".xlsx");
		console.log(file_name);
		let list_data = this.tm.getTN("employee_store").getData()
		var ws = XLSX.utils.json_to_sheet(list_data);
		var wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "TimeSheetReport");
		XLSX.writeFile(wb, file_name, { compression: true });
		//XLSX.writeFile(wb, "TimeSheetReport.xlsx", { compression: true }).
	}
	public async approved() {
		this.array_list.clear()
		for (let i = 0; i < this.employee_status.length; i++) {
			if (this.employee_status[i].overall_status == "Approved") {
				let employee_table = { date_month: this.employee_status[i].date_month, employee_id: this.employee_status[i].employee_id, employee_status: this.employee_status[i].employee_status, location: this.employee_status[i].location, employee_name: this.employee_status[i].employee_name, line_manager: this.employee_status[i].line_manager, overall_status: "Approved", submitted_on: this.employee_status[i].submitted_on, approved_on: this.employee_status[i].approved_on, mail_id: this.employee_status[i].mail_id, profit_name: this.employee_status[i].profit_name, is_active: this.employee_status[i].is_active, line_id: this.employee_status[i].line_id, line_manager_name: this.employee_status[i].line_manager_name }
				this.array_list.add(employee_table)
			}
		}
		let approve_status = Array.from(this.array_list);
		this.tm.getTN("employee_store").setData(approve_status);
		await this.tm.getTN("employee_store").refresh();
	}
	public async partially_approved() {
		this.array_list.clear()
		for (let i = 0; i < this.employee_status.length; i++) {
			if (this.employee_status[i].overall_status == "Partially Approved") {
				let employee_table = { date_month: this.employee_status[i].date_month, employee_id: this.employee_status[i].employee_id, employee_status: this.employee_status[i].employee_status, location: this.employee_status[i].location, employee_name: this.employee_status[i].employee_name, line_manager: this.employee_status[i].line_manager, overall_status: "Partially Approved", submitted_on: this.employee_status[i].submitted_on, approved_on: this.employee_status[i].approved_on, mail_id: this.employee_status[i].mail_id, profit_name: this.employee_status[i].profit_name, is_active: this.employee_status[i].is_active, line_id: this.employee_status[i].line_id, line_manager_name: this.employee_status[i].line_manager_name }
				this.array_list.add(employee_table)
			}
		}
		let approve_status = Array.from(this.array_list);
		this.tm.getTN("employee_store").setData(approve_status);
		await this.tm.getTN("employee_store").refresh();
	}

	public async submitted() {
		this.array_list.clear()
		for (let i = 0; i < this.employee_status.length; i++) {
			if (this.employee_status[i].overall_status == "Submitted") {
				let employee_table = { date_month: this.employee_status[i].date_month, employee_id: this.employee_status[i].employee_id, employee_status: this.employee_status[i].employee_status, location: this.employee_status[i].location, employee_name: this.employee_status[i].employee_name, line_manager: this.employee_status[i].line_manager, overall_status: "Submitted", submitted_on: this.employee_status[i].submitted_on, approved_on: this.employee_status[i].approved_on, mail_id: this.employee_status[i].mail_id, profit_name: this.employee_status[i].profit_name, is_active: this.employee_status[i].is_active, line_id: this.employee_status[i].line_id, line_manager_name: this.employee_status[i].line_manager_name }
				this.array_list.add(employee_table)
			}
		}
		let approve_status = Array.from(this.array_list);
		this.tm.getTN("employee_store").setData(approve_status);
		await this.tm.getTN("employee_store").refresh();
	}
	public async not_submitted() {
		this.array_list.clear()
		for (let i = 0; i < this.employee_status.length; i++) {
			if (this.employee_status[i].overall_status == "Not Submitted") {
				let employee_table = { date_month: this.employee_status[i].date_month, employee_id: this.employee_status[i].employee_id, employee_status: this.employee_status[i].employee_status, location: this.employee_status[i].location, employee_name: this.employee_status[i].employee_name, line_manager: this.employee_status[i].line_manager, overall_status: "Not Submitted", submitted_on: this.employee_status[i].submitted_on, approved_on: this.employee_status[i].approved_on, mail_id: this.employee_status[i].mail_id, profit_name: this.employee_status[i].profit_name, is_active: this.employee_status[i].is_active, line_id: this.employee_status[i].line_id, line_manager_name: this.employee_status[i].line_manager_name }
				this.array_list.add(employee_table)
			}
		}
		let approve_status = Array.from(this.array_list);
		this.tm.getTN("employee_store").setData(approve_status);
		await this.tm.getTN("employee_store").refresh();
	}
	public async rejected() {
		this.array_list.clear()
		for (let i = 0; i < this.employee_status.length; i++) {
			if (this.employee_status[i].overall_status == "Rejected") {
				let employee_table = { date_month: this.employee_status[i].date_month, employee_id: this.employee_status[i].employee_id, employee_status: this.employee_status[i].employee_status, location: this.employee_status[i].location, employee_name: this.employee_status[i].employee_name, line_manager: this.employee_status[i].line_manager, overall_status: "Rejected", submitted_on: this.employee_status[i].submitted_on, approved_on: this.employee_status[i].approved_on, mail_id: this.employee_status[i].mail_id, profit_name: this.employee_status[i].profit_name, is_active: this.employee_status[i].is_active, line_id: this.employee_status[i].line_id, line_manager_name: this.employee_status[i].line_manager_name }
				this.array_list.add(employee_table)
			}
		}
		let approve_status = Array.from(this.array_list);
		this.tm.getTN("employee_store").setData(approve_status);
		await this.tm.getTN("employee_store").refresh();
	}
	public async full_status() {
		this.tm.getTN("employee_store").setData(this.employee_status);
	}
	public async submit() {
		let profit_id = this.tm.getTN("profit_center").getData().profit;
		this.tm.getTN("time_search").setProperty('profit_centers', profit_id);
		await this.tm.getTN("time_search").executeP();
		this.onDateFilterChange();

	}
	public async profit_change(oEvent) {
		let profit = this.tm.getTN("profit_center").getData().profit;
		this.tm.getTN("line_manager_search").setProperty('profit_centre', profit)
		await this.tm.getTN("line_manager_search").executeP()
	}
	public async mail_send() {
		let entity = this.tm.getTN("employee_store").getData()
		let emp_array = [];
		for (let i = 0; i < entity.length; i++) {
			if (entity[i].send_reminder == true) {
				emp_array.push(entity[i].employee_id);
			}
		}
		if (emp_array.length) {
			this.tm.getTN("timesheet_email").setProperty('type', "TSReminder")
			this.tm.getTN("timesheet_email").setProperty('send_reminder', emp_array)
			await this.tm.getTN("timesheet_email").executeP()
			sap.m.MessageToast.show("Mail sent successfully", {
				duration: 3000,
				width: "20em",
			})
		}
	}
	public async select_all() {
		let entity = this.tm.getTN("employee_store").getData();

		for (let i = 0; i < entity.length; i++) {
			if (entity[i].overall_status == "Not Submitted") {
				if (entity[i].send_reminder === undefined) {
					// If send_reminder is undefined, set it to true
					entity[i].send_reminder = true;
				} else {
					// If send_reminder is defined, toggle its value
					entity[i].send_reminder = !entity[i].send_reminder;
				}
			}
		}
		this.tm.getTN("employee_store").refresh();
	}
}
