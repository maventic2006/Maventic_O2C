import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_monthly_timesheet")
export default class p_monthly_timesheet extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public employee_status;
    public array_list = new Set();
    public roleid;
    public datecheck;
    public login_id;
    public allEmployeeData;
    public async onPageEnter() {
        let from_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let result = from_date.toLocaleDateString();
        this.datecheck = result;
        this.tm.getTN("date_srch_store").setData({});
        this.tm.getTN("end_mnth_store").setData({});
        this.ListFetching(result);
    }
    public async onDateFilter() {

        this.array_list.clear()
            let oBusyDailog = new sap.m.BusyDialog();
            oBusyDailog.open();
            let datefilter = this.tm.getTN("date_srch_store").getData().date;
            let month = new Date(new Date(datefilter).getFullYear(), new Date(datefilter).getMonth(), 1);
            let start_month = new Date(datefilter).getMonth()
            this.datecheck = datefilter;
                await this.ListFetching(month);
                // store the month
                // this.tm.getTN("date_srch_store").setData({date: });
            if (month != undefined) {
                this.employee_status = Array.from(this.array_list);
                this.tm.getTN("emp_store").setData(this.employee_status);
            }

            setTimeout(async () => { oBusyDailog.close() }, 1500)
        this.tm.getTN("emp_store").applysortP("employee_id", "DESC")
        this.tm.getTN("emp_store").refresh()
        this.allEmployeeData = await this.tm.getTN('emp_store').getData();
    }
    public async ListFetching(from_date) {
        let submission;
        let submit_task_list;
        let approved_task_list;
        let timesheet_index;
        let first_day = new Date(new Date(from_date).getFullYear(), new Date(from_date).getMonth(), 1);
        let end_day = new Date(new Date(from_date).getFullYear(), new Date(from_date).getMonth() + 1, 0);
        //let time_sheet =<KloEntitySet<d_o2c_timesheet_header>> await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {loadAll: true,"from_date":from_date})
        let time_sheet = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery('q_o2c_timesheet_list', { loadAll: true, date_of_search: first_day, date_of_end: end_day });
        let submit_id_array = time_sheet.map(a => a.submit_id);
        let employee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_filter_employee', { "is_active": true, loadAll: true })
        let timesheet_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery('d_o2c_timesheet_task', { "submit_id": submit_id_array, loadAll: true })
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
            if (submission == true) {
                for (let k = 0; k < timesheet_task.length; k++) {
                    if (time_sheet[timesheet_index].submit_id == timesheet_task[k].submit_id) {
                        submit_task_list = submit_task_list + 1;
                        if (timesheet_task[k].status == "Approved") {
                            approved_task_list = approved_task_list + 1;
                        }
                    }
                }
                if (approved_task_list < submit_task_list && approved_task_list != 0 && time_sheet[timesheet_index].over_all_status == "Submitted") {
                    let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Partially Approved", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                    this.array_list.add(employee_table);
                }
                else if (time_sheet[timesheet_index].over_all_status == "Approved") {
                    let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Approved", submitted_on: time_sheet[timesheet_index].submitted_on, approved_on: time_sheet[timesheet_index].s_modified_on, mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                    this.array_list.add(employee_table);
                }
                else if (time_sheet[timesheet_index].over_all_status == "Submitted") {
                    let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Submitted", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                    this.array_list.add(employee_table);
                }
                else if (time_sheet[timesheet_index].over_all_status == "Rejected") {
                    let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Rejected", submitted_on: time_sheet[timesheet_index].submitted_on, mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                    this.array_list.add(employee_table);
                }
                else {
                    let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Not Submitted", mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                    this.array_list.add(employee_table);
                }
            }
            else if (submission == false) {
                let employee_table = { date_month: first_day, employee_id: employee[i].employee_id, employee_name: employee[i].full_name, line_manager: employee[i].line_manager, overall_status: "Not Submitted", mail_id: employee[i].official_mail, mobile_no: employee[i].phone_number }
                this.array_list.add(employee_table);
            }
        }

    }


    // As per your requirement Nasim Ali Mondal
    public async onSubmit(path){
        //Isme coding kar lena Nasim
        // debugger;
        // const index = await this.getActiveControlById(null,'s_report_list').getSelectedIndices();
        // let sPath = this.getPathFromEvent(event);
        let index = parseInt(path.replace("/emp_store/", '')) ;
        let selectedData = this.tm.getTN("emp_store").getData()[index];
        let selectedDate = new Date(this.tm.getTN("date_srch_store").getData().date);
        let submitHistory = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', { 'employee_id': selectedData.employee_id, loadAll: true });
        let submitId = [] ;
        for (let i = 0; i < submitHistory.length && submitHistory.length > 0; i++) {
			if (submitHistory[i].from_date.getMonth() === selectedDate.getMonth() && submitHistory[i].from_date.getFullYear() === selectedDate.getFullYear()) {
				// submitId = submitHistory[i].submit_id;
                submitId.push(submitHistory[i].submit_id);
                await submitHistory[i].deleteP();
			}
		}
        let submittedTask, approverTableData;
        if(submitId.length>0){
            submittedTask =  await this.transaction.getExecutedQuery('d_o2c_timesheet_task', {"submit_id":submitId, loadAll: true});
            approverTableData = await this.transaction.getExecutedQuery('d_o2c_timesheet_approver', { 'submit_id': submitId, loadAll: true });
        }
        for(let i=0; i<submittedTask.length; i++){
            submittedTask[i].deleteP();
        }
        for(let i=0; i<approverTableData.length; i++){
            approverTableData[i].deleteP();
        }
        // for(let i=submittedTask.length-1; i>=0; i--){
        //     submittedTask[i].deleteP();
        // }
        // for(let i=approverTableData.length-1; i>=0; i--){
        //     approverTableData[i].deleteP();
        // }

        await this.tm.commitP("Timesheet re opened", "Save Failed", false, false);
        await this.tm.getTN("emp_store").refresh();
        // selectedData.submitted_on = "";
        // selectedData.overall_status = "Not Submitted";
        // if(selectedData.approved_on){
        //    selectedData.approved_on = ""; 
        // }

    }
    public async onSearch(oEvent){
        let value = oEvent.mParameters.value;
        if(value === ""){
            this.tm.getTN('emp_store').setData(this.allEmployeeData);
            await this.tm.getTN('emp_list').applyfilterP('employee_id',value);
            await this.tm.getTN("emp_list").refresh();
            return;
        }
        await this.tm.getTN('emp_list').applyfilterP('employee_id',value);
         await this.tm.getTN("emp_list").refresh();
    }

    public async employeeSearch(oEvent){
        let value = oEvent.mParameters.listItem.mProperties.title;
        let data = await this.tm.getTN('emp_store').getData();
        data = data.filter(item => item.employee_id.toUpperCase() === value.toUpperCase());
        this.tm.getTN('emp_store').setData(data);
        
    }
    public async onReset(){
        this.tm.getTN('emp_store').setData(this.allEmployeeData);
        await this.tm.getTN('emp_list').applyfilterP('employee_id',"");
        await this.tm.getTN("emp_list").refresh();
    }
    // for reopen
    public async onReopen(oEvent){
        let path = this.getPathFromEvent(oEvent);
        sap.m.MessageBox.confirm("Do you really want to reopen the timesheet?", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onSubmit(path);
                    let month = this.tm.getTN("date_srch_store").getData().date;
                    this.ListFetching(month);
				}
			}
		})
        
    }
}