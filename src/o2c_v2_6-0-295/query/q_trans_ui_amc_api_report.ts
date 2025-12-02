import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_amc_api_report } from "o2c_v2/entity_gen/d_o2c_amc_api_report";
import { q_trans_ui_amc_api_report as q_trans_ui_amc_api_report_gen } from "o2c_v2/query_gen/q_trans_ui_amc_api_report"
export class q_trans_ui_amc_api_report extends q_trans_ui_amc_api_report_gen {
    public async amcApiReport(oEvent) {
        let instance = oEvent.getObject(); //it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        let txn = oEvent.getTxn();

        let amc_api_report_data = <KloEntitySet<d_o2c_amc_api_report>>await txn.getExecutedQuery("d_o2c_amc_api_report", { loadAll: true });
        const monthMap = [
            "jan", "feb", "mar", "apr", "may", "june",
            "jul", "aug", "sep", "oct", "nov", "dec"
        ];
        let amc_api_report_list = [];
        let t = 0;
        for (const item of amc_api_report_data) {
            let amc_api_report_obj = {
                jan_first_half: null,
                jan_second_half: null,
                feb_first_half: null,
                feb_second_half: null,
                mar_first_half: null,
                mar_second_half: null,
                apr_first_half: null,
                apr_second_half: null,
                may_first_half: null,
                may_second_half: null,
                june_first_half: null,
                june_second_half: null,
                jul_first_half: null,
                jul_second_half: null,
                aug_first_half: null,
                aug_second_half: null,
                sep_first_half: null,
                sep_second_half: null,
                oct_first_half: null,
                oct_second_half: null,
                nov_first_half: null,
                nov_second_half: null,
                dec_first_half: null,
                dec_second_half: null,
                api_id: item.api_id,
                api_year: item.api_year,
                api_type: item.api_type,
                customer_id: item.customer_id,
                my_key: t++
            }

            for (let i = 0; i < 12; i++) {
                let { curr_start_date, curr_end_date } = this.getMonthStartAndEnd(item[`${monthMap[i]}_second_half_end`]);
                if (item[`${monthMap[i]}_second_half_end`] && item[`${monthMap[i]}_second_half_end`].getTime() === curr_end_date.getTime() && !item[`${monthMap[i]}_first_half_end`] &&
                    !item[`${monthMap[i]}_second_half_start`]
                ) {
                    amc_api_report_obj[`${monthMap[i]}_first_half`] = item[`${monthMap[i]}_first_half_so`];
                    amc_api_report_obj[`${monthMap[i]}_second_half`] = item[`${monthMap[i]}_first_half_so`];
                } else if (item[`${monthMap[i]}_first_half_end`]) {
                    amc_api_report_obj[`${monthMap[i]}_first_half`] = `${this.formatDate(item[`${monthMap[i]}_first_half_end`])}<br>${item[`${monthMap[i]}_first_half_so`]}`;
                } else if (item[`${monthMap[i]}_second_half_start`]) {
                    amc_api_report_obj[`${monthMap[i]}_second_half`] = `${this.formatDate(item[`${monthMap[i]}_second_half_start`])}<br>${item[`${monthMap[i]}_second_half_so`]}`;
                }
            }
            amc_api_report_list.push(amc_api_report_obj);
        }

        instance.setResults(amc_api_report_list);
        instance.skipDBQueryExecution();
    }


    // helper to get the start and end date of a particular date.
    public getMonthStartAndEnd(curr_date) {
        const date = new Date(curr_date); // ensure it's a Date object

        // First day of the month
        const curr_start_date = new Date(date.getFullYear(), date.getMonth(), 1);

        // Last day of the month
        const curr_end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        return {
            curr_start_date,
            curr_end_date
        };
    }

    // helper to format the date object
    public formatDate(date) {
        // const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
        return date.getDate();
    }
}