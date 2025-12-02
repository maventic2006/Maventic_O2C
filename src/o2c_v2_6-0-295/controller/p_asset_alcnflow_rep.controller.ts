import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import {KloController} from 'kloTouch/jspublic/KloController';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_alcnflow_rep")
export default class p_asset_alcnflow_rep extends KloController{
	public onPageInit() {
		try {
			FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
		} catch (error) {
			sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
			throw error;
		}
	}
	public async onPageEnter() {
        // this.tm.getTN("asset_search").setProperty('asset_number', assetNumber);
        await this.tm.getTN("asset_allocation_request_search").executeP();
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public async afterSearch(){
		this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_asset_a_search"));
	}
	
}