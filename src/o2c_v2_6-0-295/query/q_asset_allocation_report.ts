import {q_asset_allocation_report as q_asset_allocation_report_gen} from "o2c_v2/query_gen/q_asset_allocation_report"
export class q_asset_allocation_report extends q_asset_allocation_report_gen{

    public async allocationStatus(Parameters){
        Parameters.object.action_status  = "Allocated";
        // await this.txn.getExecutedQuery("q_filter_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
    }

}