import {q_asset_scrap_flow_rep as q_asset_scrap_flow_rep_gen} from "o2c_v2/query_gen/q_asset_scrap_flow_rep"
export class q_asset_scrap_flow_rep extends q_asset_scrap_flow_rep_gen{

    public async scrap_flow_rep(Parameters:eventContext) {

        let role_id = (await this.txn.get$Role()).role_id;
        let user_id = (await this.txn.get$User()).login_id;

        if (role_id != "INF_TECH_MGR") { 

            Parameters.object.userid = user_id;

        }
        //chk

    }
}