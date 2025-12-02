import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_leave_category")
export default class p_o2c_leave_category extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public onAdd(){
        this.tm.getTN("o2c_leave_category_list").createEntityP({s_object_type:-1},"Creation Successful","Creation Failed",null,"First",true,true,false);
    }
    public onEdit(){
        this.setMode('EDIT');
    }
    public onSave(){
        this.tm.commitP("Saved Successfully", "Save Failed", false, true)
    }
    
    public async onDeletefn(){
        //const SelectedIndex = await this.getActiveControlById(null,'s_o2c_leave_category').getSelectedIndicesFrom();
       // const SelectedIndex = await this.getActiveControlById(null,'s_o2c_leave_category').getSelectedIndices();
        const SelectedIndex = await this.getActiveControlById(null, "s_o2c_leave_category_list").getSelectedIndices();
        for(let i = 0;i<=SelectedIndex.length;i++){
            this.tm.getTN('o2c_leave_category_list').getData()[SelectedIndex[i]].deleteP();
        }
    }
}