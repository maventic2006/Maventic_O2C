import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_deshboard")

export default class p_asset_deshboard extends KloController {

    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter(oEvent) {
        this.tm.getTN("asset_additional_details").setData({});

        let oBusyDailog = new sap.m.BusyDialog().setText("Fetching Data...").open();
        let assetNumber = oEvent.navToParams.AssetNumber
        this.tm.getTN("asset_search").setProperty('asset_number', assetNumber);
        await this.tm.getTN("asset_search").executeP();
        await this.tm.getTN('asset_lists').setActiveFirst()

        // asset details charactestics
		let asset_details = await this.transaction.getExecutedQuery(
			'd_asset_creation',
			{
				'asset_number': assetNumber,
				loadAll: true
			});
        let additionalDetails = await this.transaction.getExecutedQuery(
			'd_asset_additional_details',
			{
				'asset_class': asset_details[0].asset_class,
				loadAll: true
			});
			await this.tm.getTN("asset_additional_details").setData(additionalDetails[0]);


        oBusyDailog.close();

    }
    public async navToDetails(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        await this.navTo(({ SS: 'pa_details' }), oEvent)
    }
}