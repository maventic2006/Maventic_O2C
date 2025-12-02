import { KloEntitySet } from 'kloBo/KloEntitySet';
import {KloController} from 'kloTouch/jspublic/KloController'
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5:any;
@KloUI5("o2c_o2c_v2base.controller.p_timesheet")
export default class p_timesheet extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	// public onExit() {
	// }
    public async onPageExit() {
		var view = this.getView();
            if (view) {
                view.destroy();
            }
        this.destroy();
	}
	public async onPageDestroy(){
		var view = this.getView();
            if (view) {
                view.destroy();
            }
		this.destroy();
	}
	public async onPageEnter(){
		let q = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_emp_filter', { loadAll: true });
		this.tm.getTN('other_linemanager').setData({});
		if(q.length > 1){
			await this.tm.getTN('other_linemanager').setProperty('roles', true);

		}
		let userRole = (await this.transaction.get$Role()).role_id;
		await this.tm.getTN("other_linemanager").setProperty("userRole",userRole);

		let general_confg = <KloEntitySet<d_general_confg>> await this.transaction.getExecutedQuery("d_general_confg",{loadAll: true, key: "timesheet_new", high_value: "1"});
		if(general_confg.length == 1){
			await this.tm.getTN("tab_visibility").setData(true);
		}else{
			await this.tm.getTN("tab_visibility").setData(false);
		}

		
	}
}