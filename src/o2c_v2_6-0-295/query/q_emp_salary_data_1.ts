import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { EventContext } from "kloBo_7-2-115";
import {q_emp_salary_data_1 as q_emp_salary_data_1_gen} from "o2c_v2/query_gen/q_emp_salary_data_1"
export class q_emp_salary_data_1 extends q_emp_salary_data_1_gen{
    // public async empSalaryData(oEvent:EventContext){
    //     debugger
    //     let object = <KloQueryForRule>oEvent.getObject();

    //     object.setLoadAll(true)

    //     let txn = oEvent.getTxn();
    //     let qInstance = await txn.getQueryP('q_emp_salary_data');
    //     qInstance.setLoadAll(true);
    //     qInstance.setProperty("employee_id",oEvent.object.employee_id);
    //     await qInstance.executeP();
    //     await object.setResults(await qInstance.getResults());
    //     object.skipDBQueryExecution();
    // }
}