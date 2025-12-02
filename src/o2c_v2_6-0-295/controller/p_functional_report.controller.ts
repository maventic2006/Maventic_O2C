import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_functional_report")
export default class p_functional_report extends KloController {
    public async onPageEnter() {
        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
    }

    public async onGeneratingData() {
        let listData = await this.tm.getTN("functional_area_list").getData();

        // Fetch the functional area data
        const functionalAreaData = await this.transaction.getExecutedQuery('d_o2c_functional_area', {
            loadAll: true,
            partialSelected: ["functional_area", "name"],
        });

        // Create a map with functional_area as key and name as value
        const functionalAreaMap: Record<string, string> = {};
        functionalAreaData.forEach((item: any) => {
            if (item.functional_area && item.name) {
                functionalAreaMap[item.functional_area] = item.name;
            }
        });

        const financialYearInput = prompt("Please enter the financial year (e.g., 2024-2025):");
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
                expandAll: "r_monthly_planning,r_project_so,r_project_so/r_so_attachment,r_project_so/r_profit_center,r_project_so/r_functional_area"
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

        for (let project of projectList) {
            const profitCenter = project.profit_center;

            for (let so of project.r_project_so) {
                if (so.type !== "SO" && so.type !== "PS") continue;

                const currency = so.currency;
                const isIndianCurrency = currency === "INR";
                const crRates = so.r_so_attachment.map((attachment: any) => parseFloat(attachment.cr_rate));
                let pdCost = crRates.reduce((sum, rate) => sum + rate, 0) / crRates.length;

                if (isNaN(pdCost)) {
                    pdCost = 1;
                }

                let projectManager = so.r_profit_center.find(pc => pc.profit_center === profitCenter)?.project_manager;
                if (!projectManager) continue;

                // Filter monthly planning data based on financial year range
                const monthlyPlanningFiltered = project.r_monthly_planning.filter((plan: any) => {
                    const startDate = new Date(plan.start_date);
                    const endDate = new Date(plan.end_date);
                    return startDate >= startFinancialYear && endDate <= endFinancialYear;
                });

                // Calculate total planned PDs
                const totalPlannedPDs = monthlyPlanningFiltered.reduce((total, plan) => {
                    return total + (parseFloat(plan.planned_hours) || 0);
                }, 0);

                let revenue = totalPlannedPDs * pdCost;

                if (isIndianCurrency) {
                    revenue *= 1;
                } else if (currencyMap.has(currency)) {
                    const exchangeRate = currencyMap.get(currency) ?? 1;
                    revenue *= exchangeRate;
                }
                

                // Search for existing line item
                let lineItem = listData.find((item: any) => item.project_id === project.project_id);

                if (lineItem) {
                    // Update the existing line item
                    lineItem.financial_year = financialYearInput;
                    lineItem.company_code = so.company;
                    lineItem.profit_center = project.profit_center;
                    lineItem.so = so.so;
                    lineItem.project_id = project.project_id;
                    lineItem.project_manager = projectManager;
                    lineItem.last_calculated_on = new Date();
                } else {
                    // Create a new line item
                    lineItem = await this.tm.getTN("functional_area_list").createEntityP(
                        {},
                        "Creation Successful",
                        "Creation Failed",
                        null,
                        "First",
                        false,
                        true,
                        false
                    );

                    // Populate the new line item
                    lineItem.financial_year = financialYearInput;
                    lineItem.company_code = so.company;
                    lineItem.profit_center = project.profit_center;
                    lineItem.so = so.so;
                    lineItem.project_id = project.project_id;
                    lineItem.project_manager = projectManager;
                    lineItem.last_calculated_on = new Date();
                }

                // Create child line items in r_functional_child
                if (so.r_functional_area && so.r_functional_area.length > 0) {
                    for (let funcArea of so.r_functional_area) {
                        let funcLineItem;
                        await lineItem.r_functional_child.fetch()
                        // Search for an existing functional child item
                        if (lineItem.r_functional_child && lineItem.r_functional_child.length > 0) {
                            funcLineItem = lineItem.r_functional_child.find(
                                (child: any) => child.functional_area === funcArea.functional_area
                            );
                        }
                
                        if (funcLineItem) {
                            // Update the existing functional child item
                            funcLineItem.revenue = ((revenue * (parseFloat(funcArea.percentage) || 0)) / 100).toFixed(2);
                            console.log(`Updated functional child: Area=${funcLineItem.functional_area}, Revenue=${funcLineItem.revenue}`);
                        } else {
                            // Create a new functional child item if not found
                            funcLineItem = await lineItem.r_functional_child.newEntityP();
                
                            // Populate the new functional child line item data
                            funcLineItem.functional_area = funcArea.functional_area;
                
                            // Lookup functional_area_name using functionalAreaMap
                            funcLineItem.functional_area_name = functionalAreaMap[funcArea.functional_area] || "Unknown";
                
                            // Calculate revenue percentage
                            const percentage = parseFloat(funcArea.percentage) || 0;
                            funcLineItem.revenue = ((revenue * percentage) / 100).toFixed(2);
                
                            console.log(`Created functional child: Area=${funcLineItem.functional_area}, Name=${funcLineItem.functional_area_name}, Revenue=${funcLineItem.revenue}`);
                        }
                    }
                }
                
            }
        }
        
    }




}
