import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_product_master")
export default class p_o2c_product_master extends KloController{
	
	public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
		await this.tm.getTN("other").setData({});
	}
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public async onEdit(oEvent: sap.ui.base.Event){
        let path = this.getPathFromEvent(oEvent);
	    let index = parseInt(path.replace("/o2c_product_master_list/", ''))
        let data=await this.tm.getTN("o2c_product_master_list").getData();
        await this.tm.getTN("other").setData({'product_id':data[index].product_id});
		this.setMode("EDIT");

    }
    public async onDelete(oEvent: sap.ui.base.Event){
        let path = this.getPathFromEvent(oEvent);
	    let index = parseInt(path.replace("/o2c_product_master_list/", ''))
        let data=await this.tm.getTN("o2c_product_master_list").getData();
        data[index].deleteP();

    }
	public async onNavigateSubscriptionAPIScreen(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_product_master_list/", ''))
		let productID = this.tm.getTN("o2c_product_master_list").getData()[index].product_id;
		
		await this.navTo(({ S: 'p_product_api_name',AD:[productID,"API"] }));
	}
	public async onNavigateSubscriptionAMCScreen(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_product_master_list/", ''))
		let productID = this.tm.getTN("o2c_product_master_list").getData()[index].product_id;
		
		await this.navTo(({ S: 'p_product_api_name',AD:[productID,"AMC"] }));
	}
}