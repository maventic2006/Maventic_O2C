import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_leave_approval")
export default class p_o2c_leave_approval extends  KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public onAdd(){
        this.tm.getTN('o2c_leave_approval_config_list').createEntityP({s_object_type:-1},"Creation Successful","Creation Failed",null,"First",true,true,false);
    }
    public onEdit(){
        this.setMode('EDIT');
    }
    public onSave(){
        this.tm.commitP("Saved Successfully", "Save Failed", false, true)
    }
    
    public async onDeletefn(){
        
        const SelectedIndex = await this.getActiveControlById(null,'s_o2c_lea_list04').getSelectedIndicesFrom('s_o2c_lea_list04');
        for(let i = 0;i<=SelectedIndex.length;i++){
            this.tm.getTN('o2c_leave_approval_config_list').getData()[SelectedIndex[i]].deleteP();
        }
    }
}