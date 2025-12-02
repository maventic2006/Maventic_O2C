import {q_pi_mail as q_pi_mail_gen} from "o2c_v2/query_gen/q_pi_mail"
export class q_pi_mail extends q_pi_mail_gen{

    public async onPiMail(oEvent){
        let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
            
            this.txn.addNotification('pi_verification_mail', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                pi_numbers: oEvent.object.pi_numbers,
                verification_dates: oEvent.object.verification_dates
            }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP();
    }
}