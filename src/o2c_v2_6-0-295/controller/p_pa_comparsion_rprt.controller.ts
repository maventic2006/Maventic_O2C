import type { KloEntitySet } from 'kloBo/KloEntitySet';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_emp_general_config } from 'o2c_v2/entity_gen/d_o2c_emp_general_config';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_pa_cat_plan_apprl_flw } from 'o2c_v2/entity_gen/d_o2c_pa_cat_plan_apprl_flw';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_comparsion_rprt")
export default class p_pa_comparsion_rprt extends KloController {
	public employeeData = [];
	public loginID;
	public roleID
	public categoryData = []
	public lastYearTotalCostValue = 0;
	public currentYearTotal;
	public totalSum = 0

	public _resolveLoginPromise;
	public code;
	public async onPageEnter() {
		const waitForLogin = new Promise<void>((resolve) => {
            this._resolveLoginPromise = resolve;
        });
        await this.openDialog("p_pa_dialog_box");
        // Wait here until login completes and dialog is closed
        await waitForLogin;
        await this.onFunc(); // Only runs after successful login + dialog closed
		
	}
	public async onFunc() {
		// this is temporary 
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });

		if (parseInt(general_config[0].high_value) == 1) { // temp check

			let busyDialog = new sap.m.BusyDialog().setText("Please Wait, Data is loading...").open();
			await this.tm.getTN("other").setData({}); // other is use for search
			await this.tm.getTN("remark").setData({}); // remark is use for remark only

			this.loginID = ((await this.transaction.get$User()).login_id).toUpperCase();
			this.roleID = (await this.transaction.get$Role()).role_id;

			let loginUserEmpData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, employee_id: this.loginID, expandAll: 'r_employee_org' }); // partial select should be used
			//let loginUserEmpData = this.employeeData.filter((item) => item.employee_id.toLowerCase() == this.loginID.toLowerCase());

			// let loginUserOrgBArea = Array.from(new Set(loginUserEmpData[0].r_employee_org.map((item) => item.business_area))).map((businessArea) => ({ key: businessArea })); // need to be check
			// let loginUserOrgPC = Array.from(new Set(loginUserEmpData[0].r_employee_org.map((item) => item.profit_centre))).map((PC) => ({ key: PC })); // map need to be check

			// //Login user Org set in the drop down of search
			// // need to use the query for the distinct ba
			// this.tm.getTN("other").setProperty('businessAreaList', loginUserOrgBArea);
			// this.tm.getTN("other").setProperty('profitCenterList', loginUserOrgPC);
			const employeeOrgResult = await paFinancialYear.employeeUniqueOrg(this.transaction, loginUserEmpData[0].r_employee_org);

			//Login user Org set in the drop down of search
			this.tm.getTN("other").setProperty('companyList', employeeOrgResult.loginUserOrgCompany);
			// Add "All" option to businessAreaList
			let businessAreaListWithAll = [{ key: "ALL", value: "All" }, ...employeeOrgResult.loginUserOrgBArea];
			this.tm.getTN("other").setProperty('businessAreaList', businessAreaListWithAll);
			const workMode = await this.tm.getTN("work").getData();
			workMode.push({ work_mode_id: "ALL", work_mode: "All" })
			this.tm.getTN("other").setProperty('profitCenterList', employeeOrgResult.loginUserOrgPC);


			//Primary Org of the login user should be set in the search by default
			let primaryOrg = loginUserEmpData[0].r_employee_org.filter((item) => item.is_primary == true);

			this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
			// this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
			this.tm.getTN("other").setProperty('businessArea', "ALL");
			this.tm.getTN("other").setProperty('work_mode_id', "ALL");
			this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);

			let general_config_pa = <KloEntitySet<d_o2c_emp_general_config>>await this.transaction.getExecutedQuery("d_o2c_emp_general_config", { company_code: primaryOrg[0].company_code, parameter_name: "FY", module_type: "PA", loadAll: true });
			//await this.getNextFinancialYears(general_config_pa[0].parameter_values,general_config_pa[0].parameter_value2); 
			const lastExclusiveWorkingDate = await paFinancialYear.getNextFinancialYears(general_config_pa[0].parameter_values, general_config_pa[0].parameter_value2);

			this.tm.getTN("other").setProperty('fiscal', lastExclusiveWorkingDate);
			this.tm.getTN("other").setProperty('fyear', new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));
			this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());
			// let a = ["Pending", "Approved By Me", "Overall Approved", "Rework"];
			// let b = [];
			// for (let i = 0; i < a.length; i++) {
			// 	b.push({ key: a[i] });
			// }
			// this.tm.getTN("other").setProperty('statusList', b);
			// this.tm.getTN("other").setProperty('status', "Pending");
			this.tm.getTN("other").setProperty('no_of_employee',true);
			await this.onSearchChange();

			busyDialog.close();
		} // temp check
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

	/*------------------------------------- MONTH WISE DATA -------------------------------------------*/
	public async setMonthWiseEmpCount() {
		const empPlanning = (await this.tm.getTN("pa_cycle_list").getData())[0]?.r_pa_emp_planning_hdr || [];
		const months = await this.getFinancialYearMonths();
		// Count employees per month using a map
		const monthCounts: Record<string, number> = {};
		for (const item of empPlanning) {
			if (monthCounts[item.pa_month]) {
				monthCounts[item.pa_month]++;
			} else {
				monthCounts[item.pa_month] = 1;
			}
		}

		// Build monthdata with all months initialized
		const monthdata: Record<string, number> = {};
		for (const month of months) {
			monthdata[month] = monthCounts[month] || 0;
		}
		await this.tm.getTN("monthWiseData").setData({ monthdata });
	}

	public async getFinancialYearMonths() {
		return [
			"April", "May", "June", "July", "August", "September",
			"October", "November", "December", "January", "February", "March"
		];
	}
	/*-------------------------------------------------------------------------------------------------*/
	/*---------------------------------------- Comparsion Report for Fiscal Year-------------------------------------------------*/

	public async setComparsionReport() {

		// type of variole need to be declare 	
		const otherTN = this.tm.getTN("other");
		const searchData = await otherTN.getData();

		const [startYearStr, endYearStr] = searchData.fyear.split("-");
		const prevFyear = `${parseInt(startYearStr) - 1}-${parseInt(endYearStr) - 1}`;

		const commonQueryParams = {
			loadAll: true,
			company_code: searchData.companyCode,
			business_area: searchData.businessArea,
			profit_center: searchData.profitCenter,
			totp: this.code
		};

		let [totalDifferenceAmt, changePercent, currentYearTotal, requestedBudget, approvedBudget] = await this.changePercentage(commonQueryParams, prevFyear)
		this.totalSum = currentYearTotal;
		otherTN.setProperty("totalDifferenceAmount", totalDifferenceAmt),
			otherTN.setProperty("changePercent", changePercent)
		otherTN.setProperty("currentyeartotal", currentYearTotal)
		otherTN.setProperty("requestedBudget", requestedBudget)
		otherTN.setProperty("approvedBudget", approvedBudget)
	}

	// change percentage 
	public async changePercentage(commonQueryParams, prevFyear) {
		const otherTN = this.tm.getTN("other");
		const searchData = await otherTN.getData();
		const PACycle = await this.transaction.getExecutedQuery("q_o2c_employee_pa_cycle", { ...commonQueryParams/*, fyear: prevFyear*/ });
		const currentYearPACycle = PACycle.filter((e) => e.fiscal_year == searchData.fyear)
		const prevYearPACycle = PACycle.filter((e) => e.fiscal_year == prevFyear)
		if (prevYearPACycle.length > 0) {
			this.lastYearTotalCostValue = prevYearPACycle[0].r_pa_cycle_catgry.total_cost_value;
		} else {
			try {
				// const allEmpSalaryData = await this.transaction.getExecutedQuery("d_o2c_emp_salary_hdr_log", commonQueryParams);
				const allEmpSalarylogData = await this.transaction.getExecutedQuery("d_o2c_emp_salary_hdr_log", {
					loadAll: true,
					company_code: searchData.companyCode,
					business_area: searchData.businessArea != "ALL" ? searchData.businessArea : '',
					profit_center: searchData.profitCenter,
					fyear: prevFyear
				});
				const allEmpSalaryHdrData = await this.transaction.getExecutedQuery("d_o2c_employee_salary_hdr", {
					loadAll: true,
					company_code: searchData.companyCode,
					business_area: searchData.businessArea != "ALL" ? searchData.businessArea : '',
					profit_center: searchData.profitCenter,
					fyear: prevFyear
				});
				// Merge both datasets into a single array
				const allEmpSalaryData = [...allEmpSalarylogData, ...allEmpSalaryHdrData];
				this.lastYearTotalCostValue = allEmpSalaryData.reduce((sum, item) => {
					return sum + parseFloat(item.total_cost || "0");
				}, 0);
			}
			catch (e) {
				console.log(e);
			}
		}

		this.tm.getTN("other").setProperty("lastYearTotalCostValue", this.lastYearTotalCostValue);
		const totalDifferenceAmt = 0;
		let changePercent = 0, currentYearTotal = 0, requestedBudget = 0, approvedBudget = 0;
		if (currentYearPACycle.length && currentYearPACycle?.[0].r_pa_cycle_catgry.s_status != "New") {
			const paCycleList = await this.tm.getTN("pa_cycle_list").getData();
			this.currentYearTotal = paCycleList[0]?.r_pa_cycle_catgry || {}

			currentYearTotal = parseFloat(this.currentYearTotal.total_cost_value) || 0;
			const lastYearTotal = parseFloat(this.lastYearTotalCostValue) || 0;

			const totalDifferenceAmt = parseFloat((currentYearTotal - lastYearTotal).toFixed(2));
			requestedBudget = parseFloat(this.currentYearTotal.requested_budget) || 0;
			approvedBudget = parseFloat(this.currentYearTotal.approved_budget) || 0;

			// let changePercent: number;
			//

			if (lastYearTotal == 0) {
				changePercent = currentYearTotal === 0 ? 0 : 100;
			} else {
				changePercent = parseFloat(((totalDifferenceAmt / lastYearTotal) * 100).toFixed(2));
			}
		}
		return [totalDifferenceAmt, changePercent, currentYearTotal, requestedBudget, approvedBudget]
	}
	/*-------------------------------------------------------------------------------------------------*/
	/*---------------------------------------- SEARCH -------------------------------------------------*/
	public async onSearchChange() {

		let searchData = await this.tm.getTN("other").getData();

		this.tm.getTN("search").setProperty('company_code', searchData.companyCode);
		this.tm.getTN("search").setProperty('business_area', searchData.businessArea);
		this.tm.getTN("search").setProperty('profit_center', searchData.profitCenter);
		this.tm.getTN("search").setProperty('fyear', searchData.fyear)
		this.tm.getTN("search").setProperty('userrole', this.roleID);
		// if (searchData.status == "Approved By Me") {
		// 	this.tm.getTN("search").setProperty('hdr_status', "New");
		// 	this.tm.getTN("search").setProperty('status_search', "Approved");
		// } else if (searchData.status == "Overall Approved") {
		// 	this.tm.getTN("search").setProperty('hdr_status', "Approved");
		// 	this.tm.getTN("search").setProperty('status_search', "Approved");
		// } else {
		// 	this.tm.getTN("search").setProperty('hdr_status', "New");
		// 	this.tm.getTN("search").setProperty('status_search', "Pending");
		// }
		// TRANSIENT ENTITY SEARCH START
		this.tm.getTN("search_transient").setProperty('company_code', searchData.companyCode);
		this.tm.getTN("search_transient").setProperty('business_area', searchData.businessArea);
		this.tm.getTN("search_transient").setProperty('profit_center', searchData.profitCenter);
		this.tm.getTN("search_transient").setProperty('fyear', searchData.fyear)
		this.tm.getTN("search_transient").setProperty('userrole', this.roleID);
		this.tm.getTN("search_transient").setProperty('work_mode_id', searchData.work_mode_id);
		this.tm.getTN("search_transient").setProperty('no_of_employee', searchData.no_of_employee);
		// let status;
		// if (searchData.status == "Approved By Me") {
		// 	this.tm.getTN("search_transient").setProperty('hdr_status', "New");
		// 	this.tm.getTN("search_transient").setProperty('status_search', "Approved");
		// 	status = "Approved";
		// } else if (searchData.status == "Overall Approved") {
		// 	this.tm.getTN("search_transient").setProperty('hdr_status', "Approved");
		// 	this.tm.getTN("search_transient").setProperty('status_search', "Approved");
		// 	status = "Approved";
		// } else {
		// 	this.tm.getTN("search_transient").setProperty('hdr_status', "New");
		// 	this.tm.getTN("search_transient").setProperty('status_search', "Pending");
		// 	status = "Pending";
		// }

		await this.tm.getTN("search").executeP();
		await this.tm.getTN("search_transient").executeP();

		await this.setComparsionReport();
		await this.setMonthWiseEmpCount();
		await this.tm.getTN('list_transient').setActive(0)

		// let main_list_data = await this.tm.getTN('pa_cycle_list').getData()
		// console.log(main_list_data[0]?.r_pa_cycle_catgry)

		let transient_list_data = await this.tm.getTN('list_transient').getData();

		if (transient_list_data.length) {
			let approver = await this.getApproverByStatus("Pending", transient_list_data, null);

			if (!approver?.length) {
				approver = await this.getApproverByStatus("Approved", transient_list_data, this.loginID);
			}

			if (!approver?.length) {
				approver = await this.getApproverByStatus("Rework", transient_list_data, null);
			}

			if (approver?.length) {
				// Set approver properties when found
				const { approval_level, s_status, pending_with_id } = approver[0];
				this.setApproverProperties(approval_level, s_status, pending_with_id, false);
			} else {
				// No approver found after all checks
				this.setApproverProperties(null, null, null, true);
			}
			console.log(approver)
			this.tm.getTN("other").setProperty('role_id', this.roleID);

		} else {
			// No transient_list_data
			this.setApproverProperties(null, null, null, true);
		}


		await this.tm.getTN('detail_transient').setActive(0)
		await this.tm.getTN('pa_cycle_list').setActive(0)
	}

	private setApproverProperties(level: any, status: any, id: any, btnVisible: boolean) {
		const node = this.tm.getTN("other");
		node.setProperty('approver_level', level);
		node.setProperty('Approver_status', status);
		node.setProperty('Approver_id', id);
		node.setProperty('btn_visible', btnVisible);
	}


	public async getApproverByStatus(status: string, transient_list_data, action_by): Promise<KloEntitySet<q_pa_current_approver>> {
		return <KloEntitySet<q_pa_current_approver>>await this.transaction.getExecutedQuery('q_pa_current_approver', {
			pa_cycle_id: transient_list_data[0]?.pa_cycle_id,
			is_active: true,
			roleid: this.roleID,
			userid: this.loginID,
			action_by_id: action_by,
			sts: status,
			loadAll: true,
			skipMap: true
		});
	}


	/*-------------------------------------------------------------------------------------------------*/
	public async openDialogFn(oEvent, param) {
		await this.openDialog(param.dialog_pa);

	}
	/*-------------------------------------------------------------------------------------------------*/
	/*---------------------------------- APPROVAL FLOW CODE------------------------------------------- */

	// public async approverName(id) {
	// 	let approver = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': id, partialSelect: ['first_name', 'last_name'], loadAll: true })
	// 	if (approver.length > 0 && id) { return approver[0].full_name };
	// 	return "___"
	// }

	public async flowControl(oEvent, param) {

		// this.getMessagebox need to use
		sap.m.MessageBox.confirm(`Do you want to the ${param.status} `, {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {

				if (oAction == "OK") {

					let busyDialog = new sap.m.BusyDialog().setText("Approving...").open();
					const remark = await this.tm.getTN("remark").getData()
					if (remark.comment == null || remark.comment == undefined || remark.comment == "") {
						busyDialog.close();
						sap.m.MessageBox.warning(`Please Enter Remark `, {
							title: "Remark",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: null,
						}
						);
						this.tm.getTN("remark").setProperty("rem_err", "Error");
						return;

					}
					// else{
					// 	//Albia Add this line
					// 	this.tm.getTN("remark").setProperty("rem_err", "Success");
					// }
					const paCycleData = await this.tm.getTN('pa_cycle_list').getData()[0];//
					// Fetch the current pending approver record for the cycle
					const approver = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Category Planning", pa_cycle_id: paCycleData.pa_cycle_id, s_status: "Pending", loadAll: true, skipMap: true });
					// Get all approval configuration levels for the current cycle and context
					const approvalMaster = await this.transaction.getExecutedQuery('d_o2c_pa_plan_apprver_config', { company_code: paCycleData.company_code, business_area: paCycleData.business_area != "ALL" ? paCycleData.business_area : '', profit_center: paCycleData.profit_center, planning_type: "Category planning", loadAll: true });
					// Exit if no approvers or approval configuration found

					if (approvalMaster.length == 0) {

						sap.m.MessageBox.error(`Approver config not maintained check with ADMIN`, {
							title: "Success",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: null,
						}
						);
						return;
					}
					if (!approver?.length || !approvalMaster?.length) return;
					// Find the next approval level configuration

					if (param.status == "Submit") {
						paCycleData.r_pa_cycle_catgry.action_status = "Submitted";
						//Put the requested budgeted
						this.tm.getTN("other").setProperty("requestedBudget", this.tm.getTN("other").getData().currentyeartotal);
						paCycleData.r_pa_cycle_catgry.requested_budget = parseFloat(this.tm.getTN("other").getData().requestedBudget).toFixed(2);
					} else if (param.status == "Approve") {
						paCycleData.r_pa_cycle_catgry.action_status = "In Process"
					} else {
						sap.m.MessageBox.error(`Status does not matches please check approval flow.`, {
							title: "Success",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: null,
						}
						);
						return;
					}

					const nextLevel = parseInt(approver[0].approval_level) + 1;

					const approvalMain = approvalMaster.find(item => parseInt(item.approval_level) === nextLevel);
					// Helper function to update current approver as approved
					const setApproverApproved = async () => {

						// let approver_name = await this.approverName(this.loginID);
						approver[0].s_status = "Approved";
						approver[0].actioned_by_id = this.loginID;
						approver[0].remarks = remark.comment;
					};

					if (approvalMain) {
						busyDialog.setText("Sending For Next Approval...")
						// Create a base entity for the next approval level
						const baseEntity = {
							approval_type: "Category Planning",
							company_code: approvalMain.company_code,
							business_area: approvalMain.business_area,
							profit_center: approvalMain.profit_center,
							pa_cycle_id: paCycleData.pa_cycle_id,
							// category_pl_req_id: paCycleData.r_pa_cycle_catgry.category_pl_req_id,
							type_key_id: paCycleData.r_pa_cycle_catgry.category_pl_req_id,
							approval_control: approvalMain.approval_control,
							approval_level: nextLevel,
							apr_cycle: approver[0].apr_cycle,
							is_active: true,
							s_status: "Pending",
						};

						setApproverApproved(); // Mark current level as approved

						if (approvalMain.approval_control === "Y" || approvalMain.approval_control === "Z") {
							// Forward approval to next configured role (either "Y" or "X")
							await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
								...baseEntity,
								pending_with_role: approvalMain.employee_role,
								pending_with_id: approvalMain.employee_id
							});
						} else if (approvalMain.approval_control === "X") {
							// Fetch line manager info if approval is set to go to Line Manager	
							const lineManagerData = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { employee_id: this.loginID, loadAll: true }); // partial select need to be use
							if (!lineManagerData?.length) return;
							// Create next approval step assigned to Line Manager
							await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
								...baseEntity,
								pending_with_role: "Line Manager",
								pending_with_id: lineManagerData[0].line_manager
							});
						}

						paCycleData.r_pa_cycle_catgry.s_status = "Submitted"
						let res = await this.tm.commitP("Save Successfully", "Save Failed", true, true);

						if (res == false) { sap.m.MessageToast.show("Something went wrong. Your changes have been reverted. ", { duration: 5000 }); await this.transaction.rollback(); return; }

						this.tm.getTN("remark").setProperty("rem_err", "Success");
						remark.comment = null
						sap.m.MessageBox.success(`Pa Request Number ${paCycleData.pa_cycle_id} has been Approved and sent for next approval`, {
							title: "Success",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: null,
						}
						);
						await this.onSearchChange()
						busyDialog.close();

					} else {
						// Final approval stage

						setApproverApproved();
						paCycleData.s_status = "Approved";
						paCycleData.r_pa_cycle_catgry.s_status = "Approved";
						paCycleData.r_pa_cycle_catgry.action_status = "Approved";
						//Put the approved budgeted
						this.tm.getTN("other").setProperty("approvedBudget", this.tm.getTN("other").getData().currentyeartotal);
						paCycleData.r_pa_cycle_catgry.approved_budget = parseFloat(this.tm.getTN("other").getData().approvedBudget).toFixed(2);

						let res = await this.tm.commitP("Approved Successfully", "Save Failed", true, true);


						if (res == false) { sap.m.MessageToast.show("Something went wrong. Your changes have been reverted.", { duration: 5000 });; await this.transaction.rollback(); return; }

						this.tm.getTN("remark").setProperty("rem_err", "Success");
						remark.comment = null
						sap.m.MessageBox.success(`Pa Request Number ${paCycleData.pa_cycle_id} has been Approved`, {
							title: "Success",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: null,
						}
						);
						await this.onSearchChange();
						busyDialog.close();
					}
				}
			},
		}
		);
	}
	/*------------------------------------------------------------------------------------------------ */
	/*---------------------------------------- Rework ------------------------------------------------ */
	public async rework() {
		sap.m.MessageBox.confirm(`Do you want to rework this Request `, {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					let busyDialog = new sap.m.BusyDialog().setText("Sending to Rework...").open();
					const remark = await this.tm.getTN("remark").getData()
					const paCycleData = await this.tm.getTN('pa_cycle_list').getData()[0];
					const categoryHdr = paCycleData.r_pa_cycle_catgry;
					categoryHdr.action_status = "Rework"
					categoryHdr.s_status = "Rework"
					let aprFlwData = await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Category Planning", pa_cycle_id: paCycleData.pa_cycle_id, loadAll: true, skipMap: true });
					for (let i = 0; i < aprFlwData.length; i++) {
						aprFlwData[i].is_active = false
					}
					const approver = <KloEntitySet<d_o2c_pa_cat_plan_apprl_flw>>await this.transaction.getExecutedQuery('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Category Planning", pa_cycle_id: paCycleData.pa_cycle_id, s_status: "Pending", loadAll: true, skipMap: true });
					approver[0].s_status = "Rework";
					approver[0].actioned_by_id = this.loginID;
					approver[0].remarks = remark.comment;
					approver[0].is_active = false;
					const baseEntity = {
						approval_type: "Category Planning",
						company_code: approver[0].company_code,
						business_area: approver[0].business_area,
						profit_center: approver[0].profit_center,
						pa_cycle_id: paCycleData.pa_cycle_id,
						//category_pl_req_id: paCycleData.r_pa_cycle_catgry.category_pl_req_id,
						type_key_id: paCycleData.r_pa_cycle_catgry.category_pl_req_id,
						approval_control: "Y",
						approval_level: 0,
						apr_cycle: parseInt(categoryHdr.approval_cycle) + 1,
						is_active: true,
						s_status: "Pending",
					};
					categoryHdr.approval_cycle = parseInt(categoryHdr.approval_cycle) + 1
					await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', {
						...baseEntity,
						pending_with_role: "TEAM_HEAD",
					});

					await this.tm.commitP("Send Back", "Save Failed", false, false)
					sap.m.MessageBox.success(`PA Request Number ${paCycleData.pa_cycle_id} has been sent for rework`, {
						title: "Success",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: null,
					}
					);
					await this.onSearchChange();
					//albia code added
					remark.comment = null;

					busyDialog.close()
				}
			},
		}
		);
	}

	public async onCellValueChange(oEvent, param) {
		let path = this.getPathFromEvent(oEvent);
		let cellValue = oEvent.getParameters().value;
		const transient_data = await this.tm.getTN("list_transient").getData();
		let index = parseInt(path.replace(`/${"list_transient"}/`, ''));
		cellValue = parseFloat(cellValue);
		let dataAtIndex = transient_data[index];
		if (parseFloat(cellValue) < 0 || cellValue == '-' || parseFloat(cellValue) == null) {
			oEvent.getSource().setValue((0).toFixed(2));
			return;
		}
		if (param.type == "fixed") {
			let performanceBonusPercentage = parseFloat(dataAtIndex.performance_bonus_per) / 100;
			let companyBonusPercentage = parseFloat(dataAtIndex.company_bonus_per) / 100;
			let retentionBonusPercentage = parseFloat(dataAtIndex.retention_bonus_per) / 100;
			// Perform calculations only once
			dataAtIndex.performance_bonus = (cellValue * performanceBonusPercentage).toFixed(2);
			dataAtIndex.company_bonus = (cellValue * companyBonusPercentage).toFixed(2);
			dataAtIndex.retention_bonus = (cellValue * retentionBonusPercentage).toFixed(2);
			dataAtIndex.ctc_value = ((cellValue) + parseFloat(dataAtIndex.performance_bonus)).toFixed(2);
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "performance_per") { // performance 
			let performanceBonusPercentage = cellValue / 100;
			dataAtIndex.performance_bonus = (dataAtIndex.fixed_value * performanceBonusPercentage).toFixed(2);
			dataAtIndex.ctc_value = (parseFloat(dataAtIndex.fixed_value) + parseFloat(dataAtIndex.performance_bonus)).toFixed(2);
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "performance_val") { // performance 
			let performanceBonusPercentage = (cellValue / dataAtIndex.fixed_value) * 100
			dataAtIndex.performance_bonus_per = performanceBonusPercentage;
			dataAtIndex.ctc_value = (parseFloat(dataAtIndex.fixed_value) + cellValue).toFixed(2);
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "company_per") { // company
			let companyBonusPercentage = cellValue / 100;
			dataAtIndex.company_bonus = (dataAtIndex.fixed_value * companyBonusPercentage).toFixed(2);
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "company_val") { // company
			let companyBonusPercentage = (cellValue / dataAtIndex.fixed_value) * 100
			dataAtIndex.company_bonus_per = companyBonusPercentage;
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "retention_per") { // retention
			let retentionBonusPercentage = cellValue / 100;
			dataAtIndex.retention_bonus = (dataAtIndex.fixed_value * retentionBonusPercentage).toFixed(2);
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		} else if (param.type == "retention_val") { // retention
			let retentionBonusPercentage = (cellValue / dataAtIndex.fixed_value) * 100
			dataAtIndex.retention_bonus_per = retentionBonusPercentage
			dataAtIndex.max_total_value = (parseFloat(dataAtIndex.ctc_value) + parseFloat(dataAtIndex.company_bonus) + parseFloat(dataAtIndex.retention_bonus)).toFixed(2)
		}

		await this.tm.getTN("list_transient").resetP();

		this.totalSum = 0
		for (let i = 0; i < transient_data.length; i++) {
			this.totalSum = (parseFloat(this.totalSum) + (parseFloat(transient_data[i].no_of_employee) * parseFloat(transient_data[i].max_total_value)));
		}

		// updating current year and change percent value in comparison report
		let currentTotal = parseFloat(this.totalSum) || 0;
		let lastYearTotal = parseFloat(this.lastYearTotalCostValue) || 0;

		const totalDifferenceAmt = parseFloat((currentTotal - lastYearTotal).toFixed(2));
		let changePercent: number;

		if (lastYearTotal === 0) {
			changePercent = currentTotal === 0 ? 0 : 100;
		} else {
			changePercent = parseFloat(((totalDifferenceAmt / lastYearTotal) * 100).toFixed(2));
		}

		this.tm.getTN('other').setProperty("totalDifferenceAmount", totalDifferenceAmt),

			this.tm.getTN('other').setProperty("changePercent", changePercent)

		this.tm.getTN('other').setProperty("currentyeartotal", parseFloat(this.totalSum).toFixed(2))
	}

	public async saveCategoryPlanData() {
		let busyDialog = new sap.m.BusyDialog().setText("Update is in Progress. please wait!...").open();
		let pa_data = await this.tm.getTN("pa_cycle_list").getData()[0]
		let pa_cycleCategory = pa_data.r_pa_cycle_catgry;
		pa_cycleCategory.action_status = "Save As Draft"
		pa_cycleCategory.total_cost_value = parseFloat(this.totalSum).toFixed(2);
		pa_cycleCategory.total_cst_value = parseFloat(this.lastYearTotalCostValue).toFixed(2);


		await this.tm.commitP("Save Successfully", "Failed", true, true)
		this.totalSum = 0
		busyDialog.close()
	}

	public async onChangeComment(oEvent) {
		let cellValue = oEvent.getParameters().value;
		if (cellValue) {
			this.tm.getTN("remark").setProperty("rem_err", "Success");
		} else {
			this.tm.getTN("remark").setProperty("rem_err", "Error");
		}
	}
	public async onDateValidation1(oEvent) {
		await this.validateBonusDate(
			oEvent,
			"per_bns_start_date",
			"Bonus end date should be greater than Bonus start date"
		);
	}

	public async onDateValidation2(oEvent) {
		await this.validateBonusDate(
			oEvent,
			"cmp_bns_start_date",
			"Bonus end date should be greater than Bonus start date"
		);
	}
	public async onDateValidation3(oEvent) {
		await this.validateBonusDate(
			oEvent,
			"ret_bns_start_date",
			"Bonus end date should be greater than Bonus start date"
		);
	}
	public async validateBonusDate(oEvent, startDateField, errorMessage) {
		let path = this.getPathFromEvent(oEvent);
		let cellValue = oEvent.getParameters().value;
		const oData = await this.tm.getTN("list_transient").getData();
		let index = parseInt(path.replace(`/list_transient/`, ''));

		if (oData[index][startDateField] > new Date(cellValue)) {
			oEvent.getSource().setValue("");
			oData[index][startDateField] = "";

			sap.m.MessageBox.error(errorMessage, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null,
			});
		}
	}
	public async noOfEmpButton(oEvent: sap.ui.base.Event){
		const oCheckBox = oEvent.getSource();

		// Get whether the checkbox is selected
		const bSelected = oCheckBox.getState();
		this.tm.getTN("other").setProperty('no_of_employee',bSelected);
	 }
	//-

	/*------------------------------------------------------------------------------------------------ */
}


// mk 11:03 am