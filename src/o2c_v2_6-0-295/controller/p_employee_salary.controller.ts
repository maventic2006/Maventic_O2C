import { event } from 'jquery';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
export default class p_employee_salary extends KloController {
	public _resolveLoginPromise;
	public code;
	public loginID;
	public flag;
	public async onPageEnter(oEvent) {
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "Salary" });
		if (general_config[0].high_value == 1) {
			const waitForLogin = new Promise<void>((resolve) => {
				this._resolveLoginPromise = resolve;
			});
			await this.openDialog("p_pa_dialog_box");
			// Wait here until login completes and dialog is closed
			await waitForLogin;
			await this.onFunc(oEvent); // Only runs after successful login + dialog closed
		}
	}
	public async onFunc(oEvent) {
		//access control
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "emp_salary_detail");
		let employeeID;
		if (oEvent.navToParams.AD) {
			employeeID = oEvent.navToParams.AD[0];
		}
		else {
			employeeID = (await this.transaction.get$User()).login_id;
		}
		let roleID = (await this.transaction.get$Role()).role_id;
		//After remove loadAll data is not coming in joining data
		let employeeDetail = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': employeeID, partialSelected: ['full_name', 'profile_pic', 'joining_date'], loadAll: true });
		let empDesignation = await this.transaction.getExecutedQuery('q_o2c_emp_current_desig', { employee_id: employeeID, from_date: new Date(), to_date: new Date(), partialSelected: 'name', expandAll: 'r_designation_name', loadAll: true });

		//In PageEnter all the section is Expandable (Other Type transnode used for Collapse and Expandable)
		await this.tm.getTN("colExp").setData({ button: true });

		//This function "getEmployeeFinancialYears" fetch the value of the finanical Year based on Joining Date
		//In this "fyList" all the value of finanical Year from joining Date to current Date
		let fyList = await this.getEmployeeFinancialYears(employeeDetail[0].joining_date);
		//In this "fiscalYear" it will store the value current finanical year
		let fiscalYear = `${(new Date().getFullYear())}-${new Date().getFullYear() + 1}`;
		//let fiscalYear = await this.getFinancialYearDates(`${(new Date().getFullYear()) - 1}-${new Date().getFullYear()}`);
		await this.tm.getTN("other").setData({ employeeID: employeeID, fullname: employeeDetail[0].full_name, designation: empDesignation[0].r_designation_name.name,/*pic:employeeDetail[0].profile_pic*/ fyselected: fiscalYear, fiscalDd: fyList, link: "Salary Change Log " });
		await this.tm.getTN("role").setData({ roleID });
		//benefit list
		const benefitName = [
			"HRA",
			"Conveyance Allowance",
			"Medical Allowance",
			"Special Allowance",
			"PF Employer",
			"PF Admin",
			"ESI Employer",
			"Cafetaria",
			"Medical Insurance",
			"Gratuity",
			"Performance Bonus",
			"Retention Bonus",
			"Company Bonus",
			"ESI Employee",
			"PF Employee",
			"Provisional Tax",
			"TDS",
			"Salary Reimbursement",
			"Gratuity Arrears",
			"Car Lease",
			"Joining Bonus"
		];

		await this.tm.getTN("benefit_list").setData({
			benefitID: benefitName.map((_, i) => `B${i + 1}`),
			benefitName
		});

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

		// Navigate away
		await this.navTo({ F: "kloTouch", S: "p_homePage" });
	}
	public async colExpbutn() {
		const isExpanded = await this.tm.getTN("colExp").getData().button;

		const components = [
			"s_emp_component_area",
			"s_emp_bonus",
			"s_emp_contribution",
			"s_emp_contri_deduct",
			"s_retirement_benefit",
			"s_add_on_benefit"
		];

		// Loop through each component and set expanded based on `isExpanded` value
		for (const componentId of components) {
			let component = await this.getActiveControlById(null, componentId);
			component.getParent().setExpanded(!isExpanded);
		}

		// Toggle the button state and set the data
		await this.tm.getTN("colExp").setData({ button: !isExpanded });
	}

	public async salaryData(employeeID, fdate, tdate) {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading..."
		});
		busyDialog.open();
		await this.tm.getTN("search_new").setProperty('emp_id', employeeID);
		await this.tm.getTN("search_new").setProperty('fdate', fdate);
		await this.tm.getTN("search_new").setProperty('tdate', tdate);
		await this.tm.getTN("search_new").executeP();

		await this.tm.getTN("list").refresh();
		//find the max count_no
		const data = await this.tm.getTN("list").getData();

		const maxCountNo = Math.max(...data.map(item => Number(item.count_no) || 0));

		//Without setActive(max count no) data is coming in the screen as the section is binded with relation data so if list is active then only the relation data is coming in UI
		await this.tm.getTN("list").setActive(maxCountNo);

		let empSalaryData = await this.tm.getTN("list").getData().filter((e) => e.count_no == maxCountNo);
		if (empSalaryData) {
			let benefitList = await this.tm.getTN("benefit_list").getData();
			let empEarningList = empSalaryData.filter((e) => e.benefit_type == "Monetary Allowance");

			let { ctc, basic, gross_pay } = empSalaryData[0];

			await this.tm.getTN("otherlist").setData([{ benefit_name: "CTC", planned_amount: ctc },
			{ benefit_name: "Basic", planned_amount: basic },
			...empEarningList.map(item => {
				const index = benefitList.benefitID.indexOf(item.benefit_name);
				return {
					benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
					planned_amount: item.planned_amount
				};
			}),
			{ benefit_name: "Gross Pay", planned_amount: gross_pay }]);

			//Non Monetary Allowance
			let empNonMonList = empSalaryData.filter((e) => e.benefit_type == "Non - Monetary Benefits");

			await this.tm.getTN("non_monetary").setData([
				...empNonMonList.map(item => {
					const index = benefitList.benefitID.indexOf(item.benefit_name);
					return {
						benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
						planned_amount: item.planned_amount
					};
				}),
			]);
			//Retirement Benefit
			let empRetireList = empSalaryData.filter((e) => e.benefit_type == "Retirement Benefit");

			await this.tm.getTN("retirement_benefit").setData([
				...empRetireList.map(item => {
					const index = benefitList.benefitID.indexOf(item.benefit_name);
					return {
						benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
						planned_amount: item.planned_amount
					};
				}),
			]);
			//Bonus
			let empBonusList = empSalaryData.filter((e) => e.benefit_type == "Bonus");

			await this.tm.getTN("bonus").setData([
				...empBonusList.map(item => {
					const index = benefitList.benefitID.indexOf(item.benefit_name);
					return {
						benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
						planned_amount: item.planned_amount
					};
				}),
			]);
			//Employee Contribution
			let empContriList = empSalaryData.filter((e) => e.benefit_type == "Employee Contribution");

			await this.tm.getTN("employee_contribution").setData([
				...empContriList.map(item => {
					const index = benefitList.benefitID.indexOf(item.benefit_name);
					return {
						benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
						planned_amount: item.planned_amount
					};
				}),
			]);
			//Employee Opted
			let empOptedList = empSalaryData.filter((e) => e.benefit_type == "Employee Opted");

			await this.tm.getTN("employee_opted").setData([
				...empOptedList.map(item => {
					const index = benefitList.benefitID.indexOf(item.benefit_name);
					return {
						benefit_name: index !== -1 ? benefitList.benefitName[index] : null,
						planned_amount: item.planned_amount
					};
				}),
			]);
		}
		else {
			sap.m.MessageBox.error("The salary details is not present in this finanical year", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
			});

		}
		busyDialog.close();
	}
	public async onfiscalYearChange() {

		let selectedFiscalYear = await this.tm.getTN("other").getData().fyselected;
		let inputYear = await this.getFinancialYearDates(selectedFiscalYear);
		let selectedFromDate = new Date(inputYear.startDate);
		let selectedToDate = new Date(inputYear.endDate);
		await this.salaryData(await this.tm.getTN("other").getData().employeeID, selectedFromDate, selectedToDate);
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
	public async getEmployeeFinancialYears(joiningDate) {
		const currentDate = new Date();
		const currentYear = currentDate.getFullYear();
		const financialYears = [];

		// Get the start year and end year for the current financial year (April to March)
		let startYear = currentYear;
		let endYear = currentYear + 1;

		// If the current month is before April (i.e., Jan, Feb, or Mar), adjust the financial year to the previous year
		if (currentDate.getMonth() < 3) { // Months are 0-based, so 3 means April
			startYear = currentYear - 1;
			endYear = currentYear;
		}

		// Adjust for joiningDate and calculate the financial years starting from the joining year
		let joiningYear = joiningDate.getFullYear();
		if (joiningDate.getMonth() < 3) {  // Before April, adjust the financial year
			joiningYear -= 1;
		}

		// Loop through years to generate financial years from the joining year onward
		for (let year = startYear; year >= joiningYear; year--) {
			let financialYear = `${year}-${year + 1}`;
			financialYears.push({ fy: financialYear });
		}

		return financialYears;
	}
	// public async onSave() {
	// 	let empSalaryData = await this.tm.getTN("o2c_employee_salary_hdr_list").getData();
	// 	let empEarningList = empSalaryData[0].r_emp_earnings;
	// 	let prevConveyanceAllowanceData = empEarningList.filter((item) => item.benefit_name == "Conveyance Allowance");
	// 	let monetaryAllowanceData = await this.tm.getTN("otherlist").getData();
	// 	let currConveyanceAllowanceData = monetaryAllowanceData.filter((item) => item.benefit_name == "Conveyance Allowance");
	// 	if (currConveyanceAllowanceData[0].planned_amount != prevConveyanceAllowanceData[0].planned_amount) {
	// 		prevConveyanceAllowanceData[0].planned_amount = currConveyanceAllowanceData[0].planned_amount;
	// 	}
	// 	await this.openDialog("pa_reason");
	// }
	public async onSave() {
		try {
			// Get current employee salary data
			const empSalaryData = await this.tm.getTN("list").getData();
			if (!empSalaryData || empSalaryData.length === 0) {
				console.error("Employee salary data not found.");
				return;
			}

			const empEarningList = empSalaryData[0].r_emp_earnings || [];

			// Find previous Conveyance Allowance
			const prevConveyanceAllowanceData = empEarningList.find(
				(item: any) => item.benefit_name === "Conveyance Allowance"
			);

			// Get current monetary allowance data
			const monetaryAllowanceData = await this.tm.getTN("otherlist").getData();
			const currConveyanceAllowanceData = monetaryAllowanceData.find(
				(item: any) => item.benefit_name === "Conveyance Allowance"
			);

			// If both exist, compare and update
			if (
				prevConveyanceAllowanceData &&
				currConveyanceAllowanceData &&
				prevConveyanceAllowanceData.planned_amount !== currConveyanceAllowanceData.planned_amount
			) {
				prevConveyanceAllowanceData.planned_amount = currConveyanceAllowanceData.planned_amount;
			}

			// Open dialog for reason
			await this.openDialog("pa_reason");

		} catch (error) {
			console.error("Error in onSave():", error);
		}
	}
	public async okButton() {
		await this.closeDialog("pa_reason");
		await this.tm.commitP("Save Successful", "Save Failed", true, true);
	}
	public async cancelButton() {
		await this.closeDialog("pa_reason");
	}
	public async leftArrowButtn() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading..."
		});
		busyDialog.open();
		const data = await this.tm.getTN("o2c_employee_salary_hdr_list").getData();
		await this.tm.getTN("o2c_employee_salary_hdr_list").refresh();

		//Without setActive(count no-1) data is coming in the screen as the section is binded with relation data so if list is active then only the relation data is coming in UI
		await this.tm.getTN("o2c_employee_salary_hdr_list").setActive(data[0].count_no - 1);

		let empSalaryData = await this.tm.getTN("o2c_employee_salary_hdr_list").getData();
		if (empSalaryData.length) {
			let empEarningList = empSalaryData[0].r_emp_earnings;

			let { ctc, basic, gross_pay } = empSalaryData[0];

			await this.tm.getTN("otherlist").setData([{ benefit_name: "CTC", planned_amount: ctc },
			{ benefit_name: "Basic", planned_amount: basic },
			...empEarningList.map(item => ({
				benefit_name: item.benefit_name,
				planned_amount: item.planned_amount
			})),
			{ benefit_name: "Gross Pay", planned_amount: gross_pay }]);
		}
		else {
			sap.m.MessageBox.error("The salary details is not present in this finanical year", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
			});

		}
		//left button enable or not
		busyDialog.close();
	}
	public async rightArrowButtn() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading..."
		});
		busyDialog.open();
		const data = await this.tm.getTN("o2c_employee_salary_hdr_list").getData();
		await this.tm.getTN("o2c_employee_salary_hdr_list").refresh();

		//Without setActive(count no+1) data is coming in the screen as the section is binded with relation data so if list is active then only the relation data is coming in UI
		await this.tm.getTN("o2c_employee_salary_hdr_list").setActive(data[0].count_no + 1);

		let empSalaryData = await this.tm.getTN("o2c_employee_salary_hdr_list").getData();
		if (empSalaryData.length) {
			let empEarningList = empSalaryData[0].r_emp_earnings;

			let { ctc, basic, gross_pay } = empSalaryData[0];

			await this.tm.getTN("otherlist").setData([{ benefit_name: "CTC", planned_amount: ctc },
			{ benefit_name: "Basic", planned_amount: basic },
			...empEarningList.map(item => ({
				benefit_name: item.benefit_name,
				planned_amount: item.planned_amount
			})),
			{ benefit_name: "Gross Pay", planned_amount: gross_pay }]);
		}
		else {
			sap.m.MessageBox.error("The salary details is not present in this finanical year", {
				title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
			});

		}
		//right button enable or not
		busyDialog.close();
	}

}
//AF 1 Dec 2025 11:30PM
