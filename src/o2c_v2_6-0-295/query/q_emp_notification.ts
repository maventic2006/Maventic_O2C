import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_emp_notification as q_emp_notification_gen } from "o2c_v2/query_gen/q_emp_notification"
export class q_emp_notification extends q_emp_notification_gen {

    public async profileApprovalByHR(oEvent) {
        if (oEvent.object.type == "ApprovedByHR") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true })
            this.txn.addNotification('profile_appr_hr', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                employee_id : employee_entity[0].employee_id
            }, oEvent.object.legal);
            await this.txn.commitP();


            /*TO trigger mail for submission of Profile*/

        // public async legalApproveNotification() {
        //     let detail = await this.tm.getTN("o2c_employ_detail").getData();
        //     await this.tm.getTN("reminder").setProperty('type', "Profile");
        //     await this.tm.getTN("reminder").setProperty('emp_id', detail.employee_id);
        //     await this.tm.getTN("reminder").executeP()
        //     sap.m.MessageToast.show("Reminder Mail for Profile Submission is sent successfully!");
        // }

        }

    }
}