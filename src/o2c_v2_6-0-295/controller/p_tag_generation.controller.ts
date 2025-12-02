import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_tag_generation")
export default class p_tag_generation extends KloController {
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
public async afterSearch(){
  this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_asset_c_search"));
}
  public async generateTagNumber() {
    let indices = await this.getActiveControlById(
      null,
      "s_asset_c_list"
    ).getSelectedIndices();
    let list = await this.tm.getTN("asset_creation_list").getData();

    for (const index of indices) {
      if(list[index].serial_number === undefined || list[index].serial_number === null || list[index].serial_number === "")
      {
        list[index].tag_number = `${list[index].business_area}-${list[index].asset_number}`;
      }
      else
      {
        list[index].tag_number = `${list[index].business_area}-${list[index].asset_number}-${list[index].serial_number}`;
      }
      await this.transaction.createEntityP("d_asset_log_table", {
        s_object_type: -1,
        company_code: list[index].company_code,
        business_area: list[index].business_area,
        asset_number: list[index].asset_number,
        tag_number: list[index].tag_number,
        log_type: "Tag Number Generation",
      });
    }

    await this.tm.commitP();
  }
}
