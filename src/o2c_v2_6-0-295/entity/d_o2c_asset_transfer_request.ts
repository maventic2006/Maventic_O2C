import {d_o2c_asset_transfer_request as d_o2c_asset_transfer_request_gen} from "o2c_v2/entity_gen/d_o2c_asset_transfer_request"
export class d_o2c_asset_transfer_request extends d_o2c_asset_transfer_request_gen
{
    public async assetTransferIdSeries(oEvent) {

        let newid = <d_o2c_asset_transfer_request>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        idquery.setLoadAll(true);
        let asset_transfer_id = await idquery.executeP();
        let id;
        id = <d_idseries>(await asset_transfer_id.newEntityP(0, { s_object_type: "asset_purchase_tr" }, null));

        newid.request_number = id.a_id;
        if(newid.r_transfer_comment.length > 0)
        {
            newid.r_transfer_comment[0].request_number = id.a_id;
        }
        const other_assets_list = this.r_transfer_other;
            other_assets_list.forEach((item: any) => {
              item.request_number = id.a_id;
            });
        
    }
}