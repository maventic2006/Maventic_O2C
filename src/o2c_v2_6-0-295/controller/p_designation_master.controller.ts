import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_designation_master")
export default class p_designation_master extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onCreate() {
        await this.tm.getTN('desig_list').createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
    }
    public onEdit() {
        this.setMode("EDIT");
    }
    public async delete() {
        const index = await this.getActiveControlById(null,'s_desig_list').getSelectedIndices();
        for (let j = 0; j < index.length; j++) {
            this.tm.getTN("desig_list").getData()[index[j]].deleteP();
        }
        await this.transaction.commitP()
    }
    public onDelete(){
        sap.m.MessageBox.warning("Are you sure you want to delete?", {
			title: "Warning",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.delete();
				}
			}
		})
    }
    public async onSave(){
        this.tm.commitP("Save Successful", "Save Failed", true, true);
    }
}