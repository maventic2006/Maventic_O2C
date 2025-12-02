import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import {  d_o2c_holiday_calendar_hdr as d_o2c_holiday_calendar_hdr_gen } from "o2c_v2/entity_gen/d_o2c_holiday_calendar_hdr";
export class d_o2c_holiday_calendar_hdr extends d_o2c_holiday_calendar_hdr_gen
{
  
    public async OnValidate() {
        
      // To date greater than from date(Parent Entity Validation)
       if(this.from_date>=this.to_date){
           this.errors.push(new ValidationError(this, "to_date", "101", "check To date.."))
        }
       //Validation for the Child entity(Through Relation)
        for(let i=0;i<(this.r_holiday.length);i++){
        let date=this.r_holiday[i].holiday_date;
        if((this.from_date>date) || (this.to_date<date)){
            this.errors.push(new ValidationError(this, "holiday_date", "102", "check date.."))  
            this.r_holiday[i].holiday_date=null;
           }
        }
        
        
    }
    public get holiday_calender_id():string{
        return this.g("holiday_calender_id","string");
    }
    public set holiday_calender_id(new_value:string){
    if(new_value){
    this.s("holiday_calender_id",new_value.toUpperCase(),"string",false,false);
    }
    else{
        this.s("holiday_calender_id",null,"string",false,false);   
    }
    }
    
    }
