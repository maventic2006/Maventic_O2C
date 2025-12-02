// import { KloEntitySet } from 'kloBo_7-2-32';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_profit_centre } from 'o2c_v2/entity_gen/d_o2c_profit_centre';
declare let KloUI5: any;
let comment_list;
@KloUI5("o2c_v2.controller.p_asset_allocation")
export default class p_asset_allocation extends KloController {
	public filenm;
	public fileup;
	public userid;
	public allocation_comment_list = [];
	public allocation_comment;
	public commentList;
	public allocationEntity;
	public allocationVm = [];

	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}


	public onPageInit() {
		try {
			FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
		} catch (error) {
			sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
			throw error;
		}
	}
	public async onPageEnter(oEvent) {
		this.userid = (await this.transaction.get$User()).login_id;

		await this.tm.getTN("allocation_details_oth").setData({});
		await this.tm.getTN("allocation_details_characterstic").setData({});

		var oBusy = new sap.m.BusyDialog({
			text: "please wait...",
		});

		oBusy.open();

		let assetNumber = oEvent.navToParams.AssetNumber
		this.tm.getTN("asset_creation_search").setProperty('asset_number', assetNumber);
		await this.tm.getTN("asset_creation_search").executeP();


		await this.tm.getTN('asset_list').setActiveFirst()
		this.tm.getTN("asset_detail").setData({});
		this.tm.getTN("attachment").setData({});


		// allocation details characteristics
		let asset_details = await this.transaction.getExecutedQuery('d_asset_creation', { 'asset_number': assetNumber, loadAll: true });
		let allocationCharacterstic = await this.transaction.getExecutedQuery('d_asset_allocation_config', { 'asset_class': asset_details[0].asset_class, 'sub_asset_class': asset_details[0].asset_sub_class, loadAll: true });
		await this.tm.getTN("allocation_details_characterstic").setData(allocationCharacterstic[0]);

		oBusy.close();
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "asset_allocation");

	}

	public async onUploadDoc(oEvent, param) {
		this.fileup = oEvent.mParameters.files[0];
		this.filenm = oEvent.mParameters.files[0].name;
	}
	public async onSave() {
		var oBusy = new sap.m.BusyDialog({ text: "please wait...", });
		oBusy.open();

		// if already sent for allocation
		const assetCreation = await this.tm.getTN("asset_details").getData();
		let assetClubbed = await this.transaction.getExecutedQuery('d_o2c_asset_clubbing', { 'child_asset_number': assetCreation.asset_number, loadAll: true });

		if (assetClubbed.length) {
			oBusy.close();
			sap.m.MessageBox.error(`This is child asset of parent asset number ${assetClubbed[0].parent_asset_number} Therefore can not be allocated separately`, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			});
			return;
		}
		if (assetCreation.status == "In Store") {
			if (assetCreation.action_status && assetCreation.action_status != "") {
				const assetAction = await this.transaction.getExecutedQuery('d_asset_action_item', {
					asset_number: assetCreation.asset_number,
					action_status: 'Pending',
					loadAll: true
				});
				oBusy.close();
				sap.m.MessageBox.error(`This asset is already in ${assetCreation.action_status} process ${assetAction[0].request_number}`, {
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: null
				});
				return;
			}
		} else {
			oBusy.close();
			sap.m.MessageBox.error(`This asset is already ${assetCreation.status}`, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			});
			return;
		}

		let comment = await this.tm.getTN("allocation_details_oth").getData();
		if (!comment.asset_comment && this.allocation_comment_list.length == 0) {
			oBusy.close();
			sap.m.MessageBox.error(`Comment is Mandatory`, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null
			});
			return;
		}

		oBusy.close();

		sap.m.MessageBox.confirm(
			"Do you want to Allocate the Asset?",
			{
				title: "Confirmation",
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: async function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						oBusy.open();
						await this.flowMaster(1);
						oBusy.close();
					}
				}.bind(this)
			}
		);
	}

	// public async flowMaster(level) {
	// 	try {


	// 		// Retrieve asset allocation details
	// 		const asset_details = await this.tm.getTN("asset_details").getData();
	// 		let allocationDetails = this.tm.getTN("allocation_details_oth").getData();

	// 		// Execute the query for the master table
	// 		const main_master_table = await this.transaction.getExecutedQuery('d_asset_purchase_master', { company_code: asset_details.company_code, request_type: "AL", level: level, loadAll: true });


	// 		if (main_master_table.length) {
	// 			const masterTable = main_master_table.filter(item => parseInt(item.level) === parseInt(level));



	// 			// creating scrapping details table data
	// 			this.allocationEntity = await this.transaction.createEntityP("d_asset_allocation_request", {
	// 				// request_no : id_series.a_id,
	// 				request_type: "AL",
	// 				asset_class: asset_details.asset_class,
	// 				asset_sub_class: asset_details.asset_sub_class,
	// 				asset_description: asset_details.asset_description,
	// 				asset_no: asset_details.asset_number,
	// 				sub_asset_no: asset_details.sub_asset_number ? asset_details.sub_asset_number : 0,
	// 				company_code: asset_details.company_code,
	// 				tag_no: asset_details.tag_number ? asset_details.tag_number : null,
	// 				business_area: asset_details.business_area,
	// 				profit_center: asset_details.profit_center,
	// 				functional_area: asset_details.functional_area,
	// 				is_vm: asset_details.is_vm,
	// 				os: asset_details.os,
	// 				ip_address: asset_details.ip_address,
	// 				server_name: asset_details.server_name,
	// 				assign_to: allocationDetails.assign_to,
	// 				action_status: "Pending",
	// 				project_id: allocationDetails.project_id,
	// 				project_to_bill: allocationDetails.project_to_bill,
	// 				location: allocationDetails.location,
	// 				department: allocationDetails.department,

	// 			});
	// 			await this.tm.commitP("1st commit", "1st commit Failed", false, true);





	// 			// Filter the master table based on the current level

	// 			// getting team head
	// 			let team_head_id = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery('d_o2c_profit_centre', { 'company_code': asset_details.company_code, 'profit_center': asset_details.profit_center, loadAll: true })
	// 			// Create the asset action item with role information
	// 			await this.transaction.createEntityP('d_asset_action_item', {
	// 				s_object_type: -1,
	// 				request_number: this.allocationEntity.request_no,
	// 				request_type: "AL",
	// 				asset_number: asset_details.asset_number,
	// 				tag_number: asset_details.tag_number,
	// 				sub_asset_number: asset_details.sub_asset_number,
	// 				action_status: "Pending",
	// 				company_code: asset_details.company_code,
	// 				business_area: asset_details.business_area,
	// 				profit_center: asset_details.profit_center,
	// 				functional_area: asset_details.functional_area,
	// 				role_name: masterTable[0].role,
	// 				// action_required_by:masterTable[0].user_id,
	// 				approval_sequence: 1,
	// 				team_head: team_head_id[0].team_head,
	// 				asset_type: asset_details.asset_type
	// 			});

	// 			await this.transaction.createEntityP('d_asset_approve_status', {
	// 				s_object_type: -1,
	// 				request_number: this.allocationEntity.request_no,
	// 				request_type: "AL",
	// 				asset_number: asset_details.asset_number,
	// 				tag_number: asset_details.tag_number,
	// 				sub_asset_number: asset_details.sub_asset_number,
	// 				action_status: "Pending",
	// 				company_code: asset_details.company_code,
	// 				business_area: asset_details.business_area,
	// 				profit_center: asset_details.profit_center,
	// 				functional_area: asset_details.functional_area,
	// 				// action_required_by: masterTable[0].user_id,
	// 				approval_sequence: 1,
	// 				role_name: masterTable[0].role
	// 			});

	// 			// creation table action status (Asset Creation)
	// 			asset_details.action_status = "Allocating";

	// 			//comment
	// 			if (allocationDetails.asset_comment &&
	// 				(allocationDetails.asset_attachment || allocationDetails.asset_comment)) {
	// 				await this.onAllocation_comment_sent();
	// 			}
	// 			for (let i = 0; i < this.allocation_comment_list.length; i++) {
	// 				this.allocation_comment_list[i].request_number = this.allocationEntity.request_no;
	// 			}

	// 			await this.tm.commitP("Send For Approval", "Send Failed", false, true);


	// 			sap.m.MessageBox.success(`Request Number ${this.allocationEntity.request_no} has been created`, {
	// 				title: "Success",
	// 				actions: [sap.m.MessageBox.Action.OK],
	// 				onClose: async function () {
	// 					// Await your navigation function
	// 					await this.navTo({ H: true, S: "p_asset_deshboard" });
	// 				}.bind(this)  // Make sure to bind 'this' so that `this.navTo` works correctly
	// 			});

	// 			// MAIL Notification start 

	// 			const designationMaster = await this.transaction.getExecutedQuery('d_o2c_designation_master', {
	// 				company_code: asset_details.company_code,
	// 				name: masterTable[0].role,
	// 				is_active: true,
	// 				loadAll: true
	// 			});
	// 			const empDesignation = await this.transaction.getExecutedQuery('d_o2c_employee_designation', {
	// 				designation: designationMaster[0] ? designationMaster[0].designation_id : "null",
	// 				loadAll: true
	// 			});
	// 			let emp_ids = [];
	// 			for (let i = 0; i < empDesignation.length; i++) {
	// 				emp_ids.push(empDesignation[i].employee_id)
	// 			}

	// 			if (emp_ids.length > 0) {

	// 				await this.tm.getTN("allocation_request_creation").setProperty('type', "allocationRequest");
	// 				await this.tm.getTN("allocation_request_creation").setProperty('employee', emp_ids);
	// 				await this.tm.getTN("allocation_request_creation").setProperty('request_number', this.allocationEntity.request_no);
	// 				await this.tm.getTN("allocation_request_creation").executeP();
	// 			}

	// 			// mail notif end here
	// 		}else{
	// 			sap.m.MessageToast.show("please maintain Flow Master");
	// 		}
	// 	} catch (error) {
	// 		console.error("Flow Master failed:", error);
	// 		sap.m.MessageToast.show("Flow Master failed due to an error");
	// 	}


	// }






	public async flowMaster(level) {
		try {
			// Retrieve asset and allocation details
			const asset_details = await this.tm.getTN("asset_details").getData();
			const allocationDetails = this.tm.getTN("allocation_details_oth").getData();

			// Fetch master data based on provided level
			const main_master_table = await this.transaction.getExecutedQuery('d_asset_purchase_master', {
				company_code: asset_details.company_code,
				request_type: "AL",
				level: level,
				loadAll: true
			});

			if (!main_master_table.length) {
				sap.m.MessageToast.show("Please maintain Flow Master");
				return;
			}

			const masterTable = main_master_table.filter(item => parseInt(item.level) === parseInt(level));
			if (!masterTable.length) {
				sap.m.MessageToast.show("No matching master entry for this level");
				return;
			}

			// Create allocation request
			this.allocationEntity = await this.transaction.createEntityP("d_asset_allocation_request", {
				request_type: "AL",
				asset_class: asset_details.asset_class,
				asset_sub_class: asset_details.asset_sub_class,
				asset_description: asset_details.asset_description,
				asset_no: asset_details.asset_number,
				sub_asset_no: asset_details.sub_asset_number || 0,
				company_code: asset_details.company_code,
				tag_no: asset_details.tag_number || null,
				business_area: asset_details.business_area,
				profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
				is_vm: asset_details.is_vm,
				os: asset_details.os,
				ip_address: asset_details.ip_address,
				server_name: asset_details.server_name,
				assign_to: allocationDetails.assign_to,
				action_status: "Pending",
				project_id: allocationDetails.project_id,
				project_to_bill: allocationDetails.project_to_bill,
				location: allocationDetails.location,
				department: allocationDetails.department,
			});
			// await this.tm.commitP("1st commit", "1st commit Failed", false, true);
			await this.retrySave("1st commit", "1st commit Failed");

			// Get team head info
			const teamHeadData = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {
				company_code: asset_details.company_code,
				profit_center: asset_details.profit_center,
				loadAll: true
			});
			const team_head = teamHeadData[0]?.team_head || null;

			// Create asset action and approval entries
			const baseEntityData = {
				s_object_type: -1,
				request_number: this.allocationEntity.request_no,
				request_type: "AL",
				asset_number: asset_details.asset_number,
				tag_number: asset_details.tag_number,
				sub_asset_number: asset_details.sub_asset_number,
				action_status: "Pending",
				company_code: asset_details.company_code,
				business_area: asset_details.business_area,
				profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
				role_name: masterTable[0].role,
				approval_sequence: 1,
			};

			await this.transaction.createEntityP('d_asset_action_item', {
				...baseEntityData,
				team_head: team_head,
				asset_type: asset_details.asset_type
			});

			await this.transaction.createEntityP('d_asset_approve_status', baseEntityData);

			asset_details.action_status = "Allocating";
			asset_details.department = allocationDetails.department;
			// Handle comment and attachment if present
			if (allocationDetails.asset_comment && (allocationDetails.asset_attachment || allocationDetails.asset_comment)) {
				await this.onAllocation_comment_sent();
			}

			this.allocation_comment_list.forEach(comment => {
				comment.request_number = this.allocationEntity.request_no;
			});

			// await this.tm.commitP("Send For Approval", "Send Failed", false, true);
			await this.retrySave("Send For Approval", "Send Failed");

			// Show success message
			sap.m.MessageBox.success(`Request Number ${this.allocationEntity.request_no} has been created`, {
				title: "Success",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: async () => {
					await this.navTo({ H: true, S: "p_asset_deshboard" });
				}
			});

			// Mail Notification
			const designationMaster = await this.transaction.getExecutedQuery('d_o2c_designation_master', {
				company_code: asset_details.company_code,
				name: masterTable[0].role,
				is_active: true,
				loadAll: true
			});

			const designationId = designationMaster[0]?.designation_id;
			if (!designationId) return;

			const empDesignation = await this.transaction.getExecutedQuery('d_o2c_employee_designation', {
				designation: designationId,
				loadAll: true
			});

			const emp_ids = empDesignation.map(emp => emp.employee_id);
			if (emp_ids.length > 0) {
				const mailTN = this.tm.getTN("allocation_request_creation");
				mailTN.setProperty('type', "allocationRequest");
				mailTN.setProperty('employee', emp_ids);
				mailTN.setProperty('request_number', this.allocationEntity.request_no);
				await mailTN.executeP();
			}

		} catch (error) {
			console.error("Flow Master failed:", error);
			sap.m.MessageToast.show("Flow Master failed due to an error");
		}
	}







	public async approverName(id) {
		let approver = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': id, partialSelect: ['first_name', 'last_name'], loadAll: true })
		if (approver.length > 0 && id) { return approver[0].full_name };
		return "___"
	}
	public async onAllocation_comment_sent() {
		// let listData = await this.tm.getTN("allocation_details").getData();
		this.allocation_comment = await this.tm.getTN("allocation_details_oth").getData();
		// let comment = await this.tm.getTN("allocation_comment").getData();

		if (this.allocation_comment.asset_comment != undefined || this.allocation_comment.asset_comment != "") {

			comment_list = await this.transaction.createEntityP("d_asset_comment", {
				s_object_type: -1,
				request_type: "AL",
				s_created_on: new Date(),
				commeter_name: await this.approverName(this.userid),
				asset_comment: this.allocation_comment.asset_comment,
			});


			if (this.fileup) {
				await comment_list.asset_attachment.setAttachmentP(
					this.fileup,
					this.filenm
				);
			}
			this.allocation_comment_list.push(comment_list);
			this.tm.getTN("allocation_details_oth").setProperty('comment_list', this.allocation_comment_list);

			//   this.allocation_comment = null;
			this.fileup = null;
			this.filenm = null;
			this.tm.getTN("allocation_details_oth").setProperty('asset_comment', null);
			this.tm.getTN("allocation_details_oth").setProperty('asset_attachment', null);
			//   if(this.allocation_comment.asset_attachment)
			//   this.allocation_comment.asset_attachment = "";
			//   if(this.allocation_comment.asset_comment)
			//   this.allocation_comment.asset_comment = "";
		}
	}
	// DOWNLOAD ATTECHMENT 
	public async onDownloadAttach(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		let index = path[path.length - 1];
		// this.tm.getTN("allocation_details_oth/comment_list").setActive(parseInt(path.replace(`/${"allocation_details_oth/comment_list"}/`, '')))
		//await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();
		let docdownload = await this.tm.getTN('allocation_details_oth').getData().comment_list[index]//.getProperty('r_manag_attch');
		await docdownload.asset_attachment.downloadAttachP();
	}

	// on vm save
	public async onVmSave() {
		const asset_details = await this.tm.getTN("asset_details").getData();
		//let allocation_list = await this.tm.getTN("allocation_vm_list").getData();
		let allocation_list = await this.tm.getTN("r_asset_vm_allocation").getData();
		let asset_status = await this.transaction.getExecutedQuery("q_asset_allocation_status", { asset_no: asset_details.asset_number, action_status: ["Pending", "Allocated"], skipMap: true, loadAll: true })

		// if (allocation_list.length == asset_details.vm_quantity) {
		// 	asset_details.status = "Allocated"

		// 	if (asset_status.length) {
		// 		asset_status[0].action_status = "Allocated"
		// 	}

		// }

		asset_details.status = "Allocated"


		if (asset_status.length == 0) {
			const asset_details = await this.tm.getTN("asset_details").getData();
			let allocationDetails = this.tm.getTN("allocation_details_oth").getData();
			this.allocationEntity = await this.transaction.createEntityP("d_asset_allocation_request", {
				// request_no : id_series.a_id,
				request_type: "AL",
				asset_class: asset_details.asset_class,
				asset_sub_class: asset_details.asset_sub_class,
				asset_description: asset_details.asset_description,
				asset_no: asset_details.asset_number,
				sub_asset_no: asset_details.sub_asset_number ? asset_details.sub_asset_number : 0,
				company_code: asset_details.company_code,
				tag_no: asset_details.tag_number ? asset_details.tag_number : null,
				business_area: asset_details.business_area,
				profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
				is_vm: asset_details.is_vm,
				os: asset_details.os,
				ip_address: asset_details.ip_address,
				server_name: asset_details.server_name,
				assign_to: allocationDetails.assign_to,
				action_status: "Allocated",

				//action_status: allocation_list.length == asset_details.vm_quantity ? "Allocated" : "Pending",
				project_id: allocationDetails.project_id,
				project_to_bill: allocationDetails.project_to_bill,
				location: allocationDetails.location,
				department: allocationDetails.department,

			});

			for (let i = 0; i < this.allocationVm.length; i++) {
				this.allocationVm[i].allocation_asset_id = this.allocationEntity.asset_id
			}
			this.allocationVm = [];
		} else {

		}

		// await this.tm.commitP("Save", "Send Failed", false, true);
		await this.retrySave("Save", "Send Failed");
	}

	// need here to change for vm
	public async onAddVmAsset() {

		const asset_details = await this.tm.getTN("asset_details").getData();

		//let allocation_list = await this.tm.getTN("allocation_vm_list").getData();
		let allocation_list = await this.tm.getTN("r_asset_vm_allocation").getData();
		if (allocation_list.length >= asset_details.vm_quantity) {
			sap.m.MessageBox.error(`You have reached to maximum quantity for allocation`, {
				title: "Error",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: null,
			});

		} else {

			this.allocationVm.push(await this.tm.getTN("r_asset_vm_allocation").createEntityP({
				// request_no : id_series.a_id,
				request_type: "AL",
				asset_class: asset_details.asset_class,
				asset_sub_class: asset_details.asset_sub_class,
				asset_description: asset_details.asset_description,
				asset_no: asset_details.asset_number,
				sub_asset_no: asset_details.sub_asset_number ? asset_details.sub_asset_number : 0,
				company_code: asset_details.company_code,
				tag_no: asset_details.tag_number ? asset_details.tag_number : "",
				business_area: asset_details.business_area,
				profit_center: asset_details.profit_center,
				functional_area: asset_details.functional_area,
				is_vm: asset_details.is_vm,
				allocation_date: new Date(),
				// os: asset_details.os,
				// ip_address: asset_details.ip_address,
				// server_name: asset_details.server_name,
				// assign_to : allocationDetails.assign_to,
				// action_status: "Allocated",
				item_status: "Allocated",
				// project_id: allocationDetails.project_id,
				// project_to_bill : allocationDetails.project_to_bill,
				// location : allocationDetails.location,
				// department : allocationDetails.department,
				// s_created_by : this.userid,
				// s_created_on : new Date(),
				allocation_asset_id: allocation_list.length ? allocation_list[0].allocation_asset_id : null
			}));

			this.setMode("CREATE")
		}




	}

	// asset vm deallocate
	public async onDeallocation(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog().setText("Deallocation...");
		oBusyDailog.open();

		const asset_details = await this.tm.getTN("asset_details").getData();

		let asset_status = await this.transaction.getExecutedQuery("q_asset_allocation_status", { asset_no: asset_details.asset_number, action_status: ["Pending", "Allocated"], skipMap: true, loadAll: true })

		//let allocation_list = await this.tm.getTN("allocation_vm_list").getData();

		let allocation_list = await this.tm.getTN("r_asset_vm_allocation").getData();

		// asset_status[0].action_status = "Pending"
		let selectedObject = await this.getActiveControlById(null, 's_vm_allo_details').getSelectedIndices();

		for (let i = 0; i < selectedObject.length; i++) {


			allocation_list[selectedObject[i]].item_status = "Deallocated";
			allocation_list[selectedObject[i]].deallocation_date = new Date();


			if (allocation_list.length == selectedObject.length) {
				asset_details.status = "In Store"
				asset_status[0].action_status = "Deallocated"
			}



		}
		oBusyDailog.setText("Saving...")

		// await this.tm.commitP("Save", "Send Failed", false, true);
		await this.retrySave("Save", "Send Failed");

		let detaildata = await this.tm.getTN('asset_details').getData();
		await detaildata.r_asset_vm_allocation.refreshP();
		await detaildata.r_asset_vm_deallocation.refreshP()
		oBusyDailog.close();

	}
	public async assetResMail() {
		await this.tm.getTN("allocation_request_creation").setProperty('type', "assetMailSch");
		// await this.tm.getTN("allocation_request_creation").setProperty('employee', emp_ids);
		// await this.tm.getTN("allocation_request_creation").setProperty('request_number', this.allocationEntity.request_no);
		await this.tm.getTN("allocation_request_creation").executeP();
	}

	public async assetPiResMail() {
		await this.tm.getTN("allocation_request_creation").setProperty('type', "assetPiResMail");
		// await this.tm.getTN("allocation_request_creation").setProperty('employee', emp_ids);
		// await this.tm.getTN("allocation_request_creation").setProperty('request_number', this.allocationEntity.request_no);
		await this.tm.getTN("allocation_request_creation").executeP();
	}
	public async schedulerTransferMAil() {
		let notif_cc = new Set();
		const today = new Date();
		// let txn: KloTransaction = this.eventContext.getTxn();

		let transfer_entity = await this.transaction.getExecutedQuery("d_o2c_asset_transfer_request", { status: "Approved", approve_status: "Transferring", transfer_sub_type: "TEMP", loadAll: true });

		let allCompanyCode = new Set();
		for (let i = 0; i < transfer_entity.length; i++) {
			allCompanyCode.add(transfer_entity[i].company_code);
		}
		let companyArray = Array.from(allCompanyCode);

		//company wise
		for (let i = 0; i < companyArray.length; i++) {

			const filteredItems = transfer_entity.filter(transfer_entity =>
				new Date(transfer_entity.expected_return_date) < today &&
				transfer_entity.company_code === companyArray[i]
			);

			let desig_mstr_entity = [];
			if (filteredItems.length) {
				desig_mstr_entity = await this.transaction.getExecutedQuery("d_o2c_designation_master", { company_code: filteredItems[0].company_code, name: ["INF_TECH_MGR", "IT"], loadAll: true });
			}
			let designation_ids = [];
			for (let i = 0; i < desig_mstr_entity.length; i++) {
				designation_ids.push(desig_mstr_entity[i].designation_id);
			}

			let emp_desig = []
			if (designation_ids.length > 0) {
				emp_desig = await this.transaction.getExecutedQuery("d_o2c_employee_designation", { designation: designation_ids, loadAll: true });
			}
			let employees = [];
			for (let i = 0; i < emp_desig.length; i++) {
				employees.push(emp_desig[i].employee_id);
			}

			let employee_entity = [];
			if (emp_desig.length > 0) {
				employee_entity = await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: employees, loadAll: true });
			}
			let transferRequest = filteredItems.map(item => item.request_number);
			let assetNumber = filteredItems.map(item => item.asset_number);
			let returnDate = filteredItems.map(item => item.expected_return_date);

			let formattedDates = [];
			if (returnDate.length) {
				formattedDates = returnDate.map(date => {
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
					const day = String(date.getDate()).padStart(2, '0');
					return `${year}-${month}-${day}`;
				});
			}

			for (let i = 0; i < employee_entity.length; i++) {
				this.transaction.addNotification('asset_response_mail_sch', employee_entity[i], {
					first_name: employee_entity[i].first_name,
					transfer_request: transferRequest,
					return_date: formattedDates,
					asset_number: assetNumber
					// first_name: employee_entity[i].first_name,
					// transfer_request: "AS345",
					// return_date: new Date(),
					// asset_number: "7634"

				}, [employee_entity[i].employee_id.toLowerCase()]);

				await this.transaction.commitP();
			}

		}
	}

	public async retrySave(sSuccessMessage: string, sErrMessage: string) {
		// Retry logic for commit operation
		let retryCount = 0;
		const maxRetries = 5;
		let commitSuccess = false;

		while (retryCount < maxRetries && !commitSuccess) {
			try {
				await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
				commitSuccess = true;
			} catch (error) {
				retryCount++;
				console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

				if (retryCount >= maxRetries) {
					sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
					throw error;
				}
				// Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
				await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
			}
		}
	}
}