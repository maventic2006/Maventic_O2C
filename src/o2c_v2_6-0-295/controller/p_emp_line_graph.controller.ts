import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_line_graph")
export default class p_emp_line_graph extends KloController {

    public async onPageEnter() {
        await this.tm.getTN("chart_line_other").setData(null);
        await this.tm.getTN("data_table").setData(null);

        let searchData = await this.tm.getTN("graph_search").getData();
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
        const searchData = await this.tm.getTN("graph_search").getData();
        const date = new Date(searchData.financial_year);
        const year = date.getFullYear();
        const financialYear = `${year}-${year + 1}`;
    
        const monthOrder = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        const resultArray: any[] = [];
    
        const totals = {
            total_head_count: 0,
            employee_count: 0,
            trainee_count: 0,
            contract_employee_count: 0,
            provisional_employee_count: 0
        };
    
        for (const month of monthOrder) {
            const monthlyData = await this.transaction.getExecutedQuery('q_o2c_pds_contribution1', {
                loadAll: true,
                financial_year: financialYear,
                achieved_month: month,
                profit_center: searchData.profit_center,
                company_code: searchData.company_code,
                project_manager: searchData.project_manager
            });
    
            let monthlyAggregates = {
                TotalHeadCount: 0,
                TotalPermanentEmployee: 0,
                TotalTraineeEmployees: 0,
                TotalContractualEmployees: 0,
                TotalProvisionalEmployees: 0
            };
    
            monthlyData.forEach((item: any) => {
                const headCount = parseFloat(item.total_head_count) || 0;
                const permEmp = parseFloat(item.employee_count) || 0;
                const trainee = parseFloat(item.trainee_count) || 0;
                const contract = parseFloat(item.contract_employee_count) || 0;
                const provisional = parseFloat(item.provisional_employee_count) || 0;
    
                monthlyAggregates.TotalHeadCount += headCount;
                monthlyAggregates.TotalPermanentEmployee += permEmp;
                monthlyAggregates.TotalTraineeEmployees += trainee;
                monthlyAggregates.TotalContractualEmployees += contract;
                monthlyAggregates.TotalProvisionalEmployees += provisional;
    
                if (month === searchData.achieved_month) {
                    totals.total_head_count += headCount;
                    totals.employee_count += permEmp;
                    totals.trainee_count += trainee;
                    totals.contract_employee_count += contract;
                    totals.provisional_employee_count += provisional;
                }
            });
    
            resultArray.push({
                ...monthlyAggregates,
                month
            });
        }
    
        const otherTableLineItems = [
            {
                employee_category: "Total Headcount",
                count: totals.total_head_count
            },
            {
                employee_category: "Total Permanent Employees",
                count: totals.employee_count
            },
            {
                employee_category: "Total Trainee Employees",
                count: totals.trainee_count
            },
            {
                employee_category: "Total Contractual Employees",
                count: totals.contract_employee_count
            },
            {
                employee_category: "Total Provisional Employees",
                count: totals.provisional_employee_count
            }
        ];
    
        await this.tm.getTN("chart_line_other").setData(resultArray);
        await this.tm.getTN("data_table").setData(otherTableLineItems);
    }
    


    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_o2c_pso_list" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_emp_onboarding_deb" }))
    }


}