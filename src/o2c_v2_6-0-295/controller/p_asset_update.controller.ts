import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_update")
export default class p_asset_update extends KloController{
    public trns;
    public asset_detail;
    public asset_prev
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}

    public async onPageEnter(oEvent) {
        this.tm.getTN("asset_additional_details").setData({});

        let oBusyDailog = new sap.m.BusyDialog().setText("Fetching Data...");
		oBusyDailog.open();
        let assetNumber = oEvent.navToParams.AssetNumber
      if(assetNumber){

        this.tm.getTN("asset_search").setProperty('asset_number', assetNumber);
        await this.tm.getTN("asset_search").executeP();
        await this.tm.getTN('asset_lists').setActiveFirst()
        let asset_details = await this.tm.getTN('asset_details').getData()

        // asset details charactestics
		//let asset_details = await this.transaction.getExecutedQuery('d_asset_creation',{'asset_number': assetNumber,loadAll: true});
        let additionalDetails = await this.transaction.getExecutedQuery('d_asset_additional_details',{'asset_class': asset_details.asset_class,loadAll: true});
        
        await this.tm.getTN("asset_additional_details").setData(additionalDetails[0]);
            await this.tm.getTN("asset_change_other").setData({asset_class:asset_details.asset_sub_class,"asset_sub_class":asset_details.asset_sub_class});
           
      }else{

        sap.m.MessageToast.show("Asset Number is Not Assigned.", { duration: 5000 });

      }
       
       

        oBusyDailog.close()

    }
    public async navToDetails(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        await this.navTo(({ SS: 'pa_details' }), oEvent)
    }

    public async add(oEvent,param) {
        
         this.asset_detail = await this.tm.getTN('asset_details').getData();

        await this.tm.getTN(param.transnode_name).createEntityP({request_no:this.asset_detail.purchase_request_number,asset_no:this.asset_detail.asset_number,tag_no:this.asset_detail.tag_number,document_type:param.doc_type}, "Create successful", "Creation Failed", null, "First", true, true);
       
    }
    public async onSave(){
        this.asset_detail = await this.tm.getTN('asset_details').getData();

      await this.transaction.createEntityP('d_asset_log_table', { s_object_type: -1, company_code: this.asset_detail.company_code, business_area: this.asset_detail.business_area, log_type: "Asset Update", asset_number: this.asset_detail.asset_number, request_number: this.asset_detail.purchase_request_number, tag_number: this.asset_detail.tag_number });

      
        await this.tm.commitP("Applied Successfully", "Save Failed", true, true)
    }

    public async server_dialog(oEvent,param){
        let clubbed_asset = this.tm.getTN('clubbed_asset_list').getData()
        if(clubbed_asset.length == 0 ){
            await this.openDialog(param.dialog_pa);
            let asset_details =  await this.tm.getTN('asset_details').getData()
            this.asset_prev = asset_details.asset_sub_class
        }else{
            sap.m.MessageBox.warning(" Please Remove Clubbed Asset ", {
				title: "Warning",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			})
        }
       
    }


    public async desk_to_server(oEvent,param){
        

        let asset_details = await this.tm.getTN('asset_details').getData()
        let change_history = await this.tm.getTN('r_asset_change_status').getData()
        

        let prev_data = await asset_details.fromP()

        if(asset_details.is_vm){
           
            await change_history.newEntityP(0, { asset_numbers: asset_details.asset_number, change_from: this.asset_prev, change_to: asset_details.asset_sub_class,server_name:asset_details.server_name, is_vm: true, vm_quantity: asset_details.vm_quantity}, true);//leaveData[0].employee_id = managementData.mantees;

        }else{
           
            await change_history.newEntityP(0, { asset_numbers: asset_details.asset_number, change_from: this.asset_prev, change_to: asset_details.asset_sub_class,server_name:asset_details.server_name, is_vm: false, vm_quantity: 0}, true);//leaveData[0].employee_id = managementData.mantees;

        }
        if(asset_details.asset_sub_class == "SGRP-6013"){
            
            let asset_details = await this.tm.getTN('asset_details').getData()
            await this.tm.getTN("asset_change_other").setData({asset_class:asset_details.asset_sub_class});

            await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            await this.closeDialog(param.dialog_pa);

        }else{
            sap.m.MessageToast.show("please select server (SGRP-6013). Roll Back Changes", { duration: 4000 });
            await this.rl_back()
        }

  
    
    }

    public async server_to_desktop(oEvent,param){
    

        let asset_details = await this.tm.getTN('asset_details').getData()
        let change_history = await this.tm.getTN('r_asset_change_status').getData()

        let prev_data = await asset_details.fromP()
        
           
            await change_history.newEntityP(0, { asset_numbers: asset_details.asset_number, change_from: this.asset_prev, change_to: asset_details.asset_sub_class, is_vm: false, vm_quantity: 0}, true);
            
            asset_details.vm_quantity = 0;
            asset_details.is_vm = false;
            asset_details.server_name = null
            if(asset_details.asset_sub_class=="SGRP-6004" || asset_details.asset_sub_class=="SGRP-6003"){
               
                let asset_details = await this.tm.getTN('asset_details').getData()
            await this.tm.getTN("asset_change_other").setData({asset_class:asset_details.asset_sub_class});


                await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
                await this.closeDialog(param.dialog_pa);
            }else{
                sap.m.MessageToast.show("please select server (SGRP-6004  /  SGRP-6003). Roll Back Changes", { duration: 4000 });
                await this.rl_back()
            }
    }

    public async rl_back(){
        this.rollBack()
    }


    public async onserver_vm_quantitychange(){

        let details =  await this.tm.getTN("asset_details").getData();
        if(details.status == "Allocated"){
            sap.m.MessageToast.show("Please ensure the asset is deallocated first.", { duration: 5000 });
            details.is_vm = details.is_vm;
            details.server_name = details.server_name;
            details.vm_quantity = details.vm_quantity;
        }
        
    }



}