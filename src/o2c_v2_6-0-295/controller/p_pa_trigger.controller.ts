import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
import { employeeHierarchy } from 'o2c_v2/util/employeeHierarchy';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_trigger")
export default class p_pa_trigger extends KloController {
	public code;
    public _resolveLoginPromise;
	public loginID;
	public async onPageEnter() {
			const waitForLogin = new Promise<void>((resolve) => {
				this._resolveLoginPromise = resolve;
			});
			await this.openDialog("p_pa_dialog_b_copy01");
			// Wait here until login completes and dialog is closed
			await waitForLogin;
			await this.onFunc(); // Only runs after successful login + dialog closed
		
	}
	public async onEscapeEvent() {
		//Avoid escape button click
	}
	public async onLoginSubmit() {
		this.tm.getTNFromEmbedded("totp_code", "s_pa_login_copy01").setProperty('msg', "");
		this.code = this.tm.getTNFromEmbedded("totp_code", "s_pa_login_copy01").getData().code;
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
				this.tm.getTNFromEmbedded("totp_code", "s_pa_login_copy01").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
				// this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('code',"");
			}
			else {
				this.transaction.$SYSTEM.appVars.totp = this.code;
				await this.closeDialog("p_pa_dialog_b_copy01");
				// ✅ Resolve the promise to resume `abc()`
				if (this._resolveLoginPromise) {
					this._resolveLoginPromise();
					this._resolveLoginPromise = null;
				}
			}
		}
		else {
			this.tm.getTNFromEmbedded("totp_code", "s_pa_login_copy01").setProperty('msg', "Please enter TOTP Code");

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
			await this.tm.getTN("button_visiblity").setData({ 'visible': false });
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

			await this.checkStatus();
			busyDialog.close();

		}
	}
	public async checkStatus() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading.."
		});
		busyDialog.open();
		let searchData = await this.tm.getTN("other").getData();
		await this.tm.getTN("search").setProperty('company_code', searchData.companyCode);
		await this.tm.getTN("search").setProperty('business_area', searchData.businessArea);
		await this.tm.getTN("search").setProperty('profit_center', searchData.profitCenter);
		await this.tm.getTN("search").setProperty('fiscal', searchData.fyear);
		await this.tm.getTN("search").executeP();
		let bArea = searchData.businessArea != "ALL" ? searchData.businessArea : "";
		let paCycleData = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { company_code: searchData.companyCode,business_area:bArea, profit_center: searchData.profitCenter, fyear: searchData.fyear });
		let visibleFlag = false;
		const listData = await this.tm.getTN("list_data").getData();
		if (listData.length) {
			if (paCycleData.length === 0) {
				let visibleButton = await this.transaction.getExecutedQuery('d_o2c_emp_general_config', {loadAll:true,'company_code':searchData.companyCode,'parameter_name':"PA Trigger" });
				const role = await this.transaction.get$Role();
				if (role.role_id === visibleButton[0].parameter_values) {
					visibleFlag = true;
				}
			}
		}		
		await this.tm.getTN("button_visiblity").setData({ 'visible': visibleFlag });
		busyDialog.close();
	}
	public async paTrigger() {
		let searchData = await this.tm.getTN("other").getData();
		let inputYear = await paFinancialYear.getFinancialYearDates(searchData.fyear);
		let paCycleTableData = await this.transaction.createEntityP("d_o2c_emp_pa_cycle", { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle: 1, fiscal_year: searchData.fyear, start_date: inputYear.startDate, end_date: inputYear.endDate });
		let bArea = searchData.businessArea != "ALL" ? searchData.businessArea : "";
		//Need to change the code ---indirect line manager is not coming now and employee is not manager designation
		//Team Head
		let teamHeadData = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {loadAll:true,company_code: searchData.companyCode, profit_center: searchData.profitCenter,expandAll:"r_team_head_detail"});
		await this.transaction.createEntityP("d_o2c_pa_cycle_id_lm", { pa_cycle_id: paCycleTableData.pa_cycle_id, line_manager_id:teamHeadData[0].team_head, manager_id: teamHeadData[0].r_team_head_detail.line_manager/*this.loginID*/, s_status: "Pending" });
		let managerData = await this.transaction.getExecutedQuery('q_pa_pc_manager', { company_code: searchData.companyCode, business_area: bArea, pc: searchData.profitCenter, designation: 'MANAGER' });
		let manateeData = managerData.filter((item) => item.line_manager == (this.transaction.get$User()).login_id);
		for (let i = 0; i < manateeData.length; i++)
			await this.transaction.createEntityP("d_o2c_pa_cycle_id_lm", { pa_cycle_id: paCycleTableData.pa_cycle_id, line_manager_id: manateeData[i].employee_id, manager_id: this.loginID, s_status: "Pending" });
		await this.tm.commitP("PA Trigger Successfully", "PA Trigger Failed", false, true);
		await this.tm.getTN("button_visiblity").setData({ 'visible': false });

	}
}

//Finally done 1/9/25.