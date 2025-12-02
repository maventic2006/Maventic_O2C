export class paFinancialYear {
	public static async getNextFinancialYears(currentYear, fin_year) {
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

		// Calculate last year to include (fin_year years ahead of current financial year)
		const lastYear = currentFYStart + parseInt(fin_year);

		// Loop from baseStartYear to lastYear to build the list
		for (let i = baseStartYear; i <= lastYear; i++) {
			const yearString = i + '-' + (i + 1);
			fyear.push({ year: yearString });
		}
		return fyear;
	}

	public static async getFinancialYearDates(inputDate: string): { startDate: Date, endDate: Date } {
		// Split the inputDate into start year and end year
		const years = inputDate.split('-');
		const startYear = parseInt(years[0], 10);
		const endYear = parseInt(years[1], 10);

		// Financial year starts on April 1st of the start year and ends on March 31st of the end year
		const financialYearStart = new Date(startYear, 3, 1); // April 1st of start year
		const financialYearEnd = new Date(endYear, 2, 31); // March 31st of end year

		// Return the start and end dates
		return { startDate: financialYearStart, endDate: financialYearEnd };
	}
	public static async experienceInYear(fromDate, toDate) {
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
	public static async sumOfYear(year1, year2) {
		// Extract years and months manually
		let prevYears = Math.floor(year1);
		let mavYears = Math.floor(year2);
		// Extract months using string split
		let prevMonths = parseInt(year1.toString().split('.')[1] || '0');
		let mavMonths = parseInt(year2.toString().split('.')[1] || '0');

		// Total months
		let totalMonths = (prevYears + mavYears) * 12 + prevMonths + mavMonths;

		// Convert to years and months
		let years = Math.floor(totalMonths / 12);
		let months = totalMonths % 12;

		// Proper output
		let yearSum = parseFloat(`${years}.${months}`);
		return yearSum;
	}
	public static async inputTypeDecimal(oEvent) {
		let oInput = oEvent.getSource();
		let value = oInput.getValue();
		if (value.startsWith("-")) {
			oInput.setValue("");
			oInput.setValueState("Error");
			oInput.setValueStateText("Only positive numbers are allowed");
		}
		else {
			oInput.setValueState("None");
		}
	}
	public static async getFinancialYear(date) {
		const year = date.getFullYear();
		const month = date.getMonth(); // 0 = January, 3 = April

		if (month >= 3) {
			// Financial year starts in April of the current year
			return `${year}-${year + 1}`;
		} else {
			// Financial year started in April of the previous year
			return `${year - 1}-${year}`;
		}
	}
	public static async employeeUniqueOrg(txn, orgData) {
		// Fetch business areas and profit centres
		let businessAreaOrg = await txn.getExecutedQuery('d_o2c_business_area', { loadAll: true });
		let PCOrg = await txn.getExecutedQuery('d_o2c_profit_centre', { loadAll: true });
		let companyOrg = await txn.getExecutedQuery('d_o2c_company_info', { loadAll: true, 'expandAll': "r_company_info" });

		// Create lookup maps for business area and profit centre names
		let businessAreaMap = new Map(businessAreaOrg.map(item => [item.business_area, item.name]));
		let profitCentreMap = new Map(PCOrg.map(item => [item.profit_center, item.name]));
		let companyMap = new Map(companyOrg.map(item => [item.company_code, item.name]));

		// Get unique business areas with names
		// let uniqueBAreas = new Set();
		// let loginUserOrgBArea = [];

		// for (let item of orgData) {
		// 	let bArea = item.business_area;
		// 	if (!uniqueBAreas.has(bArea)) {
		// 		uniqueBAreas.add(bArea);
		// 		loginUserOrgBArea.push({
		// 			key: bArea,
		// 			value: businessAreaMap.get(bArea) || null
		// 		});
		// 	}
		// }


		// Get unique profit centres with names
		let uniquePCs = new Set();
		let loginUserOrgPC = [];

		for (let item of orgData) {
			let pc = item.profit_centre;
			if (!uniquePCs.has(pc)) {
				uniquePCs.add(pc);
				loginUserOrgPC.push({
					key: pc,
					value: profitCentreMap.get(pc) || null
				});
			}
		}
		// Get unique company with names
		let uniqueCompanyCode = new Set();
		let loginUserOrgCompany = [];

		for (let item of orgData) {
			let c = item.company_code;
			if (!uniqueCompanyCode.has(c)) {
				uniqueCompanyCode.add(c);
				loginUserOrgCompany.push({
					key: c,
					value: companyMap.get(c) || null
				});
			}
		}
		let uniqueBAreas = new Set();
		let loginUserOrgBArea = [];
		let allBAreaOrg = companyOrg.find((e) => e.company_code==loginUserOrgCompany[0].key)
		for (let item of allBAreaOrg.r_company_info) {
			let bArea = item.business_area;
			if (!uniqueBAreas.has(bArea)) {
				uniqueBAreas.add(bArea);
				loginUserOrgBArea.push({
					key: bArea,
					value: businessAreaMap.get(bArea) || null
				});
			}
		}
		return {
			loginUserOrgCompany,
			loginUserOrgBArea,
			loginUserOrgPC
		};
	}

}