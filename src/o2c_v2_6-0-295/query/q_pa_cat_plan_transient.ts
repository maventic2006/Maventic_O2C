import { q_pa_cat_plan_transient as q_pa_cat_plan_transient_gen } from "o2c_v2/query_gen/q_pa_cat_plan_transient";
export class q_pa_cat_plan_transient extends q_pa_cat_plan_transient_gen {
	public categoryData = [];
	public async cat_plan_transient(Parameters) {
		debugger;
		let instance = Parameters.getObject(); //it will give you the instance of the query for which callback is created
		instance.setLoadAll(1);

		let txn = Parameters.getTxn();
		let qInstance = await txn.getQueryP("q_o2c_emp_pa_cycle"); //this way you can get instance of any query

		qInstance.setProperty("company_code", Parameters.object.company_code);
		qInstance.setProperty("business_area", Parameters.object.business_area);
		qInstance.setProperty("profit_center", Parameters.object.profit_center);
		qInstance.setProperty("fyear", Parameters.object.fyear);
		qInstance.setProperty("userrole", Parameters.object.userrole);
		qInstance.setProperty("hdr_status", Parameters.object.hdr_status);
		qInstance.setProperty("status_search", Parameters.object.status_search);
		qInstance.setLoadAll(true);

		let es = await qInstance.executeP(); //execute here

		await this.getCategoryPlanData(es, Parameters.object.work_mode_id, Parameters.object.no_of_employee, instance);
		instance.skipDBQueryExecution();
	}

	public async getCategoryPlanData(a, workMode, noOfEmployee, instance) {
		// Iterate over each cycle
		for (let i = 0; i < a.length; i++) {
			const cycleCategory = a[i].r_pa_cycle_catgry;
			//Excluding 0 exp
			let planningHdrItems = cycleCategory.r_pa_catgry_planning_hdr_itm.filter((item) => parseFloat(item.exp).toFixed(1) != 0.0);
			if (workMode != "ALL")
				planningHdrItems = cycleCategory.r_pa_catgry_planning_hdr_itm.filter((item) => item.work_location == workMode);

			//new code added
			if (noOfEmployee == true)
				planningHdrItems = cycleCategory.r_pa_catgry_planning_hdr_itm.filter((item) => item.no_of_employee != 0);
			// Iterate over each planning header item
			for (let j = 0; j < planningHdrItems.length; j++) {
				const planningItem = planningHdrItems[j];
				const benefitDetails = planningItem.r_category_benefit_detail;

				// Initialize the data object
				let data = {
					work_mode: planningItem.work_location,
					exp: planningItem.exp,
					category_id: planningItem.category_id,
					no_of_employee: planningItem.no_of_employee,
					performance_bonus_per: 0,
					performance_bonus: 0,
					company_bonus_per: 0,
					company_bonus: 0,
					retention_bonus_per: 0,
					retention_bonus: 0,
					max_total_value: planningItem.max_total_value,
					ctc_value: planningItem.ctc_value,
					line_item: planningItem.line_item,
					fixed_value: planningItem.fixed_value,
					pa_cycle_id: planningItem.pa_cycle_id,
					category_pl_req_id: planningItem.category_pl_req_id,
					category_planing_guid: planningItem.category_planing_guid,
					category_planing_benifit_g_per: null,
					category_planing_benifit_g_cmp: null,
					category_planing_benifit_g_ret: null,
					cat_tr_guid: planningItem.category_planing_guid,
				};

				// Process the benefit details
				for (let k = 0; k < benefitDetails.length; k++) {
					const benefit = benefitDetails[k];

					switch (benefit.benefit_id) {
						case "B11":
							data.performance_bonus_per = benefit.bonus_perc;
							data.performance_bonus = benefit.bonus_amount;
							data.category_planing_benifit_g_per = benefit.category_planing_benifit_guid;

							data["per_bns_start_date"] = benefit.start_date ? new Date(benefit.start_date).getTime() : null;
							data["per_bns_end_date"] = benefit.start_date ? new Date(benefit.end_date).getTime() : null;

							break;
						case "B13":
							data.company_bonus_per = benefit.bonus_perc;
							data.company_bonus = benefit.bonus_amount;
							data.category_planing_benifit_g_cmp = benefit.category_planing_benifit_guid;

							data["cmp_bns_start_date"] = benefit.start_date ? new Date(benefit.start_date).getTime() : null;
							data["cmp_bns_end_date"] = benefit.start_date ? new Date(benefit.end_date).getTime() : null;


							break;

						case "B12":
							data.retention_bonus_per = benefit.bonus_perc;
							data.retention_bonus = benefit.bonus_amount;
							data.category_planing_benifit_g_ret = benefit.category_planing_benifit_guid;
							data["ret_bns_start_date"] = benefit.start_date ? new Date(benefit.start_date).getTime() : null;
							data["ret_bns_end_date"] = benefit.start_date ? new Date(benefit.end_date).getTime() : null;

							break;

						default:
							break;
					}
				}
				// Push the processed data into the categoryData array
				this.categoryData.push(data);
			}
		}
		await instance.setResults(this.categoryData);
		this.categoryData = [];
	}
}
