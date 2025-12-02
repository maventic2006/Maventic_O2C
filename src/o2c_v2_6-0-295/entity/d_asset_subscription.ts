import { d_asset_subscription as d_asset_subscription_gen } from "o2c_v2/entity_gen/d_asset_subscription";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";

export class d_asset_subscription extends d_asset_subscription_gen {
    public async onSubscriptionCreate(oEvent) {

        let newid = <d_asset_subscription>oEvent.getObject();
        let idquery = await this.txn.getQueryP('d_idseries')
        idquery.setLoadAll(true);
        let asset_purchase_id = await idquery.executeP();
        let id = <d_idseries>(await asset_purchase_id.newEntityP(0, { s_object_type: "asset_subscription_id" }, null));
       
        newid.subscription_id = parseInt(id.a_id);

        let subs_history = await newid.r_subs_history.fetch();
      
        for (let i = 0; i < subs_history.length; i++) {
            subs_history[i].subscription_id = newid.subscription_id;
            subs_history[i].license_key = this.license_key;
        }



        let assign_history = await newid.r_subs_assignment.fetch();
      
        for (let i = 0; i < assign_history.length; i++) {
            assign_history[i].subscription_id = newid.subscription_id;
            assign_history[i].license_key = this.license_key;
        }
    }
}