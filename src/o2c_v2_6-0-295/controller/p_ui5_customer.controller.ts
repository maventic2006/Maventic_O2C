import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloEntitySet } from 'kloBo_6-0/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_customers_map } from 'o2c_v2/entity/d_o2c_customers_map';
import { d_o2c_address } from 'o2c_v2/entity_gen/d_o2c_address';
import { d_o2c_customers } from 'o2c_v2/entity_gen/d_o2c_customers';
declare let KloUI5: any;
var oController;
var dFilters = [];
@KloUI5("o2c_v2.controller.p_ui5_customer")
export default class p_ui5_customer extends KloController {

	public onInit() {
		var oLocalModel = new sap.ui.model.json.JSONModel();
		sap.ui.getCore().setModel(oLocalModel, "mDataModel");
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		oController = this;

		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_ui5_customer";
		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		})
		this.getActiveControlById(null, 'pageArea02', 'p_ui5_customer').addContent(view);

		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "p_ui5_customer");

		// await this.tm.getTN("cust_search").executeP()
		let salesResp = <KloEntitySet<d_o2c_customers>>await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, s_status: ["Approved","Pending"] })
		const distinctSalesResp = new Map();
		for (let sales of salesResp) {
			distinctSalesResp.set(sales.sales_responsible, sales.sales_responsible_name);
		}
		let salesResData = Array.from(distinctSalesResp, ([sales_responsible, sales_responsible_name]) => ({ sales_responsible, sales_responsible_name }));
		await this.tm.getTN("sales_other").setData(salesResData);

		let role = (await this.transaction.get$Role()).role_id;
		sap.ui.getCore().getModel("mDataModel").setProperty('/user_role', role);
		let allCustomer = <KloEntitySet<d_o2c_customers>>await this.transaction.getExecutedQuery("q_sales_responsible", { role: role, loadAll: true })
		// let allCustomer = await this.tm.getTN("cust_list").getData()
		sap.ui.getCore().getModel("mDataModel").setProperty('/allCustomer', allCustomer);

		//Filtering Sales responsible
		let salesMap = new Map();
		let salesUnique = [];
		let indusrtyID = [];
		let allCustId = [];
		for (let i = 0; i < allCustomer.length; i++) {
			// storing all custId for filter
			indusrtyID.push(allCustomer[i].industry_type);
			allCustId.push(allCustomer[i].customer_id);
			if (!salesMap.get(allCustomer[i].sales_responsible)) {
				salesUnique.push(allCustomer[i]);
				salesMap.set(allCustomer[i].sales_responsible, true);
			}
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/salesUnique', salesUnique);

		// Filtering Industry Type
		let industryName = await this.transaction.getExecutedQuery("d_o2c_industry_type", { industry_id: indusrtyID });
		sap.ui.getCore().getModel("mDataModel").setProperty('/industryName', industryName);


		//Address of Customer

		let addrMap = <KloEntitySet<d_o2c_customers_map>>await this.transaction.getExecutedQuery("d_o2c_customers_map", { customer_id: allCustId, loadAll: true });
		let allAddrId = []
		let countryCode = []
		for (let i = 0; i < addrMap.length; i++) {
			countryCode.push(addrMap[i]);
			allAddrId.push(addrMap[i].address_id_test);
		}

		//Filtering Country
		let countryMap = new Map();
		let countryUnique = [];
		for (let i = 0; i < countryCode.length; i++) {
			if (!countryMap.get(countryCode[i].country_code) && (countryCode[i].country_code != null)) {
				countryUnique.push(countryCode[i]);
				countryMap.set(countryCode[i].country_code, true);
			}
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/countryUnique', countryUnique);

		//Fetching logo of Company
		// let allImgSrc = await this.transaction.getExecutedQuery("d_o2c_customers_doc",{"customer_id": allCustId});



		let custAddr = <KloEntitySet<d_o2c_address>>await this.transaction.getExecutedQuery("d_o2c_address", { address_id: allAddrId, loadAll: true });

		let custId;
		let customerDetail = [];

		let countK = 0;

		for (let i = 0; i < allCustomer.length; i++) {

			let addressID = addrMap.filter(item => (item.customer_id == allCustomer[i].customer_id))
			let address = [];
			if (addressID.length) {
				address = custAddr.filter(item => (item.address_id == addressID[0].address_id_test))
			}


			// for (let j = 0; j < addrMap.length; j++) {

			// 	if (allCustomer[i].customer_id == addrMap[j].customer_id) {
			// 		for (let k = 0; k < custAddr.length && countK < custAddr.length; k++) {


			// 			if (addrMap[j].address_id_test == custAddr[k].address_id) {
			// 				address = custAddr[k];
			// 				custId = allCustomer[i];
			// let source = allImgSrc.filter(item => (item.customer_id === custId.customer_id))

			// let img = this.getImage(allCustomer[i].customer_name.charAt(0));
			let customer = {
				"customer_id": allCustomer[i].customer_id,
				"customer_name": allCustomer[i].customer_name,
				"status": allCustomer[i].s_status,
				"search_term" : allCustomer[i].search_term,
				"sales": allCustomer[i].sales_responsible,
				"sales_name" : allCustomer[i].sales_responsible_name,
				"gst" : addressID[0]?.gstin_vat,
				"address1": (address.length > 0) ? address[0].address_1 : "N/A",
				"address2": (address.length > 0) ? address[0].address_2 : "N/A",
				"city": (address.length > 0) ? address[0].city : "N/A",
				"district" : (address.length > 0) ? address[0].district : "N/A",
				"pin": (address.length > 0) ? address[0].pincode : "N/A",
				"state": (address.length > 0) ? address[0].state : "N/A",
				"industry": allCustomer[i].industry_type,
				"pending_with": allCustomer[i].customer_status,
				"country": (address.length > 0) ? address[0].country : "N/A",
				"img": allCustomer[i].customer_name.charAt(0)
			}
			customerDetail.push(customer)
		}
		sap.ui.getCore().getModel("mDataModel").setProperty('/customerDetail', customerDetail);

		sap.ui.getCore().getModel("mDataModel").setProperty('/customerDetailRemind', customerDetail);
	}

	//Search filter calling based upon the selected data
	public async onCustSearch() {
		let cust_search = await this.tm.getTN("cust_search").getData();
		this.onSalesChange(cust_search.sales_responsible);
		this.onIndustryChange(cust_search.industry_type);
		this.onCityChange(cust_search.city);
		this.onNameChange(cust_search.customer_name);
		this.onCountryChange(cust_search.country);
		this.onStateChange(cust_search.state);
		this.onPincodeChange(cust_search.pin);
	}

	public async onFuzzyCustSearch(oEvent) {
		let term = oEvent.getSource().getValue();
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		if (term) {
			var aFilters = [
				new sap.ui.model.Filter("sales", sap.ui.model.FilterOperator.Contains, term),
				new sap.ui.model.Filter("customer_name", sap.ui.model.FilterOperator.Contains, term),
				new sap.ui.model.Filter("customer_id", sap.ui.model.FilterOperator.Contains, term)
			];
			var oFilter = new sap.ui.model.Filter({
				filters: aFilters,
				and: false
			});
			oBinding.filter([oFilter]);
		}
		else {
			oBinding.filter([])
		}
	}

	public async onSalesChange(sQuery) {
		// let salesResponsible = oEvent.getSource().getSelectedKey();
		// let customerDetail = sap.ui.getCore().getModel("mDataModel").getProperty('/customerDetailRemind');
		// let demo =[]
		// for(let i=0;i<customerDetail.length;i++){
		// 	if(customerDetail[i].sales == salesResponsible){
		// 		demo.push(customerDetail[i]);
		// 	}
		// }
		// // customerDetail.filter(item => (item.sales === salesResponsible));
		// sap.ui.getCore().getModel("mDataModel").setProperty('/salesChange',salesResponsible);
		// if(!salesResponsible){
		// 	sap.ui.getCore().getModel("mDataModel").setProperty('/customerDetail',customerDetail);
		// }else{
		// 	sap.ui.getCore().getModel("mDataModel").setProperty('/customerDetail',demo);
		// }

		// add filter for search

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/salesFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/salesFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("sales", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/salesFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onIndustryChange(sQuery) {
		// let industry = oEvent.getSource().getSelectedKey();
		// let customerDetail=[];
		// if(!sap.ui.getCore().getModel("mDataModel").getProperty('/salesChange') ){
		// 	customerDetail =  sap.ui.getCore().getModel("mDataModel").getProperty('/customerDetailRemind');
		// }else{
		// 	customerDetail = sap.ui.getCore().getModel("mDataModel").getProperty('/customerDetail');
		// }
		// let demo =[]
		// demo = customerDetail.filter(item => (item.industry === industry));

		// var aFilters = [];
		// var sQuery = oEvent.getSource().getSelectedKey();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/industryFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/industryFilter"));
		}

		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("industry", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/industryFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);
	}

	public onCityChange(sQuery) {
		// var aFilters = [];
		// var sQuery = oEvent.getSource().getValue();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/cityFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/cityFilter"));
		}

		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("city", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/cityFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);
	}

	public onNameChange(sQuery) {
		// add filter for search
		// var aFilters = [];
		// var sQuery = oEvent.getSource().getValue();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/nameFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/nameFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("customer_name", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/nameFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);


	}

	public onCountryChange(sQuery) {
		// var sQuery = oEvent.getSource().getSelectedKey();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/countryFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/countryFilter"));
		}

		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/countryFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);
	}

	public onPincodeChange(sQuery) {
		// var aFilters = [];
		// var sQuery = oEvent.getSource().getValue();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/pinFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/pinFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("pin", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/pinFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);
	}

	public onStateChange(sQuery) {
		// var aFilters = [];
		// var sQuery = oEvent.getSource().getValue();
		if (sap.ui.getCore().getModel("mDataModel").getProperty("/stateFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/stateFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("state", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/stateFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);
	}

	// public async onExcelDownload() {
	// 	let busyDialog = new sap.m.BusyDialog({
	// 		text: "Please Wait..."
	// 	});
	// 	busyDialog.open();

	// 	if (!window.XLSX) {
	// 		let path = "kloExternal/xlsx.bundle";
	// 		await import(path);
	// 	}
	// 	// let data = sap.ui.getCore().getModel("mDataModel").getProperty("/allEmployee");
	// 	// Get the list control
	// 	var oList = sap.ui.getCore().byId("flist");

	// 	// Get the binding of the items
	// 	var oBinding = oList.getBinding("items");

	// 	// Get the contexts of the currently visible items
	// 	var aFilteredContexts = oBinding.getCurrentContexts();

	// 	// Map contexts to data objects
	// 	var aFilteredData = aFilteredContexts.map(function (oContext) {
	// 		return oContext.getObject();
	// 	});
	// 	let jsonData = [];

	// 	// Build the jsonData array using the fetched data
	// 	for (let index = 0; index < aFilteredData.length; index++) {

	// 		jsonData.push({
	// 			'Customer ID': aFilteredData[index]?.customer_id,
	// 			'Customer Name': aFilteredData[index]?.customer_name,
	// 			'Search Term': aFilteredData[index]?.search_term,
	// 			'Status': aFilteredData[index]?.status,
	// 			'Pending from whom': aFilteredData[index]?.pending_with,
	// 			'GST IN': aFilteredData[index]?.gst,
	// 			'Address': aFilteredData[index]?.address1 +","+ aFilteredData[index]?.address2 +","+ aFilteredData[index]?.city +","+ aFilteredData[index]?.district +","+ aFilteredData[index]?.pin
	// 		});
	// 	}

	// 	const worksheet = XLSX.utils.json_to_sheet(jsonData);
	// 	const workbook = XLSX.utils.book_new();

	// 	// Set column widths
	// 	worksheet['!cols'] = [
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 30 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 },
	// 		{ width: 20 }
	// 	];

	// 	// Set header styles
	// 	const headerCells = ["A1", "B1", "C1", "D1", "E1"];
	// 	headerCells.forEach(cell => {
	// 		worksheet[cell].s = {
	// 			fill: {
	// 				fgColor: { rgb: "FFFF00" }
	// 			}
	// 		};
	// 	});

	// 	XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");

	// 	// Write workbook to a file
	// 	const filePath = 'customer_data.xlsx';
	// 	XLSX.writeFile(workbook, filePath, { bookSST: true });
	// 	busyDialog.close();

	// }
}
