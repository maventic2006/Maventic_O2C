import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_func_summary_table")
export default class p_func_summary_table extends KloController {

    /*public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }*/

    public async onGenerateData() {
        const financialYearInput = prompt("Please enter the financial year (e.g., 2024-2025):");
        if (!financialYearInput || !financialYearInput.match(/^\d{4}-\d{4}$/)) {
            console.log("Invalid financial year format.");
            return;
        }

        let tableData = await this.transaction.getExecutedQuery('d_functional_area_report', {
            loadAll: true,
            expandAll: "r_functional_child"
        });

        let summaryDB = [];

        // Build the internal DB (summaryDB)
        for (let i = 0; i < tableData.length; i++) {
            const currentLine = tableData[i];

            const keyScenario = {
                project_manager: currentLine.project_manager,
                company_code: currentLine.company_code,
                profit_center: currentLine.profit_center,
                financial_year: currentLine.financial_year
            };

            if (currentLine.financial_year !== financialYearInput) continue;

            if (currentLine.r_functional_child && Array.isArray(currentLine.r_functional_child)) {
                for (let child of currentLine.r_functional_child) {
                    const functionalAreaName = (child.functional_area_name || "N/A").trim().toLowerCase();
                    const revenueValue = parseFloat(child.revenue || 0);

                    let existingEntry = summaryDB.find(item =>
                        item.project_manager === keyScenario.project_manager &&
                        item.company_code === keyScenario.company_code &&
                        item.profit_center === keyScenario.profit_center &&
                        item.financial_year === keyScenario.financial_year &&
                        item.functional_area.trim().toLowerCase() === functionalAreaName
                    );

                    if (existingEntry) {
                        existingEntry.revenue = parseFloat(existingEntry.revenue) + revenueValue;
                    } else {
                        summaryDB.push({
                            project_manager: keyScenario.project_manager,
                            company_code: keyScenario.company_code,
                            profit_center: keyScenario.profit_center,
                            financial_year: keyScenario.financial_year,
                            functional_area: child.functional_area_name,
                            revenue: revenueValue
                        });
                    }
                }
            }
        }

        console.log("Internal Summary Report:", summaryDB);

        // Fetch existing data from the DB
        let dbData = await this.tm.getTN("functional_summary_table_list").getData();

        for (let summaryItem of summaryDB) {
            const { project_manager, company_code, profit_center, financial_year, functional_area, revenue } = summaryItem;

            // Search for a matching line item in dbData
            let existingDBEntry = dbData.find(item =>
                item.project_manager === project_manager &&
                item.company_code === company_code &&
                item.profit_center === profit_center &&
                item.financial_year === financial_year &&
                item.functional_area.trim().toLowerCase() === functional_area.trim().toLowerCase()
            );

            if (existingDBEntry) {
                // Update the revenue and last_calculated_on for existing item
                existingDBEntry.revenue = parseFloat(revenue);
                existingDBEntry.last_calculated_on = new Date();
            } else {
                // Create a new line item if no match is found
                let newEntry = await this.tm.getTN("functional_summary_table_list").createEntityP(
                    {},
                    "Creation Successful",
                    "Creation Failed",
                    null,
                    "First",
                    false,
                    true,
                    false
                );

                // Assign values to the new entry
                newEntry.project_manager = project_manager;
                newEntry.company_code = company_code;
                newEntry.profit_center = profit_center;
                newEntry.financial_year = financial_year;
                newEntry.functional_area = functional_area;
                newEntry.revenue = parseFloat(revenue);
                newEntry.last_calculated_on = new Date();
            }
        }

        console.log("Updated Database Data:", dbData);
    }



}