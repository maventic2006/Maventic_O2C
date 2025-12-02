import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
let attachment = [];
let assets = [];
@KloUI5("o2c_v2.controller.p_asset_creation")
export default class p_asset_creation extends KloController {
  public attachment_file;
  public attachment_file_name;
  public attachment;

  public onInit() { }
  public onBeforeRendering() { }
  public onAfterRendering() { }
  public onExit() { }
  //

  public onPageInit() {
    try {
      FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
    } catch (error) {
      sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
      throw error;
    }
  }
  public async onPageEnter() {
    await this.tm.getTN("purchase_request_no").setData({});
    await this.tm.getTN("tag_number_generation").setData({});
    await this.tm.getTN("asset_attach_list").setData({});
    await this.tm.getTN("other_attachment").setData({});
    await this.tm.getTN("asset_attachment_other").setData({});
    await this.tm.getTN("property_dropdown").setData([{ "keys": "pic", "type": "picture" }, { "keys": "oth", "type": "Other" }]);
    await this.tm.getTN("asset_attachment_other").setProperty('attechment_view', '')

    this.tm.getTN("section_visibility").setData({});

    sap.m.MessageToast.show("Please Select Purchase Request Number from the Drop Down. ", { duration: 6000 });
    this.tm.getTN("section_visibility").setProperty("visible",false);
    await this.tm.getTN("file_type").setData({});

    const fileType = [
      { key: "oth", description: "Other" },
      { key: "pic", description: "Picture" },
    ];
    await this.tm.getTN("file_type").setData(fileType);
  }
  public async documentUpload(oEvent) {
    this.attachment_file = oEvent.mParameters.files[0];
    this.attachment_file_name = oEvent.mParameters.files[0].name;

  }

  public async onPurchase_Comment_sent() {



  }
  public async onRequestSearch() {
    try {
      let busyDialog = new sap.m.BusyDialog({
        text: "Please Wait...",
      });
      busyDialog.open();



      const purchaseRequest = await this.tm.getTN("purchase_request_no").getData().purchase_request;

      const list = await this.tm.getTN("asset_purchase_request_search").executeP();


      let querySearch = this.tm.getTN("creation_asset_search");
      querySearch.setProperty("purchase_request", purchaseRequest)

      querySearch.getData().setLoadAll(true);
      await querySearch.executeP();


      // await Promise.all(list.map((item) => item.fetch()));

      // set section visibility true
      this.tm.getTN("section_visibility").setProperty("visible",true);

      // const index = list.findIndex((item) => item.purchase_request === purchaseRequest);

      // if (index !== -1 && list[index].status == "Approved") {
      //   await this.tm.getTN("asset_purchase_request_list").setActive(index);
      // }
      await this.tm.getTN("asset_purchase_request_list").setActive(0);
      
      await this.onMultipleCreation()
      // await this.tm.commitP();
      await this.retrySave(null,null);
      busyDialog.close();
    } catch (error) {
      console.error("An error occurred during onRequestSearch:", error);
    }
  }
  public async onDiscardChanges() {
    let list = await this.tm.getTN("asset_purchase_request_detail").getData().r_purchase_creation
    for (let i = 0; i < list.length; i++) {
      list[i].deleteP();
    }
    //await this.tm.commitP()
    await this.retrySave(null,null);
    await this.navTo({ H: true, S: "p_asset_deshboard" });

  }
  public async onMultipleCreation() {
    let basicDetail = await this.tm.getTN("asset_purchase_request_detail").getData();
    let currentCreationLength = basicDetail.r_purchase_creation.length;
    let approvedQuantity = parseInt(basicDetail.purchase_quantity);

    const otherAdditionCheck = await this.transaction.getExecutedQuery("d_asset_additional_details", { loadAll: true, asset_class: basicDetail.asset_class, });
    await this.tm.getTN("asset_additional_details").setData(otherAdditionCheck);
    const multipleAssetCheck = await this.transaction.getExecutedQuery("d_multiple_asset_config", { loadAll: true, asset_class: basicDetail.asset_class, });
    await this.tm.getTN("multiple_asset_check").setData(multipleAssetCheck);
    if (currentCreationLength > 0) {
      return;
    }


    let purchase_creation = await this.tm.getTN("asset_purchase_request_detail").getData().r_purchase_creation
    for (let i = 0; i < approvedQuantity; i++) {
      try {

        await purchase_creation.newEntityP(0, {
          s_object_type: basicDetail.asset_class,
          company_code: basicDetail.company_code,
          business_area: basicDetail.business_area,
          asset_class: basicDetail.asset_class,
          asset_sub_class: basicDetail.asset_sub_class,
          asset_type: basicDetail.asset_type,
          approved_quantity: basicDetail.approved_quantity,
          purchase_quantity: basicDetail.purchase_quantity,
          functional_area: basicDetail.functional_area,
          profit_center: basicDetail.profit_center,
        }, true)

      } catch (error) {
        console.error("Failed to create entity:", error);
        break;
      }
    }
    await this.tm.getTN("purchase_creation_list").setActiveFirst();
  }

 
//AMC DATA ADD FOR VERY 1ST LINE ITEM
  public async addAmcItems() {
    await this.tm.getTN("purchase_creation_list").setActive(0);
    let purchase_request = await this.tm.getTN("purchase_request_no").getData().purchase_request;
    let list = await this.tm.getTN("purchase_creation_list").getData();
    let detail = await this.tm.getTN("asset_purchase_request_detail").getData();


    await this.tm.getTN("amc_table_list").createEntityP({
        request_no: purchase_request,
        sub_asset_no: 0,
        tag_no: 0,
        asset_class: detail.asset_class,
        asset_sub_class: detail.asset_sub_class,
        company_code: detail.company_code,
        business_area: detail.business_area,
      },"Creation Successful","Creation Failed",null,"Last",true,true,false);
  }

  //ADDING ATTACHMENT
  public async addAttachment() {
    await this.tm.getTN("purchase_creation_detail/r_asset_attachment").createEntityP({ s_object_type: -1 },null,null,null,"First",true,true,false);
    await this.tm.getTN("other_attachment").setData(true);
  }

  public async addAttachmentNew() {
    let attachmentCreate = await this.tm.getTN("purchase_creation_detail/r_asset_attachment").createEntityP({ s_object_type: -1 }, null, null, null, "First", true, true, false);
    let other_attachment_data = await this.tm.getTN("asset_attachment_other").getData();


    await attachmentCreate.file_content.setAttachmentP(this.attachment_file, this.attachment_file_name);

    attachmentCreate.attachment_type = other_attachment_data.attachment_type;
    attachmentCreate.file_name = this.attachment_file_name;
    this.attachment_file = null
    this.attachment_file_name = null

    // await this.tm.getTN('asset_attachment_lists').resetP(true);
    await this.tm.getTN('asset_attachment_lists').refresh();

  }

  //ASSET CREATION PART
  public async onAssetCreation(oEvent, param) {
    let dialog = new sap.m.Dialog({
      title: "Confirm",
      type: sap.m.DialogType.Message,
      content: new sap.m.Text({text: "Are you sure you want to create these assets?",}),
      beginButton: new sap.m.Button({
        text: "Yes",
        press: async () => {
          dialog.close();

          let busyDialog = new sap.m.BusyDialog().setText("Generation of AMC/LOG Details...").open();

          let list = await this.tm.getTN("purchase_creation_list").getData();
          let assetNumbers = new Set();
          let purchase_request = await this.tm.getTN("purchase_request_no").getData().purchase_request;
          let firstItemData = await list[0].r_asset_amc.fetch();
          // my code

          let log_table = await this.transaction.getExecutedQuery('d_asset_log_table', { "company_code": "check" })
          let amc_table = await this.transaction.getExecutedQuery('d_amc_table', { "request_no": "check" })

          const firstItem = list[0];
          const logPromises = [];
          const amcPromises = [];

          for (let i = 0; i < list.length; i++) {
            const item = list[i];

            // Asset Logging
            if (item.asset_number) {

              busyDialog.setText(`log Generation -> ${item.asset_number}`)
              logPromises.push(log_table.newEntityP(0, {s_object_type: -1,company_code: item.company_code,business_area: item.business_area,asset_number: item.asset_number,tag_number: item.tag_number,log_type: "Asset Creation",}, true));

              assetNumbers.add(item.asset_number);
              item.status = "In Store";
            }

            // Copy common fields from first item
            if (i > 0) {

              list[i].purchase_date = list[0].purchase_date
              list[i].purchase_order_number = list[0].purchase_order_number
              list[i].invoice_number = list[0].invoice_number
              list[i].is_rented = list[0].is_rented
              list[i].vendor = list[0].vendor
              list[i].invoice_date = list[0].invoice_date
              list[i].depriciation_method = list[0].depriciation_method
              list[i].depriciation_rate = list[0].depriciation_rate
              list[i].net_book_value = list[0].net_book_value
              list[i].accumulated_depriciation = list[0].accumulated_depriciation
              list[i].life_of_asset = list[0].life_of_asset
             

              // AMC Entries (only for i > 0)
              busyDialog.setText(`AMC Generation -> ${item.asset_number}`)
              for (const lineItem of firstItemData) {
                amcPromises.push( amc_table.newEntityP(0, {
                    request_no: purchase_request,
                    asset_no: item.asset_number,
                    sub_asset_no: lineItem.sub_asset_no,
                    tag_no: lineItem.tag_no,
                    document_type: lineItem.document_type,
                    provider: lineItem.provider,
                    provider_doc_no: lineItem.provider_doc_no,
                    start_date: lineItem.start_date,
                    end_date: lineItem.end_date,
                    asset_class: lineItem.asset_class,
                    asset_sub_class: lineItem.asset_sub_class,
                    company_code: lineItem.company_code,
                    business_area: lineItem.business_area,
                  }, true)
                );
              }
            }
          }

          // Await all logging and AMC creation operations in parallel
          busyDialog.setText(`Pending Promise Resolving...`)
          await Promise.all(logPromises);
          await Promise.all(amcPromises);
          
          busyDialog.setText(`Created Successfully`)
          busyDialog.close();
          let assetMessage = assetNumbers.size > 0 ? "The following asset(s) were created successfully:\n\n" +
              Array.from(assetNumbers).map((num) => `• Asset Number: ${num}`).join("\n"): "No assets were created.";

          sap.m.MessageBox.success(assetMessage, {
            title: "Success",
            onClose: () => {
              let secondDialog = new sap.m.Dialog({
                title: "Generate Tag Numbers",
                type: sap.m.DialogType.Message,
                content: new sap.m.Text({
                  text: "Would you like to generate tag numbers for the created asset numbers?",
                }),
                beginButton: new sap.m.Button({
                  text: "Generate Tag Numbers",
                  press: async () => {
                    await this.openDialog("pa_tag_number");
                    secondDialog.close();
                    //await this.tm.commitP("Saved Successfully","Save Failed",true,true);
                    await this.retrySave("Saved Successfully","Save Failed");
                  },
                }),
                endButton: new sap.m.Button({
                  text: "No, Thanks",
                  press: async () => {
                    secondDialog.close();
                    //await this.tm.commitP("Saved Successfully","Save Failed",true,true);
                    await this.retrySave("Saved Successfully","Save Failed");
                    await this.navTo({ H: true, S: "p_asset_deshboard" });
                  },
                }),
                afterClose: function () {
                  secondDialog.destroy();
                },
              });
              secondDialog.open();
            },
          });
        },
      }),
      endButton: new sap.m.Button({
        text: "No",
        press: () => {
          dialog.close();
        },
      }),
      afterClose: function () {
        dialog.destroy();
      },
    });
    dialog.open();
  }




  public async generateTagNumber() {
    let busyDialog = new sap.m.BusyDialog().setText("Generating Tag...").open();

    await this.tm.getTN("tag_number_generation").setData(true);
    let indices = await this.getActiveControlById(null,"s_tag_number").getSelectedIndices();

    let dialogBoxList = await this.tm.getTN("purchase_creation_list").getData();
    let basicDetails = await this.tm.getTN("asset_purchase_request_detail").getData();

    indices.forEach(async (index) => {
      const serialNumber = dialogBoxList[index].serial_number;
      if (serialNumber === undefined || serialNumber === null || serialNumber === "") {
        dialogBoxList[index].tag_number = `${basicDetails.business_area}-${dialogBoxList[index].asset_number}`;
      } else {
        dialogBoxList[index].tag_number = `${basicDetails.business_area}-${dialogBoxList[index].asset_number}-${serialNumber}`;
      }
    });

    await this.tm.getTN("purchase_creation_list").refresh();
    busyDialog.close();
    // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    await this.retrySave("Saved Successfully","Save Failed");

  }

  public async onDateChange(oEvent: sap.ui.base.Event) {
    // let path = this.getPathFromEvent(oEvent);
    // let index = parseInt(path.replace("/amc_table_list/", ""));
    // let amcData = await this.tm.getTN("amc_table_list").getData();

    // let startDate = amcData[index].start_date;
    // let endDate = amcData[index].end_date;

    // if (new Date(startDate) > new Date(endDate)) {
    //   sap.m.MessageToast.show("Start date must be smaller than End date");
    //   amcData[index].start_date = null;
    //   amcData[index].end_date = null;
    // }
  }
  public async onFinalNavigation(oEvent) {
    
    let busyDialog = new sap.m.BusyDialog().setText("Please Wait Maintaining log..").open();

    let list = await this.tm.getTN("purchase_creation_list").getData();
    let assetNumbers = list.map((item) => item.asset_number);

    let logData = await this.transaction.getExecutedQuery("d_asset_log_table", {loadAll: true,asset_number: assetNumbers});

    let logDataMap = new Map(logData.map((log) => [log.asset_number, log]));

    busyDialog.setText("almost done...")
    for (let item of list) {
      let logEntry = logDataMap.get(item.asset_number);
      if (logEntry) {
        logEntry.tag_number = item.tag_number;
      }
    }
    busyDialog.setText("Done...")
    // await this.tm.commitP();
    await this.retrySave(null,null);
    busyDialog.close();

    await this.navTo({ H: true, S: "p_asset_deshboard" });
  }

  public async attachDelete(oEvent, param) {

    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace(`/${param.trans_node}/`, ''))

    await this.tm.getTN(param.trans_node).getData()[index].deleteP()



  }

  public async attachDownload(oEvent, param) {
    let path = this.getPathFromEvent(oEvent);
    this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
    let docdownload = await this.tm.getTN(param.trans_node).getActiveData()//.getProperty('r_manag_attch');
    await docdownload.file_content.downloadAttachP();

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
//11:00 25 Nov
