import { KloEntitySet } from 'kloBo_7-2-32/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_project_header } from 'o2c_v2/entity/d_o2c_project_header';
import { d_o2c_so_hdr } from 'o2c_v2/entity/d_o2c_so_hdr';
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { calendarworkingdays } from 'o2c_v2/util/calendarworkingdays';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_auto_project")
export default class p_auto_project extends KloController {
    public txn;
    public sData = 0;
    public async onPageEnter() {
        this.tm.getTN('so').setData({});
    }
    public async onProjectCreation() {
        let soData;
        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Creating....");
        oBusyIndicator.open();
        this.txn = await this.transaction.createTransaction();
        let employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, partialSelected: ['employee_id', 'first_name', 'last_name', 'full_name', 'line_manager'] });
        let taskAssignment = await this.transaction.getExecutedQuery('d_o2c_task_assignment', { loadAll: true, partialSelected: ['project_id', 'employee_id'] });
        let migratedProject = await this.transaction.getExecutedQuery('d_o2c_migrated_project', { loadAll: true, partialSelected: 'so_no' });
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id', 'profit_center'], expandAll: 'r_project_so' });
        //let createdProjectArray = projectData.map(project => project.so_id);

        let soNo = await this.tm.getTN("so").getData().no;
        if (soNo == "") {
            soData = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, s_status: "Approved", expandAll: 'r_profit_center,r_so_attachment' });
        }
        else {
            soData = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, so: soNo, s_status: "Approved", expandAll: 'r_profit_center,r_so_attachment' });
        }
        for (let data = this.sData; data < soData.length; data++, this.sData++) {
            //SO Profit Center
            const soProfitCenterSet = Array.from(new Set(
                soData[data].r_profit_center.map(pc => pc.profit_center)
            ));
            const soPCPdsSet = soData[data].r_profit_center.map(pd => pd.pds);

            //Project Detail based on SO ID
            //Checking data is present of that SO Id and Profit center in the project Table or not?
            for (let pcData = 0; pcData < soProfitCenterSet.length; pcData++) {
                let projectDetail = projectData.filter(item => (item.so_id == soData[data].so) && (item.profit_center == soProfitCenterSet[pcData]));

                //Checking data is present in the migration Table or not?
                let migrationDetail = migratedProject.filter(item => (item.so_no == soData[data].so) && (item.profit_center == soProfitCenterSet[pcData]));

                //If the data is present in the project screen and migration screen data is not present of that SO NO
                if (projectDetail.length != 0) {
                    if (migrationDetail.length == 0) {
                        //Create data for that Project in migrated Project table "d_o2c_migrated_project" with action as "Already created from SO Screen"
                        await this.txn.createEntityP('d_o2c_migrated_project', {
                            s_object_type: -1,
                            so_no: soData[data].so,
                            project_id: projectDetail[0].project_id,
                            profit_center: projectDetail[0].profit_center,
                            project_status: projectDetail[0].trans_status,
                            project_action: "Already created from SO Screen",
                        });
                        await this.txn.commitP("Migration Data Saved Successfully", "Migration Data Saved Failed", true, true);
                    }
                    else {
                        if (migrationDetail[0].project_action == "Not Created") {
                            migrationDetail[0].project_action = "Created from Report";
                            await this.txn.commitP("Migration Data Saved Successfully", "Migration Data Saved Failed", true, true);

                        }
                    }
                }
                if ((projectDetail.length == 0) && ((migrationDetail.length == 0) || (migrationDetail[0].project_action == "Not Created"))) {
                    //Project Creation for that SO in Project Table
                    //PROJECT MANAGEMENT CREATION

                    let milestoneArray = [], resourceArray = [], monthlyPlanningArray = [];
                    let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
                        loadAll: true, 'profit_center': soProfitCenterSet[pcData], 'profit_center_pds': soPCPdsSet[pcData]
                    });
                    let managementReservePerc = 0, contigencyReservePerc = 0;
                    if (rsrvMatrixData.length) {
                        managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(soPCPdsSet[pcData])) / 100));
                        contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(soPCPdsSet[pcData])) / 100));
                    }
                    if (soPCPdsSet[pcData] != null) {
                        let projectHeaderData = await this.transaction.createEntityP('d_o2c_project_header', {
                            s_object_type: -1,
                            so_id: soData[data].so,
                            total_project_pds: soPCPdsSet[pcData],
                            mreserve_new: managementReservePerc.toFixed(2),
                            mcontig_new: contigencyReservePerc.toFixed(2),
                            available_pds_new: parseFloat((parseFloat(soPCPdsSet[pcData]) - managementReservePerc - contigencyReservePerc).toFixed(2)),
                            booked_pds_new: 0,
                            profit_center: soProfitCenterSet[pcData],
                            s_status: "Created"
                        });

                        //Project Milestone Creation
                        // Po Line Item - 1
                        // let attachData = await soData[data].r_so_attachment;
                        // for (let attachmentData = 0; attachmentData < attachData.length; attachmentData++) {
                        //     // Po Line Item - 2
                        //     let itemData = await attachData[attachmentData].r_attachmnt_itm.fetch();
                        //     for (let itemTableData = 0; itemTableData < itemData.length; itemTableData++) {
                        //         // Po Line Item - 3(Milestone Table Data)
                        //         const milestoneData = await itemData[itemTableData].r_billing_new.fetch();
                        //         milestoneData.forEach(({ billing_milestone_name, actual_date }) => {
                        //             milestoneArray.push({
                        //                 poNumber: attachData[attachmentData].po_no,
                        //                 poDate: new Date(attachData[attachmentData].po_date),
                        //                 milestoneName: billing_milestone_name,
                        //                 startDate: '',
                        //                 endDate: '',
                        //                 actualEndDate: new Date(actual_date),
                        //             })
                        //         });
                        //         // Po Line Item - 3(Schedule Table Data)
                        //         const scheduleData = await itemData[itemTableData].r_schedule_new.fetch();
                        //         scheduleData.forEach(({ description, start__date, end_date, actual_date }) => {
                        //             milestoneArray.push({
                        //                 poNumber: attachData[attachmentData].po_no,
                        //                 poDate: new Date(attachData[attachmentData].po_date),
                        //                 milestoneName: description,
                        //                 startDate: new Date(start__date),
                        //                 endDate: new Date(end_date),
                        //                 actualEndDate: new Date(actual_date),

                        //             })
                        //         });
                        //         // Po Line Item - 3(Volume Table Data)
                        //         const volumeData = await itemData[itemTableData].r_vol_based_new.fetch();
                        //         volumeData.forEach(({ milestone_description, milestone_date }) => {
                        //             milestoneArray.push({
                        //                 poNumber: attachData[attachmentData].po_no,
                        //                 poDate: new Date(attachData[attachmentData].po_date),
                        //                 milestoneName: milestone_description,
                        //                 startDate: '',
                        //                 endDate: '',
                        //                 actualEndDate: new Date(milestone_date),

                        //             })
                        //         });
                        //     }
                        // }
                        // for (let projectMilestoneData = 0; projectMilestoneData < milestoneArray.length; projectMilestoneData++) {
                        //     await this.transaction.createEntityP('d_o2c_project_milestone', {
                        //         s_object_type: -1,
                        //         project_id: projectHeaderData.project_id,
                        //         project_guid: projectHeaderData.project_guid,
                        //         po_no: milestoneArray[projectMilestoneData].poNumber,
                        //         po_date: milestoneArray[projectMilestoneData].poDate,
                        //         milestone_name: milestoneArray[projectMilestoneData].milestoneName,
                        //         start_date: milestoneArray[projectMilestoneData].startDate,
                        //         end_date: milestoneArray[projectMilestoneData].endDate,
                        //         actual_date: milestoneArray[projectMilestoneData].actualEndDate,
                        //         s_status: "Closed"

                        //     });
                        // }
                        // if (milestoneArray.length > 0) {
                        //     projectHeaderData.s_status = "Delivery Closed";
                        // }
                        //Task Data for particular SO
                        // let taskData = taskAssignment.filter(item => (item.project_id == soData[data].so));
                        // //Find the current PC of the Task assigned Employee one by one
                        // for (let task = 0; task < taskData.length; task++) {
                        //     let loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
                        //         loadAll: true, 'employee_id': taskData[task].employee_id, 'active_till': new Date()
                        //     });
                        //     let taskEmployeeData = employeeData.filter(item => (item.employee_id == taskData[task].employee_id));
                        //     let taskEmployeeLmiData = employeeData.filter(item => (item.employee_id == taskEmployeeData[0].line_manager));
                        //     //Employee's Profit Center 
                        //     const loginPCList = loginOrg.map(org => org.profit_centre);
                        //     //Resource Array 
                        //     if ((loginPCList.includes(soProfitCenterSet[pcData])) || (!(loginPCList.includes(soProfitCenterSet)) && (pcData == 0))) {
                        //         let resourceData = resourceArray?.filter(item => (item.MMID == taskData[task].employee_id));
                        //         //If Resource Array don't have the Task assigned Employee,then create the resource in Resource Array
                        //         if (resourceData.length == 0) {
                        //             resourceArray.push({
                        //                 MMID: taskData[task].employee_id,
                        //                 role: '',
                        //                 lmi: taskEmployeeData[0].line_manager,
                        //                 lmiName: taskEmployeeLmiData[0].full_name,
                        //                 startDate: taskData[task].task_start_date,
                        //                 endDate: taskData[task].task_end_date,
                        //                 percentage: 100,
                        //                 status: "Approved",
                        //                 isOnsite: false,
                        //             })
                        //         }
                        //         //If Resource Array  have the Task assigned Employee,then update the resource end date to task end date in Resource Array
                        //         else {
                        //             resourceData[0].endDate = taskData[task].task_end_date;
                        //         }
                        //     }
                        // }
                        // //After creating the Resource Array for all resource for particular SO...Then create the Project Resource Planning Data
                        // let calculatePlannedPDs = 0;
                        // for (let resourceData = 0; resourceData < resourceArray.length; resourceData++) {
                        //     let workingDays = await calendarworkingdays.fnGetWorkingDayByRange(this, soData[data].business_area, new Date(resourceArray[resourceData].startDate), new Date(resourceArray[resourceData].endDate));
                        //     const noOfWorkingDays = workingDays.length;
                        //     const noOfWorkingHours = noOfWorkingDays * 8;
                        //     const noOfWorkingBasedPercentage = (parseFloat(resourceArray[resourceData].percentage * noOfWorkingHours) / 100);
                        //     await this.transaction.createEntityP('d_o2c_project_resource', {
                        //         s_object_type: -1,
                        //         project_id: projectHeaderData.project_id,
                        //         project_guid: projectHeaderData.project_guid,
                        //         employee_id: resourceArray[resourceData].MMID,
                        //         line_manager_id: resourceArray[resourceData].lmi,
                        //         line_manager_name: resourceArray[resourceData].lmiName,
                        //         start_date: new Date(resourceArray[resourceData].startDate),
                        //         end_date: new Date(resourceArray[resourceData].endDate),
                        //         percentage: resourceArray[resourceData].percentage,
                        //         plannedpds: noOfWorkingBasedPercentage,
                        //         s_status: resourceArray[resourceData].status,
                        //         onsite: resourceArray[resourceData].isOnsite
                        //     });
                        //     calculatePlannedPDs += noOfWorkingBasedPercentage;
                        // }
                        // //Project planned pds, sum of all resource plannedPds
                        // projectHeaderData.planned_pds = calculatePlannedPDs;

                        //Monthly Planning Array
                        //TO DO
                        let start = new Date(soData[data].project_start_date);
                        while (new Date(start) <= new Date(soData[data].project_end_date)) {
                            monthlyPlanningArray.push({
                                startDate: start,
                                endDate: new Date(start.getFullYear(), start.getMonth() + 1, 0),
                            });
                            start = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                        }
                        //Create the date in the Monthly Table
                        for (let monthlyData = 0; monthlyData < monthlyPlanningArray.length; monthlyData++) {
                            await this.transaction.createEntityP('d_o2c_project_month_plan', {
                                s_object_type: -1,
                                project_id: projectHeaderData.project_id,
                                project_guid: projectHeaderData.project_guid,
                                start_date: monthlyPlanningArray[monthlyData].startDate,
                                end_date: monthlyPlanningArray[monthlyData].endDate,
                                planned_hours: (parseFloat(projectHeaderData.total_project_pds) / monthlyPlanningArray.length).toFixed(2),
                            });
                        }

                        //Also Create data for that Project in migrated Project table with action as "Created from Report"
                        let migrated = await this.txn.createEntityP('d_o2c_migrated_project', {
                            s_object_type: -1,
                            so_no: soData[data].so,
                            project_id: projectHeaderData.project_id,
                            profit_center: projectHeaderData.profit_center,
                            project_status: projectHeaderData.s_status,
                        });
                        await this.txn.commitP("Migration Data Saved Successfully", "Migration Data Saved Failed", true, true);
                        //Saved Each Project of individual SO and each Profit Center
                        migrated.project_action = "Created from Report";
                    }
                    else {
                        await this.txn.createEntityP('d_o2c_migrated_project', {
                            s_object_type: -1,
                            so_no: soData[data].so,
                            profit_center: soData[data].profit_center,
                            project_action: "Unable to Created",
                        });
                        await this.txn.commitP("Migration Data Saved Successfully", "Migration Data Saved Failed", true, true);
                        //Saved Each Project of individual SO and each Profit Center

                    }
                    await this.tm.commitP("Project Saved Successfully", "Project Saved Failed", true, true);
                    await this.txn.commitP();
                    sap.m.MessageToast.show("Project Created for SO Number: " + soData[data].so + " and Profit Center: " + soProfitCenterSet[pcData], { duration: 2000 });


                }
            }
        }
        oBusyIndicator.close();
        //Complete Project creation
        sap.m.MessageToast.show("Project Creation completed for all SO", { duration: 2000 });
    }
    public async tryAgain() {
        this.sData++;
    }
    public async onProjectUpdate() {
        let oBusyIndicator = new sap.m.BusyDialog();
        oBusyIndicator.setText("Updating....");
        oBusyIndicator.open();
        let projectTable = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id', 'profit_center'], expandAll: 'r_project_so' });
        let migratedTable = await this.transaction.getExecutedQuery('d_o2c_migrated_project', { loadAll: true, partialSelected: 'so_no' });
        for (let i = 0; i < projectTable.length; i++) {
            let billingArray = [];
            let billingMilestoneStatus
            let attachData = await projectTable[i].r_project_so[0].r_so_attachment.fetch();
            for (let attachmentData = 0; attachmentData < attachData.length; attachmentData++) {
                // Po Line Item - 2
                let itemData = await attachData[attachmentData].r_attachmnt_itm.fetch();
                for (let itemTableData = 0; itemTableData < itemData.length; itemTableData++) {
                    // Po Line Item - 3(Milestone Table Data)
                    const milestoneData = await itemData[itemTableData].r_billing_new.fetch();
                    milestoneData.forEach(({ status }) => {
                        billingArray.push({
                            invoiceStatus: status,
                        })
                    });
                    // Po Line Item - 3(Schedule Table Data)
                    const scheduleData = await itemData[itemTableData].r_schedule_new.fetch();
                    scheduleData.forEach(({ status }) => {
                        billingArray.push({
                            invoiceStatus: status,
                        })
                    });
                    // Po Line Item - 3(Volume Table Data)
                    const volumeData = await itemData[itemTableData].r_vol_based_new.fetch();
                    volumeData.forEach(({ invoice_status }) => {
                        billingArray.push({
                            invoiceStatus: invoice_status,

                        })
                    });
                    billingMilestoneStatus = Array.from(new Set(billingArray.map(item => item.invoiceStatus)));

                }
            }
            if (((attachData.length > 0) && (billingMilestoneStatus.length == 1) && billingMilestoneStatus[0] == "Invoiced") || (((projectTable[i].r_project_so[0].type == "ISP") || (projectTable[i].r_project_so[0].type == "NBS")) && (new Date(projectTable[i].r_project_so[0].project_end_date) <= new Date()))) {
                let migData = migratedTable.filter(item => (item.project_id == projectTable[i].project_id));
                //projectTable[i].trans_status = "Completed";
                projectTable[i].s_status = "Completed";
                migData[0].project_status = "Completed";
                projectTable[i].r_project_so[0].s_status = "Closed";
                migData[0].so_closed = true;
                await this.tm.commitP("Project Updated Successfully", "Project Updated Failed", true, true);
                sap.m.MessageToast.show("Project Created for SO Number: " + projectTable[i].so_id + " and Profit Id: " + projectTable[i].project_id, { duration: 2000 });


            }
        }
        oBusyIndicator.close();
        //Complete Project update
        sap.m.MessageToast.show("Project Update completed for all SO", { duration: 2000 });
    }

    //Update Project ID in Task Table
    public async projectIDUpdateinTask() {

        let soNo = await this.tm.getTN("so").getData().so_no;

        // Fetch task and project lists
        let taskList = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("d_o2c_task_assignment", {
            loadAll: true,
            partialSelected: ["actual_project_id", "project_id", "employee_id"]
        });

        let projectList = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", {
            loadAll: true,
            so_id: soNo,
            partialSelected: ["project_id", "profit_center", "so_id", "project_guid"],
            expandAll: 'r_project_so,r_resource_planning'
        });

        // let employeeData = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', {
        //     loadAll: true, partialSelected: ['employee_id', 'first_name', 'last_name', 'full_name', 'line_manager']
        // });



        // Iterate through taskList
        for (let task of taskList) {
            let filtered_projects = projectList.filter((project) => project.so_id === task.project_id);

            if (filtered_projects.length > 1) {
                // Fetch the employee's active profit centers
                let empPC = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery("q_current_profit_center", {
                    employee_id: task.employee_id,
                    active_till: new Date()
                });

                if (empPC.length) {
                    // Find the first matching project by profit center
                    let matchedProject = filtered_projects.find((project) =>
                        empPC.some((pc) => project.profit_center === pc.profit_centre)
                    );

                    if (matchedProject) {
                        task.actual_project_id = matchedProject.project_id;
                    } else {
                        let so_obj = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: task.project_id, loadAll: true, expandAll: 'r_profit_center' });
                        let primary_so = so_obj[0].r_profit_center.filter((so) => so.primary_profit_center == true);
                        let matchedProject = filtered_projects.find((project) => project.profit_center == primary_so[0].profit_center);
                        task.actual_project_id = matchedProject.project_id;
                    }
                }
            } else if (filtered_projects.length === 1) {
                // Assign the project if only one match is found
                task.actual_project_id = filtered_projects[0].project_id;
            }
        }

        await this.transaction.commitP();

        // let oBusyIndicator = new sap.m.BusyDialog();
        // oBusyIndicator.open();
        // //Iterate through SO List
        // for (let i = 0; i < projectList.length; i++) {
        //     let planned_pd = 0;

        //     for (let j = 0; j < projectList[i].r_resource_planning.length; j++) {
        //         let index = 0;
        //         let resourceArray;
        //         // Filter tasks based on the project ID and employee ID
        //         let filter_basedon_project = taskList.filter((item) =>
        //             item.actual_project_id === projectList[i].project_id &&
        //             item.employee_id === projectList[i].r_resource_planning[j].employee_id
        //         );

        //         // Sort the filtered tasks by task_start_date
        // filter_basedon_project.sort((a, b) => new Date(a.task_start_date) - new Date(b.task_start_date));

        //         // Check for continuity
        //         // let isContinuous = true; // Assume continuity initially

        //         for (let k = 0; k < filter_basedon_project.length - 1; k++) {

        //             let taskEmployeeData = employeeData.find(item => (item.employee_id == filter_basedon_project[k].employee_id));
        //             let taskEmployeeLmiData = employeeData.find(item => (item.employee_id == taskEmployeeData.line_manager));
        //             let currentTaskEndDate = filter_basedon_project[k].task_end_date;
        //             const ginhake_code = new Date(filter_basedon_project[k + 1].task_start_date);
        //             let nextTaskStartDate = new Date(ginhake_code);

        //             let workingDays = await calendarworkingdays.fnGetWorkingDayByRange(this, projectList[i].r_project_so[0].business_area, nextTaskStartDate, new Date(filter_basedon_project[k + 1].task_end_date));
        //             const noOfWorkingDays = workingDays.length;
        //             const noOfWorkingHours = noOfWorkingDays * 8;
        //             const noOfWorkingBasedPercentage = (parseFloat(100 * noOfWorkingHours) / 100);
        //             // Check if the gap is more than 4 days
        //             if (ginhake_code.getTime() - currentTaskEndDate.getTime() > 345600000) {
        //                 // isContinuous = false; // If the gap is more than 4 days, set to false

        //                 resourceArray = await this.transaction.createEntityP('d_o2c_project_resource', {
        //                     s_object_type: -1,
        //                     project_id: projectList[i].project_id,
        //                     project_guid: projectList[i].project_guid,
        //                     employee_id: filter_basedon_project[k].employee_id,
        //                     line_manager_id: taskEmployeeData.line_manager,
        //                     line_manager_name: taskEmployeeLmiData.full_name,
        //                     start_date: ginhake_code,
        //                     end_date: new Date(filter_basedon_project[k + 1].task_end_date),
        //                     percentage: 100,
        //                     plannedpds: noOfWorkingBasedPercentage,
        //                     s_status: "Approved",
        //                     onsite: false
        //                 });
        //                 index = k + 1;
        //                 // break; // No need to check further
        //             } else {
        //                 if (index == 0) {
        //                     projectList[i].r_resource_planning[j].start_date = filter_basedon_project[index].task_start_date;
        //                     projectList[i].r_resource_planning[j].end_date = filter_basedon_project[k + 1].task_end_date;
        //                     projectList[i].r_resource_planning[j].plannedpds = noOfWorkingBasedPercentage;
        //                 }
        //                 else {
        //                     resourceArray.start_date = filter_basedon_project[index].task_start_date;
        //                     resourceArray.end_date = filter_basedon_project[k + 1].task_end_date;
        //                     resourceArray.plannedpds = noOfWorkingBasedPercentage;
        //                 }
        //             }
        //         }


        //         planned_pd = parseFloat(parseFloat(planned_pd) + parseFloat(projectList[i].r_resource_planning[j].plannedpds));
        //     }
        //     projectList[i].planned_pds = parseFloat(planned_pd.toFixed(2));
        // }
        // oBusyIndicator.close();
        // await this.tm.commitP("Updated Successfully!", "Update Failed", true, true);

    }
    public async onProjectMilestoneStatus() {
        let projectID = [], projectData;
        // let migratedProject = await this.transaction.getExecutedQuery('d_o2c_migrated_project', { loadAll: true, project_action: "Created from Report", partialSelected: 'project_id' });
        // for (let i = 0; i < migratedProject.length; i++) {
        //     projectID.push(migratedProject[i].project_id)
        // }
        // if (projectID.length > 0) {
        projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_project_so,r_project_milestone' });

        for (let data = 0; data < projectData.length; data++) {
            let projectMile = await projectData[data].r_project_milestone;
            if (projectMile.length == 0) {
                let billingMilestoneStatus = [], projectMilestoneStatus = [], projectMilestoneStatusSet = [], milestoneArray = [];
                let soData = await projectData[data].r_project_so;
                let attachData = await soData[0].r_so_attachment.fetch();
                for (let attachmentData = 0; attachmentData < attachData.length; attachmentData++) {
                    // Po Line Item - 2
                    let itemData = await attachData[attachmentData].r_attachmnt_itm.fetch();
                    for (let itemTableData = 0; itemTableData < itemData.length; itemTableData++) {
                        // Po Line Item - 3(Milestone Table Data)
                        const milestoneData = await itemData[itemTableData].r_billing_new.fetch();
                        milestoneData.forEach(({ billing_milestone_name, actual_date, status }) => {
                            milestoneArray.push({
                                poNumber: attachData[attachmentData].po_no,
                                poDate: new Date(attachData[attachmentData].po_date),
                                milestoneName: billing_milestone_name,
                                startDate: null,
                                endDate: null,
                                actualEndDate: new Date(actual_date),
                                status: status,
                            })
                        });
                        // Po Line Item - 3(Schedule Table Data)
                        const scheduleData = await itemData[itemTableData].r_schedule_new.fetch();
                        scheduleData.forEach(({ description, start__date, end_date, actual_date, status }) => {
                            milestoneArray.push({
                                poNumber: attachData[attachmentData].po_no,
                                poDate: new Date(attachData[attachmentData].po_date),
                                milestoneName: description,
                                startDate: new Date(start__date),
                                endDate: new Date(end_date),
                                actualEndDate: new Date(actual_date),
                                status: status,
                            })
                        });
                        // Po Line Item - 3(Volume Table Data)
                        const volumeData = await itemData[itemTableData].r_vol_based_new.fetch();
                        volumeData.forEach(({ milestone_description, milestone_date, invoice_status }) => {
                            milestoneArray.push({
                                poNumber: attachData[attachmentData].po_no,
                                poDate: new Date(attachData[attachmentData].po_date),
                                milestoneName: milestone_description,
                                startDate: null,
                                endDate: null,
                                actualEndDate: new Date(milestone_date),
                                status: invoice_status,
                            })
                        });
                        billingMilestoneStatus = Array.from(new Set(milestoneArray.map(item => item.status)));

                    }
                }
                let projectMilestone;
                for (let projectMilestoneData = 0; projectMilestoneData < milestoneArray.length; projectMilestoneData++) {
                    let status;
                    if (milestoneArray[projectMilestoneData].status == "Invoiced") {
                        status = "Closed";
                    }
                    else {
                        status = "Open";
                    }
                    projectMilestone = await this.transaction.createEntityP('d_o2c_project_milestone', {
                        s_object_type: -1,
                        project_id: projectData[data].project_id,
                        project_guid: projectData[data].project_guid,
                        po_no: milestoneArray[projectMilestoneData].poNumber,
                        po_date: milestoneArray[projectMilestoneData].poDate,
                        milestone_name: milestoneArray[projectMilestoneData].milestoneName,
                        start_date: milestoneArray[projectMilestoneData].startDate,
                        end_date: milestoneArray[projectMilestoneData].endDate,
                        actual_date: milestoneArray[projectMilestoneData].actualEndDate,
                        s_status: status

                    });
                    projectMilestoneStatusSet.push(projectMilestone.s_status);

                }
                projectMilestoneStatus = Array.from(new Set(projectMilestoneStatusSet));
                //Overall Status check
                projectData[data].s_status = "Created";
                if (((attachData.length > 0) && (billingMilestoneStatus.length == 1) && (billingMilestoneStatus[0] == "Invoiced"))) {
                    //projectTable[i].trans_status = "Completed";
                    projectData[data].s_status = "Billing Closed";
                }
                if (((attachData.length > 0) && (projectMilestoneStatus.length == 1) && (projectMilestoneStatus[0] == "Closed"))) {
                    //projectTable[i].trans_status = "Completed";
                    projectData[data].s_status = "Delivery Closed";
                }
                if (((attachData.length > 0) && (billingMilestoneStatus.length == 1) && (projectMilestoneStatus.length == 1) && (billingMilestoneStatus[0] == "Invoiced" && projectMilestoneStatus[0] == "Closed")) || (((projectData[data].r_project_so[0].type == "ISP") || (projectData[data].r_project_so[0].type == "NBS")) && (new Date(projectData[data].r_project_so[0].project_end_date) <= new Date()))) {
                    //projectTable[i].trans_status = "Completed";
                    projectData[data].s_status = "Completed";
                    projectData[data].r_project_so[0].s_status = "Closed";

                }
                await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);
            }
        }
        sap.m.MessageToast.show("Project Milestone Status for all Project is completed: ", { duration: 2000 });
    }

    public async onResourcePlanningChanges() {
        let projectData;
        let taskIDs = [];
        let timesheetTaskSubmitIDs = [];
        let ftimesheetTaskIDs = [];
        let headerTimesheets;
        let employeeData = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', {
            loadAll: true, partialSelected: ['employee_id', 'first_name', 'last_name', 'full_name', 'line_manager']
        });
        // let migratedProject = await this.transaction.getExecutedQuery('d_o2c_migrated_project', { loadAll: true, project_action: "Created from Report", partialSelected: 'project_id' });
        // for (let i = 0; i < migratedProject.length; i++) {
        //     projectID.push(migratedProject[i].project_id)
        // }
        // if (projectID.length > 0) {
        projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_resource_planning' });

        for (let data = 0; data < projectData.length; data++) {
            let resourceArray = [];
            let calculatePlannedPDs = 0;
            let resourceData = await projectData[data].r_resource_planning;
            //New Line add on 13Nov
            if (resourceData.length == 0) {
                // for (let i = 0; i < resourceData.length; i++) {
                //     resourceData[i].deleteP();
                // }

                // Get project-based tasks
                const projectBasedTasks = await this.transaction.getExecutedQuery('d_o2c_task_assignment', {
                    loadAll: true,
                    'actual_project_id': projectData[data].project_id
                });

                taskIDs = projectBasedTasks.map(task => task.task_id);
                //employeeIDs= projectBasedTasks.map(task => task.employee_id);
                // Get approved tasks
                if (taskIDs.length) {
                    const timesheetTask = await this.transaction.getExecutedQuery('d_o2c_timesheet_task', {
                        loadAll: true,
                        status: "Approved"
                    });
                    let timesheetTasks = timesheetTask.filter(e => taskIDs.includes(e.task_id));

                    timesheetTaskSubmitIDs = timesheetTasks.map(task => task.submit_id);

                    // If there are approved submit IDs, get approved timesheets
                    if (timesheetTaskSubmitIDs.length > 0) {
                        //new code 
                        let headerTimesheet = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {
                            loadAll: true,
                            'over_all_status': "Approved"
                        });
                        headerTimesheets = headerTimesheet.filter(item => timesheetTaskSubmitIDs.includes(item.submit_id));
                        //End
                        const timesheetApprovedSubmitIDs = headerTimesheets.map(sheet => sheet.submit_id);
                        const headerApprovedTask = timesheetTasks.filter(item => timesheetApprovedSubmitIDs.includes(item.submit_id));
                        ftimesheetTaskIDs = Array.from(new Set(headerApprovedTask.map(task => task.task_id)));



                        let timesheetBookedBasedTasks;
                        // If there are approved task IDs, process monthly planning
                        if (ftimesheetTaskIDs.length > 0) {
                            let timesheetBookedBasedTask = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', {
                                loadAll: true
                            });
                            let timesheetBookedBasedTasks = timesheetBookedBasedTask.filter(e => taskIDs.includes(e.ftimesheetTaskIDs));


                            for (let task = 0; task < ftimesheetTaskIDs.length; task++) {
                                const submitid = headerApprovedTask.filter(item => item.task_id == ftimesheetTaskIDs[task]);
                                let sID = submitid.map(task => task.submit_id);
                                for (let s = 0; s < sID.length; s++) {
                                    let headerData = headerTimesheets.filter(item => item.submit_id == sID[s]);

                                    let taskEmployeeData = employeeData.find(item => (item.employee_id == headerData[0].employee_id));
                                    let taskEmployeeLmiData = employeeData.find(item => (item.employee_id == taskEmployeeData.line_manager));

                                    let resourceData = resourceArray?.filter(item => (item.MMID == headerData[0].employee_id));
                                    //If Resource Array don't have the Task assigned Employee,then create the resource in Resource Array

                                    let consumedPds = 0, totalconsumedPds = 0;
                                    const taskidBasedonDate = timesheetBookedBasedTasks.filter(item => item.booking_date >= headerData[0].from_date && item.booking_date <= headerData[0].to_date && item.task_id == ftimesheetTaskIDs[task]);
                                    // Sort the array by booking_date in ascending order
                                    const sortedDates = taskidBasedonDate.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

                                    // The smallest booking date is the first item in the sorted array
                                    const smallestBookingDate = sortedDates[0]?.booking_date;

                                    // The largest booking date is the last item in the sorted array
                                    const largestBookingDate = sortedDates[sortedDates.length - 1]?.booking_date;

                                    for (const k of sortedDates) {
                                        // if(k.hours_worked!=null && k.hours_worked!=undefined && k.hours_worked!="")
                                        consumedPds += parseFloat(k.hours_worked ? k.hours_worked : 0);
                                    }
                                    totalconsumedPds = (consumedPds / 8);

                                    if (resourceData.length == 0) {
                                        resourceArray.push({
                                            MMID: headerData[0].employee_id,
                                            role: '',
                                            lmi: taskEmployeeData.line_manager,
                                            lmiName: taskEmployeeLmiData.full_name,
                                            startDate: smallestBookingDate,
                                            endDate: largestBookingDate,
                                            percentage: 100,
                                            plannedpds: totalconsumedPds,
                                            status: "Approved",
                                            isOnsite: false,
                                        })
                                    }
                                    //If Resource Array  have the Task assigned Employee,then update the resource end date to task end date in Resource Array
                                    else {

                                        if (resourceData[0].startDate > smallestBookingDate) {
                                            resourceData[0].startDate = smallestBookingDate;
                                        }
                                        if (resourceData[0].endDate < largestBookingDate) {
                                            resourceData[0].endDate = largestBookingDate;
                                        }
                                        // const taskidBasedonDate = taskid.filter(item => item.booking_date >= resourceData[0].startDate && item.booking_date <= resourceData[0].endDate);
                                        // for (const task of taskidBasedonDate) {
                                        //     consumedPds += parseFloat(task.hours_worked);
                                        // }
                                        // totalconsumedPds = (consumedPds / 8);
                                        resourceData[0].plannedpds += totalconsumedPds;
                                    }

                                }
                            }

                            //After creating the Resource Array for all resource for particular SO...Then create the Project Resource Planning Data
                            for (let rData = 0; rData < resourceArray.length; rData++) {
                                const taskDetail = await this.transaction.getExecutedQuery('d_o2c_task_assignment', {
                                    loadAll: true,
                                    'actual_project_id': projectData[data].project_id
                                });
                                let smallestBookingDate, largestBookingDate;
                                if (taskDetail.length) {
                                    const taskFilter = taskDetail.filter(item => item.employee_id == resourceArray[rData].MMID);
                                    // Sort the array by booking_date in ascending order
                                    const sortedDates = taskFilter.sort((a, b) => new Date(a.task_start_date) - new Date(b.task_start_date));

                                    // The smallest booking date is the first item in the sorted array
                                    smallestBookingDate = sortedDates[0]?.task_start_date;

                                    // The largest booking date is the last item in the sorted array
                                    largestBookingDate = sortedDates[sortedDates.length - 1]?.task_end_date;

                                }
                                await this.transaction.createEntityP('d_o2c_project_resource', {
                                    s_object_type: -1,
                                    project_id: projectData[data].project_id,
                                    project_guid: projectData[data].project_guid,
                                    employee_id: resourceArray[rData].MMID,
                                    line_manager_id: resourceArray[rData].lmi,
                                    line_manager_name: resourceArray[rData].lmiName,
                                    start_date: new Date(smallestBookingDate),
                                    end_date: new Date(largestBookingDate),
                                    percentage: resourceArray[rData].percentage,
                                    plannedpds: parseFloat(resourceArray[rData].plannedpds.toFixed(2)),
                                    s_status: resourceArray[rData].status,
                                    onsite: resourceArray[rData].isOnsite
                                });
                                calculatePlannedPDs += resourceArray[rData].plannedpds;
                            }
                            //Project planned pds, sum of all resource plannedPds
                            projectData[data].planned_pds = parseFloat(calculatePlannedPDs.toFixed(2));
                        }
                    }
                }
            }
        }
        await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);


    }
    //Testing Done
    public async dividePlannedPds() {
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_resource_planning' });
        for (let data = 0; data < projectData.length; data++) {
            let totalPlannedPds = 0;
            let resourceData = await projectData[data].r_resource_planning;
            for (let resource = 0; resource < resourceData.length; resource++) {
                resourceData[resource].plannedpds = parseFloat(resourceData[resource].plannedpds / 8).toFixed(2);
                totalPlannedPds += resourceData[resource].plannedpds;
            }
            projectData[data].planned_pds = parseFloat(totalPlannedPds).toFixed(2);
        }
        await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);


    }
    //Testing Done
    public async reserveMartixCalculate() {
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_resource_planning' });
        for (let data = 0; data < projectData.length; data++) {
            let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
                loadAll: true, 'profit_center': projectData[data].profit_center, 'profit_center_pds': Math.round(parseFloat(projectData[data].total_project_pds))
            });
            let managementReservePerc = 0, contigencyReservePerc = 0;
            if (rsrvMatrixData.length) {
                managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(projectData[data].total_project_pds)) / 100));
                contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(projectData[data].total_project_pds)) / 100));
            }
            projectData[data].mreserve_new = managementReservePerc.toFixed(2);
            projectData[data].mcontig_new = contigencyReservePerc.toFixed(2);
            projectData[data].available_pds_new = parseFloat((parseFloat(projectData[data].total_project_pds) - managementReservePerc - contigencyReservePerc).toFixed(2));

            await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);

        }
        sap.m.MessageToast.show("Reserve Matrix calculated for all Project is completed: ", { duration: 2000 });


    }
    //Testing Done
    public async nbsIssue() {
        let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, s_status: "Approved", expandAll: 'r_profit_center,r_so_attachment' });
        for (let i = 0; i < so.length; i++) {
            if (so[i].type == "NBS" && (so[i].total_pds == null || so[i].total_pds == "" || so[i].total_pds == undefined)) {
                so[i].total_pds = 1;
                for (let j = 0; j < so[i].r_profit_center.length; j++) {
                    if (so[i].r_profit_center[j].percentage == null || so[i].r_profit_center[j].percentage == "" || so[i].r_profit_center[j].percentage == undefined) {
                        so[i].r_profit_center[j].percentage = parseFloat(100 / (so[i].r_profit_center.length)).toFixed(2);
                        so[i].r_profit_center[j].pds = parseFloat((so[i].r_profit_center[j].percentage * so[i].total_pds) / 100).toFixed(2);
                    }
                    else {
                        if (so[i].r_profit_center[j].pds == null || so[i].r_profit_center[j].pds == "" || so[i].r_profit_center[j].pds == undefined) {
                            so[i].r_profit_center[j].pds = parseFloat((so[i].r_profit_center[j].percentage * so[i].total_pds) / 100).toFixed(2);

                        }
                    }
                }
                await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);

            }
        }
        sap.m.MessageToast.show("NBS Total Pds for all SO is completed: ", { duration: 2000 });

    }
    public async changePropValue() {
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_resource_planning' });
        for (let i = 0; i < projectData.length; i++) {
            projectData[i].available_pds_new = parseFloat(projectData[i].total_project_pds);
            projectData[i].booked_pds_new = parseFloat(projectData[i].booked_pds);
        }
        await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);

    }
    public async projectMilestoneDateChange() {
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_project_milestone' });
        for (let i = 0; i < projectData.length; i++) {
            let projMilestoneData = projectData[i].r_project_milestone;
            const sortedData = projMilestoneData.sort((a, b) => new Date(a.actual_date) - new Date(b.actual_date));
            for (let j = 0; j < sortedData.length; j++) {
                if ((sortedData[j].start_date?.getFullYear() == "1970") && (sortedData[j].end_date?.getFullYear() == "1970")) {
                    if (j == 0) {
                        sortedData[j].start_date = "No Date";
                    }
                    else {
                        let endDate = new Date(sortedData[j - 1].end_date);
                        sortedData[j].start_date = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
                    }
                    sortedData[j].end_date = sortedData[j].actual_date;
                }
            }
        }
        await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);


    }
    public async deleteResource() {
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, partialSelected: ['so_id', 'project_id'], expandAll: 'r_resource_planning' });
        for (let data = 0; data < projectData.length; data++) {
            let resourceData = await projectData[data].r_resource_planning;
            for (let i = 0; i < resourceData.length; i++) {
                await resourceData[i].deleteP();
            }
            await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);
        }
    }
    public async taskIDFillInResource() {
        let unmatchedData = [];
        let allResourceData = await this.transaction.getExecutedQuery('d_o2c_project_resource', { loadAll: true, partialSelected: ['project_id'] });
        let resourceData= allResourceData.filter((item)=>item.task_id==null||item.task_id==""||item.task_id==undefined)
        let taskData = await this.transaction.getExecutedQuery('d_o2c_task_assignment', { loadAll: true, partialSelected: ['task_id', 'actual_project_id', 'employee_id', 'task_end_date'] });
        for (let data = 0; data < resourceData.length; data++) {
            //let taskFilter = taskData.filter(item => (item.actual_project_id == resourceData[data].project_id) && (item.employee_id == resourceData[data].employee_id) && ((new Date(item.task_start_date)) >= (new Date(resourceData[data].start_date))) || ((new Date(item.task_end_date))<= (new Date(resourceData[data].end_date))));
            let taskFilter = taskData.filter(item => (item.actual_project_id == resourceData[data].project_id) && (item.employee_id == resourceData[data].employee_id) && ((new Date(item.task_start_date)) <= (new Date(resourceData[data].end_date))) && ((new Date(item.task_end_date)) >= (new Date(resourceData[data].start_date))));
            if (taskFilter.length > 0) {
                let arrayTaskID = "";
                for (let i = 0; i < taskFilter.length; i++) {
                    arrayTaskID += taskFilter[i].task_id + ","; // Append each task_id with a comma
                }
                // Remove the trailing comma if needed
                if (arrayTaskID.endsWith(",")) {
                    arrayTaskID = arrayTaskID.slice(0, -1); // Remove the last comma
                }
                resourceData[data].task_id = arrayTaskID;
            }
            else {
                unmatchedData.push({
                    resource_guid: resourceData[data].resource_guid,
                    project_id: resourceData[data].project_id,
                    employee_id: resourceData[data].employee_id
                });
            }
        }
        await this.tm.commitP("Saved Successfully", "Saved Failed", true, true);
        console.log(unmatchedData);

    }
}
//3Dec 6:30PM
//AF
