import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_o2c_emp_pa_cycle as q_o2c_emp_pa_cycle_gen } from "o2c_v2/query_gen/q_o2c_emp_pa_cycle"
export class q_o2c_emp_pa_cycle extends q_o2c_emp_pa_cycle_gen {


    public async pa_cycle_loadall(oEvent) {


        let object = <KloQueryForRule>oEvent.getObject();

        object.setLoadAll(true)


        let txn = oEvent.getTxn();
        let qInstance = await txn.getQueryP('q_o2c_emp_pa_cycle_rel');
        qInstance.setLoadAll(true)
        await qInstance.executeP();


    }

//

}
