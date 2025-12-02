import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_amc_report")
export default class p_amc_report extends KloController{
	
	public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}
	
    public async onValiditySelect(oEvent){
        var selectedIndex = oEvent.getParameter("selectedIndex");
        var selectedButtonText = oEvent.getSource().getButtons()[selectedIndex].getText();
        let currentDate = new Date();
        if(selectedButtonText != "Expired"){
            currentDate.setDate(currentDate.getDate() + 30);
        }
        await this.tm.getTN('asset_amc_search').setProperty('expiry_date', currentDate);
    }
	
}