import {q_asset_allocation_flow_report as q_asset_allocation_flow_report_gen} from "o2c_v2/query_gen/q_asset_allocation_flow_report"
export class q_asset_allocation_flow_report extends q_asset_allocation_flow_report_gen{

    public async ast_alc_rep(Parameters:eventContext) {

        let role_id = (await this.txn.get$Role()).role_id;
        let user_id = (await this.txn.get$User()).login_id;

        if (role_id != "INF_TECH_MGR") {

            Parameters.object.userid = user_id;

        }
        //

    }
}