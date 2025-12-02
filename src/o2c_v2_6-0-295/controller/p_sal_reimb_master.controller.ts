import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_sal_reimb_master")
export default class p_sal_reimb_master extends KloController{
	public async approveSelectedSalaryReImbursement(){
		//let sPath: string = this.getPathFromEvent(oEvent);
    	//let index = parseInt(sPath.replace("/list/", ""));
		let list = await this.tm.getTN("list").getData();
        let selected_index = await this.getActiveControlById(null,"s_list").getSelectedIndices();
        for(let i=0; i<selected_index.length;i++){
			let selected = list[selected_index[i]]
            selected.reim_status="Approved"
        }
    await this.tm.commitP("Approved Successfully", "Approval Failed", true, true);
    }
    public async returnSelectedSalaryReImbursement(){
        let list = await this.tm.getTN("list").getData();
        let selected_index = await this.getActiveControlById(null,"s_list").getSelectedIndices();
        for(let i=0; i<selected_index.length;i++){
			let selected = list[selected_index[i]];
			selected.max_reimburse=selected.previous_reimburse;
            selected.reim_status="Returned";
        }
    await this.tm.commitP("Returned Successfully", "Returned Failed", true, true);
    }
	public async onSave(){
		let list = await this.tm.getTN("list").getData();
		for(let i=0; i<list.length;i++){
			if(!list[i].reim_status){
				list[i].reim_status="Approved";
			}
			if(!list[i].previous_reimburse){
				list[i].previous_reimburse=list[i].max_reimburse;
			}
		}
		await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
	}
}