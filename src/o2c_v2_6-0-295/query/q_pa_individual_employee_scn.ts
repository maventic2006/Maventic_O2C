import { KloQueryForRule } from "kloBo_7-2-115/KloQueryForRule";
import {q_pa_individual_employee_scn as q_pa_individual_employee_scn_gen} from "o2c_v2/query_gen/q_pa_individual_employee_scn"
export class q_pa_individual_employee_scn extends q_pa_individual_employee_scn_gen{

    public async expandAllData(oEvent) {
        let object = <KloQueryForRule>oEvent.getObject();
        object.setLoadAll(true);
        let txn = oEvent.getTxn();
        let qInstance = await txn.getQueryP('q_indvidual_employee_page_1');
        qInstance.setLoadAll(true)
        await qInstance.executeP();

    }
}
