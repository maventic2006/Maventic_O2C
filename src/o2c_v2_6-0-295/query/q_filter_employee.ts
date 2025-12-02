import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_filter_employee as q_filter_employee_gen} from "o2c_v2/query_gen/q_filter_employee"
export class q_filter_employee extends q_filter_employee_gen{

    public async empCompany(Parameters :eventContext){
        let loginid = (await this.txn.get$User()).login_id;
        let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.txn.getExecutedQuery('d_o2c_employee_org', { employee_id: loginid,loadAll: true });
        let companyArray = [];
		let businessArray = [];
		for(let i=0;i<emp_org.length;i++){
			companyArray[i] = emp_org[i].company_code;
			businessArray[i] = emp_org[i].business_area;
		}
        Parameters.object.cmpny_code  = companyArray;
        Parameters.object.bsnss_code = businessArray;
        // await this.txn.getExecutedQuery("q_filter_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
    }
}