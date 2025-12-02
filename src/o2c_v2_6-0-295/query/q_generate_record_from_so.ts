import { q_generate_record_from_so as q_generate_record_from_so_gen } from "o2c_v2/query_gen/q_generate_record_from_so"

export class q_generate_record_from_so extends q_generate_record_from_so_gen {
    public async gnrateRecordFromSO(Parameters :eventContext) {
        let api = await import("o2c_v2/util/ApiTracker");
        if(Parameters.object.subscribed_customer == "Customer"){
            await api.ApiTracker.updateSubscribedCustomer(this.txn);
        }
        else if(Parameters.object.subscribed_customer == "API"){
            await api.ApiTracker.getSoList(this.txn);
        }
    }
}