import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_company_info as d_o2c_company_info_gen} from "o2c_v2/entity_gen/d_o2c_company_info";
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_company_info extends d_o2c_company_info_gen
{
    public async OnValidate(){
        
            this.errors.concat(validationUtil.validatePattern(this,[
              {pattern:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,entityPropertyId:"pan_details",msg:"PAN NO. is not proper"},
              {pattern:/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,entityPropertyId:"tan_details",msg:"TAN NO. is not proper"},
              {pattern:/^[0-9]{10}$/,entityPropertyId:"contact_details",msg:"MOB NO. is not proper"},
              {pattern:/^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/,entityPropertyId:"cin_no",msg:"CIN NO. is not proper"},
            ]))
        // let pan_pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        //     if(!pan_pattern.test(this.pan_details)){
        //         errors.push(new ValidationError(this,"pan_details","101","PAN NO. is not proper"));
        //     }
        // let tan_pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        // if(!tan_pattern.test(this.tan_details)){
        //     errors.push(new ValidationError(this,"tan_details","101","TAN NO. is not proper"));
        // }
        
        // let mob_pattern = /^[0-9]{10}$/;
        // if(!mob_pattern.test(this.contact_details)){
        //     errors.push(new ValidationError(this,"contact_details","101","MOB NO. is not proper"));
        // }
        // let cin_number = /^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/;
        // if(!cin_number.test(this.cin_no))
        // {
        //     errors.push(new ValidationError(this,"cin_no","101","CIN NO. is not proper"));
        // }
        //     return errors;
}
    public get pan_details():string{
        return this.g("pan_details","string");
    }
    public set pan_details(new_value:string){
    this.s("pan_details",new_value.toUpperCase(),"string",false,false);
    }
    
    public get tan_details():string{
        return this.g("tan_details","string");
    }
    public set tan_details(new_value:string){
    this.s("tan_details",new_value.toUpperCase(),"string",false,false);
    

    
}

}