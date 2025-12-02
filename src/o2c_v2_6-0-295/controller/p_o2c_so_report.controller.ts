import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_project_header } from 'o2c_v2/entity/d_o2c_project_header';
import { d_o2c_so_hdr } from 'o2c_v2/entity/d_o2c_so_hdr';
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_timesheet_approver } from 'o2c_v2/entity_gen/d_o2c_timesheet_approver';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_volume_based } from 'o2c_v2/entity_gen/d_o2c_volume_based';
import { ApiTracker } from 'o2c_v2/util/ApiTracker';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_so_report")
export default class p_o2c_so_report extends KloController {

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).

        await this.tm.getTN("replace_other").setData({});
        await this.tm.getTN("discard_other").setData({});
        await this.tm.getTN("prj_discard_other").setData({});
        await this.tm.getTN("so_status").setData({});
        this.tm.getTN("prj_discard_other").setProperty("reopen_visible", false);
        let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "reopen_so" });
        if (general_config[0].high_value == 1) {
            this.tm.getTN("prj_discard_other").setProperty("reopen_visible", true);
        }
    }

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/

    //Replacing the selected SO with the duplicate SO
    public async onSubmit() {
        let replacement_data = await this.tm.getTN("replace_other").getData();
        let so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: replacement_data.find_so, loadAll: true });
        let task_against_so = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("d_o2c_task_assignment", { project_id: replacement_data.find_so, loadAll: true });
        for (let i = 0; i < task_against_so.length; i++) {
            if (task_against_so[i].task_start_date >= so[0].project_start_date && task_against_so[i].task_end_date <= so[0].project_end_date) {
                task_against_so[i].project_id = replacement_data.replace_so;
            } else {
                sap.m.MessageBox.error("One of the task's start date or end date is not within the range of the Sales Order start date and end date.", {
                    title: "Error"
                })
                return;
            }
        }
        await this.tm.commitP("Replaced Successful", "Replacement Failed", true, true);
    }

    //Discarding the selected SO
    public async onChangeStatus() {
        let replacement_data = await this.tm.getTN("discard_other").getData();
        let task_against_so = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("d_o2c_task_assignment", { project_id: replacement_data.so_no, loadAll: true });
        if (task_against_so.length > 0) {
            sap.m.MessageBox.confirm(`There are task assigned against this SO in the timesheet. Please replace the SO in the timesheet before or after discarding.
              Do you wish to continue?
              
              Note: This changes cannot be reverted.`, {
                title: "Confirm",
                actions: [sap.m.MessageBox.Action.OK,
                sap.m.MessageBox.Action.CANCEL],
                onClose: async (oAction) => {
                    if (oAction == "OK") {

                        let so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: replacement_data.so_no, loadAll: true });
                        let project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { so_id: replacement_data.so_no, loadAll: true });
                        so[0].s_status = "Archived";
                        for (let i = 0; i < project.length; i++) {
                            project[i].s_status = "Archived";
                            // project[i].trans_status = "Archived";
                        }
                        await this.tm.commitP("Discard Successful", "Discard Failed", true, true);
                    }
                }
            })
        } else {
            sap.m.MessageBox.confirm(`Do you really want to Discard? Note: This changes cannot be reverted.`, {
                title: "Confirm",
                actions: [sap.m.MessageBox.Action.OK,
                sap.m.MessageBox.Action.CANCEL],
                onClose: async (oAction) => {
                    if (oAction == "OK") {

                        let so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { so: replacement_data.so_no, loadAll: true });
                        let project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { so_id: replacement_data.so_no, loadAll: true });
                        so[0].s_status = "Archived";
                        for (let i = 0; i < project.length; i++) {
                            project[i].s_status = "Archived";
                            // project[i].trans_status = "Archived";
                        }
                        await this.tm.commitP("Discard Successful", "Discard Failed", true, true);
                    }
                }
            })
        }

    }

    public async onProjectDiscard() {
        sap.m.MessageBox.confirm(`Do you really want to Discard? Note: This changes cannot be reverted.`, {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: async (oAction) => {
                if (oAction == "OK") {
                    let replacement_data = await this.tm.getTN("prj_discard_other").getData();
                    let project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { project_id: replacement_data.prj_no, loadAll: true });
                    project[0].s_status = "Archived";
                    await this.tm.commitP("Discard Successful", "Discard Failed", true, true);
                }
            }
        })
    }

    public async onUpdatePDS() {
        let replacement_data = await this.tm.getTN("prj_discard_other").getData();
        let project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { project_id: replacement_data.prj_no, loadAll: true, expandAll: 'r_project_so' });
        let profitCentre = await project[0].r_project_so[0].r_profit_center.fetch();
        let filteredPC = await profitCentre.filter((item) => item.profit_center === project[0].profit_center);
        // if (filteredPC.length > 1) {

        // let projectSO = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { so_id: project[0].so_id, loadAll: true, expandAll: 'r_project_so' });
        // let t=0;
        // for (let i = 0; i < projectSO.length; i++) {
        //     let projectProfit = projectSO[i].r_project_so[0].r_profit_center.fetch();

        //     await this.calculatePds(projectSO[i],projectProfit[t++].pds);
        // }
        // sap.m.MessageBox.error("Project's SO is having PC with same values.", {
        //     title: "Error"
        // })
        // console.log(projectSO);

        // } else {
        await this.calculatePds(project, filteredPC[0].pds);
        await this.tm.commitP("Save Successful", "Saved Failed", true, true);
        // }
        // let projectID = projectData.map((item) => item.project_id);
    }

    public async calculatePds(project, pds) {
        let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
            loadAll: true, 'profit_center': project[0].profit_center, 'profit_center_pds': pds
        });
        let managementReservePerc = 0, contigencyReservePerc = 0;
        if (rsrvMatrixData.length) {
            managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(pds)) / 100));
            contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(pds)) / 100));
        }
        let consumeData = await this.transaction.getExecutedQuery('d_o2c_reserve_consumption', {
            loadAll: true, 'project_id': project[0].project_id, 's_status': "Approved"
        });
        // let projectPresent = project?.filter((item) => item.profit_center == data.profitCenterTable[i].profitCentre);
        let consumedPresent = consumeData?.filter((item) => item.project_id == project[0].project_id);
        let sumManagement = 0;
        let sumContigency = 0;
        for (let i = 0; i < consumedPresent.length; i++) {
            sumManagement += parseFloat(consumedPresent[i].managment_reserve);
            sumContigency += parseFloat(consumedPresent[i].contigency_reserve);
        }
        if (project.length > 0) {
            // for (let j = 0; j < projectPresent.length; j++) {
            //Need to do Albia
            project[0].total_project_pds = pds;
            project[0].mreserve_new = (parseFloat(managementReservePerc - sumManagement).toFixed(2));
            project[0].mcontig_new = (parseFloat(contigencyReservePerc - sumContigency).toFixed(2));
            project[0].available_pds_new = (parseFloat(project[0].total_project_pds - project[0].mreserve_new - project[0].mcontig_new).toFixed(2));
            // }
        }


    }

    // Project status can't be changed as it is a transient field and it is calculated in the entity file.. So project closure part will not work.
    public async onSOStatus() {
        let data = await this.tm.getTN("so_status").getData().status;
        let soData = await this.transaction.getExecutedQuery('d_o2c_so_hdr', {
            loadAll: true, 'so': data, expandAll: 'r_project'
        });
        if (soData[0].s_status == "Closed") {
            soData[0].s_status = "Approved";
            for (let i = 0; i < soData[0].r_project.length; i++) {
                const ProjectMilestoneTableData = await soData[0].r_project[i].r_project_milestone.fetch();
                const ProjectMilestoneStatus = Array.from(new Set(ProjectMilestoneTableData.map(item => item.s_status)));


                //Billing Plan from SO
                let billingArray = [];
                let billingMilestoneStatus
                let attachData = await soData[0].r_so_attachment.fetch();
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



                if (ProjectMilestoneStatus.length == 1 && ProjectMilestoneStatus[0] == "Closed") {
                    soData[0].r_project[i].s_status = "Delivery Closed";

                }
                if (billingMilestoneStatus.length == 1 && billingMilestoneStatus[0] == "Invoiced") {
                    soData[0].r_project[i].s_status = "Billing Closed";
                }

            }
            await this.tm.commitP("Save Successful", "Saved Failed", true, true);

        }
        else {
            sap.m.MessageBox.error(`This SO is not closed.`, {
            })
        }
    }

    public async onReplaceTSApprovalFlow() {
        let emp_id = await this.tm.getTN("replace_other").getData().emp_id;
        let ts_header = <KloEntitySet<d_o2c_timesheet_header>>await this.transaction.getExecutedQuery("d_o2c_timesheet_header", { loadAll: true, over_all_status: "Submitted", employee_id: emp_id });
        let all_emp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name', 'line_manager', 'employee_id'] });
        // let ts_headr_submitids = ts_header.map(item => item.submit_id)
        for (let i = 0; i < ts_header.length; i++) {
            let ts_approval = <KloEntitySet<d_o2c_timesheet_approver>>await this.transaction.getExecutedQuery("d_o2c_timesheet_approver", { loadAll: true, submit_id: ts_header[i].submit_id });
            // Create a copy to ensure prev_ts_approval remains unchanged
            let prev_ts_approval = ts_approval.map(item => ({
                submit_id: item.submit_id,
                approval_status: item.approval_status,
                approved_on: item.approved_on,
                approver: item.approver,
                approver_remark: item.approver_remark,

            }));
            // Sort by latest approved_on date 
            prev_ts_approval.sort((a, b) => new Date(b.s_created_on).getTime() - new Date(a.s_created_on).getTime());
            Promise.all(ts_approval.map(item => item.deleteP()));

            let start_date = new Date(ts_header[i].from_date.getFullYear(), ts_header[i].from_date.getMonth(), 1);
            let end_date = new Date(ts_header[i].from_date.getFullYear(), ts_header[i].from_date.getMonth() + 1, 0);

            let emp_task_assigned = <KloEntitySet<d_o2c_task_assignment>>await this.transaction.getExecutedQuery("q_user_task", { loadAll: true, start_mnth: start_date, end_mnth: end_date, employee_id: ts_header[i].employee_id });
            let list = emp_task_assigned.filter(task => task.task_type != "Leave");
            // Extract unique assigned_by values
            let assigned_by_set = new Set(list.map(task => task.assigned_by));
            let thisUser = all_emp.find(emp => emp.employee_id == ts_header[i].employee_id.toUpperCase())
            let lmAssignedTask = false;
            let uniqueApprovers = new Set(); // Track unique approvers

            for (let j = 0; j < list.length; j++) {
                let level = 0;

                if (thisUser.line_manager == list[j].assigned_by.toUpperCase()) {
                    lmAssignedTask = true;
                    if (assigned_by_set.size == 1) {
                        level = 0;
                    } else {
                        level = 1;
                    }
                }
                let prev_approver = prev_ts_approval.find(itm => itm.approver.toLowerCase() == list[j].assigned_by.toLowerCase())
                // Add only unique approvers
                if (!uniqueApprovers.has(list[j].assigned_by)) {
                    uniqueApprovers.add(list[j].assigned_by);
                    await this.transaction.createEntityP("d_o2c_timesheet_approver", {
                        task_version: 0,
                        approval_sequence: level,
                        submit_id: ts_header[i].submit_id,
                        approver: list[j].assigned_by.toUpperCase(),
                        approved_on: (prev_approver?.approval_status == "Approved") ? prev_approver.approved_on : null,
                        approval_status: (prev_approver) ? prev_approver?.approval_status : "Pending",
                        approver_remark: (prev_approver?.approval_status == "Approved") ? prev_approver?.approver_remark : ""
                    });
                }
            }

            if (!lmAssignedTask && list.length) {
                await this.transaction.createEntityP("d_o2c_timesheet_approver", {
                    task_version: 0,
                    approval_sequence: 1,
                    submit_id: ts_header[i].submit_id,
                    approver: thisUser.line_manager,
                    approval_status: "Pending",
                    approver_remark: " "
                })
            }
        }
        await this.transaction.commitP();
        console.log(ts_header);
    }

    public async addMissingDateInVolume() {
        let volumeList = <KloEntitySet<d_o2c_volume_based>>await this.transaction.getExecutedQuery("d_o2c_volume_based", { loadAll: true, expandAll: 'r_volume_item' });
        for (let volume of volumeList) {
            if (!volume.start_date || !volume.end_date) {
                let item_value = volume.r_volume_item;
                if (item_value) {
                    volume.start_date = item_value[0].start_date;
                    volume.end_date = item_value[0].end_date;
                }
            }
        }
        await this.tm.commitP("Save Successfull", "Save Failed", false, false);
    }

    public async updateApiAmc() {
        let queryInstance = await this.transaction.getQueryP("q_generate_record_from_so");
        queryInstance.setProperty("subscribed_customer","Customer");
        let res = await queryInstance.executeP();
        if(res){
            await this.tm.commitP("Commit Success!", "Commit Failed!",false);
        }
    }

    public async generateAmcApiReport(){
        let queryInstance = await this.transaction.getQueryP("q_generate_record_from_so");
        queryInstance.setProperty("subscribed_customer","API");
        let res = await queryInstance.executeP();
        if(res){
            await this.tm.commitP("Commit Success!", "Commit Failed!",false);
        }
    }
}
//AF 4 Dec 6PM