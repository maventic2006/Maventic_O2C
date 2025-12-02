import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_asset_pi_create as q_asset_pi_create_gen } from "o2c_v2/query_gen/q_asset_pi_create"
export class q_asset_pi_create extends q_asset_pi_create_gen {


    public async assetSearch(Parameters) {

        
        let object = <KloQueryForRule>Parameters.getObject();

        object.setLoadAll(true)


        let txn = Parameters.getTxn();
        let qInstance = await txn.getQueryP('q_asset_creation_rel');
        qInstance.setLoadAll(true)
        await qInstance.executeP();


        if (Parameters.object.business_area == undefined || Parameters.object.company_code == undefined) {
            Parameters.object.business_area = 'In';
            Parameters.object.company_code = 'In';
        }else if(Parameters.object){

        }

        // await this.txn.getExecutedQuery("q_filt  er_employee",{loadAll:true, company_code:companyArray , business_area : businessArray});
    }
}