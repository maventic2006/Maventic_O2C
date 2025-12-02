import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_customers_map as d_o2c_customers_map_gen} from "o2c_v2/entity_gen/d_o2c_customers_map"
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_customers_map extends d_o2c_customers_map_gen{
    public async OnValidate(){
      if (!this.gstin_vat && this.country_code=="IND") {
        this.errors.push(new ValidationError(this, "map_country", "101", "GST mandatory for Indian Address"));
      }
      }
}