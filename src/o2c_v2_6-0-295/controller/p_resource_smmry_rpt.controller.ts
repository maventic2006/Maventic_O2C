import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_so_hdr } from "o2c_v2/entity/d_o2c_so_hdr";
import { d_o2c_task_assignment } from "o2c_v2/entity/d_o2c_task_assignment";
import { d_o2c_timesheet_header } from "o2c_v2/entity_gen/d_o2c_timesheet_header";
import { d_o2c_timesheet_task } from "o2c_v2/entity_gen/d_o2c_timesheet_task";
declare let KloUI5: any;
let previousDate = 0;
let allEmployee;
@KloUI5("o2c_v2.controller.p_resource_smmry_rpt")
export default class p_resource_smmry_rpt extends KloController {

    public async onPageEnter() {

        await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "p_resource_summary");
        await this.getActiveControlById(null, 's_main_table').addStyleClass("custom-grid");

        this.tm.getTN("resource_summary_data").setData({});
        this.tm.getTN("role_visibility").setData({});

        // globally storing employee
        let employee_entity = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true });
        allEmployee = employee_entity;

        // this.tm.getTN("resource_summary_data").setData(data);
        let oBusy = new sap.m.BusyDialog({
            title: "Please Wait",
            text: "Loading..."
        });
        oBusy.open();


        let userId = (await this.transaction.get$User()).login_id;
        // Getting the time sheet booking data..
        let search_data = await this.tm.getTN("search").getData();


        search_data.date = new Date();
        const year = search_data.date.getFullYear();
        search_data.date = new Date(year, 0, 1); // Setting to 1st Jan of current year
        search_data.end_date = new Date(year, 11, 31); // Setting to 31st Dec of current year
        // let userId = "MM0053"


        // let primaryEmployee = []
        // let teamHead = await this.transaction.getExecutedQuery("q_pc_teamhead_check", { team_head: userId, today_date:new Date(), loadAll: true });
        let teamHead = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { team_head: userId, loadAll: true });
        let loginUserOrg = await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: userId, is_primary: true, loadAll: true });
        let employees = [];
        let user_role = await (await this.transaction.get$Role()).role_id;
        if (teamHead.length || user_role == "FINANCE" || user_role == "LEGAL") {
            // let pc_employee = await this.transaction.getExecutedQuery("d_o2c_employee_org", { profit_centre: loginUserOrg[0].profit_centre, loadAll: true });
            let ts_required_emp = await this.transaction.getExecutedQuery("q_emporg_by_profit_ts_requird", { profit_center: loginUserOrg[0].profit_centre, loadAll: true });

            employees = ts_required_emp.map(pc_employee => pc_employee.employee_id); // Getting ts_req_emp employee_id
            // employees.push(userId);
            // let tst_employee = await this.transaction.getExecutedQuery("d_o2c_employee", { line_manager: employees, timesheet_not_required:false, loadAll: true });

            await this.tm.getTN("pc_get_manager").setProperty('profit_centre', loginUserOrg[0].profit_centre);
            await this.tm.getTN("pc_get_manager").executeP();

            await this.tm.getTN("manager_employee").setProperty('profit_center', loginUserOrg[0].profit_centre);
            await this.tm.getTN("manager_employee").executeP();

            search_data.profit_center = loginUserOrg[0].profit_centre;
            this.tm.getTN("role_visibility").setProperty('editable', true);

        } else { // Setting the dropdown value for Manager role
            //     const index = await this.getActiveControlById(null,'s_emp_approve_list');
            let pm_employee = await this.transaction.getExecutedQuery("d_o2c_employee", { line_manager: userId, timesheet_not_required: false, loadAll: true });
            employees = pm_employee.map(pm_employee => pm_employee.employee_id);
            employees.push(userId);

            this.tm.getTN("pc_get_manager").setProperty('profit_centre', loginUserOrg[0]?.profit_centre);
            await this.tm.getTN("pc_get_manager").executeP();

            search_data.project_manager = userId.toUpperCase();
            search_data.profit_center = loginUserOrg[0]?.profit_centre;
            
            if ((await this.transaction.get$Role()).role_id == "ADMIN") {
                this.tm.getTN("role_visibility").setProperty('editable', true);
            }
            else {
                this.tm.getTN("manager_employee").setProperty('employee', userId);
                this.tm.getTN("role_visibility").setProperty('editable', false);
            }
            await this.tm.getTN("manager_employee").executeP();
        }


        const smonth = new Date(year, 0, 1);
        const emonth = new Date(year, 11, 31);
        // Getting all the approved leaves data of the employees which was extracted earlier..
        let leave_entity = await this.transaction.getExecutedQuery('q_resource_summary_leave', { employee_id: employees, leave_status: "Approved", start_date: smonth, end_date: emonth, loadAll: true });
        // const finalData = await this.getEmployeeSummary(employees, smonth, emonth, year, leave_entity);
        const finalData = await this.getEmployeeSummaryWithTotal(employees, smonth, emonth, year, leave_entity)
        this.tm.getTN("resource_summary_data").setData(finalData);

        let table = this.getActiveControlById(null, "s_main_table");

        oBusy.close();
    }

    public async onFilterSearch() {
        let oBusy = new sap.m.BusyDialog({
            title: "Please Wait",
            text: "Loading..."
        });
        oBusy.open();


        // d_o2c_employee_org
        let employee = [];
        let search_data = await this.tm.getTN("search").getData();
        let pc = search_data.profit_center;
        if (pc) {
            // let pc_employee = await this.transaction.getExecutedQuery("d_o2c_employee_org", { profit_centre: pc, loadAll: true });
            let pc_employee = await this.transaction.getExecutedQuery("q_emporg_by_profit_ts_requird", { profit_center: pc, loadAll: true });

            employee = pc_employee.map(pc_employee => pc_employee.employee_id);
        }
        let pm = search_data.project_manager;
        if (pm) {
            let pm_employee = await this.transaction.getExecutedQuery("d_o2c_employee", { line_manager: pm, loadAll: true });
            employee = pm_employee.map(pm_employee => pm_employee.employee_id);
            employee.push(pm);
        }
        let search_emp = search_data.search_emp;
        if (search_emp) {
            let search_employee = await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: search_emp, loadAll: true });
            employee.length = 0;
            employee.push(search_emp);
        }
        // let year = search_data.date;
        // const sDate = new Date(year.getFullYear(), 0, 1); 
        // const eDate = new Date(year.getFullYear(), 11, 31);
        let sDate = new Date(search_data.date.getFullYear(), search_data.date.getMonth(), 1);
        let eDate = new Date(sDate);
        eDate.setMonth(sDate.getMonth() + 12);
        eDate.setDate(0);
        search_data.end_date = eDate;

        let leave_entity = await this.transaction.getExecutedQuery('q_resource_summary_leave', { employee_id: employee, leave_status: "Approved", start_date: sDate, end_date: eDate, loadAll: true });
        // const finalData = await this.getEmployeeSummary(employee, sDate, eDate, year.getFullYear(), leave_entity);
        const finalData = await this.getEmployeeSummaryWithTotal(employee, sDate, eDate, sDate.getFullYear(), leave_entity)
        this.tm.getTN("resource_summary_data").setData(finalData);



        this.arrangeMonth(sDate.getMonth());
        oBusy.close();
    }
    public async onDateChange(oEvent) {
        var oDatePicker = oEvent.getSource();
        var newDate = oDatePicker.getDateValue(); // Get the new selected date

        var sPreviousValue = oEvent.getParameter("previousValue");

        // Update the previous date for the next change
        // previousDate = newDate.getMonth();
    }

    public async arrangeMonth(month) {
        debugger;
        let table = this.getActiveControlById(null, "s_main_table");

        let all_col = table.getColumns();
        const aColumnTitleGroups = table.getAggregation("columnTitleGroup");
        let store_col = [];
        if (previousDate == month)
            return;
        if (previousDate > month) {
            for (let i = 7; i < 7 + ((12 - previousDate + month) * 5); i++) {
                store_col[i - 7] = all_col[i];
            }
            for (let i = 6 + ((12 - previousDate + month) * 5); i >= 7; i--) {
                table.removeColumn(i);
            }
            for (let i = 0; i < store_col.length; i++) {
                table.addColumn(store_col[i]);
            }
        } else {
            for (let i = 7; i < 7 + ((month - previousDate) * 5); i++) {
                store_col[i - 7] = all_col[i];
            }
            for (let i = 6 + ((month - previousDate) * 5); i >= 7; i--) {
                table.removeColumn(i);
            }
            for (let i = 0; i < store_col.length; i++) {
                table.addColumn(store_col[i]);
            }
        }

        previousDate = month;
    }



    public async onProfitCenterChange() {
        let search_data = await this.tm.getTN("search").getData();
        await this.tm.getTN("pc_get_manager").setProperty('profit_centre', search_data.profit_center);
        await this.tm.getTN("pc_get_manager").executeP();

        search_data.project_manager = null;
        search_data.search_emp = null;
    }

    public async onEmpSearch() {
        // let search_data = await this.tm.getTN("search").getData();
        // search_data.project_manager = null;
    }
    public async onProjectManagerSearch() {
        // this.tm.getTN("linemanager_emp_list").setData({});
        // let search_data = await this.tm.getTN("search").getData();
        let search_data = await this.tm.getTN("search").getData();
        await this.tm.getTN("manager_employee").setProperty('employee', search_data.project_manager);
        await this.tm.getTN("manager_employee").executeP();
        search_data.search_emp = null;
    }

    // Nasim Code..
    public async getEmployeeSummary(empIds, smonth, emonth, year, leave_entity) {

        const sDate = smonth;
        const eDate = emonth;

        // Fetch all task assignments for all employees
        let taskAssignment = await this.transaction.getExecutedQuery("d_o2c_task_assignment", { employee_id: empIds, loadAll: true });
        let soHrdEntity = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true });
        let timesheetTaskEntity = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true });
        let timesheetHeaderEntity = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { over_all_status: "Approved", loadAll: true });
        let timesheetBookingEntity = await this.transaction.getExecutedQuery("q_booking_between_dates", { start_date: sDate, end_date: eDate, loadAll: true });

        // Filter tasks within the date range
        // let filteredTasks = taskAssignment.filter(task => {
        //     const taskStart = new Date(task.task_start_date);
        //     const taskEnd = new Date(task.task_end_date);
        //     return taskStart >= smonth && taskEnd <= emonth;
        // });

        // It filters all the task which overlaps in the current year..
        let filteredTasks = taskAssignment.filter(task => {
            const taskStart = new Date(task.task_start_date);
            const taskEnd = new Date(task.task_end_date);
            return taskStart <= emonth && taskEnd >= smonth;
        });


        const projectIds = filteredTasks.map(task => task.project_id);

        // Fetch all SO headers for the relevant projects
        let billableType = ["SO", "PS", "ISP"];
        // 17-12 - URI Long
        // let soHeader = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: projectIds, type: billableType, loadAll: true });
        let soHeader = soHrdEntity.filter(so =>
            projectIds.includes(so.so) && billableType.includes(so.type)
        );
        const soIds = soHeader.map(so => so.so); // Stores all the billable SO ids

        // Filter tasks linked to SO headers
        let finalFilteredTasks = filteredTasks.filter(task => soIds.includes(task.project_id));
        const taskIds = finalFilteredTasks.map(task => task.task_id);

        // Fetch all timesheet tasks for the relevant task IDs
        // 17-12 - URI Long
        // let timesheetTask = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { task_id: taskIds, loadAll: true });
        let timesheetTask = timesheetTaskEntity.filter(task => taskIds.includes(task.task_id));
        const submitIds = timesheetTask.map(task => task.submit_id);

        // Fetch all approved timesheet headers
        // 17-12 - URI Long
        // let timesheetHeader = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { submit_id: submitIds, status: "Approved", loadAll: true });
        let timesheetHeader = timesheetHeaderEntity.filter(timesheetHdr => submitIds.includes(timesheetHdr.submit_id));
        const approvedSubmitIds = timesheetHeader.map(header => header.submit_id);

        // Filter approved tasks
        let approvedTasks = timesheetTask.filter(task => approvedSubmitIds.includes(task.submit_id));
        const approvedTaskIds = approvedTasks.map(task => task.task_id);

        // Fetch all approved timesheet bookings
        // 17-12 - URI Long
        // let timesheetBooking = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", { task_id: approvedTaskIds, loadAll: true });
        let timesheetBooking = timesheetBookingEntity.filter(booking => approvedTaskIds.includes(booking.task_id));
        //////////////////////////////////////////////////////////////////////////
        let nonBillableType = ["NBS", "ETR", "PSL"];
        // let nonBillablesoHeader = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: projectIds, type: nonBillableType, loadAll: true });
        let nonBillablesoHeader = soHrdEntity.filter(so =>
            projectIds.includes(so.so) && nonBillableType.includes(so.type)
        );
        const nonBillablesoIds = nonBillablesoHeader.map(so => so.so);
        let nonBillablefinalFilteredTasks = filteredTasks.filter(task => nonBillablesoIds.includes(task.project_id));
        const nonBillabletaskIds = nonBillablefinalFilteredTasks.map(task => task.task_id);
        // let nonBillabletimesheetTask = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { task_id: nonBillabletaskIds, loadAll: true });
        let nonBillabletimesheetTask = timesheetTaskEntity.filter(task => nonBillabletaskIds.includes(task.task_id));
        const nonBillablesubmitIds = nonBillabletimesheetTask.map(task => task.submit_id);
        // let nonBillabletimesheetHeader = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { submit_id: nonBillablesubmitIds, status: "Approved", loadAll: true });
        let nonBillabletimesheetHeader = timesheetHeaderEntity.filter(timesheetHdr => nonBillablesubmitIds.includes(timesheetHdr.submit_id));
        const nonBillableapprovedSubmitIds = nonBillabletimesheetHeader.map(header => header.submit_id);
        let nonBillableapprovedTasks = nonBillabletimesheetTask.filter(task => nonBillableapprovedSubmitIds.includes(task.submit_id));
        const nonBillableapprovedTaskIds = nonBillableapprovedTasks.map(task => task.task_id);
        // let nonBillabletimesheetBooking = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", { task_id: nonBillableapprovedTaskIds, loadAll: true });
        let nonBillabletimesheetBooking = timesheetBookingEntity.filter(booking => nonBillableapprovedTaskIds.includes(booking.task_id));
        //////////////////////////////////////////////////////////////////////////

        // Fetch holiday data
        let holidayData = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar', { loadAll: true });
        let empOrg_entity = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'is_primary': true, loadAll: true });
        let allOfficeCalendar = await this.transaction.getExecutedQuery('d_o2c_office_calendar', { loadAll: true });
        let allBusinessArea = await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true });

        // Process data for each employee
        const finalData = empIds.map(empid => {

            let leaves = leave_entity.filter(leave => leave.employee_id === empid);
            let empOrg = empOrg_entity.filter(emp => emp.employee_id === empid);
            if (!empOrg || empOrg.length === 0) {
                empOrg = [{ business_area: null, company_code: null }];
            }

            let bsnsArea = empOrg[0].business_area;
            let companyCode = empOrg[0].company_code;

            // Safely get business area details
            let businessArea = allBusinessArea.filter(item => item.business_area === bsnsArea && item.company_code === companyCode);

            // Initialize office calendar and holidays safely
            let officeCalendar = [];
            if (businessArea.length > 0) {
                officeCalendar = allOfficeCalendar.filter(item => item.office_calendar_id === businessArea[0]?.office_calender);
            }

            let finalHoliday = [];
            if (holidayData && holidayData.length > 0) {
                for (let j = 0; j < holidayData.length; j++) {
                    if (officeCalendar.length > 0 && officeCalendar[0]?.holiday_calender_id === holidayData[j]?.holiday_calender_id) {
                        let tempDate = new Date(holidayData[j].holiday_date);
                        finalHoliday.push(tempDate);
                    }
                }
            }

            // Filter bookings, tasks, and assignments for the employee
            const employeeTasks = finalFilteredTasks.filter(task => task.employee_id === empid);
            const employeeTaskIds = employeeTasks.map(task => task.task_id);
            const employeeBookings = timesheetBooking.filter(booking => employeeTaskIds.includes(booking.task_id));

            // Filter non billable bookings, tasks, and assignments for the employee
            const nonBillableEmployeeTasks = nonBillablefinalFilteredTasks.filter(task => task.employee_id === empid);
            const nonBillableEmployeeTaskIds = nonBillableEmployeeTasks.map(task => task.task_id);
            const nonBillableEmployeeBookings = nonBillabletimesheetBooking.filter(booking => nonBillableEmployeeTaskIds.includes(booking.task_id));



            // Group bookings by month and calculate working days
            const monthlyData = {};
            employeeBookings.forEach(booking => {
                const date = new Date(booking.booking_date);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                // if (monthIndex < smonth.getMonth()) {
                //     year = year + 1;
                // }

                if (!monthlyData[month]) {
                    const { workingDays, monthLeaves } = this.getWorkingDaysInMonth(year, monthIndex, finalHoliday, leaves);
                    monthlyData[month] = { Billable: 0, Assigned: 0, Leave: monthLeaves, NonBillable: 0, Total: monthLeaves, newTotal: workingDays };
                }

                let hoursWorked = booking.hours_worked || 0;
                if (hoursWorked >= 8 && hoursWorked <= 10) {
                    hoursWorked = 8;
                }
                const assignHours = booking.assigned_hours || 0;
                monthlyData[month].Billable += hoursWorked / 8;
                monthlyData[month].Assigned += booking.assigned_hours || 0;
                monthlyData[month].Total += ((hoursWorked / 8) + (assignHours / 8));
                // monthlyData[month].Leave += booking.leave_hours || 0;
                // monthlyData[month].Selfstudy += booking.selfstudy_hours || 0;
            });

            // Group Non Billble bookings by month and calculate working days
            nonBillableEmployeeBookings.forEach(booking => {
                const date = new Date(booking.booking_date);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthIndex = date.getMonth();
                const year = date.getFullYear();

                // if (monthIndex < smonth.getMonth()) {
                //     year = year + 1;
                // }

                if (!monthlyData[month]) {
                    const { workingDays, monthLeaves } = this.getWorkingDaysInMonth(year, monthIndex, finalHoliday, leaves);
                    monthlyData[month] = { Billable: 0, Assigned: 0, Leave: monthLeaves, NonBillable: 0, Total: monthLeaves, newTotal: workingDays };
                }

                // Ensure the month is initialized in monthlyData
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        Billable: 0,
                        Assigned: 0,
                        Leave: 0,
                        // Selfstudy: 0,
                        NonBillable: 0,
                        Total: 0
                    };
                }

                let nonBillableHoursWorked = booking.hours_worked || 0;
                if (nonBillableHoursWorked >= 8 && nonBillableHoursWorked <= 10) {
                    nonBillableHoursWorked = 8;
                }
                monthlyData[month].NonBillable += nonBillableHoursWorked / 8;
                monthlyData[month].Total += nonBillableHoursWorked / 8;
            });

            // Calculate totals
            const totalSummary = Object.values(monthlyData).reduce((acc, monthData) => {
                acc.Billable += monthData.Billable;
                acc.Assigned += monthData.Assigned;
                acc.Leave += monthData.Leave;
                acc.NonBillable += monthData.NonBillable;
                acc.Total += monthData.Total;
                acc.newTotal += monthData.newTotal;
                return acc;
            }, { Total: 0, Billable: 0, Assigned: 0, Leave: 0, NonBillable: 0, newTotal: 0 });

            // Construct result for the employee
            let employeeResult = {
                MMID: empid,
                Name: allEmployee.filter(emp => emp.employee_id === empid).length ? allEmployee.filter(function (emp) { return emp.employee_id === empid; })[0].full_name : "", // Replace with dynamic lookup if needed
                Total: totalSummary
            };

            // Add each month's data to the employee result
            for (let month in monthlyData) {
                if (monthlyData.hasOwnProperty(month)) {
                    employeeResult[month] = monthlyData[month];
                }
            }

            return employeeResult;
        });

        return finalData;
    }

    //Aman's revised code..
    public async getEmployeeSummarys(empIds, smonth, emonth, year, leave_entity) {

        const sDate = smonth;
        const eDate = emonth;

        // Fetch all task assignments for all employees
        let taskAssignment = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("d_o2c_task_assignment", { employee_id: empIds, loadAll: true });
        let soHrdEntity = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true });
        let timesheetTaskEntity = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true });
        let timesheetHeaderEntity = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { status: "Approved", loadAll: true });
        let timesheetBookingEntity = await this.transaction.getExecutedQuery("q_booking_between_dates", { start_date: sDate, end_date: eDate, loadAll: true });

        // Filter tasks within the date range
        // let filteredTasks = taskAssignment.filter(task => {
        //     const taskStart = new Date(task.task_start_date);
        //     const taskEnd = new Date(task.task_end_date);
        //     return taskStart >= smonth && taskEnd <= emonth;
        // });

        // It filters all the task which overlaps in the current year..
        let filteredTasks = taskAssignment.filter(task => {
            const taskStart = new Date(task.task_start_date);
            const taskEnd = new Date(task.task_end_date);
            return taskStart <= emonth && taskEnd >= smonth;
        });


        const projectIds = filteredTasks.map(task => task.project_id);

        // Fetch all SO headers for the relevant projects
        let billableType = ["SO", "PS", "ISP"];
        // 17-12 - URI Long
        // let soHeader = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: projectIds, type: billableType, loadAll: true });
        let soHeader = soHrdEntity.filter(so =>
            projectIds.includes(so.so) && billableType.includes(so.type)
        );
        const soIds = soHeader.map(so => so.so); // Stores all the billable SO ids

        // Filter tasks linked to SO headers
        let finalFilteredTasks = filteredTasks.filter(task => soIds.includes(task.project_id));
        const taskIds = finalFilteredTasks.map(task => task.task_id);

        // Fetch all timesheet tasks for the relevant task IDs
        // 17-12 - URI Long
        // let timesheetTask = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { task_id: taskIds, loadAll: true });
        let timesheetTask = timesheetTaskEntity.filter(task => taskIds.includes(task.task_id));
        const submitIds = timesheetTask.map(task => task.submit_id);

        // Fetch all approved timesheet headers
        // 17-12 - URI Long
        // let timesheetHeader = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { submit_id: submitIds, status: "Approved", loadAll: true });

        //revised..
        // let timesheetHeader = timesheetHeaderEntity.filter(timesheetHdr => submitIds.includes(timesheetHdr.submit_id));
        // const approvedSubmitIds = timesheetHeader.map(header => header.submit_id);

        // It filters all the TS which overlaps in the current year..
        let filteredTSHeader = timesheetHeaderEntity.filter(ts => {
            const tsStart = new Date(ts.from_date);
            const tsEnd = new Date(ts.to_date);
            return tsStart <= emonth && tsEnd >= smonth;
        });
        const approvedSubmitIds = filteredTSHeader.map(header => header.submit_id);

        // Filter approved tasks
        let approvedTasks = timesheetTask.filter(task => approvedSubmitIds.includes(task.submit_id));
        const approvedTaskIds = approvedTasks.map(task => task.task_id);

        // Fetch all approved timesheet bookings
        // 17-12 - URI Long
        // let timesheetBooking = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", { task_id: approvedTaskIds, loadAll: true });
        let timesheetBooking = timesheetBookingEntity.filter(booking => approvedTaskIds.includes(booking.task_id));
        //////////////////////////////////////////////////////////////////////////
        let nonBillableType = ["NBS"]
        // let nonBillablesoHeader = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: projectIds, type: nonBillableType, loadAll: true });
        let nonBillablesoHeader = soHrdEntity.filter(so =>
            projectIds.includes(so.so) && nonBillableType.includes(so.type)
        );
        const nonBillablesoIds = nonBillablesoHeader.map(so => so.so);
        let nonBillablefinalFilteredTasks = filteredTasks.filter(task => nonBillablesoIds.includes(task.project_id));
        const nonBillabletaskIds = nonBillablefinalFilteredTasks.map(task => task.task_id);
        // let nonBillabletimesheetTask = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { task_id: nonBillabletaskIds, loadAll: true });
        let nonBillabletimesheetTask = timesheetTaskEntity.filter(task => nonBillabletaskIds.includes(task.task_id));
        const nonBillablesubmitIds = nonBillabletimesheetTask.map(task => task.submit_id);
        // let nonBillabletimesheetHeader = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { submit_id: nonBillablesubmitIds, status: "Approved", loadAll: true });
        let nonBillabletimesheetHeader = timesheetHeaderEntity.filter(timesheetHdr => nonBillablesubmitIds.includes(timesheetHdr.submit_id));
        const nonBillableapprovedSubmitIds = nonBillabletimesheetHeader.map(header => header.submit_id);
        let nonBillableapprovedTasks = nonBillabletimesheetTask.filter(task => nonBillableapprovedSubmitIds.includes(task.submit_id));
        const nonBillableapprovedTaskIds = nonBillableapprovedTasks.map(task => task.task_id);
        // let nonBillabletimesheetBooking = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", { task_id: nonBillableapprovedTaskIds, loadAll: true });
        let nonBillabletimesheetBooking = timesheetBookingEntity.filter(booking => nonBillableapprovedTaskIds.includes(booking.task_id));
        //////////////////////////////////////////////////////////////////////////

        // Fetch holiday data
        let holidayData = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar', { loadAll: true });
        let empOrg_entity = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'is_primary': true, loadAll: true });
        let allOfficeCalendar = await this.transaction.getExecutedQuery('d_o2c_office_calendar', { loadAll: true });
        let allBusinessArea = await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true });

        // Process data for each employee
        const finalData = empIds.map(empid => {

            let leaves = leave_entity.filter(leave => leave.employee_id === empid);
            let empOrg = empOrg_entity.filter(emp => emp.employee_id === empid);
            if (!empOrg || empOrg.length === 0) {
                empOrg = [{ business_area: null, company_code: null }];
            }

            let bsnsArea = empOrg[0].business_area;
            let companyCode = empOrg[0].company_code;

            // Safely get business area details
            let businessArea = allBusinessArea.filter(item => item.business_area === bsnsArea && item.company_code === companyCode);

            // Initialize office calendar and holidays safely
            let officeCalendar = [];
            if (businessArea.length > 0) {
                officeCalendar = allOfficeCalendar.filter(item => item.office_calendar_id === businessArea[0]?.office_calender);
            }

            let finalHoliday = [];
            if (holidayData && holidayData.length > 0) {
                for (let j = 0; j < holidayData.length; j++) {
                    if (officeCalendar.length > 0 && officeCalendar[0]?.holiday_calender_id === holidayData[j]?.holiday_calender_id) {
                        let tempDate = new Date(holidayData[j].holiday_date);
                        finalHoliday.push(tempDate);
                    }
                }
            }

            // Filter bookings, tasks, and assignments for the employee
            const employeeTasks = finalFilteredTasks.filter(task => task.employee_id === empid);
            const employeeTaskIds = employeeTasks.map(task => task.task_id);
            const employeeBookings = timesheetBooking.filter(booking => employeeTaskIds.includes(booking.task_id));

            // Filter non billable bookings, tasks, and assignments for the employee
            const nonBillableEmployeeTasks = nonBillablefinalFilteredTasks.filter(task => task.employee_id === empid);
            const nonBillableEmployeeTaskIds = nonBillableEmployeeTasks.map(task => task.task_id);
            const nonBillableEmployeeBookings = nonBillabletimesheetBooking.filter(booking => nonBillableEmployeeTaskIds.includes(booking.task_id));



            // Group bookings by month and calculate working days
            const monthlyData = {};
            employeeBookings.forEach(booking => {
                const date = new Date(booking.booking_date);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthIndex = date.getMonth();

                if (monthIndex < smonth.getMonth()) {
                    year = year + 1;
                }

                if (!monthlyData[month]) {
                    const { workingDays, monthLeaves } = this.getWorkingDaysInMonth(year, monthIndex, finalHoliday, leaves);
                    monthlyData[month] = { Billable: 0, Assigned: 0, Leave: monthLeaves, NonBillable: 0, Total: monthLeaves, newTotal: workingDays };
                }

                let hoursWorked = booking.hours_worked || 0;
                if (hoursWorked >= 8 && hoursWorked <= 10) {
                    hoursWorked = 8;
                }
                const assignHours = booking.assigned_hours || 0;
                monthlyData[month].Billable += hoursWorked / 8;
                monthlyData[month].Assigned += booking.assigned_hours || 0;
                monthlyData[month].Total += ((hoursWorked / 8) + (assignHours / 8));
                // monthlyData[month].Leave += booking.leave_hours || 0;
                // monthlyData[month].Selfstudy += booking.selfstudy_hours || 0;
            });

            // Group Non Billble bookings by month and calculate working days
            nonBillableEmployeeBookings.forEach(booking => {
                const date = new Date(booking.booking_date);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthIndex = date.getMonth();

                if (monthIndex < smonth.getMonth()) {
                    year = year + 1;
                }

                if (!monthlyData[month]) {
                    const { workingDays, monthLeaves } = this.getWorkingDaysInMonth(year, monthIndex, finalHoliday, leaves);
                    monthlyData[month] = { Billable: 0, Assigned: 0, Leave: monthLeaves, NonBillable: 0, Total: monthLeaves, newTotal: workingDays };
                }

                // Ensure the month is initialized in monthlyData
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        Billable: 0,
                        Assigned: 0,
                        Leave: 0,
                        // Selfstudy: 0,
                        NonBillable: 0,
                        Total: 0
                    };
                }

                let nonBillableHoursWorked = booking.hours_worked || 0;
                if (nonBillableHoursWorked >= 8 && nonBillableHoursWorked <= 10) {
                    nonBillableHoursWorked = 8;
                }
                monthlyData[month].NonBillable += nonBillableHoursWorked / 8;
                monthlyData[month].Total += nonBillableHoursWorked / 8;
            });

            // Calculate totals
            const totalSummary = Object.values(monthlyData).reduce((acc, monthData) => {
                acc.Billable += monthData.Billable;
                acc.Assigned += monthData.Assigned;
                acc.Leave += monthData.Leave;
                acc.NonBillable += monthData.NonBillable;
                acc.Total += monthData.Total;
                acc.newTotal += monthData.newTotal;
                return acc;
            }, { Total: 0, Billable: 0, Assigned: 0, Leave: 0, NonBillable: 0, newTotal: 0 });

            // Construct result for the employee
            let employeeResult = {
                MMID: empid,
                Name: allEmployee.filter(emp => emp.employee_id === empid).length ? allEmployee.filter(function (emp) { return emp.employee_id === empid; })[0].full_name : "", // Replace with dynamic lookup if needed
                Total: totalSummary
            };

            // Add each month's data to the employee result
            for (let month in monthlyData) {
                if (monthlyData.hasOwnProperty(month)) {
                    employeeResult[month] = monthlyData[month];
                }
            }

            return employeeResult;
        });

        return finalData;
    }

    public async getEmployeeSummaryWithTotal(empIds, smonth, emonth, year, leave_entity) {
        // Mock data retrieval (replace with actual API call or database fetch)
        let data = await this.getEmployeeSummary(empIds, smonth, emonth, year, leave_entity);

        // Initialize total row
        const summaryRow = {
            MMID: "Total",
            Name: "Summary",
            Total: {
                Total: 0,
                Billable: 0,
                Assigned: 0,
                Leave: 0,
                NonBillable: 0,
            }
        };

        // Iterate through each employee's data
        for (const employee of data) {
            // Add up total metrics
            for (const [key, value] of Object.entries(employee)) {
                if (key === "Total") {
                    // Aggregate total values
                    for (const metric in value) {
                        summaryRow.Total[metric] += value[metric] || 0;
                    }
                } else if (key !== "MMID" && key !== "Name") {
                    // Ensure the month exists in the summary row
                    if (!summaryRow[key]) {
                        summaryRow[key] = {
                            Total: 0,
                            Billable: 0,
                            Assigned: 0,
                            Leave: 0,
                            NonBillable: 0,
                        };
                    }

                    // Aggregate month-specific metrics
                    for (const metric in value) {
                        summaryRow[key][metric] += value[metric] || 0;
                    }
                }
            }
        }

        // Add the summary row to the data
        data.push(summaryRow);

        return data;
    }

    public getWorkingDaysInMonth(year, month, holidays, leave_entity) {
        let totalDays = new Date(year, month + 1, 0).getDate();
        let weekends = 0;

        // Count weekends (Saturday and Sunday)
        for (let day = 1; day <= totalDays; day++) {
            let date = new Date(year, month, day);
            if (date.getDay() === 0 || date.getDay() === 6) {
                weekends++;
            }
        }

        // Count holidays in the month
        let monthHolidays = holidays.filter(holiday =>
            holiday.getMonth() === month && holiday.getFullYear() === year
        );


        let monthLeaves = leave_entity.reduce((count, leave) => {
            let leaveStart = new Date(leave.start_date);
            let leaveEnd = new Date(leave.end_date);

            // Ensure leave dates are within the target month
            let startDate = new Date(Math.max(new Date(year, month, 1).getTime(), leaveStart.getTime())); // First day of the month or leave start
            let endDate = new Date(Math.min(new Date(year, month + 1, 0).getTime(), leaveEnd.getTime())); // Last day of the month or leave end

            // Check for half-day properties
            let isHalfDayStart = leave.half_day_startdate && startDate.getTime() === leaveStart.getTime();
            let isHalfDayEnd = leave.half_day_enddate && endDate.getTime() === leaveEnd.getTime();

            // Count days within the month, excluding weekends and holidays
            for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
                let isWeekend = day.getDay() === 0 || day.getDay() === 6;
                let isHoliday = holidays.some(holiday =>
                    holiday.getDate() === day.getDate() &&
                    holiday.getMonth() === day.getMonth() &&
                    holiday.getFullYear() === day.getFullYear()
                );

                if (day.getMonth() === month && !isWeekend && !isHoliday) {
                    if (day.getTime() === startDate.getTime() && isHalfDayStart) {
                        count += 0.5; // Add half-day for start date
                    } else if (day.getTime() === endDate.getTime() && isHalfDayEnd) {
                        count += 0.5; // Add half-day for end date
                    } else {
                        count++; // Add full day
                    }
                }
            }
            return count;
        }, 0);

        // Calculate and return total working days
        let workingDays = totalDays - (weekends + monthHolidays.length);

        return { workingDays, monthLeaves };
    }

    // public async getMonthSequence(smonth, emonth) {
    //     const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    //     let startMonthIndex = monthNames.indexOf(smonth);
    //     let endMonthIndex = monthNames.indexOf(emonth);
    //     const months = [];

    //     // Generate the month sequence
    //     if (startMonthIndex <= endMonthIndex) {
    //         // Normal case: no wraparound
    //         for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    //             months.push(monthNames[i]);
    //         }
    //     } else {
    //         // Wraparound case: e.g., October to March
    //         for (let i = startMonthIndex; i < 12; i++) {
    //             months.push(monthNames[i]);
    //         }
    //         for (let i = 0; i <= endMonthIndex; i++) {
    //             months.push(monthNames[i]);
    //         }
    //     }

    //     return months;
    // }
    // Helper function to get the list of months from smonth to emonth
    //     public async getMonthSequence(smonth, emonth) {
    //     const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    //     // Find the indices of the start and end months
    //     let startMonthIndex = monthNames.indexOf(smonth);
    //     let endMonthIndex = monthNames.indexOf(emonth);

    //     // Log to debug
    //     console.log("Start month index:", startMonthIndex);
    //     console.log("End month index:", endMonthIndex);

    //     // Handle invalid month inputs
    //     if (startMonthIndex === -1 || endMonthIndex === -1) {
    //         console.error("Invalid month name(s) provided");
    //         return [];
    //     }

    //     const months = [];

    //     // Generate the month sequence
    //     if (startMonthIndex <= endMonthIndex) {
    //         // Normal case: no wraparound
    //         for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    //             months.push(monthNames[i]);
    //         }
    //     } else {
    //         // Wraparound case: e.g., October to March
    //         for (let i = startMonthIndex; i < 12; i++) {
    //             months.push(monthNames[i]);
    //         }
    //         for (let i = 0; i <= endMonthIndex; i++) {
    //             months.push(monthNames[i]);
    //         }
    //     }

    //     // Log the final months sequence
    //     console.log("Generated month sequence:", months);

    //     return months;
    // }

    // public async getEmployeeSummaryWithTotal(empIds, smonth, emonth, year, leave_entity) {


    //     // Get the list of months from smonth to emonth
    //     // const monthSequence = await this.getMonthSequence(smonth, emonth);

    //     // Mock data retrieval (replace with actual API call or database fetch)
    //     let data = await this.getEmployeeSummary(empIds, smonth, emonth, year, leave_entity);

    //     // Initialize total row
    //     const summaryRow = {
    //         MMID: "Total",
    //         Name: "Summary",
    //         Total: {
    //             Total: 0,
    //             Billable: 0,
    //             Assigned: 0,
    //             Leave: 0,
    //             NonBillable: 0,
    //         }
    //     };

    //     // Iterate through each employee's data
    //     for (const employee of data) {
    //         // Add up total metrics
    //         for (const [key, value] of Object.entries(employee)) {
    //             if (key === "Total") {
    //                 // Aggregate total values
    //                 for (const metric in value) {
    //                     summaryRow.Total[metric] += value[metric] || 0;
    //                 }
    //             } else if (key !== "MMID" && key !== "Name") {
    //                 // Ensure the month exists in the summary row
    //                 if (!summaryRow[key]) {
    //                     summaryRow[key] = {
    //                         Total: 0,
    //                         Billable: 0,
    //                         Assigned: 0,
    //                         Leave: 0,
    //                         NonBillable: 0,
    //                     };
    //                 }

    //                 // Aggregate month-specific metrics for each month in the sequence
    //                 monthSequence.forEach((month) => {
    //                     if (value[month]) {
    //                         for (const metric in value[month]) {
    //                             summaryRow[key][metric] += value[month][metric] || 0;
    //                         }
    //                     }
    //                 });
    //             }
    //         }
    //     }

    //     // Add the summary row to the data
    //     data.push(summaryRow);

    //     return data;
    // }
}