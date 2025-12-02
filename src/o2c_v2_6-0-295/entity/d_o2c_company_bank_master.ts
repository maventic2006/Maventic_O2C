import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_company_bank_master as d_o2c_company_bank_master_gen} from "o2c_v2/entity_gen/d_o2c_company_bank_master";
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_company_bank_master extends d_o2c_company_bank_master_gen
{
    public async OnValidate(){
        this.errors.concat(validationUtil.validatePattern(this,[
            {pattern:/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,entityPropertyId:"swift_code",msg:"Swift Code is not proper"},
            {pattern:/^[A-Z0-9]{9,18}$/,entityPropertyId:"account_no",msg:"Account No. is not proper"},
            {pattern:/^[A-Z]{4}0[A-Z0-9]{6}$/,entityPropertyId:"ifsc",msg:"IFSC Code is not proper"},
          ]))
        // let errors: ValidationError[]=await super.OnValidate();
        // let swiftcode = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        // if(!swiftcode.test(this.swift_code)){
        //     errors.push(new ValidationError(this,"swift_code","101","Swift Code is not proper"));
        // }
        // let account_pattern = /^[A-Z0-9]{9,18}$/;
        // if(!account_pattern.test(this.account_no))
        // {
        //     errors.push(new ValidationError(this,"account_no","101","Account No. is not proper"));
        // }
        // let ifsc_pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        // if(!ifsc_pattern.test(this.ifsc))
        // {
        //     errors.push(new ValidationError(this,"ifsc","101","IFSC Code is not proper"));
        // }
        // return errors

    }
}