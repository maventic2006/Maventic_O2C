import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_so_hdr } from 'o2c_v2/entity/d_o2c_so_hdr';
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_sales_order_list")
let list = [];
export default class p_sales_order_list extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public filter = { status: null };
	public role;
	public user;
	// public async onPageEnter(oEvent) {
	// 	let busyDialog = new sap.m.BusyDialog({
	//         text: "Please Wait, Data is fetching..."
	//     });
	//     busyDialog.open();
	// 	this.role = (await this.transaction.get$Role()).role_id;
	// 	this.user = (await this.transaction.get$User()).login_id;
	// 	let loginProfitCenter = "";
	// 	let loginCompanyCode = [];
	// 	let loginBusinessArea = [];
	// 	let loginOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { loadAll: true, 'employee_id': this.user });
	// 	let filterprimaryOrg = loginOrg.filter(item => (item.is_primary == true));
	// 	if (this.role == "TEAM_HEAD") {
	// 		loginProfitCenter = filterprimaryOrg[0].profit_centre;
	// 		loginCompanyCode[0] = filterprimaryOrg[0].company_code;
	// 		loginBusinessArea[0] = filterprimaryOrg[0].business_area;
	// 	}
	// 	else {
	// 		for (let i = 0; i < loginOrg.length; i++) {
	// 			loginCompanyCode[i] = loginOrg[i].company_code;
	// 			loginBusinessArea[i] = loginOrg[i].business_area;
	// 		}
	// 	}
	// 	/*if(!(this.tm.getTN("query_search").getData().project_start_date) || !(this.tm.getTN("query_search").getData().project_end_date))
	// 	{
	// 		await this.tm.getTN("query_search").setProperty('project_start_date', new Date());
	// 		await this.tm.getTN("query_search").setProperty('project_end_date', new Date());
	// 	}*/
	// 	const current_date_check: Date = new Date();
	// 	const three_months_before: Date = new Date();
	// 	three_months_before.setMonth(current_date_check.getMonth() - 3);
	// 	await this.tm.getTN("query_search").setProperty('role_id', this.role);
	// 	await this.tm.getTN("query_search").setProperty('profit_center_name', loginProfitCenter);
	// 	await this.tm.getTN("query_search").setProperty('company', loginCompanyCode);
	// 	await this.tm.getTN("query_search").setProperty('business_area', loginBusinessArea);
	// 	await this.tm.getTN("query_search").setProperty('current_date_check', current_date_check);
	// 	await this.tm.getTN("query_search").setProperty('three_months_before', three_months_before);
	// 	await this.tm.getTN("query_search").executeP();
	// 	this.list = await this.tm.getTN("header_list").getData();
	// 	for(let i=0;i<this.list.length;i++)
	// 	{
	// 		await this.list[i].fetch()
	// 	}
	// 	busyDialog.close();
	// }


	public async onPageEnter(oEvent) {
		if (!window['XLSX']) {
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}
		// let busyDialog = new sap.m.BusyDialog({
		// 	text: "Please Wait, Data is loading..."
		// });
		// busyDialog.open();

		let busyID = this.showBusy({blocked: true});

		//Employee list add
		let elist = await this.tm.getTN("employee_list").getData();
		elist.push({
			'employee_id': "FINANCE",
			'full_name': "FINANCE"
		})
		try {
			this.role = (await this.transaction.get$Role()).role_id;
			await this.tm.getTN("user_role").setData({ 'role': this.role });
			let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "so" });
			if (general_config[0].high_value == 1) {
				this.tm.getTN("user_role").setProperty("so", true);
			}else{
				this.tm.getTN("user_role").setProperty("so", false);
			}
			this.user = (await this.transaction.get$User()).login_id;
			// let role_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { employee_id: this.user, page_name: "SO", loadAll: true });
			// if (role_list.length) {
			// 	this.role = role_list[0].assyned_role;
			// }

			// let loginProfitCenter = [];
			// let loginCompanyCode = [];
			// let loginBusinessArea = [];

			// let loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
			// 	loadAll: true, 'employee_id': this.user,'active_till': new Date()
			// });
			// //let primaryOrg = loginOrg.filter(item => item.is_primary);

			// if (this.role === "TEAM_HEAD") {
			// 	// Initialize arrays and a Set for unique business areas
			// 	const businessAreaSet = new Set();
			// 	const companySet = new Set();

			// 	for (let i = 0; i < loginOrg.length; i++) {
			// 		loginProfitCenter.push(loginOrg[i].profit_centre);
			// 		companySet.add(loginOrg[i].company_code);
			// 		businessAreaSet.add(loginOrg[i].business_area);
			// 	}

			// 	// Convert the Set to an array
			// 	loginCompanyCode=Array.from(companySet);
			// 	loginBusinessArea = Array.from(businessAreaSet);
			// }
			// else {
			// 	loginCompanyCode = loginOrg.map(item => item.company_code);
			// 	loginBusinessArea = loginOrg.map(item => item.business_area);
			// }

			const currentDate = new Date();
			const threeMonthsBefore = new Date();
			threeMonthsBefore.setMonth(currentDate.getMonth() - 3);


			// await querySearch.setProperty('role_id', this.role);
			// await querySearch.setProperty('profit_center_name', loginProfitCenter);
			// await querySearch.setProperty('company', loginCompanyCode);
			// await querySearch.setProperty('business_area', loginBusinessArea);
			let querySearch = this.tm.getTN("query_search");
			//await querySearch.setProperty('current_date_check', currentDate);
			//await querySearch.setProperty('three_months_before', threeMonthsBefore);
			if (this.filter.status === "Pending") {
				await this.pending_for_me();
			} else if (this.filter.status === "Archived") {
				await this.onDiscardSO();
			}
			else if (this.filter.status === "Closed") {
				await this.onClosed();
			}
			else if (this.filter.status === "Back To Edit") {
				await this.on_back_to_edit();
			}
			let query_data = await querySearch.getData()
			query_data.setLoadAll(true);

			await querySearch.executeP();

			// await this.tm.getTN("header_list").setData(this.list);
			// await this.tm.getTN("header_list").applyfilterP('s_status', "Approved");
			// await this.tm.getTN("header_list").applyfilterP('s_status', 'Call Back');
			if (this.filter.status === null) {
				list = await this.tm.getTN("header_list").getData();
			}
			await Promise.all(list.map(item => item.fetch()));



			// //code for excel download
			// let entity = querySearch.getEntitySet();
			// for (let i = 0; i < entity.length; i++) {
			// 	let totalAmount = 0; // Initialize total amount variable
			// 	let attachment = await entity[i].r_so_attachment.fetch();
			// 	let pcmngr = await entity[i].r_profit_center.fetch();

			// 	//Item Pds Start
			// 	for (let j = 0; j < attachment.length; j++) {
			// 		// Add the item_pd_or_qty to totalAmount
			// 		totalAmount += attachment[j].budgeted_pd;
			// 	}
			// 	// Return the total amount
			// 	entity[i].item_pds = totalAmount.toString();
			// 	//Item Pds End
			// 	//PO NO Start
			// 	let po = ''
			// 	for (let j = 0; j < attachment.length; j++) {
			// 		if (j > 0) {
			// 			po += ","
			// 		}
			// 		po += attachment[j].po_no
			// 	}
			// 	entity[i].transient_po = po;
			// 	//PO NO End
			// 	//current Pending with Start
			// 	//current Pending with End
			// 	//Gross value Start
			// 	let gross_value = 0;
			// 	for (let j = 0; j < attachment.length; j++) {
			// 		gross_value += attachment[j].gross_value
			// 	}
			// 	entity[i].transient_gross = gross_value.toString();
			// 	//Gross value end 
			// 	//Project Manager Start
			// 	let project_manager = ''
			// 	for (let j = 0; j < pcmngr.length; j++) {
			// 		if (j > 0) {
			// 			project_manager += ",";
			// 		}
			// 		let profit_pm = pcmngr[j].project_manager;
			// 		project_manager += profit_pm;
			// 	}
			// 	entity[i].transient_pro_manager = project_manager;
			// 	//Project Manager End
			// 	//Profit center start
			// 	let profit_center = ''
			// 	for (let j = 0; i < pcmngr.length; i++) {
			// 		if (j > 0) {
			// 			profit_center += ","
			// 		}
			// 		let pc = pcmngr[i].profit_center
			// 		profit_center += pc
			// 	}
			// 	entity[i].transient_profit_center = profit_center;
			// 	//Profit Center End
			// }
			// //End of excel download
		} catch (error) {
			console.error('Error during onPageEnter:', error);
		} finally {
			this.tm.getTN("header_list").refresh();
			// busyDialog.close();
			this.hideBusy(busyID);
		}
	}

	public async onCreateAI() {
		await this.navTo(({ S: 'p_so_ai' }));
	}


	public async onCreate() {
		// let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "so" });
		// if (general_config[0].high_value == 1) {
		// 	await this.navTo(({ S: 'p_so_ai' }));
		// } else {
		await this.navTo(({ S: 'p_so' }));
		// }
		// await this.tm.getTN("header_list").createEntityP({ s_object_type: -1, s_status: "New", gross_value: 0 }, "Created Successfully", "Created Failed", null, "First", true, true);
	}
	public async onNavigate(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/header_list/", ''))
		let so_guid = this.tm.getTN("header_list").getData()[index].so_guid
		// let so = this.tm.getTN("header_list").getData()[index].so
		// let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "so" });
		// if (general_config[0].high_value == 1) {
		// 	await this.navTo(({ S: 'p_so_ai', AD: so_guid }));
		// } else {
		// 	await this.navTo(({ S: 'p_so', AD: so_guid }));
		// }
		await this.navTo(({ S: 'p_so', AD: so_guid }));
	}
	public async on_approved() {
		this.filter.status = "Approved";
		await this.tm.getTN("header_list").setData(list);
		await this.tm.getTN("header_list").applyfilterP('s_status', "Approved");
	}
	// public async on_approved() {
	// 	this.filter.status = "Approved";

	// 	// Assuming list is an array of objects, applying filter to it
	// 	const filteredList = list.filter(item => item.s_status === "Approved");

	// 	await this.tm.getTN("header_list").setData(filteredList);
	// }
	public async reset() {
		this.filter.status = null;
		await this.tm.getTN('header_list').setData(list);
		await this.tm.getTN('header_list').resetP(true);
	}
	// public async pending_for_me() {
	// 	let filteredList = this.list.filter(item => {
	// 		if (item.s_status === "Pending" || item.s_status === "Approved") {
	// 			let roles = item.currently_pending_with.split(',');
	// 			return roles.includes(this.role);
	// 		}
	// 		return false;
	// 	});
	// 	await this.tm.getTN("header_list").setData(filteredList);
	// }

	public async pending_for_me() {

		// let querySearch = this.tm.getTN("query_search");
		// await querySearch.setProperty('filter_status', "Pending" );
		if (this.filter.status === "Approved") {
			await this.tm.getTN('header_list').resetP(true);
		}
		// await querySearch.executeP();
		// await this.tm.getTN("header_list").refresh();
		await this.tm.getTN("header_list").setData(list);
		this.filter.status = "Pending";
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait"
		});
		busyDialog.open();

		let userProfitCenter = await this.transaction.getExecutedQuery('q_current_profit_center', {
			loadAll: true,
			'employee_id': this.user,
			'active_till': new Date()
		});

		let profitCenterSet = new Set(userProfitCenter.map(center => center.profit_centre));

		let listed = await this.tm.getTN("header_list").getData();
		let filteredList = [];

		listed.forEach(async item => {
			let matches = false;
			await item.r_currently_pending.fetch();
			if (this.role === "TEAM_HEAD" || this.role === "FINANCE") {
				if ((item.s_status === "Pending") ||
					(item.s_status === "Approved" && item.cr_status === "Open")) {

					let hasFinanceRoleInCycle = item.r_currently_pending.some(pendingItem =>
						pendingItem.approval_cycle === parseInt(item.approval_cycle) &&
						pendingItem.pending_with_role === "FINANCE" && pendingItem.approval_status === "Pending"
					);

					if (this.role === "TEAM_HEAD" && hasFinanceRoleInCycle) {
						matches = false;
					} else {
						matches = item.r_currently_pending.some(pendingItem => {
							let roleCondition = this.role !== "TEAM_HEAD" || (
								profitCenterSet.has(pendingItem.profit_center_name) &&
								!hasFinanceRoleInCycle
							);

							return roleCondition &&
								parseInt(item.approval_cycle) === pendingItem.approval_cycle &&
								pendingItem.pending_with_role === this.role &&
								pendingItem.approval_status === "Pending";
						});
					}
				}
			} else {
				matches = item.s_status === "Back To Edit" || item.s_status === "Save As Draft" || item.s_status === "New" || item.s_status === "Call Back";
			}

			if (matches) {
				filteredList.push(item);
			}
		});

		await this.tm.getTN("header_list").setData(filteredList);
		busyDialog.close();
	}

	public async onDiscardSO() {
		this.filter.status = "Archived";
		// await this.tm.getTN("header_list").setData(this.list);
		// await this.tm.getTN("header_list").applyfilterP('s_status', "Archived");

		// await this.tm.getTN('header_list').setData(this.list);
		// let querySearch = this.tm.getTN("query_search");
		// await querySearch.setProperty('s_status', "Archived");
		// await querySearch.executeP();
		// this.list = await this.tm.getTN("query_search").getData().entityset;

		let discarded_so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('d_o2c_so_hdr', {
			loadAll: true, s_status: "Archived", expandAll: "r_profit_center"
		});

		let userProfitCenter = await this.transaction.getExecutedQuery('q_current_profit_center', {
			loadAll: true,
			'employee_id': this.user,
			'active_till': new Date()
		});

		let profitCenterSet = new Set(userProfitCenter.map(center => center.profit_centre));
		let filteredSo = new Set();
		await Promise.all(discarded_so.map(async (item) => {
			let so_profit = await item.r_profit_center.fetch();

			// Handle TEAM_HEAD role
			if (this.role === "TEAM_HEAD" && item.type !== "NBS") {
				if (so_profit.some(profit => profitCenterSet.has(profit.profit_center))) {
					filteredSo.add(item); // Set ensures uniqueness
				}
				if (this.user == item.s_created_by) {
					filteredSo.add(item);
				}
			}

			// Handle FINANCE role
			else if (this.role === "FINANCE") {
				filteredSo.add(item);
			}

			// Handle non TEAM_HEAD and non FINANCE roles, check if user is the creator
			else if (this.user == item.s_created_by) {
				filteredSo.add(item);
			}

		}));

		// Convert Set back to array if needed
		let filteredSOArray = Array.from(filteredSo);

		await this.tm.getTN("header_list").setData(filteredSOArray);
		//await this.tm.getTN("header_list").setData(filteredSo);

		// await this.tm.getTN("header_list").setData(this.list);
		// await this.tm.getTN("header_list").applyfilterP('s_status', "Archived");
	}

	public async onClosed() {
		this.filter.status = "Closed";
		let closed_so = await this.transaction.getExecutedQuery('q_so_list', {
			loadAll: true, s_status: "Closed"
		});
		// let filteredSOArrayClosed = Array.from(closed_so);

		// await this.tm.getTN("header_list").setData(filteredSOArrayClosed);
		await this.tm.getTN("header_list").setData(closed_so);

	}
	public async on_back_to_edit() {
		this.filter.status = "Back To Edit";
		await this.tm.getTN("header_list").setData(list);
		await this.tm.getTN("header_list").applyfilterP('s_status', "Back To Edit");
	}
	// public async on_back_to_edit() {
	// 	this.filter.status = "Back To Edit";

	// 	// Assuming list is an array of objects, applying filter to it
	// 	const filteredList = list.filter(item => item.s_status === "Back To Edit");

	// 	await this.tm.getTN("header_list").setData(filteredList);
	// }

	public async downloadExcel() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is fetching..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		let listData = await this.tm.getTN("header_list").getData();
		let jsonData = [];
		let taskDataMap = new Map();

		// Collect all task IDs that need to be fetched
		/* let taskIdsToFetch = listData
			 .filter(item => !taskDataMap.has(item.task_id))
			 .map(item => item.task_id);
 
		 // Fetch data for all unique task IDs concurrently
		 let fetchPromises = taskIdsToFetch.map(taskId => {
			 let listItem = listData.find(item => item.task_id === taskId);
			 return listItem.r_booking_to_task_tr.fetch().then(() => {
				 taskDataMap.set(taskId, listItem.r_booking_to_task_tr[0]);
			 });
		 });
 
		 await Promise.all(fetchPromises);*/

		// Build the jsonData array using the fetched data
		for (let index = 0; index < listData.length; index++) {
			let taskId = listData[index].task_id;
			let taskData = taskDataMap.get(taskId);

			jsonData.push({
				'SO': listData[index]?.so,
				'Order Type': listData[index]?.type,
				'Project Name': listData[index]?.project_name,
				'Project Start Date': listData[index]?.project_start_date,
				'Project End Date': listData[index]?.project_end_date,
				'Gross Value': listData[index]?.transient_gross,
				'Bill To Customer': listData[index]?.bill_to_customer,
				'Sales Responsible': listData[index]?.sales_responsible,
				'Pre Sales By': listData[index]?.pre_sales,
				'Total SO PD': listData[index]?.item_pds,
				'PO Number': listData[index]?.transient_po,
				'Project Manager': listData[index]?.transient_pro_manager,
				'Current Pending With': listData[index]?.currently_pending_with,
				'Status': listData[index]?.s_status,
				'Profit Center': listData[index]?.transient_profit_center,
			});
		}

		const worksheet = XLSX.utils.json_to_sheet(jsonData);
		const workbook = XLSX.utils.book_new();

		// Set column widths
		worksheet['!cols'] = [
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 }
		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
		});


		XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Order Data");

		// Write workbook to a file
		const filePath = 'sales_order.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();
	}




}
////18 Feb 5:40PM