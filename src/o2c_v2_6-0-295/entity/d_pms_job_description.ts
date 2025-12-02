import { d_pms_job_description as d_pms_job_description_gen } from "o2c_v2/entity_gen/d_pms_job_description";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_job_description extends d_pms_job_description_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (this.status !== "2") {
			if (!this.valid_from) this.errors.push(new ValidationError(this, "valid_from", "11", "Value required!!", ErrorType.ERROR));
			if (!this.valid_to) this.errors.push(new ValidationError(this, "valid_to", "11", "Value required!!", ErrorType.ERROR));
		} else {
			if (this.valid_from > this.valid_to) this.errors.push(new ValidationError(this, "valid_from", "11", "Start Date should not be greater than End Date", ErrorType.ERROR));
		}
		return this.errors;
	}
}
