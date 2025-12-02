import { KloController } from 'kloTouch/jspublic/KloController';
import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloTransaction } from 'kloBo/KloTransaction';
// import o2c_base from 'o2c_base/metadata/mu_menu_hdr/o2c_base_metadata';
// import employee from '../metadata/mu_menu_hdr/employee_metadata';
// import UI5Date from 'sap/ui/core/date/UI5Date';
// import CalendarLegendItem from 'sap/ui/unified/CalendarLegendItem';
// import DateTypeRange from "sap/ui/unified/DateTypeRange";
// import JSONModel from "sap/ui/model/json/JSONModel";
declare let KloUI5: any;
let oController;
let holidayData;
let leaveData;
let appliedLeaveData;
var taskData = [];
var timeSheet_Task;
var timeSheet_header;
var weekendDatesMapping = new Map();
var weeklyDateBind = new Map();
var omonth;
var headerList: Header[] = [];
var headerListWeek: Header[] = [];
var newTaskForTotalTable = [{
	taskName: "Total",
	work: [],
}];
var newTaskForTotalTableWeek = [{
	taskName: "TotalHour",
	work: [],
}];
var temp = [];
var temp1 = [];
var visibleColumnIndex = 0;
// var totalHour = 0;
var totalHour = { value: 0 };
var totalHourWeek = { value: 0 };
var weekStartDate;
var weekEndDate;
var isMonth;
// readOnly for Line Manager
let loginEmpId;
let aBusy;
@KloUI5("o2c_v2.controller.p_ui5")
export default class p_ui5 extends KloController {
	public onInit() {
		// this.onBusyDialog();
		var oLocalModel = new sap.ui.model.json.JSONModel();
		sap.ui.getCore().setModel(oLocalModel, "mDataModel");
		headerList = [];
		sap.ui.getCore().getModel("mDataModel").setProperty('/readOnly', false);
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
		this.onTableUpdateFinished();
	}

	public async onPageExit() {
	}
	public async onPageDestroy() {
	}
	public async onPageEnter() {
		oController = this;

		aBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		aBusy.open();

		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_ui5";
		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		});
		this.getActiveControlById(null, 'pageLayout01', 'p_ui5').addContent(view);
		// let view: sap.ui.core.mvc.XMLView = await sap.ui.core.mvc.View.create({ id: "view", viewName: viewName, type: sap.ui.core.mvc.ViewType.XML })
		// this.getActiveControlById(null,'pageLayout01','p_ui5').addContent(view);
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "timesheet_booking");

		let userId = (await this.transaction.get$User()).login_id;

		// for download
		if (!window['XLSX']) {//
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}

		let submit_test_button = await this.transaction.getExecutedQuery('d_general_confg', { loadAll: true, 'key': "timesheet_submit", 'high_value': "1" });
		if (submit_test_button.length) {
			sap.ui.getCore().getModel("mDataModel").setProperty('/submit_test_button', true);
		} else {
			sap.ui.getCore().getModel("mDataModel").setProperty('/submit_test_button', false);
		}

		userId = userId.toUpperCase();
		sap.ui.getCore().getModel("mDataModel").setProperty('/employeeId', userId);
		let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': userId, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/thisUser', thisUser[0]);
		sap.ui.getCore().getModel("mDataModel").setProperty('/lineManager', thisUser[0].line_manager);
		sap.ui.getCore().getModel("mDataModel").setProperty('/employeeName', thisUser[0].full_name);
		// Employee under this line manager // need changes in bol editor
		let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
		let hierarchyIds = [];
		let alreadyVisited = new Map();
		let hierarchyEmployee = [];
		for (let i = 0; i < allEmployee.length; i++) {
			if(!alreadyVisited[allEmployee[i].employee_id]){
				alreadyVisited[allEmployee[i].employee_id] =true;
				hierarchyIds.push(allEmployee[i].employee_id);
				hierarchyEmployee.push(allEmployee[i]);
			}
		}
		hierarchyEmployee.push(thisUser[0]);
		while (hierarchyIds.length) {

			allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });

			hierarchyIds = [];
			for (let i = 0; i < allEmployee.length; i++) {
				if(!alreadyVisited[allEmployee[i].employee_id]){
					alreadyVisited[allEmployee[i].employee_id] = true;
					hierarchyIds.push(allEmployee[i].employee_id);
					hierarchyEmployee.push(allEmployee[i]);
				}
			}
		}
		// old
		// let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
		// allEmployee.push(thisUser[0]);
		sap.ui.getCore().getModel("mDataModel").setProperty('/allEmployee', hierarchyEmployee);

		let empComboboxVisivle = false;
		if (hierarchyEmployee.length > 1) {
			empComboboxVisivle = true;
		} else {
			empComboboxVisivle = false;
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/empComboboxVisivle', empComboboxVisivle);

		// hieararchy combo boxes logic

		// let thisUserDesig = await oController.transaction.getExecutedQuery('d_o2c_employee_designation', { 'employee_id': userId, loadAll: true });
		// let desig = (await oController.transaction.getExecutedQuery('d_o2c_designation_master', { 'designation_id': thisUserDesig[0].designation, loadAll: true }))[0].name;

		// sap.ui.getCore().byId("hieararchyBox_2").setVisible(false);
		// sap.ui.getCore().byId("hieararchyBox_3").setVisible(false);
		// if(desig === "Team_Head"){

		// 	let hieararchyData_1 = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
		// 	sap.ui.getCore().getModel("mDataModel").setProperty('/hieararchyData_1', hieararchyData_1);

		// }
		// else if(desig === "MANAGER"){
		// 	sap.ui.getCore().byId("hieararchyBox_1").setValue(thisUser[0].full_name);
		// 	sap.ui.getCore().byId("hieararchyBox_1").setEditable(false);

		// 	let hieararchyData_2 = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
		// 	sap.ui.getCore().getModel("mDataModel").setProperty('/hieararchyData_2', hieararchyData_2);

		// if(!hieararchyData_2.length){
		// 	sap.ui.getCore().byId("hieararchyBox_2").setVisible(false);
		// }else{
		// 	sap.ui.getCore().byId("hieararchyBox_2").setVisible(true);
		// }

		// }else{
		// 	sap.ui.getCore().byId("hieararchyBox_2").setVisible(false);
		// 	sap.ui.getCore().byId("hieararchyBox_3").setVisible(false);
		// }	

		// hieararchy combo boxes logic

		// <<<<<<<<<<<change>>>>>>>>>>>
		let allTypeLeaves = await this.transaction.getExecutedQuery('d_o2c_leave_management', { 'employee_id': userId, loadAll: true });
		let leaves = allTypeLeaves.filter(item => (item.employee_id === userId.toLowerCase() || item.employee_id === userId.toUpperCase()) && item.leave_status === "Approved");

		// <<<<<<<<<<<change>>>>>>>>>>>
		sap.ui.getCore().getModel("mDataModel").setProperty('/leaves', leaves);
		// <<<<<<<<<<<change>>>>>>>>>>>
		let appliedleaves = allTypeLeaves.filter(item => (item.employee_id === userId.toLowerCase() || item.employee_id === userId.toUpperCase()) && item.leave_status === "Applied");

		sap.ui.getCore().getModel("mDataModel").setProperty('/appliedleaves', appliedleaves);
		// <<<<<<<<<<<change>>>>>>>>>>>

		// getting all holiday calendar data						
		holidayData = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar', { loadAll: true });
		let empOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': userId, 'is_primary': true, loadAll: true });
		let allOfficeCalendar = await this.transaction.getExecutedQuery('d_o2c_office_calendar', { loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/allOfficeCalendar', allOfficeCalendar);
		let allBusinessArea = await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/allBusinessArea', allBusinessArea);
		let finalHoliday = [];
		let holidayDateNameData = [];
		// for (let i = 0; i < empOrg.length; i++) {
		let bsnsArea = empOrg[0].business_area;
		let companyCode = empOrg[0].company_code;
		// let stDate = empOrg[i].active_from;
		// let edDate = empOrg[i].active_till;
		let businessArea = allBusinessArea.filter(item => item.business_area === bsnsArea && item.company_code === companyCode);
		let officeCalendar = [];
		if (businessArea.length > 0) {
			officeCalendar = allOfficeCalendar.filter(item => item.office_calendar_id === businessArea[0].office_calender);
		}
		// while (stDate <= edDate) {
		for (let j = 0; j < holidayData.length; j++) {
			if (officeCalendar.length > 0 && officeCalendar[0].holiday_calender_id === holidayData[j].holiday_calender_id) {
				let tempDate = new Date(holidayData[j].holiday_date);
				finalHoliday.push(tempDate);
				// for displaying holiday name for each month
				const dateString = tempDate.toLocaleDateString('en-US', {
					month: 'short',
					day: '2-digit',
					year: 'numeric'
				});
				var oholidayDateNameData = {
					"holidayDate": dateString,
					"holidayName": holidayData[j].holiday_name
				}
				holidayDateNameData.push(oholidayDateNameData);
				// for displaying holiday name for each month
			}
		}
		// 	stDate.setDate(stDate.getDate() + 1);
		// }
		// }
		sap.ui.getCore().getModel("mDataModel").setProperty('/finalHoliday', finalHoliday);
		sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameData', holidayDateNameData);
		let oDate = new Date();
		let holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, oDate);
		sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);

		// Adding color for holiday and leave
		let oCal1: sap.ui.unified.Calendar = sap.ui.getCore().byId("calendar");
		for (let i = 0; i < finalHoliday.length; i++) {
			let oDate = finalHoliday[i];
			oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
				startDate: oDate,
				color: "#9e050a"
			}));
		}


		for (let i = 0; i < leaves.length; i++) {
			let sDate = leaves[i].start_date;
			let eDate = leaves[i].end_date;
			let sHalf = leaves[i].half_day_startdate;
			let eHalf = leaves[i].half_day_enddate;

			var weekEndDays = [];
			weekEndDays = this.getWeekendDatesBetween(sDate, eDate);

			if (weekEndDays.length > 0) {
				let currentDate = new Date(sDate);
				while (currentDate <= eDate) {
					let leaveInWeekend = false;
					for (let j = 0; j < weekEndDays.length; j++) {
						if (currentDate.toString() === weekEndDays[j].toString()) {
							leaveInWeekend = true;
							break;
						}
					}
					if (leaveInWeekend === false) {
						if (sHalf && currentDate.toString() === sDate.toString()) {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#0af034"
							}));

						} else if (eHalf && currentDate.toString() === eDate.toString()) {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#0af034"
							}));
						}
						else {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#066613"
							}));
						}
					}
					currentDate.setDate(currentDate.getDate() + 1);
				}
			}
			else {
				let currentDate = new Date(sDate);
				while (currentDate <= eDate) {
					if (sHalf && currentDate.toString() === sDate.toString()) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#0af034"
						}));

					} else if (eHalf && currentDate.toString() === eDate.toString()) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#0af034"
						}));
					}
					else {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#066613"
						}));
					}

					currentDate.setDate(currentDate.getDate() + 1);
				}
			}
		}

		// ******************************************?
		// adding color in calendar for applied leave
		for (let i = 0; i < appliedleaves.length; i++) {
			let sDate = appliedleaves[i].start_date;
			let eDate = appliedleaves[i].end_date;
			var weekEndDays = [];
			weekEndDays = this.getWeekendDatesBetween(sDate, eDate);
			if (weekEndDays.length > 0) {
				let currentDate = new Date(sDate);
				while (currentDate <= eDate) {
					let appliedLeaveInWeekend = false;
					for (let j = 0; j < weekEndDays.length; j++) {
						if (currentDate.toString() === weekEndDays[j].toString()) {
							appliedLeaveInWeekend = true;
							break;
						}
					}
					if (appliedLeaveInWeekend === false) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#0407cc"
						}));
					}
					currentDate.setDate(currentDate.getDate() + 1);
				}
			}
			else {
				oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
					startDate: sDate,
					endDate: eDate,
					color: "#0407cc"
				}));
			}

		}
		// <<<<<<<<<<<change>>>>>>>>>>>
		// sap.ui.getCore().getModel("mDataModel").setProperty('/allAssignedTask', allAssignedTask);
		let assignedTask = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery('d_o2c_task_assignment', { 'employee_id': userId, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty("/assignedTask", assignedTask);
		let assigedTaskIds = [];
		for (let i = 0; i < assignedTask.length; i++) {
			assigedTaskIds.push(assignedTask[i].task_id);
		}
		sap.ui.getCore().getModel("mDataModel").setProperty("/taskIdsForEmployee", assigedTaskIds);
		// getting all timesheet booking with array filter
		let taskDataForEmployee = [];
		if (assigedTaskIds.length > 0) {
			taskDataForEmployee = await this.transaction.getExecutedQuery('q_task_assignment_booking', { "task_id": assigedTaskIds, loadAll: true });
		}

		sap.ui.getCore().getModel("mDataModel").setProperty('/taskDataForEmployee', taskDataForEmployee);
		// used in taskLinkPress function for fetch status for perticular task
		let timesheetTaskTableData = await this.transaction.getExecutedQuery('d_o2c_timesheet_task', { "task_id": assigedTaskIds, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/timesheetTaskTableData', timesheetTaskTableData);
		// <<<<<<<<<<<change>>>>>>>>>>>

		// combo box key stroring
		sap.ui.getCore().getModel("mDataModel").setProperty('/comboBoxKey', 'month');

		const currentDate = new Date();
		sap.ui.getCore().getModel("mDataModel").setProperty('/currentDate', currentDate);
		let monthLabel = await this.getFullMonthName(currentDate);
		sap.ui.getCore().getModel("mDataModel").setProperty('/monthLabel', monthLabel);
		sap.ui.getCore().getModel("mDataModel").setProperty('/yearLabel', currentDate.getFullYear());
		// this.tm.getTN('currentDate').setData(currentDate);
		let currentMonth = currentDate.getMonth();
		let currentYear = currentDate.getFullYear();
		let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

		// adding weekend color besis on month
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth);
		let weekEndDaysInMonth = [];
		weekEndDaysInMonth = this.getWeekendDatesBetween(firstDayOfMonth, lastDayOfMonth);
		for (let i = 0; i < weekEndDaysInMonth.length; i++) {
			oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
				startDate: weekEndDaysInMonth[i],
				color: "#87CEEB"
			}));
		}

		// submit  Buttton functionality
		let submitHistory = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', { 'employee_id': userId, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/submitHistory', submitHistory);



		let submitHistoryforMonth = [];
		for (let i = 0; i < submitHistory.length && submitHistory.length > 0; i++) {
			if (submitHistory[i].from_date.getMonth() === firstDayOfMonth.getMonth() && submitHistory[i].from_date.getFullYear() === firstDayOfMonth.getFullYear()) {
				submitHistoryforMonth.push(submitHistory[i]);
			}
		}
		let isSubmit = false;
		sap.ui.getCore().getModel("mDataModel").setProperty('/isSubmit', isSubmit);
		// sorting the submitHistoryforMonth data in decending
		if (submitHistoryforMonth.length > 0) {
			submitHistoryforMonth.sort((a, b) => {
				const submitIdA = parseInt(a.submit_id.substring(3), 10);
				const submitIdB = parseInt(b.submit_id.substring(3), 10);

				return submitIdB - submitIdA;
			});

			let approverRemark = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver', { 'submit_id': submitHistoryforMonth[0].submit_id, loadAll: true });
			if (approverRemark.length) {
				let approver = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': approverRemark[0].approver });
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', approver[0] ? approver[0].full_name : 'Admin');
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', approverRemark[0].approver_remark);
			} else {
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', "No Remark");
			}

			if (submitHistoryforMonth[0].over_all_status != 'Rejected') {
				sap.ui.getCore().byId("subBtn").setVisible(false);
				sap.ui.getCore().byId("saveBtn").setVisible(false);
			}
			isSubmit = true;
			sap.ui.getCore().getModel("mDataModel").setProperty('/isSubmit', isSubmit);
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitHistoryforMonth[0].over_all_status);
		} else {
			let submitStatus = "";
			sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitStatus);
			// this.tm.getTN('submitStatus').setData(submitStatus);
		}

		// table control
		for (let i = 0; i < 31; i++) {
			temp.push({
				colDate: i + 1,
				colMonth: currentMonth,
				colYear: currentYear,
				colVisible: false,
			});
		}
		for (let i = 0; i < daysInMonth; i++) {
			temp[i].colVisible = true;
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/temp', temp);
		// this.tm.getTN('temp').setData(temp);


		// for getting the monthly task and conver into new structure
		this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
		// storing smallest and greatest date for submit in timesheet header table
		this.findSmallestAndGreatestDates(headerList);
		// modifying the header list
		this.generateUpdatedMonthData(headerList, currentYear, currentMonth);
		// adding color for leave days
		this.markLeaveDaysInTaskTable(headerList, leaves);
		// marking applied leave days for task table
		this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
		// adding color for holidays in task table
		this.markHolidayInTaskTable(headerList, finalHoliday);
		// adding color for weekend days in Task Table
		this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
		this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);
		// auto fill for leaves in total table
		this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
		// auto fill for leaves in total table
		this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
		// auto fill for Holidays in total table
		this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
		// auto fill for Weekends in total table
		this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

		sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
		// this.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
		sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
		// this.tm.getTN('totalWorkHour').setData(totalHour);

		sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);

		this.pendingWithCheck();

		aBusy.close();

	}

	//checking for pending with
	public async pendingWithCheck() {
		// debugger;
		return;
		let userId = sap.ui.getCore().getModel("mDataModel").getProperty('/employeeId')

		let currentDate = sap.ui.getCore().getModel("mDataModel").getProperty('/currentDate');
		let currentMonth = currentDate.getMonth();
		let currentYear = currentDate.getFullYear();
		let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth);

		let submitHistory = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', { 'employee_id': userId, 'from_date': firstDayOfMonth.toString(), loadAll: true });
		if(!submitHistory.length){
			sap.ui.getCore().getModel("mDataModel").setProperty('/pendingWith', "Not Submitted Yet")
			return;
		}
		let lineManager = sap.ui.getCore().getModel("mDataModel").getProperty('/lineManager');
		let timesheetTask = await oController.transaction.getExecutedQuery('d_o2c_timesheet_task', { "submit_id": submitHistory[0].submit_id, loadAll: true });
		let taskIds = [];
		for(let i=0; i<timesheetTask.length; i++){
			taskIds.push(timesheetTask[i].task_id);
		}
		let taskAssignment = await oController.transaction.getExecutedQuery('d_o2c_task_assignment', { "task_id": taskIds, loadAll: true });
		let map = new Map();
		for(let i=0; i<taskAssignment.length; i++){
			map[taskAssignment[i].task_id] = taskAssignment[i].assigned_by;
		}
		for(let i=0; i<timesheetTask.length; i++){
			if(map[timesheetTask[i].task_id].toLowerCase() != lineManager.toLowerCase() && timesheetTask[i].status == "Submitted"){
				sap.ui.getCore().getModel("mDataModel").setProperty('/pendingWith', map[timesheetTask[i].task_id]);
				return;
			}
		}
		for(let i=0; i<timesheetTask.length; i++){
			if(timesheetTask[i].status == "Submitted"){
				sap.ui.getCore().getModel("mDataModel").setProperty('/pendingWith', map[timesheetTask[i].task_id]);
				return;
			}
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/pendingWith', "N/A");
	}

	// hiding leave task row from table
	public async onTableUpdateFinished() {
		// debugger;
		// return;
		const leaveIdentifire = 'Leave';

		const aFilter = [];

		// Filter Live Search Input
		if (leaveIdentifire) {
			aFilter.push(new sap.ui.model.Filter([
				new sap.ui.model.Filter("taskType", sap.ui.model.FilterOperator.NE, leaveIdentifire)
			], false));
		}

		// Apply Filter 
		sap.ui.getCore().byId("Table").getBinding("items").filter(aFilter);
	}

	// for getting monthly holiday date with name
	public filterDataByMonthAndYear(data, date) {
		const givenMonth = new Date(date).getMonth() + 1; // Month is zero-indexed in JavaScript
		const givenYear = new Date(date).getFullYear();

		return data.filter(entry => {
			const holidayDate = new Date(entry.holidayDate);
			const holidayMonth = holidayDate.getMonth() + 1;
			const holidayYear = holidayDate.getFullYear();

			return holidayMonth === givenMonth && holidayYear === givenYear;
		});
	}
	// function for busy dialog
	public onBusyDialog() {
		var oBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		oBusy.open();
		window.setTimeout(() => {
			oBusy.close();
		}, 3000);
	}
	//  busy dialog for taskLink press
	public onSubmitBusyDialog() {
		var oBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		oBusy.open();
		window.setTimeout(() => {
			oBusy.close();
		}, 2000);
	}
	public onEmpChangeBusyDialog() {
		var oBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		oBusy.open();
		window.setTimeout(() => {
			oBusy.close();
		}, 2000);
	}
	// for getting the monthly task and conver into new structure
	public processTaskDataToMonthly(taskData, currentMonth, currentYear, headerList) {
		let nonUpdateHeaderList: Header[] = [];
		for (let i = 0; i < taskData.length; i++) {
			let tempMonth = taskData[i].booking_date.getMonth();
			let tempYear = taskData[i].booking_date.getFullYear();

			if (tempMonth === currentMonth && tempYear === currentYear) {
				let assignedTask = sap.ui.getCore().getModel("mDataModel").getProperty("/assignedTask");
				let taskName = assignedTask.filter(item => item.task_id === taskData[i].task_id)[0].task_name;
				let taskType = assignedTask.filter(item => item.task_id === taskData[i].task_id)[0].task_type;
				let task_id = taskData[i].task_id;
				let workHour = taskData[i].hours_worked;
				let workRemark = taskData[i].remarks || "";
				let workDate = taskData[i].booking_date;
				let editable = true;
				let modifiedBy = taskData[i].s_modified_by;
				let modifiedOn = taskData[i].s_modified_on;
				let updateRemark = taskData[i].update_remark;

				let existingHeader = headerList.find((header) => header.taskId === task_id);

				if (!existingHeader) {
					existingHeader = {
						taskId: task_id,
						taskType: taskType ? taskType : '',
						taskName: taskName,
						TH: 0,
						taskDetail: [],
					};
					headerList.push(existingHeader);
					nonUpdateHeaderList.push(existingHeader);
				}
				// calculating total hours for easch task
				existingHeader.TH = existingHeader.TH + parseFloat(workHour);

				existingHeader.taskDetail.push({
					workHour: workHour,
					workRemark: workRemark,
					workDate: workDate,
					colorCode: "",
					editable: editable,
					modifiedBy: modifiedBy,
					modifiedOn: modifiedOn,
					updateRemark: updateRemark
				});
			}
		}
		// for getting the start and end date of a perticular taskData
		if (nonUpdateHeaderList.length)
			sap.ui.getCore().getModel("mDataModel").setProperty('/nonUpdateHeaderList', nonUpdateHeaderList);
		// oController.tm.getTN('nonUpdateHeaderList').setData(nonUpdateHeaderList);
	}

	// storing smallest and greatest date for submit in timesheet header table
	public findSmallestAndGreatestDates(headerList) {
		let smallestDate = new Date('9999-12-31');
		let greatestDate = new Date('1000-01-01');
		headerList.forEach(task => {
			task.taskDetail.forEach(workDetail => {
				let workDate = new Date(workDetail.workDate);
				if (workDate < smallestDate) {
					smallestDate = workDate;
				}
				if (workDate > greatestDate) {
					greatestDate = workDate;
				}
			});
		});
		sap.ui.getCore().getModel("mDataModel").setProperty('/smallestDate', smallestDate);
		// oController.tm.getTN('smallestDate').setData(smallestDate);
		sap.ui.getCore().getModel("mDataModel").setProperty('/greatestDate', greatestDate);
		// oController.tm.getTN('greatestDate').setData(greatestDate);
	}

	//  for mofdifying the headerLish Data model
	public generateUpdatedMonthData(headerList, currentYear, currentMonth) {
		let startDate = new Date(currentYear, currentMonth, 1);
		let endDate = new Date(currentYear, currentMonth + 1, 0);
		let endDatee = endDate.getDate();
		let currentDatee = new Date(currentYear, currentMonth, 1);

		for (let i = 0; i < headerList.length; i++) {
			let taskData;
			if (headerList[i].TH) {
				taskData = {
					taskId: headerList[i].taskId,
					taskName: headerList[i].taskName,
					taskType: headerList[i].taskType,
					TH: headerList[i].TH,
					taskDetail: [],
				}
			} else {
				taskData = {
					taskId: headerList[i].taskId,
					taskName: headerList[i].taskName,
					taskType: headerList[i].taskType,
					TH: 0,
					taskDetail: [],
				}
			}

			let intBoolMap = new Map();

			for (let k = 0; k < headerList[i].taskDetail.length; k++) {
				intBoolMap.set(new Date(headerList[i].taskDetail[k].workDate).getDate(), k);
			}

			for (let j = 0; j < endDatee; j++) {
				let workDate, workHour, workRemark, colorCode, editable, modifiedBy, modifiedOn, updateRemark;

				if (intBoolMap.get(j + 1) >= 0) {
					workDate = headerList[i].taskDetail[intBoolMap.get(j + 1)].workDate;
					workHour = headerList[i].taskDetail[intBoolMap.get(j + 1)].workHour;
					workRemark = headerList[i].taskDetail[intBoolMap.get(j + 1)].workRemark;
					colorCode = headerList[i].taskDetail[intBoolMap.get(j + 1)].colorCode;
					editable = headerList[i].taskDetail[intBoolMap.get(j + 1)].editable;
					modifiedBy = headerList[i].taskDetail[intBoolMap.get(j + 1)].modifiedBy;
					modifiedOn = headerList[i].taskDetail[intBoolMap.get(j + 1)].modifiedOn;
					updateRemark = headerList[i].taskDetail[intBoolMap.get(j + 1)].updateRemark;
				} else {
					workDate = currentDatee.toString();
					// workHour = 0;
					workRemark = "";
					colorCode = "NonEditable";
					editable = false;
					modifiedBy = "";
					modifiedOn = "";
					updateRemark = false;
				}

				let workEntry = {
					workDate,
					workHour,
					workRemark,
					colorCode,
					editable,
					modifiedBy,
					modifiedOn,
					updateRemark
				};

				taskData.taskDetail.push(workEntry);

				if (j === endDatee - 1) {
					currentDatee = new Date(currentYear, currentMonth, 1);
				} else {
					currentDatee.setDate(currentDatee.getDate() + 1);
				}
			}

			headerList[i] = taskData;
		}
	}

	// generate update week data
	public generateUpdatedWeekData(headerListWeek, weekStartDate, weekEndDate) {
		return;

		for (let i = 0; i < headerListWeek.length; i++) {
			let startDate = new Date(weekStartDate);

			let tempWeekData = {
				taskName: headerListWeek[i].taskName,
				taskDetail: [],
			};

			let intBoolMap = new Map();

			for (let k = 0; k < headerListWeek[i].taskDetail.length; k++) {
				intBoolMap.set(new Date(headerListWeek[i].taskDetail[k].workDate).getDate(), true);
			}
			let index = 0;
			//   weekStartDate <= weekEndDate
			for (let k = 0; k < 7; k++) {
				let workDate, workHour, workRemark, colorCode;

				if (intBoolMap.get(startDate.getDate())) {
					workDate = headerListWeek[i].taskDetail[index].workDate;
					workHour = headerListWeek[i].taskDetail[index].workHour;
					workRemark = headerListWeek[i].taskDetail[index].workRemark;
					colorCode = headerListWeek[i].taskDetail[index].colorCode;
					index++;
				} else {
					workDate = startDate.toString();
					workHour = 0;
					workRemark = "No Remark";
					colorCode = "";
				}

				let workEntry = {
					workDate,
					workHour,
					workRemark,
					colorCode,
				};

				tempWeekData.taskDetail.push(workEntry);
				startDate.setDate(startDate.getDate() + 1);
			}

			headerListWeek[i] = tempWeekData;
		}
	}

	// marking holidays in task table
	public markHolidayInTaskTable(headerList, holidayData) {
		const holidayMap = new Map();

		// for (let i = 0; i < holidayData.length; i++) {
		// 	holidayMap.set(holidayData[i].toString(), true);
		// }
		// for (let j = 0; j < headerList.length; j++) {
		// 	for (let k = 0; k < headerList[j].taskDetail.length; k++) {
		// 		const workDateStr = headerList[j].taskDetail[k].workDate.toString();
		// 		if (holidayMap.has(workDateStr)) {
		// 			headerList[j].taskDetail[k].colorCode = "Holiday";
		// 		}
		// 	}
		// }
		for (let i = 0; i < holidayData.length; i++) {
			holidayMap.set(holidayData[i].toISOString().split('T')[0], true);
		}
		for (let j = 0; j < headerList.length; j++) {
			for (let k = 0; k < headerList[j].taskDetail.length; k++) {
				const workDateStr = new Date(headerList[j].taskDetail[k].workDate).toISOString().split('T')[0];
				if (holidayMap.has(workDateStr)) {
					headerList[j].taskDetail[k].colorCode = "Holiday";
				}
			}
		}
	}

	// marking weekend dates in task table
	public markWeekendDaysInTaskTable(headerList, currentYear, currentMonth) {
		var weekendDates = [];
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
		weekendDates = this.getWeekendDatesBetween(firstDayOfMonth, lastDayOfMonth);
		// var weekendDatesMapping = new Map();

		// for (let i = 0; i < weekendDates.length; i++) {
		// 	weekendDatesMapping.set(weekendDates[i].toString(), true);
		// }
		for (let i = 0; i < weekendDates.length; i++) {
			let dateOnly = weekendDates[i].toISOString().split('T')[0];
			weekendDatesMapping.set(dateOnly, true);
		}
		for (let j = 0; j < headerList.length; j++) {
			for (let k = 0; k < headerList[j].taskDetail.length; k++) {
				let dateOnly = new Date(headerList[j].taskDetail[k].workDate).toISOString().split('T')[0];
				if (weekendDatesMapping.get(dateOnly)) {
					headerList[j].taskDetail[k].colorCode = "Weekend";
				}
			}
		}


		// for (let j = 0; j < headerList.length; j++) {
		// 	for (let k = 0; k < headerList[j].taskDetail.length; k++) {
		// 		if (weekendDatesMapping.get(headerList[j].taskDetail[k].workDate.toString())) {
		// 			headerList[j].taskDetail[k].colorCode = "Weekend";
		// 		}
		// 	}
		// }
	}

	// marking leave days in task table
	public markLeaveDaysInTaskTable(headerList, leaveData) {
		for (let i = 0; i < leaveData.length; i++) {
			let sDate = leaveData[i].start_date;
			let eDate = leaveData[i].end_date;
			let sHalf = leaveData[i].half_day_startdate;
			let eHalf = leaveData[i].half_day_enddate;

			let cDate = new Date(sDate);

			// while (cDate <= eDate) {
			// 	for (let j = 0; j < headerList.length; j++) {
			// 		for (let k = 0; k < headerList[j].taskDetail.length; k++) {
			// 			if (cDate.toString() === headerList[j].taskDetail[k].workDate.toString()) {
			// 				if (sHalf && cDate.toString() === sDate.toString()) {
			// 					headerList[j].taskDetail[k].colorCode = "Half_Leave";
			// 				} else if (eHalf && cDate.toString() === eDate.toString()) {
			// 					headerList[j].taskDetail[k].colorCode = "Half_Leave";
			// 				} else {
			// 					headerList[j].taskDetail[k].colorCode = "Full_Leave";
			// 				}
			// 			}
			// 		}
			// 	}
			// 	cDate.setDate(cDate.getDate() + 1);
			// }
			while (cDate <= eDate) {
				for (let j = 0; j < headerList.length; j++) {
					for (let k = 0; k < headerList[j].taskDetail.length; k++) {
						let dateOnly = new Date(headerList[j].taskDetail[k].workDate).toISOString().split('T')[0];
						if (cDate.toISOString().split('T')[0] === dateOnly) {
							if (sHalf && cDate.toString() === sDate.toString()) {
								headerList[j].taskDetail[k].colorCode = "Half_Leave";
							} else if (eHalf && cDate.toString() === eDate.toString()) {
								headerList[j].taskDetail[k].colorCode = "Half_Leave";
							} else {
								headerList[j].taskDetail[k].colorCode = "Full_Leave";
							}
						}
					}
				}
				cDate.setDate(cDate.getDate() + 1);
			}
		}
	}
	// marking applied leave in task table
	public markAppliedLeaveInTaskTable(headerList, appliedLeaveData) {
		for (let i = 0; i < appliedLeaveData.length; i++) {
			let sDate = appliedLeaveData[i].start_date;
			let eDate = appliedLeaveData[i].end_date;

			// while (sDate <= eDate) {
			// 	for (let j = 0; j < headerList.length; j++) {
			// 		for (let k = 0; k < headerList[j].taskDetail.length; k++) {
			// 			if (sDate.toString() === headerList[j].taskDetail[k].workDate.toString()) {
			// 				headerList[j].taskDetail[k].colorCode = "Applied";
			// 			}
			// 		}
			// 	}
			// 	sDate.setDate(sDate.getDate() + 1);
			// }
			while (sDate <= eDate) {
				for (let j = 0; j < headerList.length; j++) {
					for (let k = 0; k < headerList[j].taskDetail.length; k++) {
						let dateOnly = new Date(headerList[j].taskDetail[k].workDate).toISOString().split('T')[0]
						if (sDate.toISOString().split('T')[0] === dateOnly) {
							headerList[j].taskDetail[k].colorCode = "Applied";
						}
					}
				}
				sDate.setDate(sDate.getDate() + 1);
			}
		}
	}

	// get the suitable data model for total table
	public calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour) {
		newTaskForTotalTable[0].work = [];
		totalHour.value = 0;
		// totalHour = 0;
		let total = [];
		let datesArray = [];

		for (let i = 0; i < 31; i++) {
			total.push(0);
		}

		for (let i = 0; i < headerList.length; i++) {
			for (let j = 0; j < headerList[i].taskDetail.length; j++) {
				if (Number(headerList[i].taskDetail[j].workHour)) {
					if (headerList[i].taskType != 'Leave') {
						total[j] = total[j] + Number(headerList[i].taskDetail[j].workHour);
						totalHour.value = totalHour.value + Number(headerList[i].taskDetail[j].workHour);
					} else {
						total[j] = total[j];
						totalHour.value = totalHour.value;
					}

				}

				if (i === headerList.length - 1) {
					datesArray.push(headerList[i].taskDetail[j].workDate);
				}
			}
		}


		for (let i = 0; i < total.length && i < datesArray.length; i++) {
			let workItem = {
				workHour: total[i],
				workDate: datesArray[i],
				colorCode: "NonEditable",
			};
			newTaskForTotalTable[0].work.push(workItem);
		}
	}
	// marking holidays in total table
	public markHolidayInTotalTable(newTaskForTotalTable, holidayData) {
		let holidayDates = new Map();

		// Create a map to store holiday dates
		// for (let i = 0; i < holidayData.length; i++) {
		// 	let holidayDateStr = holidayData[i].toString();
		// 	holidayDates.set(holidayDateStr, 8); // 8 hours for each holiday
		// }

		// for (let j = 0; j < newTaskForTotalTable.length; j++) {
		// 	for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
		// 		let workDateStr = newTaskForTotalTable[j].work[k].workDate.toString();

		// 		if (holidayDates.has(workDateStr)) {
		// 			newTaskForTotalTable[j].work[k].colorCode = "Holiday";
		// 		}
		// 	}
		// }

		for (let i = 0; i < holidayData.length; i++) {
			let holidayDateStr = holidayData[i].toISOString().split('T')[0];
			holidayDates.set(holidayDateStr, 8); // 8 hours for each holiday
		}

		for (let j = 0; j < newTaskForTotalTable.length; j++) {
			for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
				let workDateStr = new Date(newTaskForTotalTable[j].work[k].workDate).toISOString().split('T')[0];

				if (holidayDates.has(workDateStr)) {
					newTaskForTotalTable[j].work[k].colorCode = "Holiday";
				}
			}
		}
	}
	// marking weekend dates in total table
	public markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth) {
		var weekendDates = [];
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
		weekendDates = this.getWeekendDatesBetween(firstDayOfMonth, lastDayOfMonth);

		// for (let i = 0; i < weekendDates.length; i++) {
		// 	weekendDatesMapping.set(weekendDates[i].toString(), true);
		// }

		// for (let j = 0; j < newTaskForTotalTable.length; j++) {
		// 	for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
		// 		let workDateStr = newTaskForTotalTable[j].work[k].workDate.toString();

		// 		if (weekendDatesMapping.get(workDateStr)) {
		// 			//   newTaskForTotalTable[j].work[k].workHour += 8;
		// 			newTaskForTotalTable[j].work[k].colorCode = "Weekend";
		// 			//   totalHour += 8;
		// 		}
		// 	}
		// }
		for (let i = 0; i < weekendDates.length; i++) {
			weekendDatesMapping.set(weekendDates[i].toISOString().split('T')[0], true);
		}

		for (let j = 0; j < newTaskForTotalTable.length; j++) {
			for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
				let workDateStr = new Date(newTaskForTotalTable[j].work[k].workDate).toISOString().split('T')[0];

				if (weekendDatesMapping.get(workDateStr)) {
					//   newTaskForTotalTable[j].work[k].workHour += 8;
					newTaskForTotalTable[j].work[k].colorCode = "Weekend";
					//   totalHour += 8;
				}
			}
		}
	}
	// marking leave days in total table
	public markLeaveDaysInTotalTable(newTaskForTotalTable, leaveData) {

		let holidays = sap.ui.getCore().getModel("mDataModel").getProperty('/finalHoliday');
		// const holidaySet = new Set(holidays.map(date => new Date(date).toISOString()));
		const holidaySet = new Set(holidays.map(date => new Date(date).toISOString().split('T')[0]));

		for (var i = 0; i < leaveData.length; i++) {
			let sDate = leaveData[i].start_date;
			let eDate = leaveData[i].end_date;
			let sHalf = leaveData[i].half_day_startdate;
			let eHalf = leaveData[i].half_day_enddate;

			let weekEndDays = [];
			weekEndDays = this.getWeekendDatesBetween(sDate, eDate);

			let cDate = new Date(sDate);
			while (cDate <= eDate) {
				// if weekedn days then dont add extra hour
				let isCDatePresent = weekEndDays.some(date => date.toISOString().split('T')[0] === cDate.toISOString().split('T')[0]);
				if (!isCDatePresent && !holidaySet.has(new Date(cDate).toISOString().split('T')[0])) {
					for (let j = 0; j < newTaskForTotalTable.length; j++) {
						for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
							if (cDate.toISOString().split('T')[0] === new Date(newTaskForTotalTable[j].work[k].workDate).toISOString().split('T')[0]) {
								if (sHalf && cDate.toISOString().split('T')[0] === sDate.toISOString().split('T')[0]) {
									newTaskForTotalTable[j].work[k].colorCode = "Half_Leave";
									newTaskForTotalTable[j].work[k].workHour += 4;
									totalHour.value += 4;
								} else if (eHalf && cDate.toISOString().split('T')[0] === eDate.toISOString().split('T')[0]) {
									newTaskForTotalTable[j].work[k].colorCode = "Half_Leave";
									newTaskForTotalTable[j].work[k].workHour += 4;
									totalHour.value += 4;
								} else {
									newTaskForTotalTable[j].work[k].colorCode = "Full_Leave";
									newTaskForTotalTable[j].work[k].workHour += 8;
									totalHour.value += 8;
								}
							}
						}
					}
				}
				cDate.setDate(cDate.getDate() + 1);
			}
		}
	}
	// marking applied leave in total table
	public markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedLeaveData) {
		for (let i = 0; i < appliedLeaveData.length; i++) {
			let sDate = appliedLeaveData[i].start_date;
			let eDate = appliedLeaveData[i].end_date;

			// while (sDate <= eDate) {
			// 	for (let j = 0; j < newTaskForTotalTable.length; j++) {
			// 		for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
			// 			if (sDate.toString() === newTaskForTotalTable[j].work[k].workDate.toString()) {
			// 				newTaskForTotalTable[j].work[k].colorCode = "Applied";
			// 			}
			// 		}
			// 	}
			// 	sDate.setDate(sDate.getDate() + 1);
			// }
			while (sDate <= eDate) {
				for (let j = 0; j < newTaskForTotalTable.length; j++) {
					for (let k = 0; k < newTaskForTotalTable[j].work.length; k++) {
						let dateOnly = new Date(newTaskForTotalTable[j].work[k].workDate).toISOString().split('T')[0]
						if (sDate.toISOString().split('T')[0] === dateOnly) {
							newTaskForTotalTable[j].work[k].colorCode = "Applied";
						}
					}
				}
				sDate.setDate(sDate.getDate() + 1);
			}
		}
	}

	// making color for task table
	public applyCellColorsForTaskTable() {
		return;
		var oTable = sap.ui.getCore().byId("Table");
		// oTable = this.getView().byId("Table");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().taskDetail.length; j++) {
				// color for that field which need to change after rejected
				var isUpdateRemark = oItem.oBindingContexts.mDataModel.getObject().taskDetail[j].updateRemark;
				if (isUpdateRemark) {
					aCells[j + 1].addStyleClass("updateRemark");
				}
				else {
					var sColor = oItem.oBindingContexts.mDataModel.getObject().taskDetail[j].colorCode;
					// Set background color based on the "color" field
					switch (sColor) {
						case "Holiday":
							aCells[j + 1].addStyleClass("redBackground");
							break;
						case "Half_Leave":
							aCells[j + 1].addStyleClass("blueBackground");
							break;
						case "Full_Leave":
							aCells[j + 1].addStyleClass("greenBackground");
							break;
						case "Weekend":
							aCells[j + 1].addStyleClass("skyBackground");
							break;
						case "Applied":
							aCells[j + 1].addStyleClass("appliedBackground");
							break;
						default:
							aCells[j + 1].addStyleClass("others");
							break;
					}
				}

			}
		}
	}
	// editable feature for task table
	public applyEditableForTaskTable() {

		return;
		var oTable = sap.ui.getCore().byId("Table");
		// debugger;
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().taskDetail.length; j++) {
				var sEdit = oItem.oBindingContexts.mDataModel.getObject().taskDetail[j].editable;
				// Set background color based on the "color" field
				if (!sEdit)
					aCells[j + 1].setEditable(false);
			}
		}
	}
	// delete editable option on first of each month
	public deleteEditableForTaskTable() {
		return;
		var oTable = sap.ui.getCore().byId("Table");
		// oTable = this.getView().byId("Table");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1; j++) {
				// && j < oItem.oBindingContexts.mDataModel.getObject().taskDetail.length
				// var sEdit = oItem.oBindingContexts.mDataModel.getObject().taskDetail[j].editable;
				// Set background color based on the "color" field
				// if(!sEdit)
				aCells[j + 1].setEditable(true);
			}
		}
	}
	// making color for total table
	public applyCellColorsForTotalTable() {
		return;
		// debugger;
		var oTable = sap.ui.getCore().byId("totalTable");
		// oTable = this.getView().byId("Table");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().work.length; j++) {
				var sColor = oItem.oBindingContexts.mDataModel.getObject().work[j].colorCode;

				// Make all the row non-editable
				aCells[j + 1].setEnabled(false);

				// Set background color based on the "color" field
				switch (sColor) {
					case "Holiday":
						aCells[j + 1].addStyleClass("redBackground");
						break;
					case "Half_Leave":
						aCells[j + 1].addStyleClass("blueBackground");
						break;
					case "Full_Leave":
						aCells[j + 1].addStyleClass("greenBackground");
						break;
					case "Weekend":
						aCells[j + 1].addStyleClass("skyBackground");
						break;
					case "Applied":
						aCells[j + 1].addStyleClass("appliedBackground");
						break;
					default:
						aCells[j + 1].addStyleClass("others");
						break;
				}
			}
		}
	}
	// delete all cell color for task table
	public deleteCellColorsForTaskTable() {
		// debugger;
		var oTable = sap.ui.getCore().byId("Table");
		// oTable = this.getView().byId("Table");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			// && j < oItem.oBindingContexts.mDataModel.getObject().taskDetail.length
			for (var j = 0; j < aCells.length - 1; j++) {

				let color = aCells[j + 1].aCustomStyleClasses;
				if (color) {
					aCells[j + 1].removeStyleClass(color[0]);
				}
				// aCells[j + 1].addStyleClass("deleteColor");
			}
		}
	}
	// delete all cell color for total table
	public deleteCellColorsForTotalTable() {
		return;
		var oTable = sap.ui.getCore().byId("totalTable");
		// oTable = this.getView().byId("Table");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			// && j < oItem.oBindingContexts.mDataModel.getObject().work.length
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().work.length; j++) {
				aCells[j + 1].setEditable(false);
				let color = aCells[j + 1].aCustomStyleClasses;
				if (color) {
					aCells[j + 1].removeStyleClass(color[0]);
				}
				oItem.oBindingContexts.mDataModel.getObject().work[j].colorCode = '';
				// aCells[j + 1].addStyleClass("deleteColor");
			}
		}
	}

	// weekly thing
	public processTaskDataToWeekly(taskData, headerList) {
		return;
		for (let i = 0; i < taskData.length; i++) {
			let tempMonth = taskData[i].booking_date.getMonth();
			let tempYear = taskData[i].booking_date.getFullYear();
			let tempDate = taskData[i].booking_date.getDate();
			let tempDay = taskData[i].booking_date.toString();
			// let currentWeek = sap.ui.getCore().getModel("mDataModel").getProperty("/temp");
			let currentWeek = this.tm.getTN('temp').getData();
			if (weeklyDateBind.get(tempDay)) {
				let task_id = taskData[i].task_id;
				let workHour = taskData[i].hours_worked || "0";
				let workRemark = taskData[i].remarks || "";
				let workDate = taskData[i].booking_date;

				let existingHeader = headerList.find((header) => header.taskName === task_id);

				if (!existingHeader) {
					existingHeader = {
						taskName: task_id,
						taskDetail: [],
					};
					headerList.push(existingHeader);
				}

				existingHeader.taskDetail.push({
					workHour: workHour,
					workRemark: workRemark,
					workDate: workDate,
					colorCode: "",
				});
			}
		}
	}
	// marking weekend in week table
	public markWeekendDaysInWeekTable(headerList) {
		for (let j = 0; j < headerList.length; j++) {
			for (let k = 0; k < headerList[j].taskDetail.length; k++) {
				if (k === 0 || k === headerList[j].taskDetail.length - 1) {
					headerList[j].taskDetail[k].colorCode = "Weekend";
				}
			}
		}
	}

	// marking weekend in week total table
	public markWeekendDaysInTotalTableWeek(newTaskForTotalTableWeek) {
		for (let j = 0; j < newTaskForTotalTableWeek.length; j++) {
			for (let k = 0; k < newTaskForTotalTableWeek[j].work.length; k++) {

				if (k === 0 || k === newTaskForTotalTableWeek[j].work.length - 1) {
					newTaskForTotalTableWeek[j].work[k].colorCode = "Weekend";
				}
			}
		}
	}

	// for geting the weekend dates for a month
	public getWeekendDatesBetween(sDate, eDate) {
		const weekendDates = [];
		var currentDate = new Date(sDate);
		while (currentDate <= eDate) {
			var dayOfWeek = currentDate.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				weekendDates.push(new Date(currentDate));
			}
			// Increment the current date by one day
			currentDate.setDate(currentDate.getDate() + 1);
		}
		return weekendDates;
	}
	// on employee comboBox change
	public async onEmpComboBoxChange(oEvent) {
		// oController.onEmpChangeBusyDialog();
		aBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		aBusy.open();

		// -- hieararchy combo boxes --
		if (oEvent.getSource().sId === "empComboBox") {
			sap.ui.getCore().byId("hieararchyBox_1").setValue("");
			sap.ui.getCore().byId("hieararchyBox_2").setValue("");
			sap.ui.getCore().byId("hieararchyBox_3").setValue("");
			// sap.ui.getCore().byId("hieararchyBox_2").setVisible(false);
			// sap.ui.getCore().byId("hieararchyBox_3").setVisible(false);
		}
		// <-- hieararchy combo boxes -->

		// removing all the special date from calendar
		let oCal1 = sap.ui.getCore().byId("calendar");
		oCal1.removeAllSpecialDates();

		// setting visibility of submit button
		sap.ui.getCore().byId("subBtn").setVisible(true);
		sap.ui.getCore().byId("saveBtn").setVisible(true);

		// delete all cell editable for previous month
		this.deleteEditableForTaskTable();

		// delete all cell color for previous month
		this.deleteCellColorsForTaskTable();
		this.deleteCellColorsForTotalTable();
		headerList.length = 0;
		newTaskForTotalTable[0].work.length = 0;
		totalHour.value = 0;

		let oComboBox = oEvent.getSource();
		let oSelectedItem = oComboBox.getSelectedItem();
		if (oSelectedItem) {
			var selectedKey = oSelectedItem.getKey();
			if (!loginEmpId && selectedKey !== sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId")) {
				loginEmpId = sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId");
				sap.ui.getCore().getModel("mDataModel").setProperty("/readOnly", true);
				sap.ui.getCore().byId("subBtn").setVisible(false);
				sap.ui.getCore().byId("saveBtn").setVisible(false);
				// sap.ui.getCore().byId("remarkPopup").setEditable(false);
			}
			else if (loginEmpId && selectedKey != loginEmpId) {
				sap.ui.getCore().getModel("mDataModel").setProperty("/readOnly", true);
				sap.ui.getCore().byId("subBtn").setVisible(false);
				sap.ui.getCore().byId("saveBtn").setVisible(false);
				// sap.ui.getCore().byId("remarkPopup").setEditable(false);
			}
			else {
				sap.ui.getCore().getModel("mDataModel").setProperty("/readOnly", false);
				sap.ui.getCore().byId("subBtn").setVisible(true);
				sap.ui.getCore().byId("saveBtn").setVisible(true);
				// sap.ui.getCore().byId("remarkPopup").setEditable(true);
			}
			sap.ui.getCore().getModel("mDataModel").setProperty("/employeeId", selectedKey);
		} else {
			return;
		}

		let allTypeLeaves = await oController.transaction.getExecutedQuery('d_o2c_leave_management', { 'employee_id': selectedKey, loadAll: true });
		let leaves = allTypeLeaves.filter(item => (item.employee_id === selectedKey.toLowerCase() || item.employee_id === selectedKey.toUpperCase()) && item.leave_status === "Approved");
		sap.ui.getCore().getModel("mDataModel").setProperty('/leaves', leaves);
		// <<<<<<<<<<<change>>>>>>>>>>>
		// <<<<<<<<<<<change>>>>>>>>>>>
		let appliedleaves = allTypeLeaves.filter(item => (item.employee_id === selectedKey.toLowerCase() || item.employee_id === selectedKey.toUpperCase()) && item.leave_status === "Applied");

		sap.ui.getCore().getModel("mDataModel").setProperty('/appliedleaves', appliedleaves);
		// <<<<<<<<<<<change>>>>>>>>>>>

		let currentDate = sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
		let currentMonth = currentDate.getMonth();
		let currentYear = currentDate.getFullYear();
		let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

		// adding weekend color besis on month
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth);
		let weekEndDaysInMonth = [];
		weekEndDaysInMonth = this.getWeekendDatesBetween(firstDayOfMonth, lastDayOfMonth);

		// Holiday for perticular employee
		let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': selectedKey, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/lineManager', thisUser[0].line_manager);
		let empOrg = await oController.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': selectedKey, 'is_primary': true, loadAll: true });
		// <<<<<<<<<<<change>>>>>>>>>>>
		let allBusinessArea = sap.ui.getCore().getModel("mDataModel").getProperty("/allBusinessArea");
		let allOfficeCalendar = sap.ui.getCore().getModel("mDataModel").getProperty("/allOfficeCalendar");
		let finalHoliday = [];
		let holidayDateNameData = [];
		// for (let i = 0; i < empOrg.length; i++) {
		let bsnsArea = empOrg[0].business_area;
		let companyCode = empOrg[0].company_code;
		// let stDate = empOrg[0].active_from;
		// let edDate = empOrg[0].active_till;
		let businessArea = [];
		for (let m = 0; m < allBusinessArea.length; m++) {
			if (allBusinessArea[m].business_area === bsnsArea && allBusinessArea[m].company_code === companyCode) {
				businessArea.push(allBusinessArea[m]);
			}
		}
		let officeCalendar = [];
		if (businessArea.length > 0) {
			for (let n = 0; n < allOfficeCalendar.length; n++) {
				if (allOfficeCalendar[n].office_calendar_id === businessArea[0].office_calender) {
					officeCalendar.push(allOfficeCalendar[n]);
				}
			}
		}
		// while (stDate <= edDate) {
		for (let j = 0; j < holidayData.length; j++) {
			if (officeCalendar.length > 0 && officeCalendar[0].holiday_calender_id === holidayData[j].holiday_calender_id) {
				let tempDate = new Date(holidayData[j].holiday_date);
				finalHoliday.push(tempDate);
				// for displaying holiday name for each month
				const dateString = tempDate.toLocaleDateString('en-US', {
					month: 'short',
					day: '2-digit',
					year: 'numeric'
				});
				let oholidayDateNameData = {
					"holidayDate": dateString,
					"holidayName": holidayData[j].holiday_name
				}
				holidayDateNameData.push(oholidayDateNameData);
				// for displaying holiday name for each month
			}
		}
		// 	stDate.setDate(stDate.getDate() + 1);
		// }
		// }
		sap.ui.getCore().getModel("mDataModel").setProperty('/finalHoliday', finalHoliday);
		sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameData', holidayDateNameData);
		let holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, currentDate);
		sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);


		// applying the color for weekend
		for (let i = 0; i < finalHoliday.length; i++) {
			oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
				startDate: finalHoliday[i],
				color: "#9e050a"
			}));
		}

		for (let i = 0; i < leaves.length; i++) {
			let sDate = leaves[i].start_date;
			let eDate = leaves[i].end_date;
			let sHalf = leaves[i].half_day_startdate;
			let eHalf = leaves[i].half_day_enddate;

			var weekEndDays = [];
			weekEndDays = this.getWeekendDatesBetween(sDate, eDate);

			if (weekEndDays.length > 0) {
				let currentDate = new Date(sDate);
				while (currentDate <= eDate) {
					let leaveInWeekend = false;
					for (let j = 0; j < weekEndDays.length; j++) {
						if (currentDate.toString() === weekEndDays[j].toString()) {
							leaveInWeekend = true;
							break;
						}
					}
					if (leaveInWeekend === false) {
						if (sHalf && currentDate.toString() === sDate.toString()) {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#0af034"
							}));

						} else if (eHalf && currentDate.toString() === eDate.toString()) {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#0af034"
							}));
						}
						else {
							oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
								startDate: new Date(currentDate),
								color: "#066613"
							}));
						}
					}
					currentDate.setDate(currentDate.getDate() + 1);
				}
			}
			else {
				let currentDate = new Date(sDate);
				while (currentDate <= eDate) {
					if (sHalf && currentDate.toString() === sDate.toString()) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#0af034"
						}));

					} else if (eHalf && currentDate.toString() === eDate.toString()) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#0af034"
						}));
					}
					else {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(currentDate),
							color: "#066613"
						}));
					}

					currentDate.setDate(currentDate.getDate() + 1);
				}
			}
		}
		// adding color in calendar for applied leave
		for (let i = 0; i < appliedleaves.length; i++) {
			let sDate = appliedleaves[i].start_date;
			let eDate = appliedleaves[i].end_date;
			var weekEndDays = [];
			weekEndDays = this.getWeekendDatesBetween(sDate, eDate);
			if (weekEndDays.length > 0) {
				let date = new Date(sDate);
				while (date <= eDate) {
					let appliedLeaveInWeekend = false;
					for (let j = 0; j < weekEndDays.length; j++) {
						if (date.toString() === weekEndDays[j].toString()) {
							appliedLeaveInWeekend = true;
							break;
						}
					}
					if (appliedLeaveInWeekend === false) {
						oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(date),
							color: "#0407cc"
						}));
					}
					date.setDate(date.getDate() + 1);
				}
			}
			else {
				oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
					startDate: sDate,
					endDate: eDate,
					color: "#0407cc"
				}));
			}

		}
		//appling the color for weekends 
		// let oCalendar = sap.ui.getCore().byId("calendar");
		for (let i = 0; i < weekEndDaysInMonth.length; i++) {
			oCal1.addSpecialDate(new sap.ui.unified.DateTypeRange({
				startDate: weekEndDaysInMonth[i],
				color: "#87CEEB"
			}));
		}
		// <<<<<<<<<<<change>>>>>>>>>>>
		// let allAssignedTask = sap.ui.getCore().getModel("mDataModel").getProperty("/allAssignedTask");
		// let allTaskData = sap.ui.getCore().getModel("mDataModel").getProperty("/mainTask");
		let assignedTask = await oController.transaction.getExecutedQuery('d_o2c_task_assignment', { 'employee_id': selectedKey, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty("/assignedTask", assignedTask);
		let assigedTaskIds = [];
		for (let i = 0; i < assignedTask.length; i++) {
			assigedTaskIds.push(assignedTask[i].task_id);
		}
		sap.ui.getCore().getModel("mDataModel").setProperty("/taskIdsForEmployee", assigedTaskIds);
		// getting all timesheet booking with array filter
		let taskDataForEmployee = [];
		if (assigedTaskIds.length > 0) {
			taskDataForEmployee = await oController.transaction.getExecutedQuery('q_task_assignment_booking', { "task_id": assigedTaskIds, loadAll: true });
		}
		else {
			taskDataForEmployee = [];
		}
		sap.ui.getCore().getModel("mDataModel").setProperty("/taskDataForEmployee", taskDataForEmployee);
		// used in taskLinkPress function for fetch status for perticular task
		let timesheetTaskTableData = await oController.transaction.getExecutedQuery('d_o2c_timesheet_task', { "task_id": assigedTaskIds, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/timesheetTaskTableData', timesheetTaskTableData);
		// <<<<<<<<<<<change>>>>>>>>>>>

		this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
		// storing smallest and greatest date for submit in timesheet header table
		this.findSmallestAndGreatestDates(headerList);
		// modifying the header list
		this.generateUpdatedMonthData(headerList, currentYear, currentMonth);
		// adding color for leave days
		this.markLeaveDaysInTaskTable(headerList, leaves);
		// marking applied leave days for task table
		this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
		// adding color for holidays in task table
		this.markHolidayInTaskTable(headerList, finalHoliday);
		// adding color for weekend days in Task Table
		this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
		this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);
		// auto fill for leaves in total table
		this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
		// auto fill for leaves in total table
		this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
		// auto fill for Holidays in total table
		this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
		// auto fill for Weekends in total table
		this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

		sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
		sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
		sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);

		// Adding color in besis of colorCode in task table
		this.applyCellColorsForTaskTable();
		// Adding color on total table
		this.applyCellColorsForTotalTable();
		// for editable and non editable
		this.applyEditableForTaskTable();


		let submitHistoryforMonth = [];
		let submitHistory = await oController.transaction.getExecutedQuery('d_o2c_timesheet_header', { 'employee_id': selectedKey, loadAll: true });
		sap.ui.getCore().getModel("mDataModel").setProperty('/submitHistory', submitHistory);
		// <<<<<<<<<<<change>>>>>>>>>>>

		// submit History logic for submit button
		for (let i = 0; i < submitHistory.length && submitHistory.length > 0; i++) {
			if (submitHistory[i].from_date.getMonth() === firstDayOfMonth.getMonth() && submitHistory[i].from_date.getFullYear() === firstDayOfMonth.getFullYear()) {
				submitHistoryforMonth.push(submitHistory[i]);
			}
		}
		if (submitHistoryforMonth.length > 0) {
			submitHistoryforMonth.sort((a, b) => {
				const submitIdA = parseInt(a.submit_id.substring(3), 10);
				const submitIdB = parseInt(b.submit_id.substring(3), 10);

				return submitIdB - submitIdA;
			});

			let approverRemark = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver', { 'submit_id': submitHistoryforMonth[0].submit_id, loadAll: true });
			if (approverRemark.length) {
				let approver = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': approverRemark[0].approver, loadAll: true });
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', approver[0] ? approver[0].full_name : 'Admin');
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', approverRemark[0].approver_remark);
			} else {
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', "No Remark");
			}

			if (submitHistoryforMonth[0].over_all_status != 'Rejected') {
				sap.ui.getCore().byId("subBtn").setVisible(false);
				sap.ui.getCore().byId("saveBtn").setVisible(false);
			}
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitHistoryforMonth[0].over_all_status);
		} else {
			let tempStatus = "";
			sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', tempStatus);
		}
		let submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');

		aBusy.close();
	}
	// on empcombobox live change 
	public onEmpComboBoxLiveChange(oEvent) {
		var sValue = oEvent.getParameter("value");
		var oFilter = new sap.ui.model.Filter([
			new sap.ui.model.Filter("full_name", sap.ui.model.FilterOperator.Contains, sValue),
			new sap.ui.model.Filter("employee_id", sap.ui.model.FilterOperator.Contains, sValue)
		], false);

		var oComboBox = sap.ui.getCore().getView().byId("empComboBox");
		oComboBox.getBinding("items").filter([oFilter]);
	}
	// onSave button
	public onSave() {
		var taskTable = sap.ui.getCore().byId("Table");
		var taskItems = taskTable.getItems();
		if (taskItems.length < 1) {
			sap.m.MessageToast.show("There is no task to save.");
			return;
		}

		if (sap.ui.getCore().getModel("mDataModel").getProperty('/numericCheck')) {
			sap.m.MessageToast.show("Accept only Numeric value");
			return;
		} else if (sap.ui.getCore().getModel("mDataModel").getProperty('/workHourCheck')) {
			sap.m.MessageToast.show("Work hour should be less than 24");
			return;
		}

		let comboBoxKey = sap.ui.getCore().getModel("mDataModel").getProperty("/comboBoxKey");
		// let comboBoxKey = this.tm.getTN('comboBoxKey').getData();
		if (comboBoxKey === 'week') {
			return;
			// let weekTask = sap.ui.getCore().getModel("mDataModel").getProperty("/task1");
			let weekTask = this.tm.getTN('task1').getData();
			let transformedData = [];
			for (let task of weekTask) {
				for (let taskDetail of task.taskDetail) {
					let transformedItem = {
						// "actual_hours_worked": parseFloat(taskDetail.workHour),
						"hours_worked": Number(taskDetail.workHour),
						"remarks": taskDetail.workRemark,
						"booking_date": taskDetail.workDate,
						"task_id": task.taskName
					};
					transformedData.push(transformedItem);
				}
			}
			// let totalTask = sap.ui.getCore().getModel("mDataModel").getProperty("/mainTask");
			let totalTask = this.tm.getTN('mainTask').getData();
			for (let i = 0; i < totalTask.length; i++) {
				for (let j = 0; j < transformedData.length; j++) {
					if (totalTask[i].booking_date.toString() === transformedData[j].booking_date.toString() && totalTask[i].task_id === transformedData[j].task_id) {
						// totalTask.splice(i,1);
						// totalTask.push(transformedData[j]);
						totalTask[i].hours_worked = transformedData[j].hours_worked;
					}
				}
			}

			// this.getView().getModel("mDataModel").setProperty('/mainTask', totalTask);
			this.tm.getTN('mainTask').setData(totalTask);
			// this.getView().getModel("mDataModel").getProperty("/mainTask").getTransaction().commitP();
			this.tm.getTN('mainTask').getData().getTransaction().commitP();

			headerListWeek = weekTask;
			newTaskForTotalTableWeek[0].work.length = 0;
			totalHourWeek.value = 0;
			this.calculateTotalHoursTask(headerListWeek, newTaskForTotalTableWeek, totalHourWeek);
			this.markLeaveDaysInTotalTable(newTaskForTotalTableWeek, leaveData);

			this.getView().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTableWeek);
			this.getView().getModel("mDataModel").setProperty('/totalWorkHour', totalHourWeek);
			this.getView().getModel("mDataModel").setProperty('/task1', headerListWeek);

		}
		else {
			let monthTask = sap.ui.getCore().getModel("mDataModel").getProperty("/task1");
			// let monthTask = this.tm.getTN('task1').getData();
			let transformedData = [];
			for (let task of monthTask) {
				for (let taskDetail of task.taskDetail) {
					let transformedItem = {
						// "actual_hours_worked": parseFloat(taskDetail.workHour),
						"hours_worked": Number(taskDetail.workHour),
						"remarks": taskDetail.workRemark,
						"booking_date": taskDetail.workDate,
						"task_id": task.taskId
					};
					transformedData.push(transformedItem);
				}
			}
			// <<<<<<<<<<<change>>>>>>>>>>>
			// let totalTask = sap.ui.getCore().getModel("mDataModel").getProperty("/mainTask");
			let totalTask = sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee");
			// <<<<<<<<<<<change>>>>>>>>>>>
			for (let i = 0; i < totalTask.length; i++) {
				for (let j = 0; j < transformedData.length; j++) {
					if (totalTask[i].booking_date.toString() === transformedData[j].booking_date.toString() && totalTask[i].task_id === transformedData[j].task_id) {
						totalTask[i].hours_worked = transformedData[j].hours_worked;
					}
				}
			}

			// <<<<<<<<<<<change>>>>>>>>>>> mainTask -> taskDataForEmployee
			sap.ui.getCore().getModel("mDataModel").setProperty('/taskDataForEmployee', totalTask);
			sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee").getTransaction().commitP();

			// auto fill for Weekends in total table
			let currentDate = sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
			let currentMonth = currentDate.getMonth();
			let currentYear = currentDate.getFullYear();
			let finalHoliday = sap.ui.getCore().getModel("mDataModel").getProperty('/finalHoliday');
			let appliedleaves = sap.ui.getCore().getModel("mDataModel").getProperty('/appliedleaves');
			// auto fill for leaves in total table
			let leaves = sap.ui.getCore().getModel("mDataModel").getProperty('/leaves');
			headerList.length = 0;
			this.processTaskDataToMonthly(totalTask, currentMonth, currentYear, headerList);
			// modifying the header list
			this.generateUpdatedMonthData(headerList, currentYear, currentMonth);
			// adding color for leave days
			this.markLeaveDaysInTaskTable(headerList, leaves);
			// marking applied leave days for task table
			this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
			// adding color for holidays in task table
			this.markHolidayInTaskTable(headerList, finalHoliday);
			// adding color for weekend days in Task Table
			this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
			// headerList = monthTask;
			newTaskForTotalTable[0].work.length = 0;
			totalHour.value = 0;
			this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

			this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);

			this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);
			// auto fill for applied leaves in total table

			this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);

			this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);

			sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
			// this.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
			sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
			// this.tm.getTN('totalWorkHour').setData(totalHour);
			sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
			// this.tm.getTN('task1').setData(headerList);
		}

		sap.m.MessageToast.show("Saved Successfully");
	}
	// onSubmit button
	public async onSubmitBeta() {
		// debugger;
		var that = this;


		var taskTable = sap.ui.getCore().byId("Table");

		var oBinding = taskTable.getBinding("items");
		oBinding.filter([]);

		var taskItems = taskTable.getItems();
		if (taskItems.length < 1) {
			sap.m.MessageToast.show("There is no task to submit.");
			return;
		}

		//setting Leave task visibility false 
		this.onTableUpdateFinished();

		for (var i = 0; i < taskItems.length; i++) {
			var tItem = taskItems[i];
			var tCells = tItem.getCells();
			for (var j = 0; j < tCells.length - 1 && j < tItem.oBindingContexts.mDataModel.getObject().taskDetail.length; j++) {
				var worktime = tItem.oBindingContexts.mDataModel.getObject().taskDetail[j].workHour;

				if (worktime && !this.isNumeric(worktime)) {
					if (worktime != "") {
						sap.m.MessageToast.show("Work hour should not be character.");
						tCells[j + 1].setValueState("Error");
						return;
					}
				}
				else if (worktime && worktime > 24) {
					sap.m.MessageToast.show("Work hour should be less than 24 .");
					tCells[j + 1].setValueState("Error");
					return;
				}
			}
		}

		var oTable = sap.ui.getCore().byId("totalTable");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure
		let lessWork = false;
		let moreWork = false;

		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().work.length; j++) {
				var worktime = oItem.oBindingContexts.mDataModel.getObject().work[j].workHour;
				var specialDay = oItem.oBindingContexts.mDataModel.getObject().work[j].colorCode;
				if (specialDay === "Applied") {
					sap.m.MessageToast.show("You should not have applied leave");
					return;
				}
				else if (worktime < 8 && specialDay != 'Weekend' && specialDay != 'Holiday') {
					lessWork = true;
					let date = j + 1;
					sap.m.MessageToast.show("Work hour should not be less than 8 on day" + date + ".");
					aCells[j].setValueState("Error");
					return;
				}
				else if (worktime > 24) {
					let date = j + 1;
					sap.m.MessageToast.show("Work hour should be less than 24 on day " + date + ".");
					aCells[j].setValueState("Error");
					return;
				}
			}
		}
		if (!lessWork) {
			sap.m.MessageBox.confirm("Do you want to submit ?", {
				title: "Confirm",
				onClose: async function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						oController.onSubmitBusyDialog();
						// for filling the timesheet task table
						let employeeId = sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId");
						let fromDate = sap.ui.getCore().getModel("mDataModel").getProperty("/smallestDate");
						let toDate = sap.ui.getCore().getModel("mDataModel").getProperty("/greatestDate");
						// <<<<<<<<<<<change>>>>>>>>>>> adding this line for commitP() and save data
						let submitHistory = sap.ui.getCore().getModel("mDataModel").getProperty('/submitHistory');
						let taskIdsForEmployee = sap.ui.getCore().getModel("mDataModel").getProperty("/taskIdsForEmployee");
						timeSheet_Task = await oController.transaction.getExecutedQuery('d_o2c_timesheet_task', { "task_id": taskIdsForEmployee, loadAll: true });
						sap.ui.getCore().getModel("mDataModel").setProperty('/timeSheetTask', timeSheet_Task);
						// to know if this is self task or not
						let assignedTask = sap.ui.getCore().getModel("mDataModel").getProperty('/assignedTask');
						let isAlreadySubmitted = false;

						// for timesheet log table data prepare
						let tsHeaderLog = "";
						let tsTaskLog = "";
						let tsTaskIds = "";
						for (let i = 0; i < submitHistory.length; i++) {

							// timeSheet_header[i].employee_id === employeeId
							if (submitHistory[i].employee_id === employeeId && submitHistory[i].from_date.toString() === fromDate.toString() && submitHistory[i].over_all_status === 'Rejected') {
								submitHistory[i].over_all_status = 'Submitted';
								tsHeaderLog = `employee_id: ${employeeId}, from_date: ${submitHistory[i].fromDate}, over_all_status: "Submitted", to_date: ${submitHistory[i].toDate}`;

								for (let j = 0; j < timeSheet_Task.length; j++) {
									let taskAssignByHimself = [];
									if (timeSheet_Task[j].submit_id === submitHistory[i].submit_id) {
										taskAssignByHimself = assignedTask.filter(item => item.task_id === timeSheet_Task[j].task_id && (item.assigned_by === employeeId.toLowerCase() || item.assigned_by === employeeId.toUpperCase()));
										if (taskAssignByHimself.length) {
											timeSheet_Task[j].status = 'Approved';
											tsTaskLog = tsTaskLog + `submit_id: ${timeSheet_Task[j].submit_id}, status: "Approved", task_id: ${timeSheet_Task[j].task_id} `;
											tsTaskIds = tsTaskIds + `task_id: ${timeSheet_Task[j].task_id} `
										} else {
											timeSheet_Task[j].status = 'Submitted';
											tsTaskLog = tsTaskLog + `submit_id: ${timeSheet_Task[j].submit_id}, status: "Submitted", task_id: ${timeSheet_Task[j].task_id} `;
											tsTaskIds = tsTaskIds + `task_id: ${timeSheet_Task[j].task_id} `
										}

									}
								}
								isAlreadySubmitted = true;

								// d_o2c_timesheet log Data
								// await oController.transaction.createEntityP('d_o2c_timesheet_log', {
								// 	"submit_id": submitHistory[i].submit_id,
								// 	"task_id": tsTaskIds,
								// 	"action": "Submitted",
								// 	"action_by": employeeId,
								// 	"action_date": new Date(),
								// 	"employee_id": employeeId,
								// 	"ts_header_query": tsHeaderLog,
								// 	"ts_header_response": "",
								// 	"ts_task_query": tsTaskLog,
								// 	"ts_task_response": "",
								// 	"ts_approver_query": "", //iFromDate,
								// 	"ts_approver_response": ""
								// });
								break;
							}
						}
						// finding submit id in timesheet task table

						if (!isAlreadySubmitted) {
							let previousSubmitId;
							let nextSubmitId;
							let currentNumber;

							let headerResponseLog = "";
							let submittedOn = new Date();
							let newSubmit = await submitHistory.newEntityP(0, { employee_id: employeeId, from_date: fromDate, over_all_status: "Submitted", submitted_on: submittedOn, to_date: toDate }, true);
							let newSubmitId = newSubmit.submit_id;

							if (newSubmit) {
								headerResponseLog = "Success"
							}

							// for Timesheet log table , storing the data
							let tsHeaderLog = `employee_id: ${employeeId}, from_date: ${fromDate}, over_all_status: "Submitted", to_date: ${toDate}`;
							let tsTaskLog = "";
							let tsTaskIds = "";
							let taskResponseLog = "";
							let taskAssignByHimself = [];
							let newCreateTaskIndex;
							for (let i = 0; i < headerList.length; i++) {
								// submit_id: nextSubmitId,
								taskAssignByHimself = assignedTask.filter(item => item.task_id === headerList[i].taskId && (item.assigned_by === employeeId.toLowerCase() || item.assigned_by === employeeId.toUpperCase()));
								if (taskAssignByHimself.length) {
									newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: newSubmitId, status: "Approved", task_id: headerList[i].taskId }, true);
									tsTaskLog = tsTaskLog + `submit_id: ${newSubmitId}, status: "Approved", task_id: ${headerList[i].taskId} `;
									tsTaskIds = tsTaskIds + `task_id: ${headerList[i].taskId} `
									if (newCreateTaskIndex) {
										taskResponseLog = taskResponseLog + 'Success ,';
									}
								} else {
									newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: newSubmitId, status: "Submitted", task_id: headerList[i].taskId }, true);
									tsTaskLog = tsTaskLog + `submit_id: ${newSubmitId}, status: "Submitted", task_id: ${headerList[i].taskId}`;
									tsTaskIds = tsTaskIds + `task_id: ${headerList[i].taskId}`;
									if (newCreateTaskIndex) {
										taskResponseLog = taskResponseLog + 'Success ,';
									}
								}

							}

							// Modifying work hour as 0 on holiday for Leave task
							let assignLeaveTask = await oController.transaction.getExecutedQuery('d_o2c_task_assignment', { "task_start_date": fromDate, "taskType": "Leave", "employee_id": employeeId, loadAll: true });
							let leaveTaskBooking = [];
							if (assignLeaveTask.length) {
								leaveTaskBooking = await oController.transaction.getExecutedQuery('q_task_assignment_booking', { "task_id": assignLeaveTask[0].task_id, loadAll: true });
							}
							let holidays = sap.ui.getCore().getModel("mDataModel").getProperty('/finalHoliday');
							const holidaySet = new Set(holidays.map(date => new Date(date).toISOString()));
							for (let i = 0; i < leaveTaskBooking.length; i++) {
								// Convert the date to ISO string and check if it's in the Set
								if (holidaySet.has(new Date(leaveTaskBooking[i].booking_date).toISOString())) {
									leaveTaskBooking[i].hours_worked = 0;
								}
							}



							// for timesheet log
							let d = new Date();

							// d_o2c_timesheet log Data
							// await oController.transaction.createEntityP('d_o2c_timesheet_log', {
							// 	"submit_id": newSubmitId,
							// 	"task_id": tsTaskIds,
							// 	"action": "Submitted",
							// 	"action_by": employeeId,
							// 	"action_date": d,
							// 	"employee_id": employeeId,
							// 	"ts_header_query": tsHeaderLog,
							// 	"ts_header_response": headerResponseLog,
							// 	"ts_task_query": tsTaskLog,
							// 	"ts_task_response": taskResponseLog,
							// 	"ts_approver_query": "", //iFromDate,
							// 	"ts_approver_response": ""
							// });
							// <<<<<<<<<<<change>>>>>>>>>>>
						}
						sap.ui.getCore().getModel("mDataModel").setProperty('/timeSheetTask', timeSheet_Task);
						sap.ui.getCore().getModel("mDataModel").setProperty('/submitHistory', submitHistory);

						oController.transaction.commitP();

						let submitHistoryforMonth = [];
						let currentDate = sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
						let currentMonth = currentDate.getMonth();
						let currentYear = currentDate.getFullYear();
						let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

						// adding weekend color besis on month
						var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
						// submit History logic for submit button
						for (let i = 0; i < submitHistory.length && submitHistory.length > 0; i++) {
							if (submitHistory[i].from_date.getMonth() === firstDayOfMonth.getMonth() && submitHistory[i].from_date.getFullYear() === firstDayOfMonth.getFullYear()) {
								submitHistoryforMonth.push(submitHistory[i]);
							}
						}
						if (submitHistoryforMonth.length > 0) {
							submitHistoryforMonth.sort((a, b) => {
								const submitIdA = parseInt(a.submit_id.substring(3), 10);
								const submitIdB = parseInt(b.submit_id.substring(3), 10);
								return submitIdB - submitIdA;
							});

							if (submitHistoryforMonth[0].over_all_status != 'Rejected') {
								sap.ui.getCore().byId("subBtn").setVisible(false);
								sap.ui.getCore().byId("saveBtn").setVisible(false);
							}
							sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitHistoryforMonth[0].over_all_status);
						} else {
							let tempStatus = "";
							sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', tempStatus);
						}
						let submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');
						sap.m.MessageToast.show("Data submitted successfully.");
					}
					else {
						sap.m.MessageToast.show("Submit operation cancelled.");
					}
				}
			});
		}
		else {
			sap.m.MessageToast.show("Fills work hour properly !.");
		}
	}
	// on press on task link
	public async taskLinkPress(oEvent) {
		// oController.onTaskLinkBusyDialog();
		let monthTask = sap.ui.getCore().getModel("mDataModel").getProperty("/nonUpdateHeaderList");
		// let monthTask = this.tm.getTN('nonUpdateHeaderList').getData();
		let YdirectPath = oEvent.getSource().getParent().getBindingContextPath();
		let RowData = sap.ui.getCore().getModel("mDataModel").getProperty(YdirectPath);
		// let RowData = this.tm.getTN('YdirectPath').getData();
		let taskId = RowData.taskId;
		// all assign task for this employee
		let assignedTask = sap.ui.getCore().getModel("mDataModel").getProperty("/assignedTask");
		let thisTask = assignedTask.filter(item => item.task_id === taskId);
		let nameForThisTask = thisTask[0].task_name;
		let plannedHourForThisTask = thisTask[0].planned_hours;
		let taskStartDate = thisTask[0].task_start_date.toString();
		let startIndex = taskStartDate.indexOf("00");
		taskStartDate = taskStartDate.slice(0, startIndex);
		let taskEndDate = thisTask[0].task_end_date.toString();
		let endIndex = taskEndDate.indexOf("00");
		taskEndDate = taskEndDate.slice(0, endIndex);
		let thisProjectID = thisTask[0].project_id;
		let thisProjectName = thisTask[0].project_name;
		let thisProjectManager = thisTask[0].assigned_by;

		sap.ui.getCore().getModel("mDataModel").setProperty("/nameForThisTask", nameForThisTask);
		sap.ui.getCore().getModel("mDataModel").setProperty("/plannedHourForThisTask", plannedHourForThisTask);
		sap.ui.getCore().getModel("mDataModel").setProperty("/taskStartDate", taskStartDate);
		sap.ui.getCore().getModel("mDataModel").setProperty("/taskEndDate", taskEndDate);
		sap.ui.getCore().getModel("mDataModel").setProperty("/thisProjectID", thisProjectID);
		sap.ui.getCore().getModel("mDataModel").setProperty("/thisProjectName", thisProjectName);


		// getting timesheet task tale data for this employee
		let statusForThisTask;
		let isTaskAvailable = false;
		let timesheetTask = sap.ui.getCore().getModel("mDataModel").getProperty("/timesheetTaskTableData");
		for (let i = 0; i < timesheetTask.length; i++) {
			if (timesheetTask[i].task_id === taskId) {
				isTaskAvailable = true;
				break;
			}
		}

		var oView = this.getView();
		// Load the popover fragment
		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_ui5_taskPopup";
		if (!this._pOver) {
			let oEven = oEvent.getSource();
			this._pOver = await sap.ui.core.Fragment.load({
				name: viewName,
				controller: this
			});
			oView.addDependent(this._pOver);

			this._pOver.openBy(oEven);
		}
		else {
			this._pOver.openBy(oEvent.getSource());
		}
		// set the name of project manager
		let thisProjectManagerName = (await oController.transaction.getExecutedQuery('d_o2c_employee', { "employee_id": thisProjectManager, loadAll: true }))[0].full_name;
		sap.ui.getCore().getModel("mDataModel").setProperty("/thisProjectManagerName", thisProjectManagerName);

		if (isTaskAvailable) {
			// change 07/02/24 for with same taskId there can be more submit id , need to fetch status from that
			let isDate = sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
			let allMonthtaskWithSameId = await oController.transaction.getExecutedQuery('d_o2c_timesheet_task', { "task_id": taskId, loadAll: true });
			let allSubmitIdForThatTask = [];
			for (let i = 0; i < allMonthtaskWithSameId.length; i++) {
				allSubmitIdForThatTask.push(allMonthtaskWithSameId[i].submit_id)
			}
			let submittedDataForThatTask = await oController.transaction.getExecutedQuery('d_o2c_timesheet_header', { "submit_id": allSubmitIdForThatTask, loadAll: true });

			submittedDataForThatTask = submittedDataForThatTask.filter(item => {
				let fromDate = new Date(item.from_date);
				let toDate = new Date(item.to_date);
				return isDate.getMonth() >= fromDate.getMonth() && isDate.getMonth() <= toDate.getMonth();
			});
			if (submittedDataForThatTask.length === 0) {
				statusForThisTask = "Not Submitted";
			} else {
				for (let i = 0; i < allMonthtaskWithSameId.length; i++) {
					if (allMonthtaskWithSameId[i].task_id === taskId && allMonthtaskWithSameId[i].submit_id === submittedDataForThatTask[0].submit_id) {
						statusForThisTask = allMonthtaskWithSameId[i].status;
						break;
					}
				}
			}

			// statusForThisTask = timesheetTask.filter(item => item.task_id === taskId)[0].status;
		} else {
			// statusForThisTask = timesheetTask.filter(item => item.task_id === taskId)[0].status;
			statusForThisTask = "Not Submitted";
		}
		sap.ui.getCore().getModel("mDataModel").setProperty("/statusForThisTask", statusForThisTask);

		this.findSmallestAndGreatestDatesByTaskId(monthTask, taskId);

		// var oView = this.getView();
		// // Load the popover fragment
		// let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.p_ui5_taskPopup";
		// if (!this._pOver) {
		// 	let oEven = oEvent.getSource();
		// 	this._pOver = await sap.ui.core.Fragment.load({
		// 		name: viewName,
		// 		controller: this
		// 	});
		// 	oView.addDependent(this._pOver);
		// 	this._pOver.openBy(oEven);
		// }
		// else {
		// 	this._pOver.openBy(oEvent.getSource());
		// }

	}
	// storing smallest and greatest date for a perticular task
	public findSmallestAndGreatestDatesByTaskId(headerList, taskId) {

		let sDate, eDate;
		for (let i = 0; i < headerList.length; i++) {
			if (headerList[i].taskId === taskId) {
				sDate = headerList[i].taskDetail[0].workDate;
				eDate = headerList[i].taskDetail[headerList[i].taskDetail.length - 1].workDate;
				break;
			}
		}
		let firstDateString = sDate.toString();
		let firstOccurrence = firstDateString.indexOf("00");
		firstDateString = firstDateString.slice(0, firstOccurrence);
		let secondDateString = eDate.toString();
		let secondOccurrence = secondDateString.indexOf("00");
		secondDateString = secondDateString.slice(0, secondOccurrence);
		sap.ui.getCore().getModel("mDataModel").setProperty('/sDate', firstDateString);
		// this.tm.getTN('sDate').setData(firstDateString);
		sap.ui.getCore().getModel("mDataModel").setProperty('/eDate', secondDateString);
		// this.tm.getTN('eDate').setData(secondDateString);
	}

	// description box for all input box
	public async openDescriptionBox(oEvent) {

		const YdirectPath = oEvent.getSource().getParent().getBindingContextPath();
		const x = oEvent.getSource().data("column");
		const RowData = this.getView().getModel("mDataModel").getProperty(YdirectPath);
		// const RowData = this.tm.getTN('YdirectPath').getData();
		sap.ui.getCore().getModel("mDataModel").setProperty('/rowTaskName', RowData.taskId);
		// this.tm.getTN('rowTaskName').setData(RowData.taskName);
		const columnData = RowData.taskDetail[x];
		sap.ui.getCore().getModel("mDataModel").setProperty('/remarkDataPosition', columnData);
		// this.tm.getTN('remarkDataPosition').setData(columnData);
		let remark = columnData.workRemark;
		let modifiedBy = columnData.modifiedBy;
		let modifiedOn = columnData.modifiedOn;
		// this.getView().getModel().setProperty(YdirectPath+"/taskDetail/"+x+"/workRemark/", "Nothig");

		let firstDateString = modifiedOn.toString();
		firstDateString = firstDateString.slice(0, 16);

		// to bind the remakrs with dialogbox
		sap.ui.getCore().getModel("mDataModel").setProperty('/workRemark', remark);
		// this.tm.getTN('workRemark').setData(remark);
		sap.ui.getCore().getModel("mDataModel").setProperty('/modifiedBy', modifiedBy);
		// this.tm.getTN('modifiedBy').setData(modifiedBy);
		sap.ui.getCore().getModel("mDataModel").setProperty('/modifiedOn', firstDateString);
		// this.tm.getTN('modifiedOn').setData(firstDateString);

		var oView = this.getView();
		// Load the popover fragment
		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_ui5_popup";
		if (!this._oPopover) {
			let oEven = oEvent.getSource();
			this._oPopover = await sap.ui.core.Fragment.load({
				name: viewName,
				controller: this
			});
			oView.addDependent(this._oPopover);
			var oInput = sap.ui.getCore().byId("remarkPopup");
			if (sap.ui.getCore().getModel("mDataModel").getProperty("/readOnly")) {
				oInput.setEditable(false);
			} else if (sap.ui.getCore().getModel("mDataModel").getProperty("/submitStatus") === "Rejected" || sap.ui.getCore().getModel("mDataModel").getProperty("/submitStatus") === "") {
				oInput.setEditable(true);
			}
			this._oPopover.openBy(oEven);
		}
		else {
			var oInput = sap.ui.getCore().byId("remarkPopup");
			if (sap.ui.getCore().getModel("mDataModel").getProperty("/readOnly")) {
				oInput.setEditable(false);
			} else if (sap.ui.getCore().getModel("mDataModel").getProperty("/submitStatus") === "Rejected" || sap.ui.getCore().getModel("mDataModel").getProperty("/submitStatus") === "") {
				oInput.setEditable(true);
			}
			this._oPopover.openBy(oEvent.getSource());
		}
	}
	// on close dyalog box
	public async onTaskDialogClose() {
		// sap.ui.getCore().byId("taskDialog--taskDialog").close();
		this.oDialog.close();
	}
	// onInputChange function
	public onInputChange(oEvent) {
		let remarkDataPosition = sap.ui.getCore().getModel("mDataModel").getProperty("/remarkDataPosition");
		let rowTaskName = sap.ui.getCore().getModel("mDataModel").getProperty("/rowTaskName");
		var cDate = new Date(remarkDataPosition.workDate);

		let totalTask = sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee");
		// <<<<<<<<<<<change>>>>>>>>>>>
		let newRemarkValue = oEvent.mParameters.newValue;
		if (newRemarkValue.length > 250) {
			sap.m.MessageToast.show("Remark should be less than 250 character.", { duration: 5000 });
			return;
		}
		for (let i = 0; i < totalTask.length; i++) {

			if (totalTask[i].booking_date.toString() === cDate.toString() && totalTask[i].task_id === rowTaskName) {
				totalTask[i].remarks = newRemarkValue;
			}
		}
		// <<<<<<<<<<<change>>>>>>>>>>>
		sap.ui.getCore().getModel("mDataModel").setProperty('/taskDataForEmployee', totalTask);
		sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee").getTransaction().commitP();
		// <<<<<<<<<<<change>>>>>>>>>>>

		// update the headerList data model
		let monthData = sap.ui.getCore().getModel("mDataModel").getProperty("/task1");
		for (let i = 0; i < monthData.length; i++) {
			for (let j = 0; j < monthData[i].taskDetail.length; j++) {
				if (monthData[i].taskDetail[j].workDate.toString() === cDate.toString() && monthData[i].taskId === rowTaskName) {
					monthData[i].taskDetail[j].workRemark = newRemarkValue;
				}
			}
		}
		headerList = monthData;
		sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
	}
	// Check for numeric
	public isNumeric(sValue) {
		// return /^[0-9]+$/.test(sValue);
		return /^[0-9.]+$/.test(sValue);
	}
	// on task hour change it will save autometically
	public onHourChange(oEvent) {
		var oInput = oEvent.getSource();
		let newWorkHour = oEvent.mParameters.newValue;
		if (!this.isNumeric(newWorkHour)) {
			// If not numeric, set the value state to Error
			if (newWorkHour != "") {
				sap.m.MessageToast.show("Accept only Numeric value");
				sap.ui.getCore().getModel("mDataModel").setProperty('/numericCheck', true);
				oInput.setValueState("Error");
				return;
			}
		}

		if (newWorkHour > 24) {
			sap.m.MessageToast.show("Work hour should be less than 24");
			sap.ui.getCore().getModel("mDataModel").setProperty('/workHourCheck', true);
			oInput.setValueState("Error");
			return;
		}
		oInput.setValueState("None");
		sap.ui.getCore().getModel("mDataModel").setProperty('/numericCheck', false);
		sap.ui.getCore().getModel("mDataModel").setProperty('/workHourCheck', false);

		// let YdirectPath = oEvent.getSource().getParent().getBindingContextPath();
		// let x = oEvent.getSource().data("column");
		// let RowData = sap.ui.getCore().getModel("mDataModel").getProperty(YdirectPath);
		// let columnData = RowData.taskDetail[x];
		// let taskId = RowData.taskId;
		// let cDate = columnData.workDate;
		// 						// <<<<<<<<<<<change>>>>>>>>>>>
		// let totalTask = sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee");
		// 						// <<<<<<<<<<<change>>>>>>>>>>>

		// for (let i = 0; i < totalTask.length; i++) {
		// 	if (totalTask[i].booking_date.toString() === cDate.toString() && totalTask[i].task_id === taskId) {
		// 		totalTask[i].hours_worked = newWorkHour;
		// 		totalTask[i].update_remark = false;
		// 	}
		// }
		// 						// <<<<<<<<<<<change>>>>>>>>>>>
		// sap.ui.getCore().getModel("mDataModel").setProperty('/taskDataForEmployee', totalTask);
		// sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee").getTransaction().commitP();
		// 						// <<<<<<<<<<<change>>>>>>>>>>>

		// // update the headerList data model
		// let monthData = sap.ui.getCore().getModel("mDataModel").getProperty("/task1");
		// for (let i = 0; i < monthData.length; i++) {
		// 	for (let j = 0; j < monthData[i].taskDetail.length; j++) {
		// 		if (monthData[i].taskDetail[j].workDate.toString() === cDate.toString() && monthData[i].taskId === taskId) {
		// 			monthData[i].taskDetail[j].workHour = newWorkHour;
		// 			monthData[i].taskDetail[j].updateRemark = false;
		// 		}
		// 	}
		// }
		// headerList = monthData;
		// newTaskForTotalTable[0].work.length = 0;
		// totalHour.value = 0;

		// let isMonth =  sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
		// let currentYear = isMonth.getFullYear();
		// let currentMonth = isMonth.getMonth();
		// let appliedleaves = sap.ui.getCore().getModel("mDataModel").getProperty("/appliedleaves");
		// let leaves = sap.ui.getCore().getModel("mDataModel").getProperty("/leaves");
		// let finalHoliday = sap.ui.getCore().getModel("mDataModel").getProperty("/finalHoliday");
		// let employeeId = sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId");

		// this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);
		// this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
		// // auto fill for leaves in total table
		// this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
		// // auto fill for Holidays in total table
		// this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
		// // auto fill for Weekends in total table
		// this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

		// sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
		// sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
		// this.applyCellColorsForTaskTable();
	}

	// month change in calendar
	public async monthChange(oEvent) {
		aBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		aBusy.open();

		let taskDataForEmployee = sap.ui.getCore().getModel("mDataModel").getProperty("/taskDataForEmployee")
		let appliedleaves = sap.ui.getCore().getModel("mDataModel").getProperty("/appliedleaves");
		let leaves = sap.ui.getCore().getModel("mDataModel").getProperty("/leaves");
		let finalHoliday = sap.ui.getCore().getModel("mDataModel").getProperty("/finalHoliday");
		let employeeId = sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId");
		let holidayDateNameData = sap.ui.getCore().getModel("mDataModel").getProperty('/holidayDateNameData');

		// setting visibility of submit button
		if (!sap.ui.getCore().getModel("mDataModel").getProperty('/readOnly')) {
			sap.ui.getCore().byId("subBtn").setVisible(true);
			sap.ui.getCore().byId("saveBtn").setVisible(true);
			// sap.ui.getCore().byId("remarkPopup").setEditable(true);
		}
		// else{
		// sap.ui.getCore().byId("remarkPopup").setEditable(false);
		// }

		// delete all cell editable for previous month
		this.deleteEditableForTaskTable();
		// delete all cell color for previous month
		this.deleteCellColorsForTaskTable();
		this.deleteCellColorsForTotalTable();
		headerList.length = 0;
		newTaskForTotalTable[0].work.length = 0;
		totalHour.value = 0;

		var oCalendar = oEvent.getSource();
		isMonth = oCalendar._oFocusedDate._oUDate.oDate;
		sap.ui.getCore().getModel("mDataModel").setProperty('/currentDate', isMonth);
		// table header label for month and year
		let monthLabel = await this.getFullMonthName(isMonth);
		sap.ui.getCore().getModel("mDataModel").setProperty('/monthLabel', monthLabel);
		sap.ui.getCore().getModel("mDataModel").setProperty('/yearLabel', isMonth.getFullYear());
		// oController.tm.getTN('currentDate').setData(isMonth);
		omonth = isMonth.getMonth();
		var currentYear = isMonth.getFullYear();
		var currentMonth = isMonth.getMonth();
		omonth = Number(omonth) + 1;
		var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();;
		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		var lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth);
		let weekEndDaysInMonth = [];
		weekEndDaysInMonth = this.getWeekendDatesBetween(firstDayOfMonth, lastDayOfMonth);
		for (let i = 0; i < weekEndDaysInMonth.length; i++) {
			oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
				startDate: weekEndDaysInMonth[i],
				color: "#87CEEB"
			}));
		}

		// submit History logic for submit button
		let submitHistoryforMonth = [];
		let submitHistory = sap.ui.getCore().getModel("mDataModel").getProperty('/submitHistory');

		// submit History logic for submit button
		for (let i = 0; submitHistory.length > 0 && i < submitHistory.length; i++) {
			if (submitHistory[i].from_date.getMonth() === firstDayOfMonth.getMonth() && submitHistory[i].from_date.getFullYear() === firstDayOfMonth.getFullYear()) {
				submitHistoryforMonth.push(submitHistory[i]);
			}
		}

		if (submitHistoryforMonth.length > 0) {
			submitHistoryforMonth.sort((a, b) => {
				const submitIdA = parseInt(a.submit_id.substring(3), 10);
				const submitIdB = parseInt(b.submit_id.substring(3), 10);

				return submitIdB - submitIdA;
			});

			let approverRemark = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver', { 'submit_id': submitHistoryforMonth[0].submit_id, loadAll: true });
			if (approverRemark.length) {
				let approver = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': approverRemark[0].approver, loadAll: true });
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', approver[0] ? approver[0].full_name : 'Admin');
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', approverRemark[0].approver_remark);
			} else {
				sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
				sap.ui.getCore().getModel("mDataModel").setProperty('/approverRemark', "No Remark");
			}


			if (submitHistoryforMonth[0].over_all_status != 'Rejected') {
				sap.ui.getCore().byId("subBtn").setVisible(false);
				sap.ui.getCore().byId("saveBtn").setVisible(false);
			}
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitHistoryforMonth[0].over_all_status);
		} else {
			let tempStatus = "";
			sap.ui.getCore().getModel("mDataModel").setProperty('/approver', "");
			sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', tempStatus);
		}
		let submitStatus;
		let holidayDateNameDataForMonth;

		// check pending with
		this.pendingWithCheck();

		switch (omonth) {
			case 1:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);
				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);
				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');

				break;
			case 2:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 3:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 4:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 5:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 6:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 7:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 8:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				// enable column besis on month
				// daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
				// table control
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);
				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 9:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				//  daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 10:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 11:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			case 12:
				holidayDateNameDataForMonth = this.filterDataByMonthAndYear(holidayDateNameData, isMonth);
				sap.ui.getCore().getModel("mDataModel").setProperty('/holidayDateNameDataForMonth', holidayDateNameDataForMonth);
				for (let i = 0; i < 31; i++) {
					temp[i].colVisible = false;
				}
				for (let i = 0; i < daysInMonth; i++) {
					temp[i].colVisible = true;
				}
				// for getting the monthly task and conver into new structure
				this.processTaskDataToMonthly(taskDataForEmployee, currentMonth, currentYear, headerList);
				// storing smallest and greatest date for submit in timesheet header table
				this.findSmallestAndGreatestDates(headerList);
				// modifying the header list
				this.generateUpdatedMonthData(headerList, currentYear, currentMonth);

				// adding color for leave days
				this.markLeaveDaysInTaskTable(headerList, leaves);
				// marking applied leave days for task table
				this.markAppliedLeaveInTaskTable(headerList, appliedleaves);
				// adding color for holidays in task table
				this.markHolidayInTaskTable(headerList, finalHoliday);
				// adding color for weekend days in Task Table
				this.markWeekendDaysInTaskTable(headerList, currentYear, currentMonth);
				// Calculating total hours for total table
				this.calculateTotalHoursTask(headerList, newTaskForTotalTable, totalHour);

				// auto fill for leaves in total table
				this.markLeaveDaysInTotalTable(newTaskForTotalTable, leaves);
				// auto fill for leaves in total table
				this.markAppliedLeaveInTotalTable(newTaskForTotalTable, appliedleaves);
				// auto fill for Holidays in total table
				this.markHolidayInTotalTable(newTaskForTotalTable, finalHoliday);
				// auto fill for Weekends in total table
				this.markWeekendDaysInTotalTable(newTaskForTotalTable, currentYear, currentMonth);

				sap.ui.getCore().getModel("mDataModel").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
				// oController.tm.getTN('newTaskForTotalTable').setData(newTaskForTotalTable);
				sap.ui.getCore().getModel("mDataModel").setProperty('/totalWorkHour', totalHour);
				// oController.tm.getTN('totalWorkHour').setData(totalHour);
				sap.ui.getCore().getModel("mDataModel").setProperty('/task1', headerList);
				// oController.tm.getTN('task1').setData(headerList);

				this.applyCellColorsForTaskTable();
				this.applyCellColorsForTotalTable();

				// if submitted then all field will be non editable
				submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');


				break;
			default:
			// code block
		}
		// adding editable option for current month;
		this.applyEditableForTaskTable();
		aBusy.close();
	}

	// comoBox logic
	public onComboBoxChange(oEvent) {
		return;

		// var oComboBox = oEvent.getSource();
		// var sSelectedKey = oComboBox.getSelectedKey(); // Get the selected key

		// sap.ui.getCore().getModel("t_ui5").setProperty("/comboBoxKey", sSelectedKey);
		// // var sSelectedText = oComboBox.getSelectedItem().getText(); 
		// if (isMonth) {
		// 	var currentMonth = isMonth.getMonth();
		// 	var currentYear = isMonth.getFullYear();
		// } else {
		// 	const currentDate = new Date();
		// 	currentMonth = currentDate.getMonth();
		// 	currentYear = currentDate.getFullYear();
		// }

		// switch (sSelectedKey) {
		// 	case "month":
		// 		this.getView().byId("bnext").setVisible(false);
		// 		this.getView().byId("bprev").setVisible(false);
		// 		this.deleteCellColorsForTaskTable();
		// 		this.deleteCellColorsForTotalTable();

		// 		let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		// 		 for (let i = 0; i < 31; i++) {
		// 			temp[i].colVisible = false;
		// 		}
		// 		for (let i = 0; i < daysInMonth; i++) {
		// 			temp[i].colVisible = true;
		// 		}

		// 		sap.ui.getCore().getModel("t_ui5").setProperty("/temp", temp);
		// 		this.getView().getModel("t_ui5").setProperty('/newTaskForTotalTable', newTaskForTotalTable);
		// 		this.getView().getModel("t_ui5").setProperty('/totalWorkHour', totalHour);
		// 		this.getView().getModel("t_ui5").setProperty('/task1', headerList);

		// 		this.applyCellColorsForTaskTable();
		// 		this.applyCellColorsForTotalTable();
		// 		break;
		// 	case "week":
		// 		this.deleteCellColorsForTaskTable();
		// 		this.deleteCellColorsForTotalTable();

		// 		let currentColModel = sap.ui.getCore().getModel("t_ui5").getProperty("/temp");
		// 		for (let i = 0; i < currentColModel.length; i++) {
		// 			currentColModel[i].colVisible = false;
		// 		}
		// 		sap.ui.getCore().getModel("t_ui5").setProperty("/temp", currentColModel);
		// 		sap.ui.getCore().getModel("t_ui5").setProperty("/temp", temp1);

		// 		this.getView().byId("bnext").setVisible(true);
		// 		this.getView().byId("bprev").setVisible(true);

		// 		var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
		// 		weekStartDate = new Date(firstDayOfMonth);
		// 		// Go to Sunday of the week
		// 		weekStartDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
		// 		weekEndDate = new Date(weekStartDate);
		// 		weekEndDate.setDate(weekStartDate.getDate() + 6);
		// 		this._showColumns(weekStartDate, weekEndDate);

		// 		break;
		// 	default:
		// 		break;
		// }

	}
	// next button
	public onBnext() {
		return;
		this.deleteCellColorsForTaskTable();
		this.deleteCellColorsForTotalTable();
		//
		headerListWeek.length = 0;
		newTaskForTotalTableWeek[0].work.length = 0;
		totalHourWeek.value = 0;
		// weekStartDate = sap.ui.getCore().getModel("t_ui5").getProperty("/weekStartDate");
		weekStartDate = this.tm.getTN('weekStartDate').getData();
		weekStartDate.setDate(weekStartDate.getDate() + 7);
		// weekEndDate = sap.ui.getCore().getModel("t_ui5").getProperty("/weekEndDate");
		weekEndDate = this.tm.getTN('weekEndDate').getData();
		weekEndDate.setDate(weekEndDate.getDate() + 7);

		this._showColumns(weekStartDate, weekEndDate);
	}

	public onDownload() {
		let timesheet = sap.ui.getCore().getModel("mDataModel").getProperty('/task1');
		let restructuredData = this.restructureModel(timesheet);
		let datecheck = new Date();
		let file_name = "TimesheetReport_".concat(datecheck.toString(), ".xlsx");
		console.log(file_name);
		var ws = XLSX.utils.json_to_sheet(restructuredData);
		var wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "TimeSheetReport");
		XLSX.writeFile(wb, file_name, { compression: true });
	}

	public getDayName(dayIndex) {
		const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		return dayNames[dayIndex];
	}
	public restructureModell(originalModel) {
		return;
		let restructuredData = [];

		// Flag to track if weekend/leave/holiday data is already added for a given date
		let addedWeekendData = {};

		originalModel.forEach(task => {
			task.taskDetail.forEach((detail, index) => {
				// Check if editable is true and if the row is not already added for a weekend/leave/holiday date
				if (detail.editable && (!addedWeekendData[detail.workDate] || detail.workRemark !== "No Remark")) {
					let taskName = task.taskName; // Set taskName only for the first detail of each task
					let workDate = new Date(detail.workDate);
					let dayName = this.getDayName(workDate.getDay());
					let remark = detail.workRemark === "No Remark" ? detail.colorCode : `${detail.workRemark}, ${detail.colorCode}`;
					let row = {
						Date: detail.workDate,
						Day: dayName,
						Task_Name: taskName,
						Work_Hour: detail.workHour,
						// workRemark: detail.workRemark,
						// leave: detail.colorCode, // Renaming colorCode to leave
						Remark: remark // Merge leave and workRemark columns into the Remark column
					};

					restructuredData.push(row);
					addedWeekendData[detail.workDate] = true;
				}
			});
		});

		return restructuredData;
	}
	public restructureModel(originalModel) {
		let restructuredData = [];

		// Flag to track if weekend/leave/holiday data is already added for a given date
		let addedWeekendData = {};

		originalModel.forEach(task => {
			task.taskDetail.forEach((detail, index) => {
				// Check if editable is true and if the row is not already added for a weekend/leave/holiday date
				if (detail.editable && (!addedWeekendData[detail.workDate] || detail.workHour !== "0.00")) {

					let taskName = task.taskName;;
					if (detail.colorCode === "Weekend" || detail.colorCode === "Holiday" || detail.colorCode === "Full_Leave" || detail.colorCode === "Half_Leave") {
						if (detail.workHour == "0.00") {
							taskName = "";
						}
					}

					let workDate = new Date(detail.workDate);
					let dayName = this.getDayName(workDate.getDay());
					let remark = detail.workRemark === "" ? detail.colorCode : `${detail.workRemark}, ${detail.colorCode}`;
					let row = {
						Date: detail.workDate,
						Day: dayName,
						Task_Name: taskName,
						Work_Hour: detail.workHour, // Renaming colorCode to leave
						Remark: remark // Merge leave and workRemark columns into the Remark column
					};

					restructuredData.push(row);

					// Mark the date as added to avoid adding more rows for the same date
					addedWeekendData[detail.workDate] = true;
				}
			});
		});

		return restructuredData;
	}
	public async getFullMonthName(date) {
		const fullMonthNames = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];
		return fullMonthNames[date.getMonth()];
	}

	public async onSubmit() {
		// debugger;
		var that = this;

		this.onSave();

		var taskTable = sap.ui.getCore().byId("Table");

		var oBinding = taskTable.getBinding("items");
		oBinding.filter([]);

		var taskItems = taskTable.getItems();
		if (taskItems.length < 1) {
			sap.m.MessageToast.show("There is no task to submit.");
			return;
		}

		//setting Leave task visibility false 
		this.onTableUpdateFinished();


		for (var i = 0; i < taskItems.length; i++) {
			var tItem = taskItems[i];
			var tCells = tItem.getCells();
			for (var j = 0; j < tCells.length - 1 && j < tItem.oBindingContexts.mDataModel.getObject().taskDetail.length; j++) {
				var worktime = tItem.oBindingContexts.mDataModel.getObject().taskDetail[j].workHour;

				if (worktime && !this.isNumeric(worktime)) {
					if (worktime != "") {
						sap.m.MessageToast.show("Work hour should not be character.");
						tCells[j + 1].setValueState("Error");
						return;
					}
				}
				else if (worktime && worktime > 24) {
					sap.m.MessageToast.show("Work hour should be less than 24 .");
					tCells[j + 1].setValueState("Error");
					return;
				}
			}
		}

		var oTable = sap.ui.getCore().byId("totalTable");
		var aItems = oTable.getItems(); // Assuming all columns have the same structure
		let lessWork = false;
		let moreWork = false;
		let lessWorkWarning = false;

		let userJoiningDate = sap.ui.getCore().getModel("mDataModel").getProperty("/thisUser").joining_date;
		let onsubmitMessage = "Do you want to Submit?";
		let lessWorkSubmitMessage = "One or more days this month have less than 8 working hours. Proceed with submission?";
		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			for (var j = 0; j < aCells.length - 1 && j < oItem.oBindingContexts.mDataModel.getObject().work.length; j++) {
				var worktime = oItem.oBindingContexts.mDataModel.getObject().work[j].workHour;
				var specialDay = oItem.oBindingContexts.mDataModel.getObject().work[j].colorCode;
				var workDate = new Date(oItem.oBindingContexts.mDataModel.getObject().work[j].workDate);
				if (specialDay === "Applied") {
					sap.m.MessageToast.show("You should not have applied leave");
					return;
				}
				// else if (worktime < 1 && specialDay != 'Weekend' && specialDay != 'Holiday' && workDate.toISOString() >= userJoiningDate.toISOString()) {
				// 	let date = j + 1;
				// 	sap.m.MessageToast.show("You should atleast have 1 hour filled for" + date + ".");
				// 	return;
				// }
				else if (worktime < 8 && specialDay != 'Weekend' && specialDay != 'Holiday' && workDate.toISOString() >= userJoiningDate.toISOString()) {
					lessWorkWarning = true;
				}
				else if (worktime > 24) {
					let date = j + 1;
					sap.m.MessageToast.show("Work hour should be less than 24 on day " + date + ".");
					aCells[j].setValueState("Error");
					return;
				}
			}
		}
		if (!lessWork) {
			sap.m.MessageBox.confirm((lessWorkWarning == true) ? lessWorkSubmitMessage : onsubmitMessage, {
				title: "Confirm",
				onClose: async function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						oController.onSubmitBusyDialog();
						// for filling the timesheet task table
						let employeeId = sap.ui.getCore().getModel("mDataModel").getProperty("/employeeId");
						let fromDate = sap.ui.getCore().getModel("mDataModel").getProperty("/smallestDate");
						let toDate = sap.ui.getCore().getModel("mDataModel").getProperty("/greatestDate");
						// <<<<<<<<<<<change>>>>>>>>>>> adding this line for commitP() and save data
						let submitHistory = sap.ui.getCore().getModel("mDataModel").getProperty('/submitHistory');
						let taskIdsForEmployee = sap.ui.getCore().getModel("mDataModel").getProperty("/taskIdsForEmployee");
						timeSheet_Task = await oController.transaction.getExecutedQuery('d_o2c_timesheet_task', { "task_id": taskIdsForEmployee, loadAll: true });
						sap.ui.getCore().getModel("mDataModel").setProperty('/timeSheetTask', timeSheet_Task);
						// to know if this is self task or not
						let assignedTask = sap.ui.getCore().getModel("mDataModel").getProperty('/assignedTask');
						let isAlreadySubmitted = false;

						// for timesheet log table data prepare
						let tsHeaderLog = "";
						let tsTaskLog = "";
						let tsTaskIds = "";
						for (let i = 0; i < submitHistory.length; i++) {

							// timeSheet_header[i].employee_id === employeeId
							if (submitHistory[i].employee_id === employeeId && submitHistory[i].from_date.toString() === fromDate.toString() && submitHistory[i].over_all_status === 'Rejected') {

								submitHistory[i].over_all_status = 'Submitted';
								tsHeaderLog = `employee_id: ${employeeId}, from_date: ${submitHistory[i].fromDate}, over_all_status: "Submitted", to_date: ${submitHistory[i].toDate}`;

								// new task added after submit
								let taskAssignByHimself = [];
								let newCreateTaskIndex;
								for (let j = 0; j < headerList.length; j++) {
									let taskIsSubmitted = timeSheet_Task.filter(item => item.task_id === headerList[j].taskId);
									if (taskIsSubmitted.length) {
										taskAssignByHimself = assignedTask.filter(item => item.task_id === headerList[j].taskId && (item.assigned_by === employeeId.toLowerCase() || item.assigned_by === employeeId.toUpperCase()));
										if (taskAssignByHimself.length) {
											taskIsSubmitted[0].status = 'Approved';
										} else {
											taskIsSubmitted[0].status = 'Submitted';
										}

									} else {
										// 15/01 ---- self task after submit
										taskAssignByHimself = assignedTask.filter(item => item.task_id === headerList[j].taskId && (item.assigned_by === employeeId.toLowerCase() || item.assigned_by === employeeId.toUpperCase()));
										if (taskAssignByHimself.length) {
											newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: submitHistory[i].submit_id, status: "Approved", task_id: headerList[j].taskId }, true);
										} else {
											newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: submitHistory[i].submit_id, status: "Submitted", task_id: headerList[j].taskId }, true);
										}
										// newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: submitHistory[i].submit_id, status: "Submitted", task_id: headerList[j].taskId }, true);
									}
									tsTaskIds = tsTaskIds + `task_id: ${headerList[j].taskId}`
								}
								isAlreadySubmitted = true;

								// d_o2c_timesheet log data
								// await oController.transaction.createEntityP('d_o2c_timesheet_log', {
								// 	"submit_id": submitHistory[i].submit_id,
								// 	"task_id": tsTaskIds,
								// 	"action": "Submitted",
								// 	"action_by": employeeId,
								// 	"action_date": new Date(),
								// 	"employee_id": employeeId,
								// 	"ts_header_query": tsHeaderLog,
								// 	"ts_header_response": "",
								// 	"ts_task_query": tsTaskLog,
								// 	"ts_task_response": "",
								// 	"ts_approver_query": "", //iFromDate,
								// 	"ts_approver_response": ""
								// });
								break;
							}
						}
						// finding submit id in timesheet task table

						if (!isAlreadySubmitted) {
							let previousSubmitId;
							let nextSubmitId;
							let currentNumber;

							let headerResponseLog = "";
							let submittedOn = new Date();
							let newSubmit = await submitHistory.newEntityP(0, { employee_id: employeeId, from_date: fromDate, over_all_status: "Submitted", submitted_on: submittedOn, to_date: toDate }, true);
							let newSubmitId = newSubmit.submit_id;

							if (newSubmit) {
								headerResponseLog = "Success"
							}

							// for Timesheet log table , storing the data
							let tsHeaderLog = `employee_id: ${employeeId}, from_date: ${fromDate}, over_all_status: "Submitted", to_date: ${toDate}`;
							let tsTaskLog = "";
							let tsTaskIds = "";
							let taskResponseLog = "";
							let taskAssignByHimself = [];
							let newCreateTaskIndex;
							for (let i = 0; i < headerList.length; i++) {
								// submit_id: nextSubmitId,
								taskAssignByHimself = assignedTask.filter(item => item.task_id === headerList[i].taskId && (item.assigned_by === employeeId.toLowerCase() || item.assigned_by === employeeId.toUpperCase()));
								if (taskAssignByHimself.length) {
									newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: newSubmitId, status: "Approved", task_id: headerList[i].taskId }, true);
									tsTaskLog = tsTaskLog + `submit_id: ${newSubmitId}, status: "Approved", task_id: ${headerList[i].taskId} `;
									tsTaskIds = tsTaskIds + `task_id: ${headerList[i].taskId} `
									if (newCreateTaskIndex) {
										taskResponseLog = taskResponseLog + 'Success ,';
									}
								} else {
									newCreateTaskIndex = await timeSheet_Task.newEntityP(0, { submit_id: newSubmitId, status: "Submitted", task_id: headerList[i].taskId }, true);
									tsTaskLog = tsTaskLog + `submit_id: ${newSubmitId}, status: "Submitted", task_id: ${headerList[i].taskId}`;
									tsTaskIds = tsTaskIds + `task_id: ${headerList[i].taskId}`;
									if (newCreateTaskIndex) {
										taskResponseLog = taskResponseLog + 'Success ,';
									}
								}

							}

							// Modifying work hour as 0 on holiday for Leave task
							let assignLeaveTask = await oController.transaction.getExecutedQuery('d_o2c_task_assignment', { "task_start_date": fromDate, "taskType": "Leave", "employee_id": employeeId, loadAll: true });
							let leaveTaskBooking = [];
							if (assignLeaveTask.length) {
								leaveTaskBooking = await oController.transaction.getExecutedQuery('q_task_assignment_booking', { "task_id": assignLeaveTask[0].task_id, loadAll: true });
							}
							let holidays = sap.ui.getCore().getModel("mDataModel").getProperty('/finalHoliday');
							const holidaySet = new Set(holidays.map(date => new Date(date).toISOString()));
							for (let i = 0; i < leaveTaskBooking.length; i++) {
								// Convert the date to ISO string and check if it's in the Set
								if (holidaySet.has(new Date(leaveTaskBooking[i].booking_date).toISOString())) {
									leaveTaskBooking[i].hours_worked = 0;
								}
							}



							// for timesheet log
							let d = new Date();

							// d_o2c_timesheet log Data 

							// await oController.transaction.createEntityP('d_o2c_timesheet_log', {
							// 	"submit_id": newSubmitId,
							// 	"task_id": tsTaskIds,
							// 	"action": "Submitted",
							// 	"action_by": employeeId,
							// 	"action_date": d,
							// 	"employee_id": employeeId,
							// 	"ts_header_query": tsHeaderLog,
							// 	"ts_header_response": headerResponseLog,
							// 	"ts_task_query": tsTaskLog,
							// 	"ts_task_response": taskResponseLog,
							// 	"ts_approver_query": "", //iFromDate,
							// 	"ts_approver_response": ""
							// });
						}
						sap.ui.getCore().getModel("mDataModel").setProperty('/timeSheetTask', timeSheet_Task);
						sap.ui.getCore().getModel("mDataModel").setProperty('/submitHistory', submitHistory);

						oController.transaction.commitP();

						let submitHistoryforMonth = [];
						let currentDate = sap.ui.getCore().getModel("mDataModel").getProperty("/currentDate");
						let currentMonth = currentDate.getMonth();
						let currentYear = currentDate.getFullYear();
						let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

						// adding weekend color besis on month
						var firstDayOfMonth = new Date(currentYear, currentMonth, 1);
						// submit History logic for submit button
						for (let i = 0; i < submitHistory.length && submitHistory.length > 0; i++) {
							if (submitHistory[i].from_date.getMonth() === firstDayOfMonth.getMonth() && submitHistory[i].from_date.getFullYear() === firstDayOfMonth.getFullYear()) {
								submitHistoryforMonth.push(submitHistory[i]);
							}
						}
						if (submitHistoryforMonth.length > 0) {
							submitHistoryforMonth.sort((a, b) => {
								const submitIdA = parseInt(a.submit_id.substring(3), 10);
								const submitIdB = parseInt(b.submit_id.substring(3), 10);
								return submitIdB - submitIdA;
							});

							if (submitHistoryforMonth[0].over_all_status != 'Rejected') {
								sap.ui.getCore().byId("subBtn").setVisible(false);
								sap.ui.getCore().byId("saveBtn").setVisible(false);
							}
							sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', submitHistoryforMonth[0].over_all_status);
						} else {
							let tempStatus = "";
							sap.ui.getCore().getModel("mDataModel").setProperty('/submitStatus', tempStatus);
						}
						let submitStatus = sap.ui.getCore().getModel("mDataModel").getProperty('/submitStatus');
						sap.m.MessageToast.show("Data submitted successfully.");
					}
					else {
						sap.m.MessageToast.show("Submit operation cancelled.");
					}
				}
			});
		}
		else {
			sap.m.MessageToast.show("Fills work hour properly !.");
		}
	}

	public async hieararchyBoxChange_1(oEvent) {

		this.onEmpComboBoxChange(oEvent);
		// sap.ui.getCore().byId("comboBox").setValue("");
		sap.ui.getCore().byId("hieararchyBox_2").setValue("");
		sap.ui.getCore().byId("hieararchyBox_3").setValue("");

		let oComboBox = oEvent.getSource();
		let oSelectedItem = oComboBox.getSelectedItem();
		let hieararchyData_2 = [];
		if (oSelectedItem) {
			var selectedKey = oSelectedItem.getKey();
			hieararchyData_2 = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': selectedKey, loadAll: true });
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/hieararchyData_2', hieararchyData_2);
		// if(!hieararchyData_2.length){
		// 	sap.ui.getCore().byId("hieararchyBox_2").setVisible(false);
		// }else{
		// 	sap.ui.getCore().byId("hieararchyBox_2").setVisible(true);
		// }

	}

	public async hieararchyBoxChange_2(oEvent) {
		sap.ui.getCore().byId("hieararchyBox_3").setValue("");
		this.onEmpComboBoxChange(oEvent);

		let oComboBox = oEvent.getSource();
		let oSelectedItem = oComboBox.getSelectedItem();
		if (oSelectedItem) {
			var selectedKey = oSelectedItem.getKey();


			let emp = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': selectedKey, loadAll: true });
			let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': selectedKey, loadAll: true });

			let hierarchyIds = [];
			let hieararchyData_3 = [];
			for (let i = 0; i < emp.length; i++) {
				hierarchyIds.push(emp[i].employee_id);
				hieararchyData_3.push(emp[i]);
			}

			while (hierarchyIds.length) {
				emp = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });

				hierarchyIds = [];
				for (let i = 0; i < emp.length; i++) {
					hierarchyIds.push(emp[i].employee_id);
					hieararchyData_3.push(emp[i]);
				}
			}
			// hieararchyData_3.push(thisUser[0]);
			sap.ui.getCore().getModel("mDataModel").setProperty('/hieararchyData_3', hieararchyData_3);
			// if(!hieararchyData_3.length){
			// 	sap.ui.getCore().byId("hieararchyBox_3").setVisible(false);
			// }else{
			// 	sap.ui.getCore().byId("hieararchyBox_3").setVisible(true);
			// }
		}
	}




}
