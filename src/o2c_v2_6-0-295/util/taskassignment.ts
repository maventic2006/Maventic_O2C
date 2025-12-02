import { KloTransaction } from "kloBo_6-0-26/KloTransaction";
export class taskassignment {

    public static async createUpdateTask(txn, userLoginID, projectID, soId, projectName, approvedResource, page, t) {
        let employeeData = await txn.getExecutedQuery('d_o2c_employee', { loadAll: true, partialSelected: ['employee_id', 'first_name', 'last_name', 'full_name'] });
        const pageMapping = {
            'Project': {
                employeeId: 'mmid',
                taskId: 'taskID',
                sDate: 'startDate',
                eDate: 'endDate'
            },
            'Resource': {
                employeeId: 'employee_id',
                taskId: 'task_id',
                sDate: 'start_date',
                eDate: 'end_date'
            }
        }
        // Get the property mappings for the current page
        const pageProps = pageMapping[page];
        for (let i = 0; i < approvedResource.length; i++) {
            let name = employeeData.filter((item) => item.employee_id.toLocaleLowerCase() == approvedResource[i][pageProps.employeeId].toLocaleLowerCase());
            if (approvedResource[i][pageProps.taskId] == null || approvedResource[i][pageProps.taskId] == undefined || approvedResource[i][pageProps.taskId] == "") {
                //Create the task
                let task = await txn.createEntityP('d_o2c_task_assignment', {
                    "actual_project_id": projectID, "assigned_by": userLoginID, "assigned_on": new Date(), "employee_id": approvedResource[i][pageProps.employeeId], "employee_name": name[0].full_name, "project_id": soId, "project_name": projectName, "task_start_date": new Date(approvedResource[i][pageProps.sDate]), "task_end_date": new Date(approvedResource[i][pageProps.eDate]), "task_name": projectName
                });
                approvedResource[i][pageProps.taskId] = task.task_id;

                let sDate = new Date(approvedResource[i][pageProps.sDate]);
                let eDate = new Date(approvedResource[i][pageProps.eDate]);
                while (sDate <= eDate) {
                    await txn.createEntityP('d_o2c_timesheet_time_booking', {
                        "task_id": approvedResource[i][pageProps.taskId],
                        "booking_date": sDate
                    });
                    sDate.setDate(sDate.getDate() + 1);
                }
            }

            //New code for update without deleteP()
            else {
                let taskid = (approvedResource[i][pageProps.taskId].split(','));
                //ascending order arrange the task ID
                taskid.sort(function (a, b) {
                    // Extract numeric part of the string using a regular expression
                    const numA = parseInt(a.replace(/\D/g, ''));  // Remove non-digit characters
                    const numB = parseInt(b.replace(/\D/g, ''));  // Remove non-digit characters

                    return numA - numB;  // Sort numerically
                });
                //End ascending order arrange the task ID
                //Passing the Task ID and find the data for the multiple task
                let alreadyCreatedTask = await txn.getExecutedQuery('d_o2c_task_assignment', { loadAll: true, 'task_id': taskid });
                //alreadyCreatedTask[0].task_end_date = new Date(approvedResource[i][pageProps.eDate]);

                //Start date and end Date which is going to be update(showing in the screen)
                let start_date = new Date(approvedResource[i][pageProps.sDate]);
                let end_date = new Date(approvedResource[i][pageProps.eDate]);
                //End

                //Check for the task id is submitted or not(Particular task is submitted or not)
                let timesheet_task_data = await txn.getExecutedQuery("d_o2c_timesheet_task", { task_id: taskid, loadAll: true });
                //new code of remove rejected
                let timesheet_task = timesheet_task_data.filter((item) => item.status != "Rejected")
                let submitArray = [];
                for (let i = 0; i < timesheet_task.length; i++) {
                    submitArray.push(timesheet_task[i].submit_id);
                }
                //submit id for task ID 
                //Overall submit START
                let timesheet_header = [];
                if (submitArray.length > 0) {
                    timesheet_header = await txn.getExecutedQuery("d_o2c_timesheet_header", { submit_id: submitArray, loadAll: true });
                }
                //END

                //timesheet booking data for task ID---START
                let temp = false;
                let myMap = new Map();
                let allprev_data = await txn.getExecutedQuery("d_o2c_timesheet_time_booking", { 'task_id': taskid, loadAll: true });
                let prev_data = allprev_data.filter((e) => e.s_status != "Archived");

                prev_data.sort((a, b) => {
                    const dateA = new Date(a.booking_date).getTime(); // Get the timestamp
                    const dateB = new Date(b.booking_date).getTime();

                    if (isNaN(dateA) && isNaN(dateB)) return 0; // Both invalid
                    if (isNaN(dateA)) return 1; // Invalid dates should go last
                    if (isNaN(dateB)) return -1; // Invalid dates should go last

                    return dateA - dateB; // Compare valid dates
                });
                //timesheet booking data for task ID---END

                //Make the Map for submitted task (Map for month-year by doCommonDatesExist)
                for (let i = 0; i < timesheet_header.length; i++) {
                    if (await this.doCommonDatesExist(timesheet_header[i].from_date, timesheet_header[i].to_date, start_date, end_date)) {
                        const key = await this.dateToMonthYearString(timesheet_header[i].from_date);
                        myMap.set(key, true);
                        temp = true;
                        // check 
                    }
                }
                //END

                //condition 1 for cant be edit---If any already task is submitted and then we will not change the start date of the task(For that we are checking the screen start date and time sheet time booking start date)
                if (myMap.size && !(start_date.toString() === prev_data[0].booking_date.toString())) {

                    //If the user is changing the start date from resource then he or she will unable to do that if previous start date which was earlier in the screen is already submitted
                    sap.m.MessageBox.error("Can't be edited. Already submitted line number: " +taskid[taskid.length - 1] , {
                        title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
                        // onClose: async (oAction) => {
                        //     if (oAction == "CANCEL") {
                        //         // Code to execute after the MessageBox is closed
                        //         await t.navTo({ S: "p_project_list" });
                        //     }
                        // }
                    });

                    return true;
                }
                //condition 1 end 

                 //Submitted month's end date Find----START
                 
                 let mapEntries = Array.from(myMap.entries());
                 for (let index = 0; index < myMap.size; index++) {
                     let data = mapEntries[index][0].split("-");
                     let lastDayOfMonth = new Date(data[1], data[0], 0).getDate();
                     let lastDateOfMonth = new Date(`${data[1]}-${data[0]}-${lastDayOfMonth}`);
                     //new code 
                     let startDateOfMonth = new Date(`${data[1]}-${data[0]}-1`);
                     startDateOfMonth.setHours(0, 0, 0, 0);  // Set time to midnight to exclude it
                     //new code
                     lastDateOfMonth.setHours(0, 0, 0, 0);  // Set time to midnight to exclude it
                     //if ((lastDateOfMonth >= start_date) && ((parseInt(data[0])!=parseInt(end_date.getMonth() + 1))&&(lastDateOfMonth <= end_date))||((parseInt(data[0])==parseInt(end_date.getMonth() + 1))&&(alreadyCreatedTask[0].task_end_date <= end_date))) {
                        if ((lastDateOfMonth >= start_date) && (lastDateOfMonth <= end_date)) {
                         continue;
                     } else {
                         sap.m.MessageBox.error("Can't be edited. Already submitted line number: " + taskid[taskid.length - 1], {
                             title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
                            //  onClose: async (oAction) => {
                            //      if (oAction == "CANCEL") {
                            //          // Code to execute after the MessageBox is closed
                            //          await t.navTo({ S: "p_project_list" });
                            //      }
                            //  }
                         });
                         return true;
                     }
                 }
                 //Submitted month's end date Find----END
 

                let changeCount = 0;

                let sDate = new Date(start_date);
                let eDate = new Date(end_date);
                for (let booking = prev_data.length - 1; booking >= 0; booking--) {
                    if (prev_data[booking].booking_date > eDate || prev_data[booking].booking_date < sDate) {
                        prev_data[booking].s_status = "Archived";
                        //task assignment end date change
                        if (taskid.length == 1) {
                            alreadyCreatedTask[0].task_start_date = new Date(approvedResource[i][pageProps.sDate]);
                            alreadyCreatedTask[0].task_end_date = new Date(approvedResource[i][pageProps.eDate]);
                        }
                        else if (taskid.length > 1) {
                            alreadyCreatedTask[alreadyCreatedTask.length - 1].task_start_date = new Date(approvedResource[i][pageProps.sDate]);
                            alreadyCreatedTask[alreadyCreatedTask.length - 1].task_end_date = new Date(approvedResource[i][pageProps.eDate]);
                        }
                    }
                }

                let timesheetStatusBased = allprev_data.filter((e) => e.s_status != "Archived");
                let createDate = new Date(timesheetStatusBased[timesheetStatusBased.length - 1].booking_date);
                createDate.setDate(createDate.getDate() + 1);
                while (createDate <= eDate && createDate >= sDate) {
                    await allprev_data.newEntityP(0, { task_id: taskid[taskid.length - 1], booking_date: createDate }, null);
                    changeCount++;
                    createDate.setDate(createDate.getDate() + 1);
                    //task assignment end date change
                    if (taskid.length == 1) {
                        alreadyCreatedTask[0].task_start_date = new Date(approvedResource[i][pageProps.sDate]);
                        alreadyCreatedTask[0].task_end_date = new Date(approvedResource[i][pageProps.eDate]);
                    }
                    else if (taskid.length > 1) {
                        alreadyCreatedTask[alreadyCreatedTask.length - 1].task_start_date = new Date(approvedResource[i][pageProps.sDate]);
                        alreadyCreatedTask[alreadyCreatedTask.length - 1].task_end_date = new Date(approvedResource[i][pageProps.eDate]);
                    }
                }

            }

        }
    }
    public static async doCommonDatesExist(timesheet_from_date, timesheet_to_date, start_date, end_date) {
        const fromDate = new Date(timesheet_from_date);
        const toDate = new Date(timesheet_to_date);
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Check if the timesheet range overlaps with the given range
        return (fromDate <= endDate && toDate >= startDate);
    }
    public static async dateToMonthYearString(date) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return month + "-" + year;
    }
}
//8-1-25 AF 1PM