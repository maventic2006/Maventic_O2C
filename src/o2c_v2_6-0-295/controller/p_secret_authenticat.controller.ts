import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
// import speakeasy from 'speakeasy'
//const speakeasy = require('speakeasy');
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_secret_authenticat")
export default class p_secret_authenticat extends KloController {

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
        await this.tm.getTN("list").setActive(0);
    }

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/
    // public async onGenerateSecretKey() {
    //     let employeeData = await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true });
    //     for (let i = 0; i < employeeData.length; i++) {
    //         await this.transaction.createEntityP("d_o2c_g2f_secret", { 'user_id': employeeData[i].employee_id });
    //         await this.tm.commitP("Save Successful", "Save Failed", true, true);
    //         await this.tm.getTN("mail").setProperty("type", "secretKeyNotif");
    //         await this.tm.getTN("mail").setProperty("user_id", employeeData[i].employee_id);
    //         await this.tm.getTN("mail").executeP();
    //     }
    // }
    // public async onGenerateSecretKeyIndEmp() {
    //     let employeeData = await this.tm.getTN("search").getData().employee_id;
    //     await this.transaction.createEntityP("d_o2c_g2f_secret", { 'user_id': employeeData });
    //     await this.tm.commitP("Save Successful", "Save Failed", true, true);

    //     await this.tm.getTN("mail").setProperty("type", "secretKeyNotif");
    //     await this.tm.getTN("mail").setProperty("user_id", employeeData);
    //     await this.tm.getTN("mail").executeP();

    // }
    public async onGenerateSecretKey() {
        let employeeList = [];
        let employeeData = await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true });
        for (let i = 0; i < employeeData.length; i++) {
            const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getSecretKeyCreation", true),
                data: {
                    user_id: employeeData[i].employee_id,
                },
                method: "POST"
            });
            if (!response) {
                await this.tm.commitP("Save Successful", "Save Failed", true, true);
                //mail send to the user
                this.tm.getTN("mail").setProperty("type", "secretKeyNotif");
                this.tm.getTN("mail").setProperty("user_id", employeeData[i].employee_id);
                await this.tm.getTN("mail").executeP();
            }
            else {
                //show already created secret key of list of user id
                employeeList.push(employeeData[i].employee_id);
            }
        }

    }
    public async onGenerateSecretKeyIndEmp() {
        let employeeData = await this.tm.getTN("list").getData().employee_id;
        const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
            url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getSecretKeyCreation", true),
            data: {
                user_id: employeeData,
            },
            method: "POST"
        });
        // Helper function to perform the notification logic
        const sendSecretKeyNotification = async () => {
            // await this.tm.commitP("Save Successful", "Save Failed", true, true);
            this.tm.getTN("mail").setProperty("type", "secretKeyNotif");
            this.tm.getTN("mail").setProperty("user_id", employeeData);
            await this.tm.getTN("mail").executeP();
        };

        if (response) {
            await sendSecretKeyNotification();
            sap.m.MessageBox.success("Secret Key is send to the employee's email ID!!", { duration: 1000 });
        } else {
            // Show SAPUI5 confirmation dialog
            return new Promise<void>((resolve) => {
                sap.m.MessageBox.confirm(
                    "A secret key has already been generated for this user. Do you want to resend it?",
                    {
                        title: "Secret Key Already Generated",
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: async (oAction) => {
                            if (oAction === sap.m.MessageBox.Action.YES) {
                                await sendSecretKeyNotification();
                                sap.m.MessageBox.success("Secret Key is send to the employee's email ID!!", { duration: 1000 });
                            }
                            resolve(); // Ensure function ends properly
                        }
                    }
                );
            });
        }

    }
}
//13/July