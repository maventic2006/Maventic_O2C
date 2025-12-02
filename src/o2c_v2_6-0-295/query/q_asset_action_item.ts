import { KloEntitySet } from "kloBo_7-2-27";
import { d_o2c_employee_org } from "o2c_v2/entity_gen/d_o2c_employee_org";
import { d_o2c_profit_centre } from "o2c_v2/entity_gen/d_o2c_profit_centre";
import {q_asset_action_item as q_asset_action_item_gen} from "o2c_v2/query_gen/q_asset_action_item"
export class q_asset_action_item extends q_asset_action_item_gen{


    public async assetitemfn(Parameters) {

        // if (Parameters.object.business_area == undefined || Parameters.object.company_code == undefined) {
        //     Parameters.object.business_area = 'In';
        //     Parameters.object.company_code = 'In';
        // }else if(Parameters.object){

        // }
        //  this.txn.getTN("login_ssrole").setProperty("role", this.roleid);

        // (await this.txn.get$Role()).role_id;
        let user_id = (await this.txn.get$User()).login_id;


        let role_id = (await this.txn.get$Role()).role_id;
        if (Parameters.object.action_status == undefined) {
            Parameters.object.action_status = 'Pending'
        }

        //await this.txn.getExecutedQuery("d_asset_approval_required", {loadAll: true,})
    
        if(role_id == "TEAM_HEAD"){
            //let company_code_id = <KloEntitySet<d_o2c_employee_org>>await this.txn.getExecutedQuery('d_o2c_employee_org', {'employee_id': user_id,is_primary:true,partialSelect: ['company_code'],loadAll: true })

            Parameters.object.team_head = user_id;
           // let profit_centers =[];
           // let team_head_id = <KloEntitySet<d_o2c_profit_centre>>await this.txn.getExecutedQuery('d_o2c_profit_centre', {'team_head': user_id,'company_code':company_code_id[0].company_code,loadAll: true })
           // profit_centers = team_head_id.map(item => item.profit_center);
            // console.log(team_head_id)
            // console.log(company_code_id)
            // console.log(profit_centers)
          
        }

if(role_id==undefined){
    Parameters.object.role_name = "fake_role";
}else{
    Parameters.object.role_name = role_id;
}
        

       
      

        // await this.txn.getExecutedQuery("q_filt  er_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
    }


}