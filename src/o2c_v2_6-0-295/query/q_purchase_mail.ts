import {q_purchase_mail as q_purchase_mail_gen} from "o2c_v2/query_gen/q_purchase_mail"
export class q_purchase_mail extends q_purchase_mail_gen{
   
    public async onPurchaseMail(oEvent) {
        
        if(oEvent.object.type == "purchaseRequest"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
            for (let i = 0; i < employee_entity.length; i++) {
                this.txn.addNotification('purchase_request_mail', employee_entity[i], {
                    first_name: employee_entity[i].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[i].employee_id.toLowerCase()]);
            }
            await this.txn.commitP();
        }
        if(oEvent.object.type == "purchaseLevelApproval"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('pr_level_appr_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP();
        }
        if(oEvent.object.type == "purchaseFinalApproval"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('pr_final_appr_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP();
        }
        if(oEvent.object.type == "purchaseRejection"){
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee,loadAll:true })
           
                this.txn.addNotification('pr_rejection_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number,
                    status: oEvent.object.status,
                }, [employee_entity[0].employee_id.toLowerCase()]);
            
            await this.txn.commitP(); 
        }

    }
}