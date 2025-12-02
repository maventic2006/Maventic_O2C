import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_travel_vacation as d_o2c_travel_vacation_gen} from "o2c_v2/entity_gen/d_o2c_travel_vacation"
export class d_o2c_travel_vacation extends d_o2c_travel_vacation_gen{
    public async OnValidate() {
        if (this.vacation_to < this.vacation_from) {
          this.errors.push(new ValidationError(this, "vacation_from", "101", "Vacation Date not Proper"));
        }
}
}