import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
let listData = [];
let customer_list = [];
let employee_list = [];
@KloUI5("o2c_v2.controller.p_so_customer")
export default class p_so_customer extends KloController{
	
	public async onPageEnter() {
		await this.tm.getTN("table_data_oth").setData({});

		let type =[
			{type: "AMC"}, {type: "API"}
		];
		await this.tm.getTN("type").setData(type);
		let status =[
			{status: "Active"}, {status: "Expired"}, {status: "Not Yet Started"}
		];
		await this.tm.getTN("status").setData(status);

		customer_list = await this.tm.getTN('customer_list').getData();
		employee_list = await this.transaction.getExecutedQuery("d_o2c_employee", {loadAll: true });
	}
	public async onAfterSearch(){

		let oBusy = new sap.m.BusyDialog({
            text: "Loading..."
        });
        oBusy.open();

		listData = [];


		let search = await this.tm.getTN('so_search').getData();
		const types = ["AMC", "API"];
		let type = search.type? search.type: null;
		let cus_ids = search.bill_to_customer? search.bill_to_customer: null;

		let start_date = search.start_date ? search.start_date: null;
		let end_date = search.end_date ? search.end_date: null;
		let so = search.so ? search.so: null;
		let profit_center = search.profit_center? search.profit_center:null;
		let sales_responsible = search.sales_responsible?search.sales_responsible: null;
		let po_number = search.po_number? search.po_number: null;
		let test = await this.transaction.getExecutedQuery("q_so_customer", { profit_center:profit_center, so:so, customer_id: cus_ids, item_type:type,start_date:start_date,
			 end_date:end_date, sales_responsible:sales_responsible,po_number:po_number, loadAll: true });


		// await this.getList1(cus_ids, test);


		let product = search.product;
		let subscription = search.subscription;
		let status = search.status;

		await this.getList4(cus_ids, test);

		const result = listData.filter(item => {
			const isProductMatch = !product || product.length === 0 || product.includes(item.product_id);
			const isStatusMatch = !status || status.length === 0 || status.includes(item.status);
			const isSubscriptionMatch = !subscription || subscription.length === 0 || (item.subscriptions && subscription.every(sub => item.subscriptions.includes(sub)));
			return isProductMatch && isStatusMatch && isSubscriptionMatch;
		  });

		await this.tm.getTN("table_data_oth").setData(result);
		
		oBusy.close();
	}
	public async onTypeChange(){
		let search = await this.tm.getTN('so_search').getData();
		let type = search.type;
		// let productList = await this.transaction.getExecutedQuery('q_product_by_type', {typee : type})
		await this.tm.getTN("product").setProperty('typee', type);
		await this.tm.getTN("product").executeP();
	}
	public async onProductChange(){
		let search = await this.tm.getTN('so_search').getData();
		let type = search.type;
		let product = search.product;
		await this.tm.getTN("subscription").setProperty('typee', type);
		await this.tm.getTN("subscription").setProperty('product_id', product);
		await this.tm.getTN("subscription").executeP();
	}
    public async onFilterSearch(){

		let oBusy = new sap.m.BusyDialog({
            text: "Loading..."
        });
        oBusy.open();


		listData = [];
		let cus_ids = await this.tm.getTN('customer_search').getData().bill_to_customer;

		let a = ["AMC", "API"];
		let so_list = await this.transaction.getExecutedQuery("q_so_customer", { customer_id: cus_ids, item_type:a, loadAll: true });
        await this.getList(cus_ids, so_list);

		await this.tm.getTN("table_data_oth").setData(listData);
		
		oBusy.close();
    }
	
	
	public async getList1(cus_ids, test){
		// , expandAll:"r_profit_center"
		// let so_list = await this.transaction.getExecutedQuery("q_so_customer", { customer_id: cus_ids, item_type:type, loadAll: true });
		let so_list = test;
		let product_type = so_list.map((e)=>e.product_type)
		let product_entity = await this.transaction.getExecutedQuery("d_o2c_product_master", { product_id: product_type, loadAll: true });

		for(let i=0; i<so_list.length; i++){
			let attach_entity = await this.transaction.getExecutedQuery("d_o2c_so_attachment", { so_guid: so_list[i].so_guid, loadAll: true });
			let attach_ids = attach_entity.map((e)=>e.attachment_id);
			

			let item_entity = await this.transaction.getExecutedQuery("d_o2c_so_item", { attachment_id: attach_ids, loadAll: true });
			let so_items = item_entity.map((e)=>e.soitem)

			let api_entity = await this.transaction.getExecutedQuery("d_o2c_so_api_type", { soitem: so_items, loadAll: true });
			let api_type = api_entity.map((e)=>e.api_type)

			let api_name_entity = await this.transaction.getExecutedQuery("d_o2c_product_based_api_type", { api_id: api_type, loadAll: true });
			// let subscription = api_entity.map((e)=>e.api_type);
			let subscription_map = new Map();
			let type_map = new Map();
			for(let j=0; j<so_items.length; j++){
				// let filteredEntities = api_name_entity.filter(item => item.api_id === so_items[j]);
				// let subscription = filteredEntities.map((e)=>e.api_name);
				let filteredEntities = api_entity.filter(item => item.soitem === so_items[j]);
				let subscription = filteredEntities.map((e)=>e.api_type);
				let filteredAPINameEntity = api_name_entity.filter(item => subscription.includes(item.api_id));
				let subsName = filteredAPINameEntity.map((e)=>e.api_name);

				if(subsName.length > 0){
					let keyString = JSON.stringify(subsName);
					if (subscription_map.has(keyString)) {
						// If key exists, get the existing array and push the new index
						let existingIndexes = subscription_map.get(keyString);
						existingIndexes.push(j);
						subscription_map.set(keyString, existingIndexes);
					} else {
						// If key does not exist, create a new entry with the current index
						subscription_map.set(keyString, [j]);
						type_map.set(keyString, item_entity[j].item_category);
					}
				}	
			}
			subscription_map.forEach(async (value, key) => {
				let indexArray = value;
				// Extract relevant objects
				const filteredItemEntity = indexArray.map(index => item_entity[index]);
				const filteredAttachEntity = attach_entity.filter(item => item.attachment_id === filteredItemEntity[0].attachment_id);;

				// Find min startDate and max endDate
				const minStartDate = filteredItemEntity.reduce((min, obj) => obj.start_date < min ? obj.start_date : min, filteredItemEntity[0].start_date);
				const maxEndDate = filteredItemEntity.reduce((max, obj) => obj.end_date > max ? obj.end_date : max, filteredItemEntity[0].end_date);
				// let deltaDays = await this.getDayDiffFromToday(maxEndDate)
				let todayDate = new Date();
				let obj = {
					customerID: so_list[i].bill_to_customer,
					// customerName: customer_list.filter(item => item.customer_id === so_list[i].bill_to_customer)[0].customer_name,
					so: so_list[i].so,
					soDescription: so_list[i].project_name,
					// product: so_list[i].product_type,
					product: product_entity.filter(item => item.product_id == so_list[i].product_type)[0].product_description,
					product_id: so_list[i].product_type,

					type: type_map.get(key),
					status: (todayDate >= minStartDate && todayDate <= maxEndDate) ? "Active" : "Expired",
					amcType: "",
					// subscriptions: (JSON.parse(key)).join(', '),
					subscriptions: JSON.parse(key),
					goLiveDate: "",
					amcStartDate: minStartDate,
					amcEndDate: maxEndDate,
					deltaDays: await this.getDayDiffFromToday(maxEndDate),
					salesResponsible: employee_list.filter(item => item.employee_id === so_list[i].sales_responsible)[0].full_name,
					perPDCost: filteredAttachEntity[0].cr_rate,
					gspProvider: "",
					setup: "" ,
					profitCenter: so_list[i].transient_profit_center,
					projectManager: so_list[i].transient_pro_manager,
					teamHead: so_list[i].trans_team_head

				}
				if(todayDate<=minStartDate){
					obj.status = "Yet to Start"
				}

				listData.push(obj);
			});
			if(subscription_map.size == 0){
				let obj = {
					customerID: so_list[i].bill_to_customer,
					// customerName: customer_list.filter(item => item.customer_id === so_list[i].bill_to_customer)[0].customer_name,
					so: so_list[i].so,
					soDescription: so_list[i].project_name,
					// product: so_list[i].product_type,
					product: product_entity.filter(item => item.product_id == so_list[i].product_type)[0]? product_entity.filter(item => item.product_id == so_list[i].product_type)[0].product_description : null,
					type: null,
					status: null,
					amcType: null,
					// subscriptions: (JSON.parse(key)).join(', '),
					subscriptions: null,
					goLiveDate: "",
					amcStartDate: null,
					amcEndDate: null,
					deltaDays: null,
					// salesResponsible: employee_list.filter(item => item.employee_id === so_list[i].sales_responsible)[0].full_name,
					perPDCost: null,
					gspProvider: "",
					setup: "",
					profitCenter: so_list[i].transient_profit_center,
					projectManager: so_list[i].transient_pro_manager,
					teamHead: so_list[i].trans_team_head
				}
				listData.push(obj);
			}
		}	
	}

	public async getList(cus_ids, test) {
		let so_list = test;
		let product_type_set = new Set(so_list.map(e => e.product_type));
	
		// Fetch all required data in parallel
		let [product_entity, all_attachments, all_items, all_api_types, all_api_names] = await Promise.all([
			this.transaction.getExecutedQuery("d_o2c_product_master", { product_id: Array.from(product_type_set), loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_attachment", { so_guid: so_list.map(e => e.so_guid), loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_item", { loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_api_type", { loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_product_based_api_type", { loadAll: true }),
		]);
	
		// Convert arrays to maps for faster lookup
		let productMap = new Map(product_entity.map(p => [p.product_id, p]));
		let attachmentMap = new Map();
		let itemMap = new Map();
		let apiTypeMap = new Map();
		let apiNameMap = new Map();
	
		all_attachments.forEach(a => attachmentMap.set(a.so_guid, a));
		all_items.forEach(i => itemMap.set(i.attachment_id, i));
		all_api_types.forEach(a => apiTypeMap.set(a.soitem, a.api_type));
		all_api_names.forEach(a => apiNameMap.set(a.api_id, a.api_name));
	
		let todayDate = new Date();
	
		for (let i = 0; i < so_list.length; i++) {
			let so = so_list[i];
			let attach_entity = attachmentMap.get(so.so_guid) || {};
			let attach_ids = attach_entity.attachment_id ? [attach_entity.attachment_id] : [];
	
			// Ensure multiple attachments are handled
			if (Array.isArray(attach_entity)) {
				attach_ids = attach_entity.map(a => a.attachment_id).filter(Boolean);
			}
	
			// attach_ids, id
			let item_entities = all_items.map(id => itemMap.get(id)).filter(Boolean);
			let so_items = item_entities.map(e => e.soitem).filter(Boolean);
	
			// Fetch API types based on so_itemss
			let api_types = so_items.map(soitem => apiTypeMap.get(soitem)).filter(Boolean);
			let subsNames = api_types.map(api => apiNameMap.get(api)).filter(Boolean);
	
			let minStartDate = item_entities.length ? Math.min(...item_entities.map(e => new Date(e.start_date))) : null;
			let maxEndDate = item_entities.length ? Math.max(...item_entities.map(e => new Date(e.end_date))) : null;
	
			let obj = {
				customerID: so.bill_to_customer,
				customerName: customer_list.find(c => c.customer_id === so.bill_to_customer)?.customer_name || null,
				so: so.so,
				soDescription: so.project_name,
				product: productMap.get(so.product_type)?.product_description || null,
				product_id: so.product_type,
				type: item_entities.length ? item_entities[0].item_category : null,
				status: (todayDate >= minStartDate && todayDate <= maxEndDate) ? "Active" : "Expired",
				subscriptions: subsNames.length ? subsNames : null,  // Ensuring correct subscription logic
				amcStartDate: minStartDate ? new Date(minStartDate) : null,
				amcEndDate: maxEndDate ? new Date(maxEndDate) : null,
				deltaDays: maxEndDate ? await this.getDayDiffFromToday(new Date(maxEndDate)) : null,
				salesResponsible: employee_list.find(e => e.employee_id === so.sales_responsible)?.full_name || null,
				perPDCost: attach_entity.cr_rate || null,
				profitCenter: so.transient_profit_center,
				projectManager: so.transient_pro_manager,
				teamHead: so.trans_team_head
			};
	
			if (todayDate <= minStartDate) {
				obj.status = "Yet to Start";
			}
	
			listData.push(obj);
		}
	}
	
	public async getList2(cus_ids, test) {
		let so_list = test;
		let product_type_set = new Set(so_list.map(e => e.product_type));
	
		// Fetch all required data in parallel
		let [product_entity, all_attachments, all_items, all_api_types, all_api_names] = await Promise.all([
			this.transaction.getExecutedQuery("d_o2c_product_master", { product_id: Array.from(product_type_set), loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_attachment", { so_guid: so_list.map(e => e.so_guid), loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_item", { loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_so_api_type", { loadAll: true }),
			this.transaction.getExecutedQuery("d_o2c_product_based_api_type", { loadAll: true }),
		]);
	
		// Convert arrays to maps for faster lookup
		let productMap = new Map(product_entity.map(p => [p.product_id, p.product_description]));
		let attachmentMap = new Map();
		let itemMap = new Map();
		let apiTypeMap = new Map();
		let apiNameMap = new Map();
	
		// Mapping data efficiently
		all_attachments.forEach(a => {
			if (!attachmentMap.has(a.so_guid)) {
				attachmentMap.set(a.so_guid, []);
			}
			attachmentMap.get(a.so_guid).push(a);
		});
	
		all_items.forEach(i => {
			if (!itemMap.has(i.attachment_id)) {
				itemMap.set(i.attachment_id, []);
			}
			itemMap.get(i.attachment_id).push(i);
		});
	
		all_api_types.forEach(a => {
			if (!apiTypeMap.has(a.soitem)) {
				apiTypeMap.set(a.soitem, []);
			}
			apiTypeMap.get(a.soitem).push(a.api_type);
		});
	
		all_api_names.forEach(a => apiNameMap.set(a.api_id, a.api_name));
	
		let todayDate = new Date();
	
		for (let so of so_list) {
			let attach_entities = attachmentMap.get(so.so_guid) || [];
			let attach_ids = attach_entities.map(a => a.attachment_id).filter(Boolean);
	
			// Fetch relevant items
			let item_entities = attach_ids.flatMap(id => itemMap.get(id) || []);
			let so_items = item_entities.map(e => e.soitem).filter(Boolean);
	
			// Fetch API types based on so_items
			let api_types = so_items.flatMap(soitem => apiTypeMap.get(soitem) || []);
			let subsNames = api_types.map(api => apiNameMap.get(api)).filter(Boolean);
	
			let minStartDate = item_entities.length ? Math.min(...item_entities.map(e => new Date(e.start_date).getTime())) : null;
			let maxEndDate = item_entities.length ? Math.max(...item_entities.map(e => new Date(e.end_date).getTime())) : null;
	
			let obj = {
				customerID: so.bill_to_customer,
				customerName: customer_list.find(c => c.customer_id === so.bill_to_customer)?.customer_name || null,
				so: so.so,
				soDescription: so.project_name,
				product: productMap.get(so.product_type) || null,
				product_id: so.product_type,
				type: item_entities.length ? item_entities[0].item_category : null,
				status: (todayDate >= new Date(minStartDate) && todayDate <= new Date(maxEndDate)) ? "Active" : "Expired",
				subscriptions: subsNames.length ? subsNames : null,
				amcStartDate: minStartDate ? new Date(minStartDate) : null,
				amcEndDate: maxEndDate ? new Date(maxEndDate) : null,
				deltaDays: maxEndDate ? await this.getDayDiffFromToday(new Date(maxEndDate)) : null,
				salesResponsible: employee_list.find(e => e.employee_id === so.sales_responsible)?.full_name || null,
				perPDCost: attach_entities.length ? attach_entities[0].cr_rate : null,
				profitCenter: so.transient_profit_center,
				projectManager: so.transient_pro_manager,
				teamHead: so.trans_team_head
			};
	
			if (todayDate <= new Date(minStartDate)) {
				obj.status = "Yet to Start";
			}
	
			listData.push(obj);
		}
	}
	public async getList4(cus_ids, test) {
		let so_list = test;
		let product_type = so_list.map((e) => e.product_type);
	
		// Fetch product_entity in one go
		let product_entity = await this.transaction.getExecutedQuery("d_o2c_product_master", { product_id: product_type, loadAll: true });
		let productMap = new Map(product_entity.map(item => [item.product_id, item.product_description]));
	
		// Fetch all attachments and items in parallel
		let attachPromises = so_list.map(async (so) => {
			let attach_entity = await this.transaction.getExecutedQuery("d_o2c_so_attachment", { so_guid: so.so_guid, loadAll: true });
			let attach_ids = attach_entity.map((e) => e.attachment_id);
			let item_entity = await this.transaction.getExecutedQuery("d_o2c_so_item", { attachment_id: attach_ids, loadAll: true });
			return { so, attach_entity, item_entity };
		});
	
		let attachResults = await Promise.all(attachPromises);
	
		// Process each SO
		for (let { so, attach_entity, item_entity } of attachResults) {
			let so_items = item_entity.map((e) => e.soitem);
	
			// Fetch API types and names in parallel
			let api_entity = await this.transaction.getExecutedQuery("d_o2c_so_api_type", { soitem: so_items, loadAll: true });
			let api_type = api_entity.map((e) => e.api_type);
			let api_name_entity = await this.transaction.getExecutedQuery("d_o2c_product_based_api_type", { api_id: api_type, loadAll: true });
	
			let subscription_map = new Map();
			let type_map = new Map();
	
			// Build subscription_map and type_map
			for (let j = 0; j < so_items.length; j++) {
				let filteredEntities = api_entity.filter((item) => item.soitem === so_items[j]);
				let subscription = filteredEntities.map((e) => e.api_type);
				let filteredAPINameEntity = api_name_entity.filter((item) => subscription.includes(item.api_id));
				let subsName = filteredAPINameEntity.map((e) => e.api_name);
	
				if (subsName.length > 0) {
					let keyString = JSON.stringify(subsName);
					if (subscription_map.has(keyString)) {
						subscription_map.get(keyString).push(j);
					} else {
						subscription_map.set(keyString, [j]);
						type_map.set(keyString, item_entity[j].item_category);
					}
				}
			}
	
			// Process subscription_map
			if (subscription_map.size > 0) {
				let todayDate = new Date();
				for (let [key, value] of subscription_map.entries()) {
					let indexArray = value;
					let filteredItemEntity = indexArray.map((index) => item_entity[index]);
					let filteredAttachEntity = attach_entity.filter((item) => item.attachment_id === filteredItemEntity[0].attachment_id);
	
					let minStartDate = filteredItemEntity.reduce((min, obj) => (obj.start_date < min ? obj.start_date : min), filteredItemEntity[0].start_date);
					let maxEndDate = filteredItemEntity.reduce((max, obj) => (obj.end_date > max ? obj.end_date : max), filteredItemEntity[0].end_date);
	
					let obj = {
						customerID: so.bill_to_customer,
						so: so.so,
						soDescription: so.project_name,
						product: productMap.get(so.product_type) || null,
						product_id: so.product_type,
						type: type_map.get(key),
						status: todayDate < minStartDate ? "Yet to Start" : (todayDate >= minStartDate && todayDate <= maxEndDate) ? "Active" : "Expired",
						amcType: "",
						subscriptions: JSON.parse(key),
						goLiveDate: "",
						amcStartDate: minStartDate,
						amcEndDate: maxEndDate,
						deltaDays: await this.getDayDiffFromToday(maxEndDate),
						salesResponsible: employee_list.find((item) => item.employee_id === so.sales_responsible)?.full_name || null,
						perPDCost: filteredAttachEntity[0]?.cr_rate || null,
						gspProvider: "",
						setup: "",
						profitCenter: so.transient_profit_center,
						projectManager: so.transient_pro_manager,
						teamHead: so.trans_team_head,
					};
	
					listData.push(obj);
				}
			} else {
				// Handle case where subscription_map is empty
				let obj = {
					customerID: so.bill_to_customer,
					so: so.so,
					soDescription: so.project_name,
					product: productMap.get(so.product_type) || null,
					product_id: so.product_type,
					type: null,
					status: null,
					amcType: null,
					subscriptions: null,
					goLiveDate: "",
					amcStartDate: null,
					amcEndDate: null,
					deltaDays: null,
					salesResponsible: employee_list.find((item) => item.employee_id === so.sales_responsible)?.full_name || null,
					perPDCost: null,
					gspProvider: "",
					setup: "",
					profitCenter: so.transient_profit_center,
					projectManager: so.transient_pro_manager,
					teamHead: so.trans_team_head,
				};
				listData.push(obj);
			}
		}
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	public async getDayDiffFromToday(dateObj) {
		let today = new Date();
		
		// Set both dates to midnight to avoid issues with time differences
		today.setHours(0, 0, 0, 0);
		dateObj.setHours(0, 0, 0, 0);
	
		// Calculate the difference in milliseconds
		const diffInMs = dateObj - today;
	
		// Convert milliseconds to days
		return Math.round(diffInMs / (1000 * 60 * 60 * 24));
	}
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	
}