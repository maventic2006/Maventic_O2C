import {d_o2c_employee_history as d_o2c_employee_history_gen} from "o2c_v2/entity_gen/d_o2c_employee_history";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
export class d_o2c_employee_history extends d_o2c_employee_history_gen
{
    // maintaining Idseries
    public async onCreateEntity(oEvent) {
        let newid = <d_o2c_employee_history>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        let employeeid = await idquery.executeP();
        let id = <d_idseries>(await employeeid.newEntityP(0, { s_object_type: 'history_id' }, null));
        newid.history_id = id.a_id;
    }
    public async OnValidate() {
        let role = (await this.txn.get$Role()).role_id;
        let emp_detail = await this.txn.getExecutedQuery("d_o2c_employee",{employee_id:this.employee_id,loadAll:true});
        // let errors: ValidationError[] = await super.OnValidate();
        if (!this.is_bg_check_done && role === "LEGAL") {
            this.errors.push(new ValidationError(this, "is_bg_check_done", "101", "Is Background Verification Done is missing."));
        }
        if (!this.bg_check_remark && role === "LEGAL") {
            this.errors.push(new ValidationError(this, "bg_check_remark", "102", "Background Check Remark is missing."));
        }
        if (!this.bg_check_report && role === "LEGAL") {
            this.errors.push(new ValidationError(this, "bg_check_report", "103", "BG Check Report is missing."));
        }
        if(emp_detail[0].joining_date < this.from_date && emp_detail[0].status != "Draft"){
            this.errors.push(new ValidationError(this,"from_date","105","From Date should be less than Joining Date"));
        }
        // return errors;
    }
}