import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_key_project")
export default class p_o2c_key_project extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
    public async onCreate()
    {
        await this.tm.getTN("o2c_key_project_list_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", false, true, false);
    }
    public async onEdit()
    {
        await this.setMode('EDIT');
    }
    public async onSave()
    {
        await this.tm.commitP("Saved Successfully","Save Failed",true,true)
    }

    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_o2c_challenges" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_o2c_overdue_invoic" }))
    }
	
}