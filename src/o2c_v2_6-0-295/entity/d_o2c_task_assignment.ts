import { KloEntitySet } from "kloBo_6-0/KloEntitySet";
import {d_o2c_task_assignment as d_o2c_task_assignment_gen} from "o2c_v2/entity_gen/d_o2c_task_assignment";
import { d_o2c_timesheet_time_booking } from "o2c_v2/entity_gen/d_o2c_timesheet_time_booking";
// import {d_o2c_timesheet_time_booking} from "../entity";
export class d_o2c_task_assignment extends d_o2c_task_assignment_gen
{
    public async taskDateBooking(oEvent){
      
        // let timesheet_TimeBooking = <KloEntitySet<d_o2c_timesheet_time_booking>>await this.txn.getExecutedQuery('d_o2c_timesheet_time_booking', {loadAll: true});
        // let taskId = this.task_id;
        // let sDate = this.task_start_date;
        // let eDate = this.task_end_date;
        // while (sDate <= eDate) {
        //     await timesheet_TimeBooking.newEntityP(0, { task_id: taskId, booking_date: sDate }, null);
        //     sDate.setDate(sDate.getDate() + 1);
        // }
    }
}