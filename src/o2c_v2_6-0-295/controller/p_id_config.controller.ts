import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_id_config")
export default class p_id_config extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onCreate(){
        await this.tm.getTN("id_config_list").createEntityP({}, null, null, null, "First", true, true, false);
    }
    public async onSave(){
        await this.tm.commitP("Saved Successfully!","Save Failed",true,true);
    }
    public onEdit(){
        this.setMode("EDIT");
    }
    public async onDelete(){
        const selected =await this.getActiveControlById(null,"s_id_config").getSelectedIndices();
		for (let inital = 0; inital < selected.length; inital++){
            await this.tm.getTN("id_config_list").getData()[selected[inital]].deleteP();
        }
		await this.tm.commitP("Deleted","Deletion failed",false,true);
    }
}