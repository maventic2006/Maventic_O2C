import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloEntitySet } from 'kloBo_6-0/KloEntitySet'
import { KloTransaction } from 'kloBo_6-0/KloTransaction'
import { d_o2c_emp_leave_quota } from 'o2c_base/entity_gen/d_o2c_emp_leave_quota'
import { d_o2c_leave_category } from 'o2c_base/entity_gen/d_o2c_leave_category'
export class Lv_monthly_sch extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let txn: KloTransaction = this.eventContext.getTxn()
                let earnerLeave = <KloEntitySet<d_o2c_leave_category>>await txn.getExecutedQuery('d_o2c_leave_category', { is_earned_leave: true,loadAll:true})
                for (let i = 0; i < earnerLeave.length; i++) {
                    let quotaData = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('d_o2c_emp_leave_quota', { company_code: earnerLeave[i].company_code, business_area: earnerLeave[i].business_area, leave_types: earnerLeave[i].leave_types,valid_to:new Date(new Date().getFullYear(),11,31).setHours(0,0,0,0),loadAll:true});
                    for (let j = 0; j < quotaData.length; j++) {
                        quotaData[j].no_of_days = parseFloat(quotaData[j].no_of_days) + parseFloat(earnerLeave[i].quota / 12)
                        quotaData[j].earned_leave = parseFloat(quotaData[j].earned_leave) + parseFloat(earnerLeave[i].quota / 12)
                        if (parseFloat(quotaData[j].extended) == 0) {
                            quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + parseFloat(earnerLeave[i].quota / 12)
                        } else if (parseFloat(quotaData[j].extended) > 0) {
                            let tempextended = parseFloat(quotaData[j].extended)
                            quotaData[j].extended = parseFloat(quotaData[j].extended) - parseFloat(earnerLeave[i].quota / 12)
                            if (parseFloat(quotaData[j].extended) >= 0) {
                                quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + parseFloat(earnerLeave[i].quota / 12)
                            } else if (parseFloat(quotaData[j].extended) <= 0) {
                                quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + tempextended
                                quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + (parseFloat(quotaData[j].no_of_days) - parseFloat(quotaData[j].used_leave))
                                quotaData[j].extended = parseFloat("0")
                            }
                        }
                    }
                }
                await txn.commitP()
                 res('monthly scheduler' + new Date().toLocaleString())
            }, 30000)
        })
    }
}