import * as BaseController from 'kloTouch/controller/BaseController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_company_info")
export default class p_o2c_company_info extends BaseController.BaseController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public onEdit()
    {
        this.setMode("EDIT");
    }
	public onSave()
	{
		this.tm.commitP("Save Successfully","Save Failed",false,true);
	}
}