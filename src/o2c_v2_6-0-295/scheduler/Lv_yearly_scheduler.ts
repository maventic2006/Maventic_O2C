import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloEntitySet } from 'kloBo/KloEntitySet'
import { KloTransaction } from 'kloBo/KloTransaction'
import { d_o2c_leave_category } from 'o2c_v2/entity_gen/d_o2c_leave_category'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee'
import { d_o2c_emp_leave_quota } from 'o2c_v2/entity_gen/d_o2c_emp_leave_quota'

export class Lv_yearly_scheduler extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let txn: KloTransaction = this.eventContext.getTxn()
                let leaveType = ["Casual", "Sick"]
                let alligentLeave = 0, qtaData, empData;
                let previous_year = this.getPreviousYearDates();

                let leaveCategory = <KloEntitySet<d_o2c_leave_category>>await txn.getExecutedQuery('q_category_yearly_sch', { loadAll: true })

                let employeeData = <KloEntitySet<d_o2c_employee>>await txn.getExecutedQuery('d_o2c_employee', { loadAll: true });

                let quotaData = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('q_quota_yearly_sch', { loadAll: true, s_date: previous_year.startDate.getTime(), e_date: previous_year.endDate.getTime() });


                for (let i = 0; i < leaveCategory.length; i++) {

                    if (leaveCategory[i].leave_types != "Allegiant") {

                        qtaData = quotaData.filter((item) => (item.category_id == leaveCategory[i].category_id));

                        for (let j = 0; j < qtaData.length; j++) {
                            empData = employeeData.filter((item) => (item.employee_id.toLowerCase() == qtaData[j].employee_id.toLowerCase()));
                            if (empData.length && empData[0].s_status == "Approved") {
                                let newQuota = await txn.createEntityP('d_o2c_emp_leave_quota', {
                                    s_object_type: -1,
                                    valid_to: new Date(new Date().getFullYear(), 11, 31),
                                    valid_from: new Date(new Date().getFullYear(), 0, 1),
                                    used_leave: parseFloat("0"),
                                    unused_leave: parseFloat(leaveCategory[i].quota),
                                    seq_id: qtaData[j].employee_id,
                                    no_of_days: parseFloat(leaveCategory[i].quota),
                                    lmi: qtaData[j].lmi,
                                    employee_id: qtaData[j].employee_id,
                                    company_code: leaveCategory[i].company_code,
                                    category_id: leaveCategory[i].category_id,
                                    business_area: leaveCategory[i].business_area,
                                    category_description: leaveCategory[i].category_description,
                                    leave_types: leaveCategory[i].leave_types,
                                    extended: parseFloat("0"),
                                    requested_leave: parseFloat("0"),
                                    allegiant_leave: alligentLeave,
                                    earned_leave: parseFloat("0"),
                                    carry_forward: parseFloat("0"),
                                    rem_carry_forward: parseFloat("0"),
                                    used_carry_forward: parseFloat("0"),
                                    assign_quota: parseFloat(leaveCategory[i].quota)
                                });

                                //Calculate Allegiant Leave
                                if (leaveCategory[i].leave_types == "Casual") {

                                    newQuota.carry_forward = parseFloat(parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave) > 0 ? (parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave)) : "0");
                                    newQuota.rem_carry_forward = parseFloat(parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave) > 0 ? (parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave)) : "0");
                                    newQuota.used_carry_forward = parseFloat("0");
                                    newQuota.carry_forward_till = new Date(new Date().getFullYear(), 2, 31)
                                    //let joiningDate = employeeData.filter((item) => (item.employee_id.toLocaleLowerCase() == qtaData[j].employee_id.toLowerCase()));

                                    let diffTime = Math.abs(new Date().getTime() - empData[0].joining_date.getTime());
                                    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    const exprience = Math.floor(days / 365);


                                    let alligent = leaveCategory.filter((item) => (item.company_code.toLowerCase() == leaveCategory[i].company_code.toLowerCase() && item.business_area.toLowerCase() == leaveCategory[i].business_area.toLowerCase() && item.leave_types == "Allegiant"));

                                    if (exprience <= 3) {
                                        for (let k = 1; k < exprience; k++) {
                                            alligentLeave = alligentLeave + parseFloat(alligent[0].quota / 3);
                                        }
                                    } else {
                                        alligentLeave = alligent[0].quota;
                                    }

                                    newQuota.allegiant_leave = parseFloat(alligentLeave);
                                    newQuota.no_of_days = parseFloat(leaveCategory[i].quota) + parseFloat(alligentLeave);
                                    newQuota.unused_leave = parseFloat(newQuota.no_of_days);
                                    alligentLeave = 0;
                                }

                            }
                        }

                    }

                }

                await txn.commitP();

                res('leave Yearly scheduler' + new Date().toLocaleString())
            }, 30000)
        })
    }

    public getPreviousYearDates() {
        // Get the current date
        const currentDate = new Date();

        // Get the previous year
        const previousYear = currentDate.getFullYear() - 1;

        // Start date (January 1st of the previous year)
        const startDate = new Date(previousYear, 0, 1);

        // End date (December 31st of the previous year)
        const endDate = new Date(previousYear, 11, 31);

        return {
            startDate: startDate,
            endDate: endDate
        };
    }
}