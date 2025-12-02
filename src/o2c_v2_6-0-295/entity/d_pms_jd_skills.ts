import { d_pms_jd_skills as d_pms_jd_skills_gen } from "o2c_v2/entity_gen/d_pms_jd_skills";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_jd_skills extends d_pms_jd_skills_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		let attributeDetails = await this.txn.getExecutedQuery("d_pms_attribute_type", { attribute_type_id: this.attribute_type });
		if (attributeDetails.length > 0 && attributeDetails[0]["rating_type_id"] == "scale" && this.base_rating < this.lower_base) {
			this.errors.push(new ValidationError(this, "base_rating", "11", "Base Rating cannot be lesser than lower scale", ErrorType.ERROR));
		} else if (attributeDetails.length > 0 && attributeDetails[0]["rating_type_id"] == "scale" && this.base_rating > this.higher_base) {
			this.errors.push(new ValidationError(this, "base_rating", "11", "Base Rating cannot be greater than Higher scale", ErrorType.ERROR));
		}
		return this.errors;
	}
}
