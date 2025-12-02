import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_mr_emp_header")
export default class p_pms_mr_emp_header extends KloController {
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/

	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public async onAddReviewer() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			let emp_header_detail = this.tm.getTN("pms_mr_emp_header_detail").getData();
			let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: emp_header_detail.appraisal_year, loadAll: true });
			let qInstance = this.tm.getTN("pms_per_empsearch").getData();
			qInstance.appraisal_id = currentAnnualPerformance[0]?.ap_id;
			qInstance.included_NE = "false";
			qInstance.loadAll = true;
			let allEmployeeData = await qInstance.executeP();
			// await this.tm.getTN("employee_list").setData(allEmployeeData);
			this.openDialog("pa_emp_list");
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmit() {
		let oData = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (oData.length <= 0) return sap.m["MessageToast"].show("No Items Selected");
		let busyDialog = new sap.m.BusyDialog({ text: "Creating..." });
		let annualPerformanceEmployee = this.tm.getTN("pms_per_emp_list").getData();
		this.setMode("Create");
		busyDialog.open();
		try {
			for (let i = 0; i < oData.length; i++) {
				let emp_data = this.tm.getTN("pms_per_emp_list").getData()[oData[i]];
				// Validating if the employee is already added or not.
				// let isEmpAddedToAppraisal = await this.transaction.getExecutedQuery("d_pms_annual_per_employees", { loadAll: true, employee_id: emp_data.employee_id, included: "true" });
				// if (isEmpAddedToAppraisal.length > 0) {
				// 	sap.m["MessageToast"].show(`Can not add employee ${emp_data.full_name} as he is added to another appraisal cycle`);
				// 	continue;
				// }
				await this.tm
					.getTN("pms_mr_emp_header_detail")
					.getData()
					.r_mr_emp_header_item.newEntityP(0, { employee_name: emp_data.first_name + " " + emp_data.last_name, employee_id: emp_data.employee_id });
			}
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_emp_list");
			busyDialog.close();
		}
	}
}
