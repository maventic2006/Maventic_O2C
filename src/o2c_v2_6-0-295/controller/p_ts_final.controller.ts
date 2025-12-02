import { KloEntitySet } from 'kloBo/KloEntitySet';
import {KloController} from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_ts_final")
export default class p_ts_final extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public  employee_status;
	public async onPageEnter(){
		let list = new Set();
		let from_date=new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		let submission;
		let timesheet_index;
		let time_sheet =<KloEntitySet<d_o2c_timesheet_header>> await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {"from_date":from_date, loadAll: true})
        let employee =<KloEntitySet<d_o2c_employee>> await this.transaction.getExecutedQuery('d_o2c_employee',{ loadAll: true})
		for(let i=0;i<employee.length;i++){
			submission=false;
			for(let j=0;j<time_sheet.length;j++){
				if(employee[i].employee_id==time_sheet[j].employee_id){
					submission=true;
					timesheet_index=j;
				}
			}
			if(submission==true){
				let employee_table = {employee_id:employee[i].employee_id,employee_name:employee[i].full_name,overall_status:time_sheet[timesheet_index].over_all_status,submitted_on:time_sheet[timesheet_index].submitted_on,from_date:time_sheet[timesheet_index].from_date}
				list.add(employee_table);
			}
			if (submission==false){
				let employee_table = {employee_id:employee[i].employee_id,employee_name:employee[i].full_name,overall_status:"Not Submitted"}
				list.add(employee_table);
			}
			this.employee_status=Array.from(list);
			this.tm.getTN("employee_store").setData(this.employee_status);
		}
	}
}
