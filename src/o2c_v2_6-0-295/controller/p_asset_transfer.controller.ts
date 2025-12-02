import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloEntitySet } from "kloBo_7-2-32";
import { KloController } from "kloTouch/jspublic/KloController";
import { d_o2c_profit_centre } from "o2c_v2/entity_gen/d_o2c_profit_centre";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_transfer")
export default class p_asset_transfer extends KloController {
  public purchase_file_name;
  public purchase_file;
  public comment_list = [];
  public comment;
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
  public async onPageEnter(oEvent) {
    const assetNumber = oEvent.navToParams.AssetNumber;
    // await this.tm.getTN("asset_creation_search").executeP();
    await this.tm.getTN("other_transfer_node").setData({});
    await this.tm.getTN("other_transfer_details").setData({});
    await this.tm.getTN("other_assets_expression").setData({});
    await this.tm.getTN("transfer_comment").setData({});
    this.tm
      .getTN("asset_creation_search")
      .setProperty("asset_number", assetNumber);
    await this.tm.getTN("asset_creation_search").executeP();
    await this.tm.getTN("asset_creation_list").setActiveFirst();

    // const assetCreationList = await this.tm.getTN("asset_creation_list").getData();
    // const index = assetCreationList.findIndex(asset => asset.asset_number === assetNumber);
    // if (index !== -1) {
    //     await this.tm.getTN("asset_creation_list").setActive(index);
    // }
  }
  public async onCreateRequest() {
    let list = await this.tm.getTN("asset_transfer_list").getData();
    let detail = await this.tm.getTN("asset_creation_details").getData();
    await detail.r_asset_transfer.fetch();
    if (detail.action_status == "Transferring") {
      const dialog = new sap.m.Dialog({
        title: "Warning",
        type: sap.m.DialogType.Message,
        state: sap.ui.core.ValueState.Warning,
        content: new sap.m.Text({
          text: "The transfer request for this asset number has already been created.",
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: () => {
            dialog.close();
          },
        }),
      });
      dialog.open();
      return;
    }
    // if (list.length > 0) {
    //   const dialog = new sap.m.Dialog({
    //     title: "Warning",
    //     type: sap.m.DialogType.Message,
    //     state: sap.ui.core.ValueState.Warning,
    //     content: new sap.m.Text({
    //       text: "The transfer request for this asset number has already been created.",
    //     }),
    //     beginButton: new sap.m.Button({
    //       text: "OK",
    //       press: () => {
    //         dialog.close();
    //       },
    //     }),
    //   });
    //   dialog.open();
    //   return;
    // }
    let allocationRequest = await this.transaction.getExecutedQuery(
      "d_asset_allocation_request",
      {
        loadAll: true,
        partialSelect: ["asset_no", "action_status"],
        asset_no: detail.asset_number,
        action_status: ["Pending", "Return Back"],
      }
    );
    let scrappingRequest = await this.transaction.getExecutedQuery(
      "d_asset_scrapping",
      {
        loadAll: true,
        partialSelect: ["asset_no", "action_status"],
        asset_no: detail.asset_number,
        action_status: ["Pending", "Return Back"],
      }
    );
    let clubbingRequest = await this.transaction.getExecutedQuery(
      "d_o2c_asset_clubbing",
      {
        loadAll: true,
        child_asset_number: detail.asset_number,
      }
    );
    if (scrappingRequest.length > 0) {
      sap.m.MessageBox.error(
        "Sorry, a transfer request cannot be generated as an scrapping request for this asset number is already in a Pending or Return Back state."
      );
      return;
    }
    if (allocationRequest.length > 0) {
      sap.m.MessageBox.error(
        "Sorry, a transfer request cannot be generated as an allocation request for this asset number is already in a Pending or Return Back state."
      );
      return;
    }
    if (clubbingRequest.length > 0) {
      sap.m.MessageBox.error(
        "Sorry, this asset number is a child asset number so it cannot transferred separately"
      );
      return;
    }
    let random_number = Math.floor(
      100000000 + Math.random() * 900000000
    ).toString();
    await this.tm
      .getTN("asset_creation_details/r_asset_transfer")
      .createEntityP(
        {
          s_object_type: -1,
          request_number: random_number,
          business_area: detail.business_area,
          asset_class: detail.asset_class,
          asset_sub_class: detail.asset_sub_class,
          location: detail.location,
          department: detail.department,
          asset_description: detail.asset_description,
          tag_number: detail.tag_number,
          company_code: detail.company_code,
          profit_center: detail.profit_center,
          functional_area: detail.functional_area,
          request_type: "TR"
        },
        null,
        "Failed",
        null,
        "First",
        true,
        true,
        false
      );
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
  public async onTransferDetails() {
    let list = await this.tm.getTN("asset_transfer_list").getData();
    let index = await this.tm.getTN("asset_transfer_list").getActiveIndex();
    let detail = await this.tm.getTN("asset_transfer_details").getData();
    let currentDetail = await this.tm.getTN("asset_creation_details").getData();

    // Check if r_transfer_comment entity is created
    // let isEntityCreated = await this.tm
    //   .getTN("asset_transfer_details/r_transfer_comment")
    //   .getData();

    // if (!isEntityCreated || isEntityCreated.length === 0) {
    //   await this.tm
    //     .getTN("asset_transfer_details/r_transfer_comment")
    //     .createEntityP(
    //       {},
    //       "Creation Successful",
    //       "Creation Failed",
    //       null,
    //       "First",
    //       true,
    //       true,
    //       false
    //     );
    // }

    // Set destination company code from current detail
    detail.desig_company_code = currentDetail.company_code;

    // Reset fields if transfer is temporary
    if (detail.transfer_sub_type === "TEMP") {
      detail.desig_business_area = currentDetail.business_area;
      detail.compliance_type = null;
      detail.desig_profit_center = null;
      detail.desig_functional_area = null;
      detail.receiver_name = null;
      detail.project_id = null;
      detail.project_bill_to = null;
      detail.action_status = null;
      detail.expected_return_date = null;
      detail.courier_number = null;
      detail.bond_number = null;
      detail.bond_start_date = null;
      detail.bond_end_date = null;
      detail.vendor = null;
    }

    // Reset fields if transfer is permanent
    if (detail.transfer_sub_type === "PMNT") {
      detail.desig_business_area = null;
      detail.compliance_type = null;
      detail.desig_profit_center = null;
      detail.desig_functional_area = null;
      detail.receiver_name = null;
      detail.project_id = null;
      detail.project_bill_to = null;
      detail.action_status = null;
      detail.courier_number = null;
      detail.bond_number = null;
      detail.bond_start_date = null;
      detail.bond_end_date = null;
    }

    // Update commenter name in comment list
    // let comment_list = await this.tm.getTN("comment_list").getData();
    // comment_list[0].commeter_name = await this.getEmployeeName(
    //   comment_list[0].s_created_by
    // );

    // Set gatepass type based on transfer subtype
    if (detail.transfer_sub_type === "PMNT") {
      detail.gatepass_type = "NGP";
    } else if (detail.transfer_sub_type === "TEMP") {
      detail.gatepass_type = "RGP";
    }

    // Flag other transfer logic
    await this.tm.getTN("other_transfer_node").setData(true);

    // Execute query to get visibility of other transfer details
    const otherAdditionCheck = await this.transaction.getExecutedQuery(
      "d_asset_transfer_visible",
      {
        loadAll: true,
        transfer_sub_type: detail.transfer_sub_type,
      }
    );

    await this.tm.getTN("other_transfer_details").setData(otherAdditionCheck);
  }

  // public async onSave() {
  //     let comment_list = this.tm.getTN("comment_list").getData();

  //     // Check if the comment is undefined or empty
  //     if (comment_list[0].asset_comment == undefined || comment_list[0].asset_comment == "") {
  //         sap.m.MessageBox.error("Please enter the comment before submitting the request.");
  //         return;
  //     }

  //     sap.m.MessageBox.confirm("Are you sure you want to submit this request?", {
  //         actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
  //         onClose: async (oAction) => {
  //             if (oAction === sap.m.MessageBox.Action.YES) {
  //                 try {
  //                     const detail = await this.tm.getTN("asset_transfer_details").getData();

  //                     const id_series = await this.tm.getTN("id_series_list").createEntityP(
  //                         { s_object_type: "asset_purchase_tr" },
  //                         "Transfer Request Generated",
  //                         "Creation Failed",
  //                         null,
  //                         "First",
  //                         true,
  //                         true,
  //                         false
  //                     );

  //                     detail.request_number = id_series.a_id;

  //                     await detail.r_transfer_other.fetch();
  //                     const other_assets_list = detail.r_transfer_other;

  //                     other_assets_list.forEach((item: any) => {
  //                         item.request_number = detail.request_number;
  //                     });

  //                     if (comment_list[0].asset_attachment.hasAttachment == true) {
  //                         comment_list[0].file_name = comment_list[0].asset_attachment.name;
  //                     }

  //                     await this.tm.commitP("Saved Successfully", "Save Failed", true, true);

  //                     // Create a non-editable TextArea to display the message
  //                     const messageText = `Request Number ${id_series.a_id} generated and sent for approval.`;
  //                     const textArea = new sap.m.TextArea({
  //                         value: messageText,
  //                         width: "100%",
  //                         editable: false
  //                     });

  //                     // Display the message in a dialog
  //                     const dialog = new sap.m.Dialog({
  //                         title: "Request Submitted",
  //                         content: [textArea],
  //                         beginButton: new sap.m.Button({
  //                             text: "OK",
  //                             press: function () {
  //                                 dialog.close();
  //                             }
  //                         })
  //                     });

  //                     dialog.open();

  //                     await this.flowMaster(1);

  //                 } catch (error) {
  //                     console.error("Save failed:", error);
  //                     sap.m.MessageToast.show("Save failed due to an error");
  //                 }
  //             } else {
  //                 sap.m.MessageToast.show("Submission cancelled");
  //             }
  //         }
  //     });
  //     await this.navTo({ H: true, S: "p_asset_deshboard" });
  // }

  public async onSave(oEvent) {
    try {
      // Validation: Require transfer type
      const detailData = await this.tm.getTN("asset_transfer_details").getData();
      if (detailData.transfer_type == null) {
        sap.m.MessageBox.error("Transfer type is required.", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
        });
        return;
      }

      // Validation: Require transfer sub type
      if (detailData.transfer_sub_type == null) {
        sap.m.MessageBox.error("Transfer sub type is required.", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
        });
        return;
      }

      // Fetch the comment
      this.comment = await this.tm.getTN('transfer_comment').getData();

      // Validation: Require asset_comment
      if (!this.comment.asset_comment && this.comment_list.length === 0) {
        sap.m.MessageBox.error("Please enter a comment.", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
        });
        return;
      }

      // Send the comment
      this.onTransferCommentSend();

      // Ask for user confirmation
      sap.m.MessageBox.confirm("Are you sure you want to submit this request?", {
        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
        onClose: async (oAction) => {
          if (oAction === sap.m.MessageBox.Action.YES) {
            try {
              // Get required data
              const detail = await this.tm.getTN("asset_transfer_details").getData();
              detail.approve_status = "Transferring";

              const assetCreationDetail = await this.tm
                .getTN("asset_creation_details")
                .getData();

              let assetNumber = [detail.asset_number];

              const clubbedAssetList = await this.tm
                .getTN("asset_mail_club_list")
                .getData();

              for (const clubbed of clubbedAssetList) {
                assetNumber.push(clubbed.child_asset_number);
              }

              const otherAssetList = await this.tm
                .getTN("other_assets_list")
                .getData();

              for (const other of otherAssetList) {
                assetNumber.push(other.asset_number);
              }

              // Load asset creation data
              const assetCreationData = await this.transaction.getExecutedQuery(
                "d_asset_creation",
                {
                  asset_number: assetNumber,
                  loadAll: true,
                }
              );

              // Set status
              for (const asset of assetCreationData) {
                asset.action_status = "Transferring";
              }

              const validationArray = await detailData.validateP();

              // If validation failed, show dialog and stop execution
              if (validationArray.length) {
                const oDialog = new sap.m.Dialog({
                  title: "Validation Errors",
                  type: "Message",
                  content: new sap.m.List({
                    items: validationArray.map((msg) =>
                      new sap.m.StandardListItem({
                        title: msg,
                        icon: "sap-icon://error",
                        iconColor: "Negative",
                        type: "Inactive"
                      })
                    )
                  }),
                  beginButton: new sap.m.Button({
                    text: "OK",
                    press: function () {
                      oDialog.close();
                    }
                  }),
                  afterClose: function () {
                    oDialog.destroy();
                  }
                });
              
                oDialog.open();
                return;
              }
              
              
              // Commit the data
              //const response = await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
              await this.retrySave("Saved Successfully","Save Failed");


              // Success message
              sap.m.MessageBox.information(
                `Request Number ${detail.request_number} has been generated and sent for approval.`,
                {
                  title: "Request Submitted",
                  onClose: async () => {
                    await this.flowMaster(1);
                    await this.navTo({ H: true, S: "p_asset_deshboard" });
                  },
                }
              );

              // Clear comment list only after successful flow
              this.comment_list = [];

            } catch (error) {
              console.error("Save failed:", error);
            }
          } else {
            console.log("Submission cancelled by user");
          }
        },
      });
    } catch (err) {
      console.error("Unexpected error during save:", err);
    }
  }


  public async flowMaster(level) {
    try {
      // Retrieve asset transfer details
      const detail = await this.tm.getTN("asset_transfer_details").getData();
      let team_head_id = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery('d_o2c_profit_centre', { 'company_code': detail.company_code, 'profit_center': detail.profit_center, loadAll: true })
      // Execute the query for the master table
      const main_master_table = await this.transaction.getExecutedQuery(
        "d_asset_purchase_master",
        {
          company_code: detail.company_code,
          // business_area: detail.business_area,
          request_type: "TR",
          level: level,
          loadAll: true,
        }
      );

      // Filter the master table based on the current level
      const masterTable = main_master_table.filter(
        (item) => parseInt(item.level) === parseInt(level)
      );
      // Create the asset action item with role information
      await this.transaction.createEntityP("d_asset_action_item", {
        s_object_type: -1,
        request_number: detail.request_number,
        request_type: "TR",
        asset_number: detail.asset_number,
        tag_number: detail.tag_number,
        sub_asset_number: detail.sub_asset_number,
        action_status: "Pending",
        company_code: detail.company_code,
        business_area: detail.business_area,
        profit_center: detail.profit_center,
        functional_area: detail.functional_area,
        role_name: masterTable[0].role,
        team_head: team_head_id[0].team_head,
        approval_sequence: 1,
      });

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: detail.request_number,
        request_type: "TR",
        asset_number: detail.asset_number,
        tag_number: detail.tag_number,
        sub_asset_number: detail.sub_asset_number,
        action_status: "Pending",
        company_code: detail.company_code,
        business_area: detail.business_area,
        role_name: masterTable[0].role,
        // action_required_by: masterTable[0].user_id,
        profit_center: detail.profit_center,
        functional_area: detail.functional_area,
        approval_sequence: 1,
      });

      detail.status = "Pending";

      await this.onMailSend(detail.company_code, masterTable[0].role, detail.request_number)


      // Commit the transaction for approval
      // await this.tm.commitP("Send For Approval", "Send Failed", true, true);
      await this.retrySave("Send For Approval", "Send Failed");
    } catch (error) {
      console.error("Flow Master failed:", error);
      sap.m.MessageToast.show("Flow Master failed due to an error");
    }
  }
  public async getBusinessAreaName(business_area) {
    let businessArea = await this.transaction.getExecutedQuery(
      "d_o2c_business_area",
      {
        business_area: business_area,
        partialSelect: ["business_area", "name"],
        loadAll: true,
      }
    );

    return businessArea[0].name;
  }
  public async getCompanyCodeName(company_code) {
    let companyCode = await this.transaction.getExecutedQuery(
      "d_o2c_company_info",
      {
        company_code: company_code,
        partialSelect: ["company_code", "name"],
        loadAll: true,
      }
    );
    return companyCode[0].name;
  }
  public async getModelNumber(asset_number) {
    let modelNumber = await this.transaction.getExecutedQuery(
      "d_asset_creation",
      {
        asset_number: asset_number,
        partialSelect: ["model_number"],
        loadAll: true,
      }
    );
    return modelNumber[0].model_number;
  }
  public async getSerialNumber(asset_number) {
    let serialNumber = await this.transaction.getExecutedQuery(
      "d_asset_creation",
      {
        asset_number: asset_number,
        partialSelect: ["serial_number"],
        loadAll: true,
      }
    );
    return serialNumber[0].serial_number;
  }
  public async onSelectAssetNumber(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/other_assets_list/", ""));
    let list = await this.tm.getTN("other_assets_list").getData();
    let detail = await this.tm.getTN("asset_creation_details").getData();

    if (!list[index].asset_number) {
      return;
    }

    let clubbingData = await this.transaction.getExecutedQuery(
      "d_o2c_asset_clubbing",
      { loadAll: true, child_asset_number: list[index].asset_number }
    );

    if (clubbingData.length > 0) {
      sap.m.MessageBox.error(
        "Sorry, the selected asset number can't be selected as it is clubbed with another asset number."
      );
      list[index].asset_number = null;
      await this.tm.getTN("other_assets_list").refresh();
      return;
    }
    if (list[index].asset_number == detail.asset_number) {
      sap.m.MessageBox.error(
        "Sorry, the same asset number can not be added here."
      );
      list[index].asset_number = null;
      await this.tm.getTN("other_assets_list").refresh();
      return;
    }
    let creationData = await this.transaction.getExecutedQuery(
      "d_asset_creation",
      { loadAll: true, asset_number: list[index].asset_number }
    );
    list[index].tag_number = creationData[0].tag_number;
    list[index].asset_description = creationData[0].asset_description;
    await this.tm.getTN("other_assets_list").refresh();
  }

  public async onBusinessAreaChange() {
    let basicDetail = await this.tm.getTN("asset_creation_details").getData();
    let currentDetail = await this.tm.getTN("asset_transfer_details").getData();

    if (currentDetail.transfer_sub_type === "PMNT") {
      if (currentDetail.desig_business_area === basicDetail.business_area) {
        sap.m.MessageBox.error(
          "For permanent transfers, the designation business area should not be the same as the current business area."
        );
        currentDetail.desig_business_area = null;
      }
    }
    currentDetail.desig_functional_area = null;
    await this.tm.getTN("asset_transfer_details").refresh();
  }
  public async onClickingOtherAssetsButton() {
    await this.tm.getTN("other_assets_expression").setData(true);
    let detail = await this.tm.getTN("asset_creation_details").getData();
    await this.tm
      .getTN("other_assets")
      .setProperty("business_area", detail.business_area);
    await this.tm.getTN("other_assets").setProperty("status", "In Store");
    await this.tm.getTN("other_assets").executeP();
    await this.tm.getTN('other_assets_list').createEntityP({ s_object_type: -1 }, null, null, null, "First", false, false, false);
  }
  public async onChangingExpectedReturnDate() {
    let detail = await this.tm.getTN("asset_transfer_details").getData();

    let currentDate = new Date();
    if (detail.expected_return_date < currentDate) {
      sap.m.MessageBox.error(
        "Expected return date cannot be earlier than the current date.",
        {
          title: "Invalid Date",
        }
      );
      detail.expected_return_date = null;
      await this.tm.getTN("asset_transfer_details").refresh();
    }
  }
  public async onChangingBondDate() {
    const detail = await this.tm.getTN("asset_transfer_details").getData();

    // Proceed only if both dates are provided
    if (detail.bond_start_date != null && detail.bond_end_date != null) {
      if (detail.bond_start_date > detail.bond_end_date) {
        sap.m.MessageBox.error(
          "The bond start date must always be earlier than the bond end date.",
          {
            title: "Invalid Date",
          }
        );

        detail.bond_start_date = null;
        detail.bond_end_date = null;

        await this.tm.getTN("asset_transfer_details").refresh(true);
      }
    }
  }

  // mail notification
  public async onMailSend(companyCode, role, requestNumber) {
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

    if (emp_ids.length > 0) {
      await this.tm.getTN("transfer_request_mail").setProperty('type', "transferRequest");
      await this.tm.getTN("transfer_request_mail").setProperty('employee', emp_ids);
      await this.tm.getTN("transfer_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("transfer_request_mail").executeP();
    }

  }

  // COMMENT 

  public async documentUpload(oEvent) {
    this.purchase_file = oEvent.mParameters.files[0];
    this.purchase_file_name = oEvent.mParameters.files[0].name;
  }

  public async onTransferCommentSend() {
    let detailData = await this.tm.getTN('asset_transfer_details').getData();
    this.comment = await this.tm.getTN('transfer_comment').getData();
    if (this.comment.asset_comment != undefined && this.comment.asset_comment != '' && this.comment.asset_comment != null) {
      let currentUserId = (await this.transaction.get$User()).login_id;
      let commenterName = await this.getEmployeeName(currentUserId.toUpperCase());
      let comment_data = await this.tm.getTN('comment_list').createEntityP({ s_object_type: -1, request_type: "TR", asset_guid: detailData.asset_guid, asset_comment: this.comment.asset_comment, commeter_name: commenterName }, null, null, null, "First", false, false, false);

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
  // DOWNLOAD ATTECHMENT 

  public async onDownloadAttachment(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    this.tm.getTN("comment_list").setActive(parseInt(path.replace(`/${"comment_list"}/`, '')))
    let docDownload = await this.tm.getTN("comment_list").getActiveData();
    await docDownload.asset_attachment.downloadAttachP();

  }

  public async onChangingTransferType() {
    const detailData = await this.tm.getTN("asset_transfer_details").getData();
    detailData.transfer_sub_type = null;
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
//25 Nov 12:12PM