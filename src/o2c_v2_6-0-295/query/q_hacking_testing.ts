import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { EventContext } from "kloBo/EventContext";
import { q_hacking_testing as q_hacking_testing_gen } from "o2c_v2/query_gen/q_hacking_testing";

export class q_hacking_testing extends q_hacking_testing_gen {
    public async getAllSalaryData(oEvent: EventContext) {
        const object = oEvent.getObject() as KloQueryForRule;
        object.setLoadAll(true);

        const txn = oEvent.getTxn();
        const qInstance = await txn.getQueryP("q_emp_salary_data");
        qInstance.setLoadAll(true);

        await qInstance.executeP();
        const results = await qInstance.getResults();
        await object.setResults(results);

        object.skipDBQueryExecution();
    }
}
