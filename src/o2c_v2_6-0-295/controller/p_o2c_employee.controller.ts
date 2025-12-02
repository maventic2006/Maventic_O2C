import { KloController } from 'kloTouch/jspublic/KloController';
import { System } from 'kloBo/kloCommon/System/System'
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { d_o2c_employee_approval_flow } from "o2c_v2/entity_gen/d_o2c_employee_approval_flow";
import { d_o2c_emp_apprvl_mstr } from "o2c_v2/entity_gen/d_o2c_emp_apprvl_mstr";
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_employee_designation } from 'o2c_v2/entity/d_o2c_employee_designation';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_emp_family_info } from 'o2c_v2/entity/d_o2c_emp_family_info';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5: any;
let activeFlag = false;
let confirmFlag;

@KloUI5("o2c_v2.controller.p_o2c_employee")
export default class p_o2c_employee extends KloController {
	public role;
	public comp;
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		this.tm.getTN("line_mngr_dropdown").setData({})

		/*<Storing the user login id in loginid.>*/

		let loginid = (await this.transaction.get$User()).login_id;

		/*Fetching the org detail based upon login id*/

		let emporglist = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': loginid });

		/*Creating the array for company code and business area to filter for the logged in user*/

		// let companyArray = [];
		// let businessArray = [];
		this.comp = emporglist[0].company_code;
		confirmFlag = true;
		// for(let i=0;i<emporglist.length;i++){
		// 	companyArray[i] = emporglist[i].company_code;
		// 	businessArray[i] = emporglist[i].business_area;
		// }

		/*Setting the search transnode so that the data is filtered based upon company code and business area.*/

		// await this.tm.getTN("emp_search").setProperty('business_area',businessArray);
		// await this.tm.getTN("emp_search").setProperty('company_code',companyArray);

		// await this.tm.getTN("all_employee").setProperty('business_area',businessArray);
		// await this.tm.getTN("all_employee").setProperty('company_code',companyArray);

		await this.tm.getTN("emp_search").executeP();
		await this.tm.getTN("all_employee").executeP();

		/*<Fetching the designation id of the logged in user from designation table.>*/

		let emp_designation_id = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: loginid, fdate: new Date().getTime(), tdate: new Date().getTime() });
		if (emp_designation_id.length > 0) {
			/*<Getting the designation name on the basis of designation id.
			In executed query I am using 0th index after fetching from the query because it is giving only one entity but in the form of an array.*/

			let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { 'designation_id': emp_designation_id[0].designation, loadAll: true });
			this.role = emp_designation_name[0].name;
		}

		/*<Setting the role for expression binding.>*/

		this.tm.getTN("user_role_store").setData({ roler: this.role });
		this.tm.getTN("leave_genrator").setData({});

	}
	public async onEdit() {
		/*Getting the detail of selected employee*/

		let entity = await this.tm.getTN('o2c_employ_detail').getData();

		/*If the status of the selected employee is rejected.
		Then HR can only edit to change its status to Pending and the approval flow will work from next cycle */

		if (entity.s_status == "Rejected" && entity.pending_with == "HR") {
			let enitity_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': entity.employee_id, 'is_primary': true, loadAll: true });
			let rejection_flow = <KloEntitySet<d_o2c_employee_approval_flow>>await this.transaction.getExecutedQuery('d_o2c_employee_approval_flow', { "employee_id": entity.employee_id, 'approval_status': "Rejected", loadAll: true })
			await this.tm.getTN("o2c_employ_detail/r_emp_approval_flow").createEntityP({ approval_cycle: rejection_flow[0].approval_cycle + 1, pending_with_role: "HR", employee_id: entity.employee_id, pending_with_level: 0, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: enitity_org[0].business_area, company_code: enitity_org[0].company_code, profit_center: enitity_org[0].profit_center }, null, null, null, "First", false, false, false)
		}

		/*Setting the screen mode to edit.*/
		this.setMode("EDIT");
	}
	public async onSave(oEvent) {
		/*Manually triggering the validation for */

		/*Getting the Json data of the selected employee
		and setting the Profile completeness score based upon the data which have been already filled.*/
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.open();
		let genInfo = await this.tm.getTN("o2c_employ_detail").getData().getJSON();
		let entity = this.tm.getTN("o2c_employ_detail").getData();
		let genInfoLen = Object.values(genInfo).length;
		let newObj = Object.values(genInfo).filter((key) => key).length;
		let profileScore = ((newObj) / (genInfoLen - 3)) * 100;
		entity.profile_completeness_score = Math.floor(profileScore);

		/*Change the status for inactive users*/
		if (entity.is_active == false && activeFlag == true) {
			entity.status = entity.s_status;
			entity.s_status = "Inactive";
		} else if (entity.is_active == true && activeFlag == true) {
			entity.s_status = entity.status;
		}

		/*Changing the status of employee from Rejected to Pending after HR edit it.*/
		if (entity.s_status == "Rejected" && entity.pending_with == "HR") {
			entity.s_status = "Pending";
		}
		if (activeFlag == false && entity.s_status != "Inactive") {
			entity.status = "Draft";
		}
		/*For is_primary validation.*/
		let flag = false;
		let org = this.tm.getTN("o2c_employee_org_list").getData();
		if (org) {
			for (let i = 0; i < org.length && flag == false; i++) {
				if (org[i].is_primary == true) {
					flag = true;
				}
			}
		}
		if (flag == false) {
			sap.m.MessageBox.error("Atleast one organisation should be primary.", {
				title: "Error",                                      // default
				onClose: null,                                       // default
				styleClass: "",                                      // default
				actions: sap.m.MessageBox.Action.CLOSE,              // default
				emphasizedAction: null,                              // default
				initialFocus: null,                                  // default
				textDirection: sap.ui.core.TextDirection.Inherit
			});
		} else {
			let confirm = await this.onTypeChange();
			if (confirm) {
				await this.tm.commitP("Save Successful", "Save Failed", true, true);
			}
			activeFlag = false;
			confirmFlag = true;
			await this.onLeaveGenrate()

		}

		oBusyIndicator.close();
		/*Saving the changes.*/
	}


	/*<creating Entities...>*/

	public async onEmpCreate() {
		/*Navigating from list to detail on click of create button*/
		await this.navTo(({ S: "p_o2c_employee", SS: "s_o2c_employ_detail" }))

		/*Creating the entity of employee*/
		await this.tm.getTN("o2c_employ_list").createEntityP({ employee_id: "####", s_status: "New", main_url: (System.getInstance().getServerURL()) + '/p6/' + clientGlobalObj.landscape + '/index.html', is_active: true, timesheet_not_required: false }, null, null, null, "First", true, true, false);

		/*Setting the active index to 0 and creating org entity for new employee*/
		await this.tm.getTN("o2c_employ_detail").setActive(0);
		let neworg = await this.tm.getTN("o2c_employ_detail/r_employee_org").createEntityP({ employee_id: "####", company_code: this.comp }, null, null, null, "First", true, true, false);
		this.tm.getTN("o2c_employee_org_detail").setData(neworg);
	}

	//Creating Organization with already filled company code
	public async orgCreate() {
		await this.tm.getTN("o2c_employee_org_list").createEntityP({ company_code: this.comp }, null, null, null, "First", true, true, false);
	}


	/*<downloading documents.....>*/

	public async onDownload(oEvent) {

		/*Getting the path to find the active index and downloading the attachment.*/
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/o2c_employee_doc_list/", ''));
		await this.tm.getTN("o2c_employee_doc_list").getData()[index].file_location.downloadAttachP();
	}


	/*<Employee Approval Starts>*/
	public confirmApprove() {

		/*Just a confirmation box for approving any employee.*/
		sap.m.MessageBox.confirm("Do you really want to Approve?", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onApprove();
				}
			}
		})
	}

	public async onApprove() {
		/*Getting the detail of selected employee*/
		let entity = await this.tm.getTN('o2c_employ_detail').getData();
		entity.status = "";
		/*Fetching the org, approval and approval master data for approval flow.*/
		let enitity_org = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': entity.employee_id, 'is_primary': true, loadAll: true });
		let approval_flow = <KloEntitySet<d_o2c_employee_approval_flow>>await this.transaction.getExecutedQuery('d_o2c_employee_approval_flow', { "employee_id": entity.employee_id, 'approval_status': "Pending", loadAll: true })
		/*Using 0th index in query because for any employee his org can have only one is_primary marked.*/
		let approval_mstr = <KloEntitySet<d_o2c_emp_apprvl_mstr>>await this.transaction.getExecutedQuery("d_o2c_emp_apprvl_mstr", { "company_code": enitity_org[0].company_code, "business_area": enitity_org[0].business_area, loadAll: true })
		let level = undefined;
		let role;
		/*Getting the level of the selected employee*/
		for (let i = 0; i < approval_mstr.length; i++) {
			if (approval_flow[0].pending_with_role == approval_mstr[i].approve_role) {
				level = approval_mstr[i].approve_level;
			}
			else if (approval_flow[0].pending_with_role == "HR") {
				level = 0;
			}
		}

		/*If level is less than the last level of approval then finding the role for that level.*/
		if (level < approval_mstr.length) {
			level = level + 1;
			for (let i = 0; i < approval_mstr.length; i++) {
				if (level == approval_mstr[i].approve_level) {
					role = approval_mstr[i].approve_role;
				}
			}

			/*Sending notification to Legal team after HR approval*/

			if (this.role == "HR") {
				let legalIDArray = [];
				let desig_id = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { name: 'LEGAL', loadAll: true });
				let legalID = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('d_o2c_employee_designation', { loadAll: true, designation: desig_id[0].designation_id });
				for (let emp of legalID) {
					legalIDArray.push(emp.employee_id.toLowerCase());
				}
				await this.tm.getTN("reminder").setProperty('legal', legalIDArray);
				await this.tm.getTN("reminder").setProperty('type', "ApprovedByHR");
				await this.tm.getTN("reminder").setProperty('emp_id', entity.employee_id);
				await this.tm.getTN("reminder").executeP();
			}

			/*Changing in the approval table the data for that employee.*/
			if (approval_flow.length) {
				approval_flow[0].approval_status = "Approved";
				approval_flow[0].action_datetime = approval_flow[0].s_modified_on;
			}
			/*Creating next level in approval table after changing the previous one.*/
			await this.tm.getTN("o2c_employ_detail/r_emp_approval_flow").createEntityP({ pending_with_role: role, approval_cycle: approval_flow[0].approval_cycle, employee_id: entity.employee_id, pending_with_level: level, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: enitity_org[0].business_area, company_code: enitity_org[0].company_code, profit_center: enitity_org[0].profit_centre }, null, null, null, "First", true, false, false)
			entity.pending_with = role;
		}
		/*At last level changing the details of employee.*/
		else {
			if (approval_flow.length) {
				approval_flow[0].approval_status = "Approved";
				approval_flow[0].action_datetime = approval_flow[0].s_modified_on;
				entity.pending_with = null;
				entity.s_status = "Approved";
				entity.approved_by = entity.line_manager;
				entity.approved_on = entity.s_modified_on;
			}

			/*TO trigger mail for Legal Approve*/
			this.legalApproveNotification();

		}
		await this.tm.commitP("Approved", "Approve Failed", true, true);
	}
	/*<Approval Flow Ends>*/


	/*<Rejection Flow Starts>*/
	public confirmReject() {
		/*Just a confirmation box when rejecting any employee.*/
		sap.m.MessageBox.confirm("Do you really want to reject?", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onRejection();
				}
			}
		})
	}

	public async onRejection() {
		/*Getting the detail of selected employees.*/
		let entity = this.tm.getTN('o2c_employ_detail').getData();
		/*Getting the approval table data to make changes in it.*/
		let rejection_flow = <KloEntitySet<d_o2c_employee_approval_flow>>await this.transaction.getExecutedQuery('d_o2c_employee_approval_flow', { "employee_id": entity.employee_id, 'approval_status': "Pending", loadAll: true })
		/*Changing the details of employees such as status to rejected and others........*/
		if ((entity.s_status == "Rejected" || entity.s_status == "Pending") && entity.pending_with == "HR") {
			entity.s_status = "New";
			await this.tm.getTN("reminder").setProperty('type', "RejectedByHR");
			await this.tm.getTN("reminder").setProperty('emp_id', entity.employee_id);
			await this.tm.getTN("reminder").executeP();
		}
		else if (rejection_flow.length) {
			rejection_flow[0].approval_status = "Rejected";
			rejection_flow[0].action_datetime = rejection_flow[0].s_modified_on;
			entity.s_status = "Rejected";
			entity.pending_with = "HR";
		}
		await this.tm.commitP("Rejected", "Rejection Failed", true, true);
	}
	/*<Rejection Flow Ends>*/

	/*<Cancel Action Starts*/
	public onCancel() {
		/*Just a confirmation box on cancel action.*/
		sap.m.MessageBox.confirm("Some changes are not saved. Do you really want to cancel ?", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
			emphasizedAction: sap.m.MessageBox.Action.OK,
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.cancelling();
				}
			}
		})
	}

	public async cancelling() {
		let mode = await this.getMode();
		await this.transaction.rollback();
		await this.tm.getTN("o2c_employ_detail").refresh();
		if (mode === "CREATE") {
			await this.navTo(({ S: "p_o2c_employee", SS: "pa_o2c_employ_search" }))

		}
		this.setMode("DISPLAY");
	}/*<Cancel Action Ends>*/


	/*Making the is_primary field in org to radio button so that only one primary is getting selected.*/
	public async onPrimarySelect(oEvent) {
		let org = this.tm.getTN('o2c_employee_org_list').getData();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/o2c_employee_org_list/", ''));
		for (let i = 0; i < org.length; i++) {
			if (i != index) {
				org[i].is_primary = false;
			}
		}
	}


	/*Formatter function to show the designation based upon company code.*/
	public designationSelect(value) {
		let i;
		if (value) {
			if (value.length != 0) {
				for (i = 0; i < value.length; i++) {
					if (value[i].is_primary == true) {
						break;
					}
				}
				return value[i].company_code;
			}
		}
	}

	/*Navigating from list to detail*/
	public async navToDetail(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		await this.navTo(({ SS: 'pa_o2c_emp_detail' }), oEvent)
		let data_emp = await this.tm.getTN('o2c_employ_list').getProperty(parseInt(path.replace("/o2c_employ_list/", '')));
		this.tm.getTN('leave_genrator').setData({ "confirmation_dt": data_emp.confirmation_date, "type": data_emp.type, "ph": data_emp.phone_number });
		let q = await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: data_emp.s_created_by, loadAll: true });
		//console.log(this.tm.getTN('leave_genrator').getData())
		// await this.tm.getTN('leave_genrator').setProperty('type', this.roleid)
		// await this.tm.getTN('leave_genrator').setProperty('confirmation_dt', await this.approverName(listData[0].lmi))
		// let org = await this.tm.getTN("o2c_employ_list").getActiveData().r_employee_org
		// let company;
		// for(let o of org){
		// 	if(o.is_primary == true){
		// 		company = o.company_code;
		// 		break;
		// 	}
		// }
		// await this.tm.getTN("line_mngr_dropdown").setData({comp:company});
		await this.tm.getTN("line_mngr_dropdown").setData({ name: q[0]?.full_name });
	}

	// Leave genrator 
	public async onLeaveGenrate() {
		let data_emp = await this.tm.getTN('o2c_employ_detail').getData()
		//console.log(data_emp)
	}

	//VH search in Line Manager
	public async lineManagerSearch(oEvent) {
		await this.tm.getTN("all_employee_list").applyfilterP('full_name', oEvent.mParameters.value);
		await this.tm.getTN("all_employee_list").refresh();
	}

	public async getImgPath(path) {
		let attachment = await path.getAttachmentP();
		return attachment;
	}

	/*Validation for duplicate family relation*/
	public async onRelationChange(oEvent) {
		let entity = this.tm.getTN("emp_family_info_list").getData();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/emp_family_info_list/", ''));
		let family: d_o2c_emp_family_info = this.tm.getTN("emp_family_info_list").getData()[index];
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

	/*TO trigger mail for submission of Profile*/

	public async profileReminder() {
		let detail = await this.tm.getTN("o2c_employ_detail").getData();
		await this.tm.getTN("reminder").setProperty('type', "Profile");
		await this.tm.getTN("reminder").setProperty('emp_id', detail.employee_id);
		await this.tm.getTN("reminder").executeP()
		sap.m.MessageToast.show("Reminder Mail for Profile Submission is sent successfully!");
	}

	/*Activate flag for is_active property change*/
	public onisActive() {
		activeFlag = true;
	}

	/*On Type Change Validation*/
	public async onTypeChange() {
		let entity = await this.tm.getTN("o2c_employ_detail").getData();
		let curr_date = new Date();
		curr_date.setHours(0, 0, 0, 0);
		if (entity.confirmation_date?.getTime() >= curr_date.getTime() && entity.type == "T02") {
			confirmFlag = false;
			sap.m.MessageBox.error("Please verify the confirmation date! it cannot be future date if you are making it Permanent today.", {
				title: "Error",                                      // default
				onClose: null,                                       // default
				styleClass: "",                                      // default
				actions: sap.m.MessageBox.Action.CLOSE,              // default
				emphasizedAction: null,                              // default
				initialFocus: null,                                  // default
				textDirection: sap.ui.core.TextDirection.Inherit
			});

		}
		return confirmFlag;
	}

	public async legalApproveNotification() {
		let detail = await this.tm.getTN("o2c_employ_detail").getData();
		await this.tm.getTN("legal_approval_search").setProperty('type', "approvedByLegal");
		await this.tm.getTN("legal_approval_search").setProperty('emp_id', detail.employee_id);
		await this.tm.getTN("legal_approval_search").executeP()
		sap.m.MessageToast.show("Reminder Mail for Profile Submission is sent successfully!");
	}
	public async legalRejectNotification() {
		let detail = await this.tm.getTN("o2c_employ_detail").getData();
		await this.tm.getTN("legal_approval_search").setProperty('type', "rejectedByLegal");
		await this.tm.getTN("legal_approval_search").setProperty('emp_id', detail.employee_id);
		await this.tm.getTN("legal_approval_search").executeP();
		sap.m.MessageToast.show("Reminder Mail for Profile Submission is sent successfully!");
	}

	public async onExcelDownload() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		try {
			// Get the employee lists
			var employee_list = await this.tm.getTN("o2c_employ_list").getData();
			let aFilteredData = employee_list.map(emp => emp.employee_id);

			const jsonData = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
				url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getEmployeeList", true),
				data: {
					aFilteredData
				},
				method: "POST"
			});

			// const jsonData = [];
			// const designation_master = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery("d_o2c_designation_master", { loadAll: true });
			// const all_employee_list = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true });
			// const empMap = Object.fromEntries(all_employee_list.map(e => [e.employee_id, e.full_name]));

			// Build the jsonData array using the fetched data
			// for (let index = 0; index < aFilteredData.length; index++) {
			// 	const empData = aFilteredData[index]; // Store once and reuse

			// 	await empData.r_employee_org.fetch();
			// 	let emp_org = empData.r_employee_org.find(item => item.is_primary === true);

			// 	let emp_designation = null;
			// 	await empData.r_o2c_emp_designation.fetch();

			// 	if (empData.r_o2c_emp_designation?.length) {
			// 		const today = new Date().getTime();

			// 		// Filter all records where today's date lies between from_date and to_date (considering empty fields)
			// 		emp_designation = empData.r_o2c_emp_designation.find(item => {
			// 			const fromDate = item.from_date ? new Date(item.from_date).getTime() : null;
			// 			const toDate = item.to_date ? new Date(item.to_date).getTime() : null;

			// 			// Include if:
			// 			// - from_date is empty (open start) OR today >= from_date
			// 			// - and to_date is empty (open end) OR today <= to_date
			// 			return (!fromDate || today >= fromDate) && (!toDate || today <= toDate);
			// 		});
			// 	}

			// 	const employeeDetails = {
			// 		'Employee ID': empData?.employee_id,
			// 		'Employee Name': empData?.full_name,
			// 		'Confirmation Date': empData?.confirmation_date,
			// 		'Is Active': empData?.is_active,
			// 		'Status': empData?.s_status,
			// 		'Location': emp_org?.business_area,
			// 		'Team': emp_org?.profit_centre,
			// 		'Joining Date': empData?.joining_date,
			// 		'Phone Number': empData?.phone_number,
			// 		'Is Fresher': empData?.is_fresher,
			// 		'Personal Mail': empData?.personal_mail,
			// 		'Official Mail': empData?.official_mail,
			// 		'Gender': empData?.gender === "gen1" ? "Male" : "Female",
			// 		'Previous Experience In Month': empData?.previous_exp_Months,
			// 		'Approved By': empMap[empData?.approved_by?.toUpperCase()] || "",
			// 		'Marital Status': empData?.maritial_status == null
			// 			? ""
			// 			: empData?.maritial_status === "M01"
			// 				? "Single"
			// 				: empData?.maritial_status === "M02"
			// 					? "Married"
			// 					: empData?.maritial_status === "M03"
			// 						? "Divorced"
			// 						: empData?.maritial_status === "M04"
			// 							? "Widow"
			// 							: "",
			// 		'Father Name': empData?.father_name,
			// 		'Date of Birth': empData?.date_of_birth,
			// 		'Is Passport Available': empData?.is_passport_available,
			// 		'Line Manager': empMap[empData?.line_manager?.toUpperCase()] || "",
			// 		'Hiring Manager': empMap[empData?.s_created_by?.toUpperCase()] || "",
			// 		'Bank Name': empData?.bank_name,
			// 		'Ifsc Code': empData?.ifsc_code,
			// 		'Account Number': empData?.account_number,
			// 		'Work Mode': empData?.work_mode,
			// 		'Designation': designation_master.find(e => e.designation_id === emp_designation?.designation)?.name,
			// 	};

			// 	jsonData.push(employeeDetails);
			// }


			const worksheet = XLSX.utils.json_to_sheet(jsonData);
			const workbook = XLSX.utils.book_new();

			// Set column widths for 26 columns (A to Z)
			worksheet['!cols'] = Array(26).fill({ width: 20 });

			// If you want a few specific columns wider (optional example):
			// worksheet['!cols'][7] = { width: 30 }; // Column H
			// worksheet['!cols'][8] = { width: 25 }; // Column I

			// Generate header cell references (A1 to Z1)
			const headerCells = Array.from({ length: 26 }, (_, i) =>
				String.fromCharCode(65 + i) + "1"
			);

			// Apply header styles
			headerCells.forEach(cell => {
				if (worksheet[cell]) {
					worksheet[cell].s = {
						fill: {
							fgColor: { rgb: "FFFF00" } // Yellow background
						},
						font: {
							bold: true // Optional: make text bold
						}
					};
				}
			});


			XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Data");

			// Write workbook to a file
			const filePath = 'o2c_employee_data.xlsx';
			XLSX.writeFile(workbook, filePath, { bookSST: true });
		} catch (e) {
			sap.m.MessageToast.show("An error occurred while downloading the employee data. Please check console.");
			console.log(e);
		} finally {
			busyDialog.close();
		}
	}
}
