import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_target_vs_achi")
export default class p_o2c_target_vs_achi extends KloController {

    public async onPageEnter() {
        await this.tm.getTN("role").setData(null);
        await this.tm.getTN("selected_pc").setData(null);
        await this.tm.getTN("financial_year").setData(null);
    
        let searchData = await this.tm.getTN("o2c_target_vs_achieved_search").getData();
        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
        await this.tm.getTN("role").setData(userRole);
    
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
        const achievedMonth = months[previousMonthIndex];
    
        const currentYear = currentDate.getFullYear();
        const startOfFinancialYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;
        const financialYear = `${startOfFinancialYear}-${startOfFinancialYear + 1}`;
    
        searchData.financial_year = financialYear;
        if (currentDate.getDate() <= 10) {
            const adjustedMonthIndex = previousMonthIndex === 0 ? 11 : previousMonthIndex - 1;
            searchData.achieved_month = months[adjustedMonthIndex];
        } else {
            searchData.achieved_month = achievedMonth;
        }
    
        searchData.profit_center = Array.from(PCset)[0];
        if (userRole == "MANAGER") {
            await this.tm.getTN("o2c_target_vs_achieved_search").setProperty('project_manager', userID.toUpperCase())
        }
    }
    

    public async onManagerSearch() {
        let searchData = await this.tm.getTN("o2c_target_vs_achieved_search").getData();
        let profit_id = searchData.profit_center
        let managers = await this.transaction.getExecutedQuery(
            "q_delivery_manager_trgt",
            {
                profit_c: profit_id,
                loadAll: true,
                partialSelected: ["employee_id", "full_name"],
            }
        );
        await this.tm.getTN("selected_pc").setData(managers);
    }
    public async onAfterSearch() {
        let searchData = await this.tm.getTN("o2c_target_vs_achieved_search").getData();

        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const currentMonth = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ][currentMonthIndex];

        const currentYear = currentDate.getFullYear();
        const startOfFinancialYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;
        const financialYear = `${startOfFinancialYear}-${startOfFinancialYear + 1}`;

        searchData.financial_year = financialYear;
    }

    public async onGeneratingData() {
        const financialYearInput = prompt("Please enter the financial year (e.g., 2025-2026):");
        if (!financialYearInput || !financialYearInput.match(/^\d{4}-\d{4}$/)) {
            console.log("Invalid financial year format.");
            return;
        }

        const profitCenterList = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {
            loadAll: true,
            partialSelect: ['profit_center', 'company_code']
        });

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        for (let profitCenterItem of profitCenterList) {
            const { profit_center, company_code } = profitCenterItem;

            const profitCenterData = await this.transaction.getExecutedQuery('q_timesheet_line_manager', {
                loadAll: true,
                company_code,
                profit_centre: profit_center
            });

            if (!profitCenterData || profitCenterData.length === 0) continue;

            for (let data of profitCenterData) {
                for (let month of months) {
                    await this.tm.getTN("o2c_target_vs_achieved_list").createEntityP(
                        {
                            s_object_type: -1,
                            achieved_month: month,
                            financial_year: financialYearInput,
                            profit_center: profit_center,
                            project_manager: data.employee_id
                        },
                        "Creation Successful",
                        "Creation Failed",
                        null,
                        "First",
                        false,
                        true,
                        false
                    );
                }
            }
        }

        console.log("Line items generation completed.");
    }
    
    public async onUpdatingData() {
        try {
            const financialYearInput = prompt("Please enter the financial year (e.g., 2025-2026):");

            if (!financialYearInput || !financialYearInput.match(/^\d{4}-\d{4}$/)) {
                console.error("Invalid financial year format.");
                return;
            }

            const [startYear, endYear] = financialYearInput.split('-').map(year => parseInt(year));

            const startFinancialYear = new Date(startYear, 3, 1);
            const endFinancialYear = new Date(endYear, 2, 31);

            let [projectList, currencyRate] = await Promise.all([
                this.transaction.getExecutedQuery('d_o2c_project_header', {
                    loadAll: true,
                    partialSelect: ['so_id', 'project_id', 'profit_center'],
                    expandAll: "r_monthly_planning,r_project_so,r_project_so/r_so_attachment,r_project_so/r_profit_center"
                }),
                this.transaction.getExecutedQuery('d_o2c_exchange_rate', {
                    loadAll: true,
                    partialSelect: ['currency_rate', 'currency_code']
                })
            ]);

            if (!projectList || !currencyRate) {
                console.error("No data found for projects or currency rates.");
                return;
            }

            let currencyMap = new Map(currencyRate.map(rate => [rate.currency_code, parseFloat(rate.currency_rate)]));
            let internalDB: any[] = [];

            const profitCenterMap = new Map<string, string>();

            for (let project of projectList) {
                const profitCenter = project.profit_center;

                for (let so of project.r_project_so) {
                    if (so.type !== "SO" && so.type !== "PS") continue;

                    const currency = so.currency;
                    const isIndianCurrency = currency === "INR";
                    const crRates = so.r_so_attachment.map((attachment: any) => parseFloat(attachment.cr_rate));
                    const pdCost = crRates.reduce((sum, rate) => sum + rate, 0) / crRates.length;

                    let projectManager = so.r_profit_center.find(pc => pc.profit_center === profitCenter)?.project_manager;
                    if (!projectManager) continue;

                    const monthlyPlanningFiltered = project.r_monthly_planning.filter((plan: any) => {
                        const startDate = new Date(plan.start_date);
                        const endDate = new Date(plan.end_date);
                        return startDate >= startFinancialYear && endDate <= endFinancialYear;
                    });

                    for (let plan of monthlyPlanningFiltered) {
                        const achievedMonth = new Date(plan.start_date).toLocaleString('default', { month: 'short' });

                        let existingLineItem = internalDB.find(item =>
                            item.profit_center === profitCenter &&
                            item.project_manager === projectManager &&
                            item.achieved_month === achievedMonth
                        );

                        if (!existingLineItem) {
                            existingLineItem = {
                                financial_year: financialYearInput,
                                achieved_month: achievedMonth,
                                profit_center: profitCenter,
                                project_manager: projectManager,
                                total_revenue: 0.0,
                                abroad_revenue: 0.0,
                                indian_revenue: 0.0
                            };
                            internalDB.push(existingLineItem);
                        }

                        const plannedHours = parseFloat(plan.planned_hours);
                        let revenue = plannedHours * pdCost;

                        if (!isIndianCurrency && currencyMap.has(currency)) {
                            const exchangeRate = currencyMap.get(currency) ?? 1;
                            revenue *= exchangeRate;
                        }

                        if (isIndianCurrency) {
                            existingLineItem.indian_revenue += revenue;
                        } else {
                            existingLineItem.abroad_revenue += revenue;
                        }

                        existingLineItem.indian_revenue = parseFloat(existingLineItem.indian_revenue.toFixed(3));
                        existingLineItem.abroad_revenue = parseFloat(existingLineItem.abroad_revenue.toFixed(3));
                        existingLineItem.total_revenue = parseFloat((existingLineItem.indian_revenue + existingLineItem.abroad_revenue).toFixed(3));
                    }
                }
            }

            internalDB = this.convertRevenueToLakhs(internalDB);
            await this.updatingDataOnServer(financialYearInput, internalDB)
            console.log("Internal DB:", internalDB);
        } catch (error) {
            console.error("Error during data processing:", error);
        }
    }

    public async updatingDataOnServer(financialYearInput, internalDB) {
        try {

            let dbList = await this.transaction.getExecutedQuery('q_o2c_target_vs_achieved', {
                loadAll: true,
                given_year: financialYearInput
            });

            if (!dbList || dbList.length === 0) {
                console.error("No data found in dbList for the given financial year.");
                return;
            }
            for (let dbItem of dbList) {
                const matchingItem = internalDB.find(internalItem =>
                    internalItem.profit_center === dbItem.profit_center &&
                    internalItem.project_manager === dbItem.project_manager &&
                    internalItem.achieved_month === dbItem.achieved_month
                );

                if (matchingItem) {
                    dbItem.total_revenue = matchingItem.total_revenue;
                    dbItem.abroad_revenue = matchingItem.abroad_revenue;
                    dbItem.indian_revenue = matchingItem.indian_revenue;
                }
            }
            await this.tm.getTN("o2c_target_vs_achieved_list").refresh()
        } catch (error) {
            console.error("Error while updating data on the server:", error);
        }
    }

    public convertRevenueToLakhs(internalDB) {
        internalDB.forEach(item => {
            item.indian_revenue = parseFloat((item.indian_revenue / 100000).toFixed(3));
            item.abroad_revenue = parseFloat((item.abroad_revenue / 100000).toFixed(3));
            item.total_revenue = parseFloat(((item.indian_revenue + item.abroad_revenue)).toFixed(3));
        });
        return internalDB;
    }
}