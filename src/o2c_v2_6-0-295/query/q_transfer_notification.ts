import {q_transfer_notification as q_transfer_notification_gen} from "o2c_v2/query_gen/q_transfer_notification"
export class q_transfer_notification extends q_transfer_notification_gen{

    public async onTransfer(oEvent) { 
        
        if(oEvent.object.type == "transferRequest"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
            for (let i = 0; i < employee_entity.length; i++) {
                this.txn.addNotification('transfer_request_mail', employee_entity[i], {
                    first_name: employee_entity[i].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[i].employee_id.toLowerCase()]);
            }
            await this.txn.commitP();
        }
        if(oEvent.object.type == "transferLevelApproval"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('transfer_level_aprv_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP();
        }
        if(oEvent.object.type == "transferFinalApproval"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('transfer_final_aprv_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP();
        }
        if(oEvent.object.type == "transferRejection"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('transfer_reject_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number,
                    status: oEvent.object.status,
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP(); 
        }

    }
}