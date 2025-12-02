import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_trnsfr_rprt")
export default class p_asset_trnsfr_rprt extends KloController{
	
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
	    // await this.tm.getTN("asset_allocation_search").setProperty('action_status', "Approved");
		// await this.tm.getTN("asset_allocation_search").executeP();


		this.tm.getTN('search_other').setProperty("business_area","MVB2")
	}
	
}