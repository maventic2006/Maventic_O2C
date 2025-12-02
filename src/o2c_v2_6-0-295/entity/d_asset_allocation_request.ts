import {d_asset_allocation_request as d_asset_allocation_request_gen} from "o2c_v2/entity_gen/d_asset_allocation_request"

export class d_asset_allocation_request extends d_asset_allocation_request_gen{

    public async assetAllocationIdSeries(oEvent) {

        let newid = <d_asset_allocation_request>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        idquery.setLoadAll(true);
        let asset_allocation_id = await idquery.executeP();
        let id;
            id = <d_idseries>(await asset_allocation_id.newEntityP(0, { s_object_type: "asset_purchase_al" }, null));
        
        newid.request_no = id.a_id;
    }
}