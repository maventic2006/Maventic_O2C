import { q_trgt_set_pc as q_trgt_set_pc_gen } from "o2c_v2/query_gen/q_trgt_set_pc"
export class q_trgt_set_pc extends q_trgt_set_pc_gen {

    public async role_check(oEvent) {
        let roleid = (await this.txn.get$Role()).role_id;
        let login_id = (await this.txn.get$User()).login_id;
        if (roleid == "ADMIN") {
            login_id = undefined;
        }
        oEvent.object.loginid = login_id;
    }
}