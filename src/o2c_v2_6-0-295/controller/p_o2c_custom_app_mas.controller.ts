import {KloController} from 'kloTouch/jspublic/KloController';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_custom_app_mas")
export default class p_o2c_custom_app_mas extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onSave(){
        this.tm.commitP("Saved Successfully","Save Failed",true,true);
    } 
    public onEdit(){ 
        this.setMode("EDIT"); 
    }
    public async onDelete(){
        const index = await this.getActiveControlById(null,'s_o2c_custom_list').getSelectedIndices();
        for(let j=index.length-1;j>=0;j--){
        this.tm.getTN("o2c_custom_list").getData()[index[j]].deleteP();
    }    
    }
    public async onCreate(){
        await this.tm.getTN("o2c_custom_list").createEntityP({s_object_type:-1},"Creation Successful","Creation Failed",null,"First",true,true,false);
    }
}