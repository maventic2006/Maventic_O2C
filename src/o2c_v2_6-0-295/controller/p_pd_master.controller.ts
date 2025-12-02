import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_pd_master")
export default class p_pd_master extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
    public async createTravelPD(){
        await this.tm.getTN("location_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
    }
    public async deleteTravelPD(){
        const selected = await this.getActiveControlById(null, "s_location_list").getSelectedIndices();
		await this.tm.getTN("travel_vacation_list").getData()[selected[0]].deleteP();
    }
	
}