import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
import { d_pms_appraisal_quarter as d_pms_appraisal_quarter_gen } from "o2c_v2/entity_gen/d_pms_appraisal_quarter";
export class d_pms_appraisal_quarter extends d_pms_appraisal_quarter_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (!this.appraisal_quarter_from) {
			this.errors.push(new ValidationError(this, "appraisal_quarter_from", "11", "Value required !!", ErrorType.ERROR));
		}
		if (!this.appraisal_quarter_to) {
			this.errors.push(new ValidationError(this, "appraisal_quarter_to", "11", "Value required !!", ErrorType.ERROR));
		}
		if (this.appraisal_quarter_to && this.appraisal_quarter_from && this.appraisal_quarter_to < this.appraisal_quarter_from) {
			this.errors.push(new ValidationError(this, "appraisal_quarter_from", "11", "Value should be less than Quarter to.", ErrorType.ERROR));
		}
		return this.errors;
	}
}
