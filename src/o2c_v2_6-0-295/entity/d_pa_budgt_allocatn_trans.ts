import { EventContext } from "kloBo_7-2-216/EventContext";
import { d_pa_budgt_allocatn_trans as d_pa_budgt_allocatn_trans_gen } from "o2c_v2/entity_gen/d_pa_budgt_allocatn_trans"
export class d_pa_budgt_allocatn_trans extends d_pa_budgt_allocatn_trans_gen {
    public async onBudgetUpdate(oEvent: EventContext) {

        debugger;
        let transientData = <d_pa_budgt_allocatn_trans>oEvent.getObject();
        if (transientData.my_key) {
            let actualData = await this.txn.getExecutedQuery("d_o2c_pa_cycle_id_lm_budget", { 'my_key': transientData.my_key,skipMap:true,loadAll:true});
            actualData[0].allocated_percen = transientData.allocated_percentage;
            actualData[0].allotted_budget = transientData.allocated_amount;
            actualData[0].prev_year_total_cost = transientData.prev_year_total_cost;
            actualData[0].no_of_employee = transientData.no_of_employee;
            actualData[0].unulilised_budget =  actualData[0].unulilised_budget?actualData[0].unulilised_budget:transientData.allocated_amount;
            actualData[0].comment = transientData.comment;
        }
        else {
            await this.txn.createEntityP("d_o2c_pa_cycle_id_lm_budget", { pa_cycle_id: transientData.pa_cycle_id, line_manager_id: transientData.line_manager_id, allotted_budget: transientData.allocated_amount, unulilised_budget: transientData.allocated_amount, previous_year_total_cost: transientData.prev_year_total_cost, no_of_employee: transientData.no_of_employee, allocated_percen: transientData.allocated_percentage,comment:transientData.comment});
        }
    }
}