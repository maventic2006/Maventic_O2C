import { KloEntitySet } from "kloBo_6-0/KloEntitySet";
import { d_o2c_leave_management } from "o2c_v2/entity/d_o2c_leave_management";
import { q_leave_notification as q_leave_notification_gen } from "o2c_v2/query_gen/q_leave_notification"
export class q_leave_notification extends q_leave_notification_gen {

    public async onLeaveApplyNotif(oEvent) {
        if (oEvent.object.type == "") {
            // let oEvent.object.leave_obj = <KloEntitySet<d_o2c_leave_management>> await this.txn.getExecutedQuery("d_o2c_leave_mangement", { employee_id: oEvent.object.emp_id, loadAll: true });
            let sendTo = [];
            // if(oEvent.object.leave_obj){
            sendTo.push(oEvent.object.pm.toLowerCase());
            sendTo.push(oEvent.object.line_manager.toLowerCase());
            // }
            this.txn.addNotification('leave_apply_notif', oEvent.object, {
                // project_mgr : oEvent.object.pm , 
                lmi: oEvent.object.line_manager// applied_by_employee : oEvent.object.leave_obj.applied_by_employee, start_date : oEvent.object.leave_obj.start_date,
                // end_date : oEvent.object.leave_obj.end_date, leave_discription: oEvent.object.leave_obj.leave_discription, request_reason : oEvent.object.leave_obj.request_reason
            }, sendTo);
            await this.txn.commitP();
        }
    }

    public async onLeaveApproveNotif(oEvent){
        if(oEvent.object.type == "LeaveApprove"){
            let leave_entity = <KloEntitySet<d_o2c_leave_management>> await this.txn.getExecutedQuery("d_o2c_leave_management", { leave_id: oEvent.object.leave_id, loadAll: true });
            this.txn.addNotification('leave_approve_notif', leave_entity[0], {
                applied_by_employee :leave_entity[0].applied_by_employee, start_date :new Date(leave_entity[0].start_date).toLocaleDateString(),
                end_date : new Date(leave_entity[0].end_date).toLocaleDateString(), leave_status :leave_entity[0].leave_status
            }, [leave_entity[0].employee_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }
}