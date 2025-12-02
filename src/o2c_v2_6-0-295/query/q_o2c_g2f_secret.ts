import {q_o2c_g2f_secret as q_o2c_g2f_secret_gen} from "o2c_v2/query_gen/q_o2c_g2f_secret"
export class q_o2c_g2f_secret extends q_o2c_g2f_secret_gen{
    public async secretKeyMail(oEvent){
        // if (oEvent.object.type == "secretKeyNotif") {
        //     let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.user_id, loadAll: true });
        //     let g2fEntity_obj = await this.txn.getExecutedQuery("d_o2c_g2f_secret", { user_id: oEvent.object.user_id,skipMap:true, loadAll: true });            // let approver_names = [];
        //     let sendTo = [];
        //         sendTo.push(employee_entity[0].employee_id.toLowerCase());
        //     this.txn.addNotification('secretKeyNotif', g2fEntity_obj[0], {
        //         user_id : employee_entity[0].full_name,
        //         secret_key : g2fEntity_obj[0].secret_key,
        //     }, sendTo);
        //     // await this.txn.commitP();
        // }
    }
}
//13/July