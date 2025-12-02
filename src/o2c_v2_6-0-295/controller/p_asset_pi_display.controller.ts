import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_pi_display")
export default class p_asset_pi_display extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/

    public onPageInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }
    public async navToDetails(oEvent) {
        // await this.navTo(({ S: "p_asset_purchase_req", SS: "s_asset_detail" }))
        await this.navTo(({H:true,S:"p_asset_pi_display", SS: "pa_detail" }), oEvent)

    }

    public async onPiDelete(){
        let oBusyDailog = new sap.m.BusyDialog().setText("Deleting...");
		oBusyDailog.open();
        let listData
        let pi_header_data = await this.tm.getTN("asset_pi_header_list").getActiveData();
        const selected = await this.getActiveControlById(null, "s_asset_pi_item_list").getSelectedIndices();
		for (let inital = 0; inital < selected.length; inital++) {
			listData = await this.tm.getTN("asset_item").getData()[selected[inital]]
            listData.status = "Deleted"
            pi_header_data.total_asset_pi = pi_header_data.total_asset_pi - 1;

		}

		await this.tm.commitP("Deleted Successfully", "Failed to Delete", true, true);
        await this.tm.getTN('asset_item').resetP(true);
        await this.tm.getTN('asset_item').refresh();
        oBusyDailog.close()

    }

    public async onPiDeactivated(oEvent){
        let oBusyDailog = new sap.m.BusyDialog().setText("Deactivating...");
		oBusyDailog.open();
        let listData = await this.tm.getTN("asset_item").getData();
		for (let inital = 0; inital < listData.length; inital++) {
            if(listData[inital].status == "Pending")
                listData[inital].status = "Deactivated"

		}
        let pi_header = await this.tm.getTN("asset_pi_header_detail").getData();
        pi_header.pi_status = "Deactivated"

		await this.tm.commitP("Deactivated Successfully", "Failed to Deactivate", true, true);
        //await this.navTo(({ SS: 'pa_list' }), oEvent)
        
        
        await this.navTo(({S:"p_asset_pi_display", SS:'pa_list'}));
        await this.tm.getTN('asset_pi_header_list').resetP(true);
        await this.tm.getTN('asset_pi_header_list').refresh();
        oBusyDailog.close()

    }

    public async onSavebtn(oEvent){
        await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true)
        await this.navTo(({S:"p_asset_pi_display", SS:'pa_list'}));
        // this.onNavBack()
        // await this.navTo(({ SS: 'pa_list' }), oEvent)
    }

    //
   
	
}