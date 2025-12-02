import { KloController } from 'kloTouch/jspublic/KloController'
import { taskassignment } from 'o2c_v2/util/taskassignment';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_resource_approval")
export default class p_resource_approval extends KloController {

    /*public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }*/

    public async onPageEnter() {
        await this.tm.getTN('other_remark').setData({ 'remark': false });
    }

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/
    public async onPressApprove(oEvent) {
        let approvedResource=[];
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/o2c_project_resource_list/", ''))
        let resourceStatus = await this.tm.getTN("o2c_project_resource_list").getData()[index];
        resourceStatus.s_status = "Approved";
        //Task Assignment----START
        let so = await resourceStatus.r_resource_project[0].r_project_so.fetch();
        let assignedBy = (resourceStatus.s_created_by==null||resourceStatus.s_created_by==''||resourceStatus.s_created_by==undefined)?resourceStatus.r_resource_project[0].s_modified_by:resourceStatus.s_created_by;
        approvedResource.push(resourceStatus);
        await taskassignment.createUpdateTask(this.transaction, assignedBy, resourceStatus.project_id, resourceStatus.r_resource_project[0].so_id, so[0].project_name, approvedResource,'Resource',this);
        //Task Assignment----END
        await this.tm.commitP("Approved Successfully", "Approved Failed", true, true);
        // await this.tm.getTN("o2c_project_resource_list").refresh();
        await this.tm.getTN("o2c_project_resource_search").executeP();

        //Mail Notification
        let projectManager;
        let soData = await resourceStatus.r_resource_project[0].r_project_so.fetch();
        let projectName = soData[0].project_name;
        let profitCenter = await soData[0].r_profit_center.fetch();
        for (let i = 0; i < profitCenter.length; i++) {
            if (profitCenter[i].profit_center == await resourceStatus.r_resource_project[0].profit_center)
                projectManager = profitCenter[i].project_manager;
        }

        await this.tm.getTN("mail_notification").setProperty("type", "approved");
        await this.tm.getTN("mail_notification").setProperty("action", "Approval");
        await this.tm.getTN("mail_notification").setProperty("resourceGuid", resourceStatus.resource_guid);
        await this.tm.getTN("mail_notification").setProperty("projectName", projectName);
        await this.tm.getTN("mail_notification").setProperty("projectManager", projectManager);
        await this.tm.getTN("mail_notification").setProperty("resourceId", resourceStatus.employee_id);
        await this.tm.getTN("mail_notification").setProperty("startDate", resourceStatus.start_date);
        await this.tm.getTN("mail_notification").setProperty("endDate", resourceStatus.end_date);
        await this.tm.getTN("mail_notification").executeP();

    }
    public async onPressReject(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/o2c_project_resource_list/", ''))
        let resourceStatus = await this.tm.getTN("o2c_project_resource_list").getData()[index];
        if (resourceStatus.remark) {
            resourceStatus.s_status = "Rejected";
            await this.tm.commitP("Rejected Successfully", "Rejected Failed", true, true);
            await this.tm.getTN("o2c_project_resource_search").executeP();

            //Mail Notification
            let projectManager;
            let soData = await resourceStatus.r_resource_project[0].r_project_so.fetch();
            let projectName = soData[0].project_name;
            let profitCenter = await soData[0].r_profit_center.fetch();
            for (let i = 0; i < profitCenter.length; i++) {
                if (profitCenter[i].profit_center == await resourceStatus.r_resource_project[0].profit_center)
                    projectManager = profitCenter[i].project_manager;
            }

            await this.tm.getTN("mail_notification").setProperty("type", "rejected");
            await this.tm.getTN("mail_notification").setProperty("action", "Rejection");
            await this.tm.getTN("mail_notification").setProperty("resourceGuid", resourceStatus.resource_guid);
            await this.tm.getTN("mail_notification").setProperty("projectName", projectName);
            await this.tm.getTN("mail_notification").setProperty("projectManager", projectManager);
            await this.tm.getTN("mail_notification").setProperty("resourceId", resourceStatus.employee_id);
            await this.tm.getTN("mail_notification").setProperty("startDate", resourceStatus.start_date);
            await this.tm.getTN("mail_notification").setProperty("endDate", resourceStatus.end_date);
            await this.tm.getTN("mail_notification").executeP();



        }
        else {
            sap.m.MessageBox.error("Remark is mandatory!!!", {
                title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
            })
            await this.tm.getTN('other_remark').setData({ 'remark': resourceStatus.remark, 'resource_guid': resourceStatus.resource_guid });
        }
    }
    public async onSave() {
        let changeListData = this.tm.getTN('o2c_project_resource_list').getData().filter(record => record.isDirty)
        let employee = await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name'] })

        for (let i = 0; i < changeListData.length; i++) {
            if (changeListData[i].employee_id) {
                changeListData[i].line_manager_id = ((await this.transaction.get$User()).login_id).toUpperCase();
                const lineManagerName = employee.filter((item) => item.employee_id == changeListData[i].line_manager_id)
                changeListData[i].line_manager_name = lineManagerName[0].full_name;
                changeListData[i].s_status = "Approved";
            }
        }
        await this.tm.commitP("Save Successfully", "Save Failed", true, true);
        await this.tm.getTN("o2c_project_resource_search").executeP();
    }
}
//26Nov//11:36PM