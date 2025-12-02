import { d_pms_performance_header as d_pms_performance_header_gen } from "o2c_v2/entity_gen/d_pms_performance_header";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_performance_header extends d_pms_performance_header_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (this.status !== "2") {
			if (!this.start_date) this.errors.push(new ValidationError(this, "start_date", "11", "Value required!!", ErrorType.ERROR));
			if (!this.end_date) this.errors.push(new ValidationError(this, "end_date", "11", "Value required!!", ErrorType.ERROR));
		}
		if (this.start_date && this.end_date && this.start_date > this.end_date) this.errors.push(new ValidationError(this, "start_date", "11", "Start Date Should not be Greater then End Date", ErrorType.ERROR));
		return this.errors;
	}
}
