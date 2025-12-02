import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_salary as d_o2c_salary_gen} from "o2c_v2/entity_gen/d_o2c_salary";
export class d_o2c_salary extends d_o2c_salary_gen
{
    public async OnValidate() {
        let role = (await this.txn.get$Role()).role_id;
        if (!this.start_date && (role == "HR" || role == "LEGAL")) {
            this.errors.push(new ValidationError(this, "start_date", "101", "Start date is missing."));
        }
        if (!this.end_date && (role == "HR" || role == "LEAGL")) {
            this.errors.push(new ValidationError(this, "end_date", "102", "End Date is missing."));
        }
        if (!this.amount && (role == "HR" || role == "LEGAL")) {
            this.errors.push(new ValidationError(this, "amount", "103", "Amount is missing."));
        }
        // if (!this.is_deduction && (role == "HR" || role == "LEGAL")){
        //     this.errors.push(new ValidationError(this, "is_deduction", "104", "Is Deduction is missing."));
        // }
       
    }
}