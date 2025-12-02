import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_customers_contact as d_o2c_customers_contact_gen} from "o2c_v2/entity_gen/d_o2c_customers_contact"
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_customers_contact extends d_o2c_customers_contact_gen{
    public async OnValidate(){
        if(this.contact_number && this.country_code=="91"){
            this.errors.concat(validationUtil.validatePattern(this,[
              {pattern:/^[0-9]{10}$/,entityPropertyId:"contact_number",msg:"Number is not proper in Contact Tab"}
            ]))
          }
          /*if(this.email_id){
            this.errors.concat(validationUtil.validatePattern(this,[
              {pattern:/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,entityPropertyId:"email_id",msg:"Mail is not proper in Contact Tab"}
            ]))
          }*/
      }
      
}