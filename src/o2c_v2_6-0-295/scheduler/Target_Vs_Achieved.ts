import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloTransaction } from 'kloBo/KloTransaction'

export class Target_Vs_Achieved extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let txn: KloTransaction = this.eventContext.getTxn();
                let logs: string[] = []; // collect all messages

                try {
                    // get current financial year (April - March)
                    const today = new Date();
                    let startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
                    let endYear = startYear + 1;
                    const financialYearInput = `${startYear}-${endYear}`;

                    const startFinancialYear = new Date(startYear, 3, 1); // April 1
                    const endFinancialYear = new Date(endYear, 2, 31);   // March 31

                    // fetch project data and currency rates
                    let [projectList, currencyRate] = await Promise.all([
                        txn.getExecutedQuery("d_o2c_project_header", {
                            loadAll: true,
                            partialSelect: ["so_id", "project_id", "profit_center"],
                            expandAll: "r_monthly_planning,r_project_so,r_project_so/r_so_attachment,r_project_so/r_profit_center"
                        }),
                        txn.getExecutedQuery("d_o2c_exchange_rate", {
                            loadAll: true,
                            partialSelect: ["currency_rate", "currency_code"]
                        })
                    ]);

                    if (!projectList || !currencyRate) {
                        logs.push("ERROR: No data found for projects or currency rates.");
                        res(logs.join("\n"));
                        return;
                    }

                    let currencyMap = new Map(currencyRate.map(rate => [rate.currency_code, parseFloat(rate.currency_rate)]));
                    let internalDB: any[] = [];

                    // loop through projects
                    for (let project of projectList) {
                        const profitCenter = project.profit_center;

                        // loop through SOs
                        for (let so of project.r_project_so) {
                            if (so.type !== "SO" && so.type !== "PS") continue;

                            const currency = so.currency;
                            const isIndianCurrency = currency === "INR";
                            const crRates = so.r_so_attachment.map((a: any) => parseFloat(a.cr_rate)).filter(v => !isNaN(v));

                            if (crRates.length === 0) {
                                logs.push(`WARNING: No CR rate found for SO ${so.so_id}`);
                                continue;
                            }

                            const pdCost = crRates.reduce((sum, rate) => sum + rate, 0) / crRates.length;

                            let projectManager = so.r_profit_center.find(pc => pc.profit_center === profitCenter)?.project_manager;
                            if (!projectManager) {
                                logs.push(`WARNING: No project manager found for profit center ${profitCenter}, SO ${so.so_id}`);
                                continue;
                            }

                            // filter planning data inside financial year
                            const monthlyPlanningFiltered = project.r_monthly_planning.filter((plan: any) => {
                                const startDate = new Date(plan.start_date);
                                const endDate = new Date(plan.end_date);
                                return startDate >= startFinancialYear && endDate <= endFinancialYear;
                            });

                            if (monthlyPlanningFiltered.length === 0) {
                                logs.push(`INFO: No planning data inside financial year for project ${project.project_id}`);
                            }

                            // loop through monthly plans
                            for (let plan of monthlyPlanningFiltered) {
                                const achievedMonth = new Date(plan.start_date).toLocaleString("default", { month: "short" });

                                // find existing record in internal DB
                                let existingLineItem = internalDB.find(item =>
                                    item.profit_center === profitCenter &&
                                    item.project_manager === projectManager &&
                                    item.achieved_month === achievedMonth
                                );

                                // if not found, create new one
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
                                if (isNaN(plannedHours)) {
                                    logs.push(`WARNING: Planned hours invalid for project ${project.project_id}, skipping.`);
                                    continue;
                                }

                                let revenue = plannedHours * pdCost;

                                // convert currency if not INR
                                if (!isIndianCurrency && currencyMap.has(currency)) {
                                    const exchangeRate = currencyMap.get(currency) ?? 1;
                                    revenue *= exchangeRate;
                                }

                                // assign revenue
                                if (isIndianCurrency) {
                                    existingLineItem.indian_revenue += revenue;
                                } else {
                                    existingLineItem.abroad_revenue += revenue;
                                }

                                // round values
                                existingLineItem.indian_revenue = parseFloat(existingLineItem.indian_revenue.toFixed(3));
                                existingLineItem.abroad_revenue = parseFloat(existingLineItem.abroad_revenue.toFixed(3));
                                existingLineItem.total_revenue = parseFloat(
                                    (existingLineItem.indian_revenue + existingLineItem.abroad_revenue).toFixed(3)
                                );
                            }
                        }
                    }

                    // convert to lakhs
                    internalDB = this.convertRevenueToLakhs(internalDB);

                    // update summary table
                    await this.updatingDataOnServer(txn, financialYearInput, internalDB, logs);

                    await txn.commitP();
                    logs.push("SUCCESS: Revenue Scheduler completed successfully");
                    res(logs.join("\n"));
                } catch (error: any) {
                    logs.push("ERROR in Revenue Scheduler: " + (error?.message || error));
                    res(logs.join("\n"));
                }
            }, 30000); // run after 30 seconds
        });
    }

    // helper fn to convert values to lakhs
    public convertRevenueToLakhs(internalDB) {
        internalDB.forEach(item => {
            item.indian_revenue = parseFloat((item.indian_revenue / 100000).toFixed(3));
            item.abroad_revenue = parseFloat((item.abroad_revenue / 100000).toFixed(3));
            item.total_revenue = parseFloat((item.indian_revenue + item.abroad_revenue).toFixed(3));
        });
        return internalDB;
    }

    // update back to DB
    public async updatingDataOnServer(txn: KloTransaction, financialYearInput, internalDB, logs: string[]) {
        try {
            let dbList = await txn.getExecutedQuery("q_o2c_target_vs_achieved", {
                loadAll: true,
                given_year: financialYearInput
            });

            if (!dbList || dbList.length === 0) {
                logs.push("INFO: No data found in dbList for the given financial year.");
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

        } catch (error: any) {
            logs.push("ERROR while updating data on the server: " + (error?.message || error));
        }
    }
}
