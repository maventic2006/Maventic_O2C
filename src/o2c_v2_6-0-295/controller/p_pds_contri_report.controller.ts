import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pds_contri_report")
export default class p_pds_contri_report extends KloController {

    public async onPageEnter() {
        await this.tm.getTN("pie_chart_data_other").setData(null);
        await this.tm.getTN("table_data").setData(null);
        await this.tm.getTN("table_view").setData(null);
        this.tm.getTN("role").setData(null);

        let searchData = await this.tm.getTN("pds_search").getData();
        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
        await this.tm.getTN("role").setData(userRole);
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
        let searchData = await this.tm.getTN("pds_search").getData();
    
        let date = new Date(searchData.financial_year);
        let year = date.getFullYear();
        let financialYear = `${year}-${year + 1}`;
    
        await this.tm.getTN("pie_chart_data_other").setData(null);
    
        let headerTargets = await this.transaction.getExecutedQuery("d_o2c_pds_contribution", {
            company_code: searchData.company_code,
            financial_year: financialYear,
            profit_center: searchData.profit_center,
            achieved_month: searchData.achieved_month,
            project_manager: searchData.project_manager,
            loadAll: true,
        });
    
        await this.tm.getTN("table_view").setData(headerTargets);
    
        // Initialize sum variables
        let totals = {
            billable_days_india: 0,
            billable_days_abroad: 0,
            bench_days: 0,
            avg_billable_rate_inr: 0,
            avg_effective_billable_rate: 0,
            non_billable_consumption: 0
        };
    
        // Sum all relevant values across entries
        for (let item of headerTargets) {
            totals.billable_days_india += parseFloat(item.billable_days_india) || 0;
            totals.billable_days_abroad += parseFloat(item.billable_days_abroad) || 0;
            totals.bench_days += parseFloat(item.bench_days) || 0;
            totals.avg_billable_rate_inr += parseFloat(item.avg_billable_rate_inr) || 0;
            totals.avg_effective_billable_rate += parseFloat(item.avg_effective_billable_rate) || 0;
            totals.non_billable_consumption += parseFloat(item.non_billable_consumption) || 0;
        }
    
        // Pie chart data
        let dataArray = [
            {
                type: "No of Billable days in India",
                chart_data: totals.billable_days_india,
            },
            {
                type: "No of Billable days in Abroad",
                chart_data: totals.billable_days_abroad,
            },
            {
                type: "No of Bench Days",
                chart_data: totals.bench_days,
            }
        ];
        await this.tm.getTN("pie_chart_data_other").setData(dataArray);
    
        // Additional table data (averaged where applicable)
        let count = headerTargets.length || 1; // avoid division by zero
        let additionalArray = [
            {
                description: "Average Billable Rate in INR",
                value: parseFloat((totals.avg_billable_rate_inr / count).toFixed(2)),
            },
            {
                description: "Average Effective Billable Rate",
                value: parseFloat((totals.avg_effective_billable_rate / count).toFixed(2)),
            },
            {
                description: "Non Billable Consumption",
                value: totals.non_billable_consumption,
            },
        ];
        await this.tm.getTN("table_data").setData(additionalArray);
    }
    
    

    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_o2c_tar_vs_ach_rep" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_o2c_pso_list" }))
    }

}