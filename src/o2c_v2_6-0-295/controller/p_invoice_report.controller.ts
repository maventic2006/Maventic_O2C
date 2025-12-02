import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_invoice_report")
export default class p_invoice_report extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public onEdit() {
		this.setMode("EDIT");
	}
    public async onSave() {
		await this.tm.commitP("Save Successfully", "Save Failed", true, true);
	}
}