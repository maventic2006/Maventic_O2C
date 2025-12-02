import { q_profit_center as q_profit_center_gen } from "o2c_v2/query_gen/q_profit_center"
export class q_profit_center extends q_profit_center_gen {

    public async role_check(oEvent) {
        let roleid = (await this.txn.get$Role()).role_id;
        let login_id = (await this.txn.get$User()).login_id;
        if (roleid == "ADMIN") {
            login_id = undefined;
        }
        oEvent.object.loginid = login_id;
    }
}