import {q_asset_transfer_report as q_asset_transfer_report_gen} from "o2c_v2/query_gen/q_asset_transfer_report"
export class q_asset_transfer_report extends q_asset_transfer_report_gen{

    public async transferStatus(Parameters){
        Parameters.object.status  = "Approved";
        // await this.txn.getExecutedQuery("q_filter_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
    }

}