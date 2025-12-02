import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_invoice_irn")
export default class p_o2c_invoice_irn extends KloController{
	
    public async onCreate()
    {
        await this.tm.getTN("o2c_invoice_irn_table_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", false, true, false);
    }
    public async onEdit()
    {
        await this.setMode('EDIT');
    }
    public async onSave()
    {
        await this.tm.commitP("Saved Successfully","Save Failed",true,true)
    }
	
}