import { KloEntitySet } from 'kloBo/KloEntitySet';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_emp_general_config } from 'o2c_v2/entity_gen/d_o2c_emp_general_config';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_budget_allocatn")
export default class p_pa_budget_allocatn extends KloController {
	public code;
	public _resolveLoginPromise;
	public loginID;
	public async onPageEnter() {
		const waitForLogin = new Promise<void>((resolve) => {
			this._resolveLoginPromise = resolve;
		});
		await this.openDialog("pa_dialog");
		// Wait here until login completes and dialog is closed
		await waitForLogin;
		await this.onFunc(); // Only runs after successful login + dialog closed

	}
	public async onEscapeEvent() {
		//Avoid escape button click
	}
	public async onLoginSubmit() {
		this.tm.getTNFromEmbedded("totp_code", "s_pa_login_co_copy01").setProperty('msg', "");
		this.code = this.tm.getTNFromEmbedded("totp_code", "s_pa_login_co_copy01").getData().code;
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
				this.tm.getTNFromEmbedded("totp_code", "s_pa_login_co_copy01").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
				// this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('code',"");
			}
			else {
				this.transaction.$SYSTEM.appVars.totp = this.code;
				await this.closeDialog("pa_dialog");
				// ✅ Resolve the promise to resume `abc()`
				if (this._resolveLoginPromise) {
					this._resolveLoginPromise();
					this._resolveLoginPromise = null;
				}
			}
		}
		else {
			this.tm.getTNFromEmbedded("totp_code", "s_pa_login_co_copy01").setProperty('msg', "Please enter TOTP Code");

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
	public async onFunc() {
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
		if (general_config[0].high_value == 1) {

			let busyDialog = new sap.m.BusyDialog({
				text: "Please Wait, Data is loading.."
			});
			busyDialog.open();
			this.tm.getTN("other").setData({});
			//await this.tm.getTN("button_visiblity").setData({ 'visible': false });
			this.loginID = (await this.transaction.get$User()).login_id;
			//loadAll true is using because first time without loadAll true the data is not coming
			let employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.loginID, expandAll: 'r_employee_org', partialSelected: ['employee_id', 'line_manager'] });

			const employeeOrgResult = await paFinancialYear.employeeUniqueOrg(this.transaction, employeeData[0].r_employee_org);

			//Login user Org set in the drop down of search
			this.tm.getTN("other").setProperty('companyList', employeeOrgResult.loginUserOrgCompany);
			// Add "All" option to businessAreaList
			let businessAreaListWithAll = [{ key: "ALL", value: "All" }, ...employeeOrgResult.loginUserOrgBArea];
			this.tm.getTN("other").setProperty('businessAreaList', businessAreaListWithAll);

			//this.tm.getTN("other").setProperty('businessAreaList', employeeOrgResult.loginUserOrgBArea);
			this.tm.getTN("other").setProperty('profitCenterList', employeeOrgResult.loginUserOrgPC);


			//Primary Org of the login user should be set in the search by default
			let primaryOrg = employeeData[0].r_employee_org.filter((item) => item.is_primary == true);

			let general_config_pa = <KloEntitySet<d_o2c_emp_general_config>>await this.transaction.getExecutedQuery("d_o2c_emp_general_config", { company_code: primaryOrg[0].company_code, parameter_name: "FY", module_type: "PA", loadAll: true });
			const lastExclusiveWorkingDate = await paFinancialYear.getNextFinancialYears(general_config_pa[0].parameter_values, general_config_pa[0].parameter_value2);
			this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
			//this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
			this.tm.getTN("other").setProperty('businessArea', "ALL");
			this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
			await this.tm.getTN("other").setProperty('fiscal', lastExclusiveWorkingDate);
			this.tm.getTN("other").setProperty('fyear', await paFinancialYear.getFinancialYear(new Date()));
			await this.tm.getTN("total_budget").setData({ 'total_budget': "" });
			await this.onSearch()
			busyDialog.close();

		}
	}
	public async onSearch() {
		let searchData = await this.tm.getTN("other").getData();
		let paCycleData = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, fyear: searchData.fyear });
		//if (paCycleData[0]?.r_pa_cycle_catgry?.action_status == "Approved") {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading.."
		});
		busyDialog.open();

		await this.tm.getTN("search_grid").setProperty('company_code', searchData.companyCode);
		await this.tm.getTN("search_grid").setProperty('business_area', searchData.businessArea);
		await this.tm.getTN("search_grid").setProperty('profit_center', searchData.profitCenter);
		await this.tm.getTN("search_grid").setProperty('fiscal', searchData.fyear);
		await this.tm.getTN("search_grid").executeP();
		if (paCycleData.length)
			await this.setHeaderData(paCycleData);
		else
			await this.tm.getTN("total_budget").setData({ 'total_budget': 0 });
		await this.onChangeInHeader();
		busyDialog.close();
		//}
	}
	public async setHeaderData(paCycleData) {
		let searchData = await this.tm.getTN("other").getData();
		let loginUserData = await this.tm.getTN("list_grid").getData().filter((item) => item.line_manager_id.toLowerCase() == this.loginID.toLowerCase());
		if ((await this.transaction.get$Role()).role_id == "TEAM_HEAD") {
			let compOrgPC = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { loadAll: true, profit_center: searchData.profitCenter });
			if (compOrgPC?.[0].team_head.toLowerCase() == this.loginID.toLowerCase())
				await this.tm.getTN("total_budget").setData({ 'total_budget': parseFloat(await paCycleData[0].r_pa_cycle_catgry.approved_budget) - parseFloat(await paCycleData[0].r_pa_cycle_catgry.total_cst_value ? await paCycleData[0].r_pa_cycle_catgry.total_cst_value : 0) });
		}
		else {
			await this.tm.getTN("total_budget").setData({ 'total_budget': (parseFloat(loginUserData[0].allocated_amount)) });
		}
	}
	public async onSubmit() {
		const listData = await this.tm.getTN("list_grid").getData();
		const totalAllocatedPercentage = listData.reduce((sum, item) => {
			return sum + parseFloat(item.allocated_percentage || 0);
		}, 0);

		const role = (await this.transaction.get$Role()).role_id;

		if (role === "TEAM_HEAD") {
			if (totalAllocatedPercentage <= 100) {
				await this.tm.commitP("Submit Successfully", "Submit Failed", false, true);
			} else {
				this.showAllocationError("Allocated Percentage can't be greater than 100%.");
			}
		} else {
			if (totalAllocatedPercentage === 100) {
				await this.tm.commitP("Submit Successfully", "Submit Failed", false, true);
			} else {
				this.showAllocationError("Allocated Percentage must be exactly 100%.");
			}
		}
	}

	public async showAllocationError(message: string) {
		sap.m.MessageBox.alert(message, {
			title: "Validation Error",
			icon: sap.m.MessageBox.Icon.WARNING
		});
	}

	// public async onPercentageChange(oEvent) {
	// 	const path = this.getPathFromEvent(oEvent);
	// 	const index = parseInt(path.replace("/list_grid/", ""), 10);
	// 	let cellValue = oEvent.getParameters().value;

	// 	// Input validation
	// 	if (isNaN(parseFloat(cellValue)) || parseFloat(cellValue) < 0 || cellValue === '-') {
	// 		oEvent.getSource().setValue((0).toFixed(2));
	// 		return;
	// 	}

	// 	cellValue = parseFloat(cellValue);

	// 	// Get relevant data
	// 	const listData = this.tm.getTN("list_grid").getData();
	// 	const listChangingData = listData[index];

	// 	const dirtyListData = listData.filter(record => record.isDirty)[0]; // Assuming only one dirty record per row?
	// 	const previousPercentage = parseFloat(dirtyListData.allocated_percentage || 0);
	// 	const previousAmount = parseFloat(dirtyListData.allocated_amount || 0);
	// 	const totalBudgetData = await this.tm.getTN("total_budget").getData();
	// 	const totalBudget = parseFloat(totalBudgetData?.total_budget || 0);

	// 	// Calculate allocated amount based on percentage
	// 	const newAllocatedAmount = (cellValue === 0) ? 0 : parseFloat((cellValue * totalBudget) / 100).toFixed(2);
	// 	listChangingData.allocated_amount = newAllocatedAmount;

	// 	// Ensure previous (dirty) data exists before comparison
	// 	if (dirtyListData) {
	// 		const currentAmount = parseFloat(newAllocatedAmount);
	// 		let unutilisedBudget = parseFloat(listChangingData.unulilised_budget || 0);

	// 		if (cellValue < previousPercentage) {
	// 			const decreasedAmt = (previousAmount - currentAmount).toFixed(2);
	// 			listChangingData.unulilised_budget = (unutilisedBudget - parseFloat(decreasedAmt)).toFixed(2);
	// 		} else if (cellValue > previousPercentage) {
	// 			const increasedAmt = (currentAmount - previousAmount).toFixed(2);
	// 			listChangingData.unulilised_budget = (unutilisedBudget + parseFloat(increasedAmt)).toFixed(2);
	// 		} else {
	// 			listChangingData.unulilised_budget = (cellValue === 0) ? 0 : newAllocatedAmount;
	// 		}
	// 	} else {
	// 		// Fallback if dirty data is not found
	// 		listChangingData.unulilised_budget = newAllocatedAmount;
	// 	}
	// }
	public async onPercentageChange(oEvent) {
		const path = this.getPathFromEvent(oEvent);
		const index = parseInt(path.replace("/list_grid/", ""), 10);
		let cellValue = oEvent.getParameters().value;

		// Input validation
		if (isNaN(parseFloat(cellValue)) || parseFloat(cellValue) < 0 || cellValue === '-') {
			oEvent.getSource().setValue((0).toFixed(2));
			return;
		}

		cellValue = parseFloat(cellValue);

		// Get relevant data
		const listData = this.tm.getTN("list_grid").getData();
		const listChangingData = listData[index];

		const totalBudgetData = await this.tm.getTN("total_budget").getData();
		const totalBudget = parseFloat(totalBudgetData?.total_budget || 0);

		// Old values
		const previousPercentage = parseFloat(listChangingData.allocated_percentage || 0);
		const previousAmount = parseFloat(listChangingData.allocated_amount || 0);
		const previousUnutilised = parseFloat(listChangingData.unulilised_budget || 0);

		// Calculate new allocated amount based on new percentage
		const newAllocatedAmount = parseFloat(((cellValue * totalBudget) / 100).toFixed(2));

		// Update percentage and allocated amount
		listChangingData.allocated_percentage = cellValue;
		listChangingData.allocated_amount = newAllocatedAmount;

		// Determine the change and update unutilised budget accordingly
		let newUnutilised = previousUnutilised;

		if (cellValue < previousPercentage) {
			// Percentage decreased
			const decreasedAmount = previousAmount - newAllocatedAmount;
			newUnutilised = parseFloat((previousUnutilised - decreasedAmount).toFixed(2));
		} else if (cellValue > previousPercentage) {
			// Percentage increased
			const increasedAmount = newAllocatedAmount - previousAmount;
			newUnutilised = parseFloat((previousUnutilised + increasedAmount).toFixed(2));
		} else {
			// Same percentage
			newUnutilised = newAllocatedAmount;
		}

		// Update unutilised budget
		listChangingData.unulilised_budget = newUnutilised;
	}



	// public onAllocateBudgetChange(oEvent) {
	// 	let path = this.getPathFromEvent(oEvent);
	// 	let index = parseInt(path.replace("/list_grid/", ""));
	// 	let cellValue = oEvent.getParameters().value;

	// 	// Convert cellValue to number for calculations
	// 	let numericValue = parseFloat(cellValue);

	// 	// Validate input
	// 	if (isNaN(numericValue) || numericValue < 0 || cellValue === '-') {
	// 		oEvent.getSource().setValue((0).toFixed(2));
	// 		return;
	// 	}

	// 	// Fetch data (assuming getData returns array, not Promise)
	// 	let listData = this.tm.getTN("list_grid").getData();
	// 	let listChangingData = listData[index];

	// 	// Get total budget
	// 	let totalBudgetData = this.tm.getTN("total_budget").getData();
	// 	let totalBudget = parseFloat(totalBudgetData.total_budget);

	// 	// Compute allocated percentage
	// 	listChangingData.allocated_percentage = (numericValue === 0 || cellValue === "")
	// 		? 0
	// 		: parseFloat((numericValue * 100) / totalBudget).toFixed(2);

	// 	// Assume the dirty data is just the record itself (not an array)
	// 	let dirtyRecord = listData[index]; // Previously you were filtering on the record, not an array

	// 	let currentAllocated = parseFloat(dirtyRecord.allocated_amount) || 0;
	// 	let newAllocated = numericValue;

	// 	// Calculate budget difference
	// 	let budgetDifference = parseFloat((newAllocated - currentAllocated).toFixed(2));
	// 	let unutilisedBudget = parseFloat(listChangingData.unulilised_budget) || 0;

	// 	if (budgetDifference < 0) {
	// 		// Decrease
	// 		listChangingData.unulilised_budget = parseFloat((unutilisedBudget - Math.abs(budgetDifference)).toFixed(2));
	// 	} else if (budgetDifference > 0) {
	// 		// Increase
	// 		listChangingData.unulilised_budget = parseFloat((unutilisedBudget + budgetDifference).toFixed(2));
	// 	} else {
	// 		listChangingData.unulilised_budget = newAllocated;
	// 	}
	// }
	public onAllocateBudgetChange(oEvent) {
		// Get the index of the changed row
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/list_grid/", ""));

		// Get the new value entered in the cell
		let cellValue = oEvent.getParameters().value;
		let numericValue = parseFloat(cellValue);

		// Validate input: must be a number >= 0 and not just '-'
		if (isNaN(numericValue) || numericValue < 0 || cellValue === '-') {
			oEvent.getSource().setValue((0).toFixed(2));
			return;
		}

		// Get the current data from the model
		let listData = this.tm.getTN("list_grid").getData();
		let listChangingData = listData[index];

		// Get the total budget
		let totalBudgetData = this.tm.getTN("total_budget").getData();
		let totalBudget = parseFloat(totalBudgetData.total_budget);

		// Calculate and update allocated percentage
		listChangingData.allocated_percentage = (numericValue === 0 || cellValue === "")
			? 0
			: parseFloat(((numericValue * 100) / totalBudget).toFixed(2));

		// Previous allocated amount
		let previousAllocated = parseFloat(listChangingData.allocated_amount) || 0;

		// Calculate the budget difference
		let budgetDifference = parseFloat((numericValue - previousAllocated).toFixed(2));

		// Get the current unutilised budget
		let currentUnutilised = parseFloat(listChangingData.unulilised_budget) || 0;

		// Update unutilised budget based on the difference
		if (budgetDifference < 0) {
			// Decrease: subtract the *absolute* of difference from unutilised
			listChangingData.unulilised_budget = parseFloat((currentUnutilised - Math.abs(budgetDifference)).toFixed(2));
		} else if (budgetDifference > 0) {
			// Increase: add the difference to unutilised
			listChangingData.unulilised_budget = parseFloat((currentUnutilised + budgetDifference).toFixed(2));
		} else {
			// No change: set unutilised to current allocated
			listChangingData.unulilised_budget = numericValue;
		}

		// Update the allocated amount to the new value
		listChangingData.allocated_amount = numericValue.toFixed(2);
	}


	public async onChangeInHeader() {
		let listData = await this.tm.getTN("list_grid").getData();
		let totalBudget = await this.tm.getTN("total_budget").getData();
		// Sum of allocated_amounts
		const totalAllocated = listData.reduce((sum, item) => {
			return sum + parseFloat(item.allocated_amount || 0);
		}, 0);
		//Sum of allocated %
		const totalAllocatedPerc = listData.reduce((sum, item) => {
			return sum + parseFloat(item.allocated_percentage || 0);
		}, 0);

		await this.tm.getTN("total_budget").setProperty('remaining', parseFloat(parseFloat(totalBudget.total_budget ? totalBudget.total_budget : 0) - parseFloat(totalAllocated ? totalAllocated : 0)).toFixed(2));
		await this.tm.getTN("total_budget").setProperty('allotted_budget', parseFloat(totalAllocated).toFixed(2));
		await this.tm.getTN("total_budget").setProperty('remaining_perc', parseFloat(totalAllocatedPerc) ? parseFloat(100 - parseFloat(totalAllocatedPerc)).toFixed(2) + '%' : 0 + '%');

	}
}
//11 sept 3:17PM