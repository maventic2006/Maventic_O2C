import { KloAppService } from "kloBo/KloAppService";

export class getTotpCodeVerification extends KloAppService {

    public async onExecute() {
        // Write your code here
        // let secretKey = this.data.secretKey;
        let loginUserSecretKey = await this.txn.getExecutedQuery("d_o2c_g2f_secret", { loadAll: true, 'user_id': this.data.loginID });
        let totpCode = this.data.totpCode;
        if (loginUserSecretKey.length == 0) {
            throw new Error("Secret Key is not Generated,Please ask Finance to generate it")
        }
        else {

            const speakeasy = require("speakeasy");
            // console.log("Input TOTP Code:", totpCode);
            // console.log("Generated Code (for comparison):", speakeasy.totp({
            //     secret: loginUserSecretKey[0].secret_key,
            //     encoding: "base32"
            // }));
            // console.log("Current time step:", Math.floor(Date.now() / 1000 / 30));
            const isVerified = speakeasy.totp.verify({
                secret: loginUserSecretKey[0].secret_key, // secret code stored per users
                encoding: "base32",
                token: totpCode,
                window: 8, // Allow +/- 30 seconds
            });
            return isVerified;

        }
    }
}