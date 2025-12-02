import { KloController } from "kloTouch/jspublic/KloController";
import { Status } from "o2c_v2/util/enum";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_goal_rev_track")
export default class p_pms_goal_rev_track extends KloController {
	public async onPageEnter() {
		await this.tm.getTN("status_list").setData(Status.reviewStatus);
	}

	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public async onClickRefresh() {
		await this.tm.getTN("pms_goal_review_hdr_list").getData().refreshP();
	}
	public onSearchSettingStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Completed") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_mgr_submitted_review", 1);
		}
		if (value == "In-progress") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_mgr_submitted_review", false);
		}
	}
	public onEnterEmployeePlane(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Completed") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_emp_submitted_review", 1);
		}
		if (value == "In-progress") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_emp_submitted_review", false);
		}
	}
	public async onResetSearch() {
		this.getActiveControlById("setting_status", "s_pms_per_search").setValue(null);
		this.getActiveControlById("employee_plan_s", "s_pms_per_search").setValue(null);
	}
}
