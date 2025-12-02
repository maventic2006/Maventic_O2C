import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_employee_designation as d_o2c_employee_designation_gen} from "o2c_v2/entity_gen/d_o2c_employee_designation";
export class d_o2c_employee_designation extends d_o2c_employee_designation_gen
{
    public async OnValidate(){
        let role = (await this.txn.get$Role()).role_id;
        // let errors: ValidationError[] = await super.OnValidate();
        if (!this.designation && (role === "HR" || role === "MANAGER")) {
            this.errors.push(new ValidationError(this, "designation", "101", "Designation is missing."));
        }
        if (!this.from_date && (role === "HR" || role === "MANAGER")) {
            this.errors.push(new ValidationError(this, "from_date", "102", "From Date is missing."));
        }
        if (!this.to_date && (role === "HR" || role === "MANAGER")) {
            this.errors.push(new ValidationError(this, "to_date", "103", "To Date is missing."));
        }
        if (!this.status && (role === "HR" || role === "MANAGER")){
            this.errors.push(new ValidationError(this, "status", "104", "Designation status is missing."));
        }
        // return errors;
    }
    //
}