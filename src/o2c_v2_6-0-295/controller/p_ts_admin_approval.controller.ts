// import { KloEntitySet } from 'kloBo_5/KloEntitySet';
import { KloEntitySet } from 'kloBo/KloEntitySet';
// import * as BaseController from 'kloTouch/controller/BaseController'
import {FileLoaderUtils} from "kloBo/Utils/FileLoaderUtils";
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_designation_master } from 'o2c_base/entity_gen/d_o2c_designation_master';
import { d_o2c_employee_designation } from 'o2c_base/entity_gen/d_o2c_employee_designation';
import { d_o2c_holiday_calendar } from 'o2c_base/entity_gen/d_o2c_holiday_calendar';
import c_o2c_employee_org from 'o2c_base/metadata/m_entities/c_o2c_employee_org_metadata';
declare let KloUI5:any;
let oRow, tempMenteeData = [];
let userId, temptest, loginId;
let oControl;
@KloUI5("o2c_base.controller.p_timesheet_approval")
export default class p_timesheet_approval extends KloController{
	public onInit() {	
		
		var oLocalModel = new sap.ui.model.json.JSONModel();
		sap.ui.getCore().setModel(oLocalModel,"mLocalModel");
		
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onPageEnter() {
		oControl = this;
	
		loginId = (await this.transaction.get$User()).login_id; //"mm0364";
		loginId = loginId.toUpperCase();

		// var oLocal = new sap.ui.model.json.JSONModel();
		// sap.ui.getCore().setModel(oLocal,"mLocal");
		let controllerNameForApprovalView = this.getFlavor() + "_" + this.getFlavorVersion() + "_" +  window["clientGlobalObj"].landscape + ".controller.p_timesheet_approval";
		sap.ui.getCore().getModel("mLocalModel").setProperty("/controllerNameForApprovalView", controllerNameForApprovalView);
		
		let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.p_ts_admin_approval";
		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		});
		this.getActiveControlById(null,'pageLayout01','p_ts_admin_approval').addContent(view);
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "timeSheet_Approval_SS");
		
		let profitCenters = await this.transaction.getExecutedQuery('d_o2c_profit_centre',{loadAll:true});
		let profitCenterIds = [];
		for(let i=0; i<profitCenters.length; i++){
			profitCenterIds.push(profitCenters[0].profit_center);
		}
		sap.ui.getCore().getModel("mLocalModel").setProperty("/profitCenters", profitCenters);
		let MenteeData = await this.transaction.getExecutedQuery('d_o2c_employee',{ 'line_manager': userId, loadAll: true}); 
		sap.ui.getCore().getModel("mLocalModel").setProperty("/MenteeList", MenteeData);

        let managerId = await this.transaction.getExecutedQuery('d_o2c_designation_master', { 'name': 'MANAGER', loadAll: true });

		// this.setTimeSheetData(MenteeData);
		sap.ui.getCore().getModel("mLocalModel").setProperty("/profitCenterSelect", false);
	}

	public async onProfitCenterSelection(oEvent){
		sap.ui.getCore().getModel("mLocalModel").setProperty("/TimeSheetList", "");
		
		sap.ui.getCore().getModel("mLocalModel").setProperty("/profitCenterSelect", true);
		sap.ui.getCore().getModel("mLocalModel").setProperty("/managerList", "");
		// let profitCenter = oEvent.mParameters.value;
		let oComboBox = oEvent.getSource();
		let profitCenter = oComboBox.getSelectedItem().getKey();
		let allEmpFromProfitCenter = await this.transaction.getExecutedQuery('d_o2c_employee_org',{'profit_centre': profitCenter , loadAll: true});

		let empIdsFromProfitCenter = [];
		let currentDate = new Date();
		for(let i=0; i<allEmpFromProfitCenter.length; i++){
			if( allEmpFromProfitCenter[i].is_primary )
			empIdsFromProfitCenter.push(allEmpFromProfitCenter[i].employee_id);
		}
		let designationsMaster = await this.transaction.getExecutedQuery('d_o2c_designation_master',{ loadAll: true});
		let designtion = designationsMaster.filter(item => item.name === 'MANAGER' || item.name === "TEAM_HEAD");
		let desigIds = [];
		for(let i=0; i<designtion.length; i++){
			desigIds.push(designtion[i].designation_id);
		}
		let finalEmpFormProfitCenter = await this.transaction.getExecutedQuery('d_o2c_employee_designation',{ 'employee_id': empIdsFromProfitCenter, loadAll: true}); 
		let empForDropdown= [];
		for(let i=0; i<finalEmpFormProfitCenter.length; i++){
			for(let j=0; j<desigIds.length; j++){
			if(finalEmpFormProfitCenter[i].designation === desigIds[j])
			empForDropdown.push(finalEmpFormProfitCenter[i].employee_id);
		}
		}
		let managerList = [];
		if(empForDropdown.length){
			managerList = await this.transaction.getExecutedQuery('d_o2c_employee',{ 'employee_id': empForDropdown, loadAll: true}); 
		}
		// let deleteIt = await this.transaction.getExecutedQuery('d_o2c_employee',{ loadAll: true});
		
		sap.ui.getCore().getModel("mLocalModel").setProperty("/managerList", managerList);
	}
    public async onManagerSelection(oEvent){
		sap.ui.getCore().getModel("mLocalModel").setProperty("/managerSelect", true);
		let oComboBox = oEvent.getSource();
		let selectedManager = oComboBox.getSelectedItem().getKey();
        userId = selectedManager.toUpperCase();
		// userId = "MM0364";
		if(!sap.ui.getCore().getModel("mLocalModel").getProperty("/pickedDate"))
		{
			return;
		}

		this.onBusyDialog();	
        let MenteeData = await this.transaction.getExecutedQuery('d_o2c_employee',{ 'line_manager': userId, loadAll: true}); 
		sap.ui.getCore().getModel("mLocalModel").setProperty("/MenteeList", MenteeData);
        this.setTimeSheetData(MenteeData);
    }
	public async monthChange(oEvent){
		let oDatePicker = oEvent.getSource();
        let pickedDate = oDatePicker.getDateValue();
		sap.ui.getCore().getModel("mLocalModel").setProperty("/pickedDate", pickedDate);
		if(!sap.ui.getCore().getModel("mLocalModel").getProperty("/managerSelect")){
			return;
		}
		this.onBusyDialog();	
		let MenteeData = await this.transaction.getExecutedQuery('d_o2c_employee',{ 'line_manager': userId, loadAll: true}); 
		sap.ui.getCore().getModel("mLocalModel").setProperty("/MenteeList", MenteeData);
        this.setTimeSheetData(MenteeData);
	}
	public async onMenteeSelection(oEvent){
		let selectedMentees = oEvent.getSource().getSelectedItems();
		
		let oBindings = sap.ui.getCore().byId("TimeSheetID").getBinding("items");
		let aFilters = [];
		if(selectedMentees.length > 0){
			for(var i in selectedMentees){				
				aFilters.push( new sap.ui.model.Filter("employee_id", sap.ui.model.FilterOperator.EQ, selectedMentees[i].mProperties.key) );
			}
		}
		oBindings.filter(aFilters, sap.ui.model.FilterType.Application);
	}

	public onBusyDialog(){
		var oBusy = new sap.m.BusyDialog({
			text: "please wait...",
			// customIconHeight:"44px",
		});
		oBusy.open();
		window.setTimeout(() => {
			oBusy.close();
		}, 3000);
	}

	public async setTimeSheetData(EmpList){	
		let TimeSheetList = [];
		let TimesheetHeader = [], TimesheetTask = [], TimesheetApprover = [];
		temptest = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver',{ loadAll: true});
		TimesheetApprover.push(temptest);

		let menteeIds = [];
		for(let i=0; i<EmpList.length; i++){
			menteeIds.push(EmpList[i].employee_id)
		}
		let TaskAssignedBy = await this.transaction.getExecutedQuery('q_submitted_task',{ 'assignd_by': userId , loadAll: true});
		// let TaskAssignedBy = await this.transaction.getExecutedQuery('d_o2c_task_assignment',{ 'assigned_by': userId, loadAll: true });
		let taskIds = [];
		for(let i=0; i<TaskAssignedBy.length; i++){
			taskIds.push(TaskAssignedBy[i].task_id);
		}
		let zAllSubmitIDList = await this.transaction.getExecutedQuery('d_o2c_timesheet_task',{ 'task_id': taskIds , 'status' : 'Submitted', loadAll: true});
		let nonLineManagerMentees = [];
		let nonLineManagerMap = new Map();	
		for(let x=0; x<EmpList.length; x++){
			nonLineManagerMap.set(EmpList[i], true);
		}
		for(let i=0; i<TaskAssignedBy.length; i++){
			if(!nonLineManagerMap.get(TaskAssignedBy[i].employee_id))
			nonLineManagerMentees.push(TaskAssignedBy[i].employee_id);
		}

		let allEmployeeIds = menteeIds.concat(nonLineManagerMentees);
		let allMenteeTaskDataTemp = await this.transaction.getExecutedQuery('d_o2c_task_assignment',{ 'employee_id': allEmployeeIds, loadAll: true});
		let allEmployeeDetails = await this.transaction.getExecutedQuery('d_o2c_employee',{ loadAll: true});	

		let allSubmitIds = [];
		for(let i=0; i<zAllSubmitIDList.length; i++){
			allSubmitIds.push(zAllSubmitIDList[i].submit_id);
		}
		let allmenteetask = [];
		if(allSubmitIds.length > 0){
			allmenteetask = await this.transaction.getExecutedQuery('d_o2c_timesheet_task',{ 'submit_id': allSubmitIds, loadAll: true });
		}
		let allMenteeTaskIds = [];
		for(let i=0; i<allmenteetask.length; i++){
			allMenteeTaskIds.push(allmenteetask[i].task_id)
		}	
		let allMenteeTaskBookingList =[];
		if(allMenteeTaskIds.length > 0){
			allMenteeTaskBookingList = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking',{ 'task_id': allMenteeTaskIds, loadAll: true});
		}

		// get mantees all submit id								
		let menteeTimesheetDataTemps = await this.transaction.getExecutedQuery('d_o2c_timesheet_header',{ 'employee_id': menteeIds, 'over_all_status': 'Submitted', loadAll: true });	
		let pickedDate = sap.ui.getCore().getModel("mLocalModel").getProperty("/pickedDate");
		let menteeTimesheetDataTemp = [];
		for(let i=0; i<menteeTimesheetDataTemps.length; i++)
		{
			if(pickedDate.getMonth() === menteeTimesheetDataTemps[i].from_date.getMonth() && pickedDate.getFullYear() === menteeTimesheetDataTemps[i].from_date.getFullYear()){
				menteeTimesheetDataTemp.push(menteeTimesheetDataTemps[i]);
			}
		}
		// ** leave data for all non mentees
		let menteeAllEmpLeave = await this.transaction.getExecutedQuery('d_o2c_leave_management',{ 'employee_id': menteeIds, 'leave_status': 'Approved', loadAll: true });	
		// all approvar table data for mentees */
		let menteeSumitIds = [];
		
		for(let i=0; i<menteeTimesheetDataTemp.length; i++){
			menteeSumitIds.push(menteeTimesheetDataTemp[i].submit_id);
		}
		// let menteeAllTimesheetAppr = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver',{ 'submit_id': menteeSumitIds, loadAll: true });
		// ** all task for all submit is for all non mentees
		let menteeAllTaskTemp = [];
		if(menteeSumitIds.length){
			menteeAllTaskTemp = await this.transaction.getExecutedQuery('d_o2c_timesheet_task',{ 'submit_id': menteeSumitIds, loadAll: true });
		}
		

		//----Get Mentees Timesheet Data----$													
		for(var i=0; i<EmpList.length; i++){
			// change
			let TimesheetDataTemp = menteeTimesheetDataTemp.filter(item => (item.employee_id ===  EmpList[i].employee_id.toUpperCase() || item.employee_id ===  EmpList[i].employee_id.toLowerCase()) && item.over_all_status === "Submitted");			
			// let TimesheetDataTemp = await this.transaction.getExecutedQuery('d_o2c_timesheet_header',{ 'employee_id': EmpList[i].employee_id, 'over_all_status': 'Submitted', loadAll: true });
			// change
			let EmpLeave;
			let zEmpLeave;
			if(TimesheetDataTemp.length>0){
				// change
				EmpLeave = menteeAllEmpLeave.filter(item => item.employee_id === EmpList[i].employee_id && item.leave_status === "Approved");
				// EmpLeave = await this.transaction.getExecutedQuery('d_o2c_leave_management',{ 'employee_id': EmpList[i].employee_id, 'leave_status': 'Approved', loadAll: true });
				// change
			}
			//change 06/02/24 -> declare this in next loop before taskTemp
			// let totalForDayArray = Array.from({ length: 32 }, () => 0);	
			for(var j=0; j<TimesheetDataTemp.length; j++){
				// change
				// let TimesheetAppr = menteeAllTimesheetAppr.filter(item => item.submit_id === TimesheetDataTemp[j].submit_id );
				let TimesheetAppr = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver',{ 'submit_id': TimesheetDataTemp[j].submit_id , loadAll: true});
				// change
				TimesheetApprover.push(TimesheetAppr);

				var emp_name = "";
				for(var x=0; x<EmpList.length; x++){
					if(EmpList[x].employee_id === TimesheetDataTemp[j].employee_id){
						emp_name = EmpList[x].full_name;
						break;
					}
				}

				let iFromDate = TimesheetDataTemp[j].from_date.getDate();
				let iToDate = TimesheetDataTemp[j].to_date.getDate();
				let iLastDate = (new Date(TimesheetDataTemp[j].to_date.getFullYear(), TimesheetDataTemp[j].to_date.getMonth() + 1, 0)).getDate();
				let submitMonth = new Date(TimesheetDataTemp[j].from_date.getFullYear(), TimesheetDataTemp[j].from_date.getMonth() + 1, 1);
				submitMonth.setMonth(submitMonth.getMonth() - 1);
				
				var sTimesheetData = {
					"employee_id": TimesheetDataTemp[j].employee_id,
					"employee_name": emp_name,
					"submit_id": TimesheetDataTemp[j].submit_id,
					"month": submitMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
					"submitted_on": TimesheetDataTemp[j].submitted_on.toISOString().slice(0,10),
					"s_modified_on": TimesheetDataTemp[j].s_modified_on.toISOString().slice(0,10),
					"s_modified_by": TimesheetDataTemp[j].s_modified_by,
					"over_all_status": TimesheetDataTemp[j].over_all_status,
					"Visibility": TimeSheetList.length === 0 ? true : false,
					"Icon": TimeSheetList.length === 0 ? "sap-icon://dropdown" : "sap-icon://feeder-arrow",
					"from_date": TimesheetDataTemp[j].from_date, //iFromDate,
					"to_date": TimesheetDataTemp[j].to_date, //iToDate,
					"TaskList":[]
					// "TaskList" = {
					// 	"workHour" : "",
					// 	"remark" : ""
					// }
				}

				let sTotal = {
					"Task_ID": "",
					"Task_name": "Total=",
					"Project_ID": "",
					"Project_name": "",
					"Project_PDs": "",
					"Consumed_PDs": "",
					"unapproved_PDs": "",
					"Balance_PDs": "",
					"Weekend": [],
					"Holiday": [],
					"FullDay": [],
					"HalfDay": [],
					"Assigned_by_ID": "",
					"Assigned_by": ""
				}, iTotal = 0;

				// change <=iLastDate
				for(var x=0; x<=31; x++){
					if(x < iFromDate || x > iToDate){
						sTimesheetData[x] = false;
					}else{
						sTimesheetData[x] = true;
						sTotal[x] = 0;				
					}					
				}

				let bTaskVisibleFlag = true;
				// change
				let TaskTemp = menteeAllTaskTemp.filter(item => item.submit_id === TimesheetDataTemp[j].submit_id);
				// let TaskTemp = await this.transaction.getExecutedQuery('d_o2c_timesheet_task',{ 'submit_id': TimesheetDataTemp[j].submit_id, loadAll: true });
				// change
				let totalForDayArray = Array.from({ length: 32 }, () => 0);
				for(var k=0;k<TaskTemp.length;k++){
					let TaskDataTemp = allMenteeTaskDataTemp.filter(item => (item.employee_id.toLowerCase() === EmpList[i].employee_id || item.employee_id.toUpperCase() === EmpList[i].employee_id) && item.task_id === TaskTemp[k].task_id );
					
					for(var l=0;l<TaskDataTemp.length;l++){	
						// if((TaskDataTemp[l].assigned_by !== userId.toLowerCase() && TaskDataTemp[l].assigned_by !== userId.toUpperCase()) && TaskTemp[k].status !== "Approved"){ 
						// 	bTaskVisibleFlag = false;
						// 	break;
						// }
						let iUnApprovedPDs = 0;
						let ProjIDList = allMenteeTaskDataTemp.filter(item => item.project_id === TaskDataTemp[l].project_id );
						
						for(var y=0; y<ProjIDList.length; y++){
							iUnApprovedPDs = iUnApprovedPDs + ProjIDList[y].billable_hours;
						}
						let Proj_manager = allEmployeeDetails.filter(item => item.employee_id === TaskDataTemp[l].assigned_by.toLowerCase() || item.employee_id === TaskDataTemp[l].assigned_by.toUpperCase());
						
						var sTaskList = {
							"Task_ID": TaskDataTemp[l].task_id,
							"Task_name": TaskDataTemp[l].task_name,
							"Project_ID": TaskDataTemp[l].project_id,
							"Project_name": TaskDataTemp[l].project_name,
							"Project_PDs": "",
							"Consumed_PDs": "",
							"unapproved_PDs": "",
							"Balance_PDs": "",
							"Weekend": [],
							"Holiday": [],
							"FullDay": [],
							"HalfDay": [],
							"Assigned_by_ID": TaskDataTemp[l].assigned_by,
							"Assigned_by": Proj_manager.length > 0 ? Proj_manager[0].full_name : "", // Proj_manager[0].full_name
							
						}	
						let TaskBookingList = allMenteeTaskBookingList.filter(item => item.task_id === TaskDataTemp[l].task_id);
						
						if(!TaskBookingList.length){
							TaskBookingList = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking',{ 'task_id': TaskDataTemp[l].task_id , loadAll: true});
						}
						TaskBookingList = TaskBookingList.filter(item => {
							let bookingDate = new Date(item.booking_date);
							return bookingDate >= TimesheetDataTemp[j].from_date && bookingDate <= TimesheetDataTemp[j].to_date;
						});
						let ProcessDate = TimesheetDataTemp[j].from_date;
						let aProcessDate = []; //Employee Leave Date
						for(var y=0;y<EmpLeave.length;y++){
							let sProcessDate = {};
							if(TimesheetDataTemp[j].from_date <= EmpLeave[y].start_date && EmpLeave[y].start_date <= TimesheetDataTemp[j].to_date){
								sProcessDate["FromDate"] = EmpLeave[y].start_date;
							}else if(TimesheetDataTemp[j].from_date > EmpLeave[y].start_date){
								sProcessDate["FromDate"] = TimesheetDataTemp[j].from_date;
							}else if(EmpLeave[y].start_date > TimesheetDataTemp[j].to_date){
								continue;
							}
							if(TimesheetDataTemp[j].from_date <= EmpLeave[y].end_date && EmpLeave[y].end_date <= TimesheetDataTemp[j].to_date){
								sProcessDate["ToDate"] = EmpLeave[y].end_date;
							}else if(TimesheetDataTemp[j].to_date < EmpLeave[y].end_date){
								sProcessDate["ToDate"] = TimesheetDataTemp[j].to_date;
							}else if(EmpLeave[y].end_date < TimesheetDataTemp[j].from_date){
								continue;
							}
							sProcessDate["HalfDayStart"] = EmpLeave[y].half_day_startdate;
							sProcessDate["HalfDayEnd"] = EmpLeave[y].half_day_enddate;
							aProcessDate.push(sProcessDate);
						}
						for(var y=0;y<aProcessDate.length;y++){
							if(aProcessDate[y].FromDate.toDateString() === aProcessDate[y].ToDate.toDateString()){
								if(aProcessDate[y].HalfDayStart || aProcessDate[y].HalfDayEnd){
									sTaskList["HalfDay"].push(aProcessDate[y].FromDate.getDate());
									sTotal["HalfDay"].push(aProcessDate[y].FromDate.getDate());
								}else{
									sTaskList["FullDay"].push(aProcessDate[y].FromDate.getDate());
									sTotal["FullDay"].push(aProcessDate[y].FromDate.getDate());
								}
							}else{
								if(aProcessDate[y].HalfDayStart){
									sTaskList["HalfDay"].push(aProcessDate[y].FromDate.getDate());
									sTotal["HalfDay"].push(aProcessDate[y].FromDate.getDate());
									aProcessDate[y].FromDate.setDate(aProcessDate[y].FromDate.getDate()+1)
								}
								if(aProcessDate[y].HalfDayEnd){
									sTaskList["HalfDay"].push(aProcessDate[y].ToDate.getDate());
									sTotal["HalfDay"].push(aProcessDate[y].ToDate.getDate());
									aProcessDate[y].ToDate.setDate(aProcessDate[y].ToDate.getDate()-1)
								}
								for(let z=aProcessDate[y].FromDate.getDate();z<=aProcessDate[y].ToDate.getDate();z++){
									sTaskList["FullDay"].push(z);
									sTotal["FullDay"].push(z);
								}
							}
						}
						
						for(var y=iFromDate;y<=iToDate;y++){						
							for(var z=0; z<TaskBookingList.length; z++){
								let stotalHour = 0;
								if(y >= TaskBookingList[z].booking_date.getDate() && y <= TaskBookingList[z].booking_date.getDate()){
									// sTaskList[TaskBookingList[z].booking_date.getDate()] = TaskBookingList[z].actual_hours_worked;
									let Remark_Hour;
									if(TaskBookingList[z].hours_worked){
									Remark_Hour = {
										"Work_hour" : TaskBookingList[z].hours_worked,
										"Remark": TaskBookingList[z].remarks,
										"Update":TaskBookingList[z].update_remark,
										"colorCode": ""
									}
									}else {
										Remark_Hour = {
											"Work_hour" : 0,
											"Remark": TaskBookingList[z].remarks,
											"Update":TaskBookingList[z].update_remark,
											"colorCode": ""
										}
									}
									sTaskList[TaskBookingList[z].booking_date.getDate()] = Remark_Hour;
									
									if(TaskBookingList[z].hours_worked)
									{
										totalForDayArray[TaskBookingList[z].booking_date.getDate()] = totalForDayArray[TaskBookingList[z].booking_date.getDate()] + parseFloat(TaskBookingList[z].hours_worked);
										stotalHour = stotalHour + TaskBookingList[z].hours_worked;
										let s_Hour = {
											"Work_hour" : totalForDayArray[TaskBookingList[z].booking_date.getDate()],
											"colorCode" : ""
										}
										sTotal[TaskBookingList[z].booking_date.getDate()] = s_Hour;
									// sTotal[TaskBookingList[z].booking_date.getDate()] = sTotal[TaskBookingList[z].booking_date.getDate()] + TaskBookingList[z].actual_hours_worked;
									iTotal = iTotal + parseFloat(TaskBookingList[z].hours_worked);	
									}
								}else{
									if(!sTaskList[y]) {
										let Remark_Hour = {
											"Work_hour" : 0,
											"Remark": "No Task",
											"Update": false,
											"colorCode": ""
										}
										sTaskList[y] = Remark_Hour;
									}
									if(!sTotal[y]){
										let s_Hour = {
											"Work_hour" : 0,
											"colorCode" : ""
										}
										sTotal[y] = s_Hour;
									}
								}
							}			
							if(ProcessDate.getDay() === 6 || ProcessDate.getDay() === 0){
								sTaskList["Weekend"].push(y);
								sTotal["Weekend"].push(y);
							}
							ProcessDate.setDate(ProcessDate.getDate()+1);
						}
					}
					if(!bTaskVisibleFlag){
						break;
					}

					sTimesheetData.TaskList.push(sTaskList);
					if(TaskTemp.length > 0){
						TimesheetTask.push(TaskTemp);
					}
				}		
				if(bTaskVisibleFlag){
					sTotal["Task_name"] = sTotal["Task_name"] + iTotal;
					sTimesheetData.TaskList.push(sTotal)
					TimeSheetList.push(sTimesheetData);
					if(TimesheetDataTemp.length > 0){
						TimesheetHeader.push(TimesheetDataTemp);
					}
				}	
			}
		}

		//Holiday
		// change
		let TimeSheetListEmployeeIds = [];
		for(let n=0; n<TimeSheetList.length; n++){
			TimeSheetListEmployeeIds.push(TimeSheetList[n].employee_id)
		}
		//change
		let allempOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org',{ 'employee_id': TimeSheetListEmployeeIds, loadAll: true });
		for(var i=0;i<TimeSheetList.length;i++){
			// change
			let empOrg = allempOrg.filter(item => item.employee_id.toLowerCase() === TimeSheetList[i].employee_id.toLowerCase());
			// let empOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org',{ 'employee_id': TimeSheetList[i].employee_id, loadAll: true });
			// change
			let aBusinessArea = [];
			for(var j=0;j<empOrg.length;j++){
				if(TimeSheetList[i].from_date>=empOrg[j].active_from && TimeSheetList[i].to_date<=empOrg[j].active_till){
					var sBusinessArea = {
						"FromDate": TimeSheetList[i].from_date,
						"ToDate": TimeSheetList[i].to_date,
						"CoCode": empOrg[j].company_code,
						"BusinessArea": empOrg[j].business_area
					}
					aBusinessArea.push(sBusinessArea);
					break;
				}else if(TimeSheetList[i].from_date>=empOrg[j].active_from && TimeSheetList[i].from_date<=empOrg[j].active_till){
					var sBusinessArea = {
						"FromDate": TimeSheetList[i].from_date,
						"ToDate": empOrg[j].active_till,
						"CoCode": empOrg[j].company_code,
						"BusinessArea": empOrg[j].business_area
					}
					aBusinessArea.push(sBusinessArea);
				}else if(TimeSheetList[i].to_date>=empOrg[j].active_from && TimeSheetList[i].to_date<=empOrg[j].active_till){
					var sBusinessArea = {
						"FromDate": empOrg[j].active_from,
						"ToDate": TimeSheetList[i].to_date,
						"CoCode": empOrg[j].company_code,
						"BusinessArea": empOrg[j].business_area
					}
					aBusinessArea.push(sBusinessArea);
					break;
				}
			}
			// change
			let allCalenderID = await this.transaction.getExecutedQuery('d_o2c_business_area',{ loadAll: true});
			let allHoliday = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar',{ loadAll: true});
			let allOfficeCalendar = await this.transaction.getExecutedQuery('d_o2c_office_calendar', { loadAll: true});
			// change
			for(var j=0;j<aBusinessArea.length;j++){
				// chnage
				let calenderID  = allCalenderID.filter(item => item.business_area === aBusinessArea[j].BusinessArea && item.company_code === aBusinessArea[j].CoCode);
				// let calenderID = await this.transaction.getExecutedQuery('d_o2c_business_area',{ 'business_area': aBusinessArea[j].BusinessArea, 'company_code': aBusinessArea[j].CoCode, loadAll: true });
				// chnage
				if(calenderID.length>0){
					// change
					let officeCalendar = allOfficeCalendar.filter(item => item.office_calendar_id === calenderID[0].office_calender);
					let Holiday = allHoliday.filter(item => item.holiday_calender_id === officeCalendar[0].holiday_calender_id);
					// let Holiday = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar',{ 'holiday_calender_id': calenderID[0].office_calender, loadAll: true});
					// chnage
					for(var k=0;k<Holiday.length;k++){
						if(Holiday[k].holiday_date >= aBusinessArea[j].FromDate && Holiday[k].holiday_date <= aBusinessArea[j].ToDate){
							for(var l=0;l<TimeSheetList[i].TaskList.length;l++){
								TimeSheetList[i].TaskList[l].Holiday.push(Holiday[k].holiday_date.getDate());
							}
						}
					}
				}
			}
		}

		sap.ui.getCore().getModel("mLocalModel").setProperty('/TimeSheetList', TimeSheetList);
		sap.ui.getCore().getModel("mLocalModel").setProperty('/TimesheetHeaderList', TimesheetHeader);
		sap.ui.getCore().getModel("mLocalModel").setProperty('/TimesheetTaskList', TimesheetTask);
		sap.ui.getCore().getModel("mLocalModel").setProperty('/TimesheetApprList', TimesheetApprover);

		this.applyCellColour();
		// this.calculateExtraHourForLeaves();
	}

	public async applyCellColour(){
		// debugger;
		var oTable = sap.ui.getCore().byId("TimeSheetID");

		for(var i=0;i<oTable.getItems().length;i++){
			let oItems = oTable.getItems()[i].getCells()[oTable.getItems()[i].getCells().length-1].mAggregations.content[0].getItems();
			for(var j=0;j<oItems.length;j++){
				// let weekendDates = oItems[j].oBindingContexts.mLocalModel.getObject()["Weekend"];
				let aFullDay = oItems[j].oBindingContexts.mLocalModel.getObject()["FullDay"];
				for(var k=0;k<aFullDay.length;k++){
					oItems[j].oBindingContexts.mLocalModel.getObject()[aFullDay[k]].colorCode = "FullDay";
				}
				let aHalfDay = oItems[j].oBindingContexts.mLocalModel.getObject()["HalfDay"];
				for(var k=0;k<aHalfDay.length;k++){
					oItems[j].oBindingContexts.mLocalModel.getObject()[aHalfDay[k]].colorCode = "HalfDay";
				}
				let aHoliday = oItems[j].oBindingContexts.mLocalModel.getObject()["Holiday"];
				for(var k=0;k<aHoliday.length;k++){
					oItems[j].oBindingContexts.mLocalModel.getObject()[aHoliday[k]].colorCode = "Holiday";
				}
				let aWeekend = oItems[j].oBindingContexts.mLocalModel.getObject()["Weekend"];
				for(var k=0;k<aWeekend.length;k++){
					// oItems[j].oBindingContexts.mLocalModel.getObject()[oItems[j].oBindingContexts.mLocalModel.getObject()["Weekend"][k]].colorCode = "Weekend";
					oItems[j].oBindingContexts.mLocalModel.getObject()[aWeekend[k]].colorCode = "Weekend";
				}
			}
			
		}
		sap.ui.getCore().getModel("mLocalModel").refresh();
	}

	public async calculateExtraHourForLeaves(){
		// return ;
		let TimeSheetList = sap.ui.getCore().getModel("mLocalModel").getProperty('/TimeSheetList');
		for(let i=0; i<TimeSheetList.length; i++){
			let totalData = TimeSheetList[i].TaskList[TimeSheetList[i].TaskList.length - 1];
			let totalHour = parseInt(totalData.Task_name.match(/\d+/)[0]);
			for(let j=1; j<=31 && totalData[j]; j++){
				if(totalData[j].colorCode === "FullDay"){
					totalData[j].Work_hour = totalData[j].Work_hour + 8;
					totalHour = totalHour + 8; 
				}else if(totalData[j].colorCode === "HalfDay"){
					totalData[j].Work_hour = totalData[j].Work_hour + 4;
					totalHour = totalHour + 4;
				}
			}
			totalData.Task_name = "Total=" + totalHour;
		}
		sap.ui.getCore().getModel("mLocalModel").setProperty('/TimeSheetList', TimeSheetList);
	}

	public onRowShiftAction(oEvent){
		var oSource = oEvent.getSource();
			// oRow = oSource.getParentEntityP();
			oRow = oSource.getParent();
		let sPath = oRow.oBindingContexts.mLocalModel.sPath;
		let sIndex = parseInt((sPath.split("/"))[2]);
		// sap.ui.getCore().getModel("mLocalModel").getProperty("/" +(sPath.split("/"))[1]).length
		for(var i=0; i<sap.ui.getCore().getModel("mLocalModel").getProperty("/" +(sPath.split("/"))[1]).length; i++){
			if(i === sIndex){
				sap.ui.getCore().getModel("mLocalModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/Visibility", true);
				sap.ui.getCore().getModel("mLocalModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/Icon", "sap-icon://dropdown");
			}else{
				sap.ui.getCore().getModel("mLocalModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/Visibility", false);
				// this.tm.getTN((sPath.split("/"))[1] + "/" + i + "/Visibility").setData(false);
				sap.ui.getCore().getModel("mLocalModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/Icon", "sap-icon://feeder-arrow");
				// this.tm.getTN((sPath.split("/"))[1] + "/" + i + "/Icon").setData('sap-icon://feeder-arrow');
			}
		}
	}

	public async onAccept(oEvent){
		let aSelectedItemPath = sap.ui.getCore().byId("TimeSheetID").getSelectedContextPaths();
		if(aSelectedItemPath.length > 0){
			sap.ui.getCore().getModel("mLocalModel").setProperty("/Action","Accept");
			// this.tm.getTN('Action').setData('Accept');
			sap.ui.getCore().getModel("mLocalModel").setProperty("/Remarks","");
			// this.tm.getTN('Remarks').setData('');
			let oView = this.getView();
			let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.remarks";
			if(!this.oDialog) {
				this.oDialog = await sap.ui.core.Fragment.load({
					name:viewName,
					controller: this
				});
			 	oView.addDependent(this.oDialog);
				this.oDialog.open();
			} else {
				this.oDialog.open();
			}
		}else{
			sap.m.MessageToast.show("Please select atleast 1 record.", { duration: 2000 });
		}
	}

	public async onReject(oEvent){
		let aSelectedItemPath = sap.ui.getCore().byId("TimeSheetID").getSelectedContextPaths();
		if(aSelectedItemPath.length > 0){
			sap.ui.getCore().getModel("mLocalModel").setProperty("/Action","Reject");
			// this.tm.getTN('Action').setData('Reject');
			sap.ui.getCore().getModel("mLocalModel").setProperty("/Remarks","");
			// this.tm.getTN('Remarks').setData('');
			let oView = this.getView();
			let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.remarks";
			if(!this.oDialog) {
				this.oDialog = await sap.ui.core.Fragment.load({
			 		name: viewName,
					controller: this
				});
				oView.addDependent(this.oDialog);
				this.oDialog.open();
	 		} else {
				this.oDialog.open();
			}
		}else{
			sap.m.MessageToast.show("Please select atleast 1 record.", { duration: 2000 });
		}
	}

	public async onOkAction(oEvent){
		this.oDialog.close();
		// sap.ui.getCore().getModel("mLocalModel").getProperty("/Action")
		if(sap.ui.getCore().getModel("mLocalModel").getProperty("/Action") === "Accept"){
			sap.ui.getCore().getModel("mLocalModel").setProperty("/WarningIgnore",false);
			// this.tm.getTN('WarningIgnore').setData(false);
			this.onAcceptAction(oEvent);
		}else{
			this.onRejectAction(oEvent);
			// oControl.transaction.commitP();
		}
	}

	public async onClose(oEvent){
		this.oDialog.close();
	}

	public async onAcceptAction(oEvent){
		sap.m.MessageToast.show("Timesheet(s) Approved.", { duration: 2000 });
		let aSelectedItemPath = sap.ui.getCore().byId("TimeSheetID").getSelectedContextPaths();
		let aTimesheetHeaderList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetHeaderList");
		// let aTimesheetHeaderList = this.tm.getTN('TimesheetHeaderList').getData();
		// sap.ui.getCore().getModel("mLocalModel").getProperty("/WarningIgnore")
		if(!sap.ui.getCore().getModel("mLocalModel").getProperty("/WarningIgnore")){
			let lWarningFlag = false;
			for(var i=aSelectedItemPath.length-1;i>=0;i--){			
	
				let aTimesheetTask = sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/TaskList");
				// let aTimesheetTask = this.tm.getTN(aSelectedItemPath[i]+'/TaskList').getData();
				let stotal = aTimesheetTask[aTimesheetTask.length-1];
				let iFromDate = sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i])["from_date"].getDate();
				// let iFromDate = this.tm.getTN(aSelectedItemPath[i]).getData('from_date').getDate();
				let iToDate = sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i])["to_date"].getDate();
				// let iToDate = this.tm.getTN(aSelectedItemPath[i]).getData('to_date').getDate();
				for(var j=iFromDate;j<iToDate;j++){
					if(stotal[j]>8){
						lWarningFlag = true;
						break;
					}
				}
				if(lWarningFlag){
					break;
				}	
			}

			if(lWarningFlag){
				if (!this.oApproveDialog) {
					this.oApproveDialog = new sap.m.Dialog({
						type: sap.m.DialogType.Message,
						title: "Confirm",
						content: new sap.m.Text({ text: "Actual Hours entered was more than 8 hours" }),
						beginButton: new sap.m.Button({
							type: sap.m.ButtonType.Emphasized,
							text: "Continue",
							press: function () {
								sap.ui.getCore().getModel("mLocalModel").setProperty("/WarningIgnore",true);
								// this.tm.getTN('WarningIgnore').setData(true);
								this.onAcceptAction(oEvent);
								this.oApproveDialog.close();
							}.bind(this)
						}),
						endButton: new sap.m.Button({
							text: "Cancel",
							press: function () {
								this.oApproveDialog.close();
							}.bind(this)
						})
					});
				}

				this.oApproveDialog.open();
			}else{
				sap.ui.getCore().getModel("mLocalModel").setProperty("/WarningIgnore",true);
				// this.tm.getTN('WarningIgnore').setData(true);
			}

		}
		// sap.ui.getCore().getModel("mLocalModel").getProperty("/WarningIgnore")
		if(sap.ui.getCore().getModel("mLocalModel").getProperty("/WarningIgnore")){
			
			let aMenteeList = sap.ui.getCore().getModel("mLocalModel").getProperty("/MenteeList");
			// let aMenteeList = this.tm.getTN('MenteeList').getData();
			let aTimesheetHeaderList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetHeaderList");
			// let aTimesheetHeaderList = this.tm.getTN('TimesheetHeaderList').getData();

			for(var i=aSelectedItemPath.length-1;i>=0;i--){			
	
				let aTimesheet = sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]);
				// let aTimesheet = this.tm.getTN(aSelectedItemPath[i]).getData();
	
				let aTimesheetTaskList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetTaskList");
				// let aTimesheetTaskList = this.tm.getTN('TimesheetTaskList').getData();
				for(let j=0;j<aTimesheet.TaskList.length;j++){
					// if(aTimesheet.TaskList[j].Assigned_by_ID === userId.toLowerCase() || aTimesheet.TaskList[j].Assigned_by_ID === userId.toUpperCase()){ 
						for(var k=0;k<aTimesheetTaskList.length;k++){
							for(var l=0;l<aTimesheetTaskList[k].length;l++){
								if(aTimesheetTaskList[k][l].submit_id === sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id")
								&& aTimesheetTaskList[k][l].task_id === aTimesheet.TaskList[j].Task_ID){
									sap.ui.getCore().getModel("mLocalModel").setProperty("/TimesheetTaskList/"+k+"/"+l+"/status","Approved");
								}
							}
						}
					// }
				}

				//Check mentee list. if employee id present, update header table status approved
				// for(let j=0;j<aMenteeList.length;j++){
					// if(aMenteeList[j].employee_id === aTimesheet.employee_id){
						for(var k=0;k<aTimesheetHeaderList.length;k++){
							for(var l=0;l<aTimesheetHeaderList[k].length;l++){
								if(aTimesheet.employee_id === aTimesheetHeaderList[k][l].employee_id
								&& aTimesheet.submit_id === aTimesheetHeaderList[k][l].submit_id){
									sap.ui.getCore().getModel("mLocalModel").setProperty("/TimesheetHeaderList/"+k+"/"+l +"/over_all_status","Approved"); //Approved - Change
								}
							}
						}
						// break;
					// }
				// }
                
				if(sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/Visibility")){
					let iArrayLength = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimeSheetList").length;
					// let iArrayLength = this.tm.getTN('TimeSheetList').getData().length;
					if(parseInt(aSelectedItemPath[i].split("/")[2]) <= iArrayLength-2){
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Visibility", true);
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Visibility").setData(true);
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Icon", "sap-icon://dropdown");
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Icon").setData('sap-icon://dropdown');
					}else if(parseInt(aSelectedItemPath[i].split("/")[2]) === iArrayLength-1){
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Visibility", true);
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Visibility").setData(true);
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Icon", "sap-icon://dropdown");
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Icon").setData('sap-icon://dropdown');
					}else if(parseInt(aSelectedItemPath[i].split("/")[2]) > iArrayLength-1){
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Visibility", true);
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Visibility").setData(true);
						sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Icon", "sap-icon://dropdown");
						// this.tm.getTN(aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Icon").setData('sap-icon://dropdown');
					}
				}

				let aTimesheetApprList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetApprList");
				let sTimesheetAppr, bFlag = false;
				for(var j=1;j<aTimesheetApprList.length;j++){
					for(var k=0;k<aTimesheetApprList[j].length;k++){
						 if(aTimesheetApprList[j][k].submit_id === sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id")){
							 if(aTimesheetApprList[j][k].approval_status === "Approved"){
								sTimesheetAppr = {
									"submit_id": aTimesheetApprList[j][k].submit_id,
									"task_version": aTimesheetApprList[j][k].task_version,
									"approval_sequence": aTimesheetApprList[j][k].approval_sequence + 1,
									"approval_status": "Approved",
									"approved_hours": 0,
									"approved_on": new Date(),
									"approver": loginId,
									"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
								}
								bFlag = true;
								break;
							 }else if(aTimesheetApprList[j][k].approval_status === "Rejected"){
								sTimesheetAppr = {
									"submit_id": aTimesheetApprList[j][k].submit_id,
									"task_version": aTimesheetApprList[j][k].task_version + 1,
									"approval_sequence": 1,
									"approval_status": "Approved",
									"approved_hours": 0,
									"approved_on": new Date(),
									"approver": loginId,
									"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
									// "approver_remark": this.tm.getTN('Remarks').getData()
								}
								bFlag = true;
								break;
							 }
						 }
					}
					if(bFlag || sTimesheetAppr){
						break;
					}
				}
	
				if(sTimesheetAppr){
					await aTimesheetApprList[j].newEntityP(0,sTimesheetAppr, true);
					sap.ui.getCore().getModel("mLocalModel").getProperty("/"+aSelectedItemPath[i].split("/")[1]).splice(aSelectedItemPath[i].split("/")[2],1);
					sap.ui.getCore().getModel("mLocalModel").refresh();
				}else{
					sTimesheetAppr = {
						"submit_id": sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id"),
						// "submit_id": this.tm.getTN(aSelectedItemPath[i]+"/submit_id").getData(),
						"task_version": 0,
						"approval_sequence": 0,
						"approval_status": "Approved",
						"approved_hours": 0,
						"approved_on": new Date(),
						"approver": loginId,
						"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
						
					}
					await aTimesheetApprList[0].newEntityP(0,sTimesheetAppr, true);
					sap.ui.getCore().getModel("mLocalModel").getProperty("/"+aSelectedItemPath[i].split("/")[1]).splice(aSelectedItemPath[i].split("/")[2],1);
					sap.ui.getCore().getModel("mLocalModel").refresh();
				}
	
			}

		}
		oControl.transaction.commitP();
		sap.ui.getCore().byId("TimeSheetID").setSelectedContextPaths();
		sap.ui.getCore().getModel("mLocalModel").refresh();
	}

	public async onRejectAction(oEvent){
		sap.m.MessageToast.show("Rejected.", { duration: 2000 });
		let aSelectedItemPath = sap.ui.getCore().byId("TimeSheetID").getSelectedContextPaths();
		let aTimesheetHeaderList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetHeaderList");
		// let aTimesheetHeaderList = this.tm.getTN('TimesheetHeaderList').getData();
		for(var i=aSelectedItemPath.length-1;i>=0;i--){
			for(var j=0;j<aTimesheetHeaderList.length;j++){
				for(var k=0;k<aTimesheetHeaderList[j].length;k++){
					// sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/employee_id")
					// sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id")
					if(sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/employee_id") === aTimesheetHeaderList[j][k].employee_id
					&& sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id") === aTimesheetHeaderList[j][k].submit_id){
						sap.ui.getCore().getModel("mLocalModel").setProperty("/TimesheetHeaderList/"+j+"/"+k +"/over_all_status","Rejected"); //Rejected - Change
						// this.tm.getTN("TimesheetHeaderList/"+j+"/"+k +"/over_all_status").setData('Rejected');
						// sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetHeaderList/"+j+"/"+k).getTransaction().commitP();
					}
				}
			}
			// sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/Visibility")
			if(sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/Visibility")){
				let iArrayLength = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimeSheetList").length;
				// let iArrayLength = this.tm.getTN('TimeSheetList').getData().length;
				if(parseInt(aSelectedItemPath[i].split("/")[2]) <= iArrayLength-2){
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Visibility", true);
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])+1) +"/Icon", "sap-icon://dropdown");
				}else if(parseInt(aSelectedItemPath[i].split("/")[2]) === iArrayLength-1){
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Visibility", true);
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (parseInt(aSelectedItemPath[i].split("/")[2])-1) +"/Icon", "sap-icon://dropdown");
				}else if(parseInt(aSelectedItemPath[i].split("/")[2]) > iArrayLength-1){
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Visibility", true);
					sap.ui.getCore().getModel("mLocalModel").setProperty("/"+aSelectedItemPath[i].split("/")[1]+"/"+ (iArrayLength-1) +"/Icon", "sap-icon://dropdown");
				}
			}

			let aTimesheetTask = sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/TaskList");
			let aTimesheetTaskList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetTaskList");
			for(var j=0;j<aTimesheetTask.length;j++){
				if(aTimesheetTask[j].Assigned_by_ID === userId.toLowerCase() || aTimesheetTask[j].Assigned_by_ID === userId.toUpperCase()){ 
					for(var k=0;k<aTimesheetTaskList.length;k++){
						for(var l=0;l<aTimesheetTaskList[k].length;l++){
							if(aTimesheetTaskList[k][l].submit_id === sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id")
							&& aTimesheetTaskList[k][l].task_id === aTimesheetTask[j].Task_ID){
								sap.ui.getCore().getModel("mLocalModel").setProperty("/TimesheetTaskList/"+k+"/"+l+"/status","Rejected");
							}
						}
					}
				}
			}

			let aTimesheetApprList = sap.ui.getCore().getModel("mLocalModel").getProperty("/TimesheetApprList");
			let sTimesheetAppr, bFlag = false;
			for(var j=1;j<aTimesheetApprList.length;j++){
				for(var k=0;k<aTimesheetApprList[j].length;k++){
					 if(aTimesheetApprList[j][k].submit_id === sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id")){
						 if(aTimesheetApprList[j][k].approval_status === "Approved"){
							sTimesheetAppr = {
								"submit_id": aTimesheetApprList[j][k].submit_id,
								"task_version": aTimesheetApprList[j][k].task_version,
								"approval_sequence": aTimesheetApprList[j][k].approval_sequence + 1,
								"approval_status": "Rejected",
								"approved_hours": 0,
								"approved_on": new Date(),
								"approver": userId,
								"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
							}
						 }else if(aTimesheetApprList[j][k].approval_status === "Rejected"){
							sTimesheetAppr = {
								"submit_id": aTimesheetApprList[j][k].submit_id,
								"task_version": aTimesheetApprList[j][k].task_version + 1,
								"approval_sequence": 1,
								"approval_status": "Rejected",
								"approved_hours": 0,
								"approved_on": new Date(),
								"approver": userId,
								"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
							}
							bFlag = true;
							break;
						 }
					 }
				}
				if(bFlag || sTimesheetAppr){
					break;
				}
			}

			if(sTimesheetAppr){
				await aTimesheetApprList[j].newEntityP(0,sTimesheetAppr,true);
				sap.ui.getCore().getModel("mLocalModel").getProperty("/"+aSelectedItemPath[i].split("/")[1]).splice(aSelectedItemPath[i].split("/")[2],1);
				sap.ui.getCore().getModel("mLocalModel").refresh();
			}else{
				sTimesheetAppr = {
					"submit_id": sap.ui.getCore().getModel("mLocalModel").getProperty(aSelectedItemPath[i]+"/submit_id"),
					"task_version": 0,
					"approval_sequence": 0,
					"approval_status": "Rejected",
					"approved_hours": 0,
					"approved_on": new Date(),
					"approver": userId,
					"approver_remark": sap.ui.getCore().getModel("mLocalModel").getProperty("/Remarks")
				}
				
				await aTimesheetApprList[0].newEntityP(0,sTimesheetAppr,true);
				sap.ui.getCore().getModel("mLocalModel").getProperty("/"+aSelectedItemPath[i].split("/")[1]).splice(aSelectedItemPath[i].split("/")[2],1);
				sap.ui.getCore().getModel("mLocalModel").refresh();
			}

		}
		oControl.transaction.commitP();
	}

	public async onEdit(oEvent){
		var aItems = oEvent.getSource().getParent().getParent().getItems() 
		// Assuming all columns have the same structure	
		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var aCells = oItem.getCells();
			aCells.forEach(function(oCell) {
				if (oCell instanceof sap.m.Input) {
					oCell.setEnabled(true);
				}
			});
		}
	}

	public async onOpenRemark(oEvent){
		const YdirectPath = oEvent.getSource().getParent().getBindingContextPath();
		const x = oEvent.getSource().data("column");
		const RowData = sap.ui.getCore().getModel("mLocalModel").getProperty(YdirectPath);
		// const RowData = this.tm.getTN(YdirectPath).getData();
		const columnData = RowData[x];
		// to bind the remakrs with dialogbox
		let TimesheetTaskid = RowData.Task_ID;
		YdirectPath.split('/');
		let pathForDate = '/'+YdirectPath.split('/')[0] + YdirectPath.split('/')[1] +'/'+ YdirectPath.split('/')[2];
		let timesheetDate = sap.ui.getCore().getModel("mLocalModel").getProperty(pathForDate).from_date;
		// let timesheetDate = this.tm.getTN(pathForDate).getData('from_date');
		timesheetDate = timesheetDate.toString();
		// ******************
		this.getView().getModel("mLocalModel").setProperty('/path', YdirectPath);
		// this.tm.getTN('path').setData(YdirectPath);

		this.getView().getModel("mLocalModel").setProperty('/indexPath', x);
		// this.tm.getTN('indexPath').setData(x);
		// ******************
		this.getView().getModel("mLocalModel").setProperty('/day', x);
		// this.tm.getTN('day').setData(x);
		this.getView().getModel("mLocalModel").setProperty('/timesheetDate', timesheetDate);
		// this.tm.getTN('timesheetDate').setData(timesheetDate);
		this.getView().getModel("mLocalModel").setProperty('/TimesheetTaskid', TimesheetTaskid);
		// this.tm.getTN('TimesheetTaskid').setData(TimesheetTaskid);
		this.getView().getModel("mLocalModel").setProperty('/workRemark', columnData.Remark);
		// this.tm.getTN('workRemark').setData(columnData.Remark);

		var oView = this.getView();	
		// Load the popover fragment
		let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.p_timesheet_approver_remark";
		if (!this._oPopover) {
			let oEven = oEvent.getSource();
			this._oPopover = await sap.ui.core.Fragment.load({			
				name: viewName,
				controller: this
			});
			oView.addDependent(this._oPopover);
			this._oPopover.openBy(oEven);
		}
		else{
		this._oPopover.openBy(oEvent.getSource());
		}
	}

	public async onRemarkChange(oEvent) {
		return;
		// debugger;
		let day = sap.ui.getCore().getModel("mLocalModel").getProperty('/day');
		// let day = this.tm.getTN('day').getData();
		let date = sap.ui.getCore().getModel("mLocalModel").getProperty('/timesheetDate');
		// let date = this.tm.getTN('timesheetDate').getData();
		date = new Date(date);
		let taskId = sap.ui.getCore().getModel("mLocalModel").getProperty('/TimesheetTaskid');
		// let taskId = this.tm.getTN('TimesheetTaskid').getData();
		let year= date.getFullYear();
		let month = date.getMonth();
		// let year = sap.ui.getCore().getModel("mLocalModel").getProperty('/path');
		date = new Date(year,month,day);

		let path = sap.ui.getCore().getModel("mLocalModel").getProperty('/path');
		// let path = this.tm.getTN('path').getData();
		let indexPath = sap.ui.getCore().getModel("mLocalModel").getProperty('/indexPath');
		// let indexPath = this.tm.getTN('indexPath').getData();
		let newRemarkValue = oEvent.mParameters.newValue;
		await sap.ui.getCore().getModel("mLocalModel").setProperty(path+"/"+indexPath+"/Remark",newRemarkValue); 
		// this.tm.getTN(path+"/"+indexPath+"/Remark").setData(newRemarkValue);
		// await sap.ui.getCore().getModel("mLocalModel").getProperty(path).getTransaction().commitP();

		// let TaskBookingList = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking',{ 'task_id': taskId , loadAll: true});
		let timesheetTimeBooking= sap.ui.getCore().getModel("TimesheetApproval").getProperty("/timesheetTimeBooking");
		// let timesheetTimeBooking= this.tm.getTN('timesheetTimeBooking').getData();
		for(let i=0; i<timesheetTimeBooking.length; i++)
		{
			if(timesheetTimeBooking[i].task_id === taskId && timesheetTimeBooking[i].booking_date.toString() === date.toString())
			{
				timesheetTimeBooking[i].remarks = newRemarkValue;
				timesheetTimeBooking[i].update_remark = true;
			}
		}
		await sap.ui.getCore().getModel("TimesheetApproval").getProperty("/timesheetTimeBooking").getTransaction().commitP();
		// this.tm.getTN('timesheetTimeBooking').getData().getTransaction().commitP();
		sap.ui.getCore().getModel("mLocalModel").refresh();
		// this.tm.getTN('TimesheetApproval').getData().refresh();
	}


}