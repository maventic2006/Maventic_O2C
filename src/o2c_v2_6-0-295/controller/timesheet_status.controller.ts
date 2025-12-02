import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.timesheet_status")
export default class timesheet_status extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public companyCode;
    public employeeData;
    public leave_check = false;
    public timesheet_check = false;
    public async onPageEnter(){
        this.employeeData = await this.tm.getTN('emp_list').getData();
        let loginId = (await this.transaction.get$User()).login_id;
        let company = await this.transaction.getExecutedQuery('d_o2c_employee_org', {employee_id:loginId, loadAll: true}); 
        this.companyCode = company[0].company_code;
        this.tm.getTN('designation').setData({desig:this.companyCode});
    }
    public async onSave(){
        await this.tm.getTN('emp_list').getData();
        await this.tm.commitP("Change saved", "Save Failed", false, false);
        await this.tm.getTN("emp_list").refresh();
    }
    public async onCheckBoxSelect(oEvent){
        let check = oEvent.mParameters.selected;
        if(check){  
            this.timesheet_check = true;  
            let data = await this.tm.getTN('emp_list').getData();
            let filterData = data.filter(item => item.timesheet_not_required === check);
            this.tm.getTN('emp_list').setData(filterData);
        }else{
            this.timesheet_check = false;
            if(this.leave_check){
                this.tm.getTN('emp_list').setData(this.employeeData);
                let data = await this.tm.getTN('emp_list').getData();
                let filterData = data.filter(item => item.leave_not_required === this.leave_check);
                this.tm.getTN('emp_list').setData(filterData);
            }else{
                this.tm.getTN('emp_list').setData(this.employeeData);
            }
            
        }
        await this.tm.getTN("emp_list").refresh();
    }
    public async onLeaveCheckBoxSelect(oEvent){
        let check = oEvent.mParameters.selected;
        if(check){   
            this.leave_check = true; 
            let data = await this.tm.getTN('emp_list').getData();
            let filterData = data.filter(item => item.leave_not_required === check);
            this.tm.getTN('emp_list').setData(filterData);
        }else{
            this.leave_check = false;
            if(this.timesheet_check){
                this.tm.getTN('emp_list').setData(this.employeeData);
                let data = await this.tm.getTN('emp_list').getData();
                let filterData = data.filter(item => item.timesheet_not_required === this.timesheet_check);
                this.tm.getTN('emp_list').setData(filterData);
            }else{
                this.tm.getTN('emp_list').setData(this.employeeData);
            }           
        }
        await this.tm.getTN("emp_list").refresh();
    }
}