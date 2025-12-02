import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import {q_asset_master_report as q_asset_master_report_gen} from "o2c_v2/query_gen/q_asset_master_report"
export class q_asset_master_report extends q_asset_master_report_gen{

    public async assetStatus(Parameters){
        // Parameters.object.status  = "In Store";
        // await this.txn.getExecutedQuery("q_filter_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
        let loginid = (await this.txn.get$User()).login_id;
        let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.txn.getExecutedQuery('d_o2c_employee_org', { employee_id: loginid,loadAll: true });
        let companyArray;
		// let businessArray = [];
		// for(let i=0;i<emp_org.length;i++){
			companyArray = emp_org[0].company_code;
			// businessArray[i] = emp_org[i].business_area;
		// }
         Parameters.object.company_code  = companyArray;
       
        
        //Parameters.object.bsnss_code = businessArray;
    }
}