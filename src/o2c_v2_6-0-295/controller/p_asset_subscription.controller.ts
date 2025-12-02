import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_subscription")
export default class p_asset_subscription extends KloController {

    public sub_detail = null;
    public onBeforeRendering() { }
    public onAfterRendering() { }
    public onExit() { }
    public onPageInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }
    public async onPageEnter(oEvent) {

        await this.tm.getTN('start_end_date').setData({ start_date: new Date(1199, 11, 31), end_date: new Date(1199, 11, 31) })

    }
    public async onSave() {
        const subs_detail = await this.tm.getTN("asset_subscription_detail").getData();
       

        await this.onSaveTrigger()
        await this.tm.commitP("Saved", "Save Failed", true, true);
    }
    public async purchaseAmountChange() {
        const subs_detail = await this.tm.getTN("asset_subscription_detail").getData();
        if (isNaN(subs_detail.purchased_amount)) {
            subs_detail.purchased_amount = null;
            sap.m.MessageToast.show("Purchased Amount should be numeric");
            return;
        }
    }
    public async onEdit() {

        await this.setMode('EDIT');
        let detail = this.tm.getTN("asset_subscription_detail").getData();
        if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(detail.valid_to) })
        } else if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from == null || detail.valid_from == undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(0) })
        } else if ((detail.valid_to == null || detail.valid_to == undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(0), end_date: new Date(detail.valid_to) })
        }
    }
    public async onCancel() {
        await this.rollBack()
        await this.setMode('DISPLAY');
    }
    public async onDiscard() {
        // await this.tm.getTN("asset_subscription_list").getData()[0].deleteP();
        await this.rollBack()
        await this.navTo(({ S: "p_asset_subscription", SS: "s_subscription_list" }))
        await this.setMode('DISPLAY');
        // this.closeDialog('pa_subs_history_add');
        // await this.setMode('DISPLAY');
    }

    public async add_subs() {
        let detail = await this.tm.getTN("asset_subscription_detail").createEntityP({}, null, null, "s_sub_detail", "First", false, true, false)
        await this.tm.getTN("subscription_history_list").createEntityP({}, null, null, null, "First", false, true, false)

        this.sub_detail = detail.subscription_id;
        
            await this.tm.getTN('start_end_date').setData({ start_date: null, end_date: null })
        


    }
    public async subsDetailsValidFromChange() {
        const subs_detail = await this.tm.getTN("asset_subscription_detail").getData();
        if (subs_detail.valid_to && subs_detail.valid_to.setHours(0, 0, 0, 0) < subs_detail.valid_from.setHours(0, 0, 0, 0)) {
            subs_detail.valid_from = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }
        if ((subs_detail.valid_to != null || subs_detail.valid_to != undefined) && (subs_detail.valid_from != null || subs_detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(subs_detail.valid_from), end_date: new Date(subs_detail.valid_to) })
        } else if ((subs_detail.valid_to != null || subs_detail.valid_to != undefined) && (subs_detail.valid_from == null || subs_detail.valid_from == undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(subs_detail.valid_from), end_date: new Date(0) })
        } else if ((subs_detail.valid_to == null || subs_detail.valid_to == undefined) && (subs_detail.valid_from != null || subs_detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(0), end_date: new Date(subs_detail.valid_to) })
        }

    }
    public async subsDetailsValidToChange() {
        const subs_detail = await this.tm.getTN("asset_subscription_detail").getData();
        if (subs_detail.valid_from && subs_detail.valid_to < subs_detail.valid_from) {
            subs_detail.valid_to = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }

        if ((subs_detail.valid_to != null || subs_detail.valid_to != undefined) && (subs_detail.valid_from != null || subs_detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(subs_detail.valid_from), end_date: new Date(subs_detail.valid_to) })
        } else if ((subs_detail.valid_to != null || subs_detail.valid_to != undefined) && (subs_detail.valid_from == null || subs_detail.valid_from == undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(subs_detail.valid_from), end_date: new Date(0) })
        } else if ((subs_detail.valid_to == null || subs_detail.valid_to == undefined) && (subs_detail.valid_from != null || subs_detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(0), end_date: new Date(subs_detail.valid_to) })
        }
    }




    //               ------------------------ History --------------------------

    public async onHistoryLinkPress() {
        // await this.openDialog('pa_subs_history_add');
    }
    public async onHistoryAdd() {
        await this.setMode('EDIT');
        let detail = await this.tm.getTN("asset_subscription_detail").getData();
        let subHistory = await this.tm.getTN("asset_subscription_detail/r_subs_history").createEntityP({ subscription_id: detail.subscription_id, license_key: detail.license_key });

        if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(detail.valid_to) })
        } else if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from == null || detail.valid_from == undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(0) })
        } else if ((detail.valid_to == null || detail.valid_to == undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
            await this.tm.getTN('start_end_date').setData({ start_date: new Date(0), end_date: new Date(detail.valid_to) })
        }


    }
    public async onHistorySave() {
        await this.onSaveTrigger()
        await this.tm.commitP("Saved", "Save Failed", true, true);
        this.closeDialog('pa_subs_history_add');
    }
    public async onHistoryCancel() {

        await this.rollBack()
        this.closeDialog('pa_subs_history_add');
        await this.setMode('DISPLAY');
    }
    public async historyDetailsValidFromChange() {
        const history_detail = await this.tm.getTN("subscrioption_history_detail").getData();
        if (history_detail.valid_to && history_detail.valid_to.setHours(0, 0, 0, 0) < history_detail.valid_from.setHours(0, 0, 0, 0)) {
            history_detail.valid_from = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }
    }
    public async historyDetailsValidToChange() {
        const history_detail = await this.tm.getTN("subscrioption_history_detail").getData();
        if (history_detail.valid_from && history_detail.valid_to < history_detail.valid_from) {
            history_detail.valid_to = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }
    }


    // ------------------------------ Assignment -----------------------
    public async onAssignListAdd() {
        let detail = await this.tm.getTN("asset_subscription_detail").getData();
        let assign_data = await this.tm.getTN("subscription_assign_list").getData();
        if (assign_data.length >= detail.quantity) {

            sap.m.MessageBox.error(`You have reached to maximum quantity for allocation`, {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
                onClose: null,
            });

        } else {



            let assignHistory = await this.tm.getTN("subscription_assign_list").createEntityP({ subscription_id: detail.subscription_id, license_key: detail.license_key });
            await this.tm.getTN('subscription_assign_list').setActiveFirst()
            await this.openDialog('pa_subs_assign_add');
            await this.setMode('CREATE');


            if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
                await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(detail.valid_to) })
            } else if ((detail.valid_to != null || detail.valid_to != undefined) && (detail.valid_from == null || detail.valid_from == undefined)) {
                await this.tm.getTN('start_end_date').setData({ start_date: new Date(detail.valid_from), end_date: new Date(0) })
            } else if ((detail.valid_to == null || detail.valid_to == undefined) && (detail.valid_from != null || detail.valid_from != undefined)) {
                await this.tm.getTN('start_end_date').setData({ start_date: new Date(0), end_date: new Date(detail.valid_to) })
            }
        }

    }
    public async onAssignSave() {
        const assign_detail = await this.tm.getTN("subscription_assign_detail").getData();
        if (!assign_detail.start_date) {
            sap.m.MessageToast.show("Start Date is mandatory");
            return;
        }

        assign_detail.sub_status = "Allocated";
        await this.onSaveTrigger()
        await this.tm.commitP("Saved", "Save Failed", true, true);

        this.closeDialog('pa_subs_assign_add');
    }

    public async onDeallocated() {
        const assign_detail = await this.tm.getTN("subscription_assign_list").getData();
        const selected = await this.getActiveControlById(null, "s_subs_assign_list").getSelectedIndices();


        if (selected.length > 0) {
            // Fetch asset numbers in parallel
            const assetData = await Promise.all(selected.map(async index => {
                const data = await this.tm.getTN("subscription_assign_list").getData()[index];
                data.sub_status = "Deallocated";
            }));
        }
        //activeAsset.forEach(asset => { asset.pi_active = false; });
        await this.onSaveTrigger()
        await this.tm.commitP("Saved", "Save Failed", true, true);
        let detaildata = await this.tm.getTN('asset_subscription_detail').getData();
        await detaildata.r_subs_assignment.refreshP();
        await detaildata.r_sub_unassignmrnt.refreshP()

        //this.closeDialog('pa_subs_assign_add');
    }

    public async assignDetailsValidFromChange() {
        const assign_detail = await this.tm.getTN("subscription_assign_detail").getData();
        if (assign_detail.end_date && assign_detail.end_date.setHours(0, 0, 0, 0) < assign_detail.start_date.setHours(0, 0, 0, 0)) {
            assign_detail.start_date = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }
    }
    public async assignDetailsValidToChange() {
        const assign_detail = await this.tm.getTN("subscription_assign_detail").getData();
        if (assign_detail.start_date && assign_detail.end_date.setHours(0, 0, 0, 0) < assign_detail.start_date.setHours(0, 0, 0, 0)) {
            assign_detail.end_date = null;
            sap.m.MessageToast.show("Valid To should be greater than Valid From");
            return;
        }
    }
    public async onAssignCancel() {
        // await this.tm.getTN("subscription_assign_list").getData()[0].deleteP();
        await this.rollBack()
        this.closeDialog('pa_subs_assign_add');
        await this.setMode('DISPLAY');
    }
    public async onAssignListEdit() {
        await this.setMode('EDIT');
    }
    public async onAssignListCancel() {
        await this.rollBack()
        await this.setMode('DISPLAY');
    }
    public async onAssignListSave() {
        await this.onSaveTrigger()
        await this.tm.commitP("Saved", "Save Failed", true, true);
    }
    public async onAssetPress(oEvent) {
        // await this.tm.getTN("expense_project_search").setProperty('request_id', request.travel_request_id);
        // await this.tm.getTN("expense_project_search").executeP();
        let assetNumber = oEvent;
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/subscription_assign_list/", ""));
        await this.tm.getTN("subscription_assign_list").setActive(index);
        let data = await this.tm.getTN("subscription_assign_list").getActiveData();

        let list = await this.tm.getTN("subs_asset_list").getData();

        var indexx;
        if (data.asset_number) {
            for (let i = 0; i < list.length; i++) {
                if (list[i].asset_number == data.asset_number) {
                    indexx = i;
                    break;
                }
            }

            await this.tm.getTN("subs_asset_list").setActive(indexx);
            await this.openDialog('pa_asset_detail');
        }

    }


    public async onSaveTrigger() {
        let subs_his_data = await this.tm.getTN("subscription_history_list").getData();
        let basic_detail = await this.tm.getTN("asset_subscription_detail").getData();
        let total_quantity = 0, total_amount = 0;
        for (let i = 0; i < subs_his_data.length; i++) {
            total_quantity = parseInt(total_quantity) + parseInt(subs_his_data[i].quantity);
            total_amount = parseInt(total_amount) + parseInt(subs_his_data[i].purchased_amount);
        }

        basic_detail.quantity = parseInt(total_quantity);
        basic_detail.purchased_amount = (total_amount);

    }

    public async on_license_type_change() {


        let basic_detail = await this.tm.getTN("asset_subscription_detail").getData();
        let sub_detail = await this.tm.getTN("subscription_history_list").getData();

        if (basic_detail.license_type == "Paper License") {
            basic_detail.quantity = 1;
            sub_detail[0].quantity = 1;
        } else {
            basic_detail.quantity = null;
            sub_detail[0].quantity = null;
        }

    }

}