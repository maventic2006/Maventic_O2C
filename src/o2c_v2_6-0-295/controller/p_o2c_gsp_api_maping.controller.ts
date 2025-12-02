import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_gsp_api_maping")
export default class p_o2c_gsp_api_maping extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
    public async onCreate()
    {
        await this.tm.getTN("o2c_gsp_api_mapping_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", false, true, false);
    }
	
}