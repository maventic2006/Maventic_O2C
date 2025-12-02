import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloEntitySet } from "kloBo/KloEntitySet";

import { KloController } from "kloTouch/jspublic/KloController";
import { d_o2c_profit_centre } from "o2c_v2/entity_gen/d_o2c_profit_centre";
declare let KloUI5: any;
let comment_list;
@KloUI5("o2c_v2.controller.p_asset_scrapping")
export default class p_asset_scrapping extends KloController {
  public userid;
  public filenm;
  public fileup;
  public scrapping_comment_list = [];
  public scrapping_comment;
  public commentList;
  // public scrappingEntity;
  public onInit() {}
  public onBeforeRendering() {}
  public onAfterRendering() {}
  public onExit() {}

  public onPageInit() {
		try {
			FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
		} catch (error) {
			sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
			throw error;
		}
	}

  public async onPageEnter(oEvent) {
    this.userid = (await this.transaction.get$User()).login_id;

    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
    });
    oBusy.open();
    // scrapping reason dropdown
    await this.tm.getTN("scrapping_reason_dropdown").setData({});
    await this.tm.getTN("sracpping_details_oth").setData({});

    const fileType = [
      { key: "Donate", description: "Donate" },
      { key: "Scrap", description: "Scrap" },
      { key: "Sell Off", description: "Sell Off" },
    ];
    await this.tm.getTN("scrapping_reason_dropdown").setData(fileType);

    let assetRequest = oEvent.navToParams.AssetNumber;
    this.tm
      .getTN("asset_creation_search")
      .setProperty("asset_number", assetRequest);
    await this.tm.getTN("asset_creation_search").executeP();
    await this.tm.getTN("asset_list").setActiveFirst();

    const list = await this.tm.getTN("asset_creation_search").executeP();

    oBusy.close();
  }
  public async onSave() {
    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
    });
    oBusy.open();

    // if already sent for allocation
    const assetCreation = await this.tm.getTN("asset_details").getData();
    let assetClubbed = await this.transaction.getExecutedQuery(
      "q_scrap_club_validation",
      {
        asset_number: assetCreation.asset_number,
        loadAll: true,
      }
    );

    if (assetClubbed.length) {
      oBusy.close();
      if (assetCreation.asset_number === assetClubbed[0].parent_asset_number) {
        sap.m.MessageBox.error(`Firstly remove child asset then do scrapping`, {
          title: "Error",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: null,
        });
      } else {
        sap.m.MessageBox.error(
          `This is child asset of parent asset number ${assetClubbed[0].parent_asset_number} Firstly Unclub it and then do scrapping`,
          {
            title: "Error",
            actions: [sap.m.MessageBox.Action.OK],
            onClose: null,
          }
        );
      }

      return;
    }
    if (assetCreation.status == "In Store") {
      if(assetCreation.action_status && assetCreation.action_status != ""){
      	// debugger;
      	const assetAction = await this.transaction.getExecutedQuery('d_asset_action_item', {
      		asset_number: assetCreation.asset_number,
      		action_status: 'Pending',
      		loadAll: true
      	});
      	oBusy.close();
      	sap.m.MessageBox.error(`This asset is already in ${assetCreation.action_status} process with Request Number ${assetAction[0].request_number}`, {
      		title: "Error",
      		actions: [sap.m.MessageBox.Action.OK],
      		onClose: null
      	});
      	return;
      }
      if(assetCreation.is_vm === true){
          const assetAction = await this.transaction.getExecutedQuery('d_asset_allocation_request', {
            asset_no: assetCreation.asset_number,
            action_status: 'Allocated',
            loadAll: true
          });
          if(assetAction.length > 0){
            oBusy.close();
            sap.m.MessageBox.error(`Some quantity is already allocated of this asset, De-allocate first`, {
              title: "Error",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: null
            });
            return;
          } 
      }
    } else {
      oBusy.close();
      sap.m.MessageBox.error(`This asset is already ${assetCreation.status}`, {
        title: "Error",
        actions: [sap.m.MessageBox.Action.OK],
        onClose: null,
      });
      return;
    }

    let scrappingDetails = await this.tm
      .getTN("sracpping_details_oth")
      .getData();
    // debugger;
    if (!scrappingDetails || !scrappingDetails.scrapping_reason) {
      oBusy.close();
      sap.m.MessageBox.error("Scrapping reason is Mandatory.");
      return;
    }
    if (!scrappingDetails || !scrappingDetails.effective_date) {
      oBusy.close();
      sap.m.MessageBox.error("Effective Date is Mandatory.");
      return;
    }
    if (scrappingDetails.amount && isNaN(scrappingDetails.amount)) {
      oBusy.close();
      sap.m.MessageBox.error("Amount should be only numeric value.");
      return;
    }
    let comment = await this.tm.getTN("sracpping_details_oth").getData();
		if(!comment.asset_comment && this.scrapping_comment_list.length == 0){
			oBusy.close(); 
			sap.m.MessageBox.error(`Comment is Mandatory`, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			});	
			return;
		}
    if (
      assetCreation.asset_capitalization_date > scrappingDetails.effective_date
    ) {
      oBusy.close();
      sap.m.MessageBox.error(
        "Effective Date cannot be less than Asset Capitalization Date."
      );
      return;
    }
    sap.m.MessageBox.confirm("Do you want to Scrap the Asset?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {
          oBusy.open();
          await this.flowMaster(1);
          oBusy.close();
        }
      }.bind(this),
    });

    oBusy.close();
  }

  public async onUploadDoc(oEvent, param) {
    // let scrappingDetails = this.tm.getTN("sracpping_details_oth").getData();
    // await scrappingDetails.asset_attachment.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
    this.fileup = oEvent.mParameters.files[0];
    this.filenm = oEvent.mParameters.files[0].name;
  }

  public async flowMaster(level) {
    try {
      // debugger;
      // Retrieve asset allocation details
      const asset_details = await this.tm.getTN("asset_details").getData();
      let scrappingDetails = this.tm.getTN("sracpping_details_oth").getData();

      // creating scrapping details table data
       let scrappingEntity = await this.transaction.createEntityP(
        "d_asset_scrapping",
        {
          s_object_type: 0,
          asset_no: asset_details.asset_number,
          request_type: "SC",
          asset_description: asset_details.asset_description,
          sub_asset_no: asset_details.sub_asset_number
            ? asset_details.sub_asset_number
            : 0,
          company_code: asset_details.company_code,
          tag_no: asset_details.tag_number ? asset_details.tag_number : "",
          business_area: asset_details.business_area,
          profit_center: asset_details.profit_center,
          functional_area: asset_details.functional_area,
          asset_class: asset_details.asset_class,
          asset_sub_class: asset_details.asset_sub_class,
          asset_capitalization_date: asset_details.asset_capitalization_date,
          action_status: "Pending",
          scrapping_reason: scrappingDetails.scrapping_reason,
          effective_date: scrappingDetails.effective_date,
          amount: scrappingDetails.amount,
          party: scrappingDetails.party,
          vendor: scrappingDetails.vendor,
        }
      );
      // await this.tm.commitP("1st commit", "1st commit Failed", false, true);

      // creating comment details for this asset scrapping
      // let commentEntity = await this.transaction.createEntityP("d_asset_comment", {
      // 	asset_comment : scappingDetails.asset_comment,
      // 	s_created_on : new Date(),
      // 	s_created_by : this.userid,
      // 	request_number : scrappingEntity.scrapping_request,
      // 	request_type : "SC",
      // 	commeter_name : await this.approverName(this.userid)
      // });
      // if(this.fileup != null)
      // await commentEntity.asset_attachment.setAttachmentP(this.fileup, this.filenm);

      // Execute the query for the master table
      // const main_master_table = await this.transaction.getExecutedQuery(
      //   "d_asset_scrap_master",
      //   {
      //     company_code: asset_details.company_code,
      //     business_area: asset_details.business_area,
      //     lavel: level,
      //     loadAll: true,
      //   }
      // );
      // Execute the query for the master table
			const main_master_table = await this.transaction.getExecutedQuery('d_asset_purchase_master', {
				company_code: asset_details.company_code,
				// business_area: asset_details.business_area,
				request_type: "SC",
				level: level,
				loadAll: true
			});

      // Filter the master table based on the current level
      const masterTable = main_master_table.filter(
        (item) => parseFloat(item.level) === parseFloat(level)
      );

      // getting team head
			let team_head_id = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery('d_o2c_profit_centre', { 'company_code': asset_details.company_code, 'profit_center': asset_details.profit_center,loadAll: true })
      // Create the asset action item with role information
      await this.transaction.createEntityP("d_asset_action_item", {
        s_object_type: -1,
        request_number: scrappingEntity.scrapping_request,
        request_type: "SC",
        asset_number: asset_details.asset_number,
        tag_number: asset_details.tag_number,
        sub_asset_number: asset_details.sub_asset_number,
        asset_type: asset_details.asset_type,
        action_status: "Pending",
        company_code: asset_details.company_code,
        business_area: asset_details.business_area,
        profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
        role_name: masterTable[0].role,
        // action_required_by: masterTable[0].user_id,
        approval_sequence: 1,
        team_head: team_head_id[0].team_head
      });

      await this.transaction.createEntityP("d_asset_approve_status", {
        s_object_type: -1,
        request_number: scrappingEntity.scrapping_request,
        request_type: "SC",
        asset_number: asset_details.asset_number,
        tag_number: asset_details.tag_number,
        sub_asset_number: asset_details.sub_asset_number,
        action_status: "Pending",
        company_code: asset_details.company_code,
        business_area: asset_details.business_area,
        profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
        // action_required_by: masterTable[0].user_id,
        approval_sequence: 1,
        role_name: masterTable[0].role
      });

      // asset_details.action_status = "Pending";
      // creation table action status
      asset_details.action_status = "Scrapping";

      //comment
      if (
        scrappingDetails.asset_comment &&
        (scrappingDetails.asset_attachment || scrappingDetails.asset_comment)
      ) {
        await this.onScrapping_comment_sent();
      }
      for (let i = 0; i < this.scrapping_comment_list.length; i++) {
        this.scrapping_comment_list[i].request_number = scrappingEntity.scrapping_request;
      }

      // getting all employee with same designation for mail
      const designationMaster = await this.transaction.getExecutedQuery('d_o2c_designation_master', {
				company_code: asset_details.company_code,
				name: masterTable[0].role,
				is_active: true,
				loadAll: true
			});
			const empDesignation = await this.transaction.getExecutedQuery('d_o2c_employee_designation', {
				designation: designationMaster[0].designation_id,
				loadAll: true
			});
			let emp_ids=[];
			for(let i=0; i<empDesignation.length; i++){
				emp_ids.push(empDesignation[i].employee_id)
			}

      // Commit the transaction for approval
      // await this.tm.commitP("Send For Approval", "Send Failed", false, true);
      await this.retrySave("Send For Approval", "Send Failed");

      sap.m.MessageBox.success(
        `Request Number ${scrappingEntity.scrapping_request} has been created`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: async function () {
            // mail notification
            if(emp_ids.length > 0){
              await this.tm.getTN("scrapping_request_mail").setProperty("type", "scrappingRequest");
              await this.tm.getTN("scrapping_request_mail").setProperty("employee", emp_ids);
              await this.tm.getTN("scrapping_request_mail").setProperty("request_number", scrappingEntity.scrapping_request);
              await this.tm.getTN("scrapping_request_mail").executeP();
            }
            

            // Await your navigation function
            await this.navTo({ H: true, S: "p_asset_deshboard" });
          }.bind(this),
        }
      );

      // await this.navTo({ H: true, S: "p_asset_deshboard" });
    } catch (error) {
      console.error("Flow Master failed:", error);
      sap.m.MessageToast.show("Flow Master failed due to an error");
    }
  }
  public async onScrapping_comment_sent() {
    // let listData = await this.tm.getTN("allocation_details").getData();
    this.scrapping_comment = await this.tm
      .getTN("sracpping_details_oth")
      .getData();
    // let comment = await this.tm.getTN("allocation_comment").getData();

    if (
      this.scrapping_comment.asset_comment != undefined ||
      this.scrapping_comment.asset_comment != ""
    ) {
      
      // creating scrapping details table data
			comment_list = await this.transaction.createEntityP("d_asset_comment", {
				  s_object_type: -1,
          request_type: "SC",
          s_created_on: new Date(),
          commeter_name: await this.approverName(this.userid),
          asset_comment: this.scrapping_comment.asset_comment,
			});

      if (this.fileup) {
        await comment_list.asset_attachment.setAttachmentP(
          this.fileup,
          this.filenm
        );
      }
      this.scrapping_comment_list.push(comment_list);
      this.tm
        .getTN("sracpping_details_oth")
        .setProperty("comment_list", this.scrapping_comment_list);

      //   this.allocation_comment = null;
      this.fileup = null;
      this.filenm = null;
      this.tm.getTN("sracpping_details_oth").setProperty("asset_comment", null);
      this.tm
        .getTN("sracpping_details_oth")
        .setProperty("asset_attachment", null);
    }
  }
  public async approverName(id) {
    let approver = await this.transaction.getExecutedQuery("d_o2c_employee", {
      employee_id: id,
      partialSelect: ["first_name", "last_name"],
      loadAll: true,
    });
    if (approver.length > 0 && id) {
      return approver[0].full_name;
    }
    return "___";
  }
  // DOWNLOAD ATTECHMENT
  public async onDownloadAttach(oEvent) {
    let path = this.getPathFromEvent(oEvent);
    let index = path[path.length - 1];
    // this.tm.getTN("allocation_details_oth/comment_list").setActive(parseInt(path.replace(`/${"allocation_details_oth/comment_list"}/`, '')))
    //await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();
    let docdownload = await this.tm.getTN("sracpping_details_oth").getData()
      .comment_list[index]; //.getProperty('r_manag_attch');
    await docdownload.asset_attachment.downloadAttachP();
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
//25 Nov 12:07PM
