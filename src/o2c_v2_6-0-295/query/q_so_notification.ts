import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_customers } from "o2c_v2/entity/d_o2c_customers";
import { d_o2c_employee } from "o2c_v2/entity/d_o2c_employee";
import { d_o2c_so_hdr } from "o2c_v2/entity/d_o2c_so_hdr";
import { q_so_notification as q_so_notification_gen } from "o2c_v2/query_gen/q_so_notification"
export class q_so_notification extends q_so_notification_gen {

    public async so_notification_mail(oEvent) {
        if (oEvent.object.type == "soSubmitMail") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.approver, loadAll: true });
            let soEntity_obj = await this.txn.getExecutedQuery("d_o2c_so_hdr", { so: oEvent.object.order_number, loadAll: true });
            let cust_obj = <KloEntitySet<d_o2c_customers>> await this.txn.getExecutedQuery("d_o2c_customers",{loadAll: true, customer_id: soEntity_obj[0].bill_to_customer});
            // let approver_names = [];
            let sendTo = [];
            // for(let i=0; i<employee_entity.length; i++){
                sendTo.push(employee_entity[0].employee_id.toLowerCase());
                // approver_names.push(employee_entity[0].full_name);
            // }
            this.txn.addNotification('so_submit_notification', soEntity_obj[0], {
                order_number : oEvent.object.order_number,
                approver : employee_entity[0].full_name,
                order_date : oEvent.object.order_date,
                created_name : oEvent.object.created_name,
                client_name: cust_obj[0].customer_name,
                project_name: soEntity_obj[0].project_name,
                po_number: oEvent.object.poNumber
               
            }, sendTo);
            await this.txn.commitP();
        }
        if (oEvent.object.type == "soApprovalMail") {
            let soEntity_obj = <KloEntitySet<d_o2c_so_hdr>> await this.txn.getExecutedQuery("d_o2c_so_hdr", { so: oEvent.object.order_number, loadAll: true });
            let custObj = <KloEntitySet<d_o2c_customers>> await this.txn.getExecutedQuery("d_o2c_customers",{loadAll: true, customer_id : soEntity_obj[0].bill_to_customer});
             let sendTo = [];
             sendTo.push(oEvent.object.creator_id.toLowerCase());
             
            this.txn.addNotification('each_so_approval_notif', soEntity_obj[0], {
                creator_name : oEvent.object.creator_name,
                order_number : oEvent.object.order_number,
                project_name : soEntity_obj[0].project_name,
                customer_name: custObj[0].customer_name
            }, sendTo);
            await this.txn.commitP();

        }

        if (oEvent.object.type == "soFinalApprove") {
            let employee_entity = <KloEntitySet<d_o2c_employee>> await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.approver, loadAll: true });
            let soEntity_obj = <KloEntitySet<d_o2c_so_hdr>> await this.txn.getExecutedQuery("d_o2c_so_hdr", { so: oEvent.object.order_number, loadAll: true });
            // let cust_obj = <KloEntitySet<d_o2c_customers>> await this.txn.getExecutedQuery("d_o2c_customers",{loadAll: true, customer_id: soEntity_obj[0].bill_to_customer});
            let approver_names = [];
            let sendTo = [];
            for(let i=0; i<employee_entity.length; i++){
                sendTo.push(employee_entity[i].employee_id.toLowerCase());
             approver_names.push(employee_entity[i].full_name)
            }
            this.txn.addNotification('so_final_approval', soEntity_obj[0], {
                order_number : oEvent.object.order_number, order_date : oEvent.object.order_date, project_name : soEntity_obj[0].project_name,
                approver : approver_names, order_amount : oEvent.object.order_amount
            }, sendTo);
            await this.txn.commitP();
        }

        if (oEvent.object.type == "soReject") {
            // let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.approver, loadAll: true });
            let soEntity_obj = await this.txn.getExecutedQuery("d_o2c_so_hdr", { so: oEvent.object.order_number, loadAll: true });
            // let approver_names = [];
            // let sendTo = [];
            // for(let i=0; i<employee_entity.length; i++){
            //     sendTo.push(employee_entity[i].employee_id.toLowerCase());
            //  approver_names.push(employee_entity[i].full_name)
            // }
            this.txn.addNotification('each_so_reject_notif', soEntity_obj[0], {
                order_number : oEvent.object.order_number, creator_name : oEvent.object.creator_name,
                appropriate_person: oEvent.object.appropriate_person, comment : oEvent.object.comment
            }, [oEvent.object.creator]);
            await this.txn.commitP();
        }

        if(oEvent.object.type == "crCreationMail"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.approver, loadAll: true });
            let soEntity_obj = await this.txn.getExecutedQuery("d_o2c_so_hdr", { so: oEvent.object.order_number, loadAll: true });
            let approver_names = [];
            let sendTo = [];
            // for(let i=0; i<employee_entity.length; i++){
                sendTo.push(employee_entity[0].employee_id.toLowerCase());
                approver_names.push(employee_entity[0].full_name);
            // }
            this.txn.addNotification('so_submit_notification', soEntity_obj[0], {
                order_number : oEvent.object.order_number,
                approver : approver_names,
                order_date : oEvent.object.order_date,
                created_name : oEvent.object.created_name,
                next_date : oEvent.object.next_date,
                order_amount : oEvent.object.order_amount
            }, sendTo);
            await this.txn.commitP();
        }

    }
}