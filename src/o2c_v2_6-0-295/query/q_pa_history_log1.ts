
import { EventContext } from "kloBo/EventContext";
import { KloQueryForRule } from "kloBo/KloQueryForRule";
import {q_pa_history_log1 as q_pa_history_log1_gen} from "o2c_v2/query_gen/q_pa_history_log1"
export class q_pa_history_log1 extends q_pa_history_log1_gen{


    // public async empSalHis(oEvent:EventContext){
    //     debugger
    //     let object = <KloQueryForRule>oEvent.getObject();

    //     object.setLoadAll(true)

    //     let txn = oEvent.getTxn();
    //     let qInstance = await txn.getQueryP('q_pa_history_log');
    //     qInstance.setLoadAll(true);
    //     qInstance.setProperty("employee_id",oEvent.object.employee_id);
    //     await qInstance.executeP();
    //     await object.setResults(await qInstance.getResults());
    //     object.skipDBQueryExecution();
    // }


}