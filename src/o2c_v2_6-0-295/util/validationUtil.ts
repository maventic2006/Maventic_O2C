import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { KloEntity } from "kloBo/KloEntity";

export class validationUtil{

    public static validatePattern(obj: KloEntity,rules:{pattern: RegExp; entityPropertyId: string; msg: string; errorCode?:string}[]){
        for(let rule of rules){
            if(!rule.pattern.test(obj[rule.entityPropertyId]))
            obj.errors.push(new ValidationError(obj,rule.entityPropertyId,rule.errorCode||"101",rule.msg))
        }
        return obj.errors;
    }

    public static validateDate(obj:KloEntity,rules:{start_date:string;end_date:string;msg:string;errorCode?:string}[]){
        for(let rule of rules){
            if(obj[rule.start_date]>obj[rule.end_date]){
                obj.errors.push(new ValidationError(obj,rule.end_date,rule.errorCode||"101",rule.msg));
            }
        }
        return obj.errors;
    }

    public static validateMandatory(obj:KloEntity,rules:{entityPropertyId:string;msg:string;errorCode?:string}[]){
        for(let rule of rules){
            if(!obj[rule.entityPropertyId]){
                obj.errors.push(new ValidationError(obj,rule.entityPropertyId,rule.errorCode||"101",rule.msg));
            }
        }
        return obj.errors;
    }

}
