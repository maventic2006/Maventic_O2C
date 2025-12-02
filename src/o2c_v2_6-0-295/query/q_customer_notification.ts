import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_designation } from "o2c_v2/entity/d_o2c_employee_designation";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { d_o2c_designation_master } from "o2c_v2/entity_gen/d_o2c_designation_master";
import { q_customer_notification as q_customer_notification_gen } from "o2c_v2/query_gen/q_customer_notification"
export class q_customer_notification extends q_customer_notification_gen {

    public async customer_notification_mail(oEvent) {
        // debugger;
        if (oEvent.object.type == "approvedByLegal") {
            let customer_entity = await this.txn.getExecutedQuery("d_o2c_customers", { customer_id: oEvent.object.customer_id, loadAll: true });
            let sendTo = [];
            sendTo.push(customer_entity[0].sales_responsible.toLowerCase());
            this.txn.addNotification('customer_approval', customer_entity[0], {
                sales_person: customer_entity[0].sales_responsible_name,
                customer_id: customer_entity[0].customer_id,
                customer_name: customer_entity[0].customer_name,
                approver: oEvent.object.approver
            }, sendTo);
            await this.txn.commitP();

        }
        if (oEvent.object.type == "rejectByLegal") {
            // debugger;
            let customer_entity = await this.txn.getExecutedQuery("d_o2c_customers", { customer_id: oEvent.object.customer_id, loadAll: true });
            let sendTo = [];
            sendTo.push(customer_entity[0].sales_responsible.toLowerCase());
            this.txn.addNotification('customer_rejection', customer_entity[0], {
                sales_person: customer_entity[0].sales_responsible_name,
                customer_id: customer_entity[0].customer_id,
                customer_name: customer_entity[0].customer_name,
                approver: oEvent.object.approver
            }, sendTo);
            await this.txn.commitP();

        }

        if (oEvent.object.type == "customerCreate") {
            // debugger;
            let legalIDArray = [];
            let customer_entity = await this.txn.getExecutedQuery("d_o2c_customers", { customer_id: oEvent.object.customer_id, loadAll: true });
            let desig_id = <KloEntitySet<d_o2c_designation_master>>await this.txn.getExecutedQuery('d_o2c_designation_master', { name: 'LEGAL', loadAll: true });
            let legalID = <KloEntitySet<d_o2c_employee_designation>>await this.txn.getExecutedQuery('d_o2c_employee_designation', { loadAll: true, designation: desig_id[0].designation_id });
            for (let emp of legalID) {
                legalIDArray.push(emp.employee_id.toLowerCase());
            }
            try {
                this.txn.addNotification('customer_create_notif', customer_entity[0], {
                    sales_responsible_name: oEvent.object.sales_responsible_name, 
                    customer_name: oEvent.object.customer_name, 
                    customer_id: oEvent.object.customer_id
                }, legalIDArray);
            } catch (e) {
                this.error(e);
                throw new Error(e);
            }
            await this.txn.commitP();
        }

    }
}