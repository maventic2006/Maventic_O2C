import { KloTransaction } from "kloBo/KloTransaction";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_emp_leave_quota } from "o2c_v2/entity_gen/d_o2c_emp_leave_quota";

export class leaveschedulermarch {
    // public static async leaveschedularmarch(event: EventContext) {
    //     console.log("march scheduler")
    //     let txn: KloTransaction = event.getTxn();
    //     let data = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('d_o2c_emp_leave_quota', {loadAll:true});
    //     for(let i = 0;i<data.length;i++){
    //         if(data[i].rem_carry_forward > 0){
    //             if(data[i].employee_id == "MM07"){
    //             data[i].no_of_days = parseFloat(data[i].no_of_days) - parseFloat(data[i].rem_carry_forward);
    //             data[i].rem_carry_forward = 0;
    //             }
    //         }
    //     }
    //     await txn.commitP();
    // }
}