import { count } from 'console';
import { KloEntitySet } from 'kloBo_7-2-74';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { render } from 'kloExternal/bwip-js-min';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { d_o2c_timesheet_approver } from 'o2c_v2/entity_gen/d_o2c_timesheet_approver';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
// import p_ts_redesign_apprvl from './p_ts_redesign_apprvl.controller';
// import {onAfterRendering} from 'o2c_v2/controller/p_ts_redesign_apprvl.controller'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_ts_apprvl_list")
export default class p_ts_apprvl_list extends KloController {

    public login_user;// stores logged in user id
    public all_emp = [];// Stores all employee data to set the names
    public detail; // Stores the detail of the approval list
    public start_date; // Stores the start date of the selected month
    public end_date; // Stores the end date of the selected month
    public result_list = []; //Stores the current month query result

    public async onPageEnter() {
        this.login_user = (await this.transaction.get$User()).login_id;
        //setting the status vh in search
        let status = [
            { sttus: "Approved" }, { sttus: "Rejected" }, { sttus: "Pending With Me" }, { sttus: "Not Submitted" }, { sttus: "Pending With Others" }, { sttus: "All" }
        ];
        await this.tm.getTN("status_vh").setData(status);

        this.all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'line_manager', 'employee_id'] });
        await this.onSearch();
    }

    public async onStatusChange() {
        const query = await this.tm.getTN("o2c_timesheet_header_search").getData();
        const status = query.over_all_status;
        let filteredData;

        const filterMap: Record<string, () => any[]> = {
            "Pending With Me": () => this.result_list.filter(item => item.pending_with_me === true),
            "Approved": () => this.result_list.filter(item => item.over_all_status === "Approved"),
            "Submitted": () => this.result_list.filter(item => item.over_all_status === "Submitted"),
            "Rejected": () => this.result_list.filter(item => item.over_all_status === "Rejected"),
            "Not Submitted": () => this.result_list.filter(item => item.over_all_status === "Not Submitted"),
            "Partially Approved": () => this.result_list.filter(item => item.over_all_status === "Partially Approved"),
            "Pending With Others": () => this.result_list.filter(item => item.pending_with_others === true)
        };

        if (status === null || status === "" || status === "All") {
            filteredData = this.result_list;
        } else if (filterMap[status]) {
            filteredData = filterMap[status]();
        } else {
            filteredData = [];
        }

        await this.tm.getTN("ts_header_other").setData(filteredData);
    }


    public async onSearch() {
        // let oBusyIndicator = new sap.m.BusyDialog();
        // oBusyIndicator.setText("Loading....");
        // oBusyIndicator.open();

        let busyID = this.showBusy({ blocked: true });

        await this.tm.getTN("o2c_timesheet_header_list").resetP();
        let query = await this.tm.getTN("o2c_timesheet_header_search").getData();
        query.over_all_status = null;
        let month;
        if (query.selected_month) { // User has selected from datePicker
            month = query.selected_month;
            this.setStartAndEndDate(month);
            query.selected_month_end = this.end_date;
        } else { //
            this.setStartAndEndDate(new Date());
            query.selected_month = this.start_date;
            query.selected_month_end = this.end_date.setHours(23, 59, 59, 999);
        }
        // this.setStartAndEndDate(month);
        query.setLoadAll(true);
        await query.executeP();

        let vi = true;
        let tempsize = 0;
        let tempArray = [this.login_user]; // Ensure loginID is defined
        let mp = new Map();
        let mentees_list = [];


        let apprvl_list = await this.tm.getTN("o2c_timesheet_header_list").getData();

        while (vi) {
            // Await the result of the query and store it in managerList
            let managerList = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { line_manager: tempArray, is_active: true, loadAll: true });
            tempArray = [];

            // Iterate through the managerList
            for (let employee of managerList) {
                // Add employee ID to the map
                mp.set(employee.employee_id, employee.employee_id);

                // Check if the map size has increased
                if (mp.size > tempsize) {
                    mentees_list.push(employee);
                    tempArray.push(employee.employee_id);
                }
                // Update the tempsize to the current map size
                tempsize = mp.size;
            }


            // If no more managers are found, exit the loop
            if (managerList.length == 0) {
                vi = false;
            }
        }

        // Get mentees that are NOT in apprvl_list
        let remaining_mentees = mentees_list.filter(
            mentee => !apprvl_list.some(approved => approved.employee_id === mentee.employee_id)
        );

        let remaining_employee_ids = remaining_mentees.map(mentee => mentee.employee_id);

        let ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery(
            "q_o2c_timesheet_list",
            { loadAll: true, employee_id: remaining_employee_ids, date_of_search: this.start_date, date_of_end: this.end_date }
        );

        let non_submitted_list = [];

        for (let emp of remaining_mentees) {
            // Check if the employee ID exists in ts_header
            let matchingRecord = ts_header.find(header => header.employee_id === emp.employee_id);
            let hasSubmitted = !!matchingRecord; // Convert to boolean

            // Create base object
            let employeeObj: any = {
                employee_id: emp.employee_id,
                over_all_status: hasSubmitted ? matchingRecord.over_all_status : "Not Submitted",
                from_date: this.start_date,
                to_date: this.end_date,
            };

            // Add additional fields only if hasSubmitted is true
            if (hasSubmitted) {
                employeeObj.submitted_on = matchingRecord.submitted_on;
                employeeObj.s_modified_on = matchingRecord.s_modified_on;
            }

            non_submitted_list.push(employeeObj);
        }



        // Update apprvl_list with the merged result
        this.result_list = [...apprvl_list, ...non_submitted_list];


        let sbmt_count = 0, apprv_count = 0, rjct_count = 0, pending_with_me = 0, pending_with_other = 0, not_sbmt_cnt = 0;
        let sbmt_count_pm = 0, apprv_count_pm = 0, rjct_count_pm = 0, pending_with_me_pm = 0, pending_with_other_pm = 0, not_sbmt_cnt_pm = 0;
        let submitIdList = this.result_list.map(item => item.submit_id);
        let ts_approval_list = [];
        if (submitIdList.length) {
            ts_approval_list = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("q_o2c_highest_cycle", { loadAll: true, submit_id: submitIdList });
        }

        try {
            for (let approval of this.result_list) {
                approval["pending_with_me"] = false;
                approval["pending_with_others"] = false;
                let ts_approval_obj = [];
                // if (approval.submit_id != null && approval.submit_id != undefined && approval.submit_id != "") {
                //     ts_approval_obj = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: approval.submit_id });
                // }
                ts_approval_obj = ts_approval_list.filter(item => item.submit_id == approval.submit_id);

                // let highestCycle = Math.max(...ts_approval_obj.map(approver => approver.task_version));
                // ts_approval_obj = ts_approval_obj.filter(approve => approve.task_version == highestCycle);

                //current employee line manager from the flow..
                let apprvl_lm = ts_approval_obj.find(item => item.approval_sequence == 1)


                // Storing the names of employee and lIne Manager starts..
                let emp_obj = this.all_emp.find(emp => emp.employee_id == approval.employee_id);
                let lm_name = this.all_emp.find(emp => emp.employee_id == emp_obj.line_manager);
                approval.emp_name = emp_obj.full_name;
                approval.lm_id = emp_obj.line_manager;
                approval.lm_name = lm_name.full_name;
                // ends..


                //Checking if the approval is line manager then storing in the LM Chart
                if (emp_obj.line_manager == this.login_user.toUpperCase()) {

                    if (approval.over_all_status == "Not Submitted") {
                        not_sbmt_cnt += 1;
                    } else {
                        let seq0PendingWithOthers = false;
                        let seq0Approved = false;

                        // **First, process sequence 0**
                        for (let approver of ts_approval_obj) {

                            if (approver.approval_sequence === 0) {
                                let seq0data = ts_approval_obj.filter(item => item.approval_sequence == 0);
                                let seq0AllStatus = new Set(seq0data.map(item => item.approval_status))
                                if (approver.approver.toLowerCase() === this.login_user && approver.approval_status === "Pending") {
                                    approval["pending_with_me"] = true;
                                } else if (approver.approval_status === "Pending" && approval['pending_with_me'] == false) {
                                    seq0PendingWithOthers = true;  // Track if sequence 0 is pending with others
                                    // break;
                                }
                                else if (seq0AllStatus.size === 1 && seq0AllStatus.has("Approved")) {
                                    seq0Approved = true; // Track if sequence 0 is approved
                                }

                                // else if (approver.approval_status === "Approved") {
                                //     seq0Approved = true; // Track if sequence 0 is approved
                                // }
                            }
                        }

                        // **Ensure we store "pending_with_others" for sequence 0**
                        if (seq0PendingWithOthers) {
                            approval["pending_with_others"] = true;
                        }

                        // **Now process sequence 1 (ONLY if sequence 0 is approved)**
                        for (let approver of ts_approval_obj) {
                            if (approver.approval_sequence === 1 && seq0Approved) {
                                if (approver.approver.toLowerCase() === this.login_user && approver.approval_status === "Pending") {
                                    approval["pending_with_me"] = true;
                                    approval["pending_with_others"] = false; // Since seq 0 is already approved, seq 1 shouldn't be pending with others
                                } else if (approver.approval_status === "Pending") {
                                    approval["pending_with_others"] = true;
                                }
                            }
                        }

                        // **If sequence 0 is still pending with others, sequence 1 cannot be "pending with me"**
                        if (seq0PendingWithOthers) {
                            approval["pending_with_me"] = false;
                        }



                        if (approval["pending_with_me"]) {
                            pending_with_me += 1;
                        }
                        if (approval["pending_with_others"]) {
                            pending_with_other += 1;
                        }
                        if (approval.over_all_status == "Submitted") {
                            sbmt_count += 1;
                        } else if (approval.over_all_status == "Approved") {
                            apprv_count += 1;
                        } else if (approval.over_all_status == "Rejected") {
                            rjct_count += 1;
                        }
                    }
                }
                else { //Else storing in the PM Chart

                    if (approval.over_all_status == "Not Submitted") {
                        not_sbmt_cnt_pm += 1;
                    } else {
                        let seq0PendingWithOthers = false;

                        // **First, process sequence 0**
                        for (let approver of ts_approval_obj) {
                            if (approver.approval_sequence === 0) {
                                if (approver.approver.toLowerCase() === this.login_user && approver.approval_status === "Pending") {
                                    approval["pending_with_me"] = true;
                                    pending_with_me_pm += 1;
                                    seq0PendingWithOthers = false;
                                } else if (approver.approval_status === "Pending" && approval['pending_with_me'] == false) {
                                    seq0PendingWithOthers = true;  // Track if sequence 0 is pending with others
                                }
                            }
                        }

                        // **Ensure we store "pending_with_others" for sequence 0**
                        if (seq0PendingWithOthers) {
                            approval["pending_with_others"] = true;
                            pending_with_other_pm += 1;
                        }


                        if (approval.over_all_status == "Submitted") {
                            sbmt_count_pm += 1;
                        } else if (approval.over_all_status == "Approved") {
                            apprv_count_pm += 1;
                        } else if (approval.over_all_status == "Rejected") {
                            rjct_count_pm += 1;
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }

        await this.tm.getTN("ts_header_other").setData(this.result_list);

        await this.tm.getTN("pie_chart").setData([{ status: "Submitted", count: sbmt_count },
        { status: "Not Submitted", count: not_sbmt_cnt },
        { status: "Pending With Me", count: pending_with_me },
        { status: "Pending With Others", count: pending_with_other },
        { status: "Approved", count: apprv_count },
        { status: "Rejected", count: rjct_count }]);

        // let proj_mgr_chart_config = {
        //     "chartType": "PieChart",
        //     "chartSubType": "donut",
        //     "data": [{ "status": "Submitted", "count": sbmt_count_pm },
        //     { "status": "Pending With Me", "count": pending_with_me_pm },
        //     { "status": "Pending With Others", "count": pending_with_other_pm },
        //     { "status": "Approved", "count": apprv_count_pm },
        //     { "status": "Rejected", "count": rjct_count_pm }
        //     ],
        //     "series": [{
        //         "type": "PieSeries",
        //         "dataFields": {
        //             "value": "count",
        //             "category": "status"
        //         },
        //         "ticks":{
        //             "disabled": true
        //         },
        //         "labels":{
        //             disabled
        //         }
        //     }]
        // }
        // let proj_mgr_chart_config = {
        //     "chartType": "PieChart",
        //     "chartSubType": "donut",
        //     "data": [
        //         { "status": "Submitted", "count": sbmt_count_pm },
        //         { "status": "Pending With Me", "count": pending_with_me_pm },
        //         { "status": "Pending With Others", "count": pending_with_other_pm },
        //         { "status": "Approved", "count": apprv_count_pm },
        //         { "status": "Rejected", "count": rjct_count_pm }
        //     ],
        //     "series": [
        //         {
        //             "type": "PieSeries",
        //             "dataFields": {
        //                 "value": "count",
        //                 "category": "status"
        //             }
        //         }
        //     ],
        //     "innerRadius": "40%"
        // }
        // await this.tm.getTN("pie_chart_pm").setData(proj_mgr_chart_config);
        await this.tm.getTN("pie_chart_pm").setData([{ status: "Submitted", count: sbmt_count_pm },
        { status: "Not Submitted", count: not_sbmt_cnt_pm },
        { status: "Pending With Me", count: pending_with_me_pm },
        { status: "Pending With Others", count: pending_with_other_pm },
        { status: "Approved", count: apprv_count_pm },
        { status: "Rejected", count: rjct_count_pm }
        ])

        // let oKloChart = <KloChart>this.getActiveControlById('prj_mgr_chart', 's_pie_chart');
        // await oKloChart.onDataChange();
        query.over_all_status = "Pending With Me"; //Always filtering with the status Pending With Me.
        await this.onStatusChange();

        // oBusyIndicator.close();
        this.hideBusy(busyID);

    }

    public async onApprvlListClick(oEvent) {
        let sPath: string = oEvent.getParameter("rowBindingContext").getPath();
        // let parameters = oEvent.mParameters;
        let index = parseInt(sPath.replace("/ts_header_other/", ''));
        let emp_detail = await this.tm.getTN("ts_header_other").getData()[index];
        this.detail = await this.tm.getTN("ts_header_other").getData();//[index];
        // await this.tm.getTN("ts_header_other").setActive(index);
        // await this.navTo(({ S: "p_ts_apprvl_list", SS: "s_o2c_tim_detail" }));
        await this.tm.getTN("dialog_params_detail").setData(emp_detail);
        await this.tm.getTN("dialog_params").setData(this.detail);
        let lastIndex = true, firstIndex = true;
        if ((index + 1) == await this.tm.getTN("ts_header_other").getData().length) {
            lastIndex = false;
        }
        if (index == 0) {
            firstIndex = false;
        }
        await this.tm.getTN("dialog_params").setProperty("lastIndex", lastIndex);
        await this.tm.getTN("dialog_params").setProperty("firstIndex", firstIndex);
        await this.tm.getTN("dialog_params").setProperty("assigned_by", this.login_user);
        await this.tm.getTN("dialog_params").setProperty("index", index);
        await this.tm.getTN("dialog_params").setProperty("controller", this);
        await this.openDialog("pa_ts_apprvl_dialog");
        // parameters.cellControl.getParent().getAggregation("_settings").setHighlight(sap.ui.core.IndicationColor.Indication04)
    }

    // public async onApprove() {
    //     let ts_approver = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: this.detail.submit_id });
    //     let assigned_task = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: this.detail.from_date, end_mnth: this.detail.to_date, assigned_by: this.login_user, employee_id: this.detail.employee_id });
    //     let task_id_list = [];
    //     for (let task of assigned_task) {
    //         task_id_list.push(task.task_id);
    //     }
    //     let ts_task = [];
    //     if (task_id_list.length) {
    //         ts_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true, submit_id: this.detail.submit_id, task_id: task_id_list });
    //     }
    //     for (let approver of ts_approver) {
    //         if (approver.approval_sequence == 0 && approver.approval_status == "Pending" && approver.approver.toLowerCase() == this.login_user) {
    //             approver.approval_status = "Approved";
    //             this.detail.over_all_status = "Partially Approved";
    //         } else if (approver.approval_sequence == 1 && approver.approval_status == "Pending" && approver.approver.toLowerCase() == this.login_user) {
    //             approver.approval_status = "Approved";
    //             this.detail.over_all_status = "Approved";
    //         }
    //     }
    //     if (ts_task.length) {
    //         for (let task of ts_task) {
    //             task.status = "Approved";
    //         }
    //     }
    //     await this.tm.commitP("Approved Successfully", "Approve Failed", true, true);

    //     if (await this.tm.getTN("o2c_timesheet_header_list").getActiveIndex() == await this.tm.getTN("o2c_timesheet_header_list").getData().length - 1) {
    //         await this.closeDialog("pa_ts_apprvl_dialog");
    //     } else {
    //         await this.onRightArrowClick();
    //     }
    // }

    // public async onReject() {
    //     let ts_approver = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: this.detail.submit_id });
    //     let assigned_task = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: this.detail.from_date, end_mnth: this.detail.to_date, assigned_by: this.login_user, employee_id: this.detail.employee_id });
    //     let task_id_list = [];
    //     for (let task of assigned_task) {
    //         task_id_list.push(task.task_id);
    //     }
    //     let ts_task = [];
    //     if (task_id_list.length) {
    //         ts_task = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery("d_o2c_timesheet_task", { loadAll: true, submit_id: this.detail.submit_id, task_id: task_id_list });
    //     }
    //     for (let approver of ts_approver) {
    //         if (approver.approver.toLowerCase() == this.login_user && approver.approval_status == "Pending") {
    //             approver.approval_status = "Rejected";
    //             this.detail.over_all_status = "Rejected";
    //         } else if (approver.approval_status == "Pending") {
    //             approver.approval_status = `Rejected by PM`;
    //         }
    //     }
    //     if (ts_task.length) {
    //         for (let task of ts_task) {
    //             task.status = "Rejected";
    //         }
    //     }
    //     await this.tm.commitP("Rejected Successfully", "Rejection Failed", true, true);

    //     if (await this.tm.getTN("o2c_timesheet_header_list").getActiveIndex() == await this.tm.getTN("o2c_timesheet_header_list").getData().length - 1) {
    //         await this.closeDialog("pa_ts_apprvl_dialog");
    //     } else {
    //         await this.onRightArrowClick();
    //     }
    // }

    // public async onRightArrowClick() {
    //     let oBusyIndicator = new sap.m.BusyDialog();
    //     oBusyIndicator.setText("Loading....");
    //     oBusyIndicator.open();
    //     let lastIndex = true;
    //     let index = await this.tm.getTN("o2c_timesheet_header_list").getActiveIndex();
    //     this.detail = await this.tm.getTN("o2c_timesheet_header_list").getData()[index + 1];
    //     await this.tm.getTN("o2c_timesheet_header_list").setActive(index + 1);
    //     // await this.navTo(({ S: "p_ts_apprvl_list", SS: "s_o2c_tim_detail" }));
    //     await this.tm.getTN("dialog_params").setData(this.detail);
    //     if ((index + 2) == await this.tm.getTN("o2c_timesheet_header_list").getData().length) {
    //         lastIndex = false;
    //     }
    //     await this.tm.getTN("dialog_params").setProperty("lastIndex", lastIndex);
    //     await this.closeDialog("pa_ts_apprvl_dialog");
    //     await this.openDialog("pa_ts_apprvl_dialog");
    //     oBusyIndicator.close();
    //     // await onAfterRendering();
    // }

    // public async onLeftArrowClick() {
    //     let oBusyIndicator = new sap.m.BusyDialog();
    //     oBusyIndicator.setText("Loading....");
    //     oBusyIndicator.open();
    //     let firstIndex = true;
    //     let index = await this.tm.getTN("o2c_timesheet_header_list").getActiveIndex();
    //     if (index == 1) {
    //         firstIndex = false;
    //     }
    //     this.detail = await this.tm.getTN("o2c_timesheet_header_list").getData()[index - 1];
    //     await this.tm.getTN("o2c_timesheet_header_list").setActive(index - 1);
    //     // await this.navTo(({ S: "p_ts_apprvl_list", SS: "s_o2c_tim_detail" }));
    //     await this.tm.getTN("dialog_params").setData(this.detail);
    //     await this.tm.getTN("dialog_params").setProperty("firstIndex", firstIndex);
    //     await this.closeDialog("pa_ts_apprvl_dialog");
    //     await this.openDialog("pa_ts_apprvl_dialog");
    //     oBusyIndicator.close();
    // }

    /* To set the start and end date of the month */
    private setStartAndEndDate(date: Date) {
        this.start_date = new Date(date.getFullYear(), date.getMonth(), 1);
        this.end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    public async sortByEmpId(oEvent) {
        const { sortOrder, column } = oEvent.mParameters;
        const sortProperty = column.mProperties.sortProperty;
        let apprvl_list = await this.tm.getTN("ts_header_other").getData();
    
        // Validate sortProperty
        const validProperties = [
            "employee_id",
            "over_all_status",
            "emp_name",
            "lm_id",
            "lm_name"
        ];
    
        if (!validProperties.includes(sortProperty)) {
            return; // Ignore unknown properties
        }
    
        // Generic compare function
        const compareValues = (a, b) =>
            a[sortProperty].localeCompare(b[sortProperty], undefined, {
                numeric: true,
                sensitivity: "base"
            });
    
        const sortedList =
            sortOrder === "Ascending"
                ? apprvl_list.sort(compareValues)
                : apprvl_list.sort((a, b) => compareValues(b, a));
    
        await this.tm.getTN("ts_header_other").setData(sortedList);
    }
    
    public async filterByName(oEvent) {
        const { value, column } = oEvent.mParameters;
        const filterProperty = column.mProperties.filterProperty; // e.g., "emp_name"
        const apprvl_list = this.result_list;
        const enteredValue = value.toLowerCase();
    
        const validProperties = [
            "emp_name",
            "employee_id",
            "lm_id",
            "lm_name",
            "over_all_status"
        ];
    
        if (validProperties.includes(filterProperty)) {
            const filteredList = apprvl_list.filter(entry =>
                entry[filterProperty]?.toLowerCase().includes(enteredValue)
            );
            await this.tm.getTN("ts_header_other").setData(filteredList);
        }
    }
    
}