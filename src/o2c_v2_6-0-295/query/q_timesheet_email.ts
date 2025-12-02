import { table } from "console";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee } from "o2c_v2/entity/d_o2c_employee";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_timesheet_email as q_timesheet_email_gen } from "o2c_v2/query_gen/q_timesheet_email"
export class q_timesheet_email extends q_timesheet_email_gen {

    public async mail_send(oEvent) {
        // console.log(oEvent);
        // let entity = this.tm.getTN("employee_store").getData()
        // let emp_array = [];
        // for(let i=0;i<entity.length;i++)
        // {
        //     if(entity[i].send_reminder == true)
        // {
        //     emp_array.push(entity[i].employee_id);
        // }
        // }
        if(oEvent.object.type == "TSReminder"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.send_reminder,loadAll:true })
            for (let i = 0; i < employee_entity.length; i++) {
                this.txn.addNotification('ts_reminder', employee_entity[i], {
                    first_name: employee_entity[i].first_name
                }, [employee_entity[i].employee_id.toLowerCase()]);
            }
            await this.txn.commitP();
        }
    }
    public async dailyProfileReminder(oEvent){
        if(oEvent.object.type == "Profile"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true })
           this.txn.addNotification('profile_reminder', employee_entity[0], {
                first_name: employee_entity[0].first_name
            }, [employee_entity[0].employee_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }
    public async timesheetApprovalEmail(oEvent)
    {
        if(oEvent.object.type == "TSApproval")
        {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.send_reminder, loadAll: true })
            this.txn.addNotification('timesheet_approval', employee_entity[0], {
                first_name: employee_entity[0].first_name
            }, [employee_entity[0].employee_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }
    
    public async timesheetRejectionEmail(oEvent)
    {
        if(oEvent.object.type == "TSReject")
        {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.send_reminder, loadAll: true })
            this.txn.addNotification('timesheet_rejectition', employee_entity[0], {
                first_name: employee_entity[0].first_name
            }, [employee_entity[0].employee_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }

    public async profileApprovalByHR(oEvent) {
        if (oEvent.object.type == "ApprovedByHR") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true })
            this.txn.addNotification('profile_appr_hr', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                employee_id : employee_entity[0].employee_id
            }, oEvent.object.legal);
            await this.txn.commitP();
        }
    }

    public async hrRejection(oEvent){
        if (oEvent.object.type == "RejectedByHR") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.emp_id, loadAll: true })
            this.txn.addNotification('profile_reject_hr', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                employee_id : employee_entity[0].employee_id
            }, [employee_entity[0].employee_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }

    public async TSApproveReject(oEvent){
        if(oEvent.object.type == "newTSApprove"){
            let employee_entity = <KloEntitySet<d_o2c_employee>> await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: [oEvent.object.emp_id, oEvent.object.approver], loadAll: true })
            let employee_name = employee_entity.find(emp => emp.employee_id == oEvent.object.emp_id.toUpperCase());
            let approver_name = employee_entity.find(emp => emp.employee_id == oEvent.object.approver);
            this.txn.addNotification('new_ts_approval', employee_entity[0], {
                first_name: employee_name.first_name,
                month: oEvent.object.month,
                over_all_status: oEvent.object.over_all_status,
                approver: approver_name.full_name,
                approval_flow: oEvent.object.table 
            }, [oEvent.object.emp_id.toLowerCase()]);
            await this.txn.commitP();
        }

        if(oEvent.object.type == "newTSReject"){
            let employee_entity = <KloEntitySet<d_o2c_employee>> await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: [oEvent.object.emp_id, oEvent.object.approver], loadAll: true })
            let employee_name = employee_entity.find(emp => emp.employee_id == oEvent.object.emp_id.toUpperCase());
            let approver_name = employee_entity.find(emp => emp.employee_id == oEvent.object.approver);
            this.txn.addNotification('new_ts_reject', employee_entity[0], {
                first_name: employee_name.first_name,
                month: oEvent.object.month,
                over_all_status: oEvent.object.over_all_status,
                approver: approver_name.full_name
            }, [oEvent.object.emp_id.toLowerCase()]);
            await this.txn.commitP();
        }
    }

}