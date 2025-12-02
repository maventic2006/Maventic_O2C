import { d_pms_attribute as d_pms_attribute_gen } from "o2c_v2/entity_gen/d_pms_attribute";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_attribute extends d_pms_attribute_gen {
	public async OnValidate(): Promise<ValidationError[]> {
		let attributeDetails = await this.txn.getExecutedQuery("d_pms_attribute_type", { attribute_type_id: this.attribute_type });
		if (attributeDetails.length > 0 && attributeDetails[0]["rating_type_id"] == "scale" && this.higher_base <= this.lower_base) {
			this.errors.push(new ValidationError(this, "lower_base", "11", "Value of Lower Scale can not be greater than Higher Scale.", ErrorType.ERROR));
		}
		return this.errors;
	}
}
