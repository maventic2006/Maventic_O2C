/** 
    NOTE: Please do not change the order of the function call as the TS is itself complex and if trying to change the order each and
    every functionality needs to be tested without miss.
*/

import { KloEntitySet } from 'kloBo/KloEntitySet';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_business_area } from 'o2c_v2/entity/d_o2c_business_area';
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_leave_management } from 'o2c_v2/entity/d_o2c_leave_management';
import { d_o2c_timesheet_time_booking } from 'o2c_v2/entity/d_o2c_timesheet_time_booking';
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_holiday_calendar } from 'o2c_v2/entity_gen/d_o2c_holiday_calendar';
import { d_o2c_task_assignment } from 'o2c_v2/entity_gen/d_o2c_task_assignment';
import { d_o2c_timesheet_approver } from 'o2c_v2/entity_gen/d_o2c_timesheet_approver';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
import { d_o2c_ts_comment } from 'o2c_v2/entity_gen/d_o2c_ts_comment';
import q_approved from 'o2c_v2/metadata/m_queries/q_approved_metadata';
import { traveltotimesheet } from 'o2c_v2/util/traveltotimesheet';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_ts_redesign")
export default class p_ts_redesign extends KloController {
    public start_date; // Stores the start date of the selected month
    public end_date; // Stores the end date of the selected month
    public curr_month_ts = []; // Stores the selected month TS data after restructuring in the model...
    public fixedColumnCount = 5; // Change this value if the fixedColumnCount is changed in UI.
    public userid; // Stores the logged in user id. Also gets replaced after selecting the Mentees.
    public thisUser; // Stores the logged in user employee object..
    public time_booking = []; // Stores the Day wise data of the TS fetched from DB....
    public ts_comment = []; // Stores the entire comment maintained in TS....
    public curr_month_assigned_task_detail; // Stores the curr month assigned detail data mainly used to show the comment...
    public taskCommentsMap; // Map to store the comments..
    public ts_header = []; //Stores all the ts header list between the selected month..
    public all_emp = [];// Stores all employee data to set the names
    public emp_pc; //Stores the logged in person org detail
    public general_confg = []; //Stores the profit center from general config table to make the visibility based on PC
    public transac; // Stores the newly created transaction for the submit action..
    // public achieved_working_hrs = 0; // Store the actual working hrs submitted by emp.
    // public total_working_days = 0; // Store the total working days excluding weekend and holidays..

    /* Loads the below method when entering the screen first time  */
    public async onPageEnter() {
        try {
            await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ts_redesign");
            await this.tm.getTN("mnth_selection_other").setData({});
            this.userid = (await this.transaction.get$User()).login_id; //Getting the logged in user id
            let month = new Date();
            this.tm.getTN("mnth_selection_other").setProperty('month', month);
            this.tm.getTN("mnth_selection_other").setProperty('emp_id', this.userid?.toUpperCase());

            // let oBusyIndicator = new sap.m.BusyDialog();
            // oBusyIndicator.setText("Loading....");
            // oBusyIndicator.open();

            let busyID = this.showBusy({ blocked: true });

            this.setStartAndEndDate(month);    //To set the start and end date of the month


            await this.lmCheck(this.userid); //To set the mentees if any in the dropdown

            await this.setTSStatusCurrMonth(); // To set the current month TimeSheet status

            await this.setTSApprovalFlow(); // To set the approval flow sequence

            await this.setupTaskSearch(); //Getting the assigned user's task for particular month
            this.emp_pc = this.thisUser[0].r_employee_org.find(org => org.is_primary == true);
            this.general_confg = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", {
                loadAll: true,
                key: "profit_center"
            });

            // Ensure this.general_confg is defined and has data before checking the condition
            if (this.general_confg?.length > 0 && this.general_confg.some(config => config.high_value === this.emp_pc.profit_centre)) {
                await this.tm.getTN("pc_wise_visibility").setData(false);
            }

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

            if (wo_lv_task_list.length) {
                await this.generateCurrMonthTs(); // Restructuring the model in order to satisfy the UI requirement.
            }

            await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the restructured model to transnode  

            await this.addTaskColumn(); // Dynamically adding the task hours column in UI....

            await this.empCurrMonthHoliday(); // Set the Current Month Holidays in TS 

            await this.taskListProgressIndicator(false);

            // oBusyIndicator.close();
            this.hideBusy(busyID);
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading the saved data. Please check the console.");
            console.log(error);
        }
    }


    /* Loads when navigating to different tasks. */
    public async navToTaskBooking(oEvent) {
        //From oEvent trying to fetch the current index since getActiveIndex method was not working.
        let sPath: string = oEvent.getParameter("rowBindingContext").getPath();
        let index = parseInt(sPath.replace("/curr_month_assigned_task/", ''));
        // Fetching index ends..

        let status = await this.tm.getTN("mnth_selection_other").getData().status; // Get the status of the curr month TS

        // let oBusyIndicator = new sap.m.BusyDialog();
        // oBusyIndicator.setText("Loading....");
        // oBusyIndicator.open();

        let busyID = this.showBusy({ blocked: true });

        // Saving the data only for Not Submitted TS. As for Submitted and Approved it will not be allowed to edit.
        if (status == "Not Submitted" || status == "Rejected") {
            await this.onSave(true); // Before loading the next task data committing the changes because for remarks column restructuring is not done like hrs column. 
        }

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
        // oBusyIndicator.close();
        this.hideBusy(busyID);
    }


    /* Loads when selecting the month from dropdown field */
    public async onMonthSelect() {
        // let oBusyIndicator = new sap.m.BusyDialog();
        // oBusyIndicator.setText("Loading....");
        // oBusyIndicator.open();
        let busyID = this.showBusy({ blocked: true });
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
        if (wo_lv_task_list.length) {
            this.time_booking = await this.fetchTimeBooking(task_id_list);
            await this.generateCurrMonthTs();
        }

        await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts); // Set the updated model to transnode  

        await this.empCurrMonthHoliday(); //Set the Current Month Holidays in TS 

        this.removeGridColumn(); // First remove the dynamically added column

        await this.addTaskColumn(); // Add the new ones..

        await this.taskListProgressIndicator(false); // Set the progress indicator in task list...
        // oBusyIndicator.close();
        this.hideBusy(busyID);
    }

    /* To set the start and end date of the month */
    private setStartAndEndDate(date: Date) {
        this.start_date = new Date(date.getFullYear(), date.getMonth(), 1);
        this.end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /* Activating the transnode to get the current task data */
    private async setupTaskSearch() {
        try {
            this.tm.getTN("curr_mnth_task_search").setProperty("start_mnth", this.start_date);
            this.tm.getTN("curr_mnth_task_search").setProperty("end_mnth", this.end_date);
            this.tm.getTN("curr_mnth_task_search").setProperty("employee_id", this.userid);
            await this.tm.getTN("curr_mnth_task_search").getData().setLoadAll(true);
            await this.tm.getTN("curr_mnth_task_search").executeP();
            await this.tm.getTN("curr_mnth_task_list").setActive(0);
        } catch (error) {
            sap.m["MessageToast"].show("Error while setting the Task Search. Please check the console.");
            console.log(error);
        }
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
                    // booking_id: curr_day_time_booking?.booking_id,
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
                    editable: edit.editable,
                    tooltip: curr_holidayAndLeave?.type === "holiday" ? "Holiday" :
                        curr_holidayAndLeave?.type === "half" ? "Half Day Leave" :
                            curr_holidayAndLeave?.type === "full" ? "Full Day Leave" :
                                curr_holidayAndLeave?.type === "applied" ? "Applied Leave" :
                                    isWeekend === true ? "Weekend" :
                                        isTravel ? "Travel" :
                                            null
                };

                // Add task data for each employee tasks
                emp_task_list.forEach(task => {
                    let task_time_booking = this.time_booking.find(
                        item => this.isSameDate(item.booking_date, start_date_obj) && item.task_id === task.task_id
                    );

                    let hours_worked = task_time_booking?.hours_worked || 0;

                    let edit = this.editableCheck(start_date_obj, task, status); // To check for editability of that field.

                    // Store the hours worked for the specific task on this day
                    curr_day_entry[`task_${task.task_id}`] = hours_worked;
                    curr_day_entry[`rmrk_${task.task_id}`] = task_time_booking?.remarks;
                    curr_day_entry[`edit_${task.task_id}`] = edit.editable;
                    curr_day_entry[`book_${task.task_id}`] = task_time_booking?.booking_id;

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

            }// end of while loop


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
        try {
            this.thisUser = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': userid, loadAll: true, expandAll: "r_employee_org" });
            let allEmployee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userid, is_active: true, loadAll: true });
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
                allEmployee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, is_active: true, loadAll: true });

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
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading the employee hierarchy. Please check the console.");
            console.log(error);
        }
    }

    // After selecting a Mentee
    public async onMenteeSelect() {
        let empid = await this.tm.getTN("mnth_selection_other").getData();
        if (empid.emp_id) {
            this.userid = empid.emp_id
        } else {
            this.userid = (await this.transaction.get$User()).login_id;
        }
        this.thisUser = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': this.userid, loadAll: true, expandAll: "r_employee_org" });
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
        if (wo_lv_task_list.length) {
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
            let other_calendar_id = <KloEntitySet<d_o2c_business_area>>await this.transaction.getExecutedQuery('d_o2c_business_area', { company_code: empOrg[0].company_code, partialSelect: ['office_calender', 'name', 'company_code', 'business_area'], loadAll: true })
            let calendar_id = other_calendar_id.find(({ company_code, business_area }) => company_code == empOrg[0].company_code && business_area == empOrg[0].business_area)
            let holidaylist = <KloEntitySet<d_o2c_holiday_calendar>>await this.transaction.getExecutedQuery('q_holidays', { loadAll: true, office_cal_id: calendar_id.office_calender });
            this.tm.getTN('holiday_list').setData(holidaylist);
            await this.setDateForCalendar();
        } catch (e) {
            console.error("Error in getting the holidays ");
            console.log(e);
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
    public async onSave(flag) {
        let curr_ts = await this.tm.getTN("ts_fill_other").getData();
        let curr_task_list = await this.tm.getTN("curr_month_assigned_task").getData();
        let tryflag = true;
        // let task_detail = await this.tm.getTN("curr_mnth_task_detail").getData()
        try {
            for (let i = 0; i < curr_ts.length; i++) {
                for (let j = 0; j < curr_task_list.length; j++) {
                    if (curr_ts[i][`book_${curr_task_list[j].task_id}`] == null || curr_ts[i][`book_${curr_task_list[j].task_id}`] == undefined || curr_ts[i][`book_${curr_task_list[j].task_id}`] == "") {
                        if (parseFloat(curr_ts[i][`task_${curr_task_list[j].task_id}`]) > 0) {
                            await this.transaction.createEntityP("d_o2c_timesheet_time_booking", {
                                task_id: curr_task_list[j].task_id,
                                booking_date: curr_ts[i].date,
                                hours_worked: curr_ts[i][`task_${curr_task_list[j].task_id}`],
                                remarks: curr_ts[i][`rmrk_${curr_task_list[j].task_id}`]
                            })
                        }
                    } else {
                        let filteredTimeBooking = this.time_booking.find(item => item.booking_id === curr_ts[i][`book_${curr_task_list[j].task_id}`]);
                        filteredTimeBooking.hours_worked = curr_ts[i][`task_${curr_task_list[j].task_id}`];
                        filteredTimeBooking.remarks = curr_ts[i][`rmrk_${curr_task_list[j].task_id}`];
                    }
                }
            }
            if (flag == true) {
                await this.transaction.commitP();
            } else if (flag == "submit") {
                await this.tm.commitP("Submitted Successfully", "Submission Failed", true, true);
                await this.transac.commitP();
            } else {
                await this.tm.commitP("Saved Successfully!", "Save Failed", true, true);
            }

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
        } catch (e) {
            console.log(e);
            await this.transac.rollback();
            sap.m.MessageToast.show((flag == "submit") ? "Submission Failed" : "Save Failed", { duration: 4000 });
            tryflag = false;
        }

        return tryflag;
    }

    //Month Select From Calendar
    // public async monthChangeInCalendar(oEvent) {
    //     var oCalendar = oEvent.getSource();
    //     let isMonth = oCalendar._oFocusedDate._oUDate.oDate;
    //     await this.tm.getTN("mnth_selection_other").resetP(true);
    //     await this.tm.getTN("mnth_selection_other").refresh();
    //     this.tm.getTN("mnth_selection_other").setProperty("month", isMonth);
    //     await this.tm.getTN("mnth_selection_other").resetP(true);
    //     await this.tm.getTN("mnth_selection_other").refresh();
    //     await this.onMonthSelect();
    // }

    // Adding the columns dynamically..
    public async addTaskColumn() {
        try {
            let m = this.s.model_name;
            let c = this.getActiveControlById(null, "s_ts_fill2");
            let list = await this.tm.getTN("curr_month_assigned_task").getData();
            if (list.length == 0) { // Setting the toolbar indicator to 0 if there is no task assigned for curr month
                await this.tm.getTN("ts_filling_toolbar_indicator").setData({ percentage: 0 });
            }
            let status = await this.tm.getTN("mnth_selection_other").getData().status;
            for (let olistitem of list) {
                let input = new sap.m.Input({
                    value: "{" + m + ">task_" + olistitem.task_id + "}",
                    editable: "{" + m + ">edit_" + olistitem.task_id + "}",
                    type: sap.m.InputType.Number,
                    step: 0,  // Disable step increment/decrement
                    change: (oEvent) => {
                        this.onHrsChangeUpdateTotalProgress(oEvent)
                    }
                });

                // Prevent scroll-based value change
                input.attachBrowserEvent("wheel", function (oEvent) {
                    oEvent.preventDefault();
                });

                c.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({
                        text: olistitem.task_name + " Hrs",
                        tooltip: olistitem.task_name
                    }),
                    template:
                        ((this.emp_pc.profit_centre == this.general_confg[0]?.high_value || list[0].task_id === olistitem.task_id) && (status == "Not Submitted" || status == "Rejected")) //Making editable only the first task hrs filling and if BPM then all task editable
                            ? input
                            : new sap.m.Label({
                                text: "{" + m + ">task_" + olistitem.task_id + "}"
                            }),
                    minWidth: 10
                }))
            }
        } catch (error) {
            console.log(error);
        }
    }

    // Removing the columns
    public removeGridColumn() {
        let c = this.getActiveControlById(null, "s_ts_fill2");
        let length = c.getColumns().length;
        for (let i = length - 1; i >= this.fixedColumnCount; i--) {
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
        try {
            this.ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("q_o2c_timesheet_list", {
                loadAll: true,
                date_of_search: this.start_date, date_of_end: this.end_date, employee_id: this.userid
            });
            // Ensure ts_header[0] exists before accessing properties
            this.tm.getTN("mnth_selection_other").setProperty('status', this.ts_header[0]?.over_all_status ?? "Not Submitted");
            this.tm.getTN("mnth_selection_other").setProperty('submit_id', this.ts_header[0]?.submit_id);
        } catch (error) {
            sap.m["MessageToast"].show("Error while setting the TS status. Please check the console.");
            console.log(error);
        }
    }

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
        for (let i = this.fixedColumnCount; i < all_col.length; i++) {
            const template = all_col[i].getTemplate();
            if (template instanceof sap.m.Label || template instanceof sap.m.Input) {
                const bindingInfo = template.mBindingInfos;
                const key = template instanceof sap.m.Label ? 'text' : 'value';
                if (bindingInfo[key].parts[0].path) {
                    task_id_list.push(bindingInfo[key].parts[0].path);
                }
            }
        }


        for (let i = 1, j = 0; i < all_col.length; i++) { //Starting from 1 because 0 index doesn't contain tooltip
            // .find(col => (col.getLabel().getText()) == selectedTask.project_name);
            col = all_col[i];
            let tool_tip = col.getLabel().getTooltip();
            // let label_txt = col_label.getText();
            if (tool_tip == selectedTask.task_name) {
                col_index = i;
            }
            //First Setting all the col to labels...
            if (this.emp_pc.profit_centre !== this.general_confg[0]?.high_value && i >= this.fixedColumnCount && (status == "Not Submitted" || status == "Rejected")) {
                col.setTemplate(new sap.m.Label({
                    text: "{" + m + ">" + task_id_list[j] + "}"
                }));
                j++;
            }
        }
        // let col_index = c.getColumns().findIndex(col => col.getTemplate().getValue() == selectedTask.project_name);

        //Second Setting the selected col in task list to input
        if (status == "Not Submitted" || status == "Rejected") {
            let input = new sap.m.Input({
                value: "{" + m + ">task_" + selectedTask.task_id + "}",
                editable: "{" + m + ">edit_" + selectedTask.task_id + "}",
                type: sap.m.InputType.Number,
                step: 0,  // Disable step increment/decrement
                change: (oEvent) => this.onHrsChangeUpdateTotalProgress(oEvent)
            });

            // Prevent scroll-based value change
            input.attachBrowserEvent("wheel", function (oEvent) {
                oEvent.preventDefault();
            });

            all_col[col_index].setTemplate(input);
        }
        c.removeColumn(col_index);
        c.insertColumn(all_col[col_index], this.fixedColumnCount);
    }

    //Editability check for a particular day
    public editableCheck(start_date_obj, task_detail, status) {
        let editable = false;
        let checkForBookingDateinTaskDateRange = false;
        if (start_date_obj >= task_detail.task_start_date.setHours(0, 0, 0, 0) &&
            start_date_obj <= task_detail.task_end_date.setHours(0, 0, 0, 0) && (status == "Not Submitted" || status == "Rejected")) {
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

    //On click of submit button
    public async onSubmit() {
        let appliedLeave = [];
        let daily_ts_filling_check = [];
        let mnth_ts = await this.tm.getTN("ts_fill_other").getData();
        for (let i = 0; i < mnth_ts.length; i++) {
            if (mnth_ts[i].appliedColor == true) {
                appliedLeave.push(mnth_ts[i]);
            }
            if (mnth_ts[i].total != 8 && mnth_ts[i].weekendDate == false && mnth_ts[i].holidayColor == false) { //Change the hard coded 8 hrs to office calendar assigned working hours for the BA.
                daily_ts_filling_check.push(mnth_ts[i]);
            }
        }
        await this.tm.getTN("applied_lv_validation").setData(appliedLeave);
        await this.tm.getTN("daily_fill_ts_validation").setData(daily_ts_filling_check);
        if (daily_ts_filling_check.length > 0 || appliedLeave.length > 0) {
            await this.openDialog("pa_validation");
        } else {
            sap.m.MessageBox.confirm(
                "Do you really wish to submit your Time Sheet? Please click on OK to submit.",
                {
                    title: "Confirm",
                    actions: ["OK", "Cancel"],
                    emphasizedAction: "OK",
                    onClose: async (oAction) => {
                        if (oAction == "OK") {
                            await this.onAfterSubmit();
                        }
                    },
                }
            );
        }
    }

    // On click of continue button.
    public async onAfterSubmit() {
        let appliedLeave = await this.tm.getTN("applied_lv_validation").getData();
        let daily_ts_filling_check = await this.tm.getTN("daily_fill_ts_validation").getData();
        if (daily_ts_filling_check.length > 0 || appliedLeave.length > 0) {
            await this.closeDialog("pa_validation");
        }
        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Loading....");
        oBusyIndicator.open();
        let status = await this.tm.getTN("mnth_selection_other").getData().status;
        let ts_header; // Store the header detail incase of Rejected TS
        this.transac = await this.transaction.createTransaction();
        try {
            if (status == "Not Submitted") { // Submitting First Time
                ts_header = await this.transac.createEntityP("d_o2c_timesheet_header", {
                    employee_id: this.userid.toUpperCase(),
                    from_date: this.start_date,
                    to_date: this.end_date,
                    over_all_status: "Submitted"
                })
                ts_header.submitted_on = ts_header.s_created_on;

                let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
                let lv_task = task_list.filter(task => task.task_type == "Leave");

                if (lv_task && lv_task.length > 0) {
                    await this.transac.createEntityP("d_o2c_timesheet_task", {
                        task_id: lv_task[0].task_id,
                        submit_id: ts_header.submit_id,
                        status: "Submitted"
                    })
                }

                let list = await this.tm.getTN("curr_month_assigned_task").getData();
                // Extract unique assigned_by values
                let assigned_by_set = new Set(list.map(task => task.assigned_by.toLowerCase()));
                let lmAssignedTask = false;
                let uniqueApprovers = new Set(); // Track unique approvers
                uniqueApprovers.add(this.userid.toLowerCase()); // Adding the userid to prevent his id adding in the approval flow

                for (let i = 0; i < list.length; i++) {
                    let level = 0;

                    if (this.thisUser[0].line_manager == list[i].assigned_by.toUpperCase()) {
                        lmAssignedTask = true;
                        if (assigned_by_set.size == 1) {
                            level = 0;
                        } else if (assigned_by_set.size == 2 && assigned_by_set.has(this.userid.toLowerCase())) {
                            level = 0;
                        }
                        else {
                            level = 1;
                        }
                    }
                    await this.transac.createEntityP("d_o2c_timesheet_task", {
                        task_id: list[i].task_id,
                        submit_id: ts_header.submit_id,
                        status: "Submitted"
                    })
                    // Add only unique approvers
                    if (!uniqueApprovers.has(list[i].assigned_by.toLowerCase())) {
                        uniqueApprovers.add(list[i].assigned_by.toLowerCase());
                        await this.transac.createEntityP("d_o2c_timesheet_approver", {
                            task_version: 0,
                            approval_sequence: level,
                            submit_id: ts_header.submit_id,
                            approver: list[i].assigned_by.toUpperCase(),
                            approval_status: "Pending",
                            approver_remark: " "
                        });
                    }
                }

                if (!lmAssignedTask) {
                    await this.transac.createEntityP("d_o2c_timesheet_approver", {
                        task_version: 0,
                        approval_sequence: (assigned_by_set.size == 1 && assigned_by_set.has(this.userid.toLowerCase())) ? 0 : 1, // if only user has assigned the task then level 0  otherwise 1.
                        submit_id: ts_header.submit_id,
                        approver: this.thisUser[0].line_manager,
                        approval_status: "Pending",
                        approver_remark: " "
                    })
                }
            }

            else if (status == "Rejected") { // Submitting after rejection.
                ts_header = this.ts_header[0];
                ts_header.over_all_status = "Submitted";
                let lmAssignedTask = false;
                let uniqueApprovers = new Set(); // Track unique approvers
                uniqueApprovers.add(this.userid.toLowerCase()); // Adding the userid to prevent his id adding in the approval flow

                //Taking from query instead of transnode 
                let emp_all_task = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: ts_header.from_date, end_mnth: ts_header.to_date, employee_id: this.thisUser[0].employee_id });
                let assigned_task = emp_all_task.filter(task => task.task_type != "Leave");
                // Extract unique assigned_by values
                let assigned_by_set = new Set(assigned_task.map(task => task.assigned_by));
                let ts_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true, submit_id: ts_header.submit_id });
                let ts_approver = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: ts_header.submit_id });
                let highestCycle = Math.max(...ts_approver.map(approver => approver.task_version));


                let lv_task = emp_all_task.filter(task => task.task_type == "Leave");

                if (lv_task.length > 0) {
                    const leaveTaskId = lv_task[0].task_id;

                    const isLeaveTaskInTsTask = ts_task.some(task => task.task_id === leaveTaskId);

                    if (isLeaveTaskInTsTask) {
                        // Leave task is present in ts_task
                    } else {
                        // Leave task is NOT present in ts_task
                        await this.transac.createEntityP("d_o2c_timesheet_task", {
                            task_id: lv_task[0].task_id,
                            submit_id: ts_header.submit_id,
                            status: "Submitted"
                        })
                    }
                }

                for (let i = 0; i < assigned_task.length; i++) {

                    const assignedTaskItem = assigned_task[i];
                    let level = 0;

                    // Check if ts_task already contains the task_id from assigned_task
                    let existingTask = ts_task.find(task => task.task_id === assignedTaskItem.task_id);

                    // If not found, create a new entry in ts_task
                    if (!existingTask) {
                        this.transaction.createEntityP("d_o2c_timesheet_task", {
                            task_id: assignedTaskItem.task_id,
                            submit_id: ts_header.submit_id,
                            status: "Submitted"
                        })
                    } else {
                        existingTask.status = "Submitted";
                    }

                    if (this.thisUser[0].line_manager == assigned_task[i].assigned_by.toUpperCase()) {
                        lmAssignedTask = true;
                        if (assigned_by_set.size == 1) {
                            level = 0;
                        } else if (assigned_by_set.size == 2 && assigned_by_set.has(this.userid.toLowerCase())) {
                            level = 0;
                        }
                        else {
                            level = 1;
                        }
                    }


                    // Add only unique approvers
                    if (!uniqueApprovers.has(assigned_task[i].assigned_by.toLowerCase())) {
                        uniqueApprovers.add(assigned_task[i].assigned_by.toLowerCase());
                        await this.transaction.createEntityP("d_o2c_timesheet_approver", {
                            task_version: highestCycle + 1,
                            approval_sequence: level,
                            submit_id: ts_header.submit_id,
                            approver: assigned_task[i].assigned_by.toUpperCase(),
                            approval_status: "Pending",
                            approver_remark: " "
                        });
                    }
                }

                if (!lmAssignedTask) {
                    await this.transaction.createEntityP("d_o2c_timesheet_approver", {
                        task_version: highestCycle + 1,
                        approval_sequence: (assigned_by_set.size == 1 && assigned_by_set.has(this.userid.toLowerCase())) ? 0 : 1, // if only user has assigned the task then level 0  otherwise 1.
                        submit_id: ts_header.submit_id,
                        approver: this.thisUser[0].line_manager,
                        approval_status: "Pending",
                        approver_remark: " "
                    })
                }

            }
            let tryflag = await this.onSave("submit");
            if (tryflag == true) {
                await this.tm.getTN("mnth_selection_other").setProperty('status', "Submitted");
                await this.tm.getTN("mnth_selection_other").setProperty('submit_id', ts_header.submit_id);
                let task_list = await this.tm.getTN("curr_mnth_task_list").getData();
                let task_id_list = [];
                task_list.forEach(task => {
                    task_id_list.push(task.task_id);
                });
                this.time_booking = await this.fetchTimeBooking(task_id_list);
                await this.generateCurrMonthTs();
                await this.tm.getTN("ts_fill_other").setData(this.curr_month_ts);
                await this.setTSApprovalFlow();
            }
        } catch (e) {
            console.log(e);
        }
        oBusyIndicator.close();
    }

    //Holidays for emp for selected month..
    public async empCurrMonthHoliday() {
        try {
            let emp_holiday = await this.tm.getTN("holiday_list").getData();
            let curr_mnth_holiday = emp_holiday.filter(holiday => holiday.holiday_date >= this.start_date && holiday.holiday_date <= this.end_date);
            await this.tm.getTN("curr_month_holiday").setData(curr_mnth_holiday);
        } catch (error) {
            console.log(error);
        }
    }

    //Get the timesheet approval flow data...
    public async setTSApprovalFlow() {
        try {
            let submit_id = await this.tm.getTN("mnth_selection_other").getData().submit_id;
            let ts_approval = [];
            if (submit_id) {
                ts_approval = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { submit_id: submit_id, loadAll: true });
            }
            await this.tm.getTN("ts_approval").setData(ts_approval);
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading TS Approval Flow. Please check the console.");
            console.log(error);
        }
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
        try {
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
                        if (curr_ts_data[j][`task_${emp_assigned_task[i].task_id}`] > 0 && curr_ts_data[j][`rmrk_${emp_assigned_task[i].task_id}`]) {
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
        } catch (error) {
            console.log(error);
        }
    }

    // Dynamically changing the Task List progress indicator on change of remarks..
    public async onrmkChangeUpdateProgress(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/ts_fill_other/", ''));
        let mnth_ts_detail = await this.tm.getTN("ts_fill_other").getData()[index];
        mnth_ts_detail[`rmrk_${this.curr_month_assigned_task_detail.task_id}`] = mnth_ts_detail.remarks;
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
        let inputField = oEvent.getSource();
        let newValue = oEvent.getParameter("value");
        newValue = newValue === "" ? 0 : parseFloat(newValue) || 0; // Ensure numeric value

        if (isNaN(newValue) || newValue < 0 || newValue > 24) {
            if (newValue < 0) {
                inputField.setValue("0");
                newValue = 0;
            }
            inputField.setValueState(sap.ui.core.ValueState.Error);
            inputField.setValueStateText("Please enter a number between 0 and 24.");
        } else {
            inputField.setValueState(sap.ui.core.ValueState.None); // Remove error state


            let index = parseInt(sPath.replace("/ts_fill_other/", ''));
            //Get the curr month TS Filling..
            let curr_ts_filling = await this.tm.getTN("ts_fill_other").getData();
            let curr_ts_data_changed = curr_ts_filling[index];

            // Getting all the assigned task for this month
            let task_list = await this.tm.getTN("curr_mnth_task_list").getData();

            // Store previous value before updating
            // let previousValue = parseFloat(curr_ts_data_changed.total) || 0;

            // Calculate the difference considering removal
            // let diff = Math.abs(previousValue - newValue);

            // Update total properly
            let total = 0;
            let achieved_working_hrs = 0;
            for (let task of task_list) {
                task.total_booked_hrs = task.total_booked_hrs - task.curr_mnth_booked_hrs;
                let sum_of_hrs = curr_ts_filling.reduce((sum, entry) => sum + (parseFloat(entry[`task_${task.task_id}`]) || 0), 0);
                task.curr_mnth_booked_hrs = sum_of_hrs;
                task.total_booked_hrs += sum_of_hrs;
                achieved_working_hrs += sum_of_hrs;
                // Only calculate balance if planned_hours is NOT null/undefined
                if (task.planned_hours != null) {
                    task.balance = task.planned_hours - sum_of_hrs;
                }
                let value = parseFloat(curr_ts_data_changed[`task_${task.task_id}`]) || 0;
                total += value;
            }
            curr_ts_data_changed.total = total;

            //Reflect in the transnode.
            let wo_lv_task_list = task_list.filter(task => task.task_type != "Leave");
            await this.tm.getTN("curr_month_assigned_task").setData(wo_lv_task_list);

            // Update toolbar indicator
            let ts_fill_toolbar_indicator_obj = await this.tm.getTN("ts_filling_toolbar_indicator").getData();
            // if (newValue !== previousValue) {
            //     ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs += (newValue > previousValue) ? diff : -diff; // Adjust when removing
            // }
            await this.tm.getTN("ts_filling_toolbar_indicator").setProperty("achieve_wrkng_hrs", achieved_working_hrs);
            // Update percentage
            ts_fill_toolbar_indicator_obj.percentage = parseFloat(
                ((ts_fill_toolbar_indicator_obj.achieve_wrkng_hrs / ts_fill_toolbar_indicator_obj.total_wrkng_hrs) * 100).toFixed(2)
            );
            await this.tm.getTN("ts_filling_toolbar_indicator").setProperty("percentage", ts_fill_toolbar_indicator_obj.percentage);

        }
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

}