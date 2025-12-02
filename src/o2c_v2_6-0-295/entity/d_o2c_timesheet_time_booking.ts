import { d_o2c_timesheet_time_booking as d_o2c_timesheet_time_booking_gen } from "o2c_v2/entity_gen/d_o2c_timesheet_time_booking";
export class d_o2c_timesheet_time_booking extends d_o2c_timesheet_time_booking_gen {
    // public get transient_pd(): number{
    //     return parseFloat((this.hours_worked/8).toFixed(2));
    // }
    public get transient_pd(): number {
        if(this.hours_worked){
            return parseFloat((this.hours_worked / 8).toFixed(2));
        }
    }
    public get transient_day(): string {
        const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const d = this.booking_date;
        let day = weekday[d.getDay()];
        return day;
    }
}