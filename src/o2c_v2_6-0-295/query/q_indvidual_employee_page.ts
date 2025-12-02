import { KloQueryForRule } from "kloBo_7-2-115/KloQueryForRule";
import {q_indvidual_employee_page as q_indvidual_employee_page_gen} from "o2c_v2/query_gen/q_indvidual_employee_page"
export class q_indvidual_employee_page extends q_indvidual_employee_page_gen{
    public async relationExpandAllData(oEvent) {


        let object = <KloQueryForRule>oEvent.getObject();

        object.setLoadAll(true)


        let txn = oEvent.getTxn();
        let qInstance = await txn.getQueryP('q_indvidual_employee_page_1');
        qInstance.setLoadAll(true)
        await qInstance.executeP();


    }
}