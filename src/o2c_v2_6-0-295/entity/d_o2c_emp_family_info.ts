import {d_o2c_emp_family_info as d_o2c_emp_family_info_gen} from "o2c_v2/entity_gen/d_o2c_emp_family_info";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
export class d_o2c_emp_family_info extends d_o2c_emp_family_info_gen
{
    // maintaining Idseries
    public async onCreateEntity(oEvent) {
        let newid = <d_o2c_emp_family_info>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        let employeeid = await idquery.executeP();
        let id = <d_idseries>(await employeeid.newEntityP(0, { s_object_type: 'family_id' }, null));
        newid.family_id = id.a_id;
    }
    public async OnValidate(){
        // let errors: ValidationError[] = await super.OnValidate();
        // return errors;
    }
}