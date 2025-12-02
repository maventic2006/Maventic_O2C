import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloEntitySet } from 'kloBo/KloEntitySet'
import { KloTransaction } from 'kloBo/KloTransaction'
import { d_o2c_emp_leave_quota } from 'o2c_base/entity_gen/d_o2c_emp_leave_quota'
export class Lv_march_sch extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                // let txn: KloTransaction = this.eventContext.getTxn()
                // txn.info("Carry Forward leave is deactivated.");
                // let data = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('d_o2c_emp_leave_quota', {loadAll:true});
                // for (let i = 0; i < data.length; i++) {
                //     if (data[i].rem_carry_forward > 0) {
                       
                //             data[i].no_of_days = parseFloat(data[i].no_of_days) - parseFloat(data[i].rem_carry_forward);
                //             data[i].unused_leave = parseFloat(data[i].unused_leave) - parseFloat(data[i].rem_carry_forward)
                //             data[i].rem_carry_forward = 0;
                        
                //     }
                // }
                // await txn.commitP();
                // res('marchh scheduleerrr' + data)
            }, 30000)
        })
    }
}