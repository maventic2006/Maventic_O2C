import { KloTransaction } from "kloBo/KloTransaction";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_leave_category } from "o2c_v2/entity_gen/d_o2c_leave_category";
import { d_o2c_emp_leave_quota } from "o2c_v2/entity_gen/d_o2c_emp_leave_quota";

export class leavescheduler {
    public static async leaveschedular(event: EventContext) {
    //     //code here;
    //     //cd
    //     let txn: KloTransaction = event.getTxn();
    //     let earnerLeave =<KloEntitySet<d_o2c_leave_category>> await txn.getExecutedQuery('d_o2c_leave_category', { is_earned_leave: true,loadAll:true})
    //     console.log("monthly scheduler running...")
    //     for (let i = 0; i < earnerLeave.length; i++) {
    //         let quotaData = <KloEntitySet<d_o2c_emp_leave_quota>> await txn.getExecutedQuery('d_o2c_emp_leave_quota', { business_area: earnerLeave[i].business_area, leave_types: earnerLeave[i].leave_types,loadAll:true});
    //         for (let j = 0; j < quotaData.length; j++) {
    //             quotaData[j].no_of_days = parseFloat(quotaData[j].no_of_days) + parseFloat(earnerLeave[i].quota / 12)
    //             quotaData[j].earned_leave = parseFloat(quotaData[j].earned_leave) + parseFloat(earnerLeave[i].quota / 12)
    //             if (parseFloat(quotaData[j].extended) == 0) {
    //                 quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + parseFloat(earnerLeave[i].quota / 12)
    //             } else if (parseFloat(quotaData[j].extended) > 0) {
    //                 let tempextended = parseFloat(quotaData[j].extended)
    //                 quotaData[j].extended = parseFloat(quotaData[j].extended) - parseFloat(earnerLeave[i].quota / 12)
    //                 if (parseFloat(quotaData[j].extended) >= 0) {
    //                     quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + parseFloat(earnerLeave[i].quota / 12)
    //                 } else if (parseFloat(quotaData[j].extended) <= 0) {
    //                     quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + tempextended
    //                     quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + (parseFloat(quotaData[j].no_of_days) - parseFloat(quotaData[j].used_leave))
    //                     quotaData[j].extended = parseFloat("0")
    //                 }
    //             }
    //         }
    //     }
    //     await txn.commitP()
     }
}
