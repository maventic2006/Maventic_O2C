import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_ind_gst_tax_mas")
export default class p_ind_gst_tax_mas extends KloController{
	
    public async onCreate()
    {
        await this.tm.getTN("o2c_ind_gst_tax_master_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", false, true, false);
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