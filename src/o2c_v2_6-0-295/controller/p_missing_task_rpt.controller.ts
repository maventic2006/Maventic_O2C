import { KloEntitySet } from 'kloBo_7-2-52';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_business_area } from 'o2c_v2/entity/d_o2c_business_area';
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { calendarworkingdays } from 'o2c_v2/util/calendarworkingdays';
@KloUI5("o2c_v2.controller.p_missing_task_rpt")
let curr_month_task = [], role, user_id, lm, employee_id, profit_center, th_pc;
export default class p_missing_task_rpt extends KloController {

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
        let month = new Date();
        let start_date = new Date(month.getFullYear(), month.getMonth(), 1);
        let end_date = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        await this.tm.getTN("role_other").setData({});
        await this.tm.getTN("grand_total_other").setData({});
        role = (await this.transaction.get$Role()).role_id;
        await this.tm.getTN("role_other").setProperty("roler", role);
        await this.tm.getTN("employee_search").setProperty("month", month)
        if (role == "MANAGER") {
            user_id = (await this.transaction.get$User()).login_id;
            await this.tm.getTN("employee_search").setProperty("line_manager", user_id.toUpperCase());
            lm = user_id.toUpperCase();
        }
        if (role == "TEAM_HEAD") {
            th_pc = await this.tm.getTN("pc_teamhead_list").getData();
            profit_center = th_pc.map(pc => pc.profit_center)
            await this.tm.getTN("employee_search").setProperty("pc_th", profit_center);
        }
        await this.tm.getTN("employee_search").executeP();

        await this.missingTaskReport(start_date, end_date)
    }


    /* Get the missing days if task is assigned for that month
    Starts....*/
    public findMissingTasks(employeeId, start, end) {
        let s_date = new Date(start);
        let e_date = new Date(end);
        // Get all tasks for the specified employee_id, excluding those with task_type "Leave"
        const employeeTasks = curr_month_task.filter(
            item => item.employee_id === employeeId && item.task_type !== "Leave"
        );

        // // Generate all days in the specified month and year
        // const startDate = new Date(year, month - 1, 1); // Start of the month
        // const endDate = new Date(year, month, 0); // End of the month
        const allDays = [];
        for (let day = s_date; day <= e_date; day.setDate(day.getDate() + 1)) {
            allDays.push(new Date(day).toDateString());
        }

        // Collect all days covered by the tasks
        const coveredDays = new Set();
        employeeTasks.forEach(task => {
            const taskStart = new Date(task.task_start_date);
            const taskEnd = new Date(task.task_end_date);
            for (let day = taskStart; day <= taskEnd; day.setDate(day.getDate() + 1)) {
                coveredDays.add(new Date(day).toDateString());
            }
        });

        // Find missing days
        const missingDays = allDays.filter(day => !coveredDays.has(day));

        return this.getMissingTaskRanges(missingDays);
    }
    public getMissingTaskRanges(dates) {
        const ranges = [];

        if (dates.length === 0) {
            return ranges;
        }
        const dateObjects = dates.map(dateStr => new Date(dateStr)).sort((a, b) => a - b);

        let start = dateObjects[0];
        let end = start;

        for (let i = 1; i < dateObjects.length; i++) {
            const currentDate = dateObjects[i];
            // Check if the current date is consecutive with the end date
            if ((currentDate - end) === 86400000) { // 86400000 ms = 1 day
                end = currentDate;
            } else {
                // Push the previous range as an object
                ranges.push({
                    m_start_date: start,
                    m_end_date: end
                });
                start = currentDate;
                end = currentDate;
            }
        }

        // Push the last range
        ranges.push({
            m_start_date: start,
            m_end_date: end
        });

        return ranges;
    }
    //Ends

    //After Search events
    public async onMissingRptSearch() {
        let search_data = await this.tm.getTN("employee_search").getData();
        employee_id = search_data.employee_id;
        lm = search_data.line_manager;
        profit_center = search_data.pc_th || search_data.profit_centre || null;
        if ((profit_center?.length == 0 || profit_center == undefined) && role == "TEAM_HEAD") {
            profit_center = th_pc.map(pc => pc.profit_center);
            await this.tm.getTN("employee_search").setProperty("pc_th", profit_center);
        }
        let start_date = new Date(search_data.month.getFullYear(), search_data.month.getMonth(), 1);
        let end_date = new Date(search_data.month.getFullYear(), search_data.month.getMonth() + 1, 0);
        let total_working_days = search_data.total_working_days;
        if (role === "MANAGER") {
            await this.tm.getTN("employee_search").setProperty("line_manager", user_id.toUpperCase());
            lm = user_id.toUpperCase();
        }
        await this.missingTaskReport(start_date, end_date, total_working_days);
    }

    //Find Missing Task
    public async missingTaskReport(start_date, end_date, total_working_days?) {
        let oBusyDialog = new sap.m.BusyDialog({ text: "Loading..." });
        oBusyDialog.open();
        //Get all employees data
        let all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true, is_active: true, timesheet_not_required: false, line_manager: lm, employee_id: employee_id, profit_centre: profit_center, expandAll: 'r_employee_org' });
        let entire_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, expandAll: 'r_employee_org' });
        // let emp_id_list = all_emp.map(emp => emp.employee_id);

        // Get all task assignment data
        let assignment = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("d_o2c_task_assignment", { loadAll: true });

        // Filter task assignments for the selected period
        // curr_month_task = assignment.filter((task) => task.task_start_date <= end_date && task.task_end_date >= start_date);

        // Filter tasks to include only those whose employee_id exists in all_emp
        curr_month_task = assignment.filter((task) => {
            const isWithinDateRange = task.task_start_date <= end_date && task.task_end_date >= start_date;
            const isEmployeePresent = all_emp.some(emp => emp.employee_id === task.employee_id);
            return isWithinDateRange && isEmployeePresent;
        });
        let curr_month_task_empid = new Set(curr_month_task.map(task => task.employee_id));
        // let curr_month_task_empid_set = new Set(curr_month_task_empid);

        // Employees to whom selected month task is not assigned.
        let curr_month_missing_task_empid = all_emp.filter(emp => !curr_month_task_empid.has(emp.employee_id));

        // Get Missing days for the selected month task assigned 
        let missingDaysofEachEmp = []
        let taskPromises = Array.from(curr_month_task_empid).map(async empId => {
            try {
                let emp_detail = entire_emp.find(emp => emp.employee_id === empId);
                let lm_detail = entire_emp.find(emp => emp_detail.line_manager === emp.employee_id);
                if (emp_detail) {
                    let missing_days = this.findMissingTasks(empId, start_date, end_date);
                    let total = null;

                    for (let day of missing_days) {
                        let w_start_date = new Date(day.m_start_date);
                        let w_end_date = new Date(day.m_end_date);
                        let no_of_days = await calendarworkingdays.fnGetWorkingDayByRange(
                            this, emp_detail.r_employee_org[0]?.business_area, w_start_date, w_end_date
                        );

                        if (no_of_days.length > 0) { // Check if the missing days is weekend or holiday.
                            total += no_of_days.length;

                            missingDaysofEachEmp.push({
                                emp_id: emp_detail.full_name,
                                line_manager: lm_detail.full_name,
                                missingDays: day,
                                working_days: no_of_days.length,
                                total: null // Temporarily set to 0
                            });
                        }
                    }

                    // Update total only for the first entry of the employee
                    const firstEntry = missingDaysofEachEmp.find(emp => emp.emp_id === emp_detail.full_name);
                    if (firstEntry) {
                        firstEntry.total = total; // Add total to the first entry
                    }
                }
            } catch (error) {
                console.error("Error in processing task promises: ", error);
            }
        });


        // Adding the missing month task.. entire month
        const months = ['january_working_days', 'february_working_days', 'march_working_days', 'april_working_days', 'may_working_days', 'june_working_days',
            'july_working_days', 'august_working_days', 'september_working_days', 'october_working_days', 'november_working_days', 'december_working_days'];
        let select_month = start_date.getMonth();

        let missingMonthPromises = curr_month_missing_task_empid.map(async empId => {
            try {
                let businessOfficeCal = <KloEntitySet<d_o2c_business_area>>await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': empId.r_employee_org[0].business_area });
                let officeCalData = await this.transaction.getExecutedQuery("q_office_cal_data", { loadAll: true, office_calendar_id: businessOfficeCal[0].office_calender });

                missingDaysofEachEmp.push({
                    emp_id: empId.full_name,
                    line_manager: entire_emp.find(emp => emp.employee_id === empId.line_manager).full_name,
                    missingDays: { m_start_date: start_date, m_end_date: end_date },
                    working_days: officeCalData[0][months[select_month]],
                    total: officeCalData[0][months[select_month]]
                })
            } catch (error) {
                console.error("Error in processing month promises: ", error);
            }
        })

        // Wait for all promises to resolve
        try {
            await Promise.all([...taskPromises, ...missingMonthPromises]);
        } catch (error) {
            console.error("Error resolving promises: ", error);
        }

        // Sort the final result
        missingDaysofEachEmp.sort((a, b) => a.emp_id.localeCompare(b.emp_id));

        if (total_working_days) {
            missingDaysofEachEmp = missingDaysofEachEmp.filter(emp => emp.total >= total_working_days)
        }
        let grand_total = 0;
        missingDaysofEachEmp.map(item => {
            grand_total += parseFloat(item.total || 0);
        })
        oBusyDialog.close();
        await this.tm.getTN("missing_task_other").setData(missingDaysofEachEmp);
        await this.tm.getTN("grand_total_other").setData(grand_total);

    }


}

//AH
//24-12-24 11:22 pm