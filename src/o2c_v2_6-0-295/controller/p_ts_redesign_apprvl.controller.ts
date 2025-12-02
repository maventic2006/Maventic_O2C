/** 
    NOTE: Please do not change the order of the function call as the TS is itself complex and if trying to change the order each and
    every functionality needs to be tested without miss. As a developer even I can't point out which functionality will fail after 
    reordering the methods.
*/

import { KloEntitySet } from 'kloBo';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_leave_management } from 'o2c_v2/entity/d_o2c_leave_management';
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { d_o2c_timesheet_time_booking } from 'o2c_v2/entity/d_o2c_timesheet_time_booking';
import { d_o2c_holiday_calendar } from 'o2c_v2/entity_gen/d_o2c_holiday_calendar';
import { d_o2c_timesheet_approver } from 'o2c_v2/entity_gen/d_o2c_timesheet_approver';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
import { d_o2c_ts_comment } from 'o2c_v2/entity_gen/d_o2c_ts_comment';
import { traveltotimesheet } from 'o2c_v2/util/traveltotimesheet';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_ts_redesign_apprvl")
export default class p_ts_redesign_apprvl extends KloController {
    public start_date; // Stores the start date of the selected month
    public end_date; // Stores the end date of the selected month
    public curr_month_ts = []; // Stores the selected month TS data after restructuring in the model...
    public fixedColumnCount = 5; // Change this value if the fixedColumnCount is changed in UI.
    public userid; // Stores the logged in user id. Also gets replaced after selecting the Mentees.
    public thisUser; // Stores the logged in user employee object..
    public time_booking = []; // Stores the Day wise data of the TS fetched from DB....
    public ts_comment = []; // Stores the entire comment maintained in TS....
    public curr_month_assigned_task_detail; // Stores the curr month assigned detail data...
    public taskCommentsMap; // Map to store the comments..
    public all_emp = [];// Stores all employee data to set the names
    // public achieved_working_hrs = 0; // Store the actual working hrs submitted by emp.
    // public total_working_days = 0; // Store the total working days excluding weekend and holidays..

    /* Loads the below method when entering the screen first time  */
    public async onAfterRendering() {
        // let params = oEvent.navToParams.AD;
        let params = await this.tm.getTN("ts_approver_detail").getData();
        await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ts_redesign");
        await this.tm.getTN("control_button_action").setData(params[params.index]);
        await this.tm.getTN("control_button_action").setProperty("validate", false);
        await this.tm.getTN("mnth_selection_other").setData({});
        let month = params[params.index].from_date;
        await this.tm.getTN("mnth_selection_other").setProperty('month', month);

        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Loading....");
        oBusyIndicator.open();

        this.setStartAndEndDate(month);    //To set the start and end date of the month

        // this.userid = (await this.transaction.get$User()).login_id; //Getting the logged in user id
        this.userid = params[params.index].employee_id;
        this.curr_month_ts = [];

        await this.lmCheck(this.userid); //To set the mentees if any in the dropdown

        await this.setTSStatusCurrMonth(); // To set the current month TimeSheet status

        await this.setTSApprovalFlow(); // To set the approval flow sequence

        await this.setupTaskSearch(); //Getting the assigned user's task for particular month

        this.ts_comment = <KloEntitySet<d_o2c_ts_comment>>await this.transaction.getExecutedQuery("d_o2c_ts_comment", { loadAll: true });
        this.all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name', 'line_manager', 'employee_id'] });

        // Getting the task ids for the selected month
        let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
        let wo_lv_task_list = task_list.filter(task => task.task_type != "Leave");
        // Fetch all comments in a map for quick lookup
        this.taskCommentsMap = new Map(this.ts_comment.map(comment => [comment.task_id, true]));

        await Promise.all(wo_lv_task_list.map(async (task) => {
            let booked_hrs = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", {
                loadAll: true,
                task_id: task.task_id
            });

            // Calculate total booked hours
            let sum_of_hrs = booked_hrs.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
            task.total_booked_hrs = sum_of_hrs;
            // Only calculate balance if planned_hours is NOT null/undefined
            if (task.planned_hours != null) {
                task.balance = task.planned_hours - sum_of_hrs;
            }

            task.assigned_by_name = this.all_emp.find(emp => emp.employee_id == task.assigned_by.toUpperCase())?.full_name;

            // Check if a comment exists
            task.comment = this.taskCommentsMap.has(task.task_id);
        }));
        await this.tm.getTN("curr_month_assigned_task").setData(wo_lv_task_list);
        this.curr_month_assigned_task_detail = wo_lv_task_list[0];
        let task_id_list = [];
        task_list.forEach(task => {
            task_id_list.push(task.task_id);
        });
        // Fetching task ids ends....

        if (task_id_list.length) {
            this.time_booking = await this.fetchTimeBooking(task_id_list); // Get the TS booking data for all the task assigned for a month.
        }


        await this.findHolidayofEmp(); // To find the holidays based on the BA of the user and also the leaves for a month period

        if (task_id_list.length) {
            await this.generateCurrMonthTs(); // Restructuring the model in order to satisfy the UI requirement.
        }

        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the restructured model to transnode  

        this.removeGridColumn(); // First remove the dynamically added column

        await this.addTaskColumn(); // Dynamically adding the task hours column in UI....

        await this.empCurrMonthHoliday(); // Set the Current Month Holidays in TS 

        await this.taskListProgressIndicator(false);

        await this.systemCheck();

        oBusyIndicator.close();

    }


    /* Loads when navigating to different tasks. */
    public async navToTaskBooking(oEvent) {
        //From oEvent trying to fetch the current index since getActiveIndex method was not working.
        let sPath: string = oEvent.getParameter("rowBindingContext").getPath();
        let index = parseInt(sPath.replace("/curr_month_assigned_task/", ''));
        // Fetching index ends..

        let status = await this.tm.getTN("mnth_selection_other").getData().status; // Get the status of the curr month TS

        // Saving the data only for Not Submitted TS. As for Submitted and Approved it will not be allowed to edit.
        // if (status == "Not Submitted") {
        //     await this.onSave(true); // Before loading the next task data committing the changes because for remarks column restructuring is not done like hrs column. 
        // }

        await this.tm.getTN("curr_mnth_task_list").setActive(index); // Setting the active index in the task list
        this.curr_month_assigned_task_detail = await this.tm.getTN("curr_month_assigned_task").getData()[index];

        await this.activateTaskColumn(index); // Making the selected task column first and rearranging the rest.

        /* Getting the task ids for the selected month. Again the same code is required because above I'm committing the changes in the DB,
        so to get the updated data from DB again calling the same method. Don't think of removing it. */
        let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
        let task_id_list = [];
        task_list.forEach(task => {
            task_id_list.push(task.task_id);
        });
        this.time_booking = await this.fetchTimeBooking(task_id_list);
        // Fetching the updated task data ends....

        await this.generateCurrMonthTs(); // Again based upon the updated task data updating the model..

        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the updated model data to transnode  
    }


    /* Loads when selecting the month from dropdown field */
    public async onMonthSelect() {
        let monht_selected = await this.tm.getTN("mnth_selection_other").getData().month; // Get the selected month

        this.setStartAndEndDate(monht_selected); // To set the start and end date of the month
        this.curr_month_ts = []; // initializing the curr month TS data to empty otherwise it will push it in the same array.
        await this.setTSStatusCurrMonth(); // To set the current month TimeSheet status
        await this.setTSApprovalFlow(); // To set the approval flow sequence
        await this.setupTaskSearch(); // Getting the assigned user's task for particular month

        // Getting the task ids for the selected month
        let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
        let wo_lv_task_list = task_list.filter(task => task.task_type != "Leave");

        await Promise.all(wo_lv_task_list.map(async (task) => {
            let booked_hrs = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", {
                loadAll: true,
                task_id: task.task_id
            });

            // Calculate total booked hours
            let sum_of_hrs = booked_hrs.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
            task.total_booked_hrs = sum_of_hrs;
            // Only calculate balance if planned_hours is NOT null/undefined
            if (task.planned_hours != null) {
                task.balance = task.planned_hours - sum_of_hrs;
            }

            task.assigned_by_name = this.all_emp.find(emp => emp.employee_id == task.assigned_by.toUpperCase())?.full_name;

            // Check if a comment exists
            task.comment = this.taskCommentsMap.has(task.task_id);
        }));
        await this.tm.getTN("curr_month_assigned_task").setData(wo_lv_task_list);
        this.curr_month_assigned_task_detail = wo_lv_task_list[0];
        let task_id_list = [];
        task_list.forEach(task => {
            task_id_list.push(task.task_id);
        });
        // Fetching task ids ends....

        // Check required as the month task may not be assigned so no need to do further processing.
        if (task_id_list.length) {
            this.time_booking = await this.fetchTimeBooking(task_id_list);
            await this.generateCurrMonthTs();
        }

        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the updated model to transnode  

        await this.empCurrMonthHoliday(); //Set the Current Month Holidays in TS 

        this.removeGridColumn(); // First remove the dynamically added column

        await this.addTaskColumn(); // Add the new ones..

        await this.taskListProgressIndicator(false); // Set the progress indicator in task list...
    }

    /* To set the start and end date of the month */
    private setStartAndEndDate(date: Date) {
        this.start_date = new Date(date.getFullYear(), date.getMonth(), 1);
        this.end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /* Activating the transnode to get the current task data */
    private async setupTaskSearch() {
        await this.tm.getTN("curr_mnth_task_search").setProperty("start_mnth", this.start_date);
        await this.tm.getTN("curr_mnth_task_search").setProperty("end_mnth", this.end_date);
        await this.tm.getTN("curr_mnth_task_search").setProperty("employee_id", this.userid);
        await this.tm.getTN("curr_mnth_task_search").getData().setLoadAll(true);
        await this.tm.getTN("curr_mnth_task_search").executeP();
        await this.tm.getTN("curr_mnth_task_list").setActive(0);
    }

    /* Get the current month TS time booking data..  */
    private async fetchTimeBooking(task_id) {
        return <KloEntitySet<d_o2c_timesheet_time_booking>>await this.transaction.getExecutedQuery("q_curr_tsk_booking", {
            loadAll: true,
            task_id: task_id,
            start_mnth: this.start_date,
            end_mnth: this.end_date
        });
    }

    /* Restructuring the model to satisfy the UI requirement */
    private async generateCurrMonthTs() {
        try {
            this.curr_month_ts = []; // Initializing the curr month ts.
            let start_date_obj = new Date(this.start_date); // Making a reference of curr month start date. Required specially in date objects because it is of non-primitive type.
            // let task_detail = await this.tm.getTN("curr_mnth_task_detail").getData(); // Get the selected task data.
            let emp_task_list = await this.tm.getTN("curr_mnth_task_list").getData(); // Get all the task data.
            let holidayAndLeave = await this.tm.getTN("o2c_calendar").getData(); // Get all the leaves and holiday for a user.
            let status = await this.tm.getTN("mnth_selection_other").getData().status; // Get the status of the curr month TS
            let achieved_working_hrs = 0;
            let total_working_days = 0;
            let travelDates = await traveltotimesheet.fnTravelingDays(this.transaction, this.start_date, this.end_date, this.userid);
            // Initialize an object to store total hours per task
            let task_total_hours: { [task_id: string]: number } = {};


            // Iterating for a month TS starts...
            while (start_date_obj <= this.end_date) {
                let edit = this.editableCheck(start_date_obj, this.curr_month_assigned_task_detail, status); // To check for editability of that field.
                const isWeekend = start_date_obj.getDay() === 0 || start_date_obj.getDay() === 6; // Checking for the Weekend.
                let curr_day_time_booking = this.time_booking.find(item => this.isSameDate(item.booking_date, start_date_obj) && this.curr_month_assigned_task_detail.task_id === item.task_id); // Get the selected task time booking data
                let curr_day_all_task = this.time_booking.filter(item => this.isSameDate(item.booking_date, start_date_obj)) // Get all the task time booking data
                const sum = curr_day_all_task.reduce((total, task) => total + parseFloat(task.hours_worked || 0), 0); // Summing the total hrs..
                let curr_holidayAndLeave = holidayAndLeave.find(item => this.isSameDate(item.startDate, start_date_obj)); // Searching for the curr date is holiday or leave.
                let curr_day_comment = this.ts_comment.find(comment => comment.booking_id == curr_day_time_booking?.booking_id);
                let isTravel = travelDates.some(date => date.getTime() == start_date_obj.getTime());
                let icon = curr_holidayAndLeave?.type === "holiday" ? "sap-icon://kloFontg/star" :
                    curr_holidayAndLeave?.type === "half" ? "sap-icon://kloFontg/incomplete_circle" :
                        curr_holidayAndLeave?.type === "full" ? "sap-icon://circle-task-2" :
                            curr_holidayAndLeave?.type === "applied" ? "sap-icon://kloFontg/access_time_filled" :
                                isWeekend === true ? "sap-icon://kloFontg/weekend" :
                                    isTravel ? "sap-icon://kloFontg/luggage" :
                                        null;

                if ((icon == null || icon == "sap-icon://kloFontg/incomplete_circle" || icon == "sap-icon://circle-task-2" || icon == "sap-icon://kloFontg/luggage")) {
                    total_working_days += 1; // Finding the total working days excluding holidays and weekends.
                }
                if (sum > 0) {
                    achieved_working_hrs += sum; // Storing the total hrs of emp
                }
                // Base object for the current day
                let curr_day_entry = {
                    icon: icon,
                    AH: null,
                    booking_id: curr_day_time_booking?.booking_id,
                    date: new Date(start_date_obj),
                    formatted_date: start_date_obj.toDateString(),
                    total: sum,
                    remarks: curr_day_time_booking?.remarks,
                    comment: curr_day_comment?.comment,
                    weekendDate: isWeekend,
                    fullDayColor: curr_holidayAndLeave?.type === "full" ? true : false,
                    halfDayColor: curr_holidayAndLeave?.type === "half" ? true : false,
                    holidayColor: curr_holidayAndLeave?.type === "holiday" ? true : false,
                    appliedColor: curr_holidayAndLeave?.type === "applied" ? true : false,
                    travelColor: (curr_holidayAndLeave?.type || isWeekend) ? false : isTravel,
                    editable: edit.editable
                };

                // Add task data for each employee tasks
                emp_task_list.forEach(task => {
                    let task_time_booking = this.time_booking.find(
                        item => this.isSameDate(item.booking_date, start_date_obj) && item.task_id === task.task_id
                    );

                    let hours_worked = task_time_booking?.hours_worked || 0;

                    // Store the hours worked for the specific task on this day
                    curr_day_entry[`task_${task.task_id}`] = hours_worked;
                    curr_day_entry[`rmrk_${task.task_id}`] = task_time_booking?.remarks;

                    // Accumulate total hours for each task_id
                    if (!task_total_hours[task.task_id]) {
                        task_total_hours[task.task_id] = 0;
                    }
                    task_total_hours[task.task_id] += parseFloat(hours_worked);
                });

                // Push the constructed entry to the array
                this.curr_month_ts.push(curr_day_entry);

                // Move to the next day
                start_date_obj.setDate(start_date_obj.getDate() + 1);
            } // end of while loop

            let curr_mnth_emp_task = await this.tm.getTN("curr_month_assigned_task").getData();
            // Update each task with the total booked hours from task_total_hours object
            curr_mnth_emp_task.forEach(task => {
                task.curr_mnth_booked_hrs = task_total_hours[task.task_id] || 0;
            });

            let percentage = 0;
            if (total_working_days > 0) {
                percentage = parseFloat(((achieved_working_hrs / (total_working_days * 8)) * 100).toFixed(2));
            } else {
                percentage = 0;
            }
            await this.tm.getTN("ts_filling_toolbar_indicator").setData({
                percentage: percentage,
                achieve_wrkng_hrs: achieved_working_hrs,
                total_wrkng_hrs: total_working_days * 8
            });
        } catch (e) {
            console.error(e);
            console.error("Error in generating TS ");
        }
    }

    /* Check if the two dates are same. */
    private isSameDate(d1, d2) {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    }

    // To find if login user is Line Manager and set the mentees list to the dropdown.
    public async lmCheck(userid) {
        this.thisUser = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': userid, loadAll: true });
        let allEmployee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userid, loadAll: true });
        let hierarchyIds = [];
        let alreadyVisited = new Map();
        let hierarchyEmployee = [];
        for (let i = 0; i < allEmployee.length; i++) {
            if (!alreadyVisited[allEmployee[i].employee_id]) {
                alreadyVisited[allEmployee[i].employee_id] = true;
                hierarchyIds.push(allEmployee[i].employee_id);
                hierarchyEmployee.push(allEmployee[i]);
            }
        }
        hierarchyEmployee.push(this.thisUser[0]);
        while (hierarchyIds.length) {

            allEmployee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });

            hierarchyIds = [];
            for (let i = 0; i < allEmployee.length; i++) {
                if (!alreadyVisited[allEmployee[i].employee_id]) {
                    alreadyVisited[allEmployee[i].employee_id] = true;
                    hierarchyIds.push(allEmployee[i].employee_id);
                    hierarchyEmployee.push(allEmployee[i]);
                }
            }
        }
        await this.tm.getTN("mentees_list").setData(hierarchyEmployee);
    }

    // After selecting a Mentee
    public async onMenteeSelect() {
        let empid = await this.tm.getTN("mnth_selection_other").getData();
        if (empid.emp_id) {
            this.userid = empid.emp_id
        } else {
            this.userid = (await this.transaction.get$User()).login_id;
        }
        await this.setupTaskSearch();
        await this.findHolidayofEmp();
        await this.setTSStatusCurrMonth();
        await this.setTSApprovalFlow(); // To set the approval flow sequence
        let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
        let wo_lv_task_list = task_list.filter(task => task.task_type != "Leave");

        await Promise.all(wo_lv_task_list.map(async (task) => {
            let booked_hrs = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", {
                loadAll: true,
                task_id: task.task_id
            });

            // Calculate total booked hours
            let sum_of_hrs = booked_hrs.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
            task.total_booked_hrs = sum_of_hrs;
            // Only calculate balance if planned_hours is NOT null/undefined
            if (task.planned_hours != null) {
                task.balance = task.planned_hours - sum_of_hrs;
            }

            task.assigned_by_name = this.all_emp.find(emp => emp.employee_id == task.assigned_by.toUpperCase())?.full_name;

            // Check if a comment exists
            task.comment = this.taskCommentsMap.has(task.task_id);
        }));
        await this.tm.getTN("curr_month_assigned_task").setData(wo_lv_task_list);
        this.curr_month_assigned_task_detail = wo_lv_task_list[0];
        let task_id_list = [];
        task_list.forEach(task => {
            task_id_list.push(task.task_id);
        });
        if (task_id_list.length) {
            this.time_booking = await this.fetchTimeBooking(task_id_list);
            await this.generateCurrMonthTs();
        } else {
            this.curr_month_ts = [];
        }
        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts);
        this.removeGridColumn();
        await this.addTaskColumn();
        await this.taskListProgressIndicator(false); // To set the progress value in task list..
    }

    // Finding holidays for a particular employee based on his BA
    public async findHolidayofEmp() {
        let empOrg = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: this.userid, is_primary: true, loadAll: true });
        try {
            let other_calendar_id = await this.transaction.getExecutedQuery('d_o2c_business_area', { company_code: empOrg[0].company_code, partialSelect: ['office_calender', 'name', 'company_code', 'business_area'], loadAll: true })
            let calendar_id = other_calendar_id.find(({ company_code, business_area }) => company_code == empOrg[0].company_code && business_area == empOrg[0].business_area)
            let holidaylist = <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: calendar_id.office_calender });
            this.tm.getTN('holiday_list').setData(holidaylist);
            await this.setDateForCalendar();
        } catch (e) {
            console.error("Error in getting the holidays " + e);
        }
    }

    //Setting the color in calendar for leaves and holiday.. 
    public async setDateForCalendar() {
        let setLeaveDates = [];
        let sflag = 0, eflag = 0, sDate, eDate, hsDate, heDate, leave_status, dates;
        let leaveData = <KloEntitySet<d_o2c_leave_management>>await this.transaction.getExecutedQuery('d_o2c_leave_management', { 'employee_id': this.userid, loadAll: true })
        let holidays = await this.tm.getTN('holiday_list').getData();
        for (let emp_le of holidays) {
            let dates = { "startDate": new Date(emp_le.holiday_date), "endDate": new Date(emp_le.holiday_date), "color": "#9e050a", type: "holiday" }
            setLeaveDates.push(dates)
        }
        for (let leaves of leaveData) {
            sflag = 0; eflag = 0; sDate = leaves.start_date; eDate = leaves.end_date; hsDate = leaves.half_day_startdate; heDate = leaves.half_day_enddate; leave_status = leaves.leave_status;
            for (let i = sDate; i <= eDate; i.setDate(i.getDate() + 1)) {
                if (i.getDay() !== 6 && i.getDay() !== 0) {
                    if (leave_status == "Applied") {
                        dates = { "startDate": new Date(i), "endDate": new Date(i), "color": "#0407cc", type: "applied" }
                        setLeaveDates.push(dates)
                    } else if (leave_status == "Cancelled" || leave_status == "Rejected") { }
                    else {
                        if ((hsDate && sflag == 0) || (heDate && eflag == 0)) {
                            if (hsDate && sflag == 0) {
                                sflag = 1;
                                setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#0af034", type: "half" })
                            } else if (heDate && eflag == 0) {
                                i.setHours(0, 0, 0, 1);  // Start just after midnight
                                eDate.setHours(0, 0, 0, 1);
                                if (i.getTime() === eDate.getTime()) {
                                    eflag = 1;
                                    setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#0af034", type: "half" })
                                } else {
                                    setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613", type: "full" })
                                }
                            } else {
                                setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613", type: "full" })
                            }

                        } else {
                            setLeaveDates.push({ "startDate": new Date(i), "endDate": new Date(i), "color": "#066613", type: "full" })
                        }
                    }
                }
            }
        }
        this.tm.getTN('o2c_calendar').setData(setLeaveDates);
    }

    // On click of save button
    // public async onSave(flag) {
    //     let curr_ts = await this.tm.getTN("ts_fill_other").getData();
    //     // let task_detail = await this.tm.getTN("curr_mnth_task_detail").getData()
    //     try {
    //         for (let i = 0; i < curr_ts.length; i++) {
    //             if (curr_ts[i].booking_id == null || curr_ts[i].booking_id == undefined || curr_ts[i].booking_id == "") {
    //                 if (parseFloat(curr_ts[i][`task_${this.curr_month_assigned_task_detail.task_id}`]) > 0) {
    //                     await this.transaction.createEntityP("d_o2c_timesheet_time_booking", {
    //                         task_id: this.curr_month_assigned_task_detail.task_id,
    //                         booking_date: curr_ts[i].date,
    //                         hours_worked: curr_ts[i][`task_${this.curr_month_assigned_task_detail.task_id}`],
    //                         remarks: curr_ts[i].remarks
    //                     })
    //                 }
    //             } else {
    //                 let filteredTimeBooking = this.time_booking.find(item => item.booking_id === curr_ts[i].booking_id);
    //                 filteredTimeBooking.hours_worked = curr_ts[i][`task_${this.curr_month_assigned_task_detail.task_id}`];
    //                 filteredTimeBooking.remarks = curr_ts[i].remarks;
    //             }
    //         }
    //         if (flag == true) {
    //             await this.transaction.commitP();
    //         } else if (flag == "Submit") {
    //             await this.tm.commitP("Submitted Successfully", "Submission Failed", true, true);
    //         } else {
    //             await this.tm.commitP("Bach Gya Aman😎", "Tu to gya Bete..🤬", true, true);
    //         }
    //     } catch (e) {
    //         console.error("Error while Saving....." + e);
    //     }
    // }

    //Month Select From Calendar
    public async monthChangeInCalendar(oEvent) {
        var oCalendar = oEvent.getSource();
        let isMonth = oCalendar._oFocusedDate._oUDate.oDate;
        await this.tm.getTN("mnth_selection_other").resetP(true);
        await this.tm.getTN("mnth_selection_other").refresh();
        this.tm.getTN("mnth_selection_other").setProperty("month", isMonth);
        await this.tm.getTN("mnth_selection_other").resetP(true);
        await this.tm.getTN("mnth_selection_other").refresh();
        await this.onMonthSelect();
    }

    // Adding the columns dynamically..
    public async addTaskColumn() {
        let m = this.s.model_name;
        let c = this.getActiveControlById(null, "s_ts_fill2");
        let list = await this.tm.getTN("curr_month_assigned_task").getData();
        let status = await this.tm.getTN("mnth_selection_other").getData().status;
        for (let olistitem of list) {
            c.addColumn(new sap.ui.table.Column({
                label: new sap.m.Label({
                    text: olistitem.task_name + " Hrs",
                    tooltip: olistitem.task_name
                }),
                template: new sap.m.Label({
                    text: "{" + m + ">task_" + olistitem.task_id + "}"
                }),
                minWidth: 10
            }))
        }
    }

    // Removing the columns
    public removeGridColumn() {
        let c = this.getActiveControlById(null, "s_ts_fill2");
        let length = c.getColumns().length;
        for (let i = length - 1; i >= 5; i--) {
            c.removeColumn(i);
        }
    }

    // Getting the initials of the assigned task. 
    // private getInitialsWithHours(name) {
    //     return name
    //         .split(" ")                      // Split the string into words
    //         .map(word => word[0])            // Get the first letter of each word
    //         .join(".") + " Hrs";           // Join initials with '.' and append 'Hours'
    // }

    //Set the status of the current month TS
    public async setTSStatusCurrMonth() {
        let ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("q_o2c_timesheet_list", {
            loadAll: true,
            date_of_search: this.start_date, date_of_end: this.end_date, employee_id: this.userid
        });
        // Ensure ts_header[0] exists before accessing properties
        await this.tm.getTN("mnth_selection_other").setProperty('status', ts_header[0]?.over_all_status ?? "Not Submitted");
        await this.tm.getTN("mnth_selection_other").setProperty('submit_id', ts_header[0]?.submit_id);
    }
    // let emp_ts_header = ts_header.find(header => header.employee_id.toLowerCase() == this.userid.toLowerCase());

    //Activating the column to first index..
    private async activateTaskColumn(index) {
        let m = this.s.model_name;
        let c = this.getActiveControlById(null, "s_ts_fill2");
        let allTask = await this.tm.getTN("curr_month_assigned_task").getData();
        let selectedTask = allTask[index];
        let status = await this.tm.getTN("mnth_selection_other").getData().status;
        let all_col = c.getColumns();
        let col_index;
        let col;
        let task_id_list = []

        // Collect task_id_list based on the template type
        for (let i = 5; i < all_col.length; i++) {
            const template = all_col[i].getTemplate();
            if (template instanceof sap.m.Label || template instanceof sap.m.Input) {
                const bindingInfo = template.mBindingInfos;
                const key = template instanceof sap.m.Label ? 'text' : 'value';
                if (bindingInfo[key].parts[0].path) {
                    task_id_list.push(bindingInfo[key].parts[0].path);
                }
            }
        }


        for (let i = 1, j = 0; i < all_col.length; i++) {
            // .find(col => (col.getLabel().getText()) == selectedTask.project_name);
            col = all_col[i];
            let tool_tip = col.getLabel().getTooltip();
            // let label_txt = col_label.getText();
            if (tool_tip == selectedTask.task_name) {
                col_index = i;
            }
            if (i > 4 && status == "Not Submitted") {
                col.setTemplate(new sap.m.Label({
                    text: "{" + m + ">" + task_id_list[j] + "}"
                }));
                j++;
            }
        }
        // let col_index = c.getColumns().findIndex(col => col.getTemplate().getValue() == selectedTask.project_name);

        if (status == "Not Submitted") {
            all_col[col_index].setTemplate(new sap.m.Input({
                value: "{" + m + ">task_" + selectedTask.task_id + "}",
                editable: true
            }));
        }
        c.removeColumn(col_index);
        c.insertColumn(all_col[col_index], this.fixedColumnCount);
    }

    //Editability check for a particular day
    public editableCheck(start_date_obj, task_detail, status) {
        let editable = false;
        let checkForBookingDateinTaskDateRange = false;
        if (start_date_obj >= task_detail.task_start_date.setHours(0, 0, 0, 0) &&
            start_date_obj <= task_detail.task_end_date.setHours(0, 0, 0, 0) && status == "Not Submitted") {
            editable = true;
        }
        if (start_date_obj >= task_detail.task_start_date.setHours(0, 0, 0, 0) &&
            start_date_obj <= task_detail.task_end_date.setHours(0, 0, 0, 0)) {
            checkForBookingDateinTaskDateRange = true;
        }

        return {
            editable: editable,
            bookingDateCheck: checkForBookingDateinTaskDateRange
        };
    }

    // On click of submit button.
    // public async onSubmit() {
    //     let ts_header = await this.transaction.createEntityP("d_o2c_timesheet_header", {
    //         employee_id: this.userid.toUpperCase(),
    //         from_date: this.start_date,
    //         to_date: this.end_date,
    //         over_all_status: "Submitted"
    //     })
    //     ts_header.submitted_on = ts_header.s_created_on;

    //     let list = await this.tm.getTN("curr_month_assigned_task").getData();
    //     let lmAssignedTask = false;
    //     let uniqueApprovers = new Set(); // Track unique approvers

    //     for (let i = 0; i < list.length; i++) {

    //         if (this.thisUser[0].line_manager == list[i].assigned_by) {
    //             lmAssignedTask = true;
    //         }
    //         await this.transaction.createEntityP("d_o2c_timesheet_task", {
    //             task_id: list[i].task_id,
    //             submit_id: ts_header.submit_id,
    //             status: "Submitted"
    //         })
    //         // Add only unique approvers
    //         if (!uniqueApprovers.has(list[i].assigned_by)) {
    //             uniqueApprovers.add(list[i].assigned_by);
    //             await this.transaction.createEntityP("d_o2c_timesheet_approver", {
    //                 task_version: 1,
    //                 approval_sequence: 1,
    //                 submit_id: ts_header.submit_id,
    //                 approver: list[i].assigned_by.toUpperCase(),
    //                 approval_status: "Pending",
    //                 approver_remark: " "
    //             });
    //         }
    //     }

    //     if (!lmAssignedTask) {
    //         await this.transaction.createEntityP("d_o2c_timesheet_approver", {
    //             task_version: 1,
    //             approval_sequence: 2,
    //             submit_id: ts_header.submit_id,
    //             approver: this.thisUser[0].line_manager,
    //             approval_status: "Pending",
    //             approver_remark: " "
    //         })
    //     }
    //     await this.onSave("submit");
    //     await this.tm.getTN("mnth_selection_other").setProperty('status', "Submitted");
    //     await this.tm.getTN("mnth_selection_other").setProperty('submit_id', ts_header.submit_id);
    //     let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
    //     let task_id_list = [];
    //     task_list.forEach(task => {
    //         task_id_list.push(task.task_id);
    //     });
    //     this.time_booking = await this.fetchTimeBooking(task_id_list);
    //     await this.generateCurrMonthTs();
    //     await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts);
    //     await this.setTSApprovalFlow();
    // }

    //Holidays for emp for selected month..
    public async empCurrMonthHoliday() {
        let emp_holiday = await this.tm.getTN("holiday_list").getData();
        let curr_mnth_holiday = emp_holiday.filter(holiday => holiday.holiday_date >= this.start_date && holiday.holiday_date <= this.end_date);
        await this.tm.getTN("curr_month_holiday").setData(curr_mnth_holiday);
    }

    //Get the timesheet approval flow data...
    public async setTSApprovalFlow() {
        let submit_id = await this.tm.getTN("mnth_selection_other").getData().submit_id;
        let ts_approval = [];
        if (submit_id) {
            ts_approval = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { submit_id: submit_id, loadAll: true });
        }
        await this.tm.getTN("ts_approval").setData(ts_approval);
    }

    //To show the comment...
    public async showComment(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/ts_fill_other/", ''));
        await this.tm.getTN("ts_fill_other_detail").setData(this.curr_month_ts[index]);
        await this.openDialog("pa_comment_dialog");
    }

    // Finding the progress value to set in the Task List progress indicator
    public async taskListProgressIndicator(dynamic) {
        let curr_ts_data = await this.tm.getTN("ts_fill_other").getData();
        let emp_assigned_task = await this.tm.getTN("curr_month_assigned_task").getData();
        // let total_task = [];
        for (let i = 0; i < emp_assigned_task.length; i++) {
            // let total = curr_ts_data.filter(ts => ts[`task_${emp_assigned_task[i].task_id}`] > 0);
            let total = 0;
            let achieve = 0;
            for (let j = 0; j < curr_ts_data.length; j++) {
                if (curr_ts_data[j][`task_${emp_assigned_task[i].task_id}`] > 0) {
                    total += 1;
                }
                if (dynamic) {
                    if (curr_ts_data[j][`task_${emp_assigned_task[i].task_id}`] > 0 && curr_ts_data[j].remarks) {
                        achieve += 1;
                    }
                } else {
                    if (curr_ts_data[j][`task_${emp_assigned_task[i].task_id}`] > 0 && curr_ts_data[j][`rmrk_${emp_assigned_task[i].task_id}`]) {
                        achieve += 1;
                    }
                }
            }
            if (total > 0) {
                emp_assigned_task[i][`percentage`] = parseFloat(((achieve / total) * 100).toFixed(2));
            } else {
                emp_assigned_task[i][`percentage`] = 0;
            }
        }
        // await this.tm.getTN("curr_month_assigned_task").setData({});
        await this.tm.getTN("curr_month_assigned_task").setData(emp_assigned_task);
    }

    // Dynamically changing the Task List progress indicator on change of remarks..
    public async onrmkChangeUpdateProgress() {
        await this.taskListProgressIndicator(true);
    }

    // public async onHrsChangeUpdateTotalProgress(oEvent) {
    //     let sPath: string = this.getPathFromEvent(oEvent);
    //     let newValue = oEvent.getParameter("value");
    //     newValue = newValue === "" ? 0 : parseFloat(newValue) || 0; // Ensure numeric value
    //     let index = parseInt(sPath.replace("/ts_fill_other/", ''));
    //     let curr_ts_data_changed = await this.tm.getTN("ts_fill_other").getData()[index];
    //     let diff =  Math.abs(parseFloat(curr_ts_data_changed.total) - newValue);
    //     curr_ts_data_changed.total = parseFloat(curr_ts_data_changed.total) + newValue;
    //     // await this.tm.getTN("ts_fill_other").getData()[index].setProperty("total", curr_ts_data_changed.total);
    //     let ts_fill_toolbar_indicator_obj = await this.tm.getTN("ts_filling_toolbar_indicator").getData();
    //     ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs +=  diff;
    //     // await this.tm.getTN("ts_filling_toolbar_indicator").setProperty("achieve_wrkng_hrs",ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs);
    //     ts_fill_toolbar_indicator_obj.percentage = parseFloat((ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs / ts_fill_toolbar_indicator_obj.total_wrkng_hrs).toFixed(2)) * 100;
    //     // await this.tm.getTN("ts_filling_toolbar_indicator").setProperty("percentage",percentage)
    // }

    public async onHrsChangeUpdateTotalProgress(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let newValue = oEvent.getParameter("value");
        newValue = newValue === "" ? 0 : parseFloat(newValue) || 0; // Ensure numeric value

        let index = parseInt(sPath.replace("/ts_fill_other/", ''));
        let curr_ts_data_changed = await this.tm.getTN("ts_fill_other").getData()[index];

        // Store previous value before updating
        let previousValue = parseFloat(curr_ts_data_changed.total) || 0;

        // Calculate the difference considering removal
        let diff = Math.abs(previousValue - newValue);

        // Update total properly
        curr_ts_data_changed.total = previousValue - previousValue + newValue;

        // Update toolbar indicator
        let ts_fill_toolbar_indicator_obj = await this.tm.getTN("ts_filling_toolbar_indicator").getData();
        ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs += (newValue > previousValue) ? diff : -diff; // Adjust when removing

        // Update percentage
        ts_fill_toolbar_indicator_obj.percentage = parseFloat(
            ((ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs / ts_fill_toolbar_indicator_obj.total_wrkng_hrs) * 100).toFixed(2)
        );
    }

    public async saveComment() {
        let detail = await this.tm.getTN("ts_fill_other_detail").getData();

        let curr_comment = <KloEntitySet<d_o2c_ts_comment>>await this.transaction.getExecutedQuery("d_o2c_ts_comment", { loadAll: true, booking_id: detail.booking_id });
        if (curr_comment.length) {
            curr_comment[0].comment = detail.comment;
        } else {
            await this.transaction.createEntityP("d_o2c_ts_comment", {
                booking_id: detail.booking_id,
                task_id: this.curr_month_assigned_task_detail.task_id,
                comment: detail.comment
            })
        }
        await this.tm.commitP("Comment Saved!", "Saving Failed", true, true);
        await this.closeDialog("pa_comment_dialog");
    }

    public async closeComment() {
        let detail = await this.tm.getTN("ts_fill_other_detail").getData();
        let comment = <KloEntitySet<d_o2c_ts_comment>>await this.transaction.getExecutedQuery("d_o2c_ts_comment", { loadAll: true, booking_id: detail.booking_id });
        // detail.comment = this.ts_comment.find(commnt => commnt.booking_id == detail.booking_id)?.comment ?? null;
        if (comment.length == 0) {
            detail.comment = null;
        }

        // await this.transaction.rollback();
        await this.closeDialog("pa_comment_dialog");
    }

    public async onExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        // let aFilteredData = 
        let curr_month_assigned_task = await this.tm.getTN("curr_month_assigned_task").getData();
        let curr_mnth_ts = await this.tm.getTN("ts_fill_other").getData();
        let holidayAndLeave = await this.tm.getTN("o2c_calendar").getData(); // Get all the leaves and holiday for a user.


        let jsonData = [];

        // Build the jsonData array using the fetched data
        let start_date_obj = new Date(this.start_date);
        let i = 0;
        while (start_date_obj <= this.end_date) {
            for (let index = 0; index < curr_month_assigned_task.length; index++) {

                let curr_holidayAndLeave = holidayAndLeave.find(item => this.isSameDate(item.startDate, start_date_obj));
                let day = start_date_obj.toLocaleString('en-US', { weekday: 'long' });
                let date = start_date_obj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

                jsonData.push({
                    'Date': date,
                    'Day': day,
                    'Project Name': curr_month_assigned_task[index].project_name,
                    'Task Name': curr_month_assigned_task[index].task_name,
                    'Work Hour': curr_mnth_ts[i][`task_${curr_month_assigned_task[index].task_id}`],
                    'Remark': (curr_holidayAndLeave) ?
                        (curr_holidayAndLeave.type === "holiday" ? "Holiday" : `${curr_holidayAndLeave.type} Day Leave`) :
                        curr_mnth_ts[i][`rmrk_${curr_month_assigned_task[index].task_id}`]

                });
            }
            // Move to the next day
            start_date_obj.setDate(start_date_obj.getDate() + 1);
            i++;

        }

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();

        // Set column widths
        worksheet['!cols'] = [
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 10 },
            { width: 40 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, `${this.start_date.toLocaleString('en-US', { month: 'long' })} Timesheet Data`);

        // Write workbook to a file
        const filePath = `${this.start_date.toLocaleString('en-US', { month: 'long' })} Month TS.xlsx`;
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();

    }

    public async systemCheck() {
        let system_check = {
            rmrk_check: false, // Set initially to false
            more_office_filled: false,
            less_office_filled: false,
            less_assgnd_filled: false
        };

        let curr_month_assigned_task = await this.tm.getTN("curr_month_assigned_task").getData();

        // Check assigned tasks & timesheet in a single loop if they have similar iteration count
        let maxLen = Math.max(curr_month_assigned_task.length, this.curr_month_ts.length);

        for (let i = 0; i < maxLen; i++) {
            if (i < curr_month_assigned_task.length) {
                let task = curr_month_assigned_task[i];

                if (task.percentage !== 100) system_check.rmrk_check = true;
                if (task.balance !== null && task.balance !== undefined && task.balance < 0) {
                    system_check.less_assgnd_filled = true;
                }

            }

            if (i < this.curr_month_ts.length) {
                let total = this.curr_month_ts[i];

                // Define allowed icons in an array for better readability and maintainability
                const allowedIcons = [
                    null,
                    "sap-icon://kloFontg/incomplete_circle",
                    "sap-icon://circle-task-2",
                    "sap-icon://kloFontg/luggage"
                ];

                if (allowedIcons.includes(total.icon)) {
                    // Ensure `total.total` is a valid number before comparison
                    if (typeof total.total === "number") {
                        if (total.total > 8) {
                            system_check.more_office_filled = true;
                        } else if (total.total < 8) {
                            system_check.less_office_filled = true;
                        }
                    }
                }
            }


            // If all flags are set, exit early
            if (Object.values(system_check).every(Boolean)) break;
        }

        await this.tm.getTN("system_check").setData(system_check);
    }


    // public async onClicksystemCheck(oEvent, check) {
    //     let curr_month_assigned_task = await this.tm.getTN("curr_month_assigned_task").getData();

    //     // Check assigned tasks & timesheet in a single loop if they have similar iteration count
    //     let maxLen = Math.max(curr_month_assigned_task.length, this.curr_month_ts.length);

    //     for (let i = 0; i < maxLen; i++) {
    //         if (i < curr_month_assigned_task.length) {
    //             let task = curr_month_assigned_task[i];

    //             if (task.balance !== null && task.balance !== undefined && task.balance < 0) {
    //                 // Do not set any other flag if "remark" is selected
    //                 if (check.key !== "remark" && check.key !== "more_office_hrs" && check.key !== "less_office_hrs") {
    //                     // system_check.less_assgnd_filled = true;
    //                 }
    //             }
    //         }

    //         if (i < this.curr_month_ts.length) {
    //             let total = this.curr_month_ts[i];

    //             // Define allowed icons in an array for better readability and maintainability
    //             const allowedIcons = [
    //                 null,
    //                 "sap-icon://kloFontg/incomplete_circle",
    //                 "sap-icon://circle-task-2",
    //                 "sap-icon://kloFontg/luggage"
    //             ];

    //             if (allowedIcons.includes(total.icon)) {
    //                 // **Check for office hours based on 'check' parameter**
    //                 if (typeof total.total === "number") {
    //                     if (check.key === "more_office_hrs") {
    //                         total["more_hrs"] = total.total > 8 ? true : false;
    //                         total["less_hrs"] = false; // Reset less hrs
    //                     } else if (check.key === "less_office_hrs") {
    //                         total["less_hrs"] = total.total < 8 ? true : false;
    //                         total["more_hrs"] = false; // Reset more hrs
    //                     } else {
    //                         total["more_hrs"] = false;
    //                         total["less_hrs"] = false;
    //                     }
    //                 }

    //                 // **Checking for empty remarks (Always checked, but activated only if check is "remark")**
    //                 let hasEmptyRemark = false;
    //                 for (let task of curr_month_assigned_task) {
    //                     let remarkKey = `rmrk_${task.task_id}`;

    //                     if (remarkKey in total) {  // Check if the remark exists in this entry
    //                         let remark = total[remarkKey];

    //                         if (remark === null || remark === undefined || remark.trim() === "") {
    //                             hasEmptyRemark = true;
    //                             break;  // Exit loop immediately after finding the first empty remark
    //                         }
    //                     }
    //                 }

    //                 // **Set the remark check flag correctly based on the passed check**
    //                 if (check.key === "remark") {
    //                     total["remark_check"] = hasEmptyRemark ? true : false;
    //                     total["more_hrs"] = false;
    //                     total["less_hrs"] = false;
    //                 } else {
    //                     total["remark_check"] = false;
    //                 }
    //             }
    //         }
    //     }
    // }


    public async onApprove() {
        let apprvl_list = await this.tm.getTN("ts_approver_detail").getData();
        let detail = apprvl_list[apprvl_list.index];
        let remark_detail = await this.tm.getTN("control_button_action").getData();
        if (remark_detail.remark == null || remark_detail.remark == undefined || remark_detail.remark?.trim() == "") {
            await this.tm.getTN("control_button_action").setProperty("validate", true);
            return;
        }
        let ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { loadAll: true, submit_id: detail.submit_id, employee_id: detail.employee_id });
        let ts_approver = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: detail.submit_id });
        let highestCycle = Math.max(...ts_approver.map(approver => approver.task_version));
        // Replacing the approval flow with the highest cycle.
        ts_approver = ts_approver.filter(approve => approve.task_version == highestCycle);
        let assigned_task = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: detail.from_date, end_mnth: detail.to_date, assigned_by: apprvl_list.assigned_by, employee_id: detail.employee_id });
        let task_id_list = [];
        for (let task of assigned_task) {
            task_id_list.push(task.task_id);
        }
        let ts_task = [];
        let ts_task_task_id;
        if (task_id_list.length) {
            ts_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true, submit_id: detail.submit_id, task_id: task_id_list });
        }

        for (let approver of ts_approver) {
            if (approver.approval_sequence == 0 && approver.approval_status == "Pending" && approver.approver.toLowerCase() == apprvl_list.assigned_by) {
                approver.approval_status = "Approved";
                approver.approver_remark = remark_detail.remark;
                approver.approved_on = new Date();
                ts_task_task_id = assigned_task.find(item => item.assigned_by.toLowerCase() == apprvl_list.assigned_by);
                if (approver.approver.toUpperCase() == this.thisUser[0].line_manager) {
                    ts_header[0].over_all_status = "Approved";
                } else {
                    ts_header[0].over_all_status = "Partially Approved";
                }

            } else if (approver.approval_sequence == 1 && approver.approval_status == "Pending" && approver.approver.toLowerCase() == apprvl_list.assigned_by) {
                approver.approval_status = "Approved";
                approver.approved_on = new Date();
                approver.approver_remark = remark_detail.remark;
                ts_header[0].over_all_status = "Approved";
                ts_task_task_id = assigned_task.find(item => item.assigned_by == apprvl_list.assigned_by);
            }
        }

        if (ts_task.length && ts_task_task_id) {
            for (let task of ts_task) {
                if (task.task_id == ts_task_task_id.task_id) {
                    task.status = "Approved";
                    break;
                }
            }
        }
        /* Approval Notification Starts... */
        let approver_table = await this.generateApprovalTable(ts_approver);
        await this.tm.getTN("ts_approve_reject").setProperty('table', approver_table);
        await this.tm.getTN("ts_approve_reject").setProperty('emp_id', ts_header[0].employee_id);
        await this.tm.getTN("ts_approve_reject").setProperty('type', "newTSApprove");
        await this.tm.getTN("ts_approve_reject").setProperty('month', ts_header[0].from_date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        await this.tm.getTN("ts_approve_reject").setProperty('approver', apprvl_list.assigned_by.toUpperCase());
        await this.tm.getTN("ts_approve_reject").setProperty('over_all_status', ts_header[0].over_all_status);
        await this.tm.getTN("ts_approve_reject").executeP();
        /* Approval Notification Ends... */
        await this.tm.commitP("Approved Successfully", "Approve Failed", true, true);
        apprvl_list[apprvl_list.index].pending_with_me = false;
        // apprvl_list.controller.tm.getTN("ts_header_other").getData()[apprvl_list.index].pending_with_me = false;
        let header_list = await apprvl_list.controller.tm.getTN("ts_header_other").getData();
        for (let header = 0; header < header_list.length; header++) {
            if (header_list[header].employee_id == apprvl_list[apprvl_list.index].employee_id) {
                header_list[header].pending_with_me = false;
                header_list[header].over_all_status = ts_header[0].over_all_status;
            }
        }
        await apprvl_list.controller.onStatusChange();
        remark_detail.remark = null;
        if (apprvl_list.index == (apprvl_list.length - 1)) {
            await apprvl_list.controller.closeDialog("pa_ts_apprvl_dialog");
        } else {
            await this.onRightArrowClick();
        }
    }

    public async onRightArrowClick() {
        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Loading....");
        oBusyIndicator.open();
        // let lastIndex = true;
        let apprvl_list = await this.tm.getTN("ts_approver_detail").getData();
        let index = apprvl_list.index;
        // let detail = await this.tm.getTN("ts_approver_detail").getData();
        // let detail = apprvl_list[index + 1];
        // await this.tm.getTN("o2c_timesheet_header_list").setActive(index + 1);
        // await this.navTo(({ S: "p_ts_apprvl_list", SS: "s_o2c_tim_detail" }));
        // await this.tm.getTN("dialog_params").setData(detail);
        if ((index + 2) == apprvl_list.length) {
            // lastIndex = false;
            await this.tm.getTN("ts_approver_detail").setProperty("lastIndex", false);
        }
        await this.tm.getTN("ts_approver_detail").setProperty("firstIndex", true);
        await this.tm.getTN("ts_approver_detail").setProperty("index", index + 1);
        await this.changeTSforNextIndex((index + 1));
        await apprvl_list.controller.tm.getTN("dialog_params").setProperty("index", index + 1);
        await apprvl_list.controller.tm.getTN("dialog_params_detail").setData(apprvl_list[index + 1]);
        // await this.closeDialog("pa_ts_apprvl_dialog");
        // await this.openDialog("pa_ts_apprvl_dialog");
        oBusyIndicator.close();
        // await onAfterRendering();
    }


    public async changeTSforNextIndex(index) {
        // let params = oEvent.navToParams.AD;
        let params = await this.tm.getTN("ts_approver_detail").getData();
        await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ts_redesign");
        await this.tm.getTN("control_button_action").setData(params[index]);
        await this.tm.getTN("mnth_selection_other").setData({});
        let month = params[index].from_date;
        await this.tm.getTN("mnth_selection_other").setProperty('month', month);

        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Loading....");
        oBusyIndicator.open();

        this.setStartAndEndDate(month);    //To set the start and end date of the month

        // this.userid = (await this.transaction.get$User()).login_id; //Getting the logged in user id
        this.userid = params[index].employee_id;
        this.curr_month_ts = [];
        await this.tm.getTN("ts_filling_toolbar_indicator").setData({ percentage: 0 });

        await this.lmCheck(this.userid); //To set the mentees if any in the dropdown

        await this.setTSStatusCurrMonth(); // To set the current month TimeSheet status

        await this.setTSApprovalFlow(); // To set the approval flow sequence

        await this.setupTaskSearch(); //Getting the assigned user's task for particular month

        this.ts_comment = <KloEntitySet<d_o2c_ts_comment>>await this.transaction.getExecutedQuery("d_o2c_ts_comment", { loadAll: true });
        this.all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name', 'line_manager', 'employee_id'] });

        // Getting the task ids for the selected month
        let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
        let wo_lv_task_list = task_list.filter(task => task.task_type != "Leave");
        // Fetch all comments in a map for quick lookup
        this.taskCommentsMap = new Map(this.ts_comment.map(comment => [comment.task_id, true]));

        await Promise.all(wo_lv_task_list.map(async (task) => {
            let booked_hrs = await this.transaction.getExecutedQuery("d_o2c_timesheet_time_booking", {
                loadAll: true,
                task_id: task.task_id
            });

            // Calculate total booked hours
            let sum_of_hrs = booked_hrs.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
            task.total_booked_hrs = sum_of_hrs;
            // Only calculate balance if planned_hours is NOT null/undefined
            if (task.planned_hours != null) {
                task.balance = task.planned_hours - sum_of_hrs;
            }

            task.assigned_by_name = this.all_emp.find(emp => emp.employee_id == task.assigned_by.toUpperCase())?.full_name;

            // Check if a comment exists
            task.comment = this.taskCommentsMap.has(task.task_id);
        }));
        await this.tm.getTN("curr_month_assigned_task").setData(wo_lv_task_list);
        this.curr_month_assigned_task_detail = wo_lv_task_list[0];
        let task_id_list = [];
        task_list.forEach(task => {
            task_id_list.push(task.task_id);
        });
        // Fetching task ids ends....

        if (task_id_list.length) {
            this.time_booking = await this.fetchTimeBooking(task_id_list); // Get the TS booking data for all the task assigned for a month.
        }


        await this.findHolidayofEmp(); // To find the holidays based on the BA of the user and also the leaves for a month period

        if (task_id_list.length) {
            await this.generateCurrMonthTs(); // Restructuring the model in order to satisfy the UI requirement.
        }

        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the restructured model to transnode  

        this.removeGridColumn(); // First remove the dynamically added column

        await this.addTaskColumn(); // Dynamically adding the task hours column in UI....

        await this.empCurrMonthHoliday(); // Set the Current Month Holidays in TS 

        await this.taskListProgressIndicator(false);

        await this.systemCheck();

        oBusyIndicator.close();

    }

    public async onRejectConfirm() {
        sap.m.MessageBox.confirm(
            "Do you really want to reject the Time Sheet? Please click on OK to continue.",
            {
                title: "Confirm",
                actions: ["OK", "Cancel"],
                emphasizedAction: "OK",
                onClose: async (oAction) => {
                    if (oAction == "OK") {
                        await this.onReject();
                    }
                },
            }
        );
    }

    public async onReject() {
        let apprvl_list = await this.tm.getTN("ts_approver_detail").getData();
        let detail = apprvl_list[apprvl_list.index];
        let remark_detail = await this.tm.getTN("control_button_action").getData();
        if (remark_detail.remark == null || remark_detail.remark == undefined || remark_detail.remark?.trim() == "") {
            await this.tm.getTN("control_button_action").setProperty("validate", true);
            return;
        }
        let ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { loadAll: true, submit_id: detail.submit_id, employee_id: detail.employee_id });
        let ts_task_task_id;
        let ts_approver = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: detail.submit_id });
        let assigned_task = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: detail.from_date, end_mnth: detail.to_date, assigned_by: apprvl_list.assigned_by, employee_id: detail.employee_id });
        let task_id_list = [];
        for (let task of assigned_task) {
            task_id_list.push(task.task_id);
        }
        let ts_task = [];
        if (task_id_list.length) {
            ts_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true, submit_id: detail.submit_id, task_id: task_id_list });
        }
        for (let approver of ts_approver) {
            if (approver.approver.toLowerCase() == apprvl_list.assigned_by && approver.approval_status == "Pending") {
                approver.approval_status = "Rejected";
                approver.approved_on = new Date();
                approver.approver_remark = remark_detail.remark;
                ts_header[0].over_all_status = "Rejected";
                ts_task_task_id = assigned_task.find(item => item.assigned_by.toLowerCase() == apprvl_list.assigned_by);

            } else if (approver.approval_status == "Pending") {
                approver.approval_status = `Rejected by PM`;
                approver.approved_on = new Date();
            }
        }
        if (ts_task.length && ts_task_task_id) {
            for (let task of ts_task) {
                if (ts_task_task_id.task_id == task.task_id) {
                    task.status = "Rejected";
                    break;
                }
            }
        }
        /*Rejection Notification Starts...*/
        await this.tm.getTN("ts_approve_reject").setProperty('emp_id', ts_header[0].employee_id);
        await this.tm.getTN("ts_approve_reject").setProperty('type', "newTSReject");
        await this.tm.getTN("ts_approve_reject").setProperty('month', ts_header[0].from_date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        await this.tm.getTN("ts_approve_reject").setProperty('approver', apprvl_list.assigned_by.toUpperCase());
        await this.tm.getTN("ts_approve_reject").setProperty('over_all_status', ts_header[0].over_all_status);
        await this.tm.getTN("ts_approve_reject").executeP();
        /*Rejection Notification Ends...*/
        await this.tm.commitP("Rejected Successfully", "Rejection Failed", true, true);
        apprvl_list[apprvl_list.index].pending_with_me = false;

        let header_list = await apprvl_list.controller.tm.getTN("ts_header_other").getData();
        for (let header = 0; header < header_list.length; header++) {
            if (header_list[header].employee_id == apprvl_list[apprvl_list.index].employee_id) {
                header_list[header].pending_with_me = false;
                header_list[header].over_all_status = ts_header[0].over_all_status;
            }
        }
        await apprvl_list.controller.onStatusChange();
        remark_detail.remark = null;
        if (apprvl_list.index == (apprvl_list.length - 1)) {
            await apprvl_list.controller.closeDialog("pa_ts_apprvl_dialog");
        } else {
            await this.onRightArrowClick();
        }
    }

    public async onLeftArrowClick() {
        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Loading....");
        oBusyIndicator.open();
        let apprvl_list = await this.tm.getTN("ts_approver_detail").getData();
        // let firstIndex = true;
        let index = apprvl_list.index;
        if (index == 1) {
            // firstIndex = false;
            await this.tm.getTN("ts_approver_detail").setProperty("firstIndex", false);
        }
        await this.tm.getTN("ts_approver_detail").setProperty("lastIndex", true);
        await this.tm.getTN("ts_approver_detail").setProperty("index", index - 1);
        await this.changeTSforNextIndex((index - 1));
        await apprvl_list.controller.tm.getTN("dialog_params").setProperty("index", index - 1);
        await apprvl_list.controller.tm.getTN("dialog_params_detail").setData(apprvl_list[index - 1]);
        // this.detail = await this.tm.getTN("o2c_timesheet_header_list").getData()[index - 1];
        // await this.tm.getTN("o2c_timesheet_header_list").setActive(index - 1);
        // // await this.navTo(({ S: "p_ts_apprvl_list", SS: "s_o2c_tim_detail" }));
        // await this.tm.getTN("dialog_params").setData(this.detail);
        // await this.closeDialog("pa_ts_apprvl_dialog");
        // await this.openDialog("pa_ts_apprvl_dialog");
        oBusyIndicator.close();
    }

    public async remarkUpdate() {
        let remark_detail = await this.tm.getTN("control_button_action").getData().remark;
        if (remark_detail) {
            await this.tm.getTN("control_button_action").setProperty("validate", false);
        }
    }

    public async generateApprovalTable(list) {
        let table = [];
        list.forEach(element => {
            let approver_name_obj = this.all_emp.find(emp => emp.employee_id == element.approver?.toUpperCase());
            table.push({
                approver: element.approver,
                approver_name: approver_name_obj.full_name,
                cycle: element.task_version + 1,
                level: element.approval_sequence + 1,
                status: element.approval_status,
                approved_on: element.approved_on
            })
        });
        return table;
    }


}