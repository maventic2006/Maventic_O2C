import {KloController} from 'kloTouch/jspublic/KloController';
import { d_o2c_customers} from 'o2c_base/entity/d_o2c_customers';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_custom_ap_fl")
export default class p_o2c_custom_ap_fl extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onSave(){
            this.tm.commitP("Saved Successfully","Save Failed",true,true);
    } 
}