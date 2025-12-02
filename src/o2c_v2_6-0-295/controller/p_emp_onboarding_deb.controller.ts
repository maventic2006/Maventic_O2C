import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_emp_onboarding_deb")
export default class p_emp_onboarding_deb extends KloController{
	
	public async onPageEnter() {
        await this.tm.getTN("table_data").setData(null);
        let searchData = await this.tm.getTN("search").getData();
        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
        let emp_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': userID, is_primary: true, loadAll: true });
        const loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
            loadAll: true,
            employee_id: userID,
            active_till: new Date()
        });
        const PCset = new Set(loginOrg.map(org => org.profit_centre));

        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const previousMonthIndex = (currentMonthIndex === 0) ? 11 : currentMonthIndex - 1;
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        let achievedMonth = months[previousMonthIndex];
        const currentDay = currentDate.getDate();
        if (currentDay <= 10) {
            achievedMonth = months[(previousMonthIndex === 0 ? 11 : previousMonthIndex - 1)];
        }

        const currentYear = currentDate.getFullYear();
        let startOfFinancialYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;

        // Special handling: if achievedMonth is "Mar", set financial year to previous
        if (achievedMonth === "Mar") {
            startOfFinancialYear -= 1;
        }
        
        const financialYear = new Date(`${startOfFinancialYear}-04-01`);

        searchData.company_code = emp_org[0].company_code
        searchData.financial_year = financialYear;
        searchData.achieved_month = achievedMonth;
        searchData.profit_center = Array.from(PCset)[0];

        if (userRole == "MANAGER") {
            searchData.project_manager = userID.toUpperCase();
        }

        await this.onAfterSearch()
	}


    public async onAfterSearch() {
        let searchData = await this.tm.getTN("search").getData();
        let date = new Date(searchData.financial_year);
        let year = date.getFullYear();
        let financialYear = `${year}-${year + 1}`;
    
        const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        const categories = [
            { emp_category: "Experienced_Joiners", key: "experienced_joiners" },
            { emp_category: "Freshers_Joiners", key: "fresher_joiners" },
            { emp_category: "No_of_People_Resigned", key: "employees_resigned" },
            { emp_category: "No_of_People_Left", key: "employees_exited" },
            { emp_category: "No_of_People_with_Yellow_Cases", key: "yellow_flagged_employees" },
            { emp_category: "No_of_People_with_Red_Cases", key: "red_flagged_employees" },
            { emp_category: "New_Openings_Freshers", key: "new_fresher_openings" },
            { emp_category: "Current_Openings_Freshers", key: "current_fresher_openings" },
            { emp_category: "Offers_Experienced", key: "offers_to_experienced" }
        ];
    
        // Initialize final result structure
        let finalTable: any[] = categories.map(cat => ({
            emp_category: cat.emp_category,
            // Add all months initialized to 0
            ...Object.fromEntries(months.map(m => [m.toLowerCase(), 0]))
        }));
    
        // For each month, get data and accumulate totals per category
        for (const month of months) {
            const monthData = await this.transaction.getExecutedQuery('q_o2c_pds_contribution1', {
                loadAll: true,
                financial_year: financialYear,
                achieved_month: month,
                profit_center: searchData.profit_center,
                company_code: searchData.company_code,
                project_manager:searchData.project_manager
            });
    
            // Sum values for each category across all rows for the current month
            categories.forEach((cat, idx) => {
                let monthlySum = 0;
                monthData.forEach(row => {
                    monthlySum += parseFloat(row[cat.key]) || 0;
                });
    
                // Store in the correct month column for the current category
                finalTable[idx][month.toLowerCase()] = monthlySum;
            });
        }
    
        await this.tm.getTN("table_data").setData(finalTable);
    }
    
    
    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_emp_line_graph" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_func_area_chart" }))
    }
    
	
}