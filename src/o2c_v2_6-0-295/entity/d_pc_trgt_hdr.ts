import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_pc_trgt_hdr as d_pc_trgt_hdr_gen } from "o2c_v2/entity_gen/d_pc_trgt_hdr";
export class d_pc_trgt_hdr extends d_pc_trgt_hdr_gen
{
    public async OnValidate() {
        if (!this.functional_area && this.identifier == "FA") {
            this.errors.push(new ValidationError(this, "functional_area", "101", "Functional Area Missing"));
          }
    }
}