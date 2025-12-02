import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee } from "o2c_v2/entity_gen/d_o2c_employee";
import { d_o2c_leave_management as d_o2c_leave_management_gen } from "o2c_v2/entity_gen/d_o2c_leave_management";
import { d_o2c_task_assignment } from "o2c_v2/entity_gen/d_o2c_task_assignment";

//import { p_o2c_emp_leave_quot } from "../controller";
export class d_o2c_leave_management extends d_o2c_leave_management_gen {

    static xyz() {
        throw new Error('Method not implemented.');
    }
    public async OnValidate() {
        //let errors: ValidationError[] = await super.OnValidate();
        if (!this.start_date || !this.end_date) {
            this.errors.push(new ValidationError(this, "start date / end date", "101", "start date / end date are missing"));
        }
        var current_date = new Date();
        current_date.setHours(0, 0, 0, 0)


        if (this.start_date.getTime() > this.end_date.getTime()) {
            this.errors.push(new ValidationError(this, "start date < end date", "102", "please check selected date.."));
        }
        // let a_status;
        // try{
        //     a_status = <KloEntitySet<d_o2c_leave_approval>> await this.txn.getExecutedQuery("d_o2c_leave_approval",{"leave_id":this.leave_id,"skipMap": true});

        // }catch(e){

        // }

        // if(a_status.length > 0 && a_status[0].approval_status == "Approved" && (this.leave_status == 'Cancled' || this.leave_status == 'Applied' || this.leave_status == 'Rejected')){
        //     errors.push(new ValidationError(this, "Approved status can not chenged", "103", "Approved status can not chenged"));
        // }

        // if(a_status.length>0 && a_status[0].approval_status == "Rejected" && (this.leave_status == 'Cancled' || this.leave_status == 'Applied' || this.leave_status == 'Approved')){
        //     errors.push(new ValidationError(this, "Rejected status can not chenged", "104", "Rejected status can not chenged"));
        // }
        // if(a_status.length>0 && a_status[0].approval_status == "Cancled" && (this.leave_status == 'Rejected' || this.leave_status == 'Applied' || this.leave_status == 'Approved')){
        //     errors.push(new ValidationError(this, "Cancled status can not chenged", "105", "Cancled status can not chenged"));
        // }


        //p_o2c_emp_leave_quot.chkchk()



    }

    // public get leave_status(): string {
    //     return this.g("leave_status", "String");
    // }
    // public set leave_status(new_value: string) {
    //     this.s("leave_status", new_value, "String", false, false);
    // }

    public get start_date(): Date {
        return this.g("start_date", "Date");
    }
    public set start_date(new_value: Date) {
        this.s("start_date", new_value, "Date", false, false);
    }
    public get end_date(): Date {
        return this.g("end_date", "Date");
    }
    public set end_date(new_value: Date) {
        this.s("end_date", new_value, "Date", false, false);
    }

    public static xyzx() {
        console.log("xyz")
    }

    //Calculate business days 
    public static calculateBusinessDays(startDate, endDate, holidayDate, leave_types) {
        // Validate input
        //const holidayDate = this.tm.getTN('/o2c_holiday_list').getData();
        if (endDate < startDate)
            return 0;
        //Calculate days between dates
        var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
        startDate.setHours(0, 0, 0, 1);  // Start just after midnight
        endDate.setHours(23, 59, 59, 999);  // End just before midnight
        var diff = endDate - startDate;  // Milliseconds between datetime objects    
        var days = Math.ceil(diff / millisecondsPerDay);
        var maternity_days = days;
        var weeks = Math.floor(days / 7);
        days = days - (weeks * 2);
        // Handle special cases
        var startDay = startDate.getDay();
        var endDay = endDate.getDay();
        // Remove weekend not previously removed.   
        if (startDay - endDay > 1)
            days = days - 2;
        // Remove start day if span starts on Sunday but ends before Saturday
        if (startDay == 0 && endDay != 6) {
            days = days - 1;
        }
        // Remove end day if span ends on Saturday but starts after Sunday
        if (endDay == 6 && startDay != 0) {
            days = days - 1;
        }
        //Holiday remove 
        var holiday;
        for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            for (holiday = 0; holiday < holidayDate.length; holiday++) {
                if (d.toDateString() == holidayDate[holiday].holiday_date.toDateString()) {
                    days = days - 1;
                }
            }
        }
        holiday = 0
        if (leave_types == 'Maternity') {
            return maternity_days
        }
        return days
    }

    public static async checkLeaveDate(startDate, endDate, empId, tx) {
        let list = <KloEntitySet<d_o2c_leave_management>>await tx.getExecutedQuery('q_leave_filter', { loadAll: true, lemp_id: empId, lstart_date: startDate, lend_date: endDate });
        return list.length

    }


    public async emp_leave_creation() {


    }

    public async emp_leave_approved() {

    }

    public async leaveApplyNotif(oEvent) {
        let data = <d_o2c_leave_management>oEvent.getObject();
        let prjmgr = <KloEntitySet<d_o2c_task_assignment>>await this.txn.getExecutedQuery('q_assigned_project', { loadAll: true, 'tstart_date': new Date(this.start_date).getTime(), 'tend_date': new Date(this.end_date).getTime(), 'employee_id': this.employee_id, 'line_mgr': this.lmi });
		const projectManager = new Map();
		for (let emp_le of prjmgr) {
			projectManager.set(emp_le.assigned_by, emp_le)
		}
        const prjmgr_array = Array.from(projectManager.keys());
        prjmgr_array.push(this.lmi);
        const lowerCasePrjmgrId = prjmgr_array.map(emp_id => emp_id.toLowerCase());
        let emp_entity = <KloEntitySet<d_o2c_employee>> await this.txn.getExecutedQuery("d_o2c_employee",{loadAll: true, employee_id:prjmgr_array});
        let emp_name = [];
        for(let emp of emp_entity){
            emp_name.push(emp.full_name);
        } 
        data.txn.addNotification('leave_apply_notif', data, {
            approvers : emp_name, applied_by_employee:data.applied_by_employee, start_date: new Date(data.start_date).toLocaleDateString(), end_date: new Date(data.end_date).toLocaleDateString(), 
            leave_discription: data.leave_discription, request_reason: data.request_reason, employee_id : data.employee_id
        }, lowerCasePrjmgrId);
    }

    // comiting ..........

}