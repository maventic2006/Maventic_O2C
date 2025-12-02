import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_business_area as d_o2c_business_area_gen} from "o2c_v2/entity_gen/d_o2c_business_area";
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_business_area extends d_o2c_business_area_gen
{
    public async OnValidate()
    {
        this.errors.concat(validationUtil.validatePattern(this,[
            {pattern:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,entityPropertyId:"gst_vat",msg:"GST NO. is not proper"},
          ]))
        // let errors: ValidationError[]=await super.OnValidate();
        // let gst_pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        // if(!gst_pattern.test(this.gst_vat)){
        //     errors.push(new ValidationError(this,"gst_vat","101","GST No. is not proper"));
        //     debugger;
        // }
        // return errors;
    }
    public get gst_vat():string{
        return this.g("gst_vat","string");
    }
    public set gst_vat(new_value:string){
    this.s("gst_vat",new_value.toUpperCase(),"string",false,false);
    }
}