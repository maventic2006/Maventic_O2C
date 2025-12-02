import {d_o2c_industry_type as d_o2c_industry_type_gen} from "o2c_v2/entity_gen/d_o2c_industry_type";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";


export class d_o2c_industry_type extends d_o2c_industry_type_gen
{
    public async onCreateEntity(oEvent){
        let newid=<d_o2c_industry_type>oEvent.getObject();
        let idquery=await this.txn.getQueryP('d_idseries')
        idquery.setLoadAll(true);
        let industryid=await idquery.executeP();
        let id=<d_idseries>(await industryid.newEntityP(0,{s_object_type:'d_o2c_industry_type'},null));
        
        newid.industry_id=id.a_id;
    }
      
}