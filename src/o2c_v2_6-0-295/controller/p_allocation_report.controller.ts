import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_allocation_report")
export default class p_allocation_report extends KloController{
	
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
	    await this.tm.getTN("asset_allocation_search").setProperty('action_status', "Approved");
		// await this.tm.getTN("asset_allocation_search").executeP();
	}
	
}