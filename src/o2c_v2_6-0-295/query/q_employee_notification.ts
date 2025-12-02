import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_employee_notification as q_employee_notification_gen } from "o2c_v2/query_gen/q_employee_notification"
export class q_employee_notification extends q_employee_notification_gen {

    public async legal_approval_mail(oEvent) {
        if (oEvent.object.type == "approvedByLegal") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true });
            let sendTo = [];
            sendTo.push(employee_entity[0].employee_id.toLowerCase());
            sendTo.push(employee_entity[0].s_created_by.toLowerCase());
            this.txn.addNotification('legal_appr_mail', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                employee_id : employee_entity[0].employee_id
            }, sendTo);
            await this.txn.commitP();

        }
        if (oEvent.object.type == "rejectedByLegal") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true });
            let sendTo = [];
            sendTo.push(employee_entity[0].employee_id.toLowerCase());
            sendTo.push(employee_entity[0].s_created_by.toLowerCase());
            this.txn.addNotification('legal_reject_mail', employee_entity[0], {
                emp_name: employee_entity[0].full_name,
                employee_id : employee_entity[0].employee_id
            }, sendTo);
            await this.txn.commitP();

        }

    }
}