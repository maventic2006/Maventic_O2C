import { d_pms_annual_per_employees as d_pms_annual_per_employees_gen } from "o2c_v2/entity_gen/d_pms_annual_per_employees";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_annual_per_employees extends d_pms_annual_per_employees_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (this.included == "false") {
			if (!this.exclusion_reason) this.errors.push(new ValidationError(this, "exclusion_reason", "11", "Value required!!", ErrorType.ERROR));
		}
		return this.errors;
	}
}
