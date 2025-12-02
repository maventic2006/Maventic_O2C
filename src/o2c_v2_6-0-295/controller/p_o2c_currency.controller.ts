import { KloController } from 'kloTouch/jspublic/KloController';
import s_o2c_currency from 'o2c_common/metadata/m_entities/s_o2c_currency_metadata';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_currency")
export default class p_o2c_currency extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public onEdit() {
		this.setMode("EDIT");
		//let index=this.tm.getTN("/o2c_curren_list").getActiveIndex();
		//let a=this.tm.getTN("/o2c_curren_list")[0].isNew;
		//console.log(a);

	}
	public onCreate() {
		this.tm.getTN("o2c_curren_list").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true);
		/*  let i=this.tm.getTN("/o2c_curren_list").getActiveIndex();
		  this.tm.getTN("/o2c_curren_list")[i].setMode("EDIT");*/

	}

	public async onSave() {
		let flag = true;
		let currNameList = this.tm.getTN('o2c_curren_list').getData().filter(record => record.isDirty)
		let Array = [];
		let idarray = [];
		for (let i = 0; i < currNameList.length; i++) {
			Array[i] = currNameList[i].currency_name;
			idarray[i] = currNameList[i].currency_code;
		}



		let q = await this.transaction.getExecutedQuery('d_o2c_currency', {loadAll:true,'currency_name': Array })
		if (q.length) {
			for (let j = 0; j < q.length; j++) {
				for (let k = 0; k < Array.length; k++) {
					if (q[j].currency_name == Array[k]) {
						sap.m.MessageToast.show("Already exist");
						currNameList[k].currency_name = null;
						//flag=false;
					}
				}
			}
		}
		this.tm.commitP("Successfully Saved", "Save failed",true, true);
	}
	public async onDelete() {
		const i = await this.getActiveControlById(null, "s_o2c_curren_list").getSelectedIndices();

		for (let j = 0; j < i.length; j++)
			await this.tm.getTN("o2c_curren_list").getData()[i[0]].deleteP();
		await this.tm.commitP("Deleted", "Delete failed", false, true);
	}

//loadAll true
}