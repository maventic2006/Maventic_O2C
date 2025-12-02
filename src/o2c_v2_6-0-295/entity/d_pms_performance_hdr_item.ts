import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
import { d_pms_performance_hdr_item as d_pms_performance_hdr_item_gen } from "o2c_v2/entity_gen/d_pms_performance_hdr_item";
export class d_pms_performance_hdr_item extends d_pms_performance_hdr_item_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		if (!this.pg_group) {
			this.errors.push(new ValidationError(this, "pg_group", "11", "Value required!!", ErrorType.ERROR));
		}
		if (!this.pg_group_ext) {
			this.errors.push(new ValidationError(this, "pg_group_ext", "11", "Value required!!", ErrorType.ERROR));
		}

		return this.errors;
	}
}
