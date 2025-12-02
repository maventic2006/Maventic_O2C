import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_lacks_to_crore")
export default class p_lacks_to_crore extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onChangeData1() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait"
        });
        busyDialog.open();
        let list_1 = await this.tm.getTN("d_pc_trgt_hdr_list").getData();
        for (let i = 0; i < list_1.length; i++) {
            list_1[i].overall_target_in_cr = parseFloat(list_1[i].overall_target_in_cr) * 100
        }
        await this.tm.getTN("d_pc_trgt_hdr_list").refresh();
        busyDialog.close();
    }
    public async onChangeData2() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait"
        });
        busyDialog.open();
        let list_2 = await this.tm.getTN("d_o2c_fa_target_sales_item_list").getData();
        for (let i = 0; i < list_2.length; i++) {
            list_2[i].target_amount_cr = parseFloat(list_2[i].target_amount_cr) * 100
        }
        await this.tm.getTN("d_o2c_fa_target_sales_item_list").refresh();
        busyDialog.close();
    }
    public async onChangeData3() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait"
        });
        busyDialog.open();
        let list_3 = await this.tm.getTN("d_pc_trgt_mnthly_itm_list").getData();
        for (let i = 0; i < list_3.length; i++) {
            list_3[i].target = parseFloat(list_3[i].target) * 100
        }
        await this.tm.getTN("d_pc_trgt_mnthly_itm_list").refresh();
        busyDialog.close();
    }

    public async onChangeData4() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait"
        });
        busyDialog.open();
        let list_4 = await this.tm.getTN("d_o2c_fa_target_del_item_list").getData();
        for (let i = 0; i < list_4.length; i++) {
            list_4[i].delivery_target_cr = parseFloat(list_4[i].delivery_target_cr) * 100
        }
        await this.tm.getTN("d_o2c_fa_target_del_item_list").refresh();
        busyDialog.close()
    }
    public async onSave() {
        await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    }
}