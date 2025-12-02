import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_approval_confi")
export default class p_emp_approval_confi extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onCreate() {
        await this.tm.getTN('o2c_employee_approval_master_list').createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
    }
    public onEdit() {
        this.setMode("EDIT");
    }
    public async onDelete() {
        const index = await this.getActiveControlById(null,'s_emp_approve_list').getSelectedIndices();
        for (let j = 0; j <= index.length; j++) {
            this.tm.getTN("o2c_employee_approval_master_list").getData()[index[j]].deleteP();
        }
    }
    public async onSave(){
        await this.tm.commitP("Save Successful", "Save Failed", true, true);
    }
}