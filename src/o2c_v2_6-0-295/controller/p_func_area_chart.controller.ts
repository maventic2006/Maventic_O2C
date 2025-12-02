import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_func_area_chart")
export default class p_func_area_chart extends KloController {

    public async onPageEnter() {
        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;

        this.tm.getTN("functional_area_list").setData(null);
        this.tm.getTN("chart_bar_other").setData(null);
        this.tm.getTN("table_view_data").setData(null);

        const searchData = await this.tm.getTN("search").getData();
        let emp_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', {
            'employee_id': userID,
            is_primary: true,
            loadAll: true
        });

        const loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
            loadAll: true,
            employee_id: userID,
            active_till: new Date()
        });

        const PCset = new Set(loginOrg.map(org => org.profit_centre));
        searchData.company_code = emp_org[0].company_code;
        searchData.profit_center = Array.from(PCset)[0];

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const financialYearStart = (currentMonth > 3) ? currentYear : (currentMonth === 3 ? currentYear - 1 : currentYear - 1);

        searchData.financial_year = new Date(financialYearStart, 3, 1);
        const financialYearString = `${financialYearStart}-${financialYearStart + 1}`;


        const functionalAreaData = await this.transaction.getExecutedQuery('d_o2c_functional_area', {
            loadAll: true,
            business_area: emp_org[0].business_area,
            partialSelected: ["name", "business_area", "functional_area"]
        });

        const uniqueNamesSet = new Set();
        const functionalAreaArray = [];

        functionalAreaData.forEach((item) => {
            const cleanedName = item.name.replace(/\s+/g, '').toLowerCase();
            if (!uniqueNamesSet.has(cleanedName)) {
                uniqueNamesSet.add(cleanedName);
                functionalAreaArray.push({
                    key: item.name,
                    code: item.functional_area,
                    description: item.name
                });
            }
        });

        let dm = await this.transaction.getExecutedQuery(
            "q_delivery_manager_trgt",
            {
                profit_c: Array.from(PCset)[0],
                loadAll: true,
                partialSelected: ["employee_id", "full_name"],
            }
        );

        await this.tm.getTN("selected_pc").setData(dm);
        this.tm.getTN("functional_area_list").setData(functionalAreaArray);

        let tableData = await this.transaction.getExecutedQuery('d_functional_summary_table', {
            loadAll: true,
            "financial_year": financialYearString,
            "profit_center": searchData.profit_center,
            "company_code": searchData.company_code
        });

        let targetData = await this.transaction.getExecutedQuery('d_pc_trgt_hdr', {
            'target_fy': financialYearString,
            profit_center: Array.from(PCset)[0],
            loadAll: true
        });

        const revenueByFunctionalArea = {};
        functionalAreaArray.forEach(fa => {
            revenueByFunctionalArea[fa.key] = {
                functional_area: fa.key,
                Achieved: 0,
                Target: 0
            };
        });

        const selectedTableData = [];

        tableData.forEach(item => {
            const isMatchingFinancialYear = item.financial_year === financialYearString;
            const isMatchingCompanyCode = item.company_code === emp_org[0].company_code;
            const isMatchingProfitCenter = item.profit_center === Array.from(PCset)[0];
            const functionalAreaMatch = revenueByFunctionalArea[item.functional_area];

            if (isMatchingFinancialYear && isMatchingCompanyCode && isMatchingProfitCenter && functionalAreaMatch) {
                const revenue = parseFloat(item.revenue) || 0;
                revenueByFunctionalArea[item.functional_area].Achieved += revenue;
                selectedTableData.push(item);
            }
        });

        targetData.forEach(target => {
            const targetFunctionalArea = functionalAreaData.find(fa => fa.functional_area === target.functional_area);
            if (targetFunctionalArea) {
                const functionalAreaName = targetFunctionalArea.name;
                if (revenueByFunctionalArea[functionalAreaName]) {
                    revenueByFunctionalArea[functionalAreaName].Target = parseFloat(target.overall_target) || 0;
                }
            }
        });

        const finalRevenueData = Object.values(revenueByFunctionalArea);
        this.tm.getTN("chart_bar_other").setData(finalRevenueData);

        this.tm.getTN("table_view_data").setData(selectedTableData);

        if (userRole == "MANAGER") {
            searchData.project_manager = userID.toUpperCase();
            await this.onAfterSearch()
        }


    }

    public async onAfterSearch() {
        const userID = (await this.transaction.get$User()).login_id;
        this.tm.getTN("chart_bar_other").setData(null);
        this.tm.getTN("table_view_data").setData(null);
        const searchData = await this.tm.getTN("search").getData();
        const functionalAreasList = await this.tm.getTN("functional_area_list").getData();
        const financialYear = new Date(searchData.financial_year).getFullYear();
        let financialYearRange = '';

        financialYearRange = `${financialYear}-${financialYear + 1}`;

        const functionalAreas = (searchData.functional_area && searchData.functional_area.length > 0)
            ? searchData.functional_area
            : functionalAreasList.map(item => item.key);

        const projectManagers = searchData.project_manager ? [searchData.project_manager] : [];
        const functionalAreasSet = new Set(functionalAreas.map(fa => fa.toLowerCase().replace(/\s+/g, '')));
        const projectManagersSet = new Set(projectManagers.map(pm => pm.toLowerCase()));
        let emp_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', {
            'employee_id': userID,
            is_primary: true,
            loadAll: true
        });

        let tableData = await this.transaction.getExecutedQuery('d_functional_summary_table', {
            loadAll: true,
            "financial_year": financialYearRange,
            "profit_center": searchData.profit_center,
            "company_code": searchData.company_code
        });

        let targetData = await this.transaction.getExecutedQuery('d_pc_trgt_hdr', {
            'target_fy': financialYearRange,
            profit_center: searchData.profit_center,
            loadAll: true,
        });

        let functionalAreaData = await this.transaction.getExecutedQuery('d_o2c_functional_area', {
            loadAll: true,
            business_area: emp_org[0].business_area,
            partialSelected: ["name", "functional_area"],
        });

        const functionalAreaMap = {};
        functionalAreaData.forEach(item => {
            const cleanedName = item.name.toLowerCase().replace(/\s+/g, '');
            functionalAreaMap[item.functional_area] = item.name;
        });

        const revenueByFunctionalArea = {};
        functionalAreas.forEach(fa => {
            revenueByFunctionalArea[fa] = {
                functional_area: fa,
                Achieved: 0,
                Target: 0,
            };
        });

        const filteredData = tableData.filter(item => {
            const functionalAreaMatch = functionalAreasSet.has(item.functional_area.toLowerCase().replace(/\s+/g, ''));
            const projectManagerMatch = projectManagersSet.has((item.project_manager || '').toLowerCase());
            return functionalAreaMatch && projectManagerMatch;
        });

        filteredData.forEach(item => {
            const functionalAreaKey = item.functional_area;
            if (revenueByFunctionalArea[functionalAreaKey]) {
                const revenue = parseFloat(item.revenue) || 0;
                revenueByFunctionalArea[functionalAreaKey].Achieved += revenue;
            }
        });

        for (let i = 0; i < targetData.length; i++) {
            const targetFunctionalAreaCode = targetData[i].functional_area;
            const targetFunctionalAreaName = functionalAreaMap[targetFunctionalAreaCode];

            if (targetFunctionalAreaName) {
                const deliveryTargets = await targetData[i].r_delivery_target.fetch();
                deliveryTargets.forEach(target => {
                    const matchingProjectManager = projectManagers.find(pm => pm.toLowerCase() === target.delivery_manager.toLowerCase());
                    if (matchingProjectManager) {
                        const functionalAreaKey = functionalAreas.find(fa => fa.toLowerCase().replace(/\s+/g, '') === targetFunctionalAreaName.toLowerCase().replace(/\s+/g, ''));
                        if (functionalAreaKey && revenueByFunctionalArea[functionalAreaKey]) {
                            revenueByFunctionalArea[functionalAreaKey].Target += parseFloat(target.delivery_target) || 0;
                        }
                    }
                });
            }
        }

        let finalRevenueData = Object.values(revenueByFunctionalArea);
        let finalFilteredTableData = filteredData;

        if (!searchData.functional_area || searchData.functional_area.length === 0) {
            // Only include FAs that have Target or Achieved values
            finalRevenueData = finalRevenueData.filter(item =>
                item.Achieved > 0 || item.Target > 0
            );

            const validFunctionalAreas = new Set(finalRevenueData.map(item => item.functional_area));
            finalFilteredTableData = filteredData.filter(item =>
                validFunctionalAreas.has(item.functional_area)
            );
        }

        this.tm.getTN("chart_bar_other").setData(finalRevenueData);
        this.tm.getTN("table_view_data").setData(finalFilteredTableData);

    }

    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_emp_onboarding_deb" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_o2c_challenges" }))
    }
}