import { KloEntitySet } from "kloBo/KloEntitySet";
import { KloTransaction } from "kloBo/KloTransaction";
import { d_o2c_employee_designation } from "o2c_v2/entity/d_o2c_employee_designation";
import { d_o2c_designation_master } from "o2c_v2/entity_gen/d_o2c_designation_master";
export class leaveyearlyscheduler {
    public static async leaveyearlyschedular(event: EventContext) {
        console.log("yearly scheduler... op");
        let txn: KloTransaction = event.getTxn();
        let leaveCategory = await txn.getExecutedQuery('d_o2c_leave_category', {loadAll:true})
        let alligentLeave = 0;
        for (let i = 0; i < leaveCategory.length; i++) {
            if (leaveCategory[i].is_earned_leave == false && leaveCategory[i].leave_types != "Allegiant") {

                let quotaData  = await txn.getExecutedQuery('d_o2c_emp_leave_quota', { category_id: leaveCategory[i].category_id,loadAll:true});

                for (let j = 0; j < quotaData.length; j++) {
                    
                        let extendedLeave = parseFloat(quotaData[j].extended);
                        let remainingLeave = parseFloat(quotaData[j].unused_leave);
                        if (remainingLeave >= 0 && extendedLeave == 0) {
                            quotaData[j].carry_forward = parseFloat(remainingLeave);
                            quotaData[j].rem_carry_forward = parseFloat(remainingLeave);
                            quotaData[j].used_carry_forward = parseFloat("0");
                            quotaData[j].earned_leave = parseFloat("0");
                            quotaData[j].used_leave = parseFloat("0");
                            quotaData[j].extended = parseFloat("0");
                            if (leaveCategory[i].leave_types == "Casual") {
                                let joiningDate = await txn.getExecutedQuery('d_o2c_employee', { employee_id: quotaData[j].employee_id,loadAll:true});
                                let diffTime = Math.abs(new Date().getTime() - joiningDate[0].joining_date.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const exprience = Math.floor(days / 365);
                                let alligent = await txn.getExecutedQuery('d_o2c_leave_category', { company_code: leaveCategory[i].company_code,business_area: leaveCategory[i].business_area, leave_types: "Allegiant",loadAll:true});
                                if (exprience <= 3) {
                                    for (let k = 1; k < exprience; k++) {
                                        alligentLeave = alligentLeave + parseFloat(alligent[0].quota / 3);
                                    }
                                } else {
                                    alligentLeave = alligent[0].quota;
                                }
                                quotaData[j].allegiant_leave = parseFloat(alligentLeave);
                                quotaData[j].no_of_days = parseFloat(leaveCategory[i].quota) + parseFloat(remainingLeave) + parseFloat(alligentLeave);
                                quotaData[j].unused_leave = parseFloat(quotaData[j].no_of_days);
                                alligentLeave = 0;
                            } else if (leaveCategory[i].leave_types == "Exam") {
                                let emp_desigination_name;
                                let empData = await txn.getExecutedQuery('d_o2c_employee', { employee_id: quotaData[j].employee_id ,loadAll:true});
                    

                                let emp_desigination = <KloEntitySet<d_o2c_employee_designation>>await txn.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: quotaData[j].employee_id, fdate: new Date().getTime(), tdate: new Date().getTime() });
                                if(emp_desigination[0] != undefined){
                                emp_desigination_name = <KloEntitySet<d_o2c_designation_master>> await txn.getExecutedQuery('d_o2c_designation_master', { 'designation_id': emp_desigination[0].designation,loadAll:true});
                                }
                                if (emp_desigination[0] != undefined && (emp_desigination_name[0].name.toLocaleLowerCase() == leaveCategory[i].designation.toLocaleLowerCase()) && empData[0].is_fresher==true && empData[0].type == "T01") {
                                    quotaData[j].carry_forward = parseFloat("0");
                                    quotaData[j].rem_carry_forward = parseFloat("0")
                                    quotaData[j].used_carry_forward = parseFloat("0");
                                    quotaData[j].earned_leave = parseFloat("0");
                                    quotaData[j].used_leave = parseFloat("0");
                                    quotaData[j].extended = parseFloat("0");
                                    quotaData[j].no_of_days = parseFloat(leaveCategory[i].quota);
                                    quotaData[j].unused_leave = parseFloat(quotaData[j].no_of_days);
                                } else {
                                    
                                }
                            }
                            else {
                                quotaData[j].carry_forward = parseFloat("0");
                                quotaData[j].rem_carry_forward = parseFloat("0")
                                quotaData[j].used_carry_forward = parseFloat("0");
                                quotaData[j].earned_leave = parseFloat("0");
                                quotaData[j].used_leave = parseFloat("0");
                                quotaData[j].extended = parseFloat("0");
                                quotaData[j].no_of_days = parseFloat(leaveCategory[i].quota);
                                quotaData[j].unused_leave = parseFloat(quotaData[j].no_of_days);
                                alligentLeave = 0;
                            }
                            alligentLeave = 0;

                        } else if (extendedLeave > 0) {
                            if (leaveCategory[i].leave_types == "Casual") {
                                let joiningDate = await txn.getExecutedQuery('d_o2c_employee', { employee_id: quotaData[j].employee_id ,loadAll:true});
                                let diffTime = Math.abs(new Date().getTime() - joiningDate[0].joining_date.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const exprience = Math.floor(days / 365);
                                let alligent = await txn.getExecutedQuery('d_o2c_leave_category', { company_code: leaveCategory[i].company_code, business_area: leaveCategory[i].business_area, leave_types: "Allegiant" ,loadAll:true});
                                if (exprience <= 3) {
                                    for (let k = 1; k < exprience; k++) {
                                        alligentLeave = alligentLeave + parseFloat(alligent[0].quota / 3);
                                    }
                                } else {
                                    alligentLeave = alligent[0].quota;
                                }
                            }
                            quotaData[j].no_of_days = parseFloat(leaveCategory[i].quota) + parseFloat(alligentLeave);
                            alligentLeave = 0;
                            if (parseFloat(quotaData[j].no_of_days) >= extendedLeave && leaveCategory[i].leave_types != "Exam") {
                                quotaData[j].carry_forward = parseFloat("0");
                                quotaData[j].rem_carry_forward = parseFloat("0")
                                quotaData[j].used_carry_forward = parseFloat("0");
                                quotaData[j].earned_leave = parseFloat("0");
                                quotaData[j].used_leave = parseFloat(extendedLeave);
                                quotaData[j].unused_leave = parseFloat(quotaData[j].no_of_days) - parseFloat(extendedLeave);
                                quotaData[j].extended = parseFloat("0");
                            }
                            else if (parseFloat(quotaData[j].no_of_days) < extendedLeave && leaveCategory[i].leave_types != "Exam") {
                                quotaData[j].carry_forward = parseFloat("0");
                                quotaData[j].rem_carry_forward = parseFloat("0")
                                quotaData[j].used_carry_forward = parseFloat("0");
                                quotaData[j].earned_leave = parseFloat("0");
                                quotaData[j].used_leave = parseFloat(quotaData[j].no_of_days);
                                quotaData[j].unused_leave = parseFloat("0");
                                quotaData[j].extended = parseFloat(quotaData[j].extended) - parseFloat(quotaData[j].no_of_days);
                            }
                            else if (leaveCategory[i].leave_types == "Exam") {
                                let emp_desigination_name;
                                let empData = await txn.getExecutedQuery('d_o2c_employee', { employee_id: quotaData[j].employee_id ,loadAll:true});

                                let emp_desigination = <KloEntitySet<d_o2c_employee_designation>>await txn.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: quotaData[j].employee_id, fdate: new Date().getTime(), tdate: new Date().getTime()});
                                if(emp_desigination[0] != undefined){
                                emp_desigination_name = <KloEntitySet<d_o2c_designation_master>> await txn.getExecutedQuery('d_o2c_designation_master', { 'designation_id': emp_desigination[0].designation,loadAll:true});
                                }
                                if (emp_desigination[0] != undefined && (emp_desigination_name[0].name.toLocaleLowerCase() == leaveCategory[i].designation.toLocaleLowerCase()) && empData[0].is_fresher==true && empData[0].type == "T01") {
                                    if (parseFloat(quotaData[j].no_of_days) >= extendedLeave) {
                                        quotaData[j].carry_forward = parseFloat("0");
                                        quotaData[j].rem_carry_forward = parseFloat("0")
                                        quotaData[j].used_carry_forward = parseFloat("0");
                                        quotaData[j].earned_leave = parseFloat("0");
                                        quotaData[j].used_leave = parseFloat(extendedLeave);
                                        quotaData[j].unused_leave = parseFloat(quotaData[j].no_of_days) - parseFloat(extendedLeave);
                                        quotaData[j].extended = parseFloat("0");
                                    }
                                    else if (parseFloat(quotaData[j].no_of_days) < extendedLeave) {
                                        quotaData[j].carry_forward = parseFloat("0");
                                        quotaData[j].rem_carry_forward = parseFloat("0")
                                        quotaData[j].used_carry_forward = parseFloat("0");
                                        quotaData[j].earned_leave = parseFloat("0");
                                        quotaData[j].used_leave = parseFloat(quotaData[j].no_of_days);
                                        quotaData[j].unused_leave = parseFloat("0");
                                        quotaData[j].extended = parseFloat(quotaData[j].extended) - parseFloat(quotaData[j].no_of_days);
                                    }
                                } else {
                                   
                                }
                            }
                        }
                }
            }
        }
        await txn.commitP()
    }
}