import { d_pms_appraisal_cycle as d_pms_appraisal_cycle_gen } from "o2c_v2/entity_gen/d_pms_appraisal_cycle";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_appraisal_cycle extends d_pms_appraisal_cycle_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (!this.appraisal_year) {
			this.errors.push(new ValidationError(this, "appraisal_year", "11", "Value required !!", ErrorType.ERROR));
		}
		if (!this.from_date) {
			this.errors.push(new ValidationError(this, "from_date", "11", "Value required !!", ErrorType.ERROR));
		}
		if (!this.to_date) {
			this.errors.push(new ValidationError(this, "to_date", "11", "Value required !!", ErrorType.ERROR));
		}
		if (this.from_date && this.appraisal_year && this.appraisal_year !== this.from_date.getFullYear().toString()) {
			this.errors.push(new ValidationError(this, "from_date", "11", "The 'from' date must fall within the current year.", ErrorType.ERROR));
		}
		return this.errors;
	}
}
