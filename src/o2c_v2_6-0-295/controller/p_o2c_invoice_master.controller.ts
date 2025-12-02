import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_invoice_master")
export default class p_o2c_invoice_master extends KloController{
	
    public async onCreate()
    {
        await this.tm.getTN("o2c_invoice_master_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
    }

    public async onEdit() {
		await this.setMode("EDIT");
	}
    
    public async onSave() {
		await this.tm.commitP("Save Successfully", "Save Failed", true, true);
	}
	
}