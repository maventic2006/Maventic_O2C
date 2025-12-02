import { KloController } from 'kloTouch/jspublic/KloController';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_country")
export default class p_o2c_country extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public onEdit(){ 
        this.setMode("EDIT"); 
    }
    public async onCreate(){
        await this.tm.getTN("o2c_countr_list").createEntityP({ s_object_type: -1 },"Creation Successful","Creation Failed",null,"First",true,true);
        
    }
	public async onSave(){
		await this.tm.commitP("Successfully Saved","Save failed",true,true);
		console.log("check");
	}
	public async onDelete(){
		
		const i = await this.getActiveControlById(null, "s_o2c_countr_list").getSelectedIndices();

		for (let j = 0; j < i.length; j++)
			await this.tm.getTN("o2c_countr_list").getData()[i[0]].deleteP();
		await this.tm.commitP("Deleted", "Delete failed", false, true);
		
	}
}