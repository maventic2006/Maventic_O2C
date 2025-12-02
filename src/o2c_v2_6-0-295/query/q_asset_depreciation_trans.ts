import { q_asset_depreciation_trans as q_asset_depreciation_trans_gen } from "o2c_v2/query_gen/q_asset_depreciation_trans"
export class q_asset_depreciation_trans extends q_asset_depreciation_trans_gen {


    public async depreciation_calculation(Parameters) {

        let instance = Parameters.getObject(); //it will give you the instance of the query for which callback is created
        instance.setLoadAll(1);
        await instance.setResults(Parameters.object.data);
        instance.skipDBQueryExecution();


    }

}