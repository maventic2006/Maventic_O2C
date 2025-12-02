import { q_so_test as q_so_test_gen } from "o2c_v2/query_gen/q_so_test"
export class q_so_test extends q_so_test_gen {
    public async createMultipleEntries(oEvent) {
        const data = await this.txn.createEntityP("d_email_helper_entity", {
            s_object_type: -1,
            email_type: "Reminder Mail"
        },);

        await this.txn.commitP();
        return data;
    }
}