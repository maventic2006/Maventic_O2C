import { AUTHORIZATION_TYPE, KloAjax } from "kloBo/kloCommon/KloAjaxHandler";
import { System } from "kloBo/kloCommon/System/System";

export class authDoneForUser {
	public static async totpCodeVerification(txn,loginID,code) {
        // const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
		// 	url: System.gi_URI().getAppServiceUrl(getFlavor,getFlavorVersion, "getTotpCodeVerification", true),
		// 	data: {
		// 		//secretKey: loginUserSecretKey[0].secret_key,
		// 		//282760
        //         loginID:loginID,
		// 		totpCode:code
		// 	},
		// 	method: "POST"
		// });
		const response=await this.onVerifyTotpCode(txn,loginID,code)
        return response;
    }
	public static async onVerifyTotpCode(txn,login_id,code){
		let loginUserSecretKey = await txn.getExecutedQuery("d_o2c_g2f_secret", { loadAll: true,'user_id':login_id});
        let totpCode = code;
		
        
        const speakeasy = require("speakeasy");
        console.log("Input TOTP Code:", totpCode);
        console.log("Generated Code (for comparison):", speakeasy.totp({
            secret: loginUserSecretKey[0].secret_key,
            encoding: "base32"
        }));
        console.log("Current time step:", Math.floor(Date.now() / 1000 / 30));
        const isVerified = speakeasy.totp.verify({
            secret: loginUserSecretKey[0].secret_key, // secret code stored per users
            encoding: "base32",
            token: totpCode,
            window: 8, // Allow +/- 30 seconds
        });
        return isVerified;
	}
}
		