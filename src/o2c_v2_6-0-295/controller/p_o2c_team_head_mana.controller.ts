import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_team_head_mana")
export default class p_o2c_team_head_mana extends KloController {
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/

	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public async getCompanyCode(value) {
		let employeeData = await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true, employee_id: this.transaction.getUserID() });
		return employeeData[0].company_code;
	}
}
