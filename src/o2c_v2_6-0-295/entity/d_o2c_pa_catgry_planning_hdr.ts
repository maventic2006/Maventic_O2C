import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_pa_catgry_planning_hdr as d_o2c_pa_catgry_planning_hdr_gen} from "o2c_v2/entity_gen/d_o2c_pa_catgry_planning_hdr"
export class d_o2c_pa_catgry_planning_hdr extends d_o2c_pa_catgry_planning_hdr_gen{


    public async OnValidate(){
        debugger
        let pendingGrading = await this.txn.getExecutedQuery("d_o2c_pa_cycle_id_lm",{pa_cycle_id:this.pa_cycle_id, s_status:"Save As Draft" }); 
        if (pendingGrading.length && this.action_status != "Save As Draft" && this.action_status != "New") {
           
            this.errors.push(new ValidationError(this, null, "1","🥵 Grading has not yet been completed. Please check the grading status periodically for updates."))
        }
        // if(!this.per_bns_start_date){
        //     this.errors.push(new ValidationError(this, "fixed_value", "2", "Performance Bonus Start Date Should Not Be Null"))
        // }
        // if(!this.per_bns_end_date){
        //     this.errors.push(new ValidationError(this, "fixed_value", "2", "Performance Bonus End Date Should Not Be Null"))
        // }

     
    }
    
}