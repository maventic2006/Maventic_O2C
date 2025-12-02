import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloTransaction } from 'kloBo/KloTransaction'

export class Pds_Contribution extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let txn: KloTransaction = this.eventContext.getTxn();
                let logs: string[] = [];

                try {
                    // get financial year from system date
                    const today = new Date();
                    let startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
                    let endYear = startYear + 1;
                    const financialYearInput = `${startYear}-${endYear}`;

                    const currentDate = new Date();
                    const currentDay = currentDate.getDate();

                    // Decide which month to take (<=10 → 2 months back, else last month)
                    let achievedMonthIndex = currentDay <= 10 ? currentDate.getMonth() - 2 : currentDate.getMonth() - 1;
                    if (achievedMonthIndex < 0) achievedMonthIndex += 12;

                    const achievedMonth = new Date(currentDate.getFullYear(), achievedMonthIndex, 1)
                        .toLocaleString('default', { month: 'short' });

                    logs.push(`INFO: Scheduler running for FY ${financialYearInput}, Month: ${achievedMonth}`);

                    // Fetch profit centers
                    const profitCenterList = await txn.getExecutedQuery('d_o2c_profit_centre', {
                        loadAll: true,
                        partialSelect: ['profit_center', 'company_code']
                    });

                    if (!profitCenterList?.length) {
                        logs.push("WARNING: No profit center data found.");
                        res(logs.join("\n"));
                        return;
                    }

                    // Fetch designation master
                    const designationMaster = await txn.getExecutedQuery('d_o2c_designation_master', {
                        loadAll: true,
                        partialSelect: ['designation_id', 'name']
                    });

                    const designationMap = new Map<string, string>();
                    for (const designation of designationMaster) {
                        designationMap.set(designation.designation_id, designation.name);
                    }

                    // Loop profit centers
                    for (const { profit_center, company_code } of profitCenterList) {
                        const managerData = await txn.getExecutedQuery('q_timesheet_line_manager', {
                            loadAll: true,
                            company_code,
                            profit_centre: profit_center
                        });

                        for (const { employee_id } of managerData) {
                            const tableData = await txn.getExecutedQuery('q_o2c_pds_contribution1', {
                                loadAll: true,
                                financial_year: financialYearInput,
                                achieved_month: achievedMonth,
                                project_manager: employee_id,
                                profit_center,
                                company_code,
                            });

                            if (!tableData?.length) continue;

                            const employeeList = await txn.getExecutedQuery('q_o2c_pds_contribution', {
                                loadAll: true,
                                project_manager: employee_id,
                                profit_center,
                                company_code,
                            });

                            const officeCalendar = await txn.getExecutedQuery('d_o2c_office_calendar', {
                                loadAll: true,
                                office_calendar_id: "MBLR"
                            });

                            const totalRevenue = await txn.getExecutedQuery("q_o2c_target_vs_achieved", {
                                loadAll: true,
                                project_manager: employee_id,
                                achieved_month: achievedMonth,
                                profit_center,
                                financial_year: financialYearInput,
                            });

                            let totalAchievedRevenue = 0;
                            for (const revenue of totalRevenue) {
                                totalAchievedRevenue += revenue.total_revenue ? parseFloat(revenue.total_revenue) : 0;
                            }
                            totalAchievedRevenue *= 100000;

                            // find start & end date of achieved month
                            const achievedDateMonthIndex = new Date(Date.parse(achievedMonth + " 1")).getMonth();
                            let achievedYear = currentDate.getFullYear();
                            if (achievedDateMonthIndex > currentDate.getMonth()) achievedYear -= 1;

                            const start_date = new Date(achievedYear, achievedDateMonthIndex, 1);
                            const end_date = new Date(achievedYear, achievedDateMonthIndex + 1, 0);

                            const totalNumberOfLeaves = await this.onCountingMonthlyProfitCenterLeaves(
                                txn, start_date, end_date, profit_center, employee_id
                            );

                            const pdsData = await this.onCalculatingPds(
                                txn, profit_center, achievedMonth, financialYearInput, employee_id
                            );

                            tableData[0].pre_sales_project_pd = pdsData.preSalesProjectPD;
                            tableData[0].internal_project_pd = pdsData.internalProjectPD;
                            tableData[0].training_project_pd = pdsData.trainingProjectPD;
                            tableData[0].project_without_bill = pdsData.projectWithoutBillPD;
                            tableData[0].billable_days_india = pdsData.indianPDs;
                            tableData[0].billable_days_abroad = pdsData.abroadPDs;

                            const monthNames = [
                                "january", "february", "march", "april", "may", "june",
                                "july", "august", "september", "october", "november", "december"
                            ];
                            const workingDaysField = `${monthNames[achievedMonthIndex]}_working_days`;
                            const workingDays = officeCalendar[0][workingDaysField] || 0;

                            // Employee calculations
                            let totalPermanentEmployees = 0;
                            let totalContractualEmployees = 0;
                            let totalTraineeEmployees = 0;
                            let provisionalEmployees = 0;
                            let experiencedJoined = 0;
                            let traineeJoined = 0;
                            let totalEmployeesLeft = 0;

                            const activeEmployees = employeeList.filter(emp => emp.is_active === true);

                            for (const employee of activeEmployees) {
                                await employee.r_o2c_emp_designation.fetch();

                                const hasExcludedDesignation = employee.r_o2c_emp_designation.some((desig: any) =>
                                    ['TEAM_HEAD', 'TOP_MANAGEMENT'].includes(designationMap.get(desig.designation))
                                );
                                if (hasExcludedDesignation) continue;

                                const joiningDate = new Date(employee.joining_date);
                                const lastWorkingDay = employee.last_working_day ? new Date(employee.last_working_day) : null;

                                if (joiningDate.getFullYear() === currentDate.getFullYear() &&
                                    joiningDate.getMonth() === achievedMonthIndex) {
                                    if (employee.type === 'T02') experiencedJoined++;
                                    if (employee.type === 'T01' && employee.is_fresher === true) traineeJoined++;
                                }

                                if (lastWorkingDay &&
                                    lastWorkingDay.getFullYear() === currentDate.getFullYear() &&
                                    lastWorkingDay.getMonth() === achievedMonthIndex) {
                                    totalEmployeesLeft++;
                                }

                                if (employee.type === 'T03') totalContractualEmployees++;
                                if (employee.type === 'T02') totalPermanentEmployees++;
                                if (employee.type === 'T01') {
                                    if (employee.is_fresher === true) {
                                        totalTraineeEmployees++;
                                    } else {
                                        provisionalEmployees++;
                                    }
                                }
                            }

                            const totalHeadCount = totalPermanentEmployees + totalContractualEmployees + totalTraineeEmployees + provisionalEmployees;
                            const availableDays = (
                                (totalPermanentEmployees + totalContractualEmployees) * workingDays
                            ) - totalNumberOfLeaves;

                            tableData[0].total_head_count = totalHeadCount;
                            tableData[0].employee_count = totalPermanentEmployees;
                            tableData[0].trainee_count = totalTraineeEmployees;
                            tableData[0].provisional_employee_count = provisionalEmployees;
                            tableData[0].contract_employee_count = totalContractualEmployees;
                            tableData[0].total_leaves = totalNumberOfLeaves;
                            tableData[0].working_days = workingDays;
                            tableData[0].available_days = availableDays;

                            tableData[0].experienced_joiners = experiencedJoined;
                            tableData[0].fresher_joiners = traineeJoined;
                            tableData[0].employees_exited = totalEmployeesLeft;

                            const benchDays = (
                                availableDays - (
                                    parseFloat(tableData[0].billable_days_india || 0) +
                                    parseFloat(tableData[0].billable_days_abroad || 0) +
                                    parseFloat(tableData[0].internal_project_pd || 0) +
                                    parseFloat(tableData[0].pre_sales_project_pd || 0) +
                                    parseFloat(tableData[0].training_project_pd || 0)
                                )
                            ).toFixed(2);
                            tableData[0].bench_days = benchDays;

                            const totalNonBillablePDs = (
                                parseFloat(tableData[0].pre_sales_project_pd || 0) +
                                parseFloat(tableData[0].internal_project_pd || 0) +
                                parseFloat(tableData[0].training_project_pd || 0)
                            ).toFixed(2);
                            tableData[0].total_non_billable_pds = totalNonBillablePDs;

                            const totalBillableDays = parseFloat(tableData[0].billable_days_india) + parseFloat(tableData[0].billable_days_abroad);
                            tableData[0].avg_billable_rate_inr = totalBillableDays > 0
                                ? (totalAchievedRevenue / totalBillableDays).toFixed(2)
                                : 0;

                            const availableDaysFloat = parseFloat(tableData[0].available_days);
                            tableData[0].avg_effective_billable_rate = availableDaysFloat > 0
                                ? (totalAchievedRevenue / availableDaysFloat).toFixed(2)
                                : 0;

                            tableData[0].non_billable_consumption =
                                parseFloat(tableData[0].avg_billable_rate_inr) > 0 &&
                                    tableData[0].bench_days != null &&
                                    tableData[0].total_non_billable_pds != null
                                    ? (
                                        parseFloat(tableData[0].avg_billable_rate_inr) *
                                        (parseFloat(tableData[0].bench_days) + parseFloat(tableData[0].total_non_billable_pds))
                                    ).toFixed(2)
                                    : 0;

                            logs.push(`SUCCESS: Updated data for Profit Center ${profit_center}, Manager ${employee_id}, Month ${achievedMonth}`);
                        }
                    }

                    await txn.commitP();
                    logs.push("Scheduler completed successfully.");
                    res(logs.join("\n"));
                } catch (error: any) {
                    logs.push("ERROR in PDS Contribution Scheduler: " + (error?.message || error));
                    res(logs.join("\n"));
                }
            }, 30000); // run after 30 seconds
        });
    }

    // ================== HELPERS ==================

    public async onCalculatingPds(txn: KloTransaction, profit_center, achievedMonth, financialYearInput, project_manager) {
        const projectList = await txn.getExecutedQuery('d_o2c_project_header', {
            loadAll: true,
            partialSelect: ['so_id', 'project_id', 'profit_center'],
            expandAll: "r_monthly_planning,r_project_so,r_project_so/r_so_attachment,r_project_so/r_profit_center"
        });

        // Initialize counters
        let indianPDs = 0;
        let abroadPDs = 0;
        let preSalesProjectPD = 0;
        let internalProjectPD = 0;
        let trainingProjectPD = 0;
        let projectWithoutBillPD = 0;

        // Parse financial year start and end dates
        const [startYear, endYear] = financialYearInput.split('-').map(Number);
        const financialYearStart = new Date(startYear, 3, 1); // 1 Apr of start year
        const financialYearEnd = new Date(endYear, 2, 31);    // 31 Mar of end year

        // Filter projects based on:
        // - profit_center match
        // - AND matching project_manager in the primary_profit_center line
        const filteredProjects = projectList.filter(project => {
            // Check profit_center first
            if (project.profit_center !== profit_center) return false;

            const projectSO = project.r_project_so?.[0];
            if (!projectSO || !projectSO.r_profit_center) return false;

            // Find the line item where primary_profit_center === true
            const primaryProfitLine = projectSO.r_profit_center.find(p => p.primary_profit_center === true);
            if (!primaryProfitLine) return false;

            // Check if project_manager matches
            return primaryProfitLine.project_manager === project_manager;
        });

        // Iterate through filtered projects
        filteredProjects.forEach(project => {
            const projectSO = project.r_project_so[0];
            const projectType = projectSO?.type;
            const isIndian = projectSO?.currency === 'INR';

            project.r_monthly_planning.forEach(plan => {
                const startDate = new Date(plan.start_date);

                const isInMonth = startDate.toLocaleString('default', { month: 'short' }) === achievedMonth;
                const isInYear = startDate >= financialYearStart && startDate <= financialYearEnd;

                if (isInMonth && isInYear && (projectType === 'SO' || projectType === 'PS')) {
                    if (isIndian) {
                        indianPDs += parseFloat(plan.planned_hours);
                    } else {
                        abroadPDs += parseFloat(plan.planned_hours);
                    }
                }

                if (isInMonth && isInYear) {
                    if (projectType === 'PSL') {
                        preSalesProjectPD += parseFloat(plan.planned_hours);
                    } else if (projectType === 'ISP') {
                        internalProjectPD += parseFloat(plan.planned_hours);
                    } else if (projectType === 'ETR') {
                        trainingProjectPD += parseFloat(plan.planned_hours);
                    } else if (projectType === 'NBS') {
                        projectWithoutBillPD += parseFloat(plan.planned_hours);
                    }
                }
            });
        });

        // Fix values to 2 decimal places
        return {
            indianPDs: parseFloat(indianPDs.toFixed(2)),
            abroadPDs: parseFloat(abroadPDs.toFixed(2)),
            preSalesProjectPD: parseFloat(preSalesProjectPD.toFixed(2)),
            internalProjectPD: parseFloat(internalProjectPD.toFixed(2)),
            trainingProjectPD: parseFloat(trainingProjectPD.toFixed(2)),
            projectWithoutBillPD: parseFloat(projectWithoutBillPD.toFixed(2))
        };
    }

    public async onCountingMonthlyProfitCenterLeaves(txn: KloTransaction, start_date: Date, end_date: Date, profit_center: string, project_manager: string) {
        const leaveList = await txn.getExecutedQuery('q_timesheet_leave', {
            loadAll: true,
            profit_centre: profit_center,
            start_date: start_date,
            end_date: end_date,
            project_manager
        });

        const holidayList = await txn.getExecutedQuery('d_o2c_holiday_calendar', {
            loadAll: true,
            holiday_calender_id: "MBLR",
            partialSelect: ['holiday_date']
        });

        const holidays = holidayList.map(holiday => new Date(holiday.holiday_date).getTime());
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        let totalNumberLeaves = 0;

        for (const leave of leaveList) {
            const leaveStartDate = new Date(leave.start_date);
            const leaveEndDate = new Date(leave.end_date);

            if (leaveStartDate >= startDate && leaveEndDate <= endDate) {
                // Scenario 1: Leave falls entirely within the month
                totalNumberLeaves += parseFloat(leave.no_of_days);
            } else {
                // Scenario 2 & 3: Partial overlap
                const effectiveStartDate = leaveStartDate < startDate ? startDate : leaveStartDate;
                const effectiveEndDate = leaveEndDate > endDate ? endDate : leaveEndDate;

                let daysCount = 0;
                for (let date = new Date(effectiveStartDate); date <= effectiveEndDate; date.setDate(date.getDate() + 1)) {
                    const dayOfWeek = date.getDay();
                    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                    const isHoliday = holidays.includes(date.getTime());

                    if (!isWeekend && !isHoliday) {
                        daysCount++;
                    }
                }

                // Adjust for half-day leaves
                if (leave.half_day_startdate && effectiveStartDate.getTime() === leaveStartDate.getTime()) {
                    daysCount -= 0.5;
                }
                if (leave.half_day_enddate && effectiveEndDate.getTime() === leaveEndDate.getTime()) {
                    daysCount -= 0.5;
                }

                totalNumberLeaves += daysCount;
            }
        }

        return totalNumberLeaves;
    }
}
