import { KloAppService } from "kloBo/KloAppService";

export class getSecretKeyCreation extends KloAppService {

    public async onExecute() {
        // Write your code here
        let result=false;
        let loginUserSecretKey = await this.txn.getExecutedQuery("d_o2c_g2f_secret", { loadAll: true, 'user_id': this.data.user_id, skipMap: true });
        if (loginUserSecretKey.length == 0) {
            const speakeasy = require("speakeasy");
            // Step 1: Generate a secret key for the user
            const secret = speakeasy.generateSecret({
                name: this.data.user_id,
            });
            let secretkey = secret.base32;
            await this.txn.createEntityP("d_o2c_g2f_secret", { 'user_id': this.data.user_id,'secret_key':secretkey});
            await this.txn.commitP();
            result=true;
        }
        return result;
    }
}