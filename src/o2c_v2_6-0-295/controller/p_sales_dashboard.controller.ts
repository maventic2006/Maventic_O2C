import { KloController } from 'kloTouch/jspublic/KloController';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_sales_dashboard")
export default class p_sales_dashboard extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		let q = await this.transaction.getExecutedQuery('d_general_confg', { loadAll: true, 'key': "so_new", 'high_value': "1" })
		if (q.length)
			this.tm.getTN("so_new").setData({ 'visible': true });
		else
			this.tm.getTN("so_new").setData({ 'visible': false });
	}
	public async navScreenCreate() {
		this.navTo(({ S: 'p_o2c_so_hdr' }));
	}
	//approval Screen
	public async navScreenapproval() {
		this.navTo(({ S: 'p_o2c_soo_aprvl' }));
	}

	//New SO Screen
	public async navNewSO() {
		this.navTo(({ S: 'p_sales_order_list' }));
	}
}