import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_multi_asset_data")
export default class p_multi_asset_data extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public onEdit() {
		this.setMode("EDIT")
	}
	public async onSave() {
		await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
	}
	public async onCreate()
	{
		await this.tm.getTN("multiple_asset_config_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", false, true, false);
	}
}