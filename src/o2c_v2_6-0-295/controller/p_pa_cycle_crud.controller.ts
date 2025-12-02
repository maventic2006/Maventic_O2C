import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_cycle_crud")
export default class p_pa_cycle_crud extends KloController {

    /*public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }*/

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/
   public _resolveLoginPromise;
   public code;
   public loginID
    public async onPageEnter() {
        let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
        if (general_config[0].high_value == 1) {
            const waitForLogin = new Promise<void>((resolve) => {
                this._resolveLoginPromise = resolve;
            });
            await this.openDialog("p_pa_dialog_box");
            // Wait here until login completes and dialog is closed
            await waitForLogin;
        }
    }

    public async onEscapeEvent() {
        //Avoid escape button click
    }
    public async onLoginSubmit() {
        this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "");
        this.code = this.tm.getTNFromEmbedded("totp_code", "s_pa_login").getData().code;
        // let loginID = (await this.transaction.get$User()).login_id;	
        this.loginID = (await this.transaction.get$User()).login_id;
        if (this.code) {
            const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
                data: {
                    loginID: this.loginID,
                    totpCode: this.code
                },
                method: "POST"
            });
            if (!response) {
                this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
                // this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('code',"");
            }
            else {
                this.transaction.$SYSTEM.appVars.totp = this.code;
                await this.closeDialog("p_pa_dialog_box");
                //  Resolve the promise to resume `abc()`
                if (this._resolveLoginPromise) {
                    this._resolveLoginPromise();
                    this._resolveLoginPromise = null;
                }
            }
        }
        else {
            this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Please enter TOTP Code");

        }
    }
    public async onCancel() {
		// Resolve the promise to unblock `onPageEnter`, if it exists
		if (this._resolveLoginPromise) {
			this._resolveLoginPromise();
			this._resolveLoginPromise = null;
		}
		await this.navTo({ F: "kloTouch", S: "p_homePage" })
	}

    public async deletePaData() {

        let oBusyDailog = new sap.m.BusyDialog().setText("Deleting...");
        oBusyDailog.open();
        let listData
        // let pa_list = await this.tm.getTN("o2c_emp_pa_cycle_list").getData();
        const selected = await this.getActiveControlById(null, "s_o2c_emp_list").getSelectedIndices();
        for (let inital = 0; inital < selected.length; inital++) {
            listData = await this.tm.getTN("o2c_emp_pa_cycle_list").getData()[selected[inital]]
            if (await listData.r_pa_cycle_catgry) {
                let sta = await listData.r_pa_cycle_catgry.fetch();
                let ind_emp_pa = await listData.r_pa_emp_planning_hdr.fetch();
                sta.action_status = "New"
                await listData.deleteP();
                //Albia new table data delete----START
                for (let i = 0; i < ind_emp_pa.length; i++) {
                    await ind_emp_pa[i].deleteP();
                }
                //Albia new table data delete----END
                await this.tm.commitP("Deleted Successfully", "Failed to Delete", true, true);
                await this.tm.getTN('o2c_emp_pa_cycle_list').resetP(true);
                await this.tm.getTN('o2c_emp_pa_cycle_list').refresh();
            } else {
                sap.m.MessageBox.error(`not able to fetch data issue in fw relation try again without reloading the page...`, {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: null,
                }
                );
            }
        }
        oBusyDailog.close()
    }

}