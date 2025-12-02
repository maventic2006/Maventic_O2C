import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_product_based_api_type } from "o2c_v2/entity_gen/d_o2c_product_based_api_type";
import { q_trans_ui_amc_api_tble_rprt as q_trans_ui_amc_api_tble_rprt_gen } from "o2c_v2/query_gen/q_trans_ui_amc_api_tble_rprt"
import { ApiTracker } from "o2c_v2/util/ApiTracker";
export class q_trans_ui_amc_api_tble_rprt extends q_trans_ui_amc_api_tble_rprt_gen {
    public async amcApiTblReport(oEvent) {
        let instance = oEvent.getObject(); //it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        let txn = oEvent.getTxn();
        let product_based_api = <KloEntitySet<d_o2c_product_based_api_type>>await txn.getExecutedQuery("d_o2c_product_based_api_type", { loadAll: true, partialSelect: ["api_id", "api_name"] });

        let report_data = await ApiTracker.getApiList(txn);

        for (const data of report_data) {
            if (data.subscribe_module?.includes("+")) {
                data.subscribe_module = data.subscribe_module
                    .split("+")
                    .map(s => s.trim())
                    .map(api => product_based_api.find(p => p.api_id === api)?.api_name)
                    .join(" + ");
            } else {
                data.subscribe_module = product_based_api.find(p => p.api_id === data.subscribe_module)?.api_name;
            }
            data.start_date = data.start_date.getTime();
            data.end_date = data.end_date.getTime();
        }

        instance.setResults(report_data);
        instance.skipDBQueryExecution();
    }
}