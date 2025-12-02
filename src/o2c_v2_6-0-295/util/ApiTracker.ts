import { KloTransaction } from "kloBo/KloTransaction";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_so_hdr } from "o2c_v2/entity_gen/d_o2c_so_hdr";
import { d_o2c_subscribed_customer } from "o2c_v2/entity_gen/d_o2c_subscribed_customer";
import { d_o2c_amc_api_report } from "o2c_v2/entity_gen/d_o2c_amc_api_report";
import { d_o2c_so_item } from "o2c_v2/entity_gen/d_o2c_so_item";

export class ApiTracker {
    //method to update the entry in the subscribed customer
    public static async updateSubscribedCustomer(txn: KloTransaction) {

        // getting the existing subscribed customer list..
        let subscribed_customer = <KloEntitySet<d_o2c_subscribed_customer>>await txn.getExecutedQuery("d_o2c_subscribed_customer", { loadAll: true });

        const subscribedMap = new Map<string, d_o2c_subscribed_customer>();
        for (const c of subscribed_customer) {
            subscribedMap.set(`${c.customer_id}_${c.api_id}`, c);
        }

        // getting 1 SO detail to find whether the customer of this SO is subscribed or not?
        let so_detail = <KloEntitySet<d_o2c_so_hdr>>await txn.getExecutedQuery("d_o2c_so_hdr", {
            loadAll: true,
            s_status: ["Approved", "Closed"],
            expandAll: "r_so_attachment,r_so_attachment/r_attachmnt_itm,r_so_attachment/r_attachmnt_itm/r_item_api_type"
        });

        try {
            for (let h = 0; h < so_detail.length; h++) {
                // checking if the passed SO number exist or not in the table.
                if (so_detail && so_detail.length > 0 && so_detail[h].product_type) {

                    let so_attachment = so_detail[h].r_so_attachment;
                    for (let i = 0; i < so_attachment.length; i++) {
                        let so_item = so_attachment[i].r_attachmnt_itm;
                        for (let j = 0; j < so_item.length; j++) {

                            // if in the so item is there any item category of AMC or API.
                            if (so_item[j].item_category === "API" || so_item[j].item_category === "AMC") {
                                let subscriptions = so_item[j].r_item_api_type;

                                if (subscriptions.length == 1) {
                                    // finding for the customer which is present in the SO that is already subscribed or not.
                                    const key = `${so_detail[h].bill_to_customer}_${subscriptions[0].api_type}`;
                                    let is_subscribed = subscribedMap.get(key);

                                    // if the customer is subscribed then check if any of the service is not opted.
                                    if (is_subscribed && (!is_subscribed.is_active_amc || !is_subscribed.is_active_api)) {
                                        // if any of the service not opted then opt for it based on the item category which is present in the SO.
                                        if (!is_subscribed.is_active_amc && so_item[j].item_category === "AMC") {
                                            is_subscribed.is_active_amc = true;
                                        }
                                        if (!is_subscribed.is_active_api && so_item[j].item_category === "API") {
                                            is_subscribed.is_active_api = true;
                                        }
                                    } else { // if customer is not subscribed then create a new entry.
                                        let amc = (so_item[j].item_category === "AMC");
                                        let newRecord = await txn.createEntityP("d_o2c_subscribed_customer", {
                                            api_id: subscriptions[0].api_type,
                                            customer_id: so_detail[h].bill_to_customer,
                                            is_active_amc: amc,
                                            is_active_api: !amc,
                                            is_required: true
                                        });
                                        subscribedMap.set(key, newRecord); // update local cache too
                                    }
                                    await txn.commitP();
                                } else if (subscriptions.length > 0) {
                                    let api_key = subscriptions.map(item => item.api_type).join(' + ')
                                    // finding for the customer which is present in the SO that is already subscribed or not.
                                    const key = `${so_detail[h].bill_to_customer}_${api_key}`;
                                    let is_subscribed = subscribedMap.get(key);
                                    // if the customer is subscribed then check if any of the service is not opted.
                                    if (is_subscribed && (!is_subscribed.is_active_amc || !is_subscribed.is_active_api)) {
                                        // if any of the service not opted then opt for it based on the item category which is present in the SO.
                                        if (!is_subscribed.is_active_amc && so_item[j].item_category === "AMC") {
                                            is_subscribed.is_active_amc = true;
                                        }
                                        if (!is_subscribed.is_active_api && so_item[j].item_category === "API") {
                                            is_subscribed.is_active_api = true;
                                        }
                                    } else { // if customer is not subscribed then create a new entry.
                                        let amc = (so_item[j].item_category === "AMC");
                                        let newRecord = await txn.createEntityP("d_o2c_subscribed_customer", {
                                            api_id: api_key,
                                            customer_id: so_detail[h].bill_to_customer,
                                            is_active_amc: amc,
                                            is_active_api: !amc,
                                            is_required: false
                                        });
                                        subscribedMap.set(key, newRecord); // update local cache too
                                    }
                                    await txn.commitP();
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            throw new Error(JSON.stringify(error));
        }

        return true;
    }

    public static async getSoList(txn: KloTransaction) {
        const subscribed_customers = <KloEntitySet<d_o2c_subscribed_customer>>await txn.getExecutedQuery("d_o2c_subscribed_customer", { loadAll: true, is_required: true });
        const amc_api_report_list = <KloEntitySet<d_o2c_amc_api_report>>await txn.getExecutedQuery("d_o2c_amc_api_report", { loadAll: true });

        for (const sub of subscribed_customers) {

            if (sub.is_active_api) {
                const api_list = await txn.getExecutedQuery("q_item_amc_api_report", {
                    loadAll: true,
                    bill_to_customer: sub.customer_id,
                    api_type: sub.api_id,
                    item_category: "API"
                });
                if (api_list && api_list.length > 0) {
                    await this.updateApiAmcReport(txn, api_list, sub, "API", amc_api_report_list)
                }
            }

            if (sub.is_active_amc) {
                const amc_list = await txn.getExecutedQuery("q_item_amc_api_report", {
                    loadAll: true,
                    bill_to_customer: sub.customer_id,
                    api_type: sub.api_id,
                    item_category: "AMC"
                });
                if (amc_list && amc_list.length > 0) {
                    await this.updateApiAmcReport(txn, amc_list, sub, "AMC", amc_api_report_list)
                }
            }

        }


        await txn.commitP();
    }

    public static async updateApiAmcReport(txn: KloTransaction, item_list, subscribed_customer, item_category, amc_api_report_list) {

        item_list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); // sorting the start date in ascending order.

        const monthMap = [
            "jan", "feb", "mar", "apr", "may", "june",
            "jul", "aug", "sep", "oct", "nov", "dec"
        ];

        try {
            for (const item of item_list) {
                // initializing the report data property.
                let report_data = {
                    dec_second_half_end: null,
                    dec_second_half_start: null,
                    dec_second_half_so: null,
                    dec_first_half_end: null,
                    dec_first_half_start: null,
                    dec_first_half_so: null,
                    nov_second_half_end: null,
                    nov_second_half_start: null,
                    nov_second_half_so: null,
                    nov_first_half_end: null,
                    nov_first_half_start: null,
                    nov_first_half_so: null,
                    oct_second_half_end: null,
                    oct_second_half_start: null,
                    oct_second_half_so: null,
                    oct_first_half_end: null,
                    oct_first_half_start: null,
                    oct_first_half_so: null,
                    sep_second_half_end: null,
                    sep_second_half_start: null,
                    sep_second_half_so: null,
                    sep_first_half_end: null,
                    sep_first_half_start: null,
                    sep_first_half_so: null,
                    aug_second_half_end: null,
                    aug_second_half_start: null,
                    aug_second_half_so: null,
                    aug_first_half_end: null,
                    aug_first_half_start: null,
                    aug_first_half_so: null,
                    jul_second_half_end: null,
                    jul_second_half_start: null,
                    jul_second_half_so: null,
                    jul_first_half_end: null,
                    jul_first_half_start: null,
                    jul_first_half_so: null,
                    june_second_half_end: null,
                    june_second_half_start: null,
                    june_second_half_so: null,
                    june_first_half_end: null,
                    june_first_half_start: null,
                    june_first_half_so: null,
                    may_second_half_end: null,
                    may_second_half_start: null,
                    may_second_half_so: null,
                    may_first_half_end: null,
                    may_first_half_start: null,
                    may_first_half_so: null,
                    apr_second_half_end: null,
                    apr_second_half_start: null,
                    apr_second_half_so: null,
                    apr_first_half_end: null,
                    apr_first_half_start: null,
                    apr_first_half_so: null,
                    mar_second_half_end: null,
                    mar_second_half_start: null,
                    mar_second_half_so: null,
                    mar_first_half_end: null,
                    mar_first_half_start: null,
                    mar_first_half_so: null,
                    feb_second_half_end: null,
                    feb_second_half_start: null,
                    feb_second_half_so: null,
                    feb_first_half_end: null,
                    feb_first_half_start: null,
                    feb_first_half_so: null,
                    jan_second_half_end: null,
                    jan_second_half_start: null,
                    jan_second_half_so: null,
                    jan_first_half_end: null,
                    jan_first_half_start: null,
                    jan_first_half_so: null,
                    api_type: item_category,
                    customer_id: subscribed_customer.customer_id,
                    api_id: subscribed_customer.api_id,
                    api_year: null
                };
                let curr_date = new Date(item.start_date);

                let first_iteration = 0;
                while (this.yearMonthLE(curr_date, item.end_date)) { // iterating month wise in the items to store the data in that month...
                    const { curr_start_date, curr_end_date } = this.getMonthStartAndEnd(curr_date);
                    // finding whether in the first half of the curr date is already filled.
                    let curr_customer_available = amc_api_report_list.find(item => item.customer_id === subscribed_customer.customer_id && item.api_id === subscribed_customer.api_id
                        && item.api_type === item_category && item.api_year == curr_date.getFullYear().toString()
                    )

                    if (!curr_customer_available) {
                        // Save the previous year’s entity
                        report_data["api_year"] = curr_date.getFullYear();
                        let curr_report_obj = await txn.createEntityP("d_o2c_amc_api_report", report_data);
                        // Update local cache if needed
                        amc_api_report_list.push(curr_report_obj);
                        curr_customer_available = curr_report_obj;

                    }

                    // first iteration of the date.
                    let startHalf = 'first_half';
                    if (first_iteration === 0) {
                        if (curr_date.getDate() > 1) {
                            startHalf = 'second_half';
                        } else {
                            startHalf = 'first_half';
                        }
                    }

                    // last iteration of the date.
                    let endHalf = 'second_half';
                    if (this.sameYearMonth(curr_date, item.end_date)) {
                        const nextDay = new Date(item.end_date);
                        nextDay.setDate(item.end_date.getDate() + 1);
                        if (nextDay.getDate() === 1) {
                            endHalf = 'second_half';
                        } else {
                            endHalf = 'first_half';
                        }

                    }


                    // Get month name
                    const monthStr = monthMap[curr_date.getMonth()];

                    // Build keys like: mar_first_half_start, mar_first_half_end
                    const startKey = `${monthStr}_${startHalf}_start`;
                    const endKey = `${monthStr}_${endHalf}_end`;

                    const startKeySO = `${monthStr}_${startHalf}_so`;
                    const endKeySO = `${monthStr}_${endHalf}_so`;

                    await item.r_item_header.fetch();

                    // Assign to report data object
                    curr_customer_available[startKey] = (first_iteration === 0) ? new Date(item.start_date) : new Date(curr_start_date);
                    curr_customer_available[endKey] = (this.sameYearMonth(curr_date, item.end_date)) ? new Date(item.end_date) : new Date(curr_end_date);
                    curr_customer_available[startKeySO] = item.r_item_header[0].so;
                    curr_customer_available[endKeySO] = item.r_item_header[0].so;

                    curr_date = this.getNextMonthDate(curr_date);
                    first_iteration++;
                }
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    public static getMonthStartAndEnd(curr_date) {
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

    // Helper: safely move curr_date to next month without skipping
    public static getNextMonthDate(date: Date): Date {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // Create next month date
        const next = new Date(year, month + 1, 1);

        // Find the valid day in next month (handles months with fewer days)
        const daysInNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        const validDay = Math.min(day, daysInNextMonth);
        next.setDate(validDay);

        return next;
    }

    // Helper: compare year+month only
    public static yearMonthLE(a: Date, b: Date): boolean {
        return a.getFullYear() < b.getFullYear() ||
            (a.getFullYear() === b.getFullYear() && a.getMonth() <= b.getMonth());
    }

    public static sameYearMonth(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    }

    public static async getApiList(txn: KloTransaction) {
        const subscribed_customers = <KloEntitySet<d_o2c_subscribed_customer>>await txn.getExecutedQuery("d_o2c_subscribed_customer", { loadAll: true });
        let report_data = [];
        let t = 0;
        for (const sub of subscribed_customers) {
            let obj = {
                customer_id: sub.customer_id,
                subscribe_module: sub.api_id,
                amc_status: null,
                go_live_date: sub.go_live_date,
                start_date: null,
                end_date: null,
                so_no: null,
                sales_responsible: null,
                cost_per_pd: null,
                minimum_monthy_rate: null,
                per_api_price: null,
                gsp: sub.gsp,
                middleware: sub.middleware,
                amc_type: sub.amc_type,
                service_type: null,
                table_guid: t++
            }

            // For Item Category Api
            if (sub.is_active_api) {
                // items of Api category for the current customer
                const api_list = <KloEntitySet<d_o2c_so_item>>await txn.getExecutedQuery("q_item_amc_api_report", {
                    loadAll: true,
                    bill_to_customer: sub.customer_id,
                    item_category: "API"
                });

                if (api_list && api_list.length > 0) {
                    const apiData = await this.getStatusObject(api_list, sub, "API");
                    if (apiData) Object.assign(obj, apiData);
                    obj.service_type = "API";
                }
            }

            // For Item Category Amc
            if (sub.is_active_amc) {
                const amc_list = <KloEntitySet<d_o2c_so_item>>await txn.getExecutedQuery("q_item_amc_api_report", {
                    loadAll: true,
                    bill_to_customer: sub.customer_id,
                    item_category: "AMC"
                });

                if (amc_list && amc_list.length > 0) {
                    const amcData = await this.getStatusObject(amc_list, sub, "AMC");
                    if (amcData) Object.assign(obj, amcData);
                    obj.service_type = "AMC";
                }
            }

            report_data.push(obj);
        }

        return report_data;
    }

    public static async getStatusObject(list, sub, item_category) {
        const today = new Date();
        if (!list || list.length === 0) return null;

        const multiple = sub.api_id.includes("+");
        let filteredList;

        await Promise.all(list.map(item => item.r_item_api_type.fetch()));

        if (multiple) {
            const requiredApis = sub.api_id.split("+").map(s => s.trim());
            filteredList = list.filter(item => {
                const itemApis = item.r_item_api_type?.map(a => a.api_type) || [];
                return requiredApis.every(api => itemApis.includes(api));
            });
        } else {
            filteredList = list.filter(item => {
                const apis = item.r_item_api_type || [];
                return apis.length === 1 && apis[0].api_type === sub.api_id;
            });
        }


        if (filteredList.length === 0) return null;

        // Find closest end date
        const closest = filteredList.reduce((prev, curr) => {
            const prevDiff = Math.abs(new Date(prev.end_date) - today);
            const currDiff = Math.abs(new Date(curr.end_date) - today);
            return currDiff < prevDiff ? curr : prev;
        });

        const endDate = new Date(closest.end_date);
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        // Determine status
        let status = "Not Available";
        if (closest.end_date) {
            if (today <= endDate && diffDays > 30) status = "Active";
            else if (today <= endDate && diffDays <= 30) status = "Expiring Soon";
            else if (today > endDate) status = "Expired";
        }

        await closest.r_item_header.fetch();
        await closest.r_item_attachment.fetch();
        const so_detail = closest.r_item_header?.[0];
        const attachment = closest.r_item_attachment?.[0];

        return {
            amc_status: status,
            end_date: closest.end_date,
            start_date: closest.start_date,
            so_no: so_detail.so,
            sales_responsible: so_detail.sales_responsible,
            cost_per_pd: Number(attachment.cr_rate),
            minimum_monthy_rate: Number(closest.minimum_monthy_rate),
            per_api_price: Number(closest.per_api_price)
        };
    };
}