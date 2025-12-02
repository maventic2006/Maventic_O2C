import { KloQueryForRule } from "kloBo/KloQueryForRule";
//import { EventContext } from "kloBo_7-2-108";
import {q_expense_perdiem_dcl as q_expense_perdiem_dcl_gen} from "o2c_v2/query_gen/q_expense_perdiem_dcl"
export class q_expense_perdiem_dcl extends q_expense_perdiem_dcl_gen{
    public async after_query_fetching(oEvent){
    //     let object = <KloQueryForRule>oEvent.getObject();
    //     object.setLoadAll(true)
    //     let trans = oEvent.getTxn();
    //     // let query_data = await await this.trans.getQueryP('q_expense_perdiem_dcl');
    //     // query_data.setLoadAll(true)
    //     // await query_data.executeP();
    //     let query_data=await object.getResults();
    //     const from_date = oEvent.object.from_date;
    //     const to_date = oEvent.object.to_date;
    //     for(let i=0;i<(await query_data).length;i++){
    //         if(query_data[i].from_date<from_date){
    //         query_data[i].transient_start_date=from_date;
    //         }
    //         if(query_data[i].to_date<to_date){
    //         query_data[i].transient_end_date=to_date;
    //         }
    //     }
    //     await object.setResults(query_data);
     }
    // let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
    //     let txn = oEvent.getTxn();
    //     let qInstance = await txn.getQueryP('q_indvidual_employee_page');//this way you can get instance of any query
    //     await qInstance.executeP();//execute here
    //     let results = await qInstance.getResults();  //get the results
    //     await instance.setResults(results);//set the results
    public async expandAllRelData(oEvent) {
        let object = <KloQueryForRule>oEvent.getObject();
        object.setLoadAll(true);
        let txn = oEvent.getTxn();
        let qInstance = await txn.getQueryP('q_expense_perdiem_dcl2');
        qInstance.setLoadAll(true)
        await qInstance.executeP();

    }
}