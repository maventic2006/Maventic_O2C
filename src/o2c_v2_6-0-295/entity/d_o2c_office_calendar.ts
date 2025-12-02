import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {d_o2c_office_calendar as d_o2c_office_calendar_gen} from "o2c_v2/entity_gen/d_o2c_office_calendar";
export class d_o2c_office_calendar extends d_o2c_office_calendar_gen
{
    
    public async OnValidate() {
    
   
    
     
    if(this.fis_year_from>=this.fiscal_year_to){
        this.errors.push(new ValidationError(this, "fiscal_year_to", "101", "check To date.."))
    }
   
        
  
    
    

    }//
    /*public get fis_year_from():Date{
        return this.g("fiscal_year_from","Date");
    }
    public set fis_year_from(new_value:Date){
     this.s("fiscal_year_from",new_value,"Date",false,false);
    }
    public get fiscal_year_to():Date{
        return this.g("fiscal_year_to","Date");
    }
    public set fiscal_year_to(new_value:Date){
     this.s("fiscal_year_to",new_value,"Date",false,false);
    }
    public get date():Date{
     return this.g("date","Date");
    }
    public set date(new_value:Date){
        this.s("date",new_value,"Date",false,false);
    }*/
    
    
}
