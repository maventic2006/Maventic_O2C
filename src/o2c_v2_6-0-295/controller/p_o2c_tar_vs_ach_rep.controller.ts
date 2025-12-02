import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_tar_vs_ach_rep")
export default class p_o2c_tar_vs_ach_rep extends KloController {

    public async onPageEnter() {
        this.tm.getTN("chart_bar_other").setData(null);
        this.tm.getTN("chart_line_other").setData(null);
        this.tm.getTN("progress_bar").setData(null);
        this.tm.getTN("table_other").setData(null);
        this.tm.getTN("table_view").setData(false);
        this.tm.getTN("role").setData(null);
        await this.tm.getTN("selected_pc").setData(null);

        let searchData = await this.tm.getTN("screen_search").getData();
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

        searchData.financial_year = financialYear;
        searchData.achieved_month = achievedMonth;

        searchData.profit_center = Array.from(PCset)[0];
        if (userRole == "MANAGER") {
            searchData.project_manager = userID.toUpperCase();
        }
        await this.onAfterSearch();
    }


    public async onAfterSearch() {
        let searchData = await this.tm.getTN("screen_search").getData();

        let date = new Date(searchData.financial_year);
        let year = date.getFullYear();
        let financialYear = `${year}-${year + 1}`;

        if (
            searchData.project_manager == null ||
            searchData.project_manager == undefined ||
            searchData.project_manager == ""
        ) {
            this.tm.getTN("chart_bar_other").setData(null);
            this.tm.getTN("chart_line_other").setData(null);
            this.tm.getTN("progress_bar").setData(null);

            let headerTargets = await this.transaction.getExecutedQuery("q_so_target", {
                target_type: "Delivery",
                target_fy: financialYear,
                profit_center: searchData.profit_center,
                loadAll: true,
            });

            let monthlyTargets = await this.transaction.getExecutedQuery("d_pc_trgt_mnthly_itm", {
                header_id: headerTargets[0].header_id,
                target_type: "Delivery",
                loadAll: true,
            });

            let overallTarget = parseFloat(headerTargets[0]?.overall_target || 0);
            overallTarget = overallTarget / 100000;

            const monthNames = [
                "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
            ];

            let achievedMonthlyDataList = await this.transaction.getExecutedQuery("q_o2c_target_vs_achieved", {
                loadAll: true,
                achieved_month: searchData.achieved_month,
                profit_center: searchData.profit_center,
                financial_year: financialYear,
            });
            let prepareTableList = await this.transaction.getExecutedQuery("q_o2c_target_vs_achieved", {
                loadAll: true,
                achieved_month: searchData.achieved_month,
                profit_center: searchData.profit_center,
                financial_year: financialYear,
            });

            await this.tm.getTN("table_other").setData(prepareTableList);

            let Target = parseFloat(monthlyTargets[0]?.target || 0);
            Target = (Target * overallTarget) / 100;

            let monthlyChartData = [
                {
                    Target: parseFloat(Target.toFixed(3)),
                    Total_Achievement: achievedMonthlyDataList.reduce((acc, item) => acc + parseFloat(item.total_revenue || 0), 0),
                    IND_Achievement: achievedMonthlyDataList.reduce((acc, item) => acc + parseFloat(item.indian_revenue || 0), 0),
                    Abroad_Achievement: achievedMonthlyDataList.reduce((acc, item) => acc + parseFloat(item.abroad_revenue || 0), 0),
                    month: searchData.achieved_month,
                },
            ];

            await this.tm.getTN("chart_bar_other").setData(monthlyChartData);
            await this.tm.getTN("chart_bar_other").refresh();

            let yearlyChartData = [];
            let totalYearlyAchievement = 0;

            for (let month of monthNames) {
                let monthlyData = await this.transaction.getExecutedQuery("q_o2c_target_vs_achieved", {
                    loadAll: true,
                    achieved_month: month,
                    profit_center: searchData.profit_center,
                    financial_year: financialYear,
                });

                if (monthlyData.length > 0) {
                    let totalMonthlyRevenue = monthlyData.reduce(
                        (acc, item) => {
                            acc.total_revenue += parseFloat(item.total_revenue || 0);
                            acc.indian_revenue += parseFloat(item.indian_revenue || 0);
                            acc.abroad_revenue += parseFloat(item.abroad_revenue || 0);
                            return acc;
                        },
                        { total_revenue: 0, indian_revenue: 0, abroad_revenue: 0 }
                    );

                    let matchingTarget = monthlyTargets.find(target => target.month === month);

                    if (matchingTarget) {
                        let monthlyTarget = (parseFloat(matchingTarget.target || 0) * overallTarget) / 100;
                        yearlyChartData.push({
                            Target: parseFloat(monthlyTarget.toFixed(3)),
                            Total_Achievement: totalMonthlyRevenue.total_revenue,
                            IND_Achievement: totalMonthlyRevenue.indian_revenue,
                            Abroad_Achievement: totalMonthlyRevenue.abroad_revenue,
                            month: month,
                        });
                        totalYearlyAchievement += totalMonthlyRevenue.total_revenue;
                    }
                }
            }

            await this.tm.getTN("chart_line_other").setData(yearlyChartData);
            await this.tm.getTN("chart_line_other").refresh();

            let percentageAchievement = ((totalYearlyAchievement / overallTarget) * 100).toFixed(2);
            await this.tm.getTN("progress_bar").setData(percentageAchievement);
        }
        else {

            this.tm.getTN("chart_bar_other").setData(null);
            this.tm.getTN("chart_line_other").setData(null);
            this.tm.getTN("progress_bar").setData(null);

            let headerTargets = await this.transaction.getExecutedQuery("q_so_target", {
                target_type: "Delivery",
                target_fy: financialYear,
                profit_center: searchData.profit_center,
                loadAll: true,
            });

            let monthlyTargets = await this.transaction.getExecutedQuery("d_pc_trgt_mnthly_itm", {
                header_id: headerTargets[0].header_id,
                target_type: "Delivery",
                loadAll: true,
            });

            const deliveryManagerData = await this.transaction.getExecutedQuery('q_delivery_manager_data', {
                loadAll: true,
                project_manager: searchData.project_manager,
                profit_center: searchData.profit_center,
                financial_year: financialYear
            });

            let totalManagerTarget = deliveryManagerData.reduce((acc, item) => acc + parseFloat(item.delivery_target || 0), 0);
            totalManagerTarget = totalManagerTarget / 100000;

            const monthNames = [
                "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
            ];

            let managerYearlyChartData = [];

            for (let month of monthNames) {
                let matchingTarget = monthlyTargets.find(target => target.month === month);
                if (matchingTarget) {
                    let monthTarget = (totalManagerTarget * (parseFloat(matchingTarget.target || 0) / 100));
                    managerYearlyChartData.push({
                        Target: parseFloat(monthTarget.toFixed(3)),
                        month: month,
                    });
                }
            }

            // Calculating monthlyChartData

            let achievedMonthlyDataList = await this.transaction.getExecutedQuery("q_o2c_target_vs_achieved", {
                loadAll: true,
                achieved_month: searchData.achieved_month,
                profit_center: searchData.profit_center,
                financial_year: financialYear,
                project_manager: searchData.project_manager
            });
            await this.tm.getTN("table_other").setData(achievedMonthlyDataList);

            let monthlyChartData = [
                {
                    Target: managerYearlyChartData.find(data => data.month === searchData.achieved_month)?.Target || 0,
                    Total_Achievement: achievedMonthlyDataList[0]?.total_revenue || 0,
                    IND_Achievement: achievedMonthlyDataList[0]?.indian_revenue || 0,
                    Abroad_Achievement: achievedMonthlyDataList[0]?.abroad_revenue || 0,
                    month: searchData.achieved_month,
                },
            ];

            await this.tm.getTN("chart_bar_other").setData(monthlyChartData);
            await this.tm.getTN("chart_bar_other").refresh();


            // Calculating yearlyChartData
            let achievedYearlyDataList = await this.transaction.getExecutedQuery("q_o2c_target_vs_achieved", {
                loadAll: true,
                profit_center: searchData.profit_center,
                financial_year: financialYear,
                project_manager: searchData.project_manager
            });
            let yearlyChartData = [];
            let totalYearlyAchievement = 0;

            for (let i = 0; i < achievedYearlyDataList.length; i++) {
                let currentMonth = achievedYearlyDataList[i].achieved_month;
                let matchingTarget = managerYearlyChartData.find(target => target.month === currentMonth);

                if (matchingTarget) {
                    yearlyChartData.push({
                        Target: parseFloat(matchingTarget.Target || 0),
                        Total_Achievement: parseFloat(achievedYearlyDataList[i].total_revenue || 0),
                        IND_Achievement: parseFloat(achievedYearlyDataList[i].indian_revenue || 0),
                        Abroad_Achievement: parseFloat(achievedYearlyDataList[i].abroad_revenue || 0),
                        month: currentMonth,
                    });

                    totalYearlyAchievement += parseFloat(achievedYearlyDataList[i].total_revenue || 0)
                }
            }

            yearlyChartData.sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

            await this.tm.getTN("chart_line_other").setData(yearlyChartData);
            await this.tm.getTN("chart_line_other").refresh();

            let percentageAchievement = ((totalYearlyAchievement / totalManagerTarget) * 100).toFixed(2);
            await this.tm.getTN("progress_bar").setData(percentageAchievement);
        }

        await this.tm.getTN("screen_search").executeP()

    }

    public async onManagerSearch() {
        let searchData = await this.tm.getTN("screen_search").getData();
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

    public async onPdsContributionNavigation() {
        await this.navTo(({ S: "p_pds_contri_report" }))
    }
    public async onPreviousPageNavigation() {
        await this.navTo(({ S: "p_starting_page" }))
    }
}