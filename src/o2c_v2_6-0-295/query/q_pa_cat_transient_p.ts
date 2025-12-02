import { d_pa_cal_transient_p } from "o2c_v2/entity_gen/d_pa_cal_transient_p";
import { q_pa_cat_transient_p as q_pa_cat_transient_p_gen } from "o2c_v2/query_gen/q_pa_cat_transient_p"
export class q_pa_cat_transient_p extends q_pa_cat_transient_p_gen {

    public categoryPlanData = [];
    public categoryData = [];

    public async cat_plan_transient_p(Parameters) {
        // 	debugger;

        // 	let instance = Parameters.getObject(); //it will give you the instance of the query for which callback is created

        //     instance.setLoadAll(1)
        //     let x =  await instance._q

        //     instance.setExpandAll('r_pa_cat_item_t')
        //     let s = await instance.getExpandAll()
        //     //let cat = await instance.r_pa_cat_item_t.fetch();


        //     let txn = Parameters.getTxn();


        // 	let qInstance = await txn.getQueryP("q_o2c_emp_pa_cycle"); //this way you can get instance of any query



        // 	qInstance.setProperty("company_code", Parameters.object.company_code);

        // 	// 
        // 	qInstance.setProperty("business_area", Parameters.object.business_area);
        // 	qInstance.setProperty("profit_center", Parameters.object.profit_center);
        // 	qInstance.setProperty("fyear", Parameters.object.fyear);
        // 	qInstance.setProperty("userrole", Parameters.object.userrole);
        // 	qInstance.setProperty("hdr_status", Parameters.object.hdr_status);
        // 	qInstance.setProperty("status_search", Parameters.object.status_search);
        // 	qInstance.setLoadAll(true);

        // 	let es = await qInstance.executeP(); //execute here

        //     await this.getCategoryPlanData(es,instance)

        //     instance.skipDBQueryExecution();


        //     console.log(instance)

    }


    // public async getCategoryPlanData(a,instance) {

    // 	// Iterate over each cycle
    // 	for (let i = 0; i < a.length; i++) {
    // 		const cycleCategory = a[i].r_pa_cycle_catgry;

    //         let dataP = {
    //             pa_cycle_id:a[i].pa_cycle_id,
    //             company_code:a[i].company_code,
    //             business_area:a[i].business_area,
    //             profit_center:a[i].profit_center,
    //             pa_cycle:a[i].pa_cycle,
    //             fiscal_year:a[i].fiscal_year,
    //             start_date:a[i].start_date,
    //             end_date:a[i].end_date,
    //             category_pl_req_id:cycleCategory.category_pl_req_id,
    //             approval_cycle:cycleCategory.approval_cycle,
    //             total_cost_value:cycleCategory.total_cost_value,
    //             status:cycleCategory.s_status
    //         }

    //         this.categoryData.push(dataP);
    // 		const planningHdrItems = cycleCategory.r_pa_catgry_planning_hdr_itm;

    // 		// Iterate over each planning header item
    // 		for (let j = 0; j < planningHdrItems.length; j++) {
    // 			const planningItem = planningHdrItems[j];
    // 			const benefitDetails = planningItem.r_category_benefit_detail;

    // 			// Initialize the data object
    // 			let data = {
    // 				exp: planningItem.exp,
    // 				category_id: planningItem.category_id,
    // 				no_of_employee: planningItem.no_of_employee,
    // 				performance_bonus_per: 0,
    // 				performance_bonus: 0,
    // 				company_bonus_per: 0,
    // 				company_bonus: 0,
    // 				retention_bonus_per: 0,
    // 				retention_bonus: 0,
    // 				max_total_value: planningItem.max_total_value,
    // 				ctc_value: planningItem.ctc_value,
    // 				fixed_value: planningItem.fixed_value,
    // 				pa_cycle_id: planningHdrItems[j].pa_cycle_id,
    // 				category_pl_req_id: planningHdrItems[j].category_pl_req_id,
    // 				category_planing_guid: planningHdrItems[j].category_planing_guid,
    // 				category_planing_benifit_g_per: null,
    // 				category_planing_benifit_g_cmp: null,
    // 				category_planing_benifit_g_ret: null,
    //                 cat_tr_guid : planningHdrItems[j].category_planing_guid

    // 			};

    // 			// Process the benefit details
    // 			for (let k = 0; k < benefitDetails.length; k++) {
    // 				const benefit = benefitDetails[k];

    // 				switch (benefit.benefit_id) {
    // 					case "B11":
    // 						data.performance_bonus_per = benefit.bonus_perc;
    // 						data.performance_bonus = benefit.bonus_amount;
    // 						data.category_planing_benifit_g_per = benefit.category_planing_benifit_guid;
    // 						break;
    // 					case "B13":
    // 						data.company_bonus_per = benefit.bonus_perc;
    // 						data.company_bonus = benefit.bonus_amount;
    // 						data.category_planing_benifit_g_cmp = benefit.category_planing_benifit_guid;
    // 						break;
    // 					case "B12":
    // 						data.retention_bonus_per = benefit.bonus_perc;
    // 						data.retention_bonus = benefit.bonus_amount;
    // 						data.category_planing_benifit_g_ret = benefit.category_planing_benifit_guid;
    // 						break;
    // 					default:
    // 						break;
    // 				}
    // 			}
    // 			// Push the processed data into the categoryData array
    // 			this.categoryPlanData.push(data);

    // 		}
    // 	}
    // 	console.log(this.categoryData)
    //     await instance.setResults(this.categoryData);
    //     // await this.entityset[0].r_pa_cat_item_t.setResults(this.categoryPlanData)
    // 	this.categoryData = []
    // }

}