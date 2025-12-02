import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee_benefitconfig } from 'o2c_v2/entity_gen/d_o2c_employee_benefitconfig';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
import { d_o2c_emp_general_config } from 'o2c_v2/entity_gen/d_o2c_emp_general_config';
import { d_o2c_pa_plan_apprver_config } from 'o2c_v2/entity_gen/d_o2c_pa_plan_apprver_config';
import { d_o2c_pa_cat_plan_apprl_flw } from 'o2c_v2/entity_gen/d_o2c_pa_cat_plan_apprl_flw';
import { d_o2c_employee_salary_hdr } from 'o2c_v2/entity_gen/d_o2c_employee_salary_hdr';
import { d_o2c_emp_ben_elig_config } from 'o2c_v2/entity_gen/d_o2c_emp_ben_elig_config';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
//import { atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt } from '../../../node_modules/mathjs'
//const { evaluate, parse } = require('math.js');
// import { atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt } from 'mathjs';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_ind_employe")
export default class p_pa_ind_employe extends KloController {

	/*public async onPageEnter() {
		//This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/

	/*public async onPageModelReady() {
		//This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
		  //This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	public employeeData = [];
	public loginID;
	public roleID;
	public code;
	public _resolveLoginPromise;
	public async onPageEnter() {
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
		if (general_config[0].high_value == 1) {
			const waitForLogin = new Promise<void>((resolve) => {
				this._resolveLoginPromise = resolve;
			});
			await this.openDialog("p_pa_dialog_box");
			// Wait here until login completes and dialog is closed
			await waitForLogin;
			await this.onFunc(); // Only runs after successful login + dialog closed
		}
	}
	public async onFunc() {
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
		if (general_config[0].high_value == 1) {

			await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "emp_individual");
			let busyDialog = new sap.m.BusyDialog({
				text: "Please Wait, Data is loading.."
			});
			busyDialog.open();
			this.tm.getTN("other").setData({});

			this.loginID = (await this.transaction.get$User()).login_id;

			//loadAll true is using because first time without loadAll true the data is not coming
			this.employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.loginID, expandAll: 'r_employee_org', partialSelected: ['employee_id', 'line_manager'] });

			// let loginUserOrgBArea = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.business_area))).map((businessArea) => ({ key: businessArea }));
			// let loginUserOrgPC = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.profit_centre))).map((PC) => ({ key: PC }));

			const employeeOrgResult = await paFinancialYear.employeeUniqueOrg(this.transaction, this.employeeData[0].r_employee_org);

			//Login user Org set in the drop down of search
			this.tm.getTN("other").setProperty('companyList', employeeOrgResult.loginUserOrgCompany);
			// Add "All" option to businessAreaList
			let businessAreaListWithAll = [{ key: "ALL", value: "All" }, ...employeeOrgResult.loginUserOrgBArea];
			this.tm.getTN("other").setProperty('businessAreaList', businessAreaListWithAll);
			this.tm.getTN("other").setProperty('profitCenterList', employeeOrgResult.loginUserOrgPC);
			const workMode = await this.tm.getTN("work").getData();
			workMode.push({ work_mode_id: "ALL", work_mode: "All" })
			//staus List
			let statusList = [{ key: "ALL", value: "ALL" },{ key: "Pending", value: "Pending" },{ key: "Save As Draft", value: "Save As Draft" },{ key: "Submitted", value: "Submitted" },{ key: "Hold", value: "Hold" },{ key: "Approved", value: "Approved" },{ key: "Rework", value: "Rework" },{ key: "Accepted", value: "Accepted" },{ key: "Review", value: "Review" },{ key: "Confirmed", value: "Confirmed" } ];
			this.tm.getTN("other").setProperty('statusList', statusList);
			//Primary Org of the login user should be set in the search by default
			let primaryOrg = this.employeeData[0].r_employee_org.filter((item) => item.is_primary == true);
			let general_config_pa = <KloEntitySet<d_o2c_emp_general_config>>await this.transaction.getExecutedQuery("d_o2c_emp_general_config", { company_code: primaryOrg[0].company_code, parameter_name: "FY", module_type: "PA", loadAll: true });
			const lastExclusiveWorkingDate = await paFinancialYear.getNextFinancialYears(general_config_pa[0].parameter_values, general_config_pa[0].parameter_value2);
			this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
			this.tm.getTN("other").setProperty('businessArea', "ALL");
			this.tm.getTN("other").setProperty('work_mode_id', "ALL");
			this.tm.getTN("other").setProperty('status', "ALL");
			this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
			this.tm.getTN("other").setProperty('fiscal', lastExclusiveWorkingDate);
			//this.tm.getTN("other").setProperty('fyear', new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));
			this.tm.getTN("other").setProperty('fyear', await paFinancialYear.getFinancialYear(new Date()));


			this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());
			this.tm.getTN("other").setProperty('userLoginID', this.loginID.toUpperCase());
			this.tm.getTN("other").setProperty('role', (await this.transaction.get$Role()).role_id);

			await this.tm.getTN("total_budget").setData({});
			//switch
			this.tm.getTN("other").setProperty('isHidden',true);
			await this.lineManagerData();

			//Function call for mantee of the above company code, business area, PC and Fiscal year
			await this.searchData();
			busyDialog.close();
		}
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
				//  Resolve the promise to resume `abc()`
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
	//need to change "lineManagerData" this function
	public async lineManagerData() {
		//without loadAll :true, employee id are coming as undefined
		let allEmployeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, partialSelected: ['employee_id', 'line_manager'] });

		const visited = new Map<string, { employeeID: string; name: string }>();
		const seenEmployees = new Set<string>();

		const loginUser = await this.transaction.get$User();
		const loginUserID = loginUser.login_id;

		const otherData = await this.tm.getTN("other").getData();
		const businessArea = otherData.businessArea;
		const profitCenter = otherData.profitCenter;

		const queue: string[] = [loginUserID];

		while (queue.length > 0) {
			const currentManagers = [...queue];
			queue.length = 0;

			const employeeResults = await this.transaction.getExecutedQuery('q_mantees_based_on_org', {
				line_manager: currentManagers,
				//business_area: businessArea,
				profit_center: profitCenter,
				loadAll: true
			});

			for (const emp of employeeResults) {
				const empId = emp.employee_id;
				const lmId = emp.line_manager;

				if (!seenEmployees.has(empId)) {
					seenEmployees.add(empId);

					// Store manager info uniquely
					if (!visited.has(lmId.toUpperCase())) {
						const lmi = allEmployeeData.find(item => item.employee_id.toUpperCase() === lmId.toUpperCase());
						visited.set(lmId, {
							employeeID: lmId.toUpperCase(),
							name: lmi ? lmi.full_name : ''
						});
					}

					queue.push(empId); // Continue BFS
				}
			}
		}

		// Add login user at the start if not already in visited
		if (!visited.has(loginUserID.toUpperCase())) {
			const loginUserName = allEmployeeData.find(item => item.employee_id.toUpperCase() === loginUserID.toUpperCase());
			visited.set(loginUserID, {
				employeeID: loginUserID.toUpperCase(),
				name: loginUserName ? loginUserName.full_name : ''
			});
		}

		const finalList = Array.from(visited.values());
		await this.tm.getTN("other").setProperty('lm', finalList);
	}
	public async searchData() {
		let searchData = await this.tm.getTN("other").getData();
		await this.tm.getTN("search").setProperty('business_area', searchData.businessArea);
		await this.tm.getTN("search").setProperty('profit_center', searchData.profitCenter);
		await this.tm.getTN("search").setProperty('fyear', searchData.fyear)
		await this.tm.getTN("search").setProperty('lmi', searchData.loginUser);
		await this.tm.getTN("search").setProperty('paStatus', searchData.status);
		await this.tm.getTN("search").getData().refreshP();
		let es=await this.tm.getTN("search").executeP();
		await this.tm.getTN("other").setProperty('totalEmployeeCount', (await this.tm.getTN("list").getData().length) / 3);
		//new line
		await this.lineManagerData();
		await this.initialCheckBox();
		await this.buttonVisibleBasedOnApprovalMaster();
		//For budget new code
		if(es.length){
		let lmiBudget = await this.transaction.getExecutedQuery("d_o2c_pa_cycle_id_lm_budget", {
			loadAll: true,
			pa_cycle_id: es[0].pa_cycle_id,
			line_manager_id: searchData.loginUser
		});
		
		if (lmiBudget?.length > 0) {
			const allottedBudget = parseFloat(parseFloat(lmiBudget[0].allotted_budget).toFixed(2));
			const unutilisedBudget = parseFloat(parseFloat(lmiBudget[0].unulilised_budget).toFixed(2));
		
			this.tm.getTN("total_budget").setProperty('allocated_budget', allottedBudget);
			this.tm.getTN("total_budget").setProperty('unutilised_budget', unutilisedBudget);
		}
	}
	}
	public async onSave() {
		let listData = await this.tm.getTN("list").getData();
		let checkBoxFlag = listData.filter((item) => item.check_box == true);
		if (checkBoxFlag.length == 0) {
			//Please select atleast one check box
			sap.m.MessageBox.error("Please select atleast one check box!", {
				title: "Error",
			});
		}
		else {
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, "Save As Draft", ["Pending", "Save As Draft", "Rework"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					//let checkBoxFlagProposedData = listData.filter((item) => item.hdr_pa_req_id == checkBoxFlag[i].hdr_pa_req_id && item.stage == "Proposed");
					checkBoxFlag[i].s_status = "Save As Draft";
					checkBoxFlag[i].check_box = false;
				}
				//await this.tm.commitP("Save Successfully", "Save Failed", true, true);
				const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
					url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
					data: {
						loginID: this.loginID,
						totpCode: this.code
					},
					method: "POST"
				});
				if (response) {
					await this.tm.commitP("Save Successfully", "Save Failed", false, true);
				}
				else {
					await this.openDialog("p_pa_dialog_box");
				}
			}
		}
	}
	public async onSubmit() {
		let listData = await this.tm.getTN("list").getData();
		let checkBoxFlag = listData.filter((item) => item.check_box == true);
		if (checkBoxFlag.length == 0) {
			//Please select atleast one check box
			sap.m.MessageBox.error("Please select atleast one check box!", {
				title: "Error",
			});
		}
		else {
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, "Submission", ["Pending", "Save As Draft", "Rework"]);
			if (!oListValue) {
				// All items are Pending, proceed with processing
				for (let i = 0; i < checkBoxFlag.length; i++) {

					// ✅ Budget Validation
					if (checkBoxFlag[i].stage == "Proposed") {
						let isBudgetValid = await this.onBudgetValidation(checkBoxFlag[i]);
						if (isBudgetValid === 0) {
							// ❌ Budget exceeded — show error and exit
							sap.m.MessageBox.error("Your budget is exceeding", {
								title: "Budget Exceeded"
							});
							return; // 🚫 Stop further processing
						}
					}
					//new code
					checkBoxFlag[i].approval_cycle = checkBoxFlag[i].approval_cycle + 1;
					//new code 
					await this.approvalFlowCreation(checkBoxFlag[i], 1);
					checkBoxFlag[i].s_status = "Submitted";
					checkBoxFlag[i].check_box = false;
				}
				//await this.tm.commitP("Send For Approval", "Send For Approval Failed", true, true);
				const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
					url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
					data: {
						loginID: this.loginID,
						totpCode: this.code
					},
					method: "POST"
				});
				if (response) {
					await this.tm.commitP("Send For Approval", "Send For Approval Failed", true, true);
				}
				else {
					await this.openDialog("p_pa_dialog_box");
				}
			}
		}
	}
	public async approvalFlowCreation(checkBoxFlag, nextLevel) {
		let flowPending;
		let searchData = await this.tm.getTN("other").getData();
		let approvalMaster = <KloEntitySet<d_o2c_pa_plan_apprver_config>>await this.transaction.getExecutedQuery('d_o2c_pa_plan_apprver_config', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'approval_level': nextLevel, 'planning_type': "Employee Planning" });
		if (approvalMaster.length) {
			//create Approval Flow
			let approvalFlow = await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Employee Planning", company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: checkBoxFlag.pa_cycle_id, type_key_id: checkBoxFlag.hdr_pa_req_id, s_status: "Pending", approval_cycle: checkBoxFlag.approval_cycle, approval_level: nextLevel });
			if (approvalMaster[0].approval_control == "X") {
				flowPending = this.employeeData[0].line_manager;
				approvalFlow.approval_control = "X";
				approvalFlow.pending_with_id = flowPending;
			}
			if (approvalMaster[0].approval_control == "Y") {
				flowPending = approvalMaster[0].employee_role;
				approvalFlow.approval_control = "Y";
				approvalFlow.pending_with_role = flowPending;
			}
			if (approvalMaster[0].approval_control == "Z") {
				flowPending = approvalMaster[0].employee_id;
				approvalFlow.approval_control = "Z";
				approvalFlow.pending_with_id = flowPending;
			}
		}
		else {
			checkBoxFlag.s_status = "Approved";
			//create the line item for accept for employee approval
			await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Employee Planning", company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: checkBoxFlag.pa_cycle_id, type_key_id: checkBoxFlag.hdr_pa_req_id, s_status: "Pending", approval_cycle: checkBoxFlag.approval_cycle, approval_control: "Z", pending_with_id: checkBoxFlag.line_manager });
		}
	}
	public async onApproval() {
		let listData = await this.tm.getTN("list").getData();
		let checkBoxFlag = listData.filter((item) => item.check_box == true);
		if (checkBoxFlag.length == 0) {
			//Please select atleast one check box
			sap.m.MessageBox.error("Please select atleast one check box!", {
				title: "Error",
			});
		}
		else {
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, "Approval", ["Submitted"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: checkBoxFlag[i].pa_cycle_id, type_key_id: checkBoxFlag[i].hdr_pa_req_id, approval_cycle: checkBoxFlag[i].approval_cycle, s_status: "Pending" });
					if (currentApprovalFlow[0].approval_control == "X") {
						if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase())
							currentApprovalFlow[0].s_status = "Approved";
					}
					else if (currentApprovalFlow[0].approval_control == "Y") {
						if (currentApprovalFlow[0].pending_with_role == this.roleID)
							currentApprovalFlow[0].s_status = "Approved";
					}
					else {
						if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase())
							currentApprovalFlow[0].s_status = "Approved";
					}
					await this.approvalFlowCreation(checkBoxFlag[i], currentApprovalFlow[0].approval_level + 1);
					//await this.tm.commitP("Approved Successfully", "Approved Failed", true, true);
					checkBoxFlag[i].check_box = false;
				}
				await this.tm.commitP("Approved Successfully", "Approved Failed", true, true);
			}
		}
	}
	public async onRework() {
		let listData = await this.tm.getTN("list").getData();
		let checkBoxFlag = listData.filter((item) => item.check_box == true);
		if (checkBoxFlag.length == 0) {
			//Please select atleast one check box
			sap.m.MessageBox.error("Please select atleast one check box!", {
				title: "Error",
			});
		}
		else {
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, "Rework", ["Submitted"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: checkBoxFlag.pa_cycle_id, type_key_id: checkBoxFlag[i].hdr_pa_req_id, approval_cycle: checkBoxFlag[i].approval_cycle, s_status: "Pending" });
					if (currentApprovalFlow[0].approval_control == "X") {
						if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase())
							currentApprovalFlow[0].s_status = "Return Back";
					}
					else if (currentApprovalFlow[0].approval_control == "Y") {
						if (currentApprovalFlow[0].pending_with_role == this.roleID)
							currentApprovalFlow[0].s_status = "Return Back";
					}
					else {
						if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase())
							currentApprovalFlow[0].s_status = "Return Back";
					}
					checkBoxFlag[i].s_status = "Rework";
					checkBoxFlag[i].check_box = false;
				}
				await this.tm.commitP("Rework Required", "Rework Required Failed", true, true);
			}


		}
	}

	// Accept 
	public async onDetailRework() {

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			if (currentApprovalFlow[0].pending_with_role == this.roleID) {
				currentApprovalFlow[0].s_status = "Rework";
			}

		}
		listData.s_status = "Rework";

		await this.tm.commitP("Rework Required", "Rework Required Failed", true, true);
		// listData.refreshP();

	}

	public async onDetailHold() {
		const searchData = await this.tm.getTN("other").getData();
		const listData = await this.tm.getTN("detail").getData();

		switch (listData.s_status) {
			case "Pending":
			case "Submitted":
			case "Save As Draft":
				await this.updateCurrentFlowToHold(listData);
				await this.createFlow_TEAM_HEAD_Y(listData, searchData);
				break;

			case "Approved":
				await this.updateCurrentFlowToHold(listData);
				await this.createFlow_LINE_MANAGER_Z(listData, searchData);
				break;

			case "Accepted":
				await this.updateCurrentFlowToHold(listData);
				await this.createFlow_FINANCE_Y(listData, searchData);
				break;

			case "Rework":
			case "Review Declined":
				await this.createFlow_SELF_Z(listData, searchData);
				await this.createFlow_TEAM_HEAD_Y(listData, searchData);
				break;

			case "Review":
				await this.updateCurrentFlowToHold(listData);
				await this.createFlow_TEAM_HEAD_Y(listData, searchData);
				break;

			// No action for Confirmed or Holds
		}

		listData.s_status = "Hold";
		await this.tm.commitP("On Hold", "On Hold Failed", true, true);
	}

	public async updateCurrentFlowToHold(listData: any) {
		const currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>
			await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', {
				loadAll: true,
				approval_type: "Employee Planning",
				pa_cycle_id: listData.pa_cycle_id,
				type_key_id: listData.hdr_pa_req_id,
				approval_cycle: listData.approval_cycle,
				s_status: "Pending"
			});

		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Hold";
			currentApprovalFlow[0].action_by_id = this.loginID;
		}
	}

	public async createFlow_TEAM_HEAD_Y(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
			approval_type: "Employee Planning",
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			type_key_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			pending_with_role: "TEAM_HEAD",
			approval_control: "Y"
		});
	}

	public async createFlow_LINE_MANAGER_Z(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
			approval_type: "Employee Planning",
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			type_key_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			approval_control: "Z",
			pending_with_id: listData.line_manager
		});
	}

	public async createFlow_SELF_Z(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
			approval_type: "Employee Planning",
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			type_key_id: listData.hdr_pa_req_id,
			s_status: "Hold",
			approval_cycle: listData.approval_cycle,
			approval_control: "Z",
			pending_with_id: this.loginID
		});
	}

	public async createFlow_FINANCE_Y(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
			approval_type: "Employee Planning",
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			type_key_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			pending_with_role: "Finance",
			approval_control: "Y"
		});
	}

	public async onDetailAccept() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending", approval_control: "Z" });

		if (currentApprovalFlow.length) {

			if (currentApprovalFlow[0].approval_control == "Z") {
				currentApprovalFlow[0].s_status = "Accepted";
			}
			listData.s_status = "Accepted ";
			// listData.refreshP();


			await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Employee Planning", company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, s_status: "Pending", approval_cycle: listData.approval_cycle, pending_with_role: "Finance", approval_control: "Y" });

			await this.tm.commitP("Accepted", "Failed", true, true);
		}
	}


	public async onDetailReview() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Review";
			listData.s_status = "Review ";
			// listData.refreshP();
			await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Employee Planning", company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, s_status: "Pending", approval_cycle: listData.approval_cycle, pending_with_role: "TEAM_HEAD", approval_control: "Y" });

			await this.tm.commitP("Reviewed Required", "Review Failed", true, true);
		}
	}

	public async onDetailReviewDecline() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { loadAll: true, approval_type: "Employee Planning", pa_cycle_id: listData.pa_cycle_id, type_key_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Review declined";
			listData.s_status = "Review declined ";
			// listData.refreshP();
			await this.tm.commitP("Review Declined", "Failed To Decline", true, true);
		}
	}

	public async navToFeedback(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);

		let inputYear = await paFinancialYear.getFinancialYearDates(await this.tm.getTN("other").getData().fyear);
		let selectedFromDate = new Date(inputYear.startDate);
		let selectedToDate = new Date(inputYear.endDate);
		let listData = await this.tm.getTN("list").getData();
		let selectedIndex = parseInt(path.replace("/list/", " "));



		await this.tm.getTN("project_search").setProperty('employee_id', listData[selectedIndex].employee_id);
		await this.tm.getTN("project_search").setProperty('start_date', selectedFromDate);
		await this.tm.getTN("project_search").setProperty('end_date', selectedToDate);

		await this.tm.getTN("search_pa_history").setProperty('employee_id', listData[selectedIndex].employee_id);

		// await this.tm.getTN("project_search").executeP();
		// await this.tm.getTN("search_pa_history").executeP();

		await this.tm.getTN("project_search").getData().setLoadAll(true);
		const tn = this.tm.getTN.bind(this.tm);

		await Promise.all([
			tn("project_search").executeP(),
			tn("search_pa_history").executeP()
		]);


		//Billable PD's Calculation
		//partialSelected: ['employee_id', 'line_manager']

		// please check pds not calculated correctly...

		let task_id_array = []
		let task_id = await this.transaction.getExecutedQuery('q_pa_task_id', { 'employee_id': listData[selectedIndex].employee_id, f_start_date: selectedFromDate.getTime(), f_end_date: selectedToDate.getTime() })
		console.log("task_id", task_id)
		for (let i = 0; i < task_id.length; i++) {
			task_id_array.push(task_id[i].task_id_array)
		}
		let approved_task_id_array = []
		let approved_task_id = await this.transaction.getExecutedQuery('q_pa_timesheet_task_pd', { task_id: task_id_array.length ? task_id_array : "error_task_id" })

		for (let i = 0; i < approved_task_id.length; i++) {
			approved_task_id_array.push(approved_task_id[i].task_id)
		}
		console.log("Approved task id", approved_task_id_array)

		let pds = await this.transaction.getExecutedQuery('q_pa_timesheet_pds', { loadAll: true, 'task_id': approved_task_id_array.length ? approved_task_id_array : "error_approved_task_id", f_start_date: selectedFromDate.getTime(), f_end_date: selectedToDate.getTime() });
		listData[selectedIndex]["pds"] = parseFloat(pds[0]?.hours_worked) / 8 || 0;
		console.log(parseFloat(pds[0]?.hours_worked) / 8 || 0)
		//Find Hike%
		let proposedStageData = listData.find(item => item.hdr_pa_req_id === listData[selectedIndex].hdr_pa_req_id && item.stage == "Proposed");
		//Formula-Hike%:((total cost proposed-total cost current)/total cost current)*100
		//Formula-Total cost:ctc+Retention bonus+ company bonus
		const totalCost = listData[selectedIndex]?.total_cost || 1; // Avoid division by zero
		const ctc = parseFloat(proposedStageData?.ctc || 0);
		const retentionBonus = parseFloat(proposedStageData?.retention_bonus || 0);
		const companyBonus = parseFloat(proposedStageData?.company_bonus || 0);
		const totalCostValue = parseFloat(totalCost || 0);

		const hike_per = totalCostValue > 0
			? (((ctc + retentionBonus + companyBonus - totalCostValue) / totalCostValue) * 100).toFixed(2)
			: "0.00";

		//Working Project duration
		let projectList = await this.tm.getTN("project_search").getData().entityset;
		let projectData = [];
		for (let i = 0; i < projectList.length; i++) {
			let matched = 0;
			for (let j = 0; j < projectData.length; j++) {
				if (projectData[j].project_id == projectList[i].actual_project_id) {
					if (projectData[j].start_date > projectList[i].task_start_date) {
						projectData[j].start_date = projectList[i].task_start_date;
					}
					if (projectData[j].end_date < projectList[i].task_end_date) {
						projectData[j].end_date = projectList[i].task_end_date;
					}
					matched++;
				}
			}
			if (matched == 0) {
				let projectDuration = await paFinancialYear.experienceInYear(projectList[i].task_end_date, projectList[i].task_start_date);
				projectData.push({
					'project_id': projectList[i].actual_project_id,
					'project_name': projectList[i].project_name,
					'start_date': projectList[i].task_start_date,
					'end_date': projectList[i].task_end_date,
					'duration': projectDuration
				});
			}
		}

		await this.tm.getTN("other").setProperty('projectListData', projectData);
		await this.navTo(({ SS: 'pa_emp_detail' }), oEvent);
		let index = selectedIndex + 2;
		listData[index]["hike_per"] = hike_per;
		await this.tm.getTN("list").setActive(index);
		console.log(await this.tm.getTN("list").getActiveIndex())
	}
	public async onCreateFeedback() {
		//await this.tm.getTN("employee_feedback_list").createEntityP({ s_object_type: -1, 'pa_cycle_id': await this.tm.getTN("detail").getData().pa_cycle_id }, "Creation Successful", "Creation Failed", null, "First", true, true);
		let a = await this.tm.getTN("o2c_feedback_list").createEntityP({ s_object_type: -1 }, "Creation Successful", "Creation Failed", null, "First", true, true);

	}
	public async onFeedbackSave() {
		await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true)
	}
	//Only Finance has this button "Confirm"
	public async onConfirm() {
		let listData = await this.tm.getTN("list").getData();
		let checkBoxFlag = listData.filter((item) => item.check_box == true);
		if (checkBoxFlag.length == 0) {
			//Please select atleast one check box
			sap.m.MessageBox.error("Please select atleast one check box!", {
				title: "Error",
			});
		}
		else {
			let salaryItem = [];
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, "Confirmation", ["Accepted"]);
			if (!oListValue) {
				let allBenefit = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.transaction.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true });
				for (let i = 0; i < checkBoxFlag.length; i++) {
					//need to change the below line
					let checkBoxFlagProposedData = listData.filter((item) => item.hdr_pa_req_id == checkBoxFlag[i].hdr_pa_req_id && item.stage == "Proposed");
					//checkBoxFlagProposedData[0].s_status = "Confirmed";
					checkBoxFlag[i].s_status = "Confirmed";
					// checkBoxFlagProposedData[0].refreshP();
					if (checkBoxFlagProposedData[0].stage == "Proposed") {
						//salary hdr to salary log
						await this.createSalaryLog(checkBoxFlagProposedData[0].employee_id);
						//create new employee salary hdr from PA
						let salaryHDR = await this.transaction.createEntityP('d_o2c_employee_salary_hdr', { 'company_code': checkBoxFlagProposedData[0].company_code, 'business_area': checkBoxFlagProposedData[0].business_area, 'profit_center': checkBoxFlagProposedData[0].profit_center, 'employee_id': checkBoxFlagProposedData[0].employee_id, 'from_date': checkBoxFlagProposedData[0].pa_effective_from_date, 'to_date': checkBoxFlagProposedData[0].pa_effective_to_date/*, 'currency':checkBoxFlagProposedData[0].*/, 'total_cost': checkBoxFlagProposedData[0].total_cost, 'fixed': checkBoxFlagProposedData[0].fixed, 'ctc': checkBoxFlagProposedData[0].ctc/*, 'gross_pay':checkBoxFlagProposedData[0]., 'basic':checkBoxFlagProposedData[0]./*, 'basic_perc', 'total_cost_perc', 'net_take_home_annually', 'fixed_hike_perc'*/ });
						let benefitToBeRequired = allBenefit.filter((item) => item.company_code == checkBoxFlagProposedData[0].company_code && item.business_area == checkBoxFlagProposedData[0].business_area && item.profit_center == checkBoxFlagProposedData[0].profit_center);
						// Define benefit mappings
						let benefitMap = [
							{ name: "B11", amount: checkBoxFlagProposedData[0].performance_bonus },
							{ name: "B12", amount: checkBoxFlagProposedData[0].retention_bonus },
							{ name: "B13", amount: checkBoxFlagProposedData[0].company_bonus }
						];

						// Loop through each bonus type and process if the benefit exists
						for (let benefit of benefitMap) {
							let matchedBenefit = benefitToBeRequired.find(item => item.benefit_name === benefit.name);
							if (matchedBenefit) {
								salaryItem = await salaryHDR?.r_salary_hdr_items.newEntityP(0, {
									benefit_id: matchedBenefit.benefit,
									planned_amount: benefit.amount
								});
							}
						}
						//temporary calling
						await this.reCalculateSalaryData(salaryHDR, salaryItem, checkBoxFlagProposedData);
					}
				}
				await this.tm.commitP("Confirmed Successfully", "Confirmed Failed", true, true);
			}
		}
	}
	public async createSalaryLog(employeeID) {
		let empSalaryDataHDR = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery('d_o2c_employee_salary_hdr', { loadAll: true, employee_id: employeeID, expandAll: 'r_salary_hdr_items' });
		let salaryHDRLog = await this.transaction.createEntityP('d_o2c_emp_salary_hdr_log', empSalaryDataHDR[0]);
		for (let i = 0; i < empSalaryDataHDR[0].r_salary_hdr_items.length; i++)
			await salaryHDRLog.r_salary_hdr_item_log.newEntityP(0, empSalaryDataHDR[0].r_salary_hdr_items[i]);
		await empSalaryDataHDR[0].deleteP();
	}
	public async buttonVisibleBasedOnApprovalMaster() {
		let loginUserID = (await this.transaction.get$User()).login_id
		let loginRoleID = (await this.transaction.get$Role()).role_id;
		let searchData = await this.tm.getTN("other").getData();
		//need to change below line
		let approvalMasterData = <KloEntitySet<d_o2c_pa_plan_apprver_config>>await this.transaction.getExecutedQuery('d_o2c_pa_plan_apprver_config', { loadAll: true, 'company_code': searchData.companyCode, 'profit_center': searchData.profitCenter, 'planning_type': "Employee Planning" });
		let filterData = approvalMasterData.filter((e) => e.employee_id.toLowerCase() == loginUserID.toLowerCase() || e.employee_role == loginRoleID)
		await this.tm.getTN("other").setProperty('approvalRequired', (filterData.length > 0))
	}
	// public async onAmtChange(oEvent) {
	// 	await paFinancialYear.inputTypeDecimal(oEvent);
	// }
	public async onButtonClickPopUp(checkBoxFlag, currentStatus, allowedStatuses) {
		// Block if any item is NOT in "Pending" status
		const allAllowed = checkBoxFlag.every(item => allowedStatuses.includes(item.s_status));
		if (!allAllowed) {
			const allowedText = allowedStatuses.length === 1
				? `"${allowedStatuses[0]}"`
				: `"${allowedStatuses.join('", "')}"`;

			sap.m.MessageBox.error(`${currentStatus} is allowed only for ${allowedText} items.`, {
				title: "Action Denied"
			});
			// Uncheck all checkboxes
			checkBoxFlag.forEach(item => {
				item.check_box = false; // Assuming 'checked' is the property controlling checkbox state
			});
			await this.tm.getTN("list").refresh();
			return true;
		}
		else {
			return false;
		}
	}
	public async initialCheckBox() {
		let listData = await this.tm.getTN("list").getData();
		for (let i = 0; i < listData.length; i++) {
			listData[i].check_box = false;
		}
	}
	public async selectCheckBox(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		let listData = await this.tm.getTN("list").getData();
		let selectedIndex = parseInt(path.replace("/list/", " "));
		let checkBoxFlag = listData.filter((item) => item.hdr_pa_req_id == listData[selectedIndex].hdr_pa_req_id);
		for (let i = 0; i < checkBoxFlag.length; i++) {
			checkBoxFlag[i].check_box = listData[selectedIndex].check_box;
		}

	}
	public async onChangeTotalCost(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/list/", ""));
		let listData = await this.tm.getTN("list").getData();
		let allListData = listData.filter((item) => item.hdr_pa_req_id == listData[index].hdr_pa_req_id)
		let preferredListData = allListData.filter((item) => item.stage == "Preferred")
		if ((parseFloat(listData[index].total_cost) > parseFloat(preferredListData[0].total_cost)) || (parseFloat(listData[index].ctc) > parseFloat(preferredListData[0].ctc)) || (parseFloat(listData[index].fixed) > parseFloat(preferredListData[0].fixed)) || (parseFloat(listData[index].performance_bonus) > parseFloat(preferredListData[0].performance_bonus)) || (parseFloat(listData[index].retention_bonus) > parseFloat(preferredListData[0].retention_bonus)) || (parseFloat(listData[index].company_bonus) > parseFloat(preferredListData[0].company_bonus))) {
			allListData.forEach(item => item.warning_flag = true);
		}
		else {
			allListData.forEach(item => item.warning_flag = false);
		}
	}
	// public async reCalculateSalaryData(salaryHDR, designation, empID) {
	// 	const benefitResults: { [key: string]: boolean } = {};
	// 	const benefitValues: { [key: string]: any } = {};
	// 	let salaryItem;
	// 	let allRules = <KloEntitySet<d_o2c_emp_ben_elig_config>>await this.transaction.getExecutedQuery('d_o2c_emp_ben_elig_config', { loadAll: true });
	// 	let d_o2c_employee_Benefit_config = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.transaction.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true });
	// 	let employee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': empID });

	// 	for (const rule of allRules) {
	// 		const benefitId = rule.benefit_id;

	// 		// === STEP 1: Skip if outside valid date ===
	// 		const now = new Date();
	// 		const startDate = new Date(rule.start_date);
	// 		const endDate = new Date(rule.end_date);
	// 		if (now < startDate || now > endDate) {
	// 			benefitResults[benefitId] = false;
	// 			continue;
	// 		}

	// 		// 	// === STEP 2: Check eligibility ===
	// 		if (rule.eligible === 'All') {
	// 			benefitResults[benefitId] = true;
	// 		} else {
	// 			let value;
	// 			switch (rule.eligible) {
	// 				case 'Experience':
	// 					value = employee[0].experience;
	// 					break;
	// 				case 'My company Experience':
	// 					value = employee[0].myCompanyExperience;
	// 					break;
	// 				case 'Designation':
	// 					value = designation;
	// 					break;
	// 				case 'Work from':
	// 					value = employee[0].workFrom;
	// 					break;
	// 				default:
	// 					benefitResults[benefitId] = false;
	// 					continue;
	// 			}

	// 			const isEligible = await this.evaluateCondition(value, rule.operator, rule.min_value, rule.max_value);
	// 			benefitResults[benefitId] = isEligible;
	// 			if (!isEligible) continue;
	// 		}

	// 		// === STEP 3: Find matching benefit config ===
	// 		const config = d_o2c_employee_Benefit_config.find(cfg =>
	// 			cfg.benefit_id === benefitId &&
	// 			cfg.company_code === employee[0].company_code &&
	// 			cfg.business_area === employee[0].business_area &&
	// 			cfg.profit_center === employee[0].profit_center &&
	// 			cfg.s_status === 'Active'
	// 		);

	// 		if (!config) continue;

	// 		// === STEP 4: Calculate or assign value ===
	// 		let calculatedValue = null;

	// 		switch (config.base) {
	// 			case 'Calculate':

	// 				try {
	// 					const context = { ...salaryHDR, ...salaryItem };
	// 					if (config.benefit_name === "HRA") {
	// 						let formula= "40 % basic";

	// 					}
	// 					else if (config.benefit_name === "Special Allowance") {
	// 						let formula= "gross - Basic - HRA - Conveyance - Medical";

	// 					}
	// 					else if (config.benefit_name === "PF Employer") {
	// 						let oMinValue=Math.min(basic,180000);
	// 						let formula="oMinValue*12%";

	// 					}
	// 					else if (config.benefit_name === "PF Admin") {
	// 						let oMinValue=Math.min(basic,180000);
	// 						let formula="oMinValue*1%";

	// 					}
	// 					else if (config.benefit_name === "ESI Employer") {
	// 						let formula="Gross-Employer PF - Employer Gratuity";
	// 						let oValue=formula<= 252000 ? Gross * 3.25% : 0;
	// 					}
	// 					else if (config.benefit_name === "Gratuity") {
	// 						let formula="Basic / 26 * 15";
	// 					}
	// 					else if (config.benefit_name === "PF Employee") {
	// 						let oMinValue=Math.min(basic,180000);
	// 						let formula="oMinValue*12%";

	// 					}
	// 					else if (config.benefit_name === "ESI Employee") {
	// 						let formula="Gross-Employer PF - Employer Gratuity";
	// 						let oValue=formula<= 252000 ? Gross * 0.75% : 0;
	// 					}

	// 				}
	// 				catch (error) {
	// 					console.error(`Failed to evaluate formula for Benefit ID ${benefitId}:`, error);
	// 					calculatedValue = null;
	// 				}
	// 				break;

	// 			case 'Fixed':
	// 				calculatedValue = config.benefit_value;
	// 				break;

	// 			case 'Manual':
	// 				calculatedValue = null;
	// 				break;

	// 			default:
	// 				calculatedValue = null;
	// 		}

	// 		// 	// === STEP 5: Store the final benefit value ===
	// 		benefitValues[benefitId] = calculatedValue;
	// 	}

	// }
	// public async evaluateCondition(value, operator, min, max) {
	// 	switch (operator) {
	// 		case '>':
	// 			return value > min;
	// 		case '>=':
	// 			return value >= min;
	// 		case '<':
	// 			return value < max;
	// 		case '<=':
	// 			return value <= max;
	// 		case '=':
	// 		case '==':
	// 			return value === min;
	// 		case '!=':
	// 			return value !== min;
	// 		case 'between':
	// 			return value >= min && value <= max;
	// 		case 'not between':
	// 			return value < min || value > max;
	// 		default:
	// 			console.warn(`Unknown operator: ${operator}`);
	// 			return false;
	// 	}
	// }
	public async onCellValueChange(oEvent, param) {
		let path = this.getPathFromEvent(oEvent);
		let cellValue = oEvent.getParameters().value;
		const transient_data = await this.tm.getTN("list").getData();
		let index = parseInt(path.replace(`/${"list"}/`, ''));
		cellValue = parseFloat(cellValue);
		let dataAtIndex = transient_data[index];
		if (parseFloat(cellValue) < 0 || cellValue == '-' || parseFloat(cellValue) == null) {
			oEvent.getSource().setValue((0).toFixed(2));
			return;
		}
		if (param.type == "fixed") {
			// Perform calculations only once
			dataAtIndex.ctc = ((cellValue) + parseFloat(dataAtIndex.performance_bonus)).toFixed(2);
			dataAtIndex.total_cost = (parseFloat(dataAtIndex.ctc) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
			//my code added
			if (cellValue < 0 || cellValue == '-' || parseFloat(cellValue) == null || isNaN(parseFloat(cellValue))) {
				dataAtIndex.ctc = 0;
				dataAtIndex.total_cost = 0;
			}
		} else if (param.type == "performance_val") { // performance 
			dataAtIndex.ctc = (parseFloat(dataAtIndex.fixed) + cellValue).toFixed(2);
			dataAtIndex.total_cost = (parseFloat(dataAtIndex.ctc) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "company_val") { // company
			dataAtIndex.total_cost = (parseFloat(dataAtIndex.ctc) + (cellValue) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		}
		else if (param.type === "retention_val") {
			if (!dataAtIndex.rb_start_date || !dataAtIndex.rb_end_date) {
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, cellValue);
			} else {
				const years = await this.calculateYears(dataAtIndex.rb_start_date, dataAtIndex.rb_end_date);
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, cellValue / years);
			}
		}
		else if (param.type === "start_date_change") {
			if (!cellValue || !dataAtIndex.rb_end_date) {
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, cellValue);
			} else {
				const years = await this.calculateYears(cellValue, dataAtIndex.rb_end_date);
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, dataAtIndex.retention_bonus / years);
			}
		}
		else if (param.type === "end_date_change") {
			if (!cellValue || !dataAtIndex.rb_start_date) {
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, cellValue);
			} else {
				const years = await this.calculateYears(dataAtIndex.rb_start_date, cellValue);
				dataAtIndex.total_cost = await this.calculateTotalCost(dataAtIndex.ctc, dataAtIndex.company_bonus, dataAtIndex.retention_bonus / years);
			}
		}
		//old code
		await paFinancialYear.inputTypeDecimal(oEvent);
		await this.tm.getTN("list").resetP();
	}
	public async calculateYears(startDate, endDate) {
		if (!startDate || !endDate) return null;
		let years = endDate.getFullYear() - startDate.getFullYear();
		if (endDate.getMonth() < startDate.getMonth() || (endDate.getMonth() === startDate.getMonth() && endDate.getDate() < startDate.getDate())) {
			years--;
		}
		return years > 0 ? years : 1; // Avoid divide by 0 or negative years
	}

	public async calculateTotalCost(ctc, bonus, retention) {
		return (parseFloat(ctc) + parseFloat(bonus) + parseFloat(retention)).toFixed(2);
	}

	public async reCalculateSalaryData(salaryHDR, salaryItm, listData) {
		const empID = listData[0]?.employee_id;
		if (!empID) {
			throw new Error("Missing employee ID");
		}
		const employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': listData[0].employee_id, 'expandAll': "r_emp_history" });
		let employeeHistory = await employeeData[0].r_emp_history;

		let maventicExperience = await paFinancialYear.experienceInYear(new Date(), employeeData[0].joining_date);
		let previousYearExperience = 0;
		for (let k = 0; k < employeeHistory.length; k++) {
			let prevExp = await paFinancialYear.experienceInYear(employeeHistory[k].to_date, employeeHistory[k].from_date);
			previousYearExperience += parseFloat(prevExp);
		}
		// Round to 1 decimal place
		previousYearExperience = parseFloat(previousYearExperience.toFixed(1));
		let total_experience = await paFinancialYear.sumOfYear(previousYearExperience, maventicExperience);

		const otherTN = await this.tm.getTN("other").getData();
		const benefitResults: { [key: string]: boolean } = {};
		const benefitValues: { [key: string]: any } = {};
		const basic = 0.4 * (salaryHDR?.ctc || 0);
		salaryHDR.basic = basic;
		const allRules = <KloEntitySet<d_o2c_emp_ben_elig_config>>await this.transaction.getExecutedQuery('d_o2c_emp_ben_elig_config', { loadAll: true });
		const benefitConfigs = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.transaction.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true });

		for (const rule of allRules) {
			const benefitId = rule.benefit_id;
			const now = new Date();
			const startDate = new Date(rule.start_date);
			const endDate = new Date(rule.end_date);

			// STEP 1: Validate Date Range
			if (now < startDate || now > endDate) {
				benefitResults[benefitId] = false;
				continue;
			}

			// STEP 2: Eligibility Check
			let eligible = false;
			if (rule.eligible === 'All') {
				eligible = true;
			} else {
				let value: any;
				switch (rule.eligible) {
					case 'Experience':
						value = total_experience;
						break;
					case 'Company Experience':
						value = maventicExperience;
						break;
					case 'Designation':
						value = listData[0]?.to_be_designation;
						break;
					case 'Work from':
						value = "Office";
						break;
					default:
						benefitResults[benefitId] = false;
						continue;
				}

				eligible = await this.evaluateCondition(value, rule.operator, rule.min_value, rule.max_value, rule.text_value);
			}

			benefitResults[benefitId] = eligible;
			if (!eligible) continue;

			// STEP 3: Get Active Benefit Config
			const config = benefitConfigs.find(cfg =>
				cfg.benefit === benefitId &&
				cfg.company_code === otherTN.companyCode &&
				// cfg.business_area === otherTN.businessArea &&
				cfg.business_area === listData[0].business_area &&
				cfg.profit_center === otherTN.profitCenter
			);

			if (!config) continue;

			// STEP 4: Calculate Benefit Value
			let calculatedValue: any = null;

			try {
				switch (config.base) {
					case 'Cal':
						let gross = 0;
						calculatedValue = this.calculateBenefit(config.benefit_name, basic, gross);
						// gross = (salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0)-(salaryHDR?.ctc || 0);
						// Gross = CTC - Performance Bonus -Medical Insurance - Food - Employer PF - Employer Gratuity - Employer Gratuity Arrears - Employer ESI

						break;
					case 'Fixed':
						calculatedValue = config.benefit_value;
						break;
					case 'Manual':
					default:
						calculatedValue = null;
				}
			} catch (error) {
				console.error(`Failed to calculate benefit ${benefitId}:`, error);
				calculatedValue = null;
			}

			// STEP 5: Store Value
			benefitValues[benefitId] = calculatedValue;
			// ✅ Create or update item in r_salary_hdr_items
			if (calculatedValue != null && benefitId != "B11" && benefitId != "B12" && benefitId != "B13") {
				await salaryHDR?.r_salary_hdr_items.newEntityP(0, {
					benefit_id: benefitId,
					planned_amount: calculatedValue,
					benefit_name: config.benefit_name
				});
			}
		}

		return { benefitResults, benefitValues };
	}
	public calculateBenefit(benefitName: string, basic: number, gross: number): number {
		const cappedBasic = Math.min(basic, 180000);
		switch (benefitName) {
			case "B1":
				return 0.4 * basic;
			case "B4":
				return gross - basic - 20000 - 15000 - 12500; // Replace hardcoded values as needed
			case "B5":
			case "B15":
				return cappedBasic * 0.12;
			case "B6":
				return cappedBasic * 0.01;
			case "B7":
				return gross <= 252000 ? gross * 0.0325 : 0;
			case "B14":
				return gross <= 252000 ? gross * 0.0075 : 0;
			case "B10":
				return (basic / 26) * 15;
			default:
				return 0;
		}
	}
	public async evaluateCondition(value, operator, min, max, desigValue) {
		switch (operator) {
			case '>':
				return value > min;
			case '>=':
				return value >= min;
			case '<':
				return value < max;
			case '<=':
				return value <= max;
			case '=':
			case '==':
				return value == desigValue;
			case '!=':
				return value !== min;
			case 'between':
				return value >= min && value <= max;
			case 'not between':
				return value < min || value > max;
			default:
				console.warn(`Unknown operator: ${operator}`);
				return false;
		}
	}
	public async onChangeBAPC() {
		await this.lineManagerData();
	}

	public async onBudgetValidation(checkProposedData) {
		/*Budget validation--->While submitting the employee data (clicked checkbox), 
		proposed total cost -current(salary) total cost= Increased total cost, the Increased total cost <= untilised budget of line manager(search lmi)
		and untilised budget of line manager(search lmi)=untilised budget of line manager(search lmi)-Increased total cost*/
		let listData = await this.tm.getTN("list").getData();
		let checkSalaryData = listData.find((item) => item.hdr_pa_req_id == checkProposedData.hdr_pa_req_id && item.stage == "Current")
		let searchData = await this.tm.getTN("other").getData();
		let lmiBudget = await this.transaction.getExecutedQuery("d_o2c_pa_cycle_id_lm_budget", { loadAll: true, 'pa_cycle_id': checkProposedData.pa_cycle_id, 'line_manager_id': searchData.loginUser });
		let increasedTotalCost = parseFloat(checkProposedData.total_cost - (checkSalaryData.total_cost ? checkSalaryData.total_cost : 0));
		if (increasedTotalCost <= lmiBudget[0].unulilised_budget) {
			lmiBudget[0].unulilised_budget = parseFloat(lmiBudget[0].unulilised_budget - increasedTotalCost).toFixed(2);
			return 1;
		}
		else {
			return 0;
		}
	}
	public async selectBox(oEvent: sap.ui.base.Event){
		const oCheckBox = oEvent.getSource();

		// Get whether the checkbox is selected
		const bSelected = oCheckBox.getSelected();
		let listData = await this.tm.getTN("list").getData();
		listData.map((e)=>e.check_box=bSelected);
		this.tm.getTN("list").refresh(true);
	}

	public async hideData(oEvent: sap.ui.base.Event){
		const oCheckBox = oEvent.getSource();
		// Get whether the checkbox is selected
		const bSelected = oCheckBox.getState();
		this.tm.getTN("other").setProperty('isHidden',bSelected);
	}
}

//24 Oct 25 10AM
