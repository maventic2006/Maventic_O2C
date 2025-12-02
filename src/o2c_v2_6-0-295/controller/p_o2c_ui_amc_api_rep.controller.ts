import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_ui_amc_api_rep")
export default class p_o2c_ui_amc_api_rep extends KloController {
    public allData = [];

    public async onPageEnter() {
        this.allData = await this.refreshUIStyle(null);
        await this.tm.getTN("trans_amc_api_report_list").setData(this.allData);
        this.tm.getTN("table_view").setData(false);
        let search_data = await this.tm.getTN("trans_amc_api_tbl_rprt").getData();
        search_data.setLoadAll(true);
        await search_data.executeP();
    }

    public async afterSearch() {
        let search_data = await this.tm.getTN("trans_amc_api_report").getData();
        let list_data = await this.refreshUIStyle(search_data);
        await this.tm.getTN("trans_amc_api_report_list").setData(list_data);
    }

    public async refreshUIStyle(search_data) {
        let report_data = await this.tm.getTN("trans_amc_api_report_list").getData();

        if (search_data) {
            report_data = this.allData.filter(item => {
                const matchCustomer = !search_data.customer_id?.length || search_data.customer_id.includes(item.customer_id);
                const matchApiId = !search_data.api_id?.length || search_data.api_id.includes(item.api_id);
                const matchApiType = !search_data.api_type?.length || search_data.api_type.includes(item.api_type);
                const matchApiYear = !search_data.api_year || search_data.api_year.getFullYear().toString() === item.api_year;
        
                return matchCustomer && matchApiId && matchApiType && matchApiYear;
            });
        }


        // Sort function
        report_data.sort((a, b) => {
            // Compare by Customer + API Id + API Type
            const keyA = `${a.customer_id}-${a.api_id}-${a.api_type}`;
            const keyB = `${b.customer_id}-${b.api_id}-${b.api_type}`;

            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;

            // If Customer + API Id + API Type are same, sort by year ascending
            return a.api_year - b.api_year;
        });

        const monthMap = [
            "jan", "feb", "mar", "apr", "may", "june",
            "jul", "aug", "sep", "oct", "nov", "dec"
        ];
        let datePattern = /<br\s*\/?>/i;
        for (let data of report_data) {
            let temp = false;
            for (let i = 0; i < 12; i++) {
                const firstHalf = (data[`${monthMap[i]}_first_half`] || "").toString();
                const secondHalf = (data[`${monthMap[i]}_second_half`] || "").toString();

                // First half color
                if (!isNaN(firstHalf) && firstHalf !== "") {
                    data[`${monthMap[i]}_first_half_color`] = "Green";
                    temp = true;
                } else if (datePattern.test(firstHalf)) {
                    data[`${monthMap[i]}_first_half_color`] = "Yellow";
                    temp = true;
                } else if (temp) {
                    data[`${monthMap[i]}_first_half_color`] = "Red";
                }
                if (!firstHalf) {
                    data[`${monthMap[i]}_first_half`] = "";
                }

                // Second half color
                if (!isNaN(secondHalf) && secondHalf !== "") {
                    data[`${monthMap[i]}_second_half_color`] = "Green";
                    temp = true;
                } else if (datePattern.test(secondHalf)) {
                    data[`${monthMap[i]}_second_half_color`] = "Yellow";
                    temp = true;
                } else if (temp) {
                    data[`${monthMap[i]}_second_half_color`] = "Red";
                }
                if (!secondHalf) {
                    data[`${monthMap[i]}_second_half`] = "";
                }
            }
        }
        return report_data;

    }

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/

}