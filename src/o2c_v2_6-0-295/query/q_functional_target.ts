import { q_functional_target as q_functional_target_gen } from "o2c_v2/query_gen/q_functional_target"
export class q_functional_target extends q_functional_target_gen {

    public async role_check(oEvent) {
        let roleid = (await this.txn.get$Role()).role_id;
        let login_id = (await this.txn.get$User()).login_id;
        if (roleid == "ADMIN") {
            login_id = undefined;
        }
        oEvent.object.loginid = login_id;
    }
}