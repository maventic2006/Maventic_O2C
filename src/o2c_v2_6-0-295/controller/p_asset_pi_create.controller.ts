import { KloEntitySet } from 'kloBo_6-0-25';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_asset_pi_item } from 'o2c_v2/entity_gen/d_asset_pi_item';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_pi_create")
export default class p_asset_pi_create extends KloController {
	public userid;
	public roleid;
	public cmp_ba;
	public async onPageEnter() {
		await this.tm.getTN("pi_selected_detail").setData({})
		this.userid = (await this.transaction.get$User()).login_id;
		//d_o2c_employee_org
		// let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.userid, fdate: new Date().getTime(), tdate: new Date().getTime() });

		// this.cmp_ba = 		let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.userid, fdate: new Date().getTime(), tdate: new Date().getTime() });
//n


	}

	/*public async onPageModelReady() {
		//This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/

	/*public async onPageExit() {
		  //This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/





	public async onSubmit() {

		let oBusyDailog = new sap.m.BusyDialog().setText("Creating Request...");
		oBusyDailog.open();

		// let listData, pi_header;
		// let search_data = await this.tm.getTN("asset_creation_search").getData();
		// let other_data = await this.tm.getTN('pi_selected_detail').getData();

		// const selected = await this.getActiveControlById(null, "s_asset_pi_list").getSelectedIndices();

		// if (selected.length != 0) {
		// 	let xasset = [];
		// 	for (let i = 0; i < selected.length; i++) {

		// 		xasset.push(await this.tm.getTN("asset_creation_list").getData()[selected[i]].asset_number);


		// 	}
		// 	let activeAsset = <KloEntitySet<d_asset_pi_item>>await this.transaction.getExecutedQuery('d_asset_pi_item', { loadAll: true, asset_number: xasset, pi_active: true });

		// 	for (let i = 0; i < activeAsset.length; i++) {
		// 		activeAsset[i].pi_active = false;
		// 	}
		// 	console.log(activeAsset)
		// 	xasset = [];
		// 	pi_header = await this.transaction.createEntityP('d_asset_pi_header', { s_object_type: -1, company_code: search_data.company_code, assign_to_id: other_data.assign_to, pi_date: new Date(other_data.end_date), pi_status: "Pending", business_area: search_data.business_area, total_asset_pi: selected.length });
		// }
		// for (let inital = 0; inital < selected.length; inital++) {
		// 	listData = await this.tm.getTN("asset_creation_list").getData()[selected[inital]]

		// 	await this.transaction.createEntityP('d_asset_pi_item', { s_object_type: -1, pi_doc_number: pi_header.pi_doc_number, company_code: listData.company_code, asset_number: listData.asset_number, sub_asset_number: listData.sub_asset_number, tag_number: listData.tag_number, status: "Pending", allocated_to: pi_header.assign_to_id, business_area: listData.business_area, asset_description: listData.asset_description, asset_class: listData.asset_class, pi_active: true });

		// }

		// await this.tm.commitP("Save Successfully", "Failed", true, true);
		// sap.m.MessageBox.success(
		// 	`PI Request Number ${pi_header.pi_doc_number} has been successfully Created.`,
		// 	{
		// 		title: "Success",
		// 		actions: [sap.m.MessageBox.Action.OK],
		// 		onClose: null,
		// 	}
		// );



		//OPTIMIZED CODE

		let listData, pi_header;
		const search_data = await this.tm.getTN("asset_creation_search").getData();
		const other_data = await this.tm.getTN('pi_selected_detail').getData();
		const selected = await this.getActiveControlById(null, "s_asset_pi_list").getSelectedIndices();

		if (selected.length > 0) {
			// Fetch asset numbers in parallel
			const assetData = await Promise.all(selected.map(async index => {
				const data = await this.tm.getTN("asset_creation_list").getData()[index];
				return data.asset_number;
			}));

			// Fetch active assets
			let activeAsset = <KloEntitySet<d_asset_pi_item>>await this.transaction.getExecutedQuery('d_asset_pi_item', { loadAll: true, asset_number: assetData, pi_active: true });

			// Set pi_active to false for all active assets
			activeAsset.forEach(asset => { asset.pi_active = false; });
			

			// Create PI header
			pi_header = await this.transaction.createEntityP('d_asset_pi_header', {
				s_object_type: -1,
				company_code: search_data.company_code,
				assign_to_id: other_data.assign_to,
				assign_to_name:await this.approverName(other_data.assign_to),
				pi_date: new Date(other_data.end_date),
				pi_status: "Pending",
				business_area: search_data.business_area,
				total_asset_pi: selected.length
			});

			// Prepare promises for PI items
			const createItemPromises = selected.map(async index => {
				listData = await this.tm.getTN("asset_creation_list").getData()[index];

				return this.transaction.createEntityP('d_asset_pi_item', {
					s_object_type: -1,
					pi_doc_number: pi_header.pi_doc_number,
					company_code: listData.company_code,
					asset_number: listData.asset_number,
					sub_asset_number: listData.sub_asset_number,
					tag_number: listData.tag_number,
					status: "Pending",
					allocated_to: pi_header.assign_to_id,
					business_area: listData.business_area,
					asset_description: listData.asset_description,
					asset_class: listData.asset_class,
					pi_active: true
				});
			});

			// Await all item creation promises
			await Promise.all(createItemPromises);

			// Commit transaction
			await this.tm.commitP("Save Successfully", "Failed", true, true);

			// mail notification
			this.onMailSend(pi_header.assign_to_id, pi_header.pi_doc_number, pi_header.pi_date)

			// Show success message
			sap.m.MessageBox.success(
				`PI Request Number ${pi_header.pi_doc_number} has been successfully created.`,
				{
					title: "Success",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: null,
				}
			);
		}


		const assetCreationList = this.tm.getTN('asset_creation_list');
		await assetCreationList.resetP(true);
		await assetCreationList.refresh();

		oBusyDailog.close()
		


	}

	public async onMailSend(verifier, pi_numbers, verification_dates){
		await this.tm.getTN("pi_mail_notification").setProperty('employee', verifier);
		await this.tm.getTN("pi_mail_notification").setProperty('pi_numbers', pi_numbers);
		await this.tm.getTN("pi_mail_notification").setProperty('verification_dates', verification_dates);
		await this.tm.getTN("pi_mail_notification").executeP();
		// pi_doc_number
		// pi_date
		

	}
	// find approver name 
	public async approverName(id) {
		let approver = <KloEntitySet<d_o2c_employee>>(await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: id, partialSelect: ["first_name", "last_name"], loadAll: true }));
		if (approver.length > 0 && id) {
		  return approver[0].full_name;
		}
		return "___";
	  }

}