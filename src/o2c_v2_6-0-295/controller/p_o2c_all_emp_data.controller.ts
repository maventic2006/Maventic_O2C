import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_all_emp_data")
export default class p_o2c_all_emp_data extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
    public async getImage(path) {
		let attachment = await path.getAttachmentP();
		return attachment;
	}
	public async onNavigateEmpSalaryDetail(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_employee_list/", ''))
		let empID = this.tm.getTN("o2c_employee_list").getData()[index].employee_id;
		let img = this.tm.getTN("o2c_employee_list").getData()[index].profile_pic;
		let fullName = this.tm.getTN("o2c_employee_list").getData()[index].full_name;
		let joiningDate = this.tm.getTN("o2c_employee_list").getData()[index].joining_date;
		let designationID=this.tm.getTN("o2c_employee_list").getData()[index].r_o2c_emp_designation[0].designation;

		let designationName=await this.transaction.getExecutedQuery('d_o2c_designation_master',{loadAll:true,designation_id:designationID});

		await this.navTo(({ S: 'p_emp_salary_detail', AD: [empID,fullName,designationName[0].name,await img.getAttachmentP(),joiningDate] }));
	}
	
}