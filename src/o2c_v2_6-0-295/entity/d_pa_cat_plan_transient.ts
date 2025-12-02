import { KloEntitySet } from "kloBo/KloEntitySet";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { EventContext } from "kloBo_7-2-136";
import { d_o2c_emp_pa_cycle } from "o2c_v2/entity_gen/d_o2c_emp_pa_cycle";
import { d_o2c_pa_catgry_planning_hdr } from "o2c_v2/entity_gen/d_o2c_pa_catgry_planning_hdr";
import { d_o2c_pa_catgry_planning_itm } from "o2c_v2/entity_gen/d_o2c_pa_catgry_planning_itm";
import { d_pa_cat_plan_transient as d_pa_cat_plan_transient_gen } from "o2c_v2/entity_gen/d_pa_cat_plan_transient"
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_pa_cat_plan_transient extends d_pa_cat_plan_transient_gen {

    // public async OnValidate(){
    //     debugger
    //     let pendingGrading = await this.txn.getExecutedQuery("d_o2c_pa_cycle_id_lm",{pa_cycle_id:this.pa_cycle_id, s_status:"Save As Draft" }); 
    //     if (pendingGrading.length) {
           
    //         this.errors.push(new ValidationError(this, null, "1", "Grading is still in progress. Please check the grading status for updates."))
    //     }
    //     // if(!this.per_bns_start_date){
    //     //     this.errors.push(new ValidationError(this, "fixed_value", "2", "Performance Bonus Start Date Should Not Be Null"))
    //     // }
    //     // if(!this.per_bns_end_date){
    //     //     this.errors.push(new ValidationError(this, "fixed_value", "2", "Performance Bonus End Date Should Not Be Null"))
    //     // }

     
    // }

    public async catPlanUpdate(oEvent: EventContext) {
        debugger;

        //new code
        let oData = await this.txn.getExecutedQuery("q_pa_cat_plan_transient", {loadAll: true });
        let transientData = <d_pa_cat_plan_transient>oEvent.getObject();

        let actualData = <KloEntitySet<d_o2c_pa_catgry_planning_itm>>await this.txn.getExecutedQuery("d_o2c_pa_catgry_planning_itm", { "category_pl_req_id": transientData.category_pl_req_id, "category_planing_guid": transientData.cat_tr_guid,loadAll: true });

        if (transientData.cat_tr_guid) {

            let benefitDetails = await actualData[0].r_category_benefit_detail.fetch();

            actualData[0].fixed_value = transientData.fixed_value;
            actualData[0].remarks = transientData.remarks;
            actualData[0].ctc_value = transientData.ctc_value;
            actualData[0].max_total_value = transientData.max_total_value;

            for (let k = 0; k < benefitDetails.length; k++) {
                const benefitData = benefitDetails[k];

                switch (benefitData.benefit_id) {

                    case "B11":

                        benefitData.bonus_amount = transientData.performance_bonus;
                        benefitData.bonus_perc = transientData.performance_bonus_per;
                        if (transientData.per_bns_start_date){
                            benefitData.start_date = new Date(transientData.per_bns_start_date)

                        }
                        if (transientData.per_bns_end_date){
                            benefitData.end_date = new Date(transientData.per_bns_end_date)

                        }
                        break;

                    case "B13":

                        benefitData.bonus_amount = transientData.company_bonus;
                        benefitData.bonus_perc = transientData.company_bonus_per;
                        if (transientData.cmp_bns_start_date){
                            benefitData.start_date = new Date(transientData.cmp_bns_start_date);

                        }
                        if (transientData.cmp_bns_end_date){
                            benefitData.end_date = new Date(transientData.cmp_bns_end_date);

                        }
                        break;

                    case "B12":

                        benefitData.bonus_amount = transientData.retention_bonus;
                        benefitData.bonus_perc = transientData.retention_bonus_per;
                        if (transientData.ret_bns_start_date){
                            benefitData.start_date = new Date(transientData.ret_bns_start_date);

                        }
                        if (transientData.ret_bns_end_date){
                            benefitData.end_date = new Date(transientData.ret_bns_end_date);

                        }
                        break;

                    default:
                        break;
                }
            }
        }
        
    

    }
    //Albia coding --->Not to store 0 value
    public async OnValidate(): Promise<any> {
        let a= this.getJSON(false);
        let oData = await this.txn.getExecutedQuery("q_pa_cat_plan_transient", {loadAll: true });
    }

}