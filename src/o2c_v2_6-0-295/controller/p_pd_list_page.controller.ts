import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_pd_list_page")
export default class p_pd_list_page extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
    public async onPageEnter() {
        // await this.tm.getTN("pd_list_search").setData({});
        const expenseTypeData = [
            { expense_type: "Ready For Payment" },
            { expense_type: "Paid" },
            { expense_type: "Approved by Finance" }
          ];
          
          this.tm.getTN("pd_list_search").setProperty("data",expenseTypeData);
    }
	
}