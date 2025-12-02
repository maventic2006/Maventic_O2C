import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_test_item_list")
export default class p_test_item_list extends KloController{
	public async onPageEnter(){
        await this.tm.getTN("header_other").setData({});
    }
	public async navtoPanelist(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/item_list/", ''));
		let item = this.tm.getTN("item_list").getData()[index].my_key;
		await this.navTo(({ TS: true, H: true, S: "p_colddrink_test", SS: "pa_panelist_screen",AD:item }));
	}
	//test
    public async employee_filter(){
        const selectedPanelist = this.tm.getTN("header_other").getData();
        if (selectedPanelist?.selected_panalist != null && selectedPanelist?.selected_panalist != "" && selectedPanelist?.selected_panalist != undefined) {
            await this.tm.getTN("item_list_search").setProperty("employee", selectedPanelist.selected_panalist);
            await this.tm.getTN("item_list_search").executeP();
        }
    }
}