import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
import p_pa_grading from 'o2c_v2/metadata/mu_screen/p_pa_grading_metadata';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_salarypa_dialogbox")
export default class p_salarypa_dialogbox extends KloController {
	public code;
    public _resolveLoginPromise;
	public loginID;
	public async onPageEnter(oEvent) {
		this.tm.getTN("totp_code").setData({});
	}
	public async onChangeCode()
	{
		this.tm.getTN("totp_code").setProperty('msg',"");
	}
	// public async onLoginSubmit() {
	// 	this.tm.getTN("totp_code").setProperty('msg', "");
	// 	this.code = this.tm.getTN("totp_code").getData().code;
	// 	this.loginID = (await this.transaction.get$User()).login_id;
	// 	if (this.code) {
	// 		const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
	// 			url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
	// 			data: {
	// 				loginID: this.loginID,
	// 				totpCode: this.code
	// 			},
	// 			method: "POST"
	// 		});
	// 		if (!response) {
	// 			this.tm.getTN("totp_code").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
	// 		}
	// 		else {
	// 			this.transaction.$SYSTEM.appVars.totp = this.code;
	// 			await this.closeDialog("p_pa_dialog_box");
	// 			// ✅ Resolve the promise to resume `abc()`
	// 			if (this._resolveLoginPromise) {
	// 				this._resolveLoginPromise();
	// 				this._resolveLoginPromise = null;
	// 			}
	// 		}
	// 	}
	// 	else {
	// 		this.tm.getTN("totp_code").setProperty('msg', "Please enter TOTP Code");

	// 	}
	// }
	
}