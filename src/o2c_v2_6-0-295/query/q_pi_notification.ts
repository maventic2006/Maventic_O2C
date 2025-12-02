import {q_pi_notification as q_pi_notification_gen} from "o2c_v2/query_gen/q_pi_notification"
export class q_pi_notification extends q_pi_notification_gen{


    public async onPiComplete(oEvent) {
        
        if(oEvent.object.type == "piComplete"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true });
            let today = new Date();
            // for (let i = 0; i < employee_entity.length; i++) {
                this.txn.addNotification('asset_pi_completion_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    pi_number: oEvent.object.pi_number,
                    verifier_name: oEvent.object.verifier_name?oEvent.object.verifier_name:"",
                    // verifier_name: "Nasim",
                    completion_date: oEvent.object.completion_date,
                    completed_date: today,
                }, [employee_entity[0].employee_id.toLowerCase()]);
            // }
            await this.txn.commitP();
        }
    }
}