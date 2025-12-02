import { log } from 'console';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_product_master_tre")
export default class p_product_master_tre extends KloController {

	/*public async onPageModelReady() {
		//This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
		  //This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/

	//Navigation code
	public async click(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		//Identifier Navigation
		if (path.includes('r_gsp_api_identifier')) {
			let index = parseInt(path.replace("/o2c_product_master_list/", ''));
			await this.tm.getTN('o2c_product_master_list').setActive(index);
			let index_2 = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/`, ''));
			await this.tm.getTN('prdct_mstr_api_type').setActive(index_2);
			let index_3 = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/${index_2}/r_api_type_gsp_map/`, ''))
			await this.tm.getTN('provider_list').setActive(index_3);
			let index_4 = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/${index_2}/r_api_type_gsp_map/${index_3}/r_gsp_api_identifier/`, ''));
			await this.tm.getTN('api_identifier_list').setActive(index_4);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_identifier_detail" }))
			// this.tm.getTN("functional_area_new_detail").setData(this.tm.getTN(path).getData());
			// await this.tm.getTN('functional_area_new_detail').setActive(0);
		}
		//Provider Navigation
		else if (path.includes('r_api_type_gsp_map')) {
			let index = parseInt(path.replace("/o2c_product_master_list/", ''));
			await this.tm.getTN('o2c_product_master_list').setActive(index);
			let index_2 = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/`, ''));
			await this.tm.getTN('prdct_mstr_api_type').setActive(index_2);
			let x = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/${index_2}/r_api_type_gsp_map/`, ''))
			await this.tm.getTN('provider_list').setActive(x);
			let provider_detail_data = await this.tm.getTN("o2c_product_master_list").getData()[index].r_prdt_mstr_api_type[index_2].r_api_type_gsp_map[x];
			for(let i=1; i<=10 ; i++){
				provider_detail_data[`pmf${i}_visible`] = false;
				provider_detail_data[`pmf${i}_visible_drpdwn`] = false;
			}
			let property_mapping_data = await provider_detail_data.r_gsp_provider_prprty_map.fetch();
			await this.controlPrprtyVisibility(provider_detail_data,property_mapping_data);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_provider_detail" }))
			// this.tm.getTN("functional_area_new_detail").setData(this.tm.getTN(path).getData());
			// await this.tm.getTN('functional_area_new_detail').setActive(0);
		}
		//Subscription navigation
		else if (path.includes('r_prdt_mstr_api_type')) {
			let index = parseInt(path.replace("/o2c_product_master_list/", " "));
			let x = parseInt(path.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/`, ''))
			await this.tm.getTN('o2c_product_master_list').setActive(index);
			await this.tm.getTN('prdct_mstr_api_type').setActive(x);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_api_type_detail" }))
			// this.tm.getTN("profit_centre_details").setData(this.tm.getTN("o2c_product_master_list").getProperty(path.split("o2c_product_master_list/")[1]));

		}
		// Product Navigation
		else {
			let index = parseInt(path.replace("/o2c_product_master_list/", ''));
			this.tm.getTN('o2c_product_master_list').setActive(index);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_prd_mstr_detail" }));
			// this.tm.getTN('o2c_product_master_detail').setData(this.tm.getTN(path).getData());
			// await this.tm.getTN('o2c_product_master_detail').setActive(0);
		}
	}

	//Creating Product
	public async onAddingProduct(oEvent: sap.ui.base.Event) {
		await this.navTo(({ S: "p_product_master_tre", SS: "pa_prd_mstr_detail" }));
		this.tm.getTN("o2c_product_master_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
	}

	//On click of create button in the list
	public async onClickCreate(oEvent: sap.ui.base.Event) {
		let way = this.getPathFromEvent(oEvent);
		let index = parseInt(way.replace("/o2c_product_master_list/", " "));
		await this.tm.getTN('o2c_product_master_list').setActive(index);
		// Creating Identifier
		if (way.includes('r_api_type_gsp_map')) {
			let index = parseInt(way.replace("/o2c_product_master_list/", ''));
			let y = parseInt(way.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/`, ''));
			let z = parseInt(way.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/${y}/r_api_type_gsp_map/`, ''));
			await this.tm.getTN("api_identifier_list").setData(this.tm.getTN("o2c_product_master_list").getProperty(index).r_prdt_mstr_api_type[y].r_api_type_gsp_map[z].r_gsp_api_identifier);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_identifier_detail" }))
			let x = await this.tm.getTN("api_identifier_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
			await this.tm.getTN("api_identifier_detail").setData(x);
			// this.onFuncArea();
		}
		// Creating Provider
		else if (way.includes('r_prdt_mstr_api_type')) {
			let index = parseInt(way.replace("/o2c_product_master_list/", ''));
			let y = parseInt(way.replace(`/o2c_product_master_list/${index}/r_prdt_mstr_api_type/`, ''))
			await this.tm.getTN("provider_list").setData(this.tm.getTN("o2c_product_master_list").getProperty(index).r_prdt_mstr_api_type[y].r_api_type_gsp_map);
			
			let x = await this.tm.getTN("provider_list").createEntityP({}, "Created Successfully", "Created Failed", null, "First", true, true);
			// let provider_detail_data = await this.tm.getTN("o2c_product_master_list").getData()[index].r_prdt_mstr_api_type[index_2].r_api_type_gsp_map[x];
			for(let i=1; i<=10 ; i++){
				x[`pmf${i}_visible`] = false;
				x[`pmf${i}_visible_drpdwn`] = false;
			}
			await this.tm.getTN("provider_detail").setData(x);
			let property_mapping_data = await x.r_gsp_provider_prprty_map.fetch();
			await this.controlPrprtyVisibility(x,property_mapping_data);
			await this.navTo(({ S: "p_product_master_tre", SS: "pa_provider_detail" }))
			// this.onFuncArea();
		}
		//On click of create button against product in the list.. for creating subscription
		else {
			// let j = parseInt(way.replace("/o2c_product_master_list/", ''))
			await this.tm.getTN("prdct_mstr_api_type").setData(this.tm.getTN("o2c_product_master_list").getProperty(index).r_prdt_mstr_api_type);
			// await this.tm.getTN("profit_centre_list").setData(this.tm.getTN("o2c_product_master_list").getProperty(j).r_profit_center);
			await this.openDialog('pa_dialog_subscripti');
		}
	}

	//Creating Subscription
	public async onAddingSubscription(oEvent: sap.ui.base.Event, type) {
		this.closeDialog('pa_dialog_subscripti');
		await this.navTo(({ S: "p_product_master_tre", SS: "pa_api_type_detail" }));
		// Setting data in Subscription based on the object type
		let object_type = (type.type == "API") ? "api_object_type" : "amc_object_type";
		let x = await this.tm.getTN("prdct_mstr_api_type").createEntityP({ s_object_type: object_type, identifiernext: `Subscription (${type.type})`, subscription_type: type.type }, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("prdct_mstr_api_type_detail").setData(x);
	}

	//Setting the value in the tree through Formatter function
	public getTreeDescription(p1, p2, p3, p4) {
		if (p1) {
			return p1;
		} else if (p2) {
			return p2;
		}
		else if (p3) {
			return p3;
		} else {
			return p4;
		}
	}

	//Delete Product, Subscription, Provider and Identifier
	public async delete(oEvent,path) {
		sap.m.MessageBox.confirm("Are you sure you want to delete?", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.YES,
			sap.m.MessageBox.Action.NO],
			onClose: async (oAction) => {
				if (oAction == "YES") {
					await this.tm.getTN(path.path).deleteP();	
					await this.tm.commitP("Deleted Successfully", "Unable to delete", true, true);
					await this.navTo(({ S: "p_product_master_tre", SS: "pa_prd_mstr_tree" }))
				}
				if (oAction == "NO") {

				}

			}
		})
	}

	//To control the visibility extra 10 properties in Provider Master
	public async controlPrprtyVisibility(provider_detail,property_map){
		for(let i=0; i<property_map.length;i++){
			
			provider_detail[`${property_map[i].sys_field_name}_UI_lbl`] = property_map[i].ui_name;
			if(property_map[i].field_type == "DropDown"){
				provider_detail[`${property_map[i].sys_field_name}_visible_drpdwn`] = true;
				let property_dropdown = await property_map[i].r_property_dropdown_map.fetch();
				await this.tm.getTN(`${property_map[i].sys_field_name}_dropdown_list`).setData(property_dropdown);
			}else{
				provider_detail[`${property_map[i].sys_field_name}_visible`] = true;
			}
		}
	}

}