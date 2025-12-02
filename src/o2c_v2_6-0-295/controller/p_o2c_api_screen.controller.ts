import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_gsp_api_mapping } from 'o2c_v2/entity_gen/d_o2c_gsp_api_mapping';
import { d_client_master_prprty_map } from 'o2c_v2/entity_gen/d_client_master_prprty_map';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_api_screen")
export default class p_o2c_api_screen extends KloController {
    public created_obj; //To store the created entity

    public async onPageEnter(oEvent) {
        await this.tm.getTN("provider_data").setData([]);

        const adData = oEvent.navToParams?.AD || {};
        await this.tm.getTN("so_screen_data").setData(adData);

        const gspAPIProviderData =<KloEntitySet<d_o2c_gsp_api_mapping>> await this.transaction.getExecutedQuery('d_o2c_gsp_api_mapping', {
            loadAll: true,
            partialSelect: ['provider']
        });

        const providers = gspAPIProviderData.map(item => item.provider).filter(Boolean);
        const uniqueProviders = Array.from(new Set(providers)).map(provider => ({
            key: provider,
            description: provider
        }));

        await this.transaction.getExecutedQuery('q_o2c_so_api_type', {
            loadAll: true,
        });

        this.tm.getTN("api_query_search").setProperty('so_item', adData.rowID);
        await this.tm.getTN("api_query_search").executeP();

        await this.tm.getTN("provider_data").setData(uniqueProviders);

        //To view the extra 10 fields added in gsp api mapping table.
        let api_list = await this.tm.getTN("api_list").getData();
        for (let api of api_list) {
            await this.hideControls(api);
            // for (let i = 1; i <= 10; i++) {
            //     api[`pmf${i}_visible`] = false;
            //     api[`pmf${i}_visible_drpdwn`] = false;
            // }
            // let api_gsp_map = await api.r_api_gsp_map.fetch();
            // // checking if the provider master data is maintained or not.
            // if (api_gsp_map && api_gsp_map.length > 0) {
            //     let property_mapping_data = await api_gsp_map[0].r_gsp_provider_prprty_map.fetch();
            //     await this.controlPrprtyVisibility(api, property_mapping_data);
            // }
        }

    }

    public async onCreate() {
        const adData = this.tm.getTN("so_screen_data").getData();
        this.created_obj = await this.tm.getTN("api_list").createEntityP({ soitem: adData.rowID }, "Creation Successful", "Creation Failed", null, "First", false, true, false);
        // Hiding the extra 10 fields..
        for (let i = 1; i <= 10; i++) {
            this.created_obj[`cmf${i}_visible`] = false;
            this.created_obj[`cmf${i}_visible_drpdwn`] = false;
        }
    }

    //To hide the extra 10 controls in the list..
    public async hideControls(list_item) {
        try {
            // let api_detail = await this.tm.getTN("api_detai").getData();
            // for (let api of api_list) {
            for (let i = 1; i <= 10; i++) {
                list_item[`cmf${i}_visible`] = false;
                list_item[`cmf${i}_visible_drpdwn`] = false;
            }
            // let api_gsp_map = await list_item.r_api_gsp_map.fetch();
            // checking if the provider master data is maintained or not.
            // if (api_gsp_map && api_gsp_map.length > 0) {
            // let property_mapping_data1 = await list_item.r_api_client_map.fetch();
            let property_mapping_data = [];
            if (list_item.provider) {
                property_mapping_data = <KloEntitySet<d_client_master_prprty_map>>await this.transaction.getExecutedQuery("d_client_master_prprty_map", { loadAll: true, provider: list_item.provider });
            }
            await this.controlPrprtyVisibility(list_item, property_mapping_data);
            // }
            // }
        } catch (e) {
            console.log(e);
        }
    }

    //To control the visibility extra 10 properties in Provider Master
    public async controlPrprtyVisibility(provider_detail, property_map) {
        for (let i = 0; i < property_map.length; i++) {

            provider_detail[`${property_map[i].sys_field_name}_UI_lbl`] = property_map[i].ui_name;
            if (property_map[i].field_type == "DropDown") {
                provider_detail[`${property_map[i].sys_field_name}_visible_drpdwn`] = true;
                let property_dropdown = await property_map[i].r_property_dropdown_map.fetch();
                await this.tm.getTN(`${property_map[i].sys_field_name}_dropdown_list`).setData(property_dropdown);
            } else {
                provider_detail[`${property_map[i].sys_field_name}_visible`] = true;
            }
        }
    }

    //On Change of subscription update the 10 extra fields..
    public async onSubscritionChange(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/api_list/", ''));
        let data = await this.tm.getTN("api_list").getData()[index];
        // await this.hideControls(data); // Not doing through relation because at time of create the relation mapping is not available.

        if (data.api_type && data.provider) {
            let property_mapping_data = <KloEntitySet<d_client_master_prprty_map>>await this.transaction.getExecutedQuery("d_client_master_prprty_map", { loadAll: true, provider: data.provider });
            if(property_mapping_data.length){
                await this.controlPrprtyVisibility(data, property_mapping_data);
            }else{
                for (let i = 1; i <= 10; i++) {
                    data[`cmf${i}_visible`] = false;
                    data[`cmf${i}_visible_drpdwn`] = false;
                }
            }
        }
    }
}