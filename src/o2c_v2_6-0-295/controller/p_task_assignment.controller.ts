import { time } from 'console';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_project_header } from 'o2c_v2/entity_gen/d_o2c_project_header';
import { d_o2c_so_hdr } from 'o2c_v2/entity_gen/d_o2c_so_hdr';
import { d_o2c_task_assignment } from 'o2c_v2/entity_gen/d_o2c_task_assignment';
import { d_o2c_timesheet_time_booking } from 'o2c_v2/entity_gen/d_o2c_timesheet_time_booking';
import { q_project_task } from 'o2c_v2/query_gen/q_project_task';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_task_assignment")
export default class p_task_assignment extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter(oEvent) {
        //SELECT project_name,d_o2c_so_hdr.so from d_o2c_so_profit inner join d_o2c_so_hdr on d_o2c_so_profit.so = d_o2c_so_hdr.so where d_o2c_so_profit.team_head = :empl
    }
    public async taskAssign() {
        let oBusyDailog = new sap.m.BusyDialog().open();
        //
        let userid = (await this.transaction.get$User()).login_id;
        await this.transaction.rollback();
        await this.tm.getTN('assignment_list').createEntityP();
        await this.tm.getTN('assignment_list').setActiveFirst()
        await this.openDialog("pa_task_assign");
        oBusyDailog.close();
    }

    public async project_assyn() {
        let oBusyDailog = new sap.m.BusyDialog().open();
        await this.openDialog("pa_project_dialog");
        oBusyDailog.close();
    }
    public async on_project_select(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/project_id_list/", ''));
        let data = await this.tm.getTN('assignment_detail').getData();
        let project = await this.tm.getTN("project_id_list").getData()[index]
        let prj_id = project.so;
        //this.tm.getTN('assignment_detail').getData().project_id=prj_id;
        data.project_id = prj_id;
        let project_no_list = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("q_project_task", { loadAll: true, so: prj_id });
        if (project_no_list.length == 0) {
            sap.m.MessageBox.error("Project is not created for this Sales Order. Please create the project to assign the task.", {
                title: "Error",                                      // default
                onClose: null,                                       // default
                styleClass: "",                                      // default
                actions: sap.m.MessageBox.Action.CLOSE,              // default
                emphasizedAction: null,                              // default
                initialFocus: null,                                  // default
                textDirection: sap.ui.core.TextDirection.Inherit
            });
        }
        data.actual_project_id = project_no_list[0].project_id;
        let prj_name = project.project_name;
        data.project_name = prj_name;
        await this.tm.getTN("assignment_list").refresh();
        //await this.tm.getTN("project_id_list").getData()[index].setActive();
        await this.closeDialog("pa_project_dialog");
    }

    public async taskEdit(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/assignment_list/", ''));
        let oBusyDailog = new sap.m.BusyDialog().open();
        await this.tm.getTN("assignment_list").setActive(index);
        await this.openDialog("pa_task_edit");
        let data = await this.tm.getTN('assignment_detail').getData();
        this.tm.getTN("task_edit_detail").setData({ start_date: data.task_start_date, end_date: data.task_end_date });
        oBusyDailog.close();
    }

    public async onSave() {
        let data = await this.tm.getTN('assignment_detail').getData();

        let sDate = data.task_start_date;
        let eDate = data.task_end_date;
        if (eDate < sDate) {
            sap.m.MessageBox.error("Select the date correctly");
            return;
        }
        var maxDate = new Date("2024-11-30");
        // if (eDate > maxDate) {
        //     sap.m.MessageBox.error("Can't assign task after 30 November 2024.");
        //     return;
        // }

        let projectName = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so: data.project_id, loadAll: true });
        if (data.task_end_date <= projectName[0].project_end_date) {
            let oBusyDailog = new sap.m.BusyDialog().open();
            let userid = (await this.transaction.get$User()).login_id;
            data.assigned_by = userid
            data.assigned_on = new Date()
            data.project_name = projectName[0].project_name;
            let employee_id = data.employee_id;
            let employee = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { employee_id: employee_id, loadAll: true });
            data.employee_name = employee[0].full_name;
            let sts = await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
            if (sts == false) { } else { await this.closeDialog("pa_task_assign"); }

            // debugger;

            // let eDate = data.task_end_date;
            while (sDate <= eDate) {
                await this.transaction.createEntityP('d_o2c_timesheet_time_booking', {
                    "task_id": data.task_id,
                    "booking_date": sDate
                });
                sDate.setDate(sDate.getDate() + 1);
            }
            this.transaction.commitP();

            oBusyDailog.close();
        }
        else {
            sap.m.MessageBox.error("Task End Date is Greater than Project End Date", { title: "Error", });
        }
    }
    public async onCancel() {
        await this.transaction.rollback();
        await this.tm.getTN("assignment_list").refresh();
        await this.closeDialog("pa_task_assign");
    }

    public async onEditCancel() {
        await this.transaction.rollback();
        await this.closeDialog("pa_task_edit");
    }
    public async onSearchEmploye(oEvent) {

    }
    public async onCancelButton() {

    }

    public async onUpdatee() {
        let data = await this.tm.getTN("assignment_detail").getData();
        let task_detail = await this.tm.getTN("assignment_detail").getData();
        let taskid = task_detail.task_id;
        let start_date = new Date(task_detail.task_start_date);
        let end_date = new Date(task_detail.task_end_date);

        let projectName = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", {
            so: data.project_id,
            loadAll: true,
        });
        data.project_name = projectName[0].project_name;

        // let timesheet_task = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", {
        //     task_id: taskid,
        //     loadAll: true,
        // });

        // let submitArray = timesheet_task.map((item) => item.submit_id);
        let timesheet_header = [];

        timesheet_header = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", {
            // submit_id: submitArray,
            employee_id: data.employee_id,
            over_all_status: ["Submitted", "Approved", "Partially Approved"],
            loadAll: true,
        });


        let prev_data = await this.tm.getTN("task_edit_detail").getData();
        let prevStart = new Date(prev_data.start_date);
        let prevEnd = new Date(prev_data.end_date);

        let submittedMonths = new Set<string>();
        for (const header of timesheet_header) {
            const fromDate = new Date(header.from_date);
            const key = this.dateToMonthYearStrings(fromDate); // MM-YYYY
            submittedMonths.add(key);
        }

        let monthsInNewRange = this.getMonthSetFromRange(start_date, end_date);
        let monthsInPrevRange = this.getMonthSetFromRange(prevStart, prevEnd);

        for (let submittedMonth of Array.from(submittedMonths)) {
            const wasInPrev = monthsInPrevRange.has(submittedMonth);
            const isInNew = monthsInNewRange.has(submittedMonth);

            // 🔒 Case 1: Previously included but now excluded
            if (wasInPrev && !isInNew) {
                sap.m.MessageBox.error(
                    `Can't exclude already submitted month ${submittedMonth} from the updated range.`
                );
                return;
            }

            // 🔒 Case 2: Previously included and still included — check for partial modification
            if (wasInPrev && isInNew) {
                const [monthStr, yearStr] = submittedMonth.split("-");
                const month = parseInt(monthStr, 10) - 1;
                const year = parseInt(yearStr, 10);

                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);

                if (start_date > monthStart || end_date < monthEnd) {
                    sap.m.MessageBox.error(
                        `Can't partially edit submitted month ${submittedMonth}. Entire month must remain within the range.`
                    );
                    return;
                }
            }

            // 🔒 Case 3: Newly included submitted month — NOT allowed
            if (!wasInPrev && isInNew) {
                sap.m.MessageBox.error(
                    `Can't newly include already submitted month ${submittedMonth} in the updated range.`
                );
                return;
            }
        }


        let timesheet_TimeBooking = <KloEntitySet<d_o2c_timesheet_time_booking>>await this.transaction.getExecutedQuery(
            "d_o2c_timesheet_time_booking",
            { task_id: taskid, loadAll: true }
        );

        // DELETE bookings for months that are NOT submitted and are no longer in range
        let changeCount = 0;
        for (let i = timesheet_TimeBooking.length - 1; i >= 0; i--) {
            const bookingMonth = this.dateToMonthYearStrings(timesheet_TimeBooking[i].booking_date);
            const bookingDate = new Date(timesheet_TimeBooking[i].booking_date);

            if (
                !submittedMonths.has(bookingMonth) &&
                (bookingDate < start_date || bookingDate > end_date)
            ) {
                timesheet_TimeBooking[i].s_status = "Archived";
                changeCount++;
            }
        }

        // CREATE bookings for new days in range NOT covered by submitted months
        let sDate = new Date(start_date);
        while (sDate <= end_date) {
            const key = this.dateToMonthYearStrings(sDate);
            if (!submittedMonths.has(key)) {
                const exists = timesheet_TimeBooking.find(tb =>
                    new Date(tb.booking_date).toDateString() === sDate.toDateString()
                );
                if (!exists) {
                    await timesheet_TimeBooking.newEntityP(0, { task_id: taskid, booking_date: new Date(sDate) }, null);
                    changeCount++;
                }else if(exists.s_status === "Archived"){
                    exists.s_status = null;
                    changeCount++;
                }
            }
            sDate.setDate(sDate.getDate() + 1);
        }

        if (changeCount > 0) {
            // await this.transaction.commitP();
            await this.tm.commitP("Save successful", "Save Failed", false, false);
            await this.closeDialog("pa_task_edit");
        } else {
            // If the date range is unchanged, allow the update silently
            if (start_date.getTime() === prevStart.getTime() && end_date.getTime() === prevEnd.getTime()) {
                await this.tm.commitP("Save successful", "Save Failed", false, false);
                await this.closeDialog("pa_task_edit"); // no save needed
            } else {
                sap.m.MessageBox.error("Can't be edited. Already submitted.");
            }
        }
        
    }

    // Utility: MM-YYYY
    private dateToMonthYearStrings(date: Date): string {
        const d = new Date(date);
        return `${("0" + (d.getMonth() + 1)).slice(-2)}-${d.getFullYear()}`;
    }

    // Utility: get all MM-YYYY in a date range
    private getMonthSetFromRange(start: Date, end: Date): Set<string> {
        const result = new Set<string>();
        let current = new Date(start);
        current.setDate(1);
        while (current <= end) {
            result.add(this.dateToMonthYearStrings(current)); // uses zero-padded format
            current.setMonth(current.getMonth() + 1);
        }
        return result;
    }





    public async onUpdate() {
        let data = await this.tm.getTN('assignment_detail').getData();
        let task_detail = await this.tm.getTN("assignment_detail").getData();
        let taskid = task_detail.task_id;
        let start_date = task_detail.task_start_date;
        let end_date = task_detail.task_end_date;

        // can't assign task after 30 Nov, 2024
        // end_date = data.task_end_date;
        // var maxDate = new Date("2024-11-30");
        // if (end_date > maxDate) {
        //     sap.m.MessageBox.error("Can't update task after 30 November 2024.");
        //     return;
        // }

        let projectName = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so: data.project_id, loadAll: true });
        data.project_name = projectName[0].project_name;
        let timesheet_task = await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { task_id: taskid, loadAll: true });
        let submitArray = [];
        for (let i = 0; i < timesheet_task.length; i++) {
            submitArray.push(timesheet_task[i].submit_id);
        }
        let timesheet_header = [];
        if (submitArray.length > 0) {
            timesheet_header = await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { submit_id: submitArray, loadAll: true });
        }
        let temp = false;
        let myMap = new Map();
        let prev_data = await this.tm.getTN("task_edit_detail").getData();
        for (let i = 0; i < timesheet_header.length; i++) {
            if (this.doCommonDatesExist(timesheet_header[i].from_date, timesheet_header[i].to_date, start_date, end_date)) {
                const key = this.dateToMonthYearString(timesheet_header[i].from_date);
                myMap.set(key, true);
                temp = true;
                // check 
            }
        }
        if (myMap.size && !(start_date.toString() === prev_data.start_date.toString())) {
            sap.m.MessageBox.error("Can't be edited. Already submitted.");
            return;
        }
        let mapEntries = Array.from(myMap.entries());
        for (let i = 0; i < myMap.size; i++) {
            let data = mapEntries[i][0].split("-");
            let lastDayOfMonth = new Date(data[1], data[0], 0).getDate();
            let lastDateOfMonth = new Date(`${data[1]}-${data[0]}-${lastDayOfMonth}`);
            lastDateOfMonth.setHours(0, 0, 0, 0);
            if (lastDateOfMonth >= prev_data.start_date && lastDateOfMonth <= prev_data.end_date) {
                continue;
            } else {
                sap.m.MessageBox.error("Can't be edited. Already submitted.");
                return;
            }
        }
        // for (let [key, value] of myMap) {
        //     let [month, year] = key.split("-");
        //     let lastDayOfMonth = new Date(year, month, 0).getDate();
        //     let lastDateOfMonth = new Date(`${year}-${month}-${lastDayOfMonth}`);
        //     if (lastDateOfMonth >= prev_data.start_date && lastDateOfMonth <= prev_data.end_date) {
        //         continue;
        //     } else {
        //         sap.m.MessageBox.error("Can't be edited. Already submitted.");
        //         // return;
        //     }
        // }
        let timesheet_TimeBooking = <KloEntitySet<d_o2c_timesheet_time_booking>>await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', { task_id: taskid, loadAll: true });
        var changeCount = 0;

        for (let i = timesheet_TimeBooking.length - 1; i >= 0; i--) {
            if (!myMap.has(this.dateToMonthYearString(timesheet_TimeBooking[i].booking_date))) {
                await timesheet_TimeBooking[i].deleteP();
                changeCount++;
            }
        }
        if (changeCount) {
            await this.transaction.commitP();
            await this.closeDialog("pa_task_edit")
        }

        let sDate = new Date(start_date);
        let eDate = new Date(end_date);
        while (sDate <= eDate) {
            if (!myMap.has(this.dateToMonthYearString(sDate))) {
                await timesheet_TimeBooking.newEntityP(0, { task_id: taskid, booking_date: sDate }, null);
                changeCount++;
            }
            sDate.setDate(sDate.getDate() + 1);
        }
        if (changeCount) {
            await this.tm.commitP("Save successful", "Save Failed", false, false);
            await this.closeDialog("pa_task_edit")
        } else {
            sap.m.MessageBox.error("Can't be edited. Already submitted.");
            return;
        }
    }


    public doCommonDatesExist(timesheet_from_date, timesheet_to_date, start_date, end_date) {
        const fromDate = new Date(timesheet_from_date);
        const toDate = new Date(timesheet_to_date);
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Check if the timesheet range overlaps with the given range
        return (fromDate <= endDate && toDate >= startDate);
    }

    public dateToMonthYearString(date) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return month + "-" + year;
    }
    public getMonthYearArray(startDate, endDate) {
        const result = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const key = month + "-" + year;
            result.push(key);

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return result;
    }
    public async projectidsearch(oEvent) {
        await this.tm.getTN("project_id_list").applyfilterP('project_name', oEvent.mParameters.value);
        await this.tm.getTN("project_id_list").refresh();
    }

}