import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_company_info } from 'o2c_v2/entity/d_o2c_company_info';
import { d_o2c_emp_family_info } from 'o2c_v2/entity/d_o2c_emp_family_info';
import { d_o2c_employee_doc } from 'o2c_v2/entity/d_o2c_employee_doc';
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_employee_approval_flow } from 'o2c_v2/entity_gen/d_o2c_employee_approval_flow';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_self_service")
export default class p_emp_self_service extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}

	/*After loading the page for the first time giving the edit access as per status.*/
	public async onPageEnter() {
		let entity = await this.tm.getTN("detail").getData();
		if (entity) {
			let stat = entity.s_status;
			if (stat == "New" || stat == "Draft") {
				this.setMode('EDIT');
			}
		}
		let loginID = (await this.transaction.get$User()).login_id;
		let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: loginID, loadAll: true });
		let comanyName = <KloEntitySet<d_o2c_company_info>>await this.transaction.getExecutedQuery("d_o2c_company_info", { company_code: emp_org[0].company_code, loadAll: true });
		await this.tm.getTN("emp_self_service").setData({ company: comanyName[0].name })
	}



	/*Creating Entities for Family, Past Experience and Visa..*/
	public async onFamilyCreate() {
		await this.tm.getTN("detail/r_o2c_emp_family_info").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onExperienceCreate() {
		await this.tm.getTN("detail/r_emp_history").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onVisaCreate() {
		await this.tm.getTN("detail/r_o2c_emp_visa").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}


	/*Navigating the screens on click of Next and Previous button.*/
	public async navToPastExperience(oEvent: sap.ui.base.Event) {
		await this.navTo(({ S: "p_emp_self_service", SS: "pa_past_experience" }))

	}
	public async navToEmpDetail(oEvent: sap.ui.base.Event) {
		await this.navTo(({ S: "p_emp_self_service", SS: "pa_o2c_emp_detail" }))

	}
	public async navToLegalDoc(oEvent: sap.ui.base.Event) {
		await this.navTo(({ S: "p_emp_self_service", SS: "pa_legal_doc" }))
	}


	/*Creating the document Pan and Addhar when navigating for the first time to Legal Doc screen.*/
	public async createDoc() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		await this.navTo(({ S: "p_emp_self_service", SS: "pa_legal_doc" }))
		let docData = await this.tm.getTN("detail").getData().r_o2c_employee_doc.fetch();
		let flag = 0;
		if (docData.length) {
			flag = 1;
		}
		if (flag === 0) {
			await this.tm.getTN("detail/r_o2c_employee_doc").createEntityP({ doc_type: "DC02" }, null, null, null, "First", true, false, false);
			await this.tm.getTN("detail/r_o2c_employee_doc").createEntityP({ doc_type: "DC01" }, null, null, null, "First", true, false, false);
			this.transaction.commitP();
		}
		oBusyDailog.close()
	}


	/*Doc Type duplicate validation*/
	public async docTypeDuplicate(oEvent) {
		let entity = this.tm.getTN("emp_doc_list").getData();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/emp_doc_list/", ''));
		let document: d_o2c_employee_doc = this.tm.getTN("emp_doc_list").getData()[index];
		let docType = document.doc_type;
		for (let doc = 0; doc < entity.length; doc++) {
			if (entity[doc].doc_type === docType && index != doc) {
				sap.m.MessageBox.error("Duplicate Document Type exist. Please select other document type.", {
					title: "Error",                                      // default
					onClose: null,                                       // default
					styleClass: "",                                      // default
					actions: sap.m.MessageBox.Action.CLOSE,              // default
					emphasizedAction: null,                              // default
					initialFocus: null,                                  // default
					textDirection: sap.ui.core.TextDirection.Inherit     // default
				});
				document.doc_type = null;
			}
		}
	}



	/*Uploading Documents....*/
	public async onUploadDoc(oEvent, param) {
		let index = this.tm.getTN('emp_history_list').getActiveIndex();
		let data = this.tm.getTN('emp_history_list').getData()[index];
		await data[param.type].setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
	}
	public async onLegalDocUpload(oEvent) {

		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/emp_doc_list/", ''));
		let data = this.tm.getTN('emp_doc_list').getData()[index];
		await data.file_location.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
	}


	/*calculation of Past Experience......*/
	public calculateEXperience() {
		let index = this.tm.getTN("emp_history_list").getActiveIndex();
		let entity = this.tm.getTN('emp_history_list').getData();
		let date1 = entity[index].from_date;
		let date2 = entity[index].to_date;
		let diffTime = Math.abs(date2 - date1);
		let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const years = Math.floor(days / 365);
		const months = Math.floor((days % 365) / 30);
		this.tm.getTN("emp_history_detail").getData().years = years;
		this.tm.getTN("emp_history_detail").getData().months = months;
	}


	/*Saving Functions.....*/
	public onSaveasDraft() {
		let detail = this.tm.getTN("detail").getData();
		if (detail.s_status != "Approved") {
			detail.s_status = "Draft";
		}
		detail.status = "Draft";
		//this.tm.commitP("Saved as Draft", "Save Failed", false, false);
		this.retrySave("Saved as Draft", "Save Failed");
	}
	public async onSave() {
		let data = await this.tm.getTN("detail").getData();
		data.status = null;
		data.s_status = "New";
		let doc_list = await this.tm.getTN("emp_doc_list").getData();
		let flag = false;
		for (let i = 0; i < doc_list.length; i++) {
			/*Manually triggering the validation for employee document.*/
			let temp: ValidationError[] = await doc_list[i].validateP();
			if (temp.length > 0) {
				sap.m.MessageBox.error(temp[0].message, {
					title: "Error",                                      // default
					onClose: null,                                       // default
					styleClass: "",                                      // default
					actions: sap.m.MessageBox.Action.CLOSE,              // default
					emphasizedAction: null,                              // default
					initialFocus: null,                                  /// default
					textDirection: sap.ui.core.TextDirection.Inherit
				});
				flag = true;
			}
		}
		let hist_list = await this.tm.getTN("emp_history_list").getData();
		for (let hist = 0; hist < hist_list.length; hist++) {
			let temp: ValidationError[] = await hist_list[hist].validateP();
			if (temp.length > 0) {
				sap.m.MessageBox.error(temp[0].message, {
					title: "Error",                                      // default
					onClose: null,                                       // default
					styleClass: "",                                      // default
					actions: sap.m.MessageBox.Action.CLOSE,              // default
					emphasizedAction: null,                              // default
					initialFocus: null,                                  // default
					textDirection: sap.ui.core.TextDirection.Inherit
				});
				flag = true;
			}
		}
		if (flag == false) {
			let data = await this.tm.getTN("detail").getData();
			if (data.s_status != "Approved") {
				data.s_status = "Pending";
				data.is_active = true;
			}
			let approval_flow = <KloEntitySet<d_o2c_employee_approval_flow>>await this.transaction.getExecutedQuery('d_o2c_employee_approval_flow', { "employee_id": data.employee_id, 'approval_status': "Pending", loadAll: true })
			if (!approval_flow.length) {
				let enitity_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': data.employee_id, 'is_primary': true, loadAll: true });
				let rejection_flow = <KloEntitySet<d_o2c_employee_approval_flow>>await this.transaction.getExecutedQuery('d_o2c_employee_approval_flow', { "employee_id": data.employee_id, 'approval_status': "Rejected", loadAll: true })
				// await this.tm.getTN("detail").fetch();
				if(rejection_flow.length){
					await this.tm.getTN("emp_appr_flow").createEntityP({ approval_cycle: rejection_flow[0].approval_cycle + 1, pending_with_role: "HR", employee_id: data.employee_id, pending_with_level: 0, insert_datetime: data.s_modified_on, approval_status: "Pending", business_area: enitity_org[0].business_area, company_code: enitity_org[0].company_code, profit_center: enitity_org[0].profit_center }, null, null, null, "First", false, false, false)
				}

			}
			//await this.tm.commitP("Your data is submitted. HR will contact you with further instructions.", "Some of the mandatory field is missing!", true, true);
			await this.retrySave("Your data is submitted. HR will contact you with further instructions.", "Some of the mandatory field is missing!");
			let email_data = await this.tm.getTN('detail').getData()
			await this.tm.getTN("submit_search").setProperty('emp', email_data.full_name);
			await this.tm.getTN('submit_search').setProperty('hr', email_data.s_created_by);
			await this.tm.getTN('submit_search').executeP();

		}

	}


	/*cancel action*/
	public async cancelling() {
		await this.transaction.rollback();
		await this.tm.getTN("emp_history_list").refresh();
	}

	/*Validation for multiple family entries*/
	public async onRelationChange(oEvent) {
		let entity = this.tm.getTN("emp_family_list").getData();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/emp_family_list/", ''));
		let family: d_o2c_emp_family_info = this.tm.getTN("emp_family_list").getData()[index];
		let relation = family.relation;
		for (let rel = 0; rel < entity.length; rel++) {
			if (entity[rel].relation != "R004" && entity[rel].relation != "R005") {
				if (entity[rel].relation === relation && index != rel) {
					sap.m.MessageBox.error("Duplicate Family Relation exist. Please select other relation type.", {
						title: "Error",                                      // default
						onClose: null,                                       // default
						styleClass: "",                                      // default
						actions: sap.m.MessageBox.Action.CLOSE,              // default
						emphasizedAction: null,                              // default
						initialFocus: null,                                  // default
						textDirection: sap.ui.core.TextDirection.Inherit     // default
					});
					family.relation = null;
				}
			}
		}
	}
	public async retrySave(sSuccessMessage: string, sErrMessage: string) {
		// Retry logic for commit operation
		let retryCount = 0;
		const maxRetries = 5;
		let commitSuccess = false;
	
		while (retryCount < maxRetries && !commitSuccess) {
		  try {
			await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
			commitSuccess = true;
		  } catch (error) {
			retryCount++;
			console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);
	
			if (retryCount >= maxRetries) {
			  sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
			  throw error;
			}
			// Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
			await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
		  }
		}
	  }
}
//25 Nov 4:45PM