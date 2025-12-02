import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_submit_from_employee as q_submit_from_employee_gen } from "o2c_v2/query_gen/q_submit_from_employee"
export class q_submit_from_employee extends q_submit_from_employee_gen {

    public async on_emp_submission(oEvent){

        let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.hr,loadAll:true})
        this.txn.addNotification('profile_submission', employee_entity[0], {
            first_name: oEvent.object.emp
        }, [employee_entity[0].employee_id.toLowerCase()]);
        await this.txn.commitP();

    }
   
}