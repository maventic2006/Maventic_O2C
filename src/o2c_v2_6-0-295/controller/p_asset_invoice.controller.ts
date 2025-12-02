import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_invoice")
export default class p_asset_invoice extends KloController {

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

    public async invoiceDownload(oEvent, param) {


        let path = this.getPathFromEvent(oEvent);
        this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))

        //await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();

        let docdownload = await this.tm.getTN(param.trans_node).getActiveData()



        await docdownload.file_content.downloadAttachP();



    }

    public async afterSearch(){
        this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_asset_p_search"));
    }
}