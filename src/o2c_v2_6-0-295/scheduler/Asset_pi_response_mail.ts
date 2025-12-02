import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloEntitySet } from 'kloBo/KloEntitySet'
import { KloTransaction } from 'kloBo/KloTransaction'
import { d_o2c_travel_header } from 'o2c_v2/entity_gen/d_o2c_travel_header'
import { d_o2c_travel_journey } from 'o2c_v2/entity_gen/d_o2c_travel_journey'
import { d_second_role_assyn } from 'o2c_v2/entity_gen/d_second_role_assyn'
export class Asset_pi_response_mail extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let empIdSet = new Set();
                const today = new Date();
                let txn: KloTransaction = this.eventContext.getTxn();
                let employee_entity = await txn.getExecutedQuery("d_o2c_employee", {loadAll: true })
                let pi_entity = await txn.getExecutedQuery("d_asset_pi_header", { status: "Pending", loadAll:true });
                const filteredItems = pi_entity.filter(pi_entity => new Date(pi_entity.pi_date) > today);

                for(let i=0; i<filteredItems.length; i++){
                    empIdSet.add(filteredItems[i].assign_to_id);
                }
                // Convert the Set to an array
                let empArray = Array.from(empIdSet);
                for (let i = 0; i < empArray.length; i++) {

                    let filteredItemsByEmp = filteredItems.filter(filteredItems => filteredItems.assign_to_id == empArray[i]);
                    let piDocNumbers = filteredItemsByEmp.map(item => item.pi_doc_number);
                    let piDocDate = filteredItemsByEmp.map(item => item.pi_date);
                    let filteredEmpEntity = employee_entity.filter(employee_entity => employee_entity.employee_id == empArray[i]);

                    txn.addNotification('asset_pi_response_mail_sc', filteredEmpEntity[i], {
                        first_name: filteredEmpEntity[i].first_name,
                        pi_number: piDocNumbers,
                        verification_date: piDocDate
                        // request_number: oEvent.object.request_number
                    }, [filteredEmpEntity[i].employee_id.toLowerCase()]);

                    await txn.commitP();
                }        
                 res('asset_pi_response_mail' + new Date().toLocaleString())
            }, 30000)
        })
    }
}