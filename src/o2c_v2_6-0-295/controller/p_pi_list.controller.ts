import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pi_list")
export default class p_pi_list extends KloController {
  public userid: string;
  public onPageInit() {
    try {
      FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
    } catch (error) {
      sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
      throw error;
    }
  }
  public async onPageEnter() {
    this.tm.getTN("pi_status_value").setData({});
    this.tm.getTN("item_status_value").setData({});
    this.tm.getTN("bar_code_other").setData({});
    this.tm.getTN("completed_expression").setData({});
    this.userid = (await this.transaction.get$User()).login_id;
    this.tm.getTN("pi_status_value").setData("All");
    this.tm.getTN("item_status_value").setData("All");

    this.tm.getTN("search").setProperty('pi_status', "Pending");
    this.tm.getTN("completed_expression").setData(false);
    await this.tm.getTN("search").executeP();
    await this.tm.getTN('button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'deactivate', 'all_status': 'deactivate' })
    await this.tm.getTN('inner_button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'deactivate', 'all_status': 'deactivate' })



    this.tm.getTN("pi_status_value").setData("Pending");
    this.tm.getTN("bar_code_other").setData("");
  }
  public async subscreenEnter(subScreenIds: ["pa_item_list"]) { }
  public async onPending() {


    // await this.tm.getTN("pi_list").applyfilterP("pi_status", "Pending");
    // await this.tm.getTN("pi_list").refresh();

    await this.tm.getTN('button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'activate', 'all_status': 'deactivate' })

    this.tm.getTN("search").setProperty('pi_status', "Pending");
    await this.tm.getTN("search").executeP();


    this.tm.getTN("pi_status_value").setData("Pending");
  }

  public async onCompleted() {
    // await this.tm.getTN("pi_list").applyfilterP("pi_status", "Approved");
    // await this.tm.getTN("pi_list").refresh();
    await this.tm.getTN('button_color').setData({ 'complete_status': 'activate', 'pending_status': 'deactivate', 'all_status': 'deactivate' })




    this.tm.getTN("search").setProperty('pi_status', "Completed");
    await this.tm.getTN("search").executeP();

    this.tm.getTN("pi_status_value").setData("Completed");
  }
  // public async onAll() {
  //   // await this.tm.getTN("pi_list").applyfilterP("pi_status", "");
  //   // await this.tm.getTN("pi_list").refresh();

  //   // this.tm.getTN("search").setProperty('pi_status', 'All');
  //   await this.tm.getTN("search").executeP();

  //   this.tm.getTN("pi_status_value").setData("All");
  // }
  public async onNavToAssetItem(oEvent: any) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/pi_list/", ""));
    await this.tm.getTN("pi_list").setActive(index);

    await this.navTo({ H: true, S: "p_pi_list", SS: "pa_item_list" });
    await this.onExpressionBindingCompleted(-1);

  }
  public async onAssetPending() {
    await this.tm.getTN("item_list").applyfilterP("status", "Pending");
    await this.tm.getTN("item_list").refresh();
    this.tm.getTN("item_status_value").setData("Pending");
    await this.tm.getTN('inner_button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'activate', 'all_status': 'deactivate' })
  }

  public async onAssetCompleted() {
    let status = "Approved"
    let pi_detail = await this.tm.getTN('pi_detail').getData();

    if (pi_detail.pi_status == "Completed") {
      status = "Completed"
    }
    await this.tm.getTN("item_list").applyfilterP("status", status);
    await this.tm.getTN("item_list").refresh();
    this.tm.getTN("item_status_value").setData(status);
    await this.tm.getTN('inner_button_color').setData({ 'complete_status': 'activate', 'pending_status': 'deactivate', 'all_status': 'deactivate' })
  }
  public async onAssetAll() {
    await this.tm.getTN("item_list").applyfilterP("status", "");
    await this.tm.getTN("item_list").refresh();
    this.tm.getTN("item_status_value").setData("All");
    await this.tm.getTN('inner_button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'deactivate', 'all_status': 'activate' })
  }
  public async onNavToAssetDetail(oEvent: any) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/item_list/", ""));
    await this.tm.getTN("item_list").setActive(index);
    await this.navTo({ H: true, S: "p_pi_list", SS: "pa_asset_details" });
    await this.onExpressionBindingCompleted(-1);
  }
  public async onVerifyAsset() {
    let detail = await this.tm.getTN("item_detail").getData();

    if (!detail.verify_remark) {
      var oErrorDialog = new sap.m.Dialog({
        title: "Error",
        type: sap.m.DialogType.Message,
        state: sap.ui.core.ValueState.Error,
        content: new sap.m.Text({
          text: "Remark is mandatory.",
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            oErrorDialog.close();
          },
        }),
        afterClose: function () {
          oErrorDialog.destroy();
        },
      });

      oErrorDialog.open();
      return;
    }
    detail.asset_found = "Found";
    detail.status = "Approved";
    detail.varify_by = this.userid.toUpperCase();
    detail.last_verification = new Date();
    detail.verify_on = new Date()

    sap.m.MessageBox.confirm(
      `Are you sure you want to verify this asset number ${detail.asset_number}?`,
      {
        title: "Confirmation",
        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
        onClose: async (oAction: sap.m.MessageBox.Action) => {
          if (oAction === sap.m.MessageBox.Action.OK) {
            await this.tm.commitP("Approved", "Failed", true, true);
            await this.onExpressionBindingCompleted(-1);
            await this.navTo({ H: true, S: "p_pi_list", SS: "pa_item_list" });
          }
          // You can handle the cancel action if needed
          else if (oAction === sap.m.MessageBox.Action.CANCEL) {
            console.log("Operation canceled");
          }
        },
      }
    );

  }
  public async onMarkAsNotFound(oEvent: any) {
    let path = this.getPathFromEvent(oEvent);
    let index = parseInt(path.replace("/item_list/", ""));
    let list = await this.tm.getTN("pi_detail").getData().r_pi_asset_item;
    list[index].asset_found = "Not Found";
    list[index].status = "Approved";
    list[index].varify_by = this.userid.toUpperCase();
    list[index].last_verification = new Date();
    list[index].verify_on = new Date();

    sap.m.MessageBox.confirm(
      "Are you sure you want to mark this asset as not found?",
      {
        title: "Confirmation",
        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
        onClose: async (oAction: sap.m.MessageBox.Action) => {
          if (oAction === sap.m.MessageBox.Action.OK) {
            await this.tm.commitP("Approved", "Failed", true, true);
            // await this.navTo({ H: true, S: "p_pi_list", SS: "pa_pi_list" });
          }
          // You can handle the cancel action if needed
          else if (oAction === sap.m.MessageBox.Action.CANCEL) {
            console.log("Operation canceled");
          }
        },
      }
    );
    await this.onExpressionBindingCompleted(-1);
  }

  public async onCompletedButton() {


    sap.m.MessageBox.confirm(
      "Are you sure you want to mark this PI as completed?",
      {
        title: "Confirmation",
        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
        onClose: async (oAction: sap.m.MessageBox.Action) => {
          if (oAction === sap.m.MessageBox.Action.OK) {
            let detail = await this.tm.getTN("pi_detail").getData();
            detail.pi_status = "Completed";

            let pi_list_data = await detail.r_pi_asset_item;
            if (pi_list_data.length == 0) {
              sap.m.MessageBox.error(`Some Issue while Fetching Asset Data.`);
              return;
            }

            for (let i = 0; i < pi_list_data.length; i++) {
              pi_list_data[i].status = "Completed";
            }

            detail.approved_by = this.userid.toUpperCase();
            detail.approved_on = new Date();
            await this.tm.commitP("Completed", "Failed", true, true);

            // Nasim Code for mail

            await this.tm.getTN("pi_verification_mail").setProperty('type', "piComplete");
            await this.tm.getTN("pi_verification_mail").setProperty('employee', detail.s_created_by);
            await this.tm.getTN("pi_verification_mail").setProperty('pi_number', detail.pi_doc_number);
            await this.tm.getTN("pi_verification_mail").setProperty('verifier_name', detail.assign_to_name);
            await this.tm.getTN("pi_verification_mail").setProperty('completion_date', detail.pi_date);

            await this.tm.getTN("pi_verification_mail").executeP();


            await this.navTo({ H: true, S: "p_pi_list", SS: "pa_pi_list" });
          } else if (oAction === sap.m.MessageBox.Action.CANCEL) {
            console.log("Operation canceled");
          }
        }
      }
    );
  }

  public async onPISummary() {
    let detail = await this.tm.getTN("pi_detail").getData();

    let verifiedCount = 0;
    let notVerifiedCount = 0;
    let assetFoundCount = 0;
    let assetNotFoundCount = 0;
    let goodConditionCount = 0;
    let damagedCount = 0;
    let scratchCount = 0;
    let pi_list_data = await detail.r_pi_asset_item;

    pi_list_data.forEach((item: {
      status: string;
      asset_found: string;
      asset_condition: string;
    }) => {
      if (item.status === "Completed") {
        verifiedCount++;
      } else {
        notVerifiedCount++;
      }

      if (item.asset_found === "Found") {
        assetFoundCount++;
      } else if (item.asset_found === "Not Found") {
        assetNotFoundCount++;
      }

      if (item.asset_condition === "GD") {
        goodConditionCount++;
      } else if (item.asset_condition === "DM") {
        damagedCount++;
      } else if (item.asset_condition === "SC") {
        scratchCount++;
      }
    });

    const dialog = new sap.m.Dialog({
      contentWidth: "500px",
      draggable: true,
      resizable: false,
      customHeader: new sap.m.Bar({
        contentLeft: [
          new sap.m.Title({
            text: "Physical Inventory Summary",
            level: "H2",
            wrapping: true
          }).addStyleClass("piSummaryTitle")
        ],
        contentRight: [
          new sap.m.Button({
            icon: "sap-icon://decline",
            type: "Transparent",
            tooltip: "Close",
            press: function () {
              dialog.close();
            }
          })
        ]
      }).addStyleClass("piSummaryHeader"),
      content: [
        new sap.ui.core.HTML({
          content: `
            <div style="font-family: 'Segoe UI', sans-serif; font-size: 15px; color: #0f172a; padding: 24px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                ${renderBox("PI Number:", detail.pi_doc_number, "#f8fafc", "#0f172a", true)}
                ${renderBox("Asset Found:", assetFoundCount, "#eff6ff", "#2563eb")}
                ${renderBox("Total Assets in PI:", pi_list_data.length, "#f8fafc", "#0f172a")}
                ${renderBox("Asset Not Found:", assetNotFoundCount, "#fef2f2", "#dc2626")}
                ${renderBox("Verified:", verifiedCount, "#ecfdf5", "#16a34a")}
                ${renderBox("In Good Condition:", goodConditionCount, "#f8fafc", "#0f172a")}
                ${renderBox("Not Verified:", notVerifiedCount, "#fefce8", "#ca8a04")}
                ${renderBox("Damaged:", damagedCount, "#f8fafc", "#0f172a")}
              </div>
              <div style="margin-top: 16px;">
                ${renderBox("Scratch:", scratchCount, "#f8fafc", "#0f172a")}
              </div>
            </div>
          `
        })
      ]
    });

    this.getView().addDependent(dialog);
    dialog.open();

    function renderBox(label: string, value: any, bgColor: string, textColor: string, boldLabel = false) {
      return `
        <div style="
          background: ${bgColor}; 
          color: ${textColor}; 
          border-radius: 12px; 
          padding: 14px 18px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          font-weight: 500; 
          font-size: 15px;
        ">
          <span style="${boldLabel ? 'font-weight: bold;' : ''}">${label}</span>
          <span style="font-weight: bold;">${value}</span>
        </div>
      `;
    }
  }


  public async onExpressionBindingCompleted(path) {
    let list;

    //   if (path === "-1") {
    list = await this.tm.getTN("pi_detail").getData().r_pi_asset_item;
    //   } else {
    //     let pi_list = await this.tm.getTN("pi_list").getData();
    //     let index = parseInt(path.replace("/pi_list/", ""));
    //     list = await pi_list[index].r_pi_asset_item.fetch();
    //   }

    let allCompleted = list.every((item: any) => (item.status === "Approved"));
    //let allCompleted = list.find((item: any) => (item.status === "Pending"));

    this.tm.getTN("completed_expression").setData(allCompleted);


  }
  public async onBarcodeRead() {
    let list = await this.tm.getTN("item_list").getData();
    let barcodeDetail = await this.tm.getTN("bar_code_other").getData();
    let assetNumberFromBarcode = parseInt(barcodeDetail.split('-')[1], 10);

    let matchingIndex = list.findIndex(item => item.asset_number === assetNumberFromBarcode);

    if (matchingIndex !== -1) {
      await this.tm.getTN("item_list").setActive(matchingIndex);
      await this.navTo({ H: true, S: "p_pi_list", SS: "pa_asset_details" });
    } else {
      sap.m.MessageBox.error(`The scanned asset number ${assetNumberFromBarcode} does not exist in the current Physical Inventory (PI) records.`);
    }
  }

  public async onClickAll() {
    await this.tm.getTN('button_color').setData({ 'complete_status': 'deactivate', 'pending_status': 'deactivate', 'all_status': 'activate' })
    this.tm.getTN("search").setProperty('pi_status', ["Completed", "Pending"]);
    await this.tm.getTN("search").executeP();

    this.tm.getTN("pi_status_value").setData("All");
  }
}
