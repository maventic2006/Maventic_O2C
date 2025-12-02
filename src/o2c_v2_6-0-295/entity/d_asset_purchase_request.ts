import { d_asset_purchase_request as d_asset_purchase_request_gen } from "o2c_v2/entity_gen/d_asset_purchase_request";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";

export class d_asset_purchase_request extends d_asset_purchase_request_gen {
    public async assetPurchaseIdSeries(oEvent) {

        let newid = <d_asset_purchase_request>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        idquery.setLoadAll(true);
        let asset_purchase_id = await idquery.executeP();
        let id;
        // if (newid.asset_type == "PR") {
            id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_pr" }, null));
        // } else if (newid.asset_type == "IN") {
        //     id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_in" }, null));
        // } else if (newid.asset_type == "AL") {
        //     id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_al" }, null));

        // } else if (newid.asset_type == "TR") {
        //     id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_tr" }, null));

        // } else if (newid.asset_type == "SC") {
        //     id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_sc" }, null));

        // } else if (newid.asset_type == "PI") {
        //     id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_purchase_pi" }, null));

        // }
        newid.purchase_request = id.a_id;
        //check
    }
}