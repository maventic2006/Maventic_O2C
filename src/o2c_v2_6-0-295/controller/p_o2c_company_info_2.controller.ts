import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { KloController } from 'kloTouch/jspublic/KloController';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_company_info_2")
export default class p_o2c_company_info_2 extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	// public async onAfterSubScreenRender(){
	// 	await this.tm.getTN("o2c_compan_detail").setActive();
	// }
	public onEdit() {
		this.setMode("EDIT");
	}
	public async onSave() {
		await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
	}
	//Navigation code
	public async click(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		//Profit Center navigation
		if (path.includes('r_profit_center')) {
			let index = parseInt(path.replace("/o2c_compan_list/", " "));
			let x = parseInt(path.replace(`/o2c_compan_list/${index}/r_profit_center/`, ''))
			await this.tm.getTN('o2c_compan_list').setActive(index);
			await this.tm.getTN('profit_centre_list').setActive(x);
			await this.navTo(({ S: "p_o2c_company_info_2", SS: "s_o2c_profit_centre" }))
			// this.tm.getTN("profit_centre_details").setData(this.tm.getTN("o2c_compan_list").getProperty(path.split("o2c_compan_list/")[1]));

		}
		//Functional Area Navigation
		else if (path.includes('r_functional_info')) {
			let index = parseInt(path.replace("/o2c_compan_list/", ''));
			await this.tm.getTN('o2c_compan_list').setActive(index);
			let index_2 = parseInt(path.replace(`/o2c_compan_list/${index}/r_company_info/`, ''));
			await this.tm.getTN('r_business_area_list').setActive(index_2);
			let x = parseInt(path.replace(`/o2c_compan_list/${index}/r_company_info/${index_2}/r_functional_info/`, ''))
			await this.tm.getTN('functional_area_new_list').setActive(x)
			await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_functional_ar" }))
			// this.tm.getTN("functional_area_new_detail").setData(this.tm.getTN(path).getData());
			// await this.tm.getTN('functional_area_new_detail').setActive(0);
		}
		//Business Area Navigation
		else if (path.includes('r_company_info')) {
			let index = parseInt(path.replace("/o2c_compan_list/", ''));
			let x = parseInt(path.replace(`/o2c_compan_list/${index}/r_company_info/`, ''))
			await this.tm.getTN('o2c_compan_list').setActive(index);
			await this.tm.getTN('r_business_area_list').setActive(x);
			await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_business_dt" }))
			// this.tm.getTN('r_business_area_details').setData(this.tm.getTN(path).getData());
			// await this.tm.getTN('r_business_area_details').setActive(0);
		}
		// CompanyInfo Navigation
		else {
			let index = parseInt(path.replace("/o2c_compan_list/", ''));
			this.tm.getTN('o2c_compan_list').setActive(index);
			await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_detail" }))
			this.tm.getTN('o2c_compan_detail').setData(this.tm.getTN(path).getData());
			await this.tm.getTN('o2c_compan_detail').setActive(0);
		}

	}
	//Creating Company
	public async onAddingCO(oEvent: sap.ui.base.Event) {
		await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_detail" }))
		this.tm.getTN("o2c_compan_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
	}
	// Cancelling 
	public async cancelling() {
		await this.transaction.rollback();
		await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_search" }))
		this.setMode("Display");
		// comment
	}
	//Creating Functional Area
	public async onAddingFA(oEvent: sap.ui.base.Event) {
		let way = this.getPathFromEvent(oEvent);
		let index = parseInt(way.replace("/o2c_compan_list/", " "));
		await this.tm.getTN('o2c_compan_list').setActive(index);
		if (way.includes('r_company_info')) {
			let index = parseInt(way.replace("/o2c_compan_list/", ''));
			let y = parseInt(way.replace(`/o2c_compan_list/${index}/r_company_info/`, ''))
			await this.tm.getTN("functional_area_new_list").setData(this.tm.getTN("o2c_compan_list").getProperty(index).r_company_info[y].r_functional_info);
			await this.navTo(({ S: "p_o2c_company_info_2", SS: "s_o2c_functional_ar" }))
			let x = await this.tm.getTN("functional_area_new_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
			await this.tm.getTN("functional_area_new_detail").setData(x);
			this.onFuncArea();
		}
		//Setting data in Business Area and Profit Center
		else {
			let j = parseInt(way.replace("/o2c_compan_list/", ''))
			await this.tm.getTN("r_business_area_list").setData(this.tm.getTN("o2c_compan_list").getProperty(j).r_company_info);
			await this.tm.getTN("profit_centre_list").setData(this.tm.getTN("o2c_compan_list").getProperty(j).r_profit_center);
			await this.openDialog('pa_dialog_log');
		}
	}
	//Creating Profit Center
	public async onAddingPC(oEvent: sap.ui.base.Event) {
		this.closeDialog('pa_dialog_log');
		await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_profit_center" }))
		let x = await this.tm.getTN("profit_centre_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("profit_centre_details").setData(x);
	}
	//Creating Business Area
	public async onAddingBA(oEvent: sap.ui.base.Event) {
		this.closeDialog('pa_dialog_log');
		await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_business_dt" }))
		let x = await this.tm.getTN("r_business_area_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("r_business_area_details").setData(x);
	}
	// Setting company_code into functional area table 
	public async onFuncArea() {
		let entity = await this.tm.getTN('o2c_compan_list').getActiveData();
		let x = entity.company_code;
		let entity_2 = this.tm.getTN('functional_area_new_detail').getData();
		entity_2.company_code = x;
	}
	//Going to home pag
	public async home() {
		await this.navTo(({ S: 'p_o2c_company_info_2', SS: 'pa_o2c_compan_search' }));
		this.setMode("REVIEW");
	}
	//Delete Company code 
	public async delete() {
		sap.m.MessageBox.confirm("Are you sure you want to delete this Company", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.YES,
			sap.m.MessageBox.Action.NO],
			onClose: async (oAction) => {
				if (oAction == "YES") {
					await this.tm.getTN("o2c_compan_detail").deleteP();
					await this.tm.commitP("Deleted Successfully", "Unable to delete", true, true);
					await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_search" }))
				}
				if (oAction == "NO") {

				}

			}
		})
	}
	//Delete Profit Center
	public async profit_delete(oEvent: sap.ui.base.Event) {
		sap.m.MessageBox.confirm("Are you sure you want to delete this profit center", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.YES,
			sap.m.MessageBox.Action.NO],
			onClose: async (oAction) => {
				if (oAction == "YES") {
					await this.tm.getTN("profit_centre_details").deleteP();
					await this.tm.commitP("Deleted Successfully", "Unable to delete", true, true);
					await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_search" }))
				}
				if (oAction == "NO") {

				}

			}
		})

	}
	//Delete Business Area
	public async business_area_delete() {
		sap.m.MessageBox.confirm("Are you sure you want to delete this business area", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.YES,
			sap.m.MessageBox.Action.NO],
			onClose: async (oAction) => {
				if (oAction == "YES") {
					await this.tm.getTN("r_business_area_details").deleteP();
					await this.tm.commitP("Deleted Successfully", "Unable to delete", true, true);
					await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_search" }))
				}
				if (oAction == "NO") {

				}

			}
		})
	}
	//Delete Functional Area
	public async function_area_delete() {
		sap.m.MessageBox.confirm("Are you sure you want to delete this functional area", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.YES,
			sap.m.MessageBox.Action.NO],
			onClose: async (oAction) => {
				if (oAction == "YES") {
					await this.tm.getTN("functional_area_new_detail").deleteP();
					await this.tm.commitP("Deleted Successfully", "Unable to delete", true, true);
					await this.navTo(({ S: "p_o2c_company_info_2", SS: "pa_o2c_compan_search" }))
				}
				if (oAction == "NO") {
					// commt
				}

			}
		})
	}
	//Checking duplicate company code 
	public async company_duplicate_id() {
		let entity = this.tm.getTN('o2c_compan_detail').getData();
		let q = await this.transaction.getExecutedQuery('d_o2c_company_info', { loadAll: true, 'company_code': entity.company_code })
		if (q.length) {
			sap.m.MessageBox.error("This Company Code is already exist", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "CANCEL") {
						entity.company_code = null
						this.tm.getTN("o2c_compan_detail").refresh()
					}
				}
			})
		}
	}
	//Checking duplicate Business Area code
	public async business_area_duplicate_id() {
		let entity = this.tm.getTN('r_business_area_details').getData();
		let q = await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': entity.business_area })
		if (q.length) {
			sap.m.MessageBox.error("This Business Area Code is already exist", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "CANCEL") {
						entity.business_area = null
						this.tm.getTN("r_business_area_details").refresh()
					}
				}
			})
		}
	}
	//Checking duplicate Functional Area Code
	public async functional_area_duplicate_id() {
		let entity = this.tm.getTN('functional_area_new_detail').getData();
		let q = await this.transaction.getExecutedQuery('d_o2c_functional_area', { loadAll: true, 'functional_area': entity.functional_area })
		if (q.length) {
			sap.m.MessageBox.error("This Functional Area Code is already exist", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "CANCEL") {
						entity.functional_area = null
						this.tm.getTN("functional_area_new_detail").refresh()
					}
				}
			})
		}
	}
	//Checking duplicate Profit Center Code
	public async profit_center_duplicate_id() {
		let entity = this.tm.getTN('profit_centre_details').getData();
		let q = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { loadAll: true, 'profit_center': entity.profit_center })
		if (q.length) {
			sap.m.MessageBox.error("This Profit Center Code is already exist", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "CANCEL") {
						entity.profit_center = null
						this.tm.getTN("profit_centre_details").refreshP()
					}
				}
			})
		}
	}
}