import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_skill_master")
export default class p_skill_master extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onCreate() {
        await this.tm.getTN('skill_matser_list').createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
    }
    public onEdit() {
        this.setMode("EDIT");
    }
    public async onDelete() {
        const index = await this.getActiveControlById(null,'s_skill_list').getSelectedIndices();
        for (let j = 0; j < index.length; j++) {
            this.tm.getTN("skill_matser_list").getData()[index[j]].deleteP();
        }
        await this.transaction.commitP();
    }
    public async onSave(){
        this.tm.commitP("Save Successful", "Save Failed", true, true);
    }
    public delete(){
        sap.m.MessageBox.warning("Are you sure you want to delete?", {
			title: "Warning",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onDelete();
				}
			}
		})
    }
}