import { KloController } from 'kloTouch/jspublic/KloController';
declare let KloUI5:any;
@KloUI5("o2c_common.controller.p_o2c_exchange_rate")
export default class p_o2c_exchange_rate extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public onCreate(){
        this.tm.getTN("o2c_exchan_list").createEntityP("Creation Successful","Creation Failed",null,"First",true,true);
        
    }
    public onEdit(){ 
        this.setMode("EDIT"); 
    }
    public onSave(){
		this.tm.commitP("Successfully Saved","Save failed",false,true);
	}
	public async onDelete(){
		
		const step=await this.getActiveControlById(null,"s_o2c_exchan_list").getSelectedIndices();
		for(let inital=0;inital<step.length;inital++)
		await this.tm.getTN("o2c_exchan_list").getData()[step[0]].deleteP();
		await this.tm.commitP("Deleted","Delete failed",false,true);
	}
}