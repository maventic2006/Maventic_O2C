import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloTransaction } from 'kloBo/KloTransaction'
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { d_vayana_api_helper_table } from 'o2c_v2/entity_gen/d_vayana_api_helper_table';
import { salesorder } from 'o2c_v2/util/salesorder';
import { d_o2c_so_item } from 'o2c_v2/entity_gen/d_o2c_so_item';

export class Hourly_check_vayana_api extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                debugger;
                let error;
                let txn: KloTransaction = this.eventContext.getTxn();
                let System = await import('kloBo/kloCommon/System/System');
                let helper_table = <KloEntitySet<d_vayana_api_helper_table>>await txn.getExecutedQuery("d_vayana_api_helper_table", { loadAll: true });
                if (helper_table.length) {
                    let task_status_res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                        url: System.System.gi_URI().getAppServiceUrl(this.operatingFlavor, this.operatingFlavorVersion, "getVayanaTaskStatus", true),
                        data: {
                            task_id: helper_table[0].task_id,
                            token: helper_table[0].token,
                            status_url: helper_table[0].status_url,
                            org_id: helper_table[0].org_id
                        },
                        method: "POST"
                    });

                    if (task_status_res.data.status == "completed") {
                        try {
                            const vayana_report_res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                                url: System.System.gi_URI().getAppServiceUrl(this.operatingFlavor, this.operatingFlavorVersion, "getVayanaReport", true),
                                method: "POST",  // <-- This is important
                                data: {
                                    org_id: helper_table[0].org_id,
                                    report_url: helper_table[0].report_url,
                                    task_id: helper_table[0].task_id,
                                    token: helper_table[0].token
                                }
                            });

                            let soItem = <KloEntitySet<d_o2c_so_item>>await txn.getExecutedQuery("d_o2c_so_item", {
                                loadAll: true,
                                soitem: helper_table[0].soitem,
                                expandAll: 'r_item_attachment,r_item_attachment/r_attachment_header,r_item_api_type,r_item_api_type/r_api_gsp_map'
                            });

                            let so_api = soItem[0].r_item_api_type;
                            let vayana_so_api;
                            if (so_api) {
                                vayana_so_api = so_api.find(item => item.provider == "Vayana");
                            }
                            let api_gsp_map = vayana_so_api.r_api_gsp_map;
                            let api_gsp = api_gsp_map.filter(gsp => gsp.billing_method == "API");
                            let api_identifier = api_gsp[0].r_gsp_api_identifier;
                            // let apiCountlist = vayana_report_res.data;
                            let apiCount = 0;
                            for (let i = 0; i < vayana_report_res.length; i++) {
                                if (vayana_report_res[i]["Api Type"] == api_identifier[0].api_identifier) { //Can the provider have multiple identifier?
                                    apiCount += vayana_report_res[i]["Api Count"];
                                }
                            }
                            let po_details = soItem[0].r_item_attachment[0];
                            let so_hdr_detail = po_details.r_attachment_header[0];
                            let final_value = 0;

                            if (vayana_report_res) {
                                let calculatedvalue = parseFloat(soItem[0].per_api_price || "0") * apiCount;
                                let min_monthly_rate = parseFloat(soItem[0].minimum_monthy_rate || "0");
                                final_value = (calculatedvalue > parseFloat(soItem[0].minimum_monthy_rate)) ? calculatedvalue : min_monthly_rate;
                            } else {
                                error = "Did not receive response from Vayana";
                            }


                            await salesorder.addApiAmtinSO(txn, so_hdr_detail.so, po_details.po_no, final_value, "mAPI Call Update", helper_table[0].milestone_date, soItem[0].soitem);
                        } catch (e) {
                            error = e;
                        }
                    }

                    // for (let help of helper_table) {
                    //     await help.deleteP();
                    // }

                    await txn.commitP();
                }
                res("Scheduler Executed with:" + error);
            }, 30000)
        })
    }

}