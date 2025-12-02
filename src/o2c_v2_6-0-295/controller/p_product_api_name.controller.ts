import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_product_api_name")
export default class p_product_api_name extends KloController {
    public productID;
    public type;
    public async onPageEnter(oEvent) {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
        const productID = oEvent.navToParams.AD[0];
        const type = oEvent.navToParams.AD[1];
        this.productID = productID;
        this.type = type;
        await this.tm.getTN("search").setProperty('product_id', productID);
        await this.tm.getTN("search").setProperty('subscription_type', type);
        await this.tm.getTN("search").executeP();
        await this.tm.getTN("other").setData({});
    }
    public async createEntity() {
        let objectData;
        if (this.type == "API")
            objectData = 'api_object_type';
        else
            objectData = 'amc_object_type';
        await this.tm.getTN("o2c_product_based_api_type_list").createEntityP({ s_object_type: objectData, product: this.productID, subscription_type: this.type }, null, null, null, "First", false, true, false)

    }
    public async onSave() {
        await this.tm.commitP("Successfully Saved", "Save failed", true, true);
    }
    public async cancel() {
        await this.transaction.rollback();
        await this.tm.getTN("o2c_product_based_api_type_list").refresh();
        this.setMode("REVIEW");
    }
    public async onEdit(oEvent: sap.ui.base.Event){
        let path = this.getPathFromEvent(oEvent);
	    let index = parseInt(path.replace("/o2c_product_based_api_type_list/", ''))
        let data=await this.tm.getTN("o2c_product_based_api_type_list").getData();
        await this.tm.getTN("other").setData({'api_id':data[index].api_id});
		this.setMode("EDIT");

    }
    public async onDelete(oEvent: sap.ui.base.Event){
        let path = this.getPathFromEvent(oEvent);
	    let index = parseInt(path.replace("/o2c_product_based_api_type_list/", ''))
        let data=await this.tm.getTN("o2c_product_based_api_type_list").getData();
        data[index].deleteP();

    }
    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/


}