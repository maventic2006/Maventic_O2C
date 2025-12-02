import { EventContext } from "kloBo_7-2-216/EventContext";
import { KloEntitySet } from "kloBo_7-2-216/KloEntitySet";
import { d_o2c_employee_benefitconfig } from "o2c_v2/entity_gen/d_o2c_employee_benefitconfig";
import { d_o2c_pa_grading_transient as d_o2c_pa_grading_transient_gen } from "o2c_v2/entity_gen/d_o2c_pa_grading_transient"
import { d_pa_ind_emp_planning_hdr } from "o2c_v2/entity_gen/d_pa_ind_emp_planning_hdr";
import { q_o2c_employee_salary_hdr } from "o2c_v2/query_gen/q_o2c_employee_salary_hdr";
import { paFinancialYear } from "o2c_v2/util/paFinancialYear";
export class d_o2c_pa_grading_transient extends d_o2c_pa_grading_transient_gen {
    public async updateGradingData(oEvent: EventContext) {
        let fromDate, toDate, prevPADate, newPADate, totalCostPrev, ctcPrev, fixedPrev, bonusTableData;
        let transientData = <d_o2c_pa_grading_transient>oEvent.getObject();
        let allBenefit = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.txn.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true, company_code: transientData.company_code_search, business_area: transientData.business_area, profit_center: transientData.profit_center_search });
        let paCycleData = await this.txn.getExecutedQuery("d_o2c_emp_pa_cycle", { loadAll: true, company_code: transientData.company_code_search, business_area: transientData.business_area_search, profit_center: transientData.profit_center_search });
        let currentPaCycleData = paCycleData.filter((item) => item.fiscal_year == transientData.fyear_search);

        // Define benefit mappings
        let benefitMap = [
            { id: "B11" },
            { id: "B12" },
            { id: "B13" }
        ];
        if (transientData.hdr_pa_req_id) {
            let actualData = await currentPaCycleData[0].r_pa_emp_planning_hdr.find((item) => item.hdr_pa_req_id == transientData.hdr_pa_req_id));
            actualData.pa_category_id = transientData.category;
            actualData.employee_type = transientData.employee_type;
            actualData.pa_exp = transientData.pa_exp;
        }
        else {
            let previousStartYear = new Date().getFullYear() - 1;
            let previousEndYear = new Date().getFullYear();
            let prevPaCycleData = paCycleData.filter((item) => item.fiscal_year == previousStartYear + "-" + previousEndYear);
            let prevEmployeePAData = await prevPaCycleData[0]?.r_pa_emp_planning_hdr.filter((item) => item.employee_id == transientData.employee_id)
            let empSalaryData;
            empSalaryData = await this.txn.getExecutedQuery('q_o2c_employee_salary_hdr', { loadAll: true, employee_id: transientData.employee_id, expandAll: 'r_salary_hdr_items' });
            const monthName = empSalaryData?.[0]?.to_date
                ? new Date(new Date(empSalaryData[0].to_date).setDate(new Date(empSalaryData[0].to_date).getDate() + 1))
                    .toLocaleString("default", { month: "long" })
                : "";
            if (prevEmployeePAData) {
                fromDate = new Date(prevEmployeePAData[0].to_date);
                new Date(fromDate.setDate(fromDate.getDate() + 1));
                toDate = new Date((prevEmployeePAData[0].to_date).setFullYear((prevEmployeePAData[0].to_date).getFullYear() + 1));
                prevPADate = new Date(prevEmployeePAData[0].from_date);
                totalCostPrev = prevEmployeePAData[0].total_cost_new;
                ctcPrev = prevEmployeePAData[0].ctc_new;
                fixedPrev = prevEmployeePAData[0].fixed_prev;

            }
            else {
                fromDate = new Date((transientData.confirmation_date).setFullYear((transientData.confirmation_date).getFullYear() + 1))
                toDate = new Date(fromDate.setFullYear(fromDate.getFullYear() + 1));
                prevPADate = new Date(transientData.confirmation_date);
                totalCostPrev = empSalaryData?.[0]?.total_cost;
                ctcPrev = empSalaryData?.[0]?.ctc;
                fixedPrev = empSalaryData?.[0]?.fixed;
                //bonus
                bonusTableData = await empSalaryData[0]?.r_salary_hdr_items;
            }
            //Date
            newPADate = fromDate;
            let deltaMonth = (
                (new Date(newPADate).getFullYear() - new Date(prevPADate).getFullYear()) * 12 +
                (new Date(newPADate).getMonth() - new Date(prevPADate).getMonth())
            );

            let empPlanningHdr = await this.txn.createEntityP("d_pa_ind_emp_planning_hdr", { pa_cycle_id: currentPaCycleData[0].pa_cycle_id, employee_id: transientData.employee_id, approval_cycle: 0, pa_category_id: transientData.category, employee_type: transientData.employee_type, pa_exp: transientData.pa_exp, from_date: fromDate, to_date: toDate, employee_designation_prev: transientData.designation, line_manager_id: transientData.line_manager, pa_month: monthName, prev_pa_date: prevPADate, new_pa_date: newPADate, delta_month: deltaMonth, total_cost_prev: totalCostPrev, total_cost_new: 0, ctc_prev: ctcPrev, ctc_new: 0, fixed_prev: fixedPrev, fixed_new: 0, s_status: "Pending" });
            transientData.hdr_pa_req_id = empPlanningHdr.hdr_pa_req_id;

            // Loop through each bonus type and process if the benefit exists
            for (let benefit of benefitMap) {
                let matchedBenefit = allBenefit.find(item => item.benefit === benefit.id);
                let perviousBonusData = bonusTableData?.filter((item) => item.benefit_id == matchedBenefit?.benefit)
                await empPlanningHdr.r_pa_emp_ind_hdr_itm.newEntityP(0, {
                    benefit_id: matchedBenefit?.benefit,
                    planned_amount_prev: perviousBonusData?.[0]?.planned_amount,
                    disbursed_amount_prev: perviousBonusData?.[0]?.actual_amount,
                    planned_amount_new: 0,
                    pa_cycle_id: currentPaCycleData[0].pa_cycle_id,
                    currency: perviousBonusData?.[0]?.currency,
                    start_date: perviousBonusData?.[0]?.start_date,
                    end_date: perviousBonusData?.[0]?.end_date
                });
            }

        }


    }
}
//8 Sep