import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_so_approval_master")
export default class p_so_approval_master extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}

    public async onCreate()
    {
        await this.tm.getTN("o2c_so_approval_master_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
    }
    public async onEdit()
    {
        this.setMode("EDIT");
    }
    public async onSave()
    {
        await this.tm.commitP("Save Successfully", "Save Failed", true, true);
    }
}