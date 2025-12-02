import { KloController } from 'kloTouch/jspublic/KloController'
import { d_idseries } from 'o2c_v2/entity_gen/d_idseries';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_depreciation")
export default class p_asset_depreciation extends KloController {
	private lastTimestamp = 0;
	private counter = 0;

	public async onPageEnter() {
		//This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
		let a = await this.tm.getTN('search_depreciation').executeP();
		console.log(a)
		let x = await this.tm.getTN('list_depreciation')
		console.log(x)


		//
	}

	/*public async onPageModelReady() {
		//This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
		  //This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/

	// Formula > aquation value - scap value / life of the asset		
	public async onDepreciation() {
		let oBusyDailog = new sap.m.BusyDialog().setText("Creating...");
		let search_data = await this.tm.getTN('search_depreciation').getData();
		oBusyDailog.open();

		let calculatedData = [];

		const selected = await this.getActiveControlById(null, "s_list").getSelectedIndices();
		for (let inital = 0; inital < selected.length; inital++) {
			await this.tm.getTN("list_depreciation").setActive(selected[inital])
			let listData = await this.tm.getTN("list_depreciation").getData()[selected[inital]]

			// creation of object
			// let id = <d_idseries>(await this.transaction.createEntityP('d_idseries',{ s_object_type: 'asset_dep_transient' }));

			let id = this.UniqueStringIDGenerator(new Date().getTime())
			let data = {
				dep_id: id,
				acquisition_value: parseFloat(listData.purchase_cost),
				acquisition_date: listData.asset_capitalization_date,
				depreciation: null, // yearly
				accumulated_depreciation: null,
				remaining_cost: null,
				last_remaining_cost: listData.net_book_value,
				last_fiscal_year: null,
				last_period: null,
				last_accumulated_depreciation: null,//
				depreciation_method: listData.depriciation_method,
				// fiscal_year: search_data._bQ.adv_or_dyn_query_properties.fiscal_year,
				fiscal_year: null,
				period: null,
				asset_number: listData.asset_number,
				business_area: listData.business_area,
				purchase_cost: listData.purchase_cost,//
				scrap_value: parseFloat(listData.scrap_cost),//
				life_of_asset: listData.life_of_asset//
			}
			let max_depreciation_data = await this.transaction.getExecutedQuery('q_asset_dep_his_vh', { asset_number: listData.asset_number, loadAll: true })
			if (max_depreciation_data.length) {
				data.last_fiscal_year = max_depreciation_data[0].fiscal_year
				data.last_period = max_depreciation_data[0].period
				data.last_accumulated_depreciation = max_depreciation_data[0].accumulated_depreciation
			}

			if (data.last_fiscal_year == null && data.last_period == null) {
				let f_p = this.getFiscalYearAndPeriod(data.acquisition_date)
				data.fiscal_year = f_p?.fiscalYear || null
				data.period = f_p?.period || null
			} else {
				let period = parseInt(data.last_period) + 1
				let formattedPeriod = String(period).padStart(2, '0'); // Ensure 2-digit format
				data.fiscal_year = data.last_fiscal_year;
				data.period = formattedPeriod;
				if (data.period > 12) {
					data.period = "01"
					// Split the string by "-"
					let [start, end] = data.last_fiscal_year.split("-").map(Number);
					// Increment both parts
					start += 1;
					end += 1;
					// Combine back into the new fiscal year string
					data.fiscal_year = `${start}-${end}`;
				}
			}
			//asset_dep_transient
			// console.log("checking : ",await listData.r_asset_max_depreciation[0]?.accumulated_depreciation)
			calculatedData.push(data)
		}

		await this.openDialog("pa_list_transient")// todo check if the open then only set false
		let active_control = await this.getActiveControlById(null, "s_list_transient")
		active_control._getSelectionPlugin().setEnabled(false)

		this.tm.getTN("search_transient").setProperty('data', calculatedData);
		await this.tm.getTN('search_transient').executeP();
		oBusyDailog.close()
		calculatedData = [];

	}

	public getFiscalYearAndPeriod(acquisition_date) {

		if (!acquisition_date) {
			return null; // Or return {} or undefined depending on your requirement
		}

		const date = new Date(acquisition_date);
		const month = date.getMonth(); // 0 for Jan, 11 for Dec
		const year = date.getFullYear();

		let fiscalYearStart;
		let period;

		if (month >= 3) {
			// April (3) to December (11)
			fiscalYearStart = year;
			period = month - 2;
		} else {
			// January (0) to March (2)
			fiscalYearStart = year - 1;
			period = month + 10;
		}

		const fiscalYear = `${fiscalYearStart}-${fiscalYearStart + 1}`;
		const formattedPeriod = String(period).padStart(2, '0'); // Ensure 2-digit format

		return {
			fiscalYear,
			period: formattedPeriod
		};
	}




	//

	public async calculateDepreciation(oEvent) {

		let path = this.getPathFromEvent(oEvent);

		let index = parseInt(path.replace(`/list_transient/`, ''))
		this.tm.getTN('list_transient').setActive(index)
		let listData = await this.tm.getTN('list_transient').getActiveData();


		if (listData.depreciation_method === "SLM") {
			// SLM: Straight Line Method
			listData.depreciation = (((parseFloat(listData.purchase_cost) - parseFloat(listData.scrap_value || 0)) / listData.life_of_asset) / 12).toFixed(2);
			listData.accumulated_depreciation = (parseFloat(listData.last_accumulated_depreciation || 0) + parseFloat(listData.depreciation)).toFixed(2);
			listData.remaining_cost = (parseFloat(listData.purchase_cost) - (parseFloat(listData.accumulated_depreciation) + parseFloat(listData.scrap_value || 0))).toFixed(2);

		} else if (listData.depreciation_method === "WDV") {
			// WDV: Written Down Value Method
			listData.depreciation = ((parseFloat(listData.last_remaining_cost) / listData.life_of_asset) / 12).toFixed(2);
			listData.accumulated_depreciation = (parseFloat(listData.last_accumulated_depreciation || 0) + parseFloat(listData.depreciation)).toFixed(2);
			listData.remaining_cost = (parseFloat(listData.purchase_cost) - (parseFloat(listData.accumulated_depreciation) + parseFloat(listData.scrap_value || 0))).toFixed(2);

		}
		let active_control = await this.getActiveControlById(null, "s_list_transient")
		// active_control.setMode("MultiSelect");
		if(!active_control.isIndexSelected(index)){

			active_control._getSelectionPlugin().setEnabled(true)
			active_control.addSelectionInterval(index, index);
			active_control._getSelectionPlugin().setEnabled(false)
		}
		

		//active_control.addSelectionInterval(index, index)
		

		

		await this.tm.getTN('list_transient').resetP()


	}

	public async postData(oEvent) {
		// let assetData = await this.tm.getTN('list_depreciation').getData()
		// const selected = await this.getActiveControlById(null, "s_list_transient").getSelectedIndices();
		// console.log(selected)
		await this.tm.commitP("Approved", "Failed", true, true);


	}

	public UniqueStringIDGenerator(now) {


		if (now === this.lastTimestamp) {
			this.counter++;
		} else {
			this.lastTimestamp = now;
			this.counter = 0;
		}

		return now.toString() + '-' + this.counter.toString();

	}

	public onescape() {

	}

}