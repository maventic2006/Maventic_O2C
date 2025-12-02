import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloEntitySet } from 'kloBo_7-2-126/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_emp_pa_plan_apprvl_flw } from 'o2c_v2/entity_gen/d_o2c_emp_pa_plan_apprvl_flw';
import { d_o2c_employee_benefitconfig } from 'o2c_v2/entity_gen/d_o2c_employee_benefitconfig';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_pa_ind_employe")
export default class p_o2c_pa_ind_employe extends KloController {
	public employeeData = [];
	public loginID;
	public roleID;


	/*public async onPageModelReady() {
		//This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
		  //This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/

	// public async onPageEnter() {

	// 	let busyDialog = new sap.m.BusyDialog({
	// 		text: "Please Wait, Data is loading.."
	// 	});
	// 	busyDialog.open();
	// 	await this.tm.getTN("search").setProperty('company_code', "MVPL");
	// 	await this.tm.getTN("search").setProperty('business_area', "MVB2");
	// 	await this.tm.getTN("search").setProperty('profit_center', "MPC1");
	// 	await this.tm.getTN("search").setProperty('fyear', "2025-2026")
	// 	await this.tm.getTN("search").executeP();
	// 	busyDialog.close();

	// }
	public async onPageEnter() {
		//access control
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

			let loginUserOrgBArea = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.business_area))).map((businessArea) => ({ key: businessArea }));
			let loginUserOrgPC = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.profit_centre))).map((PC) => ({ key: PC }));

			//Login user Org set in the drop down of search
			this.tm.getTN("other").setProperty('businessAreaList', loginUserOrgBArea);
			this.tm.getTN("other").setProperty('profitCenterList', loginUserOrgPC);
			//Need to change
			await this.getNextFinancialYears("2025-2026");

			//Primary Org of the login user should be set in the search by default
			let primaryOrg = this.employeeData[0].r_employee_org.filter((item) => item.is_primary == true);

			this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
			this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
			this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
			this.tm.getTN("other").setProperty('fyear', new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));

			this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());
			this.tm.getTN("other").setProperty('userLoginID', this.loginID.toUpperCase());
			this.tm.getTN("other").setProperty('role', (await this.transaction.get$Role()).role_id);


			await this.lineManagerData();

			//Function call for mantee of the above company code, business area, PC and Fiscal year
			await this.searchData();
			busyDialog.close();
		}
	}
	public async lineManagerData() {
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
				business_area: businessArea,
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
		await this.tm.getTN("search").setProperty('lmi', searchData.loginUser)
		await this.tm.getTN("search").getData().refreshP();
		await this.tm.getTN("search").executeP();
		await this.tm.getTN("other").setProperty('totalEmployeeCount', (await this.tm.getTN("list").getData().length) / 3);
		//new line
		await this.lineManagerData();
		await this.buttonVisibleBasedOnApprovalMaster();
	}
	public getFinancialYearDates(inputDate: string): { startDate: Date, endDate: Date } {
		// Split the inputDate into start year and end year
		const years = inputDate.split('-');
		const startYear = parseInt(years[0], 10);
		const endYear = parseInt(years[1], 10);

		// Financial year starts on April 1st of the start year and ends on March 31st of the end year
		const financialYearStart = new Date(startYear, 3, 1); // April 1st of start year
		const financialYearEnd = new Date(endYear, 2, 31); // March 31st of end year

		// Return the start and end dates
		return {
			startDate: financialYearStart,
			endDate: financialYearEnd
		};
	}
	public async getNextFinancialYears(currentYear: string) {
		let fyear = [];

		// Extract the start and end years from the given financial year
		const years = currentYear.split('-');
		const baseStartYear = parseInt(years[0]);

		// Get today's date
		const today = new Date();
		const currentMonth = today.getMonth() + 1; // JS months are 0-based

		// Determine current financial year start year based on today's date
		let currentFYStart;
		if (currentMonth >= 4) {
			currentFYStart = today.getFullYear();
		} else {
			currentFYStart = today.getFullYear() - 1;
		}

		// Calculate last year to include (2 years ahead of current financial year)
		const lastYear = currentFYStart + 2;

		// Loop from baseStartYear to lastYear to build the list
		for (let i = baseStartYear; i <= lastYear; i++) {
			const yearString = i + '-' + (i + 1);
			fyear.push({ year: yearString });
		}

		// Set the list in your TM object
		await this.tm.getTN("other").setProperty('fiscal', fyear);
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
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, ["Pending"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					//let checkBoxFlagProposedData = listData.filter((item) => item.hdr_pa_req_id == checkBoxFlag[i].hdr_pa_req_id && item.stage == "Proposed");
					checkBoxFlag[i].s_status = "Save As Draft";
					checkBoxFlag[i].check_box = false;
				}
				await this.tm.commitP("Save Successfully", "Save Failed", true, true);
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
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, ["Pending", "Save As Draft", "Rework"]);
			if (!oListValue) {
				// All items are Pending, proceed with processing
				for (let i = 0; i < checkBoxFlag.length; i++) {
					let checkBoxFlagProposedData = listData.filter((item) => item.hdr_pa_req_id == checkBoxFlag[i].hdr_pa_req_id && item.stage == "Proposed");
					await this.tm.commitP("Submitted Successfully", "Submitted Failed", true, true);
					//checkBoxFlagProposedData[0].approval_cycle = checkBoxFlagProposedData[0].approval_cycle + 1;
					//new code
					checkBoxFlag[i].approval_cycle = checkBoxFlag[i].approval_cycle + 1;

					//await this.approvalFlowCreation(checkBoxFlagProposedData[0], 1);
					//new code 
					await this.approvalFlowCreation(checkBoxFlag[i], 1);
					checkBoxFlag[i].s_status = "Submitted";
					await this.tm.commitP("Send For Approval", "Send For Approval Failed", true, true);
					checkBoxFlag[i].check_box = false;
				}
			}
		}
	}
	public async approvalFlowCreation(checkBoxFlag, nextLevel) {
		let flowPending;
		let searchData = await this.tm.getTN("other").getData();
		let approvalMaster = await this.transaction.getExecutedQuery('d_o2c_pa_plan_apprver_config', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'approval_level': nextLevel, 'planning_type': "Employee Planning" });
		if (approvalMaster.length) {
			//create Approval Flow
			let approvalFlow = await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: checkBoxFlag.pa_cycle_id, hdr_pa_req_id: checkBoxFlag.hdr_pa_req_id, s_status: "Pending", approval_cycle: checkBoxFlag.approval_cycle, approval_level: nextLevel });
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
			await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: checkBoxFlag.pa_cycle_id, hdr_pa_req_id: checkBoxFlag.hdr_pa_req_id, s_status: "Pending", approval_cycle: checkBoxFlag.approval_cycle, approval_control: "Z", pending_with_id: checkBoxFlag.line_manager });
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
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, ["Submitted"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: checkBoxFlag[i].pa_cycle_id, hdr_pa_req_id: checkBoxFlag[i].hdr_pa_req_id, approval_cycle: checkBoxFlag[i].approval_cycle, s_status: "Pending" });
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
					await this.tm.commitP("Approved Successfully", "Approved Failed", true, true);
					checkBoxFlag[i].check_box = false;
				}
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
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, ["Submitted"]);
			if (!oListValue) {
				for (let i = 0; i < checkBoxFlag.length; i++) {
					let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: checkBoxFlag.pa_cycle_id, hdr_pa_req_id: checkBoxFlag[i].hdr_pa_req_id, approval_cycle: checkBoxFlag[i].approval_cycle, s_status: "Pending" });
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

	// public async onDetailRework(oEvent, param) {

	// 	let listData = await this.tm.getTN("detail").getData();

	// 	let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

	// 	if (currentApprovalFlow.length) {

	// 		if (currentApprovalFlow[0].approval_control == "X") {
	// 			if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase()) {
	// 				if (param.type == "Rework") {
	// 					currentApprovalFlow[0].s_status = "Rework";

	// 				} else if (param.type == "Hold") {
	// 					currentApprovalFlow[0].s_status = "Hold";

	// 				}

	// 			}
	// 		}
	// 		else if (currentApprovalFlow[0].approval_control == "Y") {
	// 			if (currentApprovalFlow[0].pending_with_role == this.roleID) {

	// 				if (param.type == "Rework") {
	// 					currentApprovalFlow[0].s_status = "Rework";

	// 				} else if (param.type == "Hold") {
	// 					currentApprovalFlow[0].s_status = "Hold";

	// 				}
	// 			}

	// 		}
	// 		else {
	// 			if ((currentApprovalFlow[0].pending_with_id).toUpperCase() == this.loginID.toUpperCase())
	// 				if (param.type == "Rework") {
	// 					currentApprovalFlow[0].s_status = "Rework";

	// 				} else if (param.type == "Hold") {
	// 					currentApprovalFlow[0].s_status = "Hold";

	// 				}
	// 		}

	// 	}
	// 	if (param.type == "Return") {
	// 		listData.s_status = "Return Back";

	// 	} else if (param.type == "Hold") {
	// 		listData.s_status = "Hold";

	// 	}
	// 	// listData.refreshP();
	// 	await this.tm.commitP("Rework Required", "Rework Required Failed", true, true);

	// }



	// Accept 
	public async onDetailRework() {

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			if (currentApprovalFlow[0].pending_with_role == this.roleID) {
				currentApprovalFlow[0].s_status = "Rework";
			}

		}
		listData.s_status = "Rework";

		await this.tm.commitP("Rework Required", "Rework Required Failed", true, true);
		// listData.refreshP();

	}

	// public async onDetailHold() {
	// 	let searchData = await this.tm.getTN("other").getData();
	// 	let listData = await this.tm.getTN("detail").getData();

	// 	let currentApprovalFlow = <KloEntitySet<d_o2c_emp_pa_plan_apprvl_flw>>await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

	// 	if (currentApprovalFlow.length) {

	// 		currentApprovalFlow[0].s_status = "Hold";
	// 		currentApprovalFlow[0].action_by_id = this.loginID;
	// 	}

	// 	listData.s_status = "Hold";
	// 	await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, s_status: "Pending", approval_cycle: listData.approval_cycle, pending_with_role: "TEAM_HEAD", approval_control: "Y" });
	// 	await this.tm.commitP("On Hold", "On Hold Failed", true, true);
	// 	// listData.refreshP();

	// }

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
		const currentApprovalFlow = <KloEntitySet<d_o2c_emp_pa_plan_apprvl_flw>>
			await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', {
				loadAll: true,
				pa_cycle_id: listData.pa_cycle_id,
				hdr_pa_req_id: listData.hdr_pa_req_id,
				approval_cycle: listData.approval_cycle,
				s_status: "Pending"
			});
	
		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Hold";
			currentApprovalFlow[0].action_by_id = this.loginID;
		}
	}
	
	public async createFlow_TEAM_HEAD_Y(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', {
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			hdr_pa_req_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			pending_with_role: "TEAM_HEAD",
			approval_control: "Y"
		});
	}
	
	public async createFlow_LINE_MANAGER_Z(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', {
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			hdr_pa_req_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			approval_control: "Z",
			pending_with_id: listData.line_manager
		});
	}
	
	public async createFlow_SELF_Z(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', {
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			hdr_pa_req_id: listData.hdr_pa_req_id,
			s_status: "Hold",
			approval_cycle: listData.approval_cycle,
			approval_control: "Z",
			pending_with_id: this.loginID
		});
	}
	
	public async createFlow_FINANCE_Y(listData: any, searchData: any) {
		await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', {
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			pa_cycle_id: listData.pa_cycle_id,
			hdr_pa_req_id: listData.hdr_pa_req_id,
			s_status: "Pending",
			approval_cycle: listData.approval_cycle,
			pending_with_role: "Finance",
			approval_control: "Y"
		});
	}

	public async onDetailAccept() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending", approval_control: "Z" });

		if (currentApprovalFlow.length) {

			if (currentApprovalFlow[0].approval_control == "Z") {
				currentApprovalFlow[0].s_status = "Accepted";
			}
			listData.s_status = "Accepted ";
			// listData.refreshP();


			await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, s_status: "Pending", approval_cycle: listData.approval_cycle, pending_with_role: "Finance", approval_control: "Y" });

			await this.tm.commitP("Accepted", "Failed", true, true);
		}
	}


	public async onDetailReview() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Review";
			listData.s_status = "Review ";
			// listData.refreshP();
			await this.transaction.createEntityP('d_o2c_emp_pa_plan_apprvl_flw', { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, s_status: "Pending", approval_cycle: listData.approval_cycle, pending_with_role: "TEAM_HEAD", approval_control: "Y" });

			await this.tm.commitP("Reviewed Required", "Review Failed", true, true);
		}
	}

	public async onDetailReviewDecline() {
		let searchData = await this.tm.getTN("other").getData();

		let listData = await this.tm.getTN("detail").getData();

		let currentApprovalFlow = await this.transaction.getExecutedQuery('d_o2c_emp_pa_plan_apprvl_flw', { loadAll: true, pa_cycle_id: listData.pa_cycle_id, hdr_pa_req_id: listData.hdr_pa_req_id, approval_cycle: listData.approval_cycle, s_status: "Pending" });

		if (currentApprovalFlow.length) {
			currentApprovalFlow[0].s_status = "Review declined";
			listData.s_status = "Review declined ";
			// listData.refreshP();
			await this.tm.commitP("Review Declined", "Failed To Decline", true, true);
		}
	}

	public async navToFeedback(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);

		let selectedFiscalYear = await this.tm.getTN("other").getData().fyear;
		let inputYear = await this.getFinancialYearDates(selectedFiscalYear);
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


		let pds = await this.transaction.getExecutedQuery('q_pa_emp_pd_calculate', { loadAll: true, 'employee_id': listData[selectedIndex].employee_id, f_start_date: selectedFromDate.getTime(), f_end_date: selectedToDate.getTime() });


		listData[selectedIndex]["pds"] = parseFloat(pds[0]?.hours_worked) / 8 || 0


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
				let projectDuration = await this.experienceInYear(projectList[i].task_end_date, projectList[i].task_start_date);
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
	}
	public async onCreateFeedback() {
		await this.tm.getTN("employee_feedback_list").createEntityP({ s_object_type: -1, 'pa_cycle_id': await this.tm.getTN("detail").getData().pa_cycle_id }, "Creation Successful", "Creation Failed", null, "First", true, true);

	}
	public experienceInYear(fromDate, toDate) {
		// Calculate total difference in months
		let totalMonths = (fromDate.getFullYear() - toDate.getFullYear()) * 12;
		totalMonths += fromDate.getMonth() - toDate.getMonth();

		// Adjust for day difference
		if (fromDate.getDate() < toDate.getDate()) {
			totalMonths -= 1;
		}
		// Convert months to years with decimal
		const yearIndecimal = (totalMonths / 12).toFixed(1); // keep one decimal place
		return yearIndecimal;
	}
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
			let oListValue = await this.onButtonClickPopUp(checkBoxFlag, ["Accepted"]);
			if (!oListValue) {
				let allBenefit = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.transaction.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true });
				for (let i = 0; i < checkBoxFlag.length; i++) {
					//need to change the below line
					let checkBoxFlagProposedData = listData.filter((item) => item.hdr_pa_req_id == checkBoxFlag[i].hdr_pa_req_id && item.stage == "Proposed");
					checkBoxFlagProposedData[0].s_status = "Confirmed";
					// checkBoxFlagProposedData[0].refreshP();
					//salary hdr to salary log
					await this.createSalaryLog(checkBoxFlagProposedData[0].employee_id);
					//create new employee salary hdr from PA
					let salaryHDR = await this.transaction.createEntityP('d_o2c_employee_salary_hdr', { 'company_code': checkBoxFlagProposedData[0].company_code, 'business_area': checkBoxFlagProposedData[0].business_area, 'profit_center': checkBoxFlagProposedData[0].profit_center, 'employee_id': checkBoxFlagProposedData[0].employee_id, 'from_date': checkBoxFlagProposedData[0].pa_effective_from_date, 'to_date': checkBoxFlagProposedData[0].pa_effective_to_date/*, 'currency':checkBoxFlagProposedData[0].*/, 'total_cost': checkBoxFlagProposedData[0].total_cost, 'fixed': checkBoxFlagProposedData[0].fixed, 'ctc': checkBoxFlagProposedData[0].ctc/*, 'gross_pay':checkBoxFlagProposedData[0]., 'basic':checkBoxFlagProposedData[0]./*, 'basic_perc', 'total_cost_perc', 'net_take_home_annually', 'fixed_hike_perc'*/ });
					let benefitToBeRequired = allBenefit.filter((item) => item.company_code == checkBoxFlagProposedData[0].company_code && item.business_area == checkBoxFlagProposedData[0].business_area && item.profit_center == checkBoxFlagProposedData[0].profit_center);
					// Define benefit mappings
					let benefitMap = [
						{ name: "Performance Bonus", amount: checkBoxFlagProposedData[0].performance_bonus },
						{ name: "Retention Bonus", amount: checkBoxFlagProposedData[0].retention_bonus },
						{ name: "Company Bonus", amount: checkBoxFlagProposedData[0].company_bonus }
					];

					// Loop through each bonus type and process if the benefit exists
					for (let benefit of benefitMap) {
						let matchedBenefit = benefitToBeRequired.find(item => item.benefit_name === benefit.name);
						if (matchedBenefit) {
							await salaryHDR.r_salary_hdr_items.newEntityP(0, {
								benefit_id: matchedBenefit.benefit_id,
								planned_amount: benefit.amount
							});
						}
					}
				}
				await this.tm.commitP("Confirmed Successfully", "Confirmed Failed", true, true);
			}
		}
	}
	public async createSalaryLog(employeeID) {
		let empSalaryDataHDR = await this.transaction.getExecutedQuery('q_emp_salary_data_1', { loadAll: true, employee_id: employeeID, expandAll: 'r_salary_hdr_items' });
		let salaryHDRLog = await this.transaction.createEntityP('d_o2c_emp_salary_hdr_log', empSalaryDataHDR[0]);
		for (let i = 0; i < empSalaryDataHDR[0].r_salary_hdr_items.length; i++)
			await salaryHDRLog.r_salary_hdr_item_log.newEntityP(0, empSalaryDataHDR[0].r_salary_hdr_items[i]);
		await empSalaryDataHDR[0].deleteP();
	}
	// public async buttonFormatter(path) {
	// 	//let listData = await this.tm.getTN("list").getData();
	// 	let selectedLmi = await this.tm.getTN("other").getData().loginUser;
	// 	let loginUserLMData = path.filter((item) => item.line_manager == selectedLmi && item.s_status == "Pending")
	// 	let editButton = loginUserLMData.length ? (await this.getMode() == "DISPLAY" && loginUserLMData.length > 1) : false;
	// 	return editButton;
	// }
	public async buttonVisibleBasedOnApprovalMaster() {
		let loginUserID = (await this.transaction.get$User()).login_id
		let loginRoleID = (await this.transaction.get$Role()).role_id;
		let searchData = await this.tm.getTN("other").getData()
		let approvalMasterData = await this.transaction.getExecutedQuery('d_o2c_pa_plan_apprver_config', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'planning_type': "Employee Planning" });
		let filterData = approvalMasterData.filter((e) => e.employee_id.toLowerCase() == loginUserID.toLowerCase() || e.employee_role == loginRoleID)
		await this.tm.getTN("other").setProperty('approvalRequired', (filterData.length > 0))
	}
	public async onAmtChange(oEvent) {
		await paFinancialYear.inputTypeDecimal(oEvent);
	}
	public async onButtonClickPopUp(checkBoxFlag, allowedStatuses) {
		// Block if any item is NOT in "Pending" status
		const allAllowed = checkBoxFlag.every(item => allowedStatuses.includes(item.s_status));
		if (!allAllowed) {
			sap.m.MessageBox.error(`All selected items must be in :${allowedStatuses.join(", ")}`, {
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
}


//11/5/25 AF 12:14AM
//Complete Approval Flow
//13/5/25 AF 6PM
//15/5/25 AF 11:20PM
//20/5/2025 AF 12:12AM

// MS 10-05-2025 00:43
//AF 20-05-2025 12:54 AM
//AF 20-05-2025 8:42PM
//confirm button pending

// MS 22-05-2025 18:22
//AF 23-5-25 2:37AM
//AF 23/5/2025 5:24PM
//29MAy 12:53PM