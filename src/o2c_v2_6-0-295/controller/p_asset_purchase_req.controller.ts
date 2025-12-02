import { KloEntitySet } from 'kloBo/KloEntitySet';
import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_asset_purchase_master } from 'o2c_v2/entity_gen/d_asset_purchase_master';
import { d_o2c_profit_centre } from 'o2c_v2/entity_gen/d_o2c_profit_centre';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_purchase_req")

export default class p_asset_purchase_req extends KloController {
    public asset;
    public purchase_file_name;
    public purchase_file;
    public comment_list = [];
    public comment;
    public team_head_id;
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public onPageInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }

    public async onPageEnter(oEvent) {
        let d = new Date();
        this.tm.getTN("purchase_comment_otr").setData({})
        this.tm.getTN("newdate").setData({});
        this.tm.getTN("newdate").setProperty('dates', d)

    }


    public async navToDetails(oEvent) {

        // await this.navTo(({ S: "p_asset_purchase_req", SS: "s_asset_detail" }))
        await this.navTo(({ SS: 'pa_asset_detail' }), oEvent)

    }
    public async onCreate() {
        await this.navTo(({ S: "p_asset_purchase_req", SS: "pa_asset_detail" }));

        this.asset = await this.tm.getTN("list_asset_purchase").createEntityP({}, "Create successful", "Creation Failed", null, "First", true, true);
        this.asset.request_type = "PR";

    }
    public async onSave() {

        let temp_header_detail: ValidationError[] = await this.tm.getTN("detail_asset_purchase").getData().validateP();
        let temp = temp_header_detail;
        let main_master_table = <KloEntitySet<d_asset_purchase_master>>await this.transaction.getExecutedQuery('d_asset_purchase_master', { 'company_code': this.asset.company_code, 'request_type': this.asset.request_type, 'level': 1, loadAll: true })

        if (!main_master_table.length) {
            sap.m.MessageToast.show("Please maintain Flow Master");
            return;
        }
        let oBusyDailog = new sap.m.BusyDialog().setText("submitting Request...").open();

        this.comment = await this.tm.getTN('purchase_comment_otr').getData();


        if (this.comment_list.length) {



            if (this.comment.commentbox) {
                this.onPurchase_Comment_sent();
            }



            this.asset.status = "Pending";
        //   let result=  await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
          let result=  await this.retrySave("Saved Successfully", "Save Failed");
            if(result == false){
                this.asset.status = "New";
            }

             if (temp.length == 0) {

            oBusyDailog.setText("Sending for Approval")

            await this.flowMaster(1);

             }

        } else if (this.comment.commentbox) {
            this.asset.status = "Pending";
            this.onPurchase_Comment_sent();

            // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            await this.retrySave("Saved Successfully", "Save Failed");

             if (temp.length == 0) {

            oBusyDailog.setText("Sending for Approval")

            await this.flowMaster(1);

             }
        }
        else {
            sap.m.MessageBox.error("Please Enter Comment... ", {
                title: "Alert",
                actions: [sap.m.MessageBox.Action.OK],
                onClose: null
            })
        }
        this.comment_list = [];
        oBusyDailog.close();
    }
    //Send for Approval
    public async flowMaster(level) {
        let main_master_table = <KloEntitySet<d_asset_purchase_master>>await this.transaction.getExecutedQuery('d_asset_purchase_master', { 'company_code': this.asset.company_code, 'request_type': this.asset.request_type, 'level': level, loadAll: true })
        let masterTable = main_master_table.filter(item => (parseFloat(item.level) == parseFloat(level)));
        this.team_head_id = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery('d_o2c_profit_centre', { 'company_code': this.asset.company_code, 'profit_center': this.asset.profit_center, loadAll: true })

        // await this.transaction.createEntityP('d_asset_purchase_approval', { s_object_type: -1, company_code: this.asset.company_code, business_area: this.asset.business_area, role: masterTable[0].role, approval_status: 'Pending', approval_sequence: 1, purchase_request: this.asset.purchase_request });
        await this.transaction.createEntityP('d_asset_action_item', { s_object_type: -1, request_number: this.asset.purchase_request, request_type: "PR", action_status: "Pending", company_code: this.asset.company_code, business_area: this.asset.business_area, profit_center: this.asset.profit_center, functional_area: this.asset.functional_area, 'asset_type': this.asset.asset_type, approval_sequence: 1, team_head: this.team_head_id[0].team_head });
        await this.transaction.createEntityP('d_asset_approve_status', { s_object_type: -1, request_number: this.asset.purchase_request, request_type: "PR", action_status: "Pending", company_code: this.asset.company_code, business_area: this.asset.business_area, role_name: masterTable[0].role, approval_sequence: 1, profit_center: this.asset.profit_center, functional_area: this.asset.functional_area });

        //comment 


        for (let i = 0; i < this.comment_list.length; i++) {
            this.comment_list[i].request_number = this.asset.purchase_request;

        }




        // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
        await this.retrySave("Send For Approval", "Send Failed");
        sap.m.MessageBox.success(`Request Number ${this.asset.purchase_request} has been Generated Successfully and Sent for Approval`, {
            title: "Success",
            actions: [sap.m.MessageBox.Action.OK],
            onClose: null
        })

        // mail notification
        await this.onMailSend(this.asset.company_code, this.asset.business_area, this.asset.profit_center, masterTable[0].role, this.asset.purchase_request)
    }


    public async confirmationSave() { // Function of Corfirmation for Cancelling Changes in Detail
        sap.m.MessageBox.success("Do you want to submit the Asset Purchase Request.", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.onSave();
                }
            }
        })
    }

    // d c

    public async discardChangesTravel() {
        let index = await this.tm.getTN("list_asset_purchase").getActiveIndex();
        let detail = await this.tm.getTN("list_asset_purchase").getData()[index];
        await this.transaction.rollback();
        if (this.getMode() == "CREATE")
            this.tm.getTN('list_asset_purchase').setActiveFirst();
        this.setMode("DISPLAY");
        this.tm.getTN("purchase_comment_otr").setData({})

        // if (detail.action_status == "New")
        // 	await this.navTo(({ H: true, S: "p_travel_page", SS: "pa_travel_list" }));
    }

    // company code change

    public async onCompanyCodeChange() {
        this.asset.business_area = null;
        this.asset.profit_center = null;
        this.asset.functional_area = null;
        await this.tm.getTN('detail_asset_purchase').resetP()

    }

    public async onBusinessCodeChange() {
       
        this.asset.functional_area = null;
        await this.tm.getTN('detail_asset_purchase').resetP()

    }
    public async onAssetClassChange() {
       
        this.asset.asset_sub_class = null;
        await this.tm.getTN('detail_asset_purchase').resetP()

    }



    // Requested Quantity

    public onRequested_quantity() {
        if (parseInt(this.asset.requested_quantity) <= 0) {
            sap.m.MessageBox.error("Requested Quantity should more then 0 ", {
                title: "Alert",
                actions: [sap.m.MessageBox.Action.OK],
                onClose: null
            })
            this.asset.requested_quantity = null
        }

    }





    // COMMENT 

    public async documentUpload(oEvent) {
        this.purchase_file = oEvent.mParameters.files[0];
        this.purchase_file_name = oEvent.mParameters.files[0].name;
    }
    public async onPurchase_Comment_sent() {
        let listData = await this.tm.getTN('detail_asset_purchase').getData();
        this.comment = await this.tm.getTN('purchase_comment_otr').getData();
        if (this.comment.commentbox != undefined && this.comment.commentbox != '' && this.comment.commentbox != null) {

            let comment_data = await this.tm.getTN('purchase_comment_lists').createEntityP({ s_object_type: -1, request_type: "PR", asset_guid: listData.asset_id, asset_comment: this.comment.commentbox }, null, null, null, "First", false, false, false);

            this.comment_list.push(comment_data)

            if (this.purchase_file) {

                await comment_data.asset_attachment.setAttachmentP(this.purchase_file, this.purchase_file_name);
            }
            comment_data = null
            this.purchase_file = null
            this.purchase_file_name = null;
            this.comment.attechment_url = null
            this.comment.commentbox = null

        }

    }


    // DOWNLOAD ATTECHMENT 
    public async onDownloadAttech(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        this.tm.getTN("purchase_comment_lists").setActive(parseInt(path.replace(`/${"purchase_comment_lists"}/`, '')))
        //await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();
        let docdownload = await this.tm.getTN("purchase_comment_lists").getActiveData()//.getProperty('r_manag_attch');
        await docdownload.asset_attachment.downloadAttachP();

    }

    // mail notification
    public async onMailSend(companyCode, businessArea, profitCenter, role, requestNumber) {
        if (role === 'TEAM_HEAD') {
            await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseRequest");
            await this.tm.getTN("purchase_request_mail").setProperty('employee', this.team_head_id[0].team_head);
            await this.tm.getTN("purchase_request_mail").setProperty('request_number', requestNumber);
            await this.tm.getTN("purchase_request_mail").executeP();
        } else {
            const designationMaster = await this.transaction.getExecutedQuery('d_o2c_designation_master', {
                company_code: companyCode,
                name: role,
                is_active: true,
                loadAll: true
            });
            const empDesignation = await this.transaction.getExecutedQuery('d_o2c_employee_designation', {
                designation: designationMaster[0].designation_id,
                loadAll: true
            });
            let emp_ids = [];
            for (let i = 0; i < empDesignation.length; i++) {
                emp_ids.push(empDesignation[i].employee_id)
            }

            let empListByBusinessArea = [];
            if (emp_ids.length > 0) {
                empListByBusinessArea = await this.transaction.getExecutedQuery('d_o2c_employee_designation', {
                    company_code: companyCode,
                    business_area: businessArea,
                    profit_center: profitCenter,
                    employee_id: emp_ids
                });
            }

            let finalEmpList = [];
            for (let i = 0; i < empListByBusinessArea.length; i++) {
                finalEmpList.push(empListByBusinessArea[i].employee_id)
            }

            if (finalEmpList.length > 0) {
                await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseRequest");
                await this.tm.getTN("purchase_request_mail").setProperty('employee', finalEmpList);
                await this.tm.getTN("purchase_request_mail").setProperty('request_number', requestNumber);
                await this.tm.getTN("purchase_request_mail").executeP();
            }

        }
    }


    public async afterSearch() {
        this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_purchase_search"));
    }


    public onLiveChange(oEvent) {
        let input = oEvent.getParameters().value;
        let inputValue = oEvent.getParameters().value;

        // Ensure it's a string before using replace
        let cleanedValue = String(inputValue).replace(/[^0-9]/g, '');

        // Remove leading zeros
        cleanedValue = cleanedValue.replace(/^0+/, '');

        // Limit to 3 digits
        if (cleanedValue.length > 3) {
            cleanedValue = cleanedValue.slice(0, 3);
        }

        // Set the cleaned value back to the input control
        oEvent.getSource().setValue(parseInt(cleanedValue));
    }

    public async retrySave(sSuccessMessage: string, sErrMessage: string) {
        // Retry logic for commit operation
        let retryCount = 0;
        const maxRetries = 5;
        let commitSuccess = false;
        let result;

        while (retryCount < maxRetries && !commitSuccess) {
            try {
                result = await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
                commitSuccess = true;
            } catch (error) {
                retryCount++;
                console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

                if (retryCount >= maxRetries) {
                    sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
                    throw error;
                }
                // Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            }
        }

        return result;
    }
    
}