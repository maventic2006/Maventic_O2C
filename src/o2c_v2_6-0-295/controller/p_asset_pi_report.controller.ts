import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_pi_report")

export default class p_asset_pi_report extends KloController {

    public found = 0
    public notfound = 0

    public onPageInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }
    public async onPageEnter() {
        await this.tm.getTN("summery_chart").setData({})

        this.tm.getTN("asset_pi_header_search").setProperty('pi_status', 'Completed');
        await this.tm.getTN('button_color').setData({'complete_status':'deactivate','pending_status':'deactivate','all_status':'deactivate','deactivated_status':'deactivate'})

        await this.tm.getTN("asset_pi_header_search").executeP();


    }

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/


    //


    public async navToDetails(oEvent) {

        this.found = 0
        this.notfound = 0

        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/asset_pi_header_list/", ""));
        await this.tm.getTN("asset_pi_header_list").setActive(index);






        await this.navTo({ H: true, S: "p_asset_pi_report", SS: "pa_detail" });
        await this.tm.getTN("asset_pi_header_search").getData().setLoadAll(true)

        let pi_item_data = await this.tm.getTN("asset_pi_header_list").getData()[index].r_pi_asset_item;


        // pi_item_data.setExpandAll("r_booking_to_task_tr");

        for (let i = 0; i < pi_item_data.length; i++) {

            if (pi_item_data[i].asset_found == "Found") {
                this.found = this.found + 1;
            } else if (pi_item_data[i].asset_found == "Not Found") {
                this.notfound = this.notfound + 1;
            }
        }

        await this.tm.getTN('summery_chart').setData([{"chart_data": this.found, "type": "Found" ,"asset_found":this.found,"asset_not_found":this.notfound}, { "chart_data": this.notfound, "type": "Not Found","asset_found":this.found,"asset_not_found":this.notfound}]);
        // this.onChartRender()
        
    }



    public async onStatusButton(oEvent, param) {
        if(param.status == "Completed"){
            await this.tm.getTN('button_color').setData({'complete_status':'activate','pending_status':'deactivate','all_status':'deactivate','deactivated_status':'deactivate'})

        }else if(param.status == "Pending"){
            await this.tm.getTN('button_color').setData({'complete_status':'deactivate','pending_status':'activate','all_status':'deactivate','deactivated_status':'deactivate'})

        }else if(param.status == "Deactivated"){
            await this.tm.getTN('button_color').setData({'complete_status':'deactivate','pending_status':'deactivate','all_status':'deactivate','deactivated_status':'activate'})

        }else{
            await this.tm.getTN('button_color').setData({'complete_status':'deactivate','pending_status':'deactivate','all_status':'activate','deactivated_status':'deactivate'})

        }

        this.tm.getTN("asset_pi_header_search").setProperty('pi_status', param.status);

        await this.tm.getTN("asset_pi_header_search").executeP();
    }


    public async asset_found(oEvent){
        if(oEvent.mParameters.selectedIndex == 1){
           
            await this.tm.getTN("r_pi_asset_item_list").applyColumnFilterP("asset_found", "Found");

         
        }else if(oEvent.mParameters.selectedIndex == 2){
            await this.tm.getTN("r_pi_asset_item_list").applyColumnFilterP("asset_found", "Not Found");
            
        }


    }



}