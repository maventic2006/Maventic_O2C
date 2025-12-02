import { KloEntitySet } from 'kloBo/KloEntitySet';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { AdmServer } from 'kloBolServer/Adm/AdmUser2';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_employee_salary_hdr } from 'o2c_v2/entity_gen/d_o2c_employee_salary_hdr';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_upload_excel")
export default class p_upload_excel extends KloController {
	public jsonData;
	public jsonDataDoc;
	public jsonDataDesig;
	public jsonDataOrg;
	public jsonDataDesigMastr;
	public jsonDataSales;
	public jsonDataCustomer;
	public jsonDataCustomerDoc;
	public jsonDataCustomerOrg;
	public jsonDataCustomerMap;
	public jsonDataAddress;
	public jsonDataCustomerContact;
	public entity_name;
	public entity_name_customer;
	public entity_name_customer_doc;
	public entity_name_customer_org;
	public entity_name_customer_map;
	public entity_name_address
	public entity_name_customer_contact;
	public jsonDataLeaveHistory;
	public entity_name_leave_history
	public jsonDataLeaveQuota;
	public entity_name_leave_quota;
	public task_assignment;
	public entity_task_assign;
	public mail_json;

	public jsonTag;
	public entity_jsonTag;

	public jsonSalaryData;
	public salarySheetData;


	public jsonScrapping;
	public entity_jsonScrapping;

	public jsonAllocation;
	public entity_jsonAllocation;

	public jsonCreation;
	public entity_jsonCreation;


	public jsonAmc;
	public entity_jsonAmc;

	public loginID;
	public code;
	public _resolveLoginPromise;

	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		if (!window['XLSX']) {
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}
	}
	public async getWBFromExcelBinary(blobFile: Blob) {
		return new Promise((resolve, reject) => {
			let fileReader = new FileReader();
			fileReader.onload = async (data) => {
				let result = data.target.result;
				let workbook = XLSX.read(result, {
					type: "binary",
					cellText: false,
					cellDates: true
				});
				resolve(workbook);
			}
			fileReader.readAsBinaryString(blobFile);
		})
	}
	//EMPLOYEE//
	public async docUpload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonData = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
		// console.log(this.jsonData)
		// console.log(this.entity_name)
	}
	public async insert_emp() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		let Array = [];
		for (let i = 0; i < this.jsonData.length; i++) {
			Array[i] = this.jsonData[i].employee_id;
		}
		let q = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_filter_empl', { loadAll: true, 'employee_id': Array })
		if (this.entity_name === "d_o2c_employee") {
			if (q.length == 0) {
				// let entitys = await this.transaction.createEntityP("d_o2c_employee")
				// let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
				for (let i = 0; i < this.jsonData.length; i++) {
					let value = this.jsonData[i];
					if (value.confirmation_date instanceof Date)
						value.confirmation_date = new Date(value.confirmation_date.getFullYear(), value.confirmation_date.getMonth(), value.confirmation_date.getDate() + 1);
					if (value.date_of_birth instanceof Date)
						value.date_of_birth = new Date(value.date_of_birth.getFullYear(), value.date_of_birth.getMonth(), value.date_of_birth.getDate() + 1);
					if (value.joining_date instanceof Date)
						value.joining_date = new Date(value.joining_date.getFullYear(), value.joining_date.getMonth(), value.joining_date.getDate() + 1);
					await this.transaction.createEntityP("d_o2c_employee", this.jsonData[i])
					// await entity.newEntityP(0,  this.jsonData[i], true);
				}
				try {
					//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
					await this.retrySave("Inserted Successfully", "Insertion Failed");
				} catch (e) {
					await this.transaction.rollback();
				}
				this.jsonData = [];
				this.entity_name = "";
			} else {
				let duplicateid = [];
				for (let i = 0; i < q.length; i++) {
					duplicateid[i] = q[i].employee_id;
				}
				sap.m.MessageToast.show("Employee Id already exist. Please check console!", { duration: 1000 });
				console.log(duplicateid);
			}
		} else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
		oBusyDailog.close();
	}
	public async emp_doc_upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataDoc = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async insert_emp_doc() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		if (this.entity_name === "d_o2c_employee_doc") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
			for (let i = 0; i < this.jsonDataDoc.length; i++) {
				await entity.newEntityP(0, this.jsonDataDoc[i], true)
			}
			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataDoc = [];
			this.entity_name = "";
		} else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
		oBusyDailog.close();
	}
	public async emp_desig_upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataDesig = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async insert_emp_desig() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		if (this.entity_name === "d_o2c_employee_designation") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
			for (let i = 0; i < this.jsonDataDesig.length; i++) {
				let value = this.jsonDataDesig[i];
				if (value.from_date instanceof Date)
					value.from_date = new Date(value.from_date.getFullYear(), value.from_date.getMonth(), value.from_date.getDate() + 1);
				if (value.to_date instanceof Date)
					value.to_date = new Date(value.to_date.getFullYear(), value.to_date.getMonth(), value.to_date.getDate() + 1);
				await entity.newEntityP(0, this.jsonDataDesig[i], true)
			}
			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataDesig = [];
			this.entity_name = "";
		} else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
		oBusyDailog.close();
	}
	public async emp_org_upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataOrg = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async insert_emp_org() {
		let oBusyDailog = new sap.m.BusyDialog().open();
		if (this.entity_name === "d_o2c_employee_org") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
			for (let i = 0; i < this.jsonDataOrg.length; i++) {
				let value = this.jsonDataOrg[i];
				if (value.active_from instanceof Date)
					value.active_from = new Date(value.active_from.getFullYear(), value.active_from.getMonth(), value.active_from.getDate() + 1);
				if (value.active_till instanceof Date)
					value.active_till = new Date(value.active_till.getFullYear(), value.active_till.getMonth(), value.active_till.getDate() + 1);
				await entity.newEntityP(0, this.jsonDataOrg[i], true)
			}
			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataOrg = [];
			this.entity_name = "";
		} else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
		oBusyDailog.close();
	}
	public async desig_master(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataDesigMastr = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async insert_desig_master() {
		if (this.entity_name === "d_o2c_designation_master") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
			for (let i = 0; i < this.jsonDataDesigMastr.length; i++) {
				await entity.newEntityP(0, this.jsonDataDesigMastr[i], true)
			}
			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataDesigMastr = [];
			this.entity_name = "";
		} else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}



	//INSERT LEAVE //
	public async uploadData_leave_history(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataLeaveHistory = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_leave_history = oWorkBook.SheetNames[0];
		console.log(this.jsonDataLeaveHistory)
		console.log(this.entity_name_leave_history)
	}

	public async insert_leave_history() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open()
		if (this.entity_name_leave_history === "d_o2c_leave_management") {


			let entity = await this.transaction.getExecutedQuery(this.entity_name_leave_history, {})
			let approval_entity = await this.transaction.getExecutedQuery('d_o2c_leave_approval', {})

			for (let key = 0; key < this.jsonDataLeaveHistory.length; key++) {
				let value = this.jsonDataLeaveHistory[key];
				value.start_date = new Date(value.start_date.getFullYear(), value.start_date.getMonth(), value.start_date.getDate() + 1);
				value.end_date = new Date(value.end_date.getFullYear(), value.end_date.getMonth(), value.end_date.getDate() + 1);
				value.request_date = new Date(value.request_date.getFullYear(), value.request_date.getMonth(), value.request_date.getDate() + 1);
			}

			for (let i = 0; i < this.jsonDataLeaveHistory.length; i++) {

				let leave_history = await entity.newEntityP(0, this.jsonDataLeaveHistory[i], true)
				if (this.jsonDataLeaveHistory[i].leave_status == "Approved" || this.jsonDataLeaveHistory[i].leave_status == "Rejected" || this.jsonDataLeaveHistory[i].leave_status == "Cancelled") {
					await approval_entity.newEntityP(0, { leave_id: leave_history.leave_id, approval_status: leave_history.leave_status, approver_remark: leave_history.approver_remark, approved_on: this.jsonDataLeaveHistory[i].approved_date, approval_sequence: "1", approver: leave_history.lmi }, true);

					//await approval_entity.newEntityP(0, true, this.jsonDataLeaveHistory[i])
				}
			}
			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				oBusyDailog.close()
				await this.transaction.rollback();
			}
			oBusyDailog.close()
			this.jsonDataLeaveHistory = [];
			this.entity_name_leave_history = "";
		} else {
			oBusyDailog.close()
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	public async uploadData_leave_quota(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataLeaveQuota = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_leave_quota = oWorkBook.SheetNames[0];
		console.log(this.jsonDataLeaveQuota)
		console.log(this.entity_name_leave_quota)
	}
	public async insert_leave_quota() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open()
		if (this.entity_name_leave_quota === "d_o2c_emp_leave_quota") {


			let entity = await this.transaction.getExecutedQuery(this.entity_name_leave_quota, {})
			for (let key = 0; key < this.jsonDataLeaveQuota.length; key++) {
				let value = this.jsonDataLeaveQuota[key];
				value.valid_to = new Date(value.valid_to.getFullYear(), value.valid_to.getMonth(), value.valid_to.getDate() + 1);
				value.valid_from = new Date(value.valid_from.getFullYear(), value.valid_from.getMonth(), value.valid_from.getDate() + 1);
			}
			for (let i = 0; i < this.jsonDataLeaveQuota.length; i++) {


				await entity.newEntityP(0, { s_object_type: -1, valid_to: this.jsonDataLeaveQuota[i].valid_to, valid_from: this.jsonDataLeaveQuota[i].valid_from, used_leave: this.jsonDataLeaveQuota[i].used_leave, unused_leave: this.jsonDataLeaveQuota[i].unused_leave, seq_id: this.jsonDataLeaveQuota[i].employee_id, no_of_days: this.jsonDataLeaveQuota[i].no_of_days, lmi: this.jsonDataLeaveQuota[i].lmi, employee_id: this.jsonDataLeaveQuota[i].employee_id, company_code: this.jsonDataLeaveQuota[i].company_code, category_id: this.jsonDataLeaveQuota[i].category_id, business_area: this.jsonDataLeaveQuota[i].business_area, category_description: this.jsonDataLeaveQuota[i].category_description, leave_types: this.jsonDataLeaveQuota[i].leave_types, extended: this.jsonDataLeaveQuota[i].extended, requested_leave: this.jsonDataLeaveQuota[i].requested_leave, allegiant_leave: this.jsonDataLeaveQuota[i].allegiant_leave, earned_leave: this.jsonDataLeaveQuota[i].earned_leave, carry_forward: this.jsonDataLeaveQuota[i].carry_forward, rem_carry_forward: this.jsonDataLeaveQuota[i].rem_carry_forward, used_carry_forward: this.jsonDataLeaveQuota[i].used_carry_forward, assign_quota: this.jsonDataLeaveQuota[i].assign_quota, carry_forward_till: this.jsonDataLeaveQuota[i].carry_forward_till }, true);
				//await entity.newEntityP(0, this.jsonDataLeaveQuota[i], true)
			}

			try {
				//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				oBusyDailog.close()
				await this.transaction.rollback();
			}
			oBusyDailog.close()
			this.jsonDataLeaveQuota = [];
			this.entity_name_leave_quota = "";
		} else {
			oBusyDailog.close()
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}

	}



	// SALES ORDER //
	public async salesUpload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async sales_order() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			let value = this.jsonDataSales[i];
			value.project_start_date = new Date(value.project_start_date.getFullYear(), value.project_start_date.getMonth(), value.project_start_date.getDate() + 1);
			value.project_end_date = new Date(value.project_end_date.getFullYear(), value.project_end_date.getMonth(), value.project_end_date.getDate() + 1);
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// CONTACT //
	public async contactUpload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async so_contact() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// ITEM //
	public async uploadItem(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async item() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			let value = this.jsonDataSales[i];
			value.start_date = new Date(value.start_date.getFullYear(), value.start_date.getMonth(), value.start_date.getDate() + 1);
			value.end_date = new Date(value.end_date.getFullYear(), value.end_date.getMonth(), value.end_date.getDate() + 1);
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// FUNC AREA //
	public async func_upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async func_area() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// PROFIT CENTER //
	public async upload_profit(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async profit_center() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			//this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// CONDITION //
	public async upload_condition(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataSales = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name = oWorkBook.SheetNames[0];
	}
	public async condition() {
		let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		for (let i = 0; i < this.jsonDataSales.length; i++) {
			await entity.newEntityP(0, this.jsonDataSales[i], true)
		}
		try {
			// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}
		this.jsonDataSales = [];
		this.entity_name = "";
	}
	// CUSTOMER/VENDOR//
	public async Customers_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataCustomer = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_customer = oWorkBook.SheetNames[0];
		console.log(this.jsonDataCustomer)
		console.log(this.entity_name)
	}
	public async insert_customer() {

		if (this.entity_name_customer === "d_o2c_customers") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_customer, {})
			for (let i = 0; i < this.jsonDataCustomer.length; i++) {
				let value = this.jsonDataCustomer[i];
				if (value.MSA_expiry_date instanceof Date)
					value.MSA_expiry_date = new Date(value.MSA_expiry_date.getFullYear(), value.MSA_expiry_date.getMonth(), value.MSA_expiry_date.getDate() + 1);
				if (value.NDA_expiry_date instanceof Date)
					value.NDA_expiry_date = new Date(value.NDA_expiry_date.getFullYear(), value.NDA_expiry_date.getMonth(), value.NDA_expiry_date.getDate() + 1);
				if (value.approved_date instanceof Date)
					value.approved_date = new Date(value.approved_date.getFullYear(), value.approved_date.getMonth(), value.approved_date.getDate() + 1);

				await entity.newEntityP(0, this.jsonDataCustomer[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataCustomer = [];
			this.entity_name_customer = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//CUSTOMER/VENDOR DOC//
	public async Customers_Doc_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataCustomerDoc = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_customer_doc = oWorkBook.SheetNames[0];
	}
	public async insert_customer_doc() {
		if (this.entity_name_customer_doc === "d_o2c_customers_doc") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_customer_doc, {})
			for (let i = 0; i < this.jsonDataCustomerDoc.length; i++) {
				await entity.newEntityP(0, this.jsonDataCustomerDoc[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataCustomerDoc = [];
			this.entity_name_customer_doc = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//CUSTOMER/VENDOR ORG//
	public async Customers_Org_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataCustomerOrg = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_customer_org = oWorkBook.SheetNames[0];
	}
	public async insert_customer_org() {
		if (this.entity_name_customer_org === "d_o2c_customer_org") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_customer_org, {})
			for (let i = 0; i < this.jsonDataCustomerOrg.length; i++) {
				await entity.newEntityP(0, this.jsonDataCustomerOrg[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataCustomerOrg = [];
			this.entity_name_customer_org = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//CUSTOMER/VENDOR MAP//
	public async Customers_Map_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataCustomerMap = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_customer_map = oWorkBook.SheetNames[0];
		console.log(this.jsonDataCustomerMap);
	}
	public async insert_customer_map() {
		if (this.entity_name_customer_map === "d_o2c_customers_map") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_customer_map, {})
			for (let i = 0; i < this.jsonDataCustomerMap.length; i++) {
				await entity.newEntityP(0, this.jsonDataCustomerMap[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataCustomerMap = [];
			this.entity_name_customer_map = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}
	//CUSTOMER/VENDOR ADDRESS//
	public async Customers_Address_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataAddress = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_address = oWorkBook.SheetNames[0];
	}
	public async insert_customer_address() {
		if (this.entity_name_address === "d_o2c_address") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_address, {})
			for (let i = 0; i < this.jsonDataAddress.length; i++) {

				let value = this.jsonDataAddress[i];
				if (value.valid_from instanceof Date)
					value.valid_from = new Date(value.valid_from.getFullYear(), value.valid_from.getMonth(), value.valid_from.getDate() + 1);
				if (value.valid_to instanceof Date)
					value.valid_to = new Date(value.valid_to.getFullYear(), value.valid_to.getMonth(), value.valid_to.getDate() + 1);
				await entity.newEntityP(0, this.jsonDataAddress[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataAddress = [];
			this.entity_name_address = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//CUSTOMER/VENDOR CONTACT//
	public async Customers_Contact_Upload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonDataCustomerContact = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_name_customer_contact = oWorkBook.SheetNames[0];
	}
	public async insert_customer_contact() {
		if (this.entity_name_customer_contact === "d_o2c_customers_contact") {
			let entity = await this.transaction.getExecutedQuery(this.entity_name_customer_contact, {})
			for (let i = 0; i < this.jsonDataCustomerContact.length; i++) {
				await entity.newEntityP(0, this.jsonDataCustomerContact[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonDataCustomerContact = [];
			this.entity_name_customer_contact = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}
	// Timesheet
	public async taskAssignamentUpload(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.task_assignment = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_task_assign = oWorkBook.SheetNames[0];
	}
	public async taskAssignmentCreate() {
		if (this.entity_task_assign === "d_o2c_task_assignment") {
			let entity = await this.transaction.getExecutedQuery(this.entity_task_assign, {})
			for (let i = 0; i < this.task_assignment.length; i++) {
				let value = this.task_assignment[i];
				if (value.assigned_on instanceof Date)
					value.assigned_on = new Date(value.assigned_on.getFullYear(), value.assigned_on.getMonth(), value.assigned_on.getDate() + 1);
				if (value.task_end_date instanceof Date)
					value.task_end_date = new Date(value.task_end_date.getFullYear(), value.task_end_date.getMonth(), value.task_end_date.getDate() + 1);
				if (value.task_start_date instanceof Date)
					value.task_start_date = new Date(value.task_start_date.getFullYear(), value.task_start_date.getMonth(), value.task_start_date.getDate() + 1);
				await entity.newEntityP(0, this.task_assignment[i], true);
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.task_assignment = [];
			this.entity_task_assign = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//For Updating the Official Mail
	public async onOfficialMail(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.mail_json = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
	}

	public async updateMail(oEvent, property) {
		let oBusyDailog = new sap.m.BusyDialog().open();
		let Array = [];
		for (let i = 0; i < this.mail_json.length; i++) {
			Array[i] = this.mail_json[i].employee_id;
		}
		let entitySet = [];
		if (property.prop_update == "mail" || property.prop_update == "work_mode") {
			entitySet = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': Array, loadAll: true })
		} else if (property.prop_update == "designation") {
			entitySet = await this.transaction.getExecutedQuery('d_o2c_employee_designation', { 'employee_id': Array, loadAll: true })
		}
		if (property.prop_update == "mail") {
			for (let i = 0; i < entitySet.length; i++) {
				for (let j = 0; j < this.mail_json.length; j++) {
					if (this.mail_json[j].employee_id.toLowerCase() == entitySet[i].employee_id.toLowerCase()) {
						entitySet[i].official_mail = this.mail_json[j].official_mail;
					}
				}
			}
		} else if (property.prop_update == "work_mode") {
			for (let i = 0; i < entitySet.length; i++) {
				for (let j = 0; j < this.mail_json.length; j++) {
					if (this.mail_json[j].employee_id.toLowerCase() == entitySet[i].employee_id.toLowerCase()) {
						entitySet[i].work_mode = this.mail_json[j].work_mode;
					}
				}
			}
		} else if (property.prop_update == "designation") {
			for (let i = 0; i < entitySet.length; i++) {
				for (let j = 0; j < this.mail_json.length; j++) {
					if (this.mail_json[j].employee_id.toLowerCase() == entitySet[i].employee_id.toLowerCase()) {
						entitySet[i].actual_designation = this.mail_json[j].designation;
					}
				}
			}
		}
		try {
			// this.tm.commitP("Updated Successfully", "Updation Failed", true, true);
			await this.retrySave("Updated Successfully", "Updation Failed");
		} catch (e) {
			console.log(e)
		}
		oBusyDailog.close();
	}

	// Customer Sales Responsible Data Correcting One Time Process
	public async sales_respomsible() {
		let Entity = await this.transaction.getExecutedQuery('d_o2c_customers', { s_status: "Approved", loadAll: true });
		for (let i = 0; i < Entity.length; i++) {
			let pre_sales = Entity[i].sales_responsible;
			let sales = pre_sales.split(" / ");
			if (sales.length == 2) {
				Entity[i].sales_responsible = sales[0];
				Entity[i].sales_responsible_name = sales[1];
			}
		}
		// this.tm.commitP("Updated Successfully", "Updation Failed", true, true);
		await this.retrySave("Updated Successfully", "Updation Failed");
	}


	// mAsset SCRAPPING 

	public async uploadData_scraping(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonScrapping = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonScrapping = oWorkBook.SheetNames[0];
		console.log(this.jsonScrapping)
		console.log(this.entity_jsonScrapping)
	}

	public async insertData_scraping() {
		if (this.entity_jsonScrapping === "d_asset_scrapping") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonScrapping, {})
			for (let i = 0; i < this.jsonScrapping.length; i++) {

				await entity.newEntityP(0, this.jsonScrapping[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonScrapping = [];
			this.entity_jsonScrapping = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	// allocation



	public async uploadData_allocation(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonAllocation = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonAllocation = oWorkBook.SheetNames[0];
		console.log(this.jsonAllocation)
		console.log(this.entity_jsonAllocation)
	}

	public async insertData_allocation() {
		if (this.entity_jsonAllocation === "d_asset_allocation_request") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonAllocation, {})
			for (let i = 0; i < this.jsonAllocation.length; i++) {

				await entity.newEntityP(0, this.jsonAllocation[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonAllocation = [];
			this.entity_jsonAllocation = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	// creation



	public async uploadData_creation(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonCreation = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonCreation = oWorkBook.SheetNames[0];
		console.log(this.jsonCreation)
		console.log(this.entity_jsonCreation)

	}

	public async insertData_creation() {
		if (this.entity_jsonCreation === "d_asset_creation") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonCreation, {})
			for (let i = 0; i < this.jsonCreation.length; i++) {

				await entity.newEntityP(0, this.jsonCreation[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonCreation = [];
			this.entity_jsonCreation = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}


	// amc details



	public async uploadData_amc(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonAmc = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonAmc = oWorkBook.SheetNames[0];
		console.log(this.jsonAmc)
		console.log(this.entity_jsonAmc)
	}

	public async insertData_amc() {
		if (this.entity_jsonAmc === "d_amc_table") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonAmc, {})
			for (let i = 0; i < this.jsonAmc.length; i++) {

				await entity.newEntityP(0, this.jsonAmc[i], true)
			}
			try {
				// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonAmc = [];
			this.entity_jsonAmc = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	//mAsset tag upload

	public async upload_tag(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonTag = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonTag = oWorkBook.SheetNames[0];
		console.log(this.jsonTag)
		console.log(this.entity_jsonTag)

		let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { partialSelect: ['asset_number'], loadAll: true })

		let matchingEntities = [];
		let nonMatchingEntities = [];
		const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_number, tag]));
		for (let i = 0; i < entity.length; i++) {
			const tag = tagMap.get(entity[i].asset_number);
			if (tag) {
				matchingEntities.push(entity[i]);
			} else {
				nonMatchingEntities.push(entity[i]);
			}
		}

		console.log("✅ Matching:", matchingEntities);
		console.log("❌ Not Matching:", nonMatchingEntities);

	}
	public async insert_Tag() {
		if (this.entity_jsonTag === "d_asset_creation") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { partialSelect: ['asset_number'], loadAll: true })
			// Create a Set for fast lookup

			let matchingEntities = [];
			let nonMatchingEntities = [];
			const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_number, tag]));
			for (let i = 0; i < entity.length; i++) {
				const tag = tagMap.get(entity[i].asset_number);
				if (tag) {
					entity[i].tag_number = tag.tag_number;
					entity[i].serial_number = tag.serial_number;
					matchingEntities.push(entity[i]);
				} else {
					nonMatchingEntities.push(entity[i]);
				}
			}

			console.log("✅ Matching:", matchingEntities);
			console.log("❌ Not Matching:", nonMatchingEntities);

			try {
				// await this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonTag = [];
			this.entity_jsonTag = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}
	public async download_tag_excel() {

		const data = [
			["asset_number", "tag_number", "serial_number"],
			["", "", ""]
		];

		const worksheet = XLSX.utils.aoa_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "d_asset_creation");
		XLSX.writeFile(workbook, "asset_upload_template.xlsx");

	}
	// tag over

	//mAsset department upload
	public async upload_dep(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonTag = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonTag = oWorkBook.SheetNames[0];
		console.log(this.jsonTag)
		console.log(this.entity_jsonTag)

		let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { partialSelect: ['asset_number'], loadAll: true })

		let matchingEntities = [];
		let nonMatchingEntities = [];
		const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_number, tag]));
		for (let i = 0; i < entity.length; i++) {
			const tag = tagMap.get(entity[i].asset_number);
			if (tag) {
				matchingEntities.push(entity[i]);
			} else {
				nonMatchingEntities.push(entity[i]);
			}
		}

		console.log("✅ Matching:", matchingEntities);
		console.log("❌ Not Matching:", nonMatchingEntities);

	}



	public async insert_dep() {
		if (this.entity_jsonTag === "d_asset_creation") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { loadAll: true })
			// Create a Set for fast lookup

			let matchingEntities = [];
			let nonMatchingEntities = [];
			const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_number, tag]));
			for (let i = 0; i < entity.length; i++) {
				const tag = tagMap.get(entity[i].asset_number);
				if (tag) {
					entity[i].department = tag.department;

					matchingEntities.push(entity[i]);
				} else {
					nonMatchingEntities.push(entity[i]);
				}
			}

			console.log("✅ Matching:", matchingEntities);
			console.log("❌ Not Matching:", nonMatchingEntities);

			try {
				// await this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonTag = [];
			this.entity_jsonTag = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}


	public async download_dep_excel() {

		const data = [
			["asset_number", "department"],
			["", "", ""]
		];

		const worksheet = XLSX.utils.aoa_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "d_asset_creation");
		XLSX.writeFile(workbook, "asset_upload_template.xlsx");

	}

	// Allocation Tag //tag_no//asset_no

	public async download_allocation_excel() {
		const data = [
			["asset_no", "tag_no"],
			["", ""]
		];
		const worksheet = XLSX.utils.aoa_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "d_asset_allocation_request");
		XLSX.writeFile(workbook, "asset_allocation_upload_template.xlsx");

	}

	public async upload_allocation(oEvent) {
		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		this.jsonTag = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		this.entity_jsonTag = oWorkBook.SheetNames[0];
		console.log(this.jsonTag)
		console.log(this.entity_jsonTag)

		let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { loadAll: true })

		let matchingEntities = [];
		let nonMatchingEntities = [];
		const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_no, tag]));
		for (let i = 0; i < entity.length; i++) {
			const tag = tagMap.get(entity[i].asset_no);
			if (tag) {
				matchingEntities.push(entity[i]);
			} else {
				nonMatchingEntities.push(entity[i]);
			}
		}

		console.log("✅ Matching:", matchingEntities);
		console.log("❌ Not Matching:", nonMatchingEntities);

	}


	public async insert_allocation() {
		if (this.entity_jsonTag === "d_asset_allocation_request") {
			let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, { loadAll: true })
			// Create a Set for fast lookup

			let matchingEntities = [];
			let nonMatchingEntities = [];
			const tagMap = new Map(this.jsonTag.map(tag => [tag.asset_no, tag]));
			for (let i = 0; i < entity.length; i++) {
				const tag = tagMap.get(entity[i].asset_no);
				if (tag) {
					entity[i].tag_no = tag.tag_no;

					matchingEntities.push(entity[i]);
				} else {
					nonMatchingEntities.push(entity[i]);
				}
			}

			console.log("✅ Matching:", matchingEntities);
			console.log("❌ Not Matching:", nonMatchingEntities);

			try {
				// await this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
				await this.retrySave("Inserted Successfully", "Insertion Failed");
			} catch (e) {
				await this.transaction.rollback();
			}
			this.jsonTag = [];
			this.entity_jsonTag = "";
		}
		else {
			sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
		}
	}

	// Allocation Tag Complete


	//Salary upload
	public async salaryDocUpload(oEvent) {

		let oFile = oEvent.mParameters.files[0];
		let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
		// Initialize an array to store sheet data by sheet name
		let sheetData: { [key: string]: any } = {};
		// Iterate over each sheet name in the workbook
		oWorkBook.SheetNames.forEach(sheetName => {
			// Get the data for the current sheet
			sheetData[sheetName] = XLSX.utils.sheet_to_json(oWorkBook.Sheets[sheetName]);
		});
		// Now assign each sheet data to an array of known properties (e.g., 'sheetDataArray')
		this.jsonSalaryData = []; // Array to hold the data of all sheets
		// Map each sheet data to the array with the sheet name as the index or key
		oWorkBook.SheetNames.forEach(sheetName => {
			this.jsonSalaryData.push({
				sheetName: sheetName,
				data: sheetData[sheetName]
			});
		});
		// If you need to access specific sheet data, you can reference the array using sheet name
		this.salarySheetData = sheetData; // Optional, to keep all sheets accessible in a single object
		// Now `this.sheetDataArray` contains each sheet's data

	}
	//old code
	// public async insertSalary() {
	// 	let oBusyDailog = new sap.m.BusyDialog().open();

	// 	// Get the current date
	// 	let currentDate = new Date();

	// 	// Find the relevant sheets from the jsonSalaryData
	// 	let sheet1Data = this.jsonSalaryData.find(sheet => sheet.sheetName === "d_o2c_employee_salary_hdr");
	// 	let sheet2Data = this.jsonSalaryData.find(sheet => sheet.sheetName === "d_o2c_emp_salary_item");

	// 	if (!sheet1Data || !sheet2Data) {
	// 		sap.m.MessageToast.show("Required sheets not found", { duration: 400 });
	// 		oBusyDailog.close();
	// 		return;
	// 	}

	// 	let sheet1Rows = sheet1Data.data; // Employee Salary data from Sheet 1
	// 	let sheet2Rows = sheet2Data.data; // Salary item data from Sheet 2

	// 	// Object to hold data grouped by employee_id
	// 	let groupedSalaryData: { [key: string]: any[] } = {};
	// 	let groupedSalaryItemData: { [key: string]: any[] } = {};

	// 	// Group all records by employee_id
	// 	sheet1Rows.forEach(row => {
	// 		if (!groupedSalaryData[row.employee_id]) {
	// 			groupedSalaryData[row.employee_id] = [];
	// 		}
	// 		groupedSalaryData[row.employee_id].push(row);
	// 	});

	// 	// Group all records by employee_id
	// 	sheet2Rows.forEach(row => {
	// 		if (!groupedSalaryItemData[row.employee_id]) {
	// 			groupedSalaryItemData[row.employee_id] = [];
	// 		}
	// 		groupedSalaryItemData[row.employee_id].push(row);
	// 	});

	// 	let insertArrayHdr = []; // For closest date insertion
	// 	let insertArrayHdrLog = []; // For log entries

	// 	let employeeIds = Object.keys(groupedSalaryData);
	// 	// // Iterate over each employee_id group
	// 	// for (let employee_id in groupedSalaryData) {
	// 	// 	let employeeRecords = groupedSalaryData[employee_id];

	// 	// 	// Find the record with the closest from_date to the current date
	// 	// 	let closestRecord = null;
	// 	// 	let closestDiff = Infinity;

	// 	// 	employeeRecords.forEach(record => {
	// 	// 		let from_date = new Date(record.from_date);
	// 	// 		let diff = Math.abs(currentDate.getTime() - from_date.getTime());

	// 	// 		// Check if this record is closer to the current date
	// 	// 		if (diff < closestDiff) {
	// 	// 			closestDiff = diff;
	// 	// 			closestRecord = record;
	// 	// 		}
	// 	// 	});

	// 	// 	// Now, insert the closest record into d_o2c_salary_hdr
	// 	// 	insertArrayHdr.push(closestRecord);

	// 	// 	// Add the other records to the log
	// 	// 	employeeRecords.forEach(record => {
	// 	// 		if (record !== closestRecord) {
	// 	// 			insertArrayHdrLog.push(record);
	// 	// 		}
	// 	// 	});
	// 	// }
	// 	let allExistingRecords = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery(
	// 		'd_o2c_employee_salary_hdr',
	// 		{
	// 			loadAll: true,
	// 			'employee_id': employeeIds,
	// 			'totp': this.code
	// 		}
	// 	);

	// 	// 3. Group existing records by employee_id
	// 	let existingSalaryHdrMap: { [key: string]: any[] } = {};

	// 	for (let record of allExistingRecords) {
	// 		const empId = record.employee_id;
	// 		if (!existingSalaryHdrMap[empId]) {
	// 			existingSalaryHdrMap[empId] = [];
	// 		}
	// 		existingSalaryHdrMap[empId].push(record);
	// 	}

	// 	// 4. Process each employee group
	// 	for (let employee_id in groupedSalaryData) {
	// 		let employeeRecords = groupedSalaryData[employee_id];

	// 		// Find the record with the closest from_date to currentDate
	// 		let closestRecord = null;
	// 		let closestDiff = Infinity;

	// 		employeeRecords.forEach(record => {
	// 			let from_date = new Date(record.from_date);
	// 			let diff = Math.abs(currentDate.getTime() - from_date.getTime());

	// 			if (diff < closestDiff) {
	// 				closestDiff = diff;
	// 				closestRecord = record;
	// 			}
	// 		});

	// 		let existingRecords = existingSalaryHdrMap[employee_id] || [];

	// 		if (existingRecords.length === 0) {
	// 			// No existing record — insert closest
	// 			insertArrayHdr.push(closestRecord);
	// 		} else {
	// 			// Compare closestRecord's date range with existing record(s)
	// 			let shouldInsertClosest = false;

	// 			existingRecords.forEach(existing => {
	// 				let existingFrom = new Date(existing.from_date);
	// 				let existingTo = new Date(existing.to_date);
	// 				let closestFrom = new Date(closestRecord.from_date);
	// 				let closestTo = new Date(closestRecord.to_date);

	// 				if (closestFrom > existingFrom && closestTo > existingTo) {
	// 					// Closest is more recent → insert it, move existing to log
	// 					shouldInsertClosest = true;
	// 					insertArrayHdrLog.push(existing);
	// 				} else {
	// 					// Closest is older → log closest, keep existing
	// 					shouldInsertClosest = false;
	// 				}
	// 			});

	// 			if (shouldInsertClosest) {
	// 				insertArrayHdr.push(closestRecord);
	// 			} else {
	// 				insertArrayHdrLog.push(closestRecord);
	// 			}
	// 		}

	// 		// Move all other records (not closestRecord) to log
	// 		employeeRecords.forEach(record => {
	// 			if (record !== closestRecord) {
	// 				insertArrayHdrLog.push(record);
	// 			}
	// 		});
	// 	}
	// 	// Insert closest records into d_o2c_salary_hdr
	// 	for (let i = 0; i < insertArrayHdr.length; i++) {
	// 		let insertItem = insertArrayHdr[i];

	// 		let q = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery('d_o2c_employee_salary_hdr', { loadAll: true, 'employee_id': insertItem.employee_id, 'totp': this.code })
	// 		if (q.length == 0) {
	// 			insertItem.from_date = new Date(insertItem.from_date.getFullYear(), insertItem.from_date.getMonth(), insertItem.from_date.getDate()); // set 00:00:00 local time
	// 			insertItem.to_date = new Date(insertItem.to_date.getFullYear(), insertItem.to_date.getMonth(), insertItem.to_date.getDate()); // set 00:00:00 local time
	// 			let salaryhdrdata = await this.transaction.createEntityP("d_o2c_employee_salary_hdr", insertItem);
	// 			// Find matching data from Sheet 2 based on employee_id and date range
	// 			// let matchingData = sheet2Rows.filter(row =>
	// 			// 	row.employee_id === insertItem.employee_id &&
	// 			// 	new Date(row.from_date).getTime() === new Date(insertItem.from_date).getTime() &&
	// 			// 	new Date(row.to_date).getTime() === new Date(insertItem.to_date).getTime()
	// 			// );

	// 			let matchingData = sheet2Rows.filter(row =>
	// 				row.employee_id === insertItem.employee_id &&
	// 				new Date(row.from_date).getFullYear() === new Date(insertItem.from_date).getFullYear() &&
	// 				new Date(row.from_date).getMonth() === new Date(insertItem.from_date).getMonth() &&
	// 				new Date(row.from_date).getDate() === new Date(insertItem.from_date).getDate() &&
	// 				new Date(row.to_date).getFullYear() === new Date(insertItem.to_date).getFullYear() &&
	// 				new Date(row.to_date).getMonth() === new Date(insertItem.to_date).getMonth() &&
	// 				new Date(row.to_date).getDate() === new Date(insertItem.to_date).getDate()
	// 			);

	// 			// If matching records exist in Sheet 2, process the insert
	// 			if (matchingData.length > 0) {
	// 				for (let match = 0; match < matchingData.length; match++) {
	// 					let insertBenefit = matchingData[match];
	// 					await salaryhdrdata.r_salary_hdr_items.newEntityP(0, insertBenefit);

	// 				}
	// 			}
	// 			else {
	// 				sap.m.MessageToast.show("Salary item data is not present", { duration: 400 });
	// 				return;  // Exit the loop and the function if no matching data is found
	// 			}
	// 		}
	// 		else {
	// 			let duplicateid = [];
	// 			for (let i = 0; i < q.length; i++) {
	// 				duplicateid[i] = q[i].employee_id;
	// 			}
	// 			sap.m.MessageToast.show("Employee salary is already present. Please check console!", { duration: 1000 });
	// 			console.log(duplicateid);
	// 			oBusyDailog.close();
	// 			return;
	// 		}

	// 	}

	// 	// Insert other records into d_o2c_salary_hdr_log
	// 	for (let i = 0; i < insertArrayHdrLog.length; i++) {
	// 		let insertItem = insertArrayHdrLog[i];
	// 		insertItem.from_date = new Date(insertItem.from_date.getFullYear(), insertItem.from_date.getMonth(), insertItem.from_date.getDate()); // set 00:00:00 local time
	// 		insertItem.to_date = new Date(insertItem.to_date.getFullYear(), insertItem.to_date.getMonth(), insertItem.to_date.getDate()); // set 00:00:00 local time
	// 		let salaryhdrlogdata = await this.transaction.createEntityP("d_o2c_emp_salary_hdr_log", insertItem);
	// 		// Find matching data from Sheet 2 based on employee_id and date range
	// 		// let matchingData = sheet2Rows.filter(row =>
	// 		// 	row.employee_id === insertItem.employee_id &&
	// 		// 	new Date(row.from_date).getTime() === new Date(insertItem.from_date).getTime() &&
	// 		// 	new Date(row.to_date).getTime() === new Date(insertItem.to_date).getTime()
	// 		// );
	// 		let matchingData = sheet2Rows.filter(row =>
	// 			row.employee_id === insertItem.employee_id &&
	// 			new Date(row.from_date).getFullYear() === new Date(insertItem.from_date).getFullYear() &&
	// 			new Date(row.from_date).getMonth() === new Date(insertItem.from_date).getMonth() &&
	// 			new Date(row.from_date).getDate() === new Date(insertItem.from_date).getDate() &&
	// 			new Date(row.to_date).getFullYear() === new Date(insertItem.to_date).getFullYear() &&
	// 			new Date(row.to_date).getMonth() === new Date(insertItem.to_date).getMonth() &&
	// 			new Date(row.to_date).getDate() === new Date(insertItem.to_date).getDate()
	// 		);

	// 		// If matching records exist in Sheet 2, process the insert
	// 		if (matchingData.length > 0) {
	// 			for (let match = 0; match < matchingData.length; match++) {
	// 				let insertBenefit = matchingData[match];
	// 				await salaryhdrlogdata.r_salary_hdr_item_log.newEntityP(0, insertBenefit);
	// 			}
	// 		}
	// 		else {
	// 			sap.m.MessageToast.show("Salary item data is not present", { duration: 1000 });
	// 			return;  // Exit the loop and the function if no matching data is found
	// 		}
	// 	}



	// 	try {
	// 		// Commit the transaction
	// 		this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
	// 	} catch (e) {
	// 		await this.transaction.rollback();
	// 	}



	// 	// Close the busy dialog
	// 	oBusyDailog.close();
	// }


	public async downloadExcelFormat() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is fetching..."
		});
		busyDialog.open();

		// Check if XLSX is loaded, if not, dynamically import it
		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		// Sample data that needs to be added to the first sheet (d_o2c_employee_salary_hdr)
		let jsonDataHdr = [];
		jsonDataHdr.push({
			'hdr_id': '',
			'company_code': '',
			'business_area': '',
			'profit_center': '',
			'employee_id': '',
			'from_date': '',
			'to_date': '',
			'currency': '',
			'total_cost': '',
			'fixed': '',
			'ctc': '',
			'gross_pay': '',
			'basic': '',
			'remark': '',
			'total_cost_perc': '',
			'total_cost_hike_perc': '',
			'basic_perc': '',
			'fixed_hike_perc': '',
			'net_take_home_annually': ''
		});

		// Create the first sheet (d_o2c_employee_salary_hdr)
		const worksheetHdr = XLSX.utils.json_to_sheet(jsonDataHdr);
		const workbook = XLSX.utils.book_new();

		// Set column widths for the first sheet
		worksheetHdr['!cols'] = [
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 }
		];

		// Set header styles for the first sheet
		const headerCellsHdr = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1", "M1", "N1", "O1", "P1", "Q1", "R1"];
		headerCellsHdr.forEach(cell => {
			worksheetHdr[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow background for header
		});

		// Append the first sheet to the workbook
		XLSX.utils.book_append_sheet(workbook, worksheetHdr, "d_o2c_employee_salary_hdr");

		// Sample data for the second sheet (d_o2c_emp_salary_item)
		let jsonDataItem = [];
		jsonDataItem.push({
			'itm_id': '',
			'hdr_id': '',
			'benefit_id': '',
			'planned_amount': '',
			'currency': '',
			'benefit_name': '',
			'actual_amount': '',
			'employee_id': '',
			'from_date': '',
			'to_date': '',
			'start_date': '',
			'end_date': ''
		});

		// Create the second sheet (d_o2c_emp_salary_item)
		const worksheetItem = XLSX.utils.json_to_sheet(jsonDataItem);

		// Set column widths for the second sheet
		worksheetItem['!cols'] = [
			{ width: 20 },
			{ width: 20 },
			{ width: 30 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 }
		];

		// Set header styles for the second sheet
		const headerCellsItem = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1"];
		headerCellsItem.forEach(cell => {
			worksheetItem[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow background for header
		});

		// Append the second sheet to the workbook
		XLSX.utils.book_append_sheet(workbook, worksheetItem, "d_o2c_emp_salary_item");

		// Write the workbook to a file
		const filePath = 'salary_format.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });

		// Close the busy dialog after download completes
		busyDialog.close();
	}
	public async onSalaryTabEnter() {
		const waitForLogin = new Promise<void>((resolve) => {
			this._resolveLoginPromise = resolve;
		});
		await this.openDialog("p_pa_dialog_box");
		// Wait here until login completes and dialog is closed
		await waitForLogin;
	}
	public async onEscapeEvent() {
		//Avoid escape button click
	}
	public async onLoginSubmit() {
		this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "");
		this.code = this.tm.getTNFromEmbedded("totp_code", "s_pa_login").getData().code;
		// let loginID = (await this.transaction.get$User()).login_id;	
		this.loginID = (await this.transaction.get$User()).login_id;
		if (this.code) {
			const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
				url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
				data: {
					loginID: this.loginID,
					totpCode: this.code
				},
				method: "POST"
			});
			if (!response) {
				this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
				// this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('code',"");
			}
			else {
				this.transaction.$SYSTEM.appVars.totp = this.code;
				await this.closeDialog("p_pa_dialog_box");
				// ✅ Resolve the promise to resume `abc()`
				if (this._resolveLoginPromise) {
					this._resolveLoginPromise();
					this._resolveLoginPromise = null;
				}
			}
		}
		else {
			this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Please enter TOTP Code");

		}
	}
	public async onCancel() {
		// Resolve the promise to unblock `onPageEnter`, if it exists
		if (this._resolveLoginPromise) {
			this._resolveLoginPromise();
			this._resolveLoginPromise = null;
		}
		await this.navTo({ F: "kloTouch", S: "p_homePage" })
	}

	public async insertSalary() {
		let oBusyDailog = new sap.m.BusyDialog().open();

		// Get current date
		let currentDate = new Date();

		// Helper function to parse "DD Month YYYY" dates safely
		function parseFullMonthDate(value: string): Date | null {
			if (!value) return null;
			const parts = value.trim().split(" ");
			if (parts.length !== 3) return null;
			const day = parseInt(parts[0], 10);
			const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			const month = monthNames.indexOf(parts[1]);
			const year = parseInt(parts[2], 10);
			if (isNaN(day) || month === -1 || isNaN(year)) return null;
			// Normalize to local midnight
			return new Date(year, month, day);
		}

		// Find the relevant sheets
		let sheet1Data = this.jsonSalaryData.find(sheet => sheet.sheetName === "d_o2c_employee_salary_hdr");
		let sheet2Data = this.jsonSalaryData.find(sheet => sheet.sheetName === "d_o2c_emp_salary_item");

		if (!sheet1Data || !sheet2Data) {
			sap.m.MessageToast.show("Required sheets not found", { duration: 400 });
			oBusyDailog.close();
			return;
		}

		let sheet1Rows = sheet1Data.data; // Employee Salary header
		let sheet2Rows = sheet2Data.data; // Salary item data

		// Group by employee_id
		let groupedSalaryData: { [key: string]: any[] } = {};
		let groupedSalaryItemData: { [key: string]: any[] } = {};

		sheet1Rows.forEach(row => {
			if (!groupedSalaryData[row.employee_id]) groupedSalaryData[row.employee_id] = [];
			// Normalize date
			row.from_date = parseFullMonthDate(row.from_date);
			row.to_date = parseFullMonthDate(row.to_date);
			groupedSalaryData[row.employee_id].push(row);
		});

		sheet2Rows.forEach(row => {
			if (!groupedSalaryItemData[row.employee_id]) groupedSalaryItemData[row.employee_id] = [];
			row.from_date = parseFullMonthDate(row.from_date);
			row.to_date = parseFullMonthDate(row.to_date);
			groupedSalaryItemData[row.employee_id].push(row);
		});

		let insertArrayHdr: any[] = [];
		let insertArrayHdrLog: any[] = [];

		let employeeIds = Object.keys(groupedSalaryData);

		// Fetch existing records
		let allExistingRecords = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery(
			'd_o2c_employee_salary_hdr',
			{ loadAll: true, 'employee_id': employeeIds, 'totp': this.code }
		);

		// Group existing records
		let existingSalaryHdrMap: { [key: string]: any[] } = {};
		for (let record of allExistingRecords) {
			const empId = record.employee_id;
			if (!existingSalaryHdrMap[empId]) existingSalaryHdrMap[empId] = [];
			existingSalaryHdrMap[empId].push(record);
		}

		// Process each employee
		for (let employee_id in groupedSalaryData) {
			let employeeRecords = groupedSalaryData[employee_id].filter(r => r.from_date && r.to_date);

			if (employeeRecords.length === 0) continue;

			// Find closest record to current date
			let closestRecord = employeeRecords.reduce((prev, curr) => {
				let prevDiff = Math.abs(currentDate.getTime() - prev.from_date.getTime());
				let currDiff = Math.abs(currentDate.getTime() - curr.from_date.getTime());
				return currDiff < prevDiff ? curr : prev;
			});

			let existingRecords = existingSalaryHdrMap[employee_id] || [];

			if (existingRecords.length === 0) {
				insertArrayHdr.push(closestRecord);
			} else {
				let shouldInsertClosest = false;
				existingRecords.forEach(existing => {
					let existingFrom = new Date(existing.from_date);
					let existingTo = new Date(existing.to_date);
					if (closestRecord.from_date > existingFrom && closestRecord.to_date > existingTo) {
						shouldInsertClosest = true;
						insertArrayHdrLog.push(existing);
					}
				});
				if (shouldInsertClosest) insertArrayHdr.push(closestRecord);
				else insertArrayHdrLog.push(closestRecord);
			}

			// Move all other records to log
			employeeRecords.forEach(record => {
				if (record !== closestRecord) insertArrayHdrLog.push(record);
			});
		}

		// Insert main salary records
		for (let insertItem of insertArrayHdr) {
			let q = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery(
				'd_o2c_employee_salary_hdr',
				{ loadAll: true, 'employee_id': insertItem.employee_id, 'totp': this.code }
			);

			if (q.length === 0) {
				// Ensure local midnight
				insertItem.from_date = new Date(insertItem.from_date.getFullYear(), insertItem.from_date.getMonth(), insertItem.from_date.getDate());
				insertItem.to_date = new Date(insertItem.to_date.getFullYear(), insertItem.to_date.getMonth(), insertItem.to_date.getDate());

				let salaryhdrdata = await this.transaction.createEntityP("d_o2c_employee_salary_hdr", insertItem);

				let matchingData = sheet2Rows.filter(row =>
					row.employee_id === insertItem.employee_id &&
					row.from_date.getTime() === insertItem.from_date.getTime() &&
					row.to_date.getTime() === insertItem.to_date.getTime()
				);

				if (matchingData.length > 0) {
					for (let insertBenefit of matchingData) {
						await salaryhdrdata.r_salary_hdr_items.newEntityP(0, insertBenefit);
					}
				} else {
					sap.m.MessageToast.show("Salary item data is not present", { duration: 400 });
				}
				//auto calculate data
				await this.calculateSalaryData(salaryhdrdata);
			} else {
				console.warn(`Employee salary already exists for ${insertItem.employee_id}`);
			}
		}

		// Insert log salary records
		for (let insertItem of insertArrayHdrLog) {
			insertItem.from_date = new Date(insertItem.from_date.getFullYear(), insertItem.from_date.getMonth(), insertItem.from_date.getDate());
			insertItem.to_date = new Date(insertItem.to_date.getFullYear(), insertItem.to_date.getMonth(), insertItem.to_date.getDate());

			let salaryhdrlogdata = await this.transaction.createEntityP("d_o2c_emp_salary_hdr_log", insertItem);

			let matchingData = sheet2Rows.filter(row =>
				row.employee_id === insertItem.employee_id &&
				row.from_date.getTime() === insertItem.from_date.getTime() &&
				row.to_date.getTime() === insertItem.to_date.getTime()
			);

			if (matchingData.length > 0) {
				for (let insertBenefit of matchingData) {
					await salaryhdrlogdata.r_salary_hdr_item_log.newEntityP(0, insertBenefit);
				}
			} else {
				sap.m.MessageToast.show("Salary item data is not present", { duration: 1000 });
			}
			//auto calculate data
			await this.calculateSalaryData(salaryhdrlogdata);
		}

		try {
			// this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
			await this.retrySave("Inserted Successfully", "Insertion Failed");
		} catch (e) {
			await this.transaction.rollback();
		}

		oBusyDailog.close();
	}

	public async calculateSalaryData(salaryhdrdata) {
		const computeFromList = (items) => {
			return (!items?.length)
				? null
				: (() => {
					const get = (id) => items.find(item => item.benefit_id === id);
					const performanceBonus = get("B11");
					const retentionBonus = get("B12");
					const companyBonus = get("B13");

					// total_cost
					salaryhdrdata.total_cost = salaryhdrdata.total_cost
						? salaryhdrdata.total_cost
						: parseFloat(Number(salaryhdrdata.ctc) + Number(retentionBonus?.actual_amount || 0) + Number(companyBonus?.actual_amount || 0)).toFixed(2);

					// fixed
					salaryhdrdata.fixed = salaryhdrdata.fixed
						? salaryhdrdata.fixed
						: parseFloat(Number(salaryhdrdata.ctc) - Number(performanceBonus?.actual_amount || 0)).toFixed(2);

				    //total_cost_hike_perc
					salaryhdrdata.total_cost_hike_perc

					//fixed_hike_perc
					salaryhdrdata.fixed_hike_perc

					//basic_perc
					salaryhdrdata.basic_perc

					//net_take_home_annually
					salaryhdrdata.net_take_home_annually

					// HRA
					const hra = get("B1")?.actual_amount
						? get("B1").actual_amount
						: (40 * Number(salaryhdrdata.basic)) / 100;

					// gratuity
					const gratuity = get("B10")?.actual_amount
						? get("B10").actual_amount
						: Math.round(((salaryhdrdata.basic / 12) / 26) * 15);

					// provisional tax
					const provisionalTax = get("B16")?.actual_amount
						? get("B16").actual_amount
						: (salaryhdrdata.gross_pay > 300001 ? 2400 : 0);

					return { hra, gratuity, provisionalTax };
				})();
		};

		// Try items, fallback to log, using ternary
		return computeFromList(salaryhdrdata.r_salary_hdr_items)
			? computeFromList(salaryhdrdata.r_salary_hdr_items)
			: computeFromList(salaryhdrdata.r_salary_hdr_item_log);
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
//26 Nov 10:41AM