import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_receive_gatepass")
export default class p_receive_gatepass extends KloController {
    public comment_list = [];
    public comment;
    public purchase_file_name;
    public purchase_file;
    public userid;
    public onPageInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }
    public onBeforeRendering() { }
    public onAfterRendering() { }
    public onExit() { }

    public async onPageEnter() {
        await this.tm.getTN("transfer_list").refresh()
        this.userid = (await this.transaction.get$User()).login_id;
        await this.tm.getTN("comment_other").setData({});
        await this.tm.getTN("transfer_comment").setData({});
        await this.tm.getTN("other_transfer_node").setData({});
        await this.tm.getTN("other_transfer_details").setData({});
    }

    public async navToDetail(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/transfer_list/", ""));
        await this.tm.getTN("transfer_list").setActive(index);

        await this.navTo({
            H: true,
            S: "p_receive_gatepass",
            SS: "pa_gatepass_detail",
        });
    }

    public async onReceiving() {
        try {
            this.comment = await this.tm.getTN('transfer_comment').getData();
    
            if (!this.comment.asset_comment && this.comment_list.length === 0) {
                sap.m.MessageBox.error("Please enter a comment.", {
                    title: "Alert",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }
    
            this.onTransferCommentSend();
    
            const detail = await this.tm.getTN("transfer_details").getData();
            const currentDateTime = new Date();
            let flag = false;
            const assetNumbers = [];
    
            // Determine if all "other" assets are received
            if (
                detail.r_query_other_transfer.length === 0 ||
                detail.r_query_other_transfer.every(item => item.has_received === "Received")
            ) {
                flag = true;
            }
    
            // Add main asset ONLY if all others are received
            if (flag) {
                assetNumbers.push({
                    asset_number: detail.asset_number,
                    tag_number: detail.tag_number
                });
            }
    
            // Add received "other" assets
            detail.r_query_other_transfer?.forEach(transfer => {
                if (transfer.has_received === "Received") {
                    assetNumbers.push({
                        asset_number: transfer.asset_number,
                        tag_number: transfer.tag_number
                    });
                }
            });
    
            // Add clubbed assets if all received
            if (flag && detail.r_transfer_club?.length) {
                detail.r_transfer_club.forEach(club => {
                    assetNumbers.push({
                        asset_number: club.child_asset_number,
                        tag_number: club.child_tag_number
                    });
                });
            }
    
            if (assetNumbers.length === 0) {
                sap.m.MessageBox.error("No assets to receive.", {
                    title: "Alert",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }
    
            // Sequentially create receive_gatepass + log
            for (const asset of assetNumbers) {
                await this.transaction.createEntityP("d_asset_receive_gatepass", {
                    s_object_type: -1,
                    asset_number: asset.asset_number,
                    compliance_type: detail.compliance_type,
                    gatepass_type: detail.gatepass_type,
                    transfer_subtype: detail.transfer_sub_type,
                    transfer_type: detail.transfer_type,
                    tag_number: asset.tag_number,
                    gatepass_number: detail.gatepass_number,
                    request_number: detail.request_number,
                    receive_by: this.userid,
                    receive_time: currentDateTime,
                    receive_date: currentDateTime
                });
    
                await this.transaction.createEntityP("d_asset_log_table", {
                    s_object_type: -1,
                    company_code: detail.company_code,
                    business_area: detail.business_area,
                    asset_number: asset.asset_number,
                    tag_number: asset.tag_number,
                    log_type: "Receive Gatepass",
                    request_number: detail.request_number
                });
            }
    
            if (flag) {
                detail.approve_status = null;
            }
    
            await this.changeAssetStatus();
            // await this.tm.commitP();
            await this.retrySave(null, null);
    
            sap.m.MessageBox.show("Your receiving request is submitted", {
                icon: sap.m.MessageBox.Icon.SUCCESS,
                title: "Success",
                actions: [sap.m.MessageBox.Action.OK],
                onClose: oAction => {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        this.navTo({ S: "p_receive_gatepass" });
                    }
                },
            });
    
            await this.tm.getTN("transfer_list").resetP();
    
        } catch (error) {
            console.error("Error in onReceiving:", error);
        }
    }
    

    public async onCancelAssets(oEvent: sap.ui.base.Event) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/other_asset_list/", ""));
        let otherList = await this.tm.getTN("other_asset_list").getData();
        if (otherList[index].has_received == "Received") {
            otherList[index].has_received = "Pending";
        }
        else if (otherList[index].has_received == "Pending") {
            otherList[index].has_received = "Received";
        }

    }

    public async changeAssetStatus() {
        const assetNumbers = [];
        const assetDetails = await this.tm.getTN("transfer_details").getData();

        let flag = false;
        if (
            assetDetails.r_query_other_transfer.length === 0 ||
            assetDetails.r_query_other_transfer.every(item => item.has_received === "Received")
        ) {
            flag = true;
        }

        if (flag) {
            assetNumbers.push(assetDetails.asset_number);
        }

        assetDetails.r_query_other_transfer?.forEach(transfer => {
            if (transfer.has_received === "Received") {
                assetNumbers.push(transfer.asset_number);
            }
        });

        if (flag && assetDetails.r_transfer_club?.length) {
            assetDetails.r_transfer_club.forEach(club => {
                assetNumbers.push(club.child_asset_number);
            });
        }

        let assetCreationTable = await this.transaction.getExecutedQuery(
            "d_asset_creation",
            {
                asset_number: assetNumbers,
                loadAll: true,
            }
        );

        for (let row of assetCreationTable) {
            row.status = "In Store";
            row.company_code = assetDetails.desig_company_code;
            row.business_area = assetDetails.desig_business_area;
        }
    }

    public async transferExpression() {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(3000);
        let detail = await this.tm.getTN("transfer_details").getData();
        await this.tm.getTN("other_transfer_node").setData(true);

        const otherAdditionCheck = await this.transaction.getExecutedQuery(
            "d_asset_transfer_visible",
            {
                loadAll: true,
                transfer_sub_type: detail.transfer_sub_type,
            }
        );
        await this.tm.getTN("other_transfer_details").setData(otherAdditionCheck);
    }

    public async afterSearch() {
        this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_gatepass_search"));
    }

    // COMMENT 

    public async documentUpload(oEvent) {
        this.purchase_file = oEvent.mParameters.files[0];
        this.purchase_file_name = oEvent.mParameters.files[0].name;
    }

    public async onTransferCommentSend() {
        let detailData = await this.tm.getTN('transfer_details').getData();
        this.comment = await this.tm.getTN('transfer_comment').getData();
        if (this.comment.asset_comment != undefined && this.comment.asset_comment != '' && this.comment.asset_comment != null) {
            let currentUserId = (await this.transaction.get$User()).login_id;
            let commenterName = await this.getEmployeeName(currentUserId.toUpperCase());
            let comment_data = await this.tm.getTN('transfer_comment_list').createEntityP({ s_object_type: -1, request_type: "TR", asset_guid: detailData.asset_guid, asset_comment: this.comment.asset_comment, commeter_name: commenterName }, null, null, null, "First", false, false, false);

            this.comment_list.push(comment_data)

            if (this.purchase_file) {

                await comment_data.asset_attachment.setAttachmentP(this.purchase_file, this.purchase_file_name);
            }
            comment_data = null
            this.purchase_file = null
            this.purchase_file_name = null;
            this.comment.asset_attachment = null
            this.comment.asset_comment = null

        }

    }
    // DOWNLOAD ATTACHMENT 

    public async onDownloadAttachment(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        this.tm.getTN("transfer_comment_list").setActive(parseInt(path.replace(`/${"transfer_comment_list"}/`, '')))
        let docDownload = await this.tm.getTN("transfer_comment_list").getActiveData();
        await docDownload.asset_attachment.downloadAttachP();

    }

    public async getEmployeeName(mm_id) {
        try {
            const empData = await this.transaction.getExecutedQuery(
                "d_o2c_employee",
                { loadAll: true, employee_id: mm_id }
            );
            if (empData && empData.length > 0) {
                return empData[0].full_name;
            } else {
                throw new Error("Employee not found");
            }
        } catch (error) {
            throw new Error("Error retrieving employee name: " + error.message);
        }
    }

    public async retrySave(sSuccessMessage: string, sErrMessage: string) {
        // Retry logic for commit operation
        let retryCount = 0;
        const maxRetries = 5;
        let commitSuccess = false;

        while (retryCount < maxRetries && !commitSuccess) {
            try {
                await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
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
    }
}
