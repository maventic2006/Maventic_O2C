import { KloEntitySet } from "kloBo/KloEntitySet";
import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
import { d_asset_action_item } from "o2c_v2/entity_gen/d_asset_action_item";
import { d_asset_approve_status } from "o2c_v2/entity_gen/d_asset_approve_status";
import { d_asset_purchase_approval } from "o2c_v2/entity_gen/d_asset_purchase_approval";
import { d_asset_purchase_master } from "o2c_v2/entity_gen/d_asset_purchase_master";
import { d_asset_transfer_master } from "o2c_v2/entity_gen/d_asset_transfer_master";
import { d_o2c_employee } from "o2c_v2/entity_gen/d_o2c_employee";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_action")
export default class p_asset_action extends KloController {
  public roleid;
  public userid;
  public transfer_file;
  public transfer_file_name;
  public purchase_file_name;
  public purchase_file;
  public allocation_file_name;
  public allocation_file;
  public scrapping_file_name;
  public scrapping_file;
  public allo_comment_list = [];
  public allo_comment;
  public scrap_comment_list = [];
  public scrap_comment;
  public pur_comment_list = [];
  public transferCommentList = [];
  public pcomment;
  public tcomment;
  public onInit() { }
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
  public async onPageEnter() {
    this.userid = (await this.transaction.get$User()).login_id;
    this.roleid = (await this.transaction.get$Role()).role_id;
    this.tm.getTN("login_role").setData({});
    this.tm.getTN("create_comment").setData({});
    this.tm.getTN("other_transfer_details").setData({});
    this.tm.getTN("purchase_comment").setData({});
    this.tm.getTN("transfer_comment").setData({});
    this.tm.getTN("other_details_visibility").setData({});
    this.tm.getTN("allocation_comment").setData({});
    this.tm.getTN("scrapping_comment").setData({});
    this.tm.getTN("other_transfer_node").setData({});
    this.tm.getTN("allocation_details_characterstic").setData({});
    this.tm.getTN("purchase_qnt_visibility").setData({})



    //

    this.tm.getTN("login_role").setProperty("role", this.roleid);
    this.tm.getTN("login_role").setProperty("user_id", this.userid.toLowerCase());
    if (this.userid == undefined) {
      this.userid = "x";
    }




    this.tm.getTN("action_search").setProperty("action_status", "Pending");

    await this.tm.getTN("action_search").executeP();
  }
  public onEdit() {
    this.setMode("EDIT");
  }

  public async navToDetails(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/action_list/", ""));
    await this.tm.getTN("action_list").setActive(index);
    let data = await this.tm.getTN("action_list").getActiveData();
    if (data.request_type == "PR") {

      // it is going to id basis for metro
      // need change

      let master_apr_table = <KloEntitySet<d_asset_purchase_master>>(await this.transaction.getExecutedQuery("d_asset_purchase_master", { company_code: data.company_code, request_type: "PR", loadAll: true, role: this.roleid }));
      let visibility = {
        "approved_quantity": master_apr_table[0].approved_quantity,
        "in_store": master_apr_table[0].in_store,
        "purchase_quantity": master_apr_table[0].purchase_quantity
      }
      this.tm.getTN("purchase_qnt_visibility").setData(visibility)
      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_purchase" });
    } else if (data.request_type == "TR") {
      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_transfer" });
    } else if (data.request_type == "AL") {
      // asset_sub_class

      let assetDetail = await this.transaction.getExecutedQuery(
        'd_asset_creation',
        {
          'asset_number': data.asset_number,
          loadAll: true
        });
      let allocationCharacterstic = await this.transaction.getExecutedQuery(
        'd_asset_allocation_config',
        {
          'asset_class': assetDetail[0].asset_class,
          'sub_asset_class': assetDetail[0].asset_sub_class,
          loadAll: true
        });
      if (allocationCharacterstic.length > 0) {
        await this.tm.getTN("allocation_details_characterstic").setData(allocationCharacterstic[0]);
      }


      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_allocation" });
    } else if (data.request_type == "SC") {
      // let mainMasterTable = <KloEntitySet<d_asset_transfer_master>>(
      //   await this.transaction.getExecutedQuery("d_asset_scrap_master", {
      //     company_code: data.company_code,
      //     business_area: data.business_area,
      //     asset_type: data.asset_type,
      //     request_type: "SC",
      //     loadAll: true,
      //   })
      // );
      // let masterTable = mainMasterTable.filter(
      //   (item) => item.user_id.toUpperCase() == this.userid.toUpperCase()
      // );
      // if (masterTable.length) {
      //   let level = parseFloat(masterTable[0].lavel) + 1;
      //   let nextRole = mainMasterTable.filter(
      //     (item) => parseFloat(item.lavel) == parseFloat(level)
      //   );
      //   if (nextRole.length) {
      //     this.tm
      //       .getTN("other_details_visibility")
      //       .setProperty("button_name", "Send To Next Level");
      //   } else {
      //     this.tm
      //       .getTN("other_details_visibility")
      //       .setProperty("button_name", "Approve");
      //   }
      // }


      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_scrapping" });
    } else {
    }
  }

  /*[FINDING APPROVER NAME]*/
  public async approverName(id) {
    let approver = <KloEntitySet<d_o2c_employee>>(await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: id, partialSelect: ["first_name", "last_name"], loadAll: true }));
    if (approver.length > 0 && id) {
      return approver[0].full_name;
    }
    return "___";
  }

  /*[DOWNLOAD ATTACHMENT]*/
  public async onDownloadAttech(oEvent, param) {
    let path = this.getPathFromEvent(oEvent);
    this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, "")));
    let docdownload = await this.tm.getTN(param.trans_node).getActiveData();
    await docdownload.asset_attachment.downloadAttachP();
  }
  /* [COMMON CODE] */
  /* [PURCHASE REQUEST CODE START FROM HERE] */

  /* [UPLOAD ATTACHMENT] */ // Function of Upload Attachment
  public async documentUpload(oEvent) {
    this.purchase_file = oEvent.mParameters.files[0];
    this.purchase_file_name = oEvent.mParameters.files[0].name;
  }


  /*----------------------------------------- * [PURCHASE CODE STARTS] *----------------------------*/

  /* [CONFIRMATION POPUP ] */ // Function of Confirmation for Cancelling Changes in Detail
  public async onPurchase(oEvent, param) {

    let listData = this.tm.getTN("purchase_details").getData();
    sap.m.MessageBox.confirm(`Do you want to ${param.type} the  Asset Purchase Request Number ${listData.purchase_request}`, {
      title: "Confirm",
      actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
      onClose: (oAction) => {
        if (oAction == "OK") {
          if (param.type == "Approve") {
            this.purchase_approval();
          } else if (param.type == "Reject") {
            this.purchase_reject();
          }
        }
      },
    }
    );
  }

  /* [PURCHASE REQUEST APPROVAL] */

  public async purchase_approval() {
    const busyDialog = new sap.m.BusyDialog().setText("Approving...").open();

    try {
      this.pcomment = await this.tm.getTN("purchase_comment").getData();
      const listData = this.tm.getTN("purchase_details").getData();

      const hasComment = !!this.pcomment.commentbox;
      const hasApprovedQty = !!listData.approved_quantity;
      const needsApproval = this.pur_comment_list.length && hasApprovedQty;

      // Check 1: Approved Quantity must be entered
      if (!hasApprovedQty) {
        sap.m.MessageBox.error("Please enter Approved Quantity", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
        });
        return;
      }

      // Check 3: pur_comment_list must not be empty
      if (!this.pur_comment_list.length && !hasComment) {
        sap.m.MessageBox.error("Please enter Comment", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
        });
        return;
      }
      if (hasComment) {
        this.onPurchase_Comment_sent();
      }


      const currentApprovalData = this.tm.getTN("action_detail").getData();
      const assetApprovalTable = <KloEntitySet<d_asset_approve_status>>(
        await this.transaction.getExecutedQuery("d_asset_approve_status", {
          request_number: listData.purchase_request,
          action_status: "Pending",
          role_name: this.roleid,
          loadAll: true
        })
      );
      const mainMasterTable = <KloEntitySet<d_asset_purchase_master>>(
        await this.transaction.getExecutedQuery("d_asset_purchase_master", {
          company_code: listData.company_code,
          request_type: listData.request_type,
          loadAll: true
        })
      );

      const currentRoleEntry = mainMasterTable.find(item => item.role === this.roleid);
      const nextLevel = mainMasterTable.filter(item => parseFloat(item.level) === currentRoleEntry.level + 1);

      const approvalEntityUpdate = async (status: string) => {
        const approverName = await this.approverName(this.userid);
        currentApprovalData.action_status = status;
        currentApprovalData.approved_on = new Date();
        currentApprovalData.role_name = this.roleid;
        currentApprovalData.action_required_by = this.userid;
        currentApprovalData.action_required_by_name = approverName;

        assetApprovalTable[0].action_status = "Approved";
        assetApprovalTable[0].approved_on = new Date();
        assetApprovalTable[0].action_required_by = this.userid;
        assetApprovalTable[0].action_required_by_name = approverName;
      };

      if (nextLevel.length) {
        await approvalEntityUpdate("Pending");

        await this.transaction.createEntityP("d_asset_approve_status", {
          s_object_type: -1,
          request_number: listData.purchase_request,
          request_type: "PR",
          action_status: "Pending",
          company_code: listData.company_code,
          business_area: listData.business_area,
          role_name: nextLevel[0].role,
          approval_sequence: 1,
          profit_center: listData.profit_center,
          functional_area: listData.functional_area
        });

        sap.m.MessageBox.success(`Request Number ${listData.purchase_request} has been Approved and sent for next approval`, {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK]
        });

      } else {

        const hasPurchaseQty = listData.purchase_quantity !== null && listData.purchase_quantity !== undefined && listData.purchase_quantity !== "";
        const hasInStoreQty = listData.in_store_quantity !== null && listData.in_store_quantity !== undefined && listData.in_store_quantity !== "";

        if (!hasPurchaseQty || !hasInStoreQty) {
          sap.m.MessageBox.error("Please enter either Purchase Quantity or In Store Quantity", {
            title: "Alert",
            actions: [sap.m.MessageBox.Action.OK],
          });
          return;
        }


        await approvalEntityUpdate("Approved");
        listData.status = "Approved";

        sap.m.MessageBox.success(`Request Number ${listData.purchase_request} has been successfully Approved.`, {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK]
        });
      }

      this.pur_comment_list = [];

      // await this.tm.commitP("Approved", "Failed", true, true);
      await this.retrySave("Approved", "Failed");

      const mailActionType = nextLevel.length ? "sendForNextAppr" : "finalAppr";
      const nextRole = nextLevel.length ? nextLevel[0].role : "";

      await this.onPurchaseMailSend(
        listData.company_code,
        listData.business_area,
        listData.profit_center,
        nextRole,
        listData.purchase_request,
        listData.s_created_by,
        mailActionType,
        currentApprovalData.team_head
      );

      await this.tm.getTN("action_list").resetP(true);
      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });

    } catch (err) {
      console.error("Error during purchase approval:", err);
      sap.m.MessageBox.error("An error occurred during approval. Please try again.");
    } finally {
      busyDialog.close();
    }
  }


  /* [PURCHASE REQUEST REJECT] */

  public async purchase_reject() {

    let oBusyDailog = new sap.m.BusyDialog().setText("Rejecting...").open();
    let listData = this.tm.getTN("purchase_details").getData();
    this.pcomment = await this.tm.getTN("purchase_comment").getData();
    let currentAprData = this.tm.getTN("action_detail").getData();
    let flag = false;

    if (this.pur_comment_list.length) {
      if (this.pcomment.commentbox) {
        this.onPurchase_Comment_sent();
      }
      flag = true;
    } else if (this.pcomment.commentbox) {
      this.onPurchase_Comment_sent();
      flag = true;
    }
    if (flag) {
      let asset_approve_table = <KloEntitySet<d_asset_approve_status>>(await this.transaction.getExecutedQuery("d_asset_approve_status", { request_number: listData.purchase_request, action_status: "Pending", role_name: this.roleid, loadAll: true }));


      asset_approve_table[0].approved_on = new Date();
      asset_approve_table[0].action_required_by_name = await this.approverName(this.userid);
      asset_approve_table[0].action_status = "Rejected";
      asset_approve_table[0].action_required_by = this.userid;


      currentAprData.role_name = this.roleid;
      currentAprData.action_status = "Rejected";
      currentAprData.approved_on = new Date();
      currentAprData.action_required_by = this.userid;
      currentAprData.action_required_by_name = await this.approverName(this.userid);

      listData.status = "Rejected";

      // await this.tm.commitP("Rejected", "Failed", true, true);
      await this.retrySave("Rejected", "Failed");

      // mail notification
      await this.onPurchaseMailSend(listData.company_code, listData.business_area, listData.profit_center, "", listData.purchase_request, listData.s_created_by, "reject", currentAprData.team_head);

      await this.tm.getTN("action_list").resetP(true);
      await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
    }
    else {
      oBusyDailog.close();
      if (1) {
        sap.m.MessageBox.error("Please Enter Comment... ", {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: null,
        });
      }
      //else {
      //   sap.m.MessageBox.error("Please Enter approved Quantity ", {
      //     title: "Alert",
      //     actions: [sap.m.MessageBox.Action.OK],
      //     onClose: null,
      //   });
      // }
    }
    oBusyDailog.close();


  }

  /* [CHECKING APPROVE QUANTITY] */ //purchase approved quantity
  public async onApprove_quantity_change(oEvent) {

    let listData = this.tm.getTN("purchase_details").getData();
    if (parseInt(listData.requested_quantity) < parseInt(listData.approved_quantity) || parseInt(listData.approved_quantity) <= 0 || listData.approved_quantity == "") {
      sap.m.MessageBox.error("Approve quantity should not be higher than requested quantity or" + "should not be 0",
        {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: null,
        }
      );
      listData.approved_quantity = null;
    }
  }

  public async pur_in_store_quantity(oEvent) {

    let listData = this.tm.getTN("purchase_details").getData();
    if ((parseInt(listData.purchase_quantity) + parseInt(listData.in_store_quantity)) > parseInt(listData.in_store_quantity.approved_quantity)) {
      sap.m.MessageBox.error("Approve quantity should not be higher than requested quantity or" + "should not be 0",
        {
          title: "Alert",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: null,
        }
      );
      listData.approved_quantity = null;
    }
  }



  public async onPurchase_Comment_sent() {
    let listData = await this.tm.getTN("purchase_details").getData();
    this.pcomment = await this.tm.getTN("purchase_comment").getData();

    if (this.pcomment.commentbox != undefined && this.pcomment.commentbox != "" && this.pcomment.commentbox != null) {
      //await this.transaction.createEntityP('d_asset_purchase_approval', {s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox});
      let comment_data = await this.tm.getTN("purchase_comment_list").createEntityP({ s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: this.pcomment.commentbox }, null, null, null, "First", false, false, false);
      this.pur_comment_list.push(comment_data);

      //await this.tm.getTN('purchase_comment_list').createEntityP(0,{s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox},true)
      if (this.purchase_file) {
        await comment_data.asset_attachment.setAttachmentP(
          this.purchase_file,
          this.purchase_file_name
        );
      }

      comment_data = null;
      this.purchase_file = null;
      this.purchase_file_name = null;
      this.pcomment.attechment_url = null;
      this.pcomment.commentbox = null;
    }
  }


  //purchase request code ends here...

  /*----------------------------------------- * [PURCHASE COMMENT ENDS] *----------------------------*/

  //Transfer Code Starts from here

  public async documentTransferUpload(oEvent) {
    this.transfer_file = oEvent.mParameters.files[0];
    this.transfer_file_name = oEvent.mParameters.files[0].name;
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
  public async onTransferCommentSend() {
    let listData = await this.tm.getTN("transfer_details").getData();
    this.tcomment = await this.tm.getTN("transfer_comment").getData();

    if (
      this.tcomment.commentbox != undefined &&
      this.tcomment.commentbox != "" &&
      this.tcomment.commentbox != null
    ) {
      let comment_data = await this.tm.getTN("comment_list").createEntityP(
        {
          s_object_type: -1,
          request_number: listData.request_number,
          request_type: "TR",
          asset_guid: listData.asset_guid,
          asset_comment: this.tcomment.commentbox,
          commeter_name: await this.getEmployeeName(this.userid),
        },
        null,
        null,
        null,
        "First",
        false,
        false,
        false
      );
      this.transferCommentList.push(comment_data);
      if (this.transfer_file) {
        await comment_data.asset_attachment.setAttachmentP(
          this.transfer_file,
          this.transfer_file_name
        );
      }

      comment_data = null;
      this.transfer_file = null;
      this.transfer_file_name = null;
      this.tcomment.attechment_url = null;
      this.tcomment.commentbox = null;
    }
  }
  public async onDownloadTransferAttach(oEvent, param) {
    let path = this.getPathFromEvent(oEvent);
    this.tm
      .getTN(param.trans_node)
      .setActive(parseInt(path.replace(`/${param.trans_node}/`, "")));
    let docdownload = await this.tm.getTN(param.trans_node).getActiveData();
    await docdownload.asset_attachment.downloadAttachP();
  }

  public async transfer_approval() {
    let transferFlag = false;
    this.tcomment = await this.tm.getTN("transfer_comment").getData();
    if (this.transferCommentList.length > 0) {
      transferFlag = true;
      if (this.tcomment.commentbox) {
        await this.onTransferCommentSend();
      }
    }
    else if (this.tcomment.commentbox) {
      transferFlag = true;
      await this.onTransferCommentSend();
    }
    if (transferFlag) {
      try {
        sap.m.MessageBox.confirm(
          "Are you sure you want to approve this transfer request?",
          {
            title: "Confirmation",
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async (oAction) => {
              if (oAction === sap.m.MessageBox.Action.YES) {
                const commentList = this.tm.getTN("comment_list").getData();
                if (commentList[0].asset_attachment.hasAttachment) {
                  commentList[0].file_name =
                    commentList[0].asset_attachment.name;
                }

                const listData = this.tm.getTN("transfer_details").getData();
                const currentAprData = this.tm.getTN("action_detail").getData();

                const assetApproveTable = <
                  KloEntitySet<d_asset_approve_status>
                  >await this.transaction.getExecutedQuery(
                    "d_asset_approve_status",
                    {
                      request_number: listData.request_number,
                      action_status: "Pending",
                      role_name: this.roleid,
                      // company_code: listData.company_code,
                      // business_area: listData.business_area,
                      // request_type: listData.request_type,
                      // action_required_by: this.userid,
                      loadAll: true,
                    }
                  );

                const mainMasterTable = <KloEntitySet<d_asset_transfer_master>>(
                  await this.transaction.getExecutedQuery(
                    "d_asset_purchase_master",
                    {
                      company_code: listData.company_code,
                      // business_area: listData.business_area,
                      request_type: listData.request_type,
                      loadAll: true,
                    }
                  )
                );

                const masterTable = mainMasterTable.filter(
                  (item) =>
                    item.role == this.roleid
                );
                const level = masterTable[0].level + 1;
                const nextApproverId = mainMasterTable.filter(
                  (item) => parseInt(item.level) == parseInt(level)
                );

                if (nextApproverId.length) {
                  currentAprData.action_status = "Pending";
                  currentAprData.approved_on = new Date();
                  currentAprData.action_required_by_name =
                    await this.approverName(this.userid);
                  currentAprData.role_name = this.roleid;
                  currentAprData.action_required_by = this.userid;
                  assetApproveTable[0].action_status = "Approved";
                  assetApproveTable[0].approved_on = new Date();
                  assetApproveTable[0].action_required_by_name =
                    await this.approverName(this.userid);
                  assetApproveTable[0].action_required_by = this.userid;
                  await this.transaction.createEntityP(
                    "d_asset_approve_status",
                    {
                      s_object_type: -1,
                      request_number: listData.request_number,
                      request_type: "TR",
                      action_status: "Pending",
                      company_code: listData.company_code,
                      business_area: listData.business_area,
                      profit_center: listData.profit_center,
                      functional_area: listData.functional_area,
                      asset_number: listData.asset_number,
                      sub_asset_number: listData.sub_asset_number,
                      tag_number: listData.tag_number,
                      role_name: nextApproverId[0].role,
                      approval_sequence: 1,
                      action_required_by: nextApproverId[0].user_id,
                    }
                  );

                  // mail notification
                  let actionType = "sendForNextAppr";
                  await this.onTransferMailSend(listData.company_code, nextApproverId[0].role, listData.request_number, listData.s_created_by, actionType);

                  await new Promise<void>((resolve) => {
                    sap.m.MessageBox.success(
                      `Request Number ${listData.request_number} has been Approved and sent for next approval`,
                      {
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: () => resolve(),
                      }
                    );
                  });
                } else {
                  currentAprData.action_status = "Approved";
                  currentAprData.approved_on = new Date();
                  currentAprData.role_name = this.roleid;
                  currentAprData.action_required_by_name = await this.approverName(this.userid);
                  currentAprData.action_required_by = this.userid;
                  assetApproveTable[0].action_status = "Approved";
                  assetApproveTable[0].approved_on = new Date();
                  assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);
                  assetApproveTable[0].action_required_by = this.userid;

                  listData.status = "Approved";
                  let assetNumbers = [];
                  let clubbedList = await listData.r_transfer_club.fetch();
                  let otherAssetList = await listData.r_transfer_other.fetch();

                  for (let i = 0; i < clubbedList.length; i++) {
                    assetNumbers.push(clubbedList[i].child_asset_number);
                  }
                  for (let i = 0; i < otherAssetList.length; i++) {
                    assetNumbers.push(otherAssetList[i].asset_number);
                  }
                  assetNumbers.push(listData.asset_number);

                  let assetCreationData = await this.transaction.getExecutedQuery(
                    "d_asset_creation",
                    {
                      asset_number: assetNumbers,
                      loadAll: true,
                    }
                  );

                  for (let i = 0; i < assetCreationData.length; i++) {
                    assetCreationData[i].action_status = null;
                    await this.transaction.createEntityP("d_asset_log_table", {
                      s_object_type: -1,
                      request_number: listData.request_number,
                      company_code: assetCreationData[i].company_code,
                      business_area: assetCreationData[i].business_area,
                      asset_number: assetCreationData[i].asset_number,
                      tag_number: assetCreationData[i].tag_number,
                      log_type: "Transfer Request",
                    });
                  }

                  if (listData.gatepass_type == "NGP") {
                    const gatepass_idseries = await this.transaction.createEntityP("d_idseries", {
                      s_object_type: "ngp",
                    });
                    listData.gatepass_number = gatepass_idseries.a_id;
                  }
                  if (listData.gatepass_type == "RGP") {
                    const gatepass_idseries = await this.transaction.createEntityP("d_idseries", {
                      s_object_type: "rgp",
                    });
                    listData.gatepass_number = gatepass_idseries.a_id;
                  }

                  await this.onTransferMailSend(listData.company_code, "", listData.request_number, listData.s_created_by, "finalAppr");

                  if (listData.transfer_type === "INTER") {
                    await new Promise<void>((resolve) => {
                      sap.m.MessageBox.confirm(
                        `Request Number ${listData.request_number} has been successfully Approved. Would you like to download the Gatepass?`,
                        {
                          title: "Success",
                          actions: ["Download Gatepass", "No"],
                          onClose: async (oAction) => {
                            if (oAction === "Download Gatepass") {
                              await this.downloadGatepass();
                            }
                            resolve();
                          },
                        }
                      );
                    });
                  } else {
                    await new Promise<void>((resolve) => {
                      sap.m.MessageBox.success(
                        `Request Number ${listData.request_number} has been successfully Approved.`,
                        {
                          title: "Success",
                          actions: [sap.m.MessageBox.Action.OK],
                          onClose: () => {
                            resolve();
                          }
                        }
                      );
                    });
                  }

                  await this.changeAssetStatus();
                }


                // await this.tm.commitP("Approved", "Failed", true, true);
                await this.retrySave("Approved", "Failed");
                await this.tm.getTN("action_list").resetP(true);
                await this.navTo({
                  H: true,
                  S: "p_asset_action",
                  SS: "pa_action",
                });
              }
            },
          }
        );
      } catch (error) {
        console.error("Approval failed:", error);
        sap.m.MessageToast.show("Approval failed due to an error");
      }
    }
    else {
      sap.m.MessageBox.error("Please Enter Comment... ", {
        title: "Alert",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
    }
  }

  public async transfer_reject() {
    let transferFlag = false;
    this.tcomment = await this.tm.getTN("transfer_comment").getData();
    if (this.transferCommentList.length > 0) {
      transferFlag = true;
      if (this.tcomment.commentbox) {
        await this.onTransferCommentSend();
      }
    }
    else if (this.tcomment.commentbox) {
      transferFlag = true;
      await this.onTransferCommentSend();
    }
    if (transferFlag) {
      try {
        sap.m.MessageBox.confirm(
          "Are you sure you want to reject this transfer request?",
          {
            title: "Confirmation",
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async (oAction) => {
              if (oAction === sap.m.MessageBox.Action.YES) {
                const listData = this.tm.getTN("transfer_details").getData();
                const commentList = this.tm.getTN("comment_list").getData();

                if (commentList[0].asset_attachment.hasAttachment) {
                  commentList[0].file_name =
                    commentList[0].asset_attachment.name;
                }

                const currentAprData = this.tm.getTN("action_detail").getData();

                const assetApproveTable = <
                  KloEntitySet<d_asset_approve_status>
                  >await this.transaction.getExecutedQuery(
                    "d_asset_approve_status",
                    {
                      request_number: listData.request_number,
                      action_status: "Pending",
                      role_name: this.roleid,
                      request_type: listData.request_type,
                      loadAll: true,
                    }
                  );

                currentAprData.action_status = "Rejected";
                currentAprData.approved_on = new Date();
                currentAprData.action_required_by = this.userid;
                currentAprData.action_required_by_name = await this.approverName(this.userid);

                assetApproveTable[0].action_status = "Rejected";
                assetApproveTable[0].approved_on = new Date();
                assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);
                assetApproveTable[0].action_required_by = this.userid;
                listData.status = "Rejected";

                let assetNumbers = [];
                let clubbedList = await listData.r_transfer_club.fetch();
                let otherAssetList = await listData.r_transfer_other.fetch();

                for (let i = 0; i < clubbedList.length; i++) {
                  assetNumbers.push(clubbedList[i].child_asset_number);
                }
                for (let i = 0; i < otherAssetList.length; i++) {
                  assetNumbers.push(otherAssetList[i].asset_number);
                }
                assetNumbers.push(listData.asset_number)
                let assetCreationData = await this.transaction.getExecutedQuery(
                  "d_asset_creation",
                  {
                    asset_number: assetNumbers,
                    loadAll: true,
                  }
                );
                for (let i = 0; i < assetCreationData.length; i++) {
                  assetCreationData[i].action_status = null;
                }

                // await this.tm.commitP("Rejected", "Failed", true, true);
                await this.retrySave("Rejected", "Failed");
                await this.tm.getTN("action_list").resetP(true);

                // mail notification
                await this.onTransferMailSend(listData.company_code, "", listData.request_number, listData.s_created_by, "reject");

                sap.m.MessageBox.success(
                  `This Transfer request has been successfully rejected.`,
                  {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: async () => {
                      await this.navTo({
                        H: true,
                        S: "p_asset_action",
                        SS: "pa_action",
                      });
                    },
                  }
                );
              }
            },
          }
        );
      } catch (error) {
        console.error("Rejection failed:", error);
        sap.m.MessageToast.show("Rejection failed due to an error");
      }
    } else {
      sap.m.MessageBox.error("Please Enter Comment... ", {
        title: "Alert",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
    }
  }

  public async transfer_return_bank() {
    this.tcomment = await this.tm.getTN("transfer_comment").getData();
    if (this.transferCommentList.length > 0) {
      try {
        sap.m.MessageBox.confirm(
          "Are you sure you want to return this transfer request back?",
          {
            title: "Confirmation",
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async (oAction) => {
              if (oAction === sap.m.MessageBox.Action.YES) {
                const listData = this.tm.getTN("transfer_details").getData();
                const commentList = this.tm.getTN("comment_list").getData();

                if (commentList[0].asset_attachment.hasAttachment) {
                  commentList[0].file_name =
                    commentList[0].asset_attachment.name;
                }

                const assetApproveTable = <
                  KloEntitySet<d_asset_approve_status>
                  >await this.transaction.getExecutedQuery(
                    "d_asset_approve_status",
                    {
                      request_number: listData.request_number,
                      company_code: listData.company_code,
                      business_area: listData.business_area,
                      request_type: listData.request_type,
                      action_required_by: this.userid,
                      loadAll: true,
                    }
                  );

                const currentAprData = <KloEntitySet<d_asset_action_item>>(
                  await this.transaction.getExecutedQuery(
                    "d_asset_action_item",
                    {
                      request_number: listData.request_number,
                      action_status: "Pending",
                      loadAll: true,
                    }
                  )
                );

                currentAprData[0].action_status = "Return Back";
                currentAprData[0].approved_on = new Date();
                currentAprData[0].action_required_by = this.userid;
                currentAprData[0].action_required_by_name =
                  await this.approverName(this.userid);
                currentAprData[0].approval_sequence += 1;

                assetApproveTable[0].action_status = "Return Back";
                assetApproveTable[0].action_required_by = listData.s_created_by;
                listData.status = "Return Back";

                // await this.tm.commitP("Returned", "Failed", true, true);
                await this.retrySave("Returned", "Failed");
                await this.tm.getTN("action_list").resetP(true);

                sap.m.MessageBox.success(
                  `This Transfer request has been successfully returned back.`,
                  {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: async () => {
                      await this.navTo({
                        H: true,
                        S: "p_asset_action",
                        SS: "pa_action",
                      });
                    },
                  }
                );
              }
            },
          }
        );
      } catch (error) {
        console.error("Return failed:", error);
        sap.m.MessageToast.show("Return failed due to an error");
      }
    } else if (this.tcomment.commentbox) {
      await this.onTransferCommentSend();
      try {
        sap.m.MessageBox.confirm(
          "Are you sure you want to return this transfer request back?",
          {
            title: "Confirmation",
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async (oAction) => {
              if (oAction === sap.m.MessageBox.Action.YES) {
                const listData = this.tm.getTN("transfer_details").getData();
                const commentList = this.tm.getTN("comment_list").getData();

                if (commentList[0].asset_attachment.hasAttachment) {
                  commentList[0].file_name =
                    commentList[0].asset_attachment.name;
                }

                const assetApproveTable = <
                  KloEntitySet<d_asset_approve_status>
                  >await this.transaction.getExecutedQuery(
                    "d_asset_approve_status",
                    {
                      request_number: listData.request_number,
                      company_code: listData.company_code,
                      business_area: listData.business_area,
                      request_type: listData.request_type,
                      action_required_by: this.userid,
                      loadAll: true,
                    }
                  );

                const currentAprData = <KloEntitySet<d_asset_action_item>>(
                  await this.transaction.getExecutedQuery(
                    "d_asset_action_item",
                    {
                      request_number: listData.request_number,
                      action_status: "Pending",
                      loadAll: true,
                    }
                  )
                );

                currentAprData[0].action_status = "Return Back";
                currentAprData[0].approved_on = new Date();
                currentAprData[0].action_required_by = this.userid;
                currentAprData[0].action_required_by_name =
                  await this.approverName(this.userid);
                currentAprData[0].approval_sequence += 1;

                assetApproveTable[0].action_status = "Return Back";
                assetApproveTable[0].action_required_by = listData.s_created_by;
                listData.status = "Return Back";

                // await this.tm.commitP("Returned", "Failed", true, true);
                await this.retrySave("Returned", "Failed");
                await this.tm.getTN("action_list").resetP(true);

                sap.m.MessageBox.success(
                  `This Transfer request has been successfully returned back.`,
                  {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: async () => {
                      await this.navTo({
                        H: true,
                        S: "p_asset_action",
                        SS: "pa_action",
                      });
                    },
                  }
                );
              }
            },
          }
        );
      } catch (error) {
        console.error("Return failed:", error);
        sap.m.MessageToast.show("Return failed due to an error");
      }
    } else {
      sap.m.MessageBox.error("Please Enter Comment... ", {
        title: "Alert",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
    }
  }
  public async transferSendForApproval() {
    this.tcomment = await this.tm.getTN("transfer_comment").getData();
    if (this.transferCommentList.length > 0) {
      try {
        await new Promise<void>((resolve) => {
          sap.m.MessageBox.confirm(
            "Are you sure you want to send this transfer request for approval?",
            {
              title: "Confirmation",
              actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO,
              ],
              onClose: (oAction) => {
                if (oAction === sap.m.MessageBox.Action.YES) {
                  resolve();
                }
              },
            }
          );
        });

        const detail = await this.tm.getTN("transfer_details").getData();
        const commentList = this.tm.getTN("comment_list").getData();

        if (commentList[0].asset_attachment.hasAttachment) {
          commentList[0].file_name = commentList[0].asset_attachment.name;
        }

        const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
          await this.transaction.getExecutedQuery("d_asset_approve_status", {
            request_number: detail.request_number,
            company_code: detail.company_code,
            business_area: detail.business_area,
            request_type: detail.request_type,
            action_required_by: this.userid,
            loadAll: true,
          })
        );

        const currentAprData = <KloEntitySet<d_asset_action_item>>(
          await this.transaction.getExecutedQuery("d_asset_action_item", {
            request_number: detail.request_number,
            action_status: "Return Back",
            loadAll: true,
          })
        );
        const approvalStatusData = <KloEntitySet<d_asset_approve_status>>(
          await this.transaction.getExecutedQuery("d_asset_approve_status", {
            request_number: detail.request_number,
            action_status: "Return Back",
            loadAll: true,
          })
        );
        const mainMasterTable = await this.transaction.getExecutedQuery(
          "d_asset_transfer_master",
          {
            company_code: detail.company_code,
            business_area: detail.business_area,
            request_type: "TR",
            level: 1,
            loadAll: true,
          }
        );

        const masterTable = mainMasterTable.filter(
          (item) => parseFloat(item.lavel) === 1
        );

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
          role_name: masterTable[0].roles,
          approval_sequence: currentAprData[0].approval_sequence,
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
          action_required_by: masterTable[0].user_id,
          approval_sequence: currentAprData[0].approval_sequence,
        });

        detail.status = "Pending";
        currentAprData[0].action_status = "Returned";
        approvalStatusData[0].action_status = "Returned";
        // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
        await this.retrySave("Send For Approval", "Send Failed");

        await new Promise<void>((resolve) => {
          sap.m.MessageBox.success(
            `The transfer request ${detail.request_number} has been successfully sent for approval.`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: () => resolve(),
            }
          );
        });

        await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
      } catch (error) {
        console.error("Send for approval failed:", error);
        sap.m.MessageToast.show("Send for approval failed due to an error");
      }
    } else if (this.tcomment.commentbox) {
      await this.onTransferCommentSend();
      try {
        await new Promise<void>((resolve) => {
          sap.m.MessageBox.confirm(
            "Are you sure you want to send this transfer request for approval?",
            {
              title: "Confirmation",
              actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO,
              ],
              onClose: (oAction) => {
                if (oAction === sap.m.MessageBox.Action.YES) {
                  resolve();
                }
              },
            }
          );
        });

        const detail = await this.tm.getTN("transfer_details").getData();
        const commentList = this.tm.getTN("comment_list").getData();

        if (commentList[0].asset_attachment.hasAttachment) {
          commentList[0].file_name = commentList[0].asset_attachment.name;
        }

        const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
          await this.transaction.getExecutedQuery("d_asset_approve_status", {
            request_number: detail.request_number,
            company_code: detail.company_code,
            business_area: detail.business_area,
            request_type: detail.request_type,
            action_required_by: this.userid,
            loadAll: true,
          })
        );

        const currentAprData = <KloEntitySet<d_asset_action_item>>(
          await this.transaction.getExecutedQuery("d_asset_action_item", {
            request_number: detail.request_number,
            action_status: "Return Back",
            loadAll: true,
          })
        );
        const approvalStatusData = <KloEntitySet<d_asset_approve_status>>(
          await this.transaction.getExecutedQuery("d_asset_approve_status", {
            request_number: detail.request_number,
            action_status: "Return Back",
            loadAll: true,
          })
        );
        const mainMasterTable = await this.transaction.getExecutedQuery(
          "d_asset_transfer_master",
          {
            company_code: detail.company_code,
            business_area: detail.business_area,
            request_type: "TR",
            level: 1,
            loadAll: true,
          }
        );

        const masterTable = mainMasterTable.filter(
          (item) => parseFloat(item.lavel) === 1
        );

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
          role_name: masterTable[0].roles,
          approval_sequence: currentAprData[0].approval_sequence,
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
          action_required_by: masterTable[0].user_id,
          approval_sequence: currentAprData[0].approval_sequence,
        });

        detail.status = "Pending";
        currentAprData[0].action_status = "Returned";
        approvalStatusData[0].action_status = "Returned";
        // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
        await this.retrySave("Send For Approval", "Send Failed");

        await new Promise<void>((resolve) => {
          sap.m.MessageBox.success(
            `The transfer request ${detail.request_number} has been successfully sent for approval.`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: () => resolve(),
            }
          );
        });

        await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
      } catch (error) {
        console.error("Send for approval failed:", error);
        sap.m.MessageToast.show("Send for approval failed due to an error");
      }
    } else {
      sap.m.MessageBox.error("Please Enter Comment... ", {
        title: "Alert",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
    }
  }

  public async onClickingCreateComment() {
    await this.tm.getTN("create_comment").setData(true);
    await this.tm
      .getTN("transfer_details/r_transfer_comment")
      .createEntityP(
        {},
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        true,
        true,
        false
      );
  }
  public async onDownloadTransferAttachment(oEvent: sap.ui.base.Event) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/comment_list/", ""));
    let comment_list = this.tm.getTN("comment_list").getData();
    comment_list[index].asset_attachment.downloadAttachP();
  }
  //Transfer Code End//


  // asset allocation approval


  public async allocationDocumentUpload(oEvent) {
    this.allocation_file = oEvent.mParameters.files[0];
    this.allocation_file_name = oEvent.mParameters.files[0].name;
  }
  public async scrappingDocumentUpload(oEvent) {
    this.scrapping_file = oEvent.mParameters.files[0];
    this.scrapping_file_name = oEvent.mParameters.files[0].name;
  }


  public async onAllocation_comment_sent() {
    let listData = await this.tm.getTN("allocation_details").getData();
    this.allo_comment = await this.tm.getTN("allocation_comment").getData();
    // let comment = await this.tm.getTN("allocation_comment").getData();

    if (
      this.allo_comment.asset_comment != undefined ||
      this.allo_comment.asset_comment != ""
    ) {
      //await this.transaction.createEntityP('d_asset_purchase_approval', {s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox});
      let comment_list = await this.tm
        .getTN("allocation_comment_list")
        .createEntityP(
          {
            s_object_type: -1,
            request_number: listData.purchase_request,
            request_type: "AL",
            asset_comment: this.allo_comment.asset_comment,
          },
          null,
          null,
          null,
          "First",
          false,
          false,
          false
        );
      this.allo_comment_list.push(comment_list);

      //await this.tm.getTN('purchase_comment_list').createEntityP(0,{s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox},true)
      if (this.allocation_file) {
        await comment_list.asset_attachment.setAttachmentP(
          this.allocation_file,
          this.allocation_file_name
        );
      }
      comment_list = null;
      this.allo_comment = null;
      this.allocation_file = null;
      this.allocation_file_name = null;
      // this.allo_comment.asset_attachment = null;
      this.allo_comment.asset_comment = null;

    }
  }
  public async allocation_approval_confirmation() {
    let listData = this.tm.getTN("allocation_details").getData();
    this.allo_comment = await this.tm.getTN("allocation_comment").getData();
    if (!this.allo_comment.asset_comment && !this.allo_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (this.allo_comment.asset_comment || this.allo_comment.asset_comment.asset_attachment) {
      this.onAllocation_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to approve the Asset?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.allocation_approval();
        }
      }.bind(this),
    });
  }
  public async allocation_approval() {
    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
    });
    oBusy.open();

    let listData = this.tm.getTN("allocation_details").getData();
    let currentAprData = this.tm.getTN("action_detail").getData();

    let assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
      await this.transaction.getExecutedQuery("d_asset_approve_status", {
        request_number: listData.request_no,
        action_status: "Pending",
        role_name: this.roleid,
        loadAll: true,
      })
    );

    const mainMasterTable = await this.transaction.getExecutedQuery('d_asset_purchase_master', {
      company_code: listData.company_code,
      // business_area: asset_details.business_area,
      request_type: "AL",
      // level: level,
      loadAll: true
    });

    // let masterTable = mainMasterTable.filter(
    //   (item) => item.user_id.toUpperCase() == this.userid.toUpperCase()
    // );
    let masterTable = mainMasterTable.filter((item) => item.role == this.roleid);

    let level = masterTable[0].level + 1;

    let nextRole = mainMasterTable.filter(
      (item) => parseInt(item.level) == parseInt(level)
    );

    if (nextRole.length) {
      currentAprData.action_status = "Pending";
      currentAprData.approved_on = new Date();
      currentAprData.action_required_by = this.userid;
      currentAprData.action_required_by_name = await this.approverName(this.userid);

      assetApproveTable[0].action_status = "Approved";
      assetApproveTable[0].approved_on = new Date();
      assetApproveTable[0].action_required_by = this.userid;
      assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);
      // assetApproveTable[0].role_name = this.roleid;

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: listData.request_no,
        asset_number: listData.asset_no,
        tag_number: listData.tag_no,
        sub_asset_number: listData.sub_asset_no,
        request_type: "AL",
        action_status: "Pending",
        company_code: listData.company_code,
        business_area: listData.business_area,
        profit_center: listData.profit_center,
        functional_area: listData.functional_area,
        approval_sequence: currentAprData.approval_sequence,
        // action_required_by: nextRole[0].user_id,
        role_name: nextRole[0].role,
      });

      // await this.tm.commitP("Approved", "Failed", true, true);
      await this.retrySave("Approved", "Failed");
      oBusy.close();
      sap.m.MessageBox.success(
        `Allocation Number ${listData.request_no} has been Approved and sent for next approval`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {
            let actionType = "sendForNextAppr";
            await this.onAllocationMailSend(listData.company_code, nextRole[0].role, listData.request_no, listData.s_created_by, actionType);
            // mail notification      
            // await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationLevelApproval");
            // await this.tm.getTN("allocation_request_creation").setProperty('employee', listData.s_created_by);
            // await this.tm.getTN("allocation_request_creation").setProperty('request_number', listData.request_no);
            // await this.tm.getTN("allocation_request_creation").executeP();

            // await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRequest");
            // await this.tm.getTN("allocation_request_creation").setProperty('employee', nextRole[0].user_id);
            // await this.tm.getTN("allocation_request_creation").setProperty('request_number', listData.request_no);
            // await this.tm.getTN("allocation_request_creation").executeP();

            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
    } else {
      currentAprData.action_status = "Approved";
      currentAprData.approved_on = new Date();
      currentAprData.role_name = this.roleid;
      currentAprData.action_required_by_name = await this.approverName(this.userid);

      assetApproveTable[0].action_status = "Approved";
      assetApproveTable[0].approved_on = new Date();
      assetApproveTable[0].action_required_by = this.userid;
      assetApproveTable[0].action_required_by_name = await this.approverName(
        this.userid
      );
      // assetApproveTable[0].role_name = this.roleid;

      listData.action_status = "Allocated";
      listData.allocation_date = new Date();
      // listData.status = "Allocated";
      const assetCreationData = await this.transaction.getExecutedQuery(
        "d_asset_creation",
        {
          asset_number: listData.asset_no,
          loadAll: true,
        }
      );
      assetCreationData[0].status = "Allocated";
      assetCreationData[0].action_status = "";
      assetCreationData[0].assigned_to = listData.assign_to;
      // assetCreationData[0].location = listData.location;
      // assetCreationData[0].department = listData.department;
      // assetCreationData[0].project_id = listData.project_id;
      // assetCreationData[0].project_to_bill = listData.project_to_bill

      await this.transaction.createEntityP("d_asset_log_table", {
        s_object_type: -1,
        request_number: listData.request_no,
        company_code: listData.company_code,
        business_area: listData.business_area,
        asset_number: listData.asset_no,
        tag_number: listData.tag_no,
        log_type: "Allocation",
      });

      // update the club asset
      let assetClubbed = await this.transaction.getExecutedQuery(
        'd_o2c_asset_clubbing',
        {
          'parent_asset_number': listData.asset_no,
          loadAll: true
        });

      let clubAssetIds = [];
      for (let i = 0; i < assetClubbed.length; i++) {
        clubAssetIds.push(assetClubbed[i].child_asset_number);
      }
      let clubbedAssetCreationData = [];
      if (clubAssetIds.length) {
        clubbedAssetCreationData = await this.transaction.getExecutedQuery(
          "d_asset_creation",
          {
            asset_number: clubAssetIds,
            loadAll: true,
          }
        );
      }
      for (let i = 0; i < clubbedAssetCreationData.length; i++) {
        clubbedAssetCreationData[i].status = "Allocated";
        clubbedAssetCreationData[i].assigned_to = listData.assign_to;
        // clubbedAssetCreationData[i].assigned_date = new Date();
      }

      // getting all asset details for mail to employee
      let allAssetIds = [];
      let allTagNumbers = [];
      let allDescriptions = [];

      allAssetIds.push(listData.asset_no);
      allTagNumbers.push(listData.tag_number);
      allDescriptions.push(listData.asset_description);
      for (let i = 0; i < clubbedAssetCreationData.length; i++) {
        allAssetIds.push(clubbedAssetCreationData[i].asset_number);
        allTagNumbers.push(clubbedAssetCreationData[i].tag_number);
        allDescriptions.push(clubbedAssetCreationData[i].asset_description);
      }

      // await this.tm.commitP("Approved", "Failed", true, true);
      await this.retrySave("Approved", "Failed");
      oBusy.close();
      sap.m.MessageBox.success(
        `Request Number ${listData.request_no} Approved Successfully`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {
            await this.generateAllocationDeclaration();

            // mail notification
            await this.onAllocationMailSend(listData.company_code, "", listData.request_no, listData.s_created_by, "finalAppr");
            // let mmid = "mm0305"
            await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationApprEmp");
            await this.tm.getTN("allocation_request_creation").setProperty('employee', listData.assign_to);
            await this.tm.getTN("allocation_request_creation").setProperty('asset_number', allAssetIds);
            await this.tm.getTN("allocation_request_creation").setProperty('tag_number', allTagNumbers);
            await this.tm.getTN("allocation_request_creation").setProperty('asset_description', allDescriptions);
            await this.tm.getTN("allocation_request_creation").executeP();


            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
    }

    // await this.tm.commitP("Approved", "Failed", true, true);
    // await this.tm.getTN("action_list").resetP(true);
    // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
  }
  // asset allocation rejection
  public async allocation_reject() {
    this.allo_comment = await this.tm.getTN("allocation_comment").getData();
    if (!this.allo_comment.asset_comment && !this.allo_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.allo_comment.asset_comment ||
      this.allo_comment.asset_comment.asset_attachment
    ) {
      this.onAllocation_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to reject the allocation request?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          var oBusy = new sap.m.BusyDialog({
            text: "please wait...",
          });
          oBusy.open();

          let listData = this.tm.getTN("allocation_details").getData();

          let currentAprData = this.tm.getTN("action_detail").getData();
          // let currentAprData = <KloEntitySet<d_asset_action_item>>(
          //   await this.transaction.getExecutedQuery("d_asset_action_item", {
          //     request_number: listData.request_no,
          //     action_status: "Pending",
          //     loadAll: true,
          //   })
          // );

          const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
            await this.transaction.getExecutedQuery("d_asset_approve_status", {
              request_number: listData.request_no,
              action_status: "Pending",
              role_name: this.roleid,
              // company_code: listData.company_code,
              // business_area: listData.business_area,
              // request_type: listData.request_type,
              // action_required_by: this.userid,
              loadAll: true,
            })
          );

          currentAprData.action_status = "Rejected";
          currentAprData.approved_on = new Date();
          currentAprData.action_required_by = this.userid;
          currentAprData.action_required_by_name = await this.approverName(this.userid);

          assetApproveTable[0].action_status = "Rejected";
          assetApproveTable[0].approved_on = new Date();
          assetApproveTable[0].action_required_by = this.userid;
          assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);

          listData.action_status = "Rejected";

          const assetCreationData = await this.transaction.getExecutedQuery(
            "d_asset_creation",
            {
              asset_number: listData.asset_no,
              loadAll: true,
            }
          );
          assetCreationData[0].action_status = "";

          // await this.tm.commitP("Rejected", "Failed", true, true);
          await this.retrySave("Rejected", "Failed");
          oBusy.close();

          sap.m.MessageBox.success(
            `Allocation Number ${listData.request_no} has been Rejected`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: async function () {

                // mail notification
                await this.onAllocationMailSend(listData.company_code, "", listData.request_no, listData.s_created_by, "reject");
                // let mmid = "mm0305"
                // await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRejection");
                // await this.tm.getTN("allocation_request_creation").setProperty('employee', mmid);
                // await this.tm.getTN("allocation_request_creation").setProperty('request_number', listData.request_no);
                // await this.tm.getTN("allocation_request_creation").setProperty('status', "Rejected");
                // await this.tm.getTN("allocation_request_creation").executeP();

                await this.tm.getTN("action_list").resetP(true);
                await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action", });
              }.bind(this),
            }
          );

          // await this.tm.getTN("action_list").resetP(true);
          // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
        }
      }.bind(this),
    });
  }
  // asset allocation return back
  public async allocation_return_bank() {
    this.allo_comment = await this.tm.getTN("allocation_comment").getData();
    if (!this.allo_comment.asset_comment && !this.allo_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.allo_comment.asset_comment ||
      this.allo_comment.asset_comment.asset_attachment
    ) {
      this.onAllocation_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to return the allocation request?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          var oBusy = new sap.m.BusyDialog({
            text: "please wait...",
          });
          oBusy.open();

          let listData = this.tm.getTN("allocation_details").getData();

          const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
            await this.transaction.getExecutedQuery("d_asset_approve_status", {
              request_number: listData.request_no,
              company_code: listData.company_code,
              business_area: listData.business_area,
              request_type: listData.request_type,
              action_required_by: this.userid,
              loadAll: true,
            })
          );

          let currentAprData = <KloEntitySet<d_asset_action_item>>(
            await this.transaction.getExecutedQuery("d_asset_action_item", {
              request_number: listData.request_no,
              action_status: "Pending",
              loadAll: true,
            })
          );

          // assetApproveTable[0].action_status = "Return Back";

          currentAprData[0].action_status = "Return Back";
          currentAprData[0].approved_on = new Date();
          currentAprData[0].action_required_by = this.userid;
          currentAprData[0].action_required_by_name = await this.approverName(
            this.userid
          );
          currentAprData[0].approval_sequence += 1;

          assetApproveTable[0].action_status = "Return Back";
          assetApproveTable[0].action_required_by = listData.s_created_by;
          listData.action_status = "Return Back";

          // await this.tm.commitP("Returned", "Failed", true, true);
          await this.retrySave("Returned", "Failed");
          oBusy.close();
          sap.m.MessageBox.success(
            `Allocation Number ${listData.request_no} has been Returned`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: async function () {

                // mail notification
                let mmid = "mm0305"
                await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRejection");
                await this.tm.getTN("allocation_request_creation").setProperty('employee', mmid);
                await this.tm.getTN("allocation_request_creation").setProperty('request_number', listData.request_no);
                await this.tm.getTN("allocation_request_creation").setProperty('status', "Returned Back");
                await this.tm.getTN("allocation_request_creation").executeP();


                await this.tm.getTN("action_list").resetP(true);
                await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action", });
              }.bind(this),
            }
          );

          // await this.tm.getTN("action_list").resetP(true);
          // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
        }
      }.bind(this),
    });
  }
  public async allocation_sendForApproval_confirmation() {
    this.allo_comment = await this.tm.getTN("allocation_comment").getData();
    if (!this.allo_comment.asset_comment && !this.allo_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.allo_comment.asset_comment ||
      this.allo_comment.asset_comment.asset_attachment
    ) {
      this.onAllocation_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to Send the Request for Approval?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.allocation_send_for_approval();
        }
      }.bind(this),
    });
  }
  // send to approval for return back request
  public async allocation_send_for_approval() {
    try {
      var oBusy = new sap.m.BusyDialog({
        text: "please wait...",
      });
      oBusy.open();

      // Retrieve asset allocation details
      const detail = await this.tm.getTN("allocation_details").getData();

      // Execute the query for the master table
      const mainMasterTable = await this.transaction.getExecutedQuery(
        "d_asset_allocation_master",
        {
          company_code: detail.company_code,
          business_area: detail.business_area,
          // asset_type: detail.asset_type,
          request_type: "AL",
          lavel: 1,
          loadAll: true,
        }
      );
      // Filter the master table based on the current level
      const masterTable = mainMasterTable.filter(
        (item) => parseFloat(item.lavel) === 1
      );

      let currentAprData = <KloEntitySet<d_asset_action_item>>(
        await this.transaction.getExecutedQuery("d_asset_action_item", {
          request_number: detail.request_no,
          action_status: "Return Back",
          loadAll: true,
        })
      );
      // currentAprData[0].item_status = "Done";
      currentAprData[0].action_status = "Pending";
      currentAprData[0].action_required_by = masterTable[0].user_id;
      currentAprData[0].role_name = masterTable[0].roles;
      currentAprData[0].approval_sequence = currentAprData[0].approval_sequence;
      // Create the asset action item with role information
      // await this.transaction.createEntityP("d_asset_action_item", {
      //   s_object_type: -1,
      //   request_number: detail.request_no,
      //   request_type: "AL",
      //   asset_number: detail.asset_no,
      //   tag_number: detail.tag_no,
      //   sub_asset_number: detail.sub_asset_no,
      //   action_status: "Pending",
      //   company_code: detail.company_code,
      //   business_area: detail.business_area,
      //   action_required_by:masterTable[0].user_id,
      //   role_name: masterTable[0].roles,
      //   approval_sequence: currentAprData[0].approval_sequence,
      // });
      const previousApprData = await this.transaction.getExecutedQuery(
        "d_asset_approve_status",
        {
          request_number: detail.request_no,
          action_status: "Return Back",
          loadAll: true,
        }
      );
      previousApprData[0].action_status = "Done";
      previousApprData[0].item_status = "Done";

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: detail.request_no,
        request_type: "AL",
        asset_number: detail.asset_no,
        tag_number: detail.tag_no,
        sub_asset_number: detail.sub_asset_no,
        action_status: "Pending",
        company_code: detail.company_code,
        business_area: detail.business_area,
        action_required_by: masterTable[0].user_id,
        approval_sequence: currentAprData[0].approval_sequence,
      });

      detail.action_status = "Pending";

      // Commit the transaction for approval
      // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
      await this.retrySave("Send For Approval", "Send Failed");

      oBusy.close();
      sap.m.MessageBox.success(
        `Allocation Number ${detail.request_no} has been sent for Approval`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {
            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
      // await this.tm.getTN("action_list").resetP(true);
      // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
    } catch (error) {
      console.error("Flow Master failed:", error);
      sap.m.MessageToast.show("Flow Master failed due to an error");
    }
  }


  public async onAllocationCreateComment() {
    // await this.tm.getTN("create_comment").setData(true);
    await this.tm
      .getTN("allocation_details/r_allocation_comment")
      .createEntityP(
        {},
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        true,
        true,
        false
      );
  }
  // DOWNLOAD ATTECHMENT 
  public async onAllocationDownloadAttech(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    this.tm.getTN("allocation_comment_list").setActive(parseInt(path.replace(`/${"allocation_comment_list"}/`, '')));
    let docdownload = await this.tm.getTN("allocation_comment_list").getActiveData();
    await docdownload.asset_attachment.downloadAttachP();

  }


  public async generateAllocationDeclaration() {
    //@ts-ignore
    let jsPDFModule = await import("kloExternal/jspdf.min");
    const jspdf = jsPDFModule.default;
    const pdf = new jspdf("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let yPosition = 30;

    let listData = await this.tm.getTN("allocation_details").getData();
    let clubList = await this.tm.getTN('asset_club_list').getData();
    let childAssetNumber = clubList.map(item => item.child_asset_number);

    const assetCreationData = await this.transaction.getExecutedQuery("d_asset_creation", {
      asset_number: listData.asset_no,
      loadAll: true,
    });

    let clubbedAssetCreationData = [];
    if (childAssetNumber.length) {
      clubbedAssetCreationData = await this.transaction.getExecutedQuery("d_asset_creation", {
        asset_number: childAssetNumber,
        loadAll: true,
      });
    }

    let empId = listData.assign_to || "";
    let name = await this.approverName(empId);
    let description = assetCreationData[0].asset_description || "N/A";
    let serialNumber = assetCreationData[0].serial_number || "N/A";
    let assetNumber = listData.asset_no;
    let tagNumber = assetCreationData[0].tag_number || "N/A";

    // Helper function to add text with wrapping
    const addText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number,
      fontStyle: string = "normal",
      align: string = "left"
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("times", fontStyle);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y, { align: align });
      return y + lines.length * fontSize * 0.3527777778 + 2;
    };

    // Title
    yPosition = addText("Declaration to Return and Care for Company Equipment",
      pageWidth / 2,
      yPosition,
      pageWidth - 2 * margin,
      16,
      "bold",
      "center"
    );
    yPosition += 20;

    // Employee details
    const employeeDetails = [
      { label: "Name:", value: name },
      { label: "Emp Id:", value: empId },
    ];

    employeeDetails.forEach((detail) => {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(detail.label, margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(detail.value, margin + 35, yPosition);
      yPosition += 10;
    });

    yPosition += 15;

    // Declaration paragraphs
    const declarationParagraphs = [
      `I, ${name}, acknowledge that while I am working for Maventic, I will take proper care of all company / client's equipment that I am entrusted with. I further understand that upon completion of project or termination of employment, I will return all Maventic or client's property and that the property will be returned in proper working order on the last working day.`,
      "I understand I may be held financially responsible for lost or damaged property. This declaration includes, but is not limited to, laptops, cell phones and other equipment. I understand that failure to return equipment will be considered theft and may lead to applicable charges and criminal prosecution by Company and also affect BGV clearance of future employment.",
    ];

    declarationParagraphs.forEach((paragraph) => {
      yPosition = addText(paragraph, margin, yPosition, pageWidth - 2 * margin, 12, "normal");
      yPosition += 8;
    });

    // Equipment Table
    const tableTop = yPosition;
    const tableLeft = margin;
    const tableWidth = pageWidth - 2 * margin;

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.1);

    // Top border
    pdf.line(tableLeft, tableTop, tableLeft + tableWidth, tableTop);

    // "Company Equipment" heading (centered)
    yPosition = addText("Company Equipment", pageWidth / 2, tableTop + 8, tableWidth - 4, 12, "bold", "center");

    // Line below heading
    pdf.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition);

    // Main asset row
    const mainAssetText =
      "Asset No : " + assetNumber +
      ", Description : " + description +
      ", Tag No : " + tagNumber +
      ", S/N : " + serialNumber;

    yPosition = addText(mainAssetText, tableLeft + 1, yPosition + 5, tableWidth - 2, 11);
    yPosition += 3;

    // Bottom line after main asset
    pdf.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition);

    // ✅ Only print Clubbed Assets if available
    if (clubbedAssetCreationData.length > 0) {
      // Clubbed Assets Section Heading (centered)
      yPosition = addText("Clubbed Asset", pageWidth / 2, yPosition + 10, tableWidth - 4, 12, "bold", "center");

      // Clubbed assets list with page break handling
      for (let i = 0; i < clubbedAssetCreationData.length; i++) {
        const club = clubbedAssetCreationData[i];
        const assetText =
          "Asset No : " + club.asset_number +
          ", Description : " + (club.asset_description || "N/A") +
          ", Tag No : " + (club.tag_number || "N/A") +
          ", S/N : " + (club.serial_number || "N/A");

        const lines = pdf.splitTextToSize(assetText, tableWidth - 2);
        const estimatedHeight = lines.length * 11 * 0.3527777778 + 8;

        // If not enough space left, create a new page
        if (yPosition + estimatedHeight > pageHeight - 25) {
          pdf.addPage();
          yPosition = 30;

          // Re-add section title on new page
          yPosition = addText("Clubbed Asset", pageWidth / 2, yPosition, tableWidth - 4, 12, "bold", "center");
          yPosition += 5;
        }

        yPosition = addText(assetText, tableLeft + 1, yPosition + 5, tableWidth - 2, 11);
        yPosition += 3;
      }
    }

    // Final table borders
    pdf.line(tableLeft, tableTop, tableLeft, yPosition); // Left
    pdf.line(tableLeft + tableWidth, tableTop, tableLeft + tableWidth, yPosition); // Right
    pdf.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition); // Bottom

    yPosition += 20;

    // Terms acceptance
    yPosition = addText(
      "Accepted the terms & collected the Company Equipment",
      margin,
      yPosition,
      pageWidth - 2 * margin,
      12,
      "bold"
    );
    yPosition += 15;

    // Signature section
    const signatureLines = [
      "Signature:  __________________________________",
      "Print Name: __________________________________",
      "Date:       __________________________________",
    ];

    signatureLines.forEach((line) => {
      // Check if there's enough space; if not, add new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 30;
      }
      yPosition = addText(line, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 12;
    });

    // Save the PDF
    pdf.save("company_equipment_declaration.pdf");

    // Attach it
    const blob = pdf.output("blob");
    const requestNo = listData.request_no || "request";
    const fileName = `${requestNo}_equipment_declaration.pdf`;
    await listData.attachment.setAttachmentP(blob, fileName);
    // await this.tm.commitP("Handover Receipt Saved", "Handover Receipt Failed", true, true);
    await this.retrySave("Handover Receipt Saved", "Handover Receipt Failed");
  }








  // asset scrapping approval
  public async scrapping_approval_confirmation() {
    this.scrap_comment = await this.tm.getTN("scrapping_comment").getData();
    if (!this.scrap_comment.asset_comment && !this.scrap_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.scrap_comment.asset_comment ||
      this.scrap_comment.asset_comment.asset_attachment
    ) {
      this.onScrapping_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to Approve the Request?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.scrapping_approval();
        }
      }.bind(this),
    });
  }
  public async scrapping_approval() {
    let listData = this.tm.getTN("scrapping_details").getData();
    let currentAprData = this.tm.getTN("action_detail").getData();

    let assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
      await this.transaction.getExecutedQuery("d_asset_approve_status", {
        request_number: listData.scrapping_request,
        action_status: "Pending",
        role_name: this.roleid,
        // company_code: listData.company_code,
        // business_area: listData.business_area,
        // asset_type: listData.asset_type,
        // action_required_by: this.userid,
        loadAll: true,
      })
    );

    // let mainMasterTable = <KloEntitySet<d_asset_transfer_master>>(
    //   await this.transaction.getExecutedQuery("d_asset_scrap_master", {
    //     company_code: listData.company_code,
    //     business_area: listData.business_area,
    //     asset_type: listData.asset_type,
    //     request_type: "SC",
    //     loadAll: true,
    //   })
    // );
    const mainMasterTable = await this.transaction.getExecutedQuery('d_asset_purchase_master', {
      company_code: listData.company_code,
      // business_area: asset_details.business_area,
      request_type: "SC",
      // level: level,
      loadAll: true
    });
    // let masterTable = mainMasterTable.filter(
    //   (item) => item.user_id.toUpperCase() == this.userid.toUpperCase()
    // );
    let masterTable = mainMasterTable.filter((item) => item.role == this.roleid);

    let level = parseInt(masterTable[0].level) + 1;

    let nextRole = mainMasterTable.filter(
      (item) => parseInt(item.level) == parseInt(level)
    );

    if (nextRole.length) {

      currentAprData.action_status = "Pending";
      currentAprData.approved_on = new Date();
      currentAprData.action_required_by = nextRole[0].role;
      currentAprData.action_required_by_name = await this.approverName(this.userid);

      assetApproveTable[0].action_status = "Approved";
      assetApproveTable[0].approved_on = new Date();
      // assetApproveTable[0].approved_by = await this.approverName(this.userid);
      assetApproveTable[0].action_required_by = nextRole[0].role;
      assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: listData.scrapping_request,
        asset_number: listData.asset_no,
        tag_number: listData.tag_no,
        sub_asset_number: listData.sub_asset_no,
        request_type: "SC",
        action_status: "Pending",
        company_code: listData.company_code,
        business_area: listData.business_area,
        profit_center: listData.profit_center,
        functional_area: listData.functional_area,
        approval_sequence: listData.approval_sequence,
        // action_required_by: nextRole[0].user_id,
        role_name: nextRole[0].role,
      });

      // await this.tm.commitP("Approved", "Failed", true, true);
      await this.retrySave("Approved", "Failed");

      sap.m.MessageBox.success(
        `Request Number ${listData.scrapping_request} has been Approved and sent for next approval`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {

            // mail notification
            // await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingLevelApproval");
            // await this.tm.getTN("scrapping_request_mail").setProperty('employee', mmid);
            // await this.tm.getTN("scrapping_request_mail").setProperty('request_number', listData.scrapping_request);
            // await this.tm.getTN("scrapping_request_mail").executeP();

            let actionType = "sendForNextAppr";
            await this.onScrappingMailSend(listData.company_code, nextRole[0].role, listData.scrapping_request, listData.s_created_by, actionType);

            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
    } else {
      currentAprData.action_status = "Approved";
      currentAprData.approved_on = new Date();
      currentAprData.role_name = this.roleid;
      currentAprData.approved_by_name = await this.approverName(this.userid);

      assetApproveTable[0].action_status = "Approved";
      assetApproveTable[0].approved_on = new Date();
      assetApproveTable[0].approved_by = await this.approverName(this.userid);
      assetApproveTable[0].action_required_by_name = await this.approverName(
        this.userid
      );

      listData.action_status = "Approved";

      const assetCreationData = await this.transaction.getExecutedQuery(
        "d_asset_creation",
        {
          asset_number: listData.asset_no,
          loadAll: true,
        }
      );
      assetCreationData[0].status = "Scrapped";
      assetCreationData[0].action_status = "";
      assetCreationData[0].asset_deactivation_date = new Date();

      await this.transaction.createEntityP("d_asset_log_table", {
        s_object_type: -1,
        request_number: listData.scrapping_request,
        company_code: listData.company_code,
        business_area: listData.business_area,
        asset_number: listData.asset_no,
        tag_number: listData.tag_no,
        log_type: "Scrapping",
      });

      // await this.tm.commitP("Approved", "Failed", true, true);
      await this.retrySave("Approved", "Failed");
      sap.m.MessageBox.success(
        `Request Number ${listData.scrapping_request} is Approved Successfully`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {

            // mail notification  
            // let mmid = "mm0305"
            // await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingFinalApproval");
            // await this.tm.getTN("scrapping_request_mail").setProperty('employee', mmid);
            // await this.tm.getTN("scrapping_request_mail").setProperty('request_number', listData.scrapping_request);
            // await this.tm.getTN("scrapping_request_mail").executeP();
            await this.onScrappingMailSend(listData.company_code, "", listData.scrapping_request, listData.s_created_by, "finalAppr");

            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
    }

    // await this.tm.commitP("Approved", "Failed", true, true);
    // await this.tm.getTN("action_list").resetP(true);
    // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
  }
  // asset scrapping rejection
  public async scrapping_rejection_confirmation() {
    this.scrap_comment = await this.tm.getTN("scrapping_comment").getData();
    if (!this.scrap_comment.asset_comment && !this.scrap_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.scrap_comment.asset_comment ||
      this.scrap_comment.asset_comment.asset_attachment
    ) {
      this.onScrapping_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to Reject the Request?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.scrapping_reject();
        }
      }.bind(this),
    });
  }
  public async scrapping_reject() {
    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
    });
    oBusy.open();

    let listData = this.tm.getTN("scrapping_details").getData();

    // let currentAprData = <KloEntitySet<d_asset_action_item>>(
    //   await this.transaction.getExecutedQuery("d_asset_action_item", {
    //     request_number: listData.scrapping_request,
    //     action_status: "Pending",
    //     loadAll: true,
    //   })
    // );
    let currentAprData = this.tm.getTN("action_detail").getData();

    const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
      await this.transaction.getExecutedQuery("d_asset_approve_status", {
        request_number: listData.scrapping_request,
        action_status: "Pending",
        role_name: this.roleid,
        // company_code: listData.company_code,
        // business_area: listData.business_area,
        // request_type: listData.request_type,
        // action_required_by: this.userid,
        loadAll: true,
      })
    );

    currentAprData.action_status = "Rejected";
    currentAprData.approved_on = new Date();
    currentAprData.action_required_by = this.userid;
    currentAprData.action_required_by_name = await this.approverName(
      this.userid
    );

    assetApproveTable[0].action_status = "Rejected";
    assetApproveTable[0].approved_on = new Date();
    assetApproveTable[0].action_required_by = this.userid;
    assetApproveTable[0].action_required_by_name = await this.approverName(this.userid);

    listData.action_status = "Rejected";

    const assetCreationData = await this.transaction.getExecutedQuery(
      "d_asset_creation",
      {
        asset_number: listData.asset_no,
        loadAll: true,
      }
    );
    assetCreationData[0].action_status = "";

    // await this.tm.commitP("Rejected", "Failed", true, true);
    await this.retrySave("Rejected", "Failed");
    oBusy.close();
    sap.m.MessageBox.success(
      `Request Number ${listData.scrapping_request} has been Rejected`,
      {
        title: "Success",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: async function () {

          // mail notification
          // let mmid = "mm0305"
          // await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingRejection");
          // await this.tm.getTN("scrapping_request_mail").setProperty('employee', mmid);
          // await this.tm.getTN("scrapping_request_mail").setProperty('request_number', listData.scrapping_request);
          // await this.tm.getTN("scrapping_request_mail").setProperty('status', "Rejected");
          // await this.tm.getTN("scrapping_request_mail").executeP();
          await this.onScrappingMailSend(listData.company_code, "", listData.request_no, listData.s_created_by, "reject");

          await this.tm.getTN("action_list").resetP(true);
          await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
        }.bind(this),
      }
    );
  }
  // asset allocation return back
  public async scrapping_return_confirmation() {
    this.scrap_comment = await this.tm.getTN("scrapping_comment").getData();
    if (!this.scrap_comment.asset_comment && !this.scrap_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.scrap_comment.asset_comment ||
      this.scrap_comment.asset_comment.asset_attachment
    ) {
      this.onScrapping_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to Return the Request?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.scrapping_return_bank();
        }
      }.bind(this),
    });
  }
  public async scrapping_return_bank() {
    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
    });
    oBusy.open();

    let listData = this.tm.getTN("scrapping_details").getData();

    const assetApproveTable = <KloEntitySet<d_asset_approve_status>>(
      await this.transaction.getExecutedQuery("d_asset_approve_status", {
        request_number: listData.scrapping_request,
        company_code: listData.company_code,
        business_area: listData.business_area,
        request_type: listData.request_type,
        action_required_by: this.userid,
        loadAll: true,
      })
    );

    let currentAprData = <KloEntitySet<d_asset_action_item>>(
      await this.transaction.getExecutedQuery("d_asset_action_item", {
        request_number: listData.scrapping_request,
        action_status: "Pending",
        loadAll: true,
      })
    );

    assetApproveTable[0].action_status = "Return Back";
    assetApproveTable[0].action_required_by = listData.s_created_by;

    currentAprData[0].action_status = "Return Back";
    currentAprData[0].approved_on = new Date();
    currentAprData[0].action_required_by = this.userid;
    currentAprData[0].action_required_by_name = "no name";
    currentAprData[0].approval_sequence += 1;

    listData.action_status = "Return Back";

    // await this.tm.commitP("Returned", "Failed", true, true);
    await this.retrySave("Returned", "Failed");
    oBusy.close();
    sap.m.MessageBox.success(
      `Request Number ${listData.scrapping_request} has been Returned`,
      {
        title: "Success",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: async function () {

          // mail notification
          let mmid = "mm0305"
          await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingRejection");
          await this.tm.getTN("scrapping_request_mail").setProperty('employee', mmid);
          await this.tm.getTN("scrapping_request_mail").setProperty('request_number', listData.scrapping_request);
          await this.tm.getTN("scrapping_request_mail").setProperty('status', "Returned Back");
          await this.tm.getTN("scrapping_request_mail").executeP();


          await this.tm.getTN("action_list").resetP(true);
          await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
        }.bind(this),
      }
    );
    // await this.tm.getTN("action_list").resetP(true);
    // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
  }
  // send to approval for return back request
  public async scrapping_sendForApproval_confirmation() {
    this.scrap_comment = await this.tm.getTN("scrapping_comment").getData();
    if (!this.scrap_comment.asset_comment && !this.scrap_comment_list.length) {
      sap.m.MessageBox.error(`Comment is Mandatory`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }
    if (
      this.scrap_comment.asset_comment ||
      this.scrap_comment.asset_comment.asset_attachment
    ) {
      this.onScrapping_comment_sent();
    }

    sap.m.MessageBox.confirm("Do you want to Send the Request for Approval?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          await this.scrapping_send_for_approval();
        }
      }.bind(this),
    });
  }
  public async scrapping_send_for_approval() {
    try {
      var oBusy = new sap.m.BusyDialog({
        text: "please wait...",
      });
      oBusy.open();

      // Retrieve asset scrapping details
      const detail = await this.tm.getTN("scrapping_details").getData();

      // Execute the query for the master table
      const mainMasterTable = await this.transaction.getExecutedQuery(
        "d_asset_scrap_master",
        {
          company_code: detail.company_code,
          business_area: detail.business_area,
          // asset_type: detail.asset_type,
          request_type: "SC",
          lavel: 1,
          loadAll: true,
        }
      );
      const masterTable = mainMasterTable.filter(
        (item) => parseFloat(item.lavel) === 1
      );

      let currentAprData = <KloEntitySet<d_asset_action_item>>(
        await this.transaction.getExecutedQuery("d_asset_action_item", {
          request_number: detail.scrapping_request,
          action_status: "Return Back",
          loadAll: true,
        })
      );
      currentAprData[0].item_status = "Done";
      currentAprData[0].action_status = "Pending";
      currentAprData[0].action_required_by = masterTable[0].user_id;
      currentAprData[0].role_name = masterTable[0].roles;
      currentAprData[0].approval_sequence = currentAprData[0].approval_sequence;

      // Create the asset action item with role information
      // await this.transaction.createEntityP("d_asset_action_item", {
      //   s_object_type: -1,
      //   request_number: detail.scrapping_request,
      //   request_type: "SC",
      //   asset_number: detail.asset_no,
      //   tag_number: detail.tag_no,
      //   sub_asset_number: detail.sub_asset_no,
      //   action_status: "Pending",
      //   company_code: detail.company_code,
      //   business_area: detail.business_area,
      //   role_name: masterTable[0].roles,
      //   approval_sequence: currentAprData[0].approval_sequence,
      // });
      const previousApprData = await this.transaction.getExecutedQuery(
        "d_asset_approve_status",
        {
          request_number: detail.request_no,
          action_status: "Return Back",
          loadAll: true,
        }
      );
      previousApprData[0].action_status = "Done";
      previousApprData[0].item_status = "Done";

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: detail.scrapping_request,
        request_type: "SC",
        asset_number: detail.asset_no,
        tag_number: detail.tag_no,
        sub_asset_number: detail.sub_asset_no,
        action_status: "Pending",
        company_code: detail.company_code,
        business_area: detail.business_area,
        action_required_by: masterTable[0].user_id,
        approval_sequence: currentAprData[0].approval_sequence,
      });

      detail.action_status = "Pending";
      // Commit the transaction for approval
      // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
      await this.retrySave("Send For Approval", "Send Failed");
      oBusy.close();
      sap.m.MessageBox.success(
        `Request Number ${detail.scrapping_request} has been sent for Approval`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {
            await this.tm.getTN("action_list").resetP(true);
            await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
          }.bind(this),
        }
      );
      // await this.tm.getTN("action_list").resetP(true);
      // await this.navTo({ H: true, S: "p_asset_action", SS: "pa_action" });
    } catch (error) {
      console.error("Flow Master failed:", error);
      sap.m.MessageToast.show("Flow Master failed due to an error");
    }
  }
  public async onScrapping_comment_sent() {
    let listData = await this.tm.getTN("scrapping_details").getData();
    this.scrap_comment = await this.tm.getTN("scrapping_comment").getData();
    if (
      this.scrap_comment.asset_comment != undefined ||
      this.scrap_comment.asset_comment != ""
    ) {
      //await this.transaction.createEntityP('d_asset_purchase_approval', {s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox});
      let comment_list = await this.tm
        .getTN("scrapping_comment_list")
        .createEntityP(
          {
            s_object_type: -1,
            request_number: listData.purchase_request,
            request_type: "SC",
            asset_comment: this.scrap_comment.asset_comment,
          },
          null,
          null,
          null,
          "First",
          false,
          false,
          false
        );
      this.scrap_comment_list.push(comment_list);

      //await this.tm.getTN('purchase_comment_list').createEntityP(0,{s_object_type: -1, request_number: listData.purchase_request, request_type: "PR", asset_guid: listData.asset_id, asset_comment: comment.commentbox},true)
      if (this.scrapping_file) {
        await comment_list.asset_attachment.setAttachmentP(
          this.scrapping_file,
          this.scrapping_file_name
        );
      }
      comment_list = null;
      this.scrapping_file = null;
      this.scrapping_file_name = null;
      // this.scrap_comment.asset_attachment = null;
      // this.scrap_comment.commentbox = null;
    }
  }
  // DOWNLOAD ATTECHMENT 
  public async onScrappingDownloadAttech(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    this.tm.getTN("scrapping_comment_list").setActive(parseInt(path.replace(`/${"scrapping_comment_list"}/`, '')));
    let docdownload = await this.tm.getTN("scrapping_comment_list").getActiveData();
    await docdownload.asset_attachment.downloadAttachP();

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
    return modelNumber[0]?.model_number;
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
    return serialNumber[0]?.serial_number;
  }

  public async downloadGatepass() {
    let detail = await this.tm.getTN("transfer_details").getData();
    //@ts-ignore
    let jsPDFModule = await import("kloExternal/jspdf.min");
    const jspdf = jsPDFModule.default;

    const pdf = new jspdf("p", "mm", "a4");
    const margin = 10;
    const pageWidth = 210;
    const pageHeight = 297;

    // Add logo
    const logoWidth = 40;
    const logoHeight = 10;
    const logoX = margin + 2;
    const logoY = margin + 2;

    let c = await this.transaction.getExecutedQuery("d_asset_logo", {
      loadAll: true,
      file_name: "maventic_logo_2",
    });
    if (c[0].logo_attachment) {
      let attachment = await c[0].logo_attachment.getAttachmentBlobP();

      // Convert BLOB to base64
      const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob); // Convert blob to base64
        });
      };

      try {
        let base64Data = await blobToBase64(attachment);
        let base64Image = base64Data.split(",")[1]; // Get only the base64 part
        pdf.setFillColor(255, 255, 255);
        // Add image to the PDF
        pdf.addImage(base64Image, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Error converting BLOB to base64", error);
      }
    }
    // Add border to the page
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");

    let gatepassTitle = "";
    if (detail.transfer_sub_type === "PMNT") {
      gatepassTitle = "Non-Returnable Gatepass";
    } else if (detail.transfer_sub_type === "TEMP") {
      gatepassTitle = "Returnable Gatepass";
    } else {
      gatepassTitle = "Gatepass"; // fallback for other cases
    }

    pdf.text(gatepassTitle, pageWidth / 2, margin + 10, {
      align: "center",
    });

    // Adding two empty lines after the title
    const titleHeight = margin + 30;

    // Header Info
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    // Left Header (From and Consignee)
    const leftHeaderX = margin + 5;
    let headerY = titleHeight + 10;

    pdf.setFont("helvetica", "bold");
    pdf.text("From:", leftHeaderX, headerY);

    pdf.setFont("helvetica", "normal");
    headerY += 5;
    pdf.text(
      (await this.getCompanyCodeName(detail.company_code)) || "",
      leftHeaderX,
      headerY
    );
    headerY += 4;
    pdf.text(
      (await this.getBusinessAreaName(detail.business_area)) || "",
      leftHeaderX,
      headerY
    );

    headerY += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Consignee:", leftHeaderX, headerY);

    pdf.setFont("helvetica", "normal");
    headerY += 5;
    pdf.text(
      (await this.getCompanyCodeName(detail.desig_company_code)) || "",
      leftHeaderX,
      headerY
    );
    headerY += 4;
    pdf.text(
      (await this.getBusinessAreaName(detail.desig_business_area)) || "",
      leftHeaderX,
      headerY
    );

    // Right Header (Gate Pass Info)
    const rightHeaderX = pageWidth - margin - 75;

    // Dynamic Gate Pass No
    pdf.setFont("helvetica", "bold");
    pdf.text("Gate Pass No:", rightHeaderX, titleHeight + 10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      detail.gatepass_number?.toString() || "",
      rightHeaderX + 30,
      titleHeight + 10
    );

    // Dynamic Gate Pass Date
    const currentDate = new Date();
    const formattedDate = currentDate
      .toLocaleDateString("en-GB")
      .replace(/\//g, ".");

    pdf.setFont("helvetica", "bold");
    pdf.text("Gate Pass Date:", rightHeaderX, titleHeight + 15);
    pdf.setFont("helvetica", "normal");
    pdf.text(formattedDate, rightHeaderX + 30, titleHeight + 15);

    // Dynamic Department
    pdf.setFont("helvetica", "bold");
    pdf.text("Department:", rightHeaderX, titleHeight + 20);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      (await this.getBusinessAreaName(detail.business_area)) || "",
      rightHeaderX + 30,
      titleHeight + 20
    );

    // Mapping for transfer reasons
    const transferReasonMap: { [key: string]: string } = {
      "1": "REPAIR/SERVICE",
      "2": "TEMPORARY TRANSFER",
      "3": "TO OTHER PLANT",
      "4": "PERMANENT TRANSFER",
      "5": "OWNERSHIP TRANSFER",
      "6": "TRANSFER TO DEPARTMENT",
      "7": "TRANSFER TO FLOOR",
      "8": "TRANSFER TO BUILDING",
    };

    // Get the transfer reason description
    const transferReason =
      transferReasonMap[detail.transfer_reason?.toString()] || "";

    // Table
    const tableTop = headerY + 35;
    const tableHeaders = [
      "S.no",
      "Asset Number",
      "Tag Number",
      "Model No.",
      "Serial No",
      "Purpose",
      "Asset Desc.",
    ];
    const tableWidth = pageWidth - 2 * margin - 10;
    const tableColumnWidths = [10, 25, 25, 25, 25, 30, 40];
    const tableHeight = 10;
    const tableColumnX = tableColumnWidths.reduce(
      (acc, curr, i) => {
        acc.push(acc[i] + curr);
        return acc;
      },
      [margin + 5]
    );

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    // Draw table header border
    pdf.setLineWidth(0.5);
    pdf.rect(margin + 5, tableTop, tableWidth, tableHeight);

    // Draw table header text
    tableHeaders.forEach((header, i) => {
      const textX = tableColumnX[i] + tableColumnWidths[i] / 2;
      pdf.text(header, textX, tableTop + tableHeight / 2 + 2, {
        align: "center",
      });
    });

    // Prepare row data
    let rowData = [
      [
        "0001",
        detail.asset_number?.toString() || "",
        detail.tag_number?.toString() || "",
        (await this.getModelNumber(detail.asset_number)) || "",
        (await this.getSerialNumber(detail.asset_number)) || "",
        transferReason,
        detail.asset_description?.toString() || "",
      ],
    ];

    // Add additional rows if detail.r_transfer_other has length > 0
    if (detail.r_transfer_other && detail.r_transfer_other.length > 0) {
      for (let i = 0; i < detail.r_transfer_other.length; i++) {
        rowData.push([
          `000${i + 2}`, // S.no starts from 0002
          detail.r_transfer_other[i].asset_number?.toString() || "",
          detail.r_transfer_other[i].tag_number?.toString() || "",
          (await this.getModelNumber(
            detail.r_transfer_other[i].asset_number
          )) || "",
          (await this.getSerialNumber(
            detail.r_transfer_other[i].asset_number
          )) || "",
          transferReason,
          detail.r_transfer_other[i].asset_description?.toString() || "",
        ]);
      }
    }

    // Draw table column lines
    pdf.setLineWidth(0.5);
    tableColumnX.forEach((x) => {
      pdf.line(
        x,
        tableTop,
        x,
        tableTop + tableHeight + rowData.length * tableHeight
      );
    });

    // Draw line separating header from data
    pdf.line(
      margin + 5,
      tableTop + tableHeight,
      pageWidth - margin - 5,
      tableTop + tableHeight
    );

    pdf.setFont("helvetica", "normal");

    // Function to add a new page if needed
    const addNewPageIfNeeded = (currentY: number) => {
      if (currentY > pageHeight - margin - 40) {
        pdf.addPage();
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(
          margin,
          margin,
          pageWidth - 2 * margin,
          pageHeight - 2 * margin
        );
        return margin + 10;
      }
      return currentY;
    };

    let currentY = tableTop + tableHeight;

    rowData.forEach((row, rowIndex) => {
      currentY = addNewPageIfNeeded(currentY);

      const rowStartY = currentY;
      let maxRowHeight = tableHeight;

      row.forEach((cell, colIndex) => {
        const cellWidth = tableColumnWidths[colIndex] - 2;
        const lines = pdf.splitTextToSize(cell, cellWidth);
        const cellHeight = lines.length * 4;
        maxRowHeight = Math.max(maxRowHeight, cellHeight);

        lines.forEach((line, lineIndex) => {
          const textX =
            tableColumnX[colIndex] + tableColumnWidths[colIndex] / 2;
          const textY = currentY + (lineIndex + 1) * 4;
          pdf.text(line, textX, textY, { align: "center" });
        });
      });

      // Draw horizontal line after each row
      currentY += maxRowHeight;
      pdf.line(margin + 5, currentY, pageWidth - margin - 5, currentY);

      // Redraw vertical lines for this row
      tableColumnX.forEach((x) => {
        pdf.line(x, rowStartY, x, currentY);
      });
    });

    // Signature section
    currentY = addNewPageIfNeeded(currentY + 20);
    const signatureTop = currentY;
    const signatureFields = [
      "Prepared By",
      "Approved By",
      "Receiver",
      "Security Signature:",
    ];
    const signatureValues = [
      detail.s_created_by.toUpperCase(),
      this.userid.toUpperCase(),
      (detail.receiver_name ?? "").toUpperCase(),
      "",
    ];
    const signatureWidth = (pageWidth - 2 * margin - 10) / 4;
    //
    pdf.setFontSize(9);
    pdf.setLineWidth(0.5);
    pdf.rect(margin + 5, signatureTop - 5, pageWidth - 2 * margin - 10, 25);

    signatureFields.forEach((field, i) => {
      const x = margin + 5 + i * signatureWidth;
      pdf.setFont("helvetica", "bold");
      pdf.text(field, x + 2, signatureTop);
      pdf.setFont("helvetica", "normal");
      pdf.text(signatureValues[i], x + 2, signatureTop + 10);
      if (i < 3)
        pdf.line(
          x + signatureWidth,
          signatureTop - 5,
          x + signatureWidth,
          signatureTop + 20
        );
    });

    // Footer Note
    const noteTop = signatureTop + 30;
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.text(
      "Note: Please permit the bearer to carry the following items out of the permission",
      margin + 5,
      noteTop
    );
    pdf.text(
      "*** This is an electronically generated document and requires no signature ***",
      margin + 5,
      noteTop + 5
    );

    pdf.save(`gate_pass_${detail.request_number}.pdf`);
    const blob = pdf.output("blob");
    await detail.gatepass_attachment.setAttachmentP(
      blob,
      `gate_pass_${detail.request_number}.pdf`
    );
  }

  public async changeAssetStatus() {
    let assetNumbers = [];
    let assetDetails = await this.tm.getTN("transfer_details").getData();
    assetNumbers.push(assetDetails.asset_number);

    if (assetDetails.r_transfer_other && assetDetails.r_transfer_other.length > 0) {
      for (let i = 0; i < assetDetails.r_transfer_other.length; i++) {
        assetNumbers.push(assetDetails.r_transfer_other[i].asset_number);
      }
    }
    if (assetDetails.r_transfer_club && assetDetails.r_transfer_club.length > 0) {
      for (let i = 0; i < assetDetails.r_transfer_club.length; i++) {
        assetNumbers.push(assetDetails.r_transfer_club[i].child_asset_number)
      }

    }
    let assetCreationTable = await this.transaction.getExecutedQuery(
      "d_asset_creation",
      {
        asset_number: assetNumbers,
        loadAll: true,
      }
    );

    for (let i = 0; i < assetCreationTable.length; i++) {
      assetCreationTable[i].status = "Transferred";
    }
  }
  public async transferExpression() {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const busyDialog = new sap.m.BusyDialog({
      text: "Please Wait, Data is loading..."
    });
    busyDialog.open();

    try {
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
    } finally {
      busyDialog.close();
    }
  }

  public async onPurchaseMailSend(companyCode, businessArea, profitCenter, role, requestNumber, createdBy, actionType, teamHead) {
    if (actionType === "sendForNextAppr") {

      if (role === 'TEAM_HEAD') {
        await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseRequest");
        await this.tm.getTN("purchase_request_mail").setProperty('employee', teamHead);
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

      await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseLevelApproval");
      await this.tm.getTN("purchase_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("purchase_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("purchase_request_mail").executeP();

    } else if (actionType === "finalAppr") {

      await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseFinalApproval");
      await this.tm.getTN("purchase_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("purchase_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("purchase_request_mail").executeP();

    } else if (actionType === "reject") {

      await this.tm.getTN("purchase_request_mail").setProperty('type', "purchaseRejection");
      await this.tm.getTN("purchase_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("purchase_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("purchase_request_mail").executeP();
    }
  }
  public async onAllocationMailSend(companyCode, role, requestNumber, createdBy, actionType) {
    if (actionType === "sendForNextAppr") {
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
        await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRequest");
        await this.tm.getTN("allocation_request_creation").setProperty('employee', emp_ids);
        await this.tm.getTN("allocation_request_creation").setProperty('request_number', requestNumber);
        await this.tm.getTN("allocation_request_creation").executeP();
      }

      await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationLevelApproval");
      await this.tm.getTN("allocation_request_creation").setProperty('employee', createdBy);
      await this.tm.getTN("allocation_request_creation").setProperty('request_number', requestNumber);
      await this.tm.getTN("allocation_request_creation").executeP();

    } else if (actionType === "finalAppr") {

      await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationFinalApproval");
      await this.tm.getTN("allocation_request_creation").setProperty('employee', createdBy);
      await this.tm.getTN("allocation_request_creation").setProperty('request_number', requestNumber);
      await this.tm.getTN("allocation_request_creation").executeP();

    } else if (actionType === "reject") {

      await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRejection");
      await this.tm.getTN("allocation_request_creation").setProperty('employee', createdBy);
      await this.tm.getTN("allocation_request_creation").setProperty('request_number', requestNumber);
      await this.tm.getTN("allocation_request_creation").executeP();
    }
  }
  public async onScrappingMailSend(companyCode, role, requestNumber, createdBy, actionType) {
    if (actionType === "sendForNextAppr") {
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
        await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingRequest");
        await this.tm.getTN("scrapping_request_mail").setProperty('employee', emp_ids);
        await this.tm.getTN("scrapping_request_mail").setProperty('request_number', requestNumber);
        await this.tm.getTN("scrapping_request_mail").executeP();
      }
      await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingLevelApproval");
      await this.tm.getTN("scrapping_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("scrapping_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("scrapping_request_mail").executeP();

    } else if (actionType === "finalAppr") {

      await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingFinalApproval");
      await this.tm.getTN("scrapping_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("scrapping_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("scrapping_request_mail").executeP();

    } else if (actionType === "reject") {

      await this.tm.getTN("scrapping_request_mail").setProperty('type', "scrappingRejection");
      await this.tm.getTN("scrapping_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("scrapping_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("scrapping_request_mail").executeP();
    }
  }
  public async onTransferMailSend(companyCode, role, requestNumber, createdBy, actionType) {
    if (actionType === "sendForNextAppr") {
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
      await this.tm.getTN("transfer_request_mail").setProperty('type', "transferLevelApproval");
      await this.tm.getTN("transfer_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("transfer_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("transfer_request_mail").executeP();

    } else if (actionType === "finalAppr") {

      await this.tm.getTN("transfer_request_mail").setProperty('type', "transferFinalApproval");
      await this.tm.getTN("transfer_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("transfer_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("transfer_request_mail").executeP();

    } else if (actionType === "reject") {

      await this.tm.getTN("transfer_request_mail").setProperty('type', "transferRejection");
      await this.tm.getTN("transfer_request_mail").setProperty('employee', createdBy);
      await this.tm.getTN("transfer_request_mail").setProperty('request_number', requestNumber);
      await this.tm.getTN("transfer_request_mail").executeP();
    }
  }


  public async afterSearch() {
    this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_search"));
  }


  public onApprovedLiveChange(oEvent) {
    let inputValue = oEvent.getParameters().value;

    // Ensure it's a string before using replace
    let cleanedValue = String(inputValue).replace(/[^0-9]/g, '');

    // Remove leading zeros
    cleanedValue = cleanedValue.replace(/^0+/, '');

    // Limit to 3 digits
    if (cleanedValue.length > 3) {
      cleanedValue = cleanedValue.slice(0, 3);
    }

    // Example: get request number value from your model or UI
    let requestNo = Number(this.tm.getTN('purchase_details').getData().requested_quantity); // adjust ID


    // Apply limit based on request number
    let maxAllowed = Math.max(0, requestNo); // Example: 3 less than request no
    if (Number(cleanedValue) > maxAllowed) {
      sap.m["MessageToast"].show("Value Can't be more the Requested Quantity. Setting Requested Value As Approved value");
      cleanedValue = String(maxAllowed);
    }



    // Set the cleaned value back to the input control
    oEvent.getSource().setValue(parseInt(cleanedValue));

  }

  public onPurchaseLiveChange(oEvent) {
    let inputValue = oEvent.getParameters().value;

    // Ensure it's a string before using replace
    let cleanedValue = String(inputValue).replace(/[^0-9]/g, '');

    // Remove leading zeros
    cleanedValue = cleanedValue.replace(/^0+/, '');

    // Limit to 3 digits
    if (cleanedValue.length > 3) {
      cleanedValue = cleanedValue.slice(0, 3);
    }

    // Example: get request number value from your model or UI
    let requestNo = this.tm.getTN('purchase_details').getData(); // adjust ID


    // Apply limit based on request number
    let maxAllowed = Math.max(0, Number(requestNo.approved_quantity)); // Example: 3 less than request no
    if (Number(cleanedValue) > maxAllowed) {
      sap.m["MessageToast"].show("Value Can't be more the Approved Quantity. Setting Approved Value As Purchase value");
      cleanedValue = String(maxAllowed);
    }
    requestNo.in_store_quantity = Number(requestNo.approved_quantity) - Number(cleanedValue)



    // Set the cleaned value back to the input control
    oEvent.getSource().setValue(parseInt(cleanedValue));

  }


  public onIn_storeLiveChange(oEvent) {
    let inputValue = oEvent.getParameters().value;

    // Ensure it's a string before using replace
    let cleanedValue = String(inputValue).replace(/[^0-9]/g, '');

    // Remove leading zeros
    cleanedValue = cleanedValue.replace(/^0+/, '');

    // Limit to 3 digits
    if (cleanedValue.length > 3) {
      cleanedValue = cleanedValue.slice(0, 3);
    }

    // Example: get request number value from your model or UI
    let requestNo = this.tm.getTN('purchase_details').getData(); // adjust ID


    // Apply limit based on request number
    let maxAllowed = Math.max(0, Number(requestNo.approved_quantity)); // Example: 3 less than request no
    if (Number(cleanedValue) > maxAllowed) {
      sap.m["MessageToast"].show("Value Can't be more the Approved Quantity. Setting Approved Value As In Store value");
      cleanedValue = String(maxAllowed);
    }
    requestNo.purchase_quantity = Number(requestNo.approved_quantity) - Number(cleanedValue)



    // Set the cleaned value back to the input control
    oEvent.getSource().setValue(parseInt(cleanedValue));

  }


  public welcometoklarion(value) {
    return value?.toUpperCase()
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
// changes by aman at 24-11-2025 at 1:41 pm