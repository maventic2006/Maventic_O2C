import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from "kloTouch/jspublic/KloController";
import { debugPort } from "process";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_deallocation")
export default class p_asset_deallocation extends KloController {
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
    

    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
      // customIconHeight:"44px",
    });
    oBusy.open();

    await this.tm.getTN("deallocation_reason_dropdown").setData({});
    await this.tm.getTN("allocation_details_characterstic").setData({});

    // const dealloReason = [
    //   { key: "need repair", description: "Need Repairing" },
    //   { key: "damaged", description: "Damaged" },
    //   { key: "resigned", description: "Resigned" },
    // ];
    // await this.tm.getTN("deallocation_reason_dropdown").setData(dealloReason);
    // scrapping reason dropdown
    await this.tm.getTN("asset_condition_dropdown").setData({});

    // const assetCondition = [
    //   { key: "good", description: "Good" },
    //   { key: "damaged", description: "Damaged" },
    //   { key: "scratch", description: "Scratch" },
    // ];
    // await this.tm.getTN("asset_condition_dropdown").setData(assetCondition);

    // const list = await this.tm.getTN("asset_creation_search").executeP();

    let assetRequest = oEvent.navToParams.AssetNumber;
    this.tm
      .getTN("asset_creation_search")
      .setProperty("asset_number", assetRequest);
    await this.tm.getTN("asset_creation_search").executeP();
    await this.tm.getTN("asset_list").setActiveFirst();


    this.tm.getTN("allocation_vm_search").setProperty('asset_number', assetRequest);
		this.tm.getTN("allocation_vm_search").setProperty('status', "Allocated");
    await this.tm.getTN("allocation_vm_search").executeP();

    // deallocation details charactestics
		let asset_details = await this.transaction.getExecutedQuery(
			'd_asset_creation',
			{
				'asset_number': assetRequest,
				loadAll: true
			});
			let allocationCharacterstic = await this.transaction.getExecutedQuery(
			'd_asset_allocation_config',
			{
				'asset_class': asset_details[0].asset_class,
				'sub_asset_class': asset_details[0].asset_sub_class,
				loadAll: true
			});
			await this.tm.getTN("allocation_details_characterstic").setData(allocationCharacterstic[0]);

    this.tm.getTN("deallocation_vm_history").setProperty('asset_number', assetRequest);
		this.tm.getTN("deallocation_vm_history").setProperty('status', "Deallocated");
    await this.tm.getTN("deallocation_vm_history").executeP();

    //const assetRequest = "200040";

    // Fetch data for each item in parallel
    // await Promise.all(list.map(item => item.fetch()));
    // const index = list.findIndex(item => item.asset_number == assetRequest);
    // await this.tm.getTN("asset_list").setActive(index);
    //debugger;
    // let asset_allocation_list = await this.tm.getTN("asset_details/r_asset_allocation");

    oBusy.close();
  }
  public async onDeallocate() {
    var oBusy = new sap.m.BusyDialog({
      text: "please wait...",
      // customIconHeight:"44px",
    });
    oBusy.open();

    let deallocationDetails = await this.tm.getTN("asset_allocation_details").getData();
    let assetDetails = await this.tm.getTN("asset_details").getData();
    let comment = await this.tm.getTN("comment_details").getData();
    // debugger;
    // validation for allocation date
    // !comment.deallocation_comment
    if(!deallocationDetails.deallocation_comment){
      oBusy.close();
      sap.m.MessageBox.error(
        `Comment is Mandatory`,
        {
          title: "Success",
          actions: [sap.m.MessageBox.Action.OK],
          onClose: null,
        }
    );
    return;
    }
    if(!deallocationDetails.asset_condition || !deallocationDetails.deallocation_date){
      oBusy.close();
      let field = "";
      if(!deallocationDetails.asset_condition){
        field = "Asset Condition"
      }else{
        field = "Deallocation Date"
      }
      sap.m.MessageBox.error(
            `${field} is Mandatory`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: null,
            }
        );
        return;
    }
    if (deallocationDetails.allocation_date > deallocationDetails.deallocation_date) {
		sap.m.MessageBox.error(
            `Deallocation Date cannot be less than Allocation Date`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: null,
            }
        );
		oBusy.close();
		return ;
	}

    sap.m.MessageBox.confirm("Do you want to Deallcoate the Asset?", {
      title: "Confirmation",
      actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      onClose: async function (oAction) {
        if (oAction === sap.m.MessageBox.Action.YES) {

          var oBusy = new sap.m.BusyDialog({
            text: "please wait...",
          });
          oBusy.open();
          // await this.deallocateFlow();
          
          assetDetails.status = "In Store";
          assetDetails.action_status = "";
          assetDetails.assigned_to = "";
          assetDetails.department = "";
          deallocationDetails.action_status = "Deallocated";

          await this.transaction.createEntityP("d_asset_log_table", {
            s_object_type: -1,
            request_number: deallocationDetails.request_no,
            company_code: deallocationDetails.company_code,
            business_area: deallocationDetails.business_area,
            asset_number: deallocationDetails.asset_no,
            tag_number: deallocationDetails.tag_no,
            log_type: "Deallocation",
          });

          // update the club asset
        let assetClubbed = await this.transaction.getExecutedQuery(
          'd_o2c_asset_clubbing',
          {
            'parent_asset_number': deallocationDetails.asset_no,
            loadAll:true
          });
        
          let clubAssetIds = [];
          for(let i=0; i<assetClubbed.length; i++){
            clubAssetIds.push(assetClubbed[i].child_asset_number);
          }
          let clubbedAssetCreationData = [];
          if(clubAssetIds.length){
            clubbedAssetCreationData = await this.transaction.getExecutedQuery(
              "d_asset_creation",
              {
                asset_number: clubAssetIds,
                loadAll: true,
              }
            );
          }
          
          for(let i=0; i<clubbedAssetCreationData.length; i++){
            clubbedAssetCreationData[i].status = "In Store";
            clubbedAssetCreationData[i].assigned_to = null;
            clubbedAssetCreationData[i].department='';
          }

          await this.tm.commitP(
            "Deallocated","Deallocation Failed",false, true
          );
          oBusy.close();
          sap.m.MessageBox.success(
            `De-allocation done successfully`,
            {
              title: "Success",
              actions: [sap.m.MessageBox.Action.OK],
              onClose: async function() {
                // Await your navigation function
                await this.navTo({ H: true, S: "p_asset_deshboard" });
              }.bind(this)
            }
          );

          
          // await this.navTo({ H: true, S: "p_asset_deshboard" });
          
        }
      }.bind(this),
    });

    oBusy.close();
  }

  public async onVmDeallocation(oEvent){

		const asset_details = await this.tm.getTN("asset_details").getData();
		asset_details.status = "In Store"

		let allocation_list = await this.tm.getTN("r_asset_vm_allocation").getData();
    let asset_status = 	await this.transaction.getExecutedQuery("q_asset_allocation_status", {asset_no:asset_details.asset_no,action_status:["Pending","Allocated"],skipMap:true,loadAll: true })

    asset_status[0].action_status = "Pending"

		let selectedObject = await this.getActiveControlById(null,'s_vm_allo_details').getSelectedIndices();
		for(let i=0; i<selectedObject.length; i++){
			allocation_list[selectedObject[i]].item_status = "Deallocated";
      allocation_list[selectedObject[i]].deallocation_date = new Date();

      if(allocation_list.length == selectedObject.length){
				asset_status[0].action_status = "Deallocated"
			}

		}
		
		
	
  
    await this.tm.commitP("Save", "Send Failed", false, true);
    await this.tm.getTN("allocation_vm_search").executeP();

    await this.tm.getTN('r_asset_vm_allocation').resetP(true);
			await this.tm.getTN('r_asset_vm_allocation').refresh();

			await this.tm.getTN('r_asset_vm_deallocation').resetP(true);
			await this.tm.getTN('r_asset_vm_deallocation').refresh();
	}
}
