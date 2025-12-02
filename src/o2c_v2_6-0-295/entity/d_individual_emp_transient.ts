import { EventContext } from "kloBo_7-2-115";
import { KloEntitySet } from "kloBo_7-2-115/KloEntitySet";
import { d_individual_emp_transient as d_individual_emp_transient_gen } from "o2c_v2/entity_gen/d_individual_emp_transient"
import { d_o2c_emp_pa_planning_hdr } from "o2c_v2/entity_gen/d_o2c_emp_pa_planning_hdr";
export class d_individual_emp_transient extends d_individual_emp_transient_gen {
    //Old table
    // public async employeePlanningHdrUpdate(oEvent: EventContext) {

    //     debugger;
    //     let transientData = <d_individual_emp_transient>oEvent.getObject();
    //     let actualData = await this.txn.getExecutedQuery("d_o2c_emp_pa_planning_hdr", { 'hdr_pa_req_id': transientData.hdr_pa_req_id/*,"skipMap": true*/,loadAll: true,expandAll:"r_emp_pa_planning_hdr_item" });
    //     if (transientData.stage == "Proposed") {
    //         actualData[0].total_cost_new = transientData.total_cost;
    //         actualData[0].ctc_new = transientData.ctc;
    //         actualData[0].fixed_new = transientData.fixed;
    //         const bonusMap = [
    //             { id: "B11", key: "performance_bonus" },
    //             { id: "B12", key: "retention_bonus" },
    //             { id: "B13", key: "company_bonus" }
    //         ];
    //         let empPlanningItmData=await actualData[0].r_emp_pa_planning_hdr_item;
    //         bonusMap.forEach(({ id, key }) => {
    //             const bonusItem = empPlanningItmData?.find(item => item.benefit_id === id);
    //             if (bonusItem) {
    //                 bonusItem.planned_amount_new = transientData[key];
    //             }
    //         });
    //         console.log("update is calling");
    //         console.log(transientData);
    //         console.log(actualData);
    //     }
    //     actualData[0].employee_designation_new = transientData.to_be_designation;
    //     actualData[0].approval_cycle = transientData.approval_cycle;
    //     actualData[0].s_status = transientData.s_status;

    // }
    public async employeePlanningHdrUpdate(oEvent: EventContext) {

        debugger;
        let transientData = <d_individual_emp_transient>oEvent.getObject();
        let actualData = await this.txn.getExecutedQuery("d_pa_ind_emp_planning_hdr", { 'hdr_pa_req_id': transientData.hdr_pa_req_id/*,"skipMap": true*/, loadAll: true, expandAll: "r_pa_emp_ind_hdr_itm" });
        if (transientData.stage == "Proposed") {
            actualData[0].total_cost_new = transientData.total_cost;
            actualData[0].ctc_new = transientData.ctc;
            actualData[0].fixed_new = transientData.fixed;
            const bonusMap = [
                {
                    id: "B11",
                    key: "performance_bonus",
                    startDateKey: "pb_start_date",
                    endDateKey: "pb_end_date"
                },
                {
                    id: "B12",
                    key: "retention_bonus",
                    startDateKey: "rb_start_date",
                    endDateKey: "rb_end_date"
                },
                {
                    id: "B13",
                    key: "company_bonus",
                    startDateKey: "cb_start_date",
                    endDateKey: "cb_end_date"
                }
            ];
            let empPlanningItmData = await actualData[0].r_pa_emp_ind_hdr_itm;
            bonusMap.forEach(({ id, key, startDateKey, endDateKey }) => {
                const bonusItem = empPlanningItmData?.find(item => item.benefit_id === id);
                if (bonusItem) {
                    bonusItem.planned_amount_new = transientData[key];
                    bonusItem.start_date = transientData[startDateKey];
                    bonusItem.end_date = transientData[endDateKey];
                }
            });
            console.log("update is calling");
            console.log(transientData);
            console.log(actualData);
        }

        if (transientData.stage == "Current") {
            actualData[0].employee_designation_new = transientData.to_be_designation;
            actualData[0].remark = transientData.remarks;
            //new code
            actualData[0].from_date = transientData.pa_effective_from_date;
            actualData[0].to_date = transientData.pa_effective_to_date;
        }

        actualData[0].approval_cycle = transientData.approval_cycle;
        actualData[0].s_status = transientData.s_status;
        actualData[0].warning_flag = transientData.warning_flag;
    }
}