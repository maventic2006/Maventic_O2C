import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_industry_type } from 'o2c_v2/entity/d_o2c_industry_type';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_industry_type")
export default class p_o2c_industry_type extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	/*public async onAfterAllRendered(){

	 this.tm.getTN("/o2c_indust_list").applysortP("industry_id","ASC")
	}*/
		
	public onEdit() {
		this.setMode("EDIT");

	}
	public onCreate() {


		this.tm.getTN("o2c_indust_list").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true);

	} 
	
	//duplicate industry name

	public async onSave() {
        //let flag=true;
		let indNameList = this.tm.getTN('o2c_indust_list').getData().filter(record => record.isDirty)
		
		let Array = [];
		let idarray= [];
		for(let i=0;i<indNameList.length;i++){
			Array[i] = indNameList[i].industry_name;
			idarray[i]=indNameList[i].industry_id;
		}
		
		
			let q = await this.transaction.getExecutedQuery('d_o2c_industry_type', {loadAll: true,'industry_name':  Array})
			
			if (q.length) {
				for(let j=0;j<q.length;j++){
			    for(let k=0;k<Array.length;k++){
					if(q[j].industry_name ==Array[k]){
				sap.m.MessageToast.show("Already exist");
				indNameList[k].industry_name=null;
				//flag=false;
					}
				}
				}
			}
		
		//if(flag==true)
		await this.tm.commitP("Successfully Saved", "Save failed", true, true);

	}
	public async onDelete() {

		const selected =await this.getActiveControlById(null,"s_o2c_indust_list").getSelectedIndices();
		for (let inital = 0; inital < selected.length; inital++)
		await this.tm.getTN("o2c_indust_list").getData()[selected[0]].deleteP();
		await this.tm.commitP("Deleted","Delete failed",false,true);

	}

}
//loadAll true