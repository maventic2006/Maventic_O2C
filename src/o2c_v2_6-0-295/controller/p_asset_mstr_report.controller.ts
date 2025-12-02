import { KloEntitySet } from 'kloBo/KloEntitySet';
import {KloController} from 'kloTouch/jspublic/KloController'
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_mstr_report")
export default class p_asset_mstr_report extends KloController{
	
    public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		let loginid = (await this.transaction.get$User()).login_id;
	    // await this.tm.getTN("asset_master_search").setProperty('status', "In Store");
        let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: loginid,loadAll: true });
        await this.tm.getTN("asset_master_search").setProperty('company_code', emp_org[0].company_code);
	}
	
	
	
}