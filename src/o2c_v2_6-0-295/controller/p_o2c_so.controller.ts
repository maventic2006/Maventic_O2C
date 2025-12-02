import * as BaseController from 'kloTouch/controller/BaseController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_so")
export default class p_o2c_so extends BaseController.BaseController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    /*public async send_approval_button(){
		
        let entity= this.tm.getTN('/o2c_so_hdr_detail').getData();
		if(entity.s_status=="send for approval"){
		sap.m.MessageBox.information("Already SO is send for Approval")
		}
		else{
        entity.s_status="send for approval";
        await this.tm.commitP("Send SO For Approval","Save failed",false,true);
		}
	*/
    }
