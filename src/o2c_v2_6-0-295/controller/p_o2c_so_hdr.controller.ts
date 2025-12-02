import { KloController } from 'kloTouch/jspublic/KloController';
import { UserInfo } from "kloBo/Adm/UserInfo";
import { d_o2c_so_attachment } from 'o2c_v2/entity_gen/d_o2c_so_attachment';
import { d_o2c_so_hdr } from 'o2c_v2/entity_gen/d_o2c_so_hdr';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { d_o2c_so_status_itm } from 'o2c_v2/entity_gen/d_o2c_so_status_itm';
import { d_o2c_so_status_hrd } from 'o2c_v2/entity_gen/d_o2c_so_status_hrd';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_employee_designation } from 'o2c_v2/entity_gen/d_o2c_employee_designation';
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';
import { d_o2c_so_condition_type } from 'o2c_v2/entity_gen/d_o2c_so_condition_type';
import { d_o2c_profit_centre } from 'o2c_v2/entity_gen/d_o2c_profit_centre';
import { d_o2c_business_area } from 'o2c_v2/entity_gen/d_o2c_business_area';
import { d_o2c_company_info } from 'o2c_v2/entity/d_o2c_company_info';
import { d_o2c_so_comment } from 'o2c_v2/entity_gen/d_o2c_so_comment';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_so_hdr")
export default class p_o2c_so_hdr extends KloController {
	public fileup; // variable for taking file data
	public filenm; // variable for taking file name
	public company;
	public comment_create;
	public flag = 0;
	public save_flag;
	public login_id;
	public roleid;
	public org = [];
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public async onAfterSubScreenRender() {
		await this.tm.getTN("o2c_so_hdr_detail").setActive();
	}
	public async onPageEnter() {
		this.roleid = (await this.transaction.get$Role()).role_id;
		this.login_id = (await this.transaction.get$User()).login_id;
		this.tm.getTN("other_comment").setData({});
		this.tm.getTN("so_user_role_store").setData({});
		this.tm.getTN("so_login_id_store").setData({});
		this.tm.getTN("comm_tab").setData({ click: "" });
		let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.login_id, fdate: new Date().getTime(), tdate: new Date().getTime() });
		if (emp_designation.length > 0) {
			let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { loadAll: true, 'designation_id': emp_designation[0].designation });
			let name = emp_designation_name[0].name.toUpperCase();
			this.roleid = name;
		}
		// this.tm.getTN("other_comment").getData().user_name = this.get_name();
		let id_login = '';
		id_login = this.login_id;
		this.tm.getTN("so_user_role_store").setProperty('roler', this.roleid);
		this.tm.getTN("other_comment").setProperty('user_name', this.get_name());
		this.tm.getTN("so_login_id_store").setProperty('user_id', id_login.toLowerCase());
	}
	public async onAfterTransactionEnter() {
		this.toUpdateList();
		await this.tm.getTN('so_other').setData({ "employee_id": "userid" });
	}
	public onExit() {
	}
	public async onSaving() {
		await this.tm.commitP("Save Successfully", "Save Failed", true, true);
	}
	public async onSave() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		if (entity.type == "NBS") {
			entity.gross_value = 0;
			try {
				await this.tm.commitP("Save Successfully", "Save Failed", true, true);


			}
			catch
			{
				if (this.comment_create != null) {
					await this.tm.getTN("comment_list").getData()[0].deleteP();
					this.comment_create = null;
				}
			}

		}
		else {
			if (this.onFuncPercentage() && this.onProfitPercentage()) {
				if (this.onProjectValue()) {
					if (this.onCustomerContactList()) {
						await this.tm.commitP("Save Successfully", "Save Failed", true, true);
					}
					else {
						sap.m.MessageBox.error("At least one item on the list for billing responsibility in the customer's contact details must be set to Yes", {
							title: "Error",
						});
					}

				}
				else {
					sap.m.MessageBox.error("SO net value should be same as Items net value", {
						title: "Error",
					});
				}

			}
			else {
				sap.m.MessageBox.error("Percenatge can not less than 100%", {
					title: "Error",
				});
			}
		}

	}
	//Sends
	// public async onSend() {
	// 	let entity = this.tm.getTN("comment_details").getData();
	// 	entity.file_name = entity.attachment.name;
	// 	await this.current_time();
	// 	await this.get_name();
	// 	await this.getDate();
	// 	await this.onAddingGrossValue();
	// 	await this.onSave();
	// }
	public onEdit() {
		this.setMode("EDIT");
	}
	public async onCreate() {
		let busyDialog = new sap.m.BusyDialog();
		busyDialog.open();
		await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_header_details" }))
		await this.tm.getTN("o2c_so_hdr_list").createEntityP({ s_object_type: -1, s_status: "New", gross_value: 0 }, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("so_attachment_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("profit_center_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("functional_area_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
		await this.tm.getTN("contact_details_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
		// await this.tm.getTN("o2c_so_hdr_detail").getData().r_so_attachment.newEntityP();
		// this.tm.getTN("so_attachment_list").setData(this.tm.getTN("o2c_so_hdr_detail").getData().r_so_attachment);
		// await this.tm.getTN("o2c_so_hdr_detail").getData().r_profit_center.newEntityP();
		// this.tm.getTN("profit_center_list").setData(this.tm.getTN("o2c_so_hdr_detail").getData().r_profit_center);
		// await this.tm.getTN("o2c_so_hdr_detail").getData().r_functional_area.newEntityP();
		// this.tm.getTN("functional_area_list").setData(this.tm.getTN("o2c_so_hdr_detail").getData().r_functional_area);
		// await this.tm.getTN("o2c_so_hdr_detail").getData().r_contact_details.newEntityP();
		// this.tm.getTN("contact_details_list").setData(this.tm.getTN("o2c_so_hdr_detail").getData().r_contact_details);
		// await this.tm.getTN("o2c_so_hdr_detail").getData().r_comment.newEntityP();
		// this.tm.getTN("comment_list").setData(this.tm.getTN("o2c_so_hdr_detail").getData().r_comment);

		// await this.tm.getTN('so_other').setData(true);
		busyDialog.close();
		// await this.so_creator_name();
		await this.tm.getTN('proj_lead_list').resetP(true);
		await this.tm.getTN('team_head_list').resetP(true);
		await this.tm.getTN('team_list_new').resetP(true);

	}
	public onAttachmentCreate() {
		this.tm.getTN("attachment_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "Last", true, true);
	}
	public async onNav(oEvent: sap.ui.base.Event) {
		await this.navTo(({ SS: 's_o2c_so_hdr_detail' }), oEvent);
	}
	// public async current_time() {

	// 	let time = this.tm.getTN('comment_details').getData();
	// 	time.curr_time = new Date().toLocaleTimeString();
	// }
	// public async getDate() {

	// 	let date = this.tm.getTN('comment_details').getData();
	// 	date.mime_type = new Date().toLocaleDateString();
	// }

	// public get_name() {
	// 	let full_name = this.tm.getTN('comment_details').getData();
	// 	let last_name = UserInfo.getActiveUser().r_last_name
	// 	if (last_name == null) {
	// 		full_name.user_name = UserInfo.getActiveUser().r_first_name
	// 	}
	// 	else
	// 		full_name.user_name = UserInfo.getActiveUser().r_first_name + UserInfo.getActiveUser().r_last_name;
	// }
	public async upload_attachment(oEvent) {
		await this.onAttachmentCreate();
		let entity = this.tm.getTN('comment_details').getData();
		await entity.attachment.uploadFile(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
	}
	// public async onCreateComment() {
	// 	await this.tm.getTN('so_other').setData(true);
	// 	await this.tm.getTN("o2c_so_hdr_detail/r_comment").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);

	// 	// this.current_time();
	// 	// this.get_name();
	// 	// this.getDate();

	// }
	public async on_func_amount(oEvent: sap.ui.base.Event) {
		let num_1;
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/functional_area_list/", ''))
		let func_data = this.tm.getTN('functional_area_list').getData();
		let list_length = this.tm.getTN('functional_area_list').getData().length;
		let header_data = this.tm.getTN('o2c_so_hdr_detail').getData();
		this.onFuncAmountTotal();
		this.onFuncPercentageTotal();
		if (list_length >= 0 && func_data[index].amount > header_data.net_value) {
			sap.m.MessageBox.error("Amount can not be more than Net Value", {
				title: "Error",
			});
			func_data[index].percentage = 0;
			func_data[index].amount = 0;
		}
		else if (list_length == 1 && func_data[index].amount < parseFloat(header_data.net_value)) {
			num_1 = (((parseFloat(header_data.net_value) - func_data[index].amount) / parseFloat(header_data.net_value)) * 100).toFixed(2);
			func_data[index].percentage = (100 - num_1).toFixed(2);
		}
		else if (list_length > 1 && func_data[index].amount < parseFloat(header_data.net_value)) {
			let x = 0;
			for (let i = 0; i < list_length; i++) {
				x += parseFloat(func_data[i].amount);
			}
			if (x > parseFloat(header_data.net_value)) {
				sap.m.MessageBox.error("Amount can not be more than Gross Value", {
					title: "Error",
				});
				func_data[index].percentage = 0;
				func_data[index].amount = 0;
			}
			else {
				num_1 = func_data[index].percentage = (((parseFloat(header_data.net_value) - func_data[index].amount) / parseFloat(header_data.net_value)) * 100).toFixed(2);
				func_data[index].percentage = (100 - num_1).toFixed(2);
			}
		}
	}
	public async on_profit_amount(oEvent: sap.ui.base.Event) {
		let num_2;
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/profit_center_list/", ''))
		let profit_data = this.tm.getTN('profit_center_list').getData();
		let list_length = this.tm.getTN('profit_center_list').getData().length;
		let header_data = this.tm.getTN('o2c_so_hdr_detail').getData();
		this.onProfitAmountTotal();
		this.onProfitPercentageTotal();
		if (list_length >= 0 && profit_data[index].amount > header_data.net_value) {
			sap.m.MessageBox.error("Amount can not be more than Net Value", {
				title: "Error",
			});
			profit_data[index].percentage = 0;
			profit_data[index].amount = 0;
		}
		else if (list_length == 1 && profit_data[index].amount < parseFloat(header_data.net_value)) {
			num_2 = (((parseFloat(header_data.net_value) - profit_data[index].amount) / parseFloat(header_data.net_value)) * 100).toFixed(2);
			profit_data[index].percentage = (100 - num_2).toFixed(2);
		}
		else if (list_length > 1 && profit_data[index].amount < parseFloat(header_data.net_value)) {
			let x = 0;
			for (let i = 0; i < list_length; i++) {
				x += parseFloat(profit_data[i].amount);
			}
			if (x > parseFloat(header_data.net_value)) {
				sap.m.MessageBox.error("Amount can not be more than Gross Value", {
					title: "Error",
				});
				profit_data[index].percentage = 0;
				profit_data[index].amount = 0;
			}
			else {
				num_2 = (((parseFloat(header_data.net_value) - profit_data[index].amount) / parseFloat(header_data.net_value)) * 100).toFixed(2);
				profit_data[index].percentage = (100 - num_2).toFixed(2);
			}
		}
	}
	public async on_func_percentage(oEvent: sap.ui.base.Event) {

		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/functional_area_list/", ''))
		let func_data = this.tm.getTN('functional_area_list').getData();
		let list_length = this.tm.getTN('functional_area_list').getData().length;
		let header_data = this.tm.getTN('o2c_so_hdr_detail').getData();
		this.onFuncPercentageTotal();
		this.onFuncAmountTotal();
		if (list_length >= 0 && func_data[index].percentage > 100) {
			sap.m.MessageBox.error("Percentage can not be more than 100%", {
				title: "Error",
			});
			func_data[index].amount = 0;
			func_data[index].percentage = 0;
		}
		else if (list_length == 1 && func_data[index].percentage <= 100) {
			func_data[index].amount = ((header_data.net_value / 100) * func_data[index].percentage).toFixed(2);
		}
		else if (list_length > 1 && func_data[index].percentage < 100) {
			let x = 0;
			for (let i = 0; i < list_length; i++) {
				x += parseFloat(func_data[i].percentage);
			}
			if (x > 100) {
				sap.m.MessageBox.error("Percentage can not be more than 100%", {
					title: "Error",
				});
				func_data[index].amount = 0;
				func_data[index].percentage = 0;
			}
			else {
				func_data[index].amount = ((header_data.net_value / 100) * func_data[index].percentage).toFixed(2);
			}
		}
	}
	public async on_profit_percentage(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/profit_center_list/", ''))
		let profit_data = this.tm.getTN('profit_center_list').getData();
		let list_length = this.tm.getTN('profit_center_list').getData().length;
		let header_data = this.tm.getTN('o2c_so_hdr_detail').getData();
		this.onProfitPercentageTotal();
		this.onProfitAmountTotal();
		if (list_length >= 0 && profit_data[index].percentage > 100) {
			sap.m.MessageBox.error("Percentage can not be more than 100%", {
				title: "Error",
			});
			profit_data[index].amount = 0;
			profit_data[index].percentage = 0;
		}
		else if (list_length == 1 && profit_data[index].percentage <= 100) {
			profit_data[index].amount = ((header_data.net_value / 100) * profit_data[index].percentage).toFixed(2);
		}
		else if (list_length > 1 && profit_data[index].percentage < 100) {
			let x = 0;
			for (let i = 0; i < list_length; i++) {
				x += parseFloat(profit_data[i].percentage);
			}
			if (x > 100) {
				sap.m.MessageBox.error("Percentage can not be more than 100%", {
					title: "Error",
				});
				profit_data[index].amount = 0;
				profit_data[index].percentage = 0;
			}
			else {
				profit_data[index].amount = ((header_data.net_value / 100) * profit_data[index].percentage).toFixed(2);
			}
		}
	}//Display Mode
	public async onDisplay(oEvent: sap.ui.base.Event) {
		this.setMode("DISPLAY");
		await this.navTo(({ SS: 's_o2c_so_hdr_detail' }), oEvent);
		// await this.so_creator_name();
	}
	public async onOfficeCalender() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let q = <KloEntitySet<d_o2c_business_area>>await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': entity.business_area })
		if (q.length) {
			entity.office_calendar = q[0].office_calender;
		}
	}
	public async onCurrency() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let q = <KloEntitySet<d_o2c_company_info>>await this.transaction.getExecutedQuery('d_o2c_company_info', { loadAll: true, 'company_code': entity.company })
		if (q.length) {
			entity.currency = q[0].currency;
		}
	}
	public async onChangeAttachment() {
		let entity_1 = this.tm.getTN('o2c_so_hdr_detail').getData();
		let entity_2 = this.tm.getTN('so_attachment_list').getData()
		if (entity_1.type === "PS") {
			entity_2[0].attachment_type = "APM"
		}
		if (entity_1.type === "SO") {
			entity_2[0].attachment_type = "POA"
		}

	}
	//icon editss
	public async onEdit_icon(oEvent: sap.ui.base.Event) {
		this.setMode("EDIT");
		await this.navTo(({ SS: 's_o2c_so_hdr_detail' }), oEvent);
	}
	////
	public async onItemValue(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let entity = this.tm.getTN('item_detail_list').getData();
		let index = parseInt(path.replace("/item_detail_list/", ''));
		await this.tm.getTN('item_detail_list').setActive(index);
		let entity_2 = await this.tm.getTN('condition_new_list').getData();
		let length = await this.tm.getTN('condition_new_list').getData().length;
		let length_2 = await this.tm.getTN('item_detail_list').getData().length;
		entity[index].item_value = entity[index].item_pd_or_qty * entity[index].rate;
		let entity_1 = this.tm.getTN("o2c_so_hdr_detail").getData();
		let total = 0;
		for (let i = 0; i < length_2; i++) {
			total += parseFloat(entity[i].item_value);
		}
		if (entity_1.net_value < total) {
			sap.m.MessageBox.error("Items net value can not be greater than SO net value", {
				title: "Error",
			});
			entity[0].item_value = 0;
			entity[0].item_pd_or_qty = 0;
			entity[0].rate = 0;
			await this.tm.getTN("item_detail_list").refresh();
		}
		else {
			let net_value = entity[index].item_value;
			if (length == 1) {
				entity_2[0].amount = entity[index].item_value;

			}
			else {
				entity_2[0].amount = entity[index].item_value;
				for (let i = 1; i < length; i++) {
					if (entity_2[i].cal_type == "MINUS") {
						net_value -= parseFloat(entity_2[i].amount);
					}
					else if (entity_2[i].cal_type != "MINUS" && entity_2[i].type == "FIX") {
						net_value += parseFloat(entity_2[i].amount);
					}
					else if (entity_2[i].cal_type != "MINUS" && entity_2[i].type == "PER") {
						entity_2[i].amount = ((entity[index].item_value / 100) * entity_2[i].percentage).toFixed(3);
						net_value += parseFloat(entity_2[i].amount);
					}
				}
			}
			entity[index].gross_item_value = net_value;
			await this.onItemNetValueTotal();
			await this.onItemGrossValueTotal();
			await this.tm.getTN("item_detail_list").refresh();
			await this.tm.getTN("condition_new_list").refresh()
			//comment
		}
	}
	public async onSelectItem(oEvent: sap.ui.base.Event) {
		let path = oEvent;
		console.log(path);
		let entity_1 = this.tm.getTN('item_detail_details').getData();
		let entity_2 = this.tm.getTN('item_detail_list').getData();
		let total_row = this.tm.getTN('item_detail_list').getData().length;
		let index;
		for (let i = 0; i < total_row; i++) {
			if (entity_1.select_item === entity_2[i].line) {
				index = (entity_2[i].line / 10) - 1;
			}
		}
		this.tm.getTN('item_detail_list').setActive(index);
	}
	public async onTeamLead() {

		let entity = this.tm.getTN("profit_center_list").getData();
		let length = this.tm.getTN("profit_center_list").getData().length;
		for (let i = 1; i < length; i++) {
			if (entity[0].profit_center == entity[i].profit_center) {
				sap.m.MessageBox.error("We can not use same Profit Center again", {
					title: "Error",
				});
				entity[0].profit_center = undefined
			}
		}
		let q = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery('d_o2c_profit_centre', { loadAll: true, 'team_head': entity.team_head })
		for (let j = 0; j < entity.length; j++) {
			for (let i = 0; i < q.length; i++) {
				if (entity[0].profit_center == q[i].profit_center) {
					entity[0].team_head = q[i].team_head;
					continue;
				}
			}
		}





	}
	public async onGetData(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/item_detail_list/", ''));
		this.tm.getTN('item_detail_list').setActive(index);
	}
	public async onConditionChange(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/condition_new_list/", ''));
		this.tm.getTN('condition_new_list').setActive(index);
		let entity = await this.tm.getTN('condition_new_list').getData();
		let q = <KloEntitySet<d_o2c_so_condition_type>>await this.transaction.getExecutedQuery('d_o2c_so_condition_type', { loadAll: true, 'condition_type': entity[index].condition_type })
		entity[index].cal_type = q[0].cal_type
		entity[index].type = q[0].type
	}
	public async onGrossValue(oEvent: sap.ui.base.Event) {

		let path = this.getPathFromEvent(oEvent);
		// let index_1 = parseInt(path.replace("/condition_new_list/", ''));
		let index_2 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_1 = await this.tm.getTN('condition_new_list').getData();
		let entity_2 = await this.tm.getTN('item_detail_list').getData();
		let length = await this.tm.getTN('condition_new_list').getData().length;
		let new_net_value = 0;
		for (let i = 1; i < length; i++) {
			if (entity_1[i].cal_type == "MINUS" && new_net_value > 0) {
				new_net_value = new_net_value - parseFloat(entity_1[i].amount)
			}

			if (entity_1[i].cal_type == "MINUS" && new_net_value == 0) {
				new_net_value = parseFloat(entity_2[index_2].item_value) - parseFloat(entity_1[i].amount)
			}
			if (entity_1[i].cal_type != "MINUS" && new_net_value > 0) {
				new_net_value = new_net_value + parseFloat(entity_1[i].amount);
			}

			if (entity_1[i].cal_type != "MINUS" && new_net_value == 0) {
				new_net_value = parseFloat(entity_2[index_2].item_value) + parseFloat(entity_1[i].amount)
			}
		}
		entity_2[index_2].gross_item_value = new_net_value;
		this.onItemGrossValueTotal();



	}
	public async onDownloadAttachment(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/so_attachment_list/", ''));
		let document: d_o2c_so_attachment = this.tm.getTN("so_attachment_list").getData()[index];
		document.attach_copy.downloadAttachP();
	}
	public async onDownloadPersonalAttach(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/so_attachment_list/", ''));
		let document: d_o2c_so_attachment = this.tm.getTN("so_attachment_list").getData()[index];
		document.personal_copy.downloadAttachP();
	}
	public async bill_to_customer() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let contact_entity = this.tm.getTN('contact_details_list').getData();
		entity.ship_to_customer = entity.bill_to_customer;
		await this.onDuplicateSO();
	}

	public async onConditionPercentage(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index_1 = parseInt(path.replace("/condition_new_list/", ''));
		let index_2 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_1 = await this.tm.getTN('condition_new_list').getData();
		let entity_2 = await this.tm.getTN('item_detail_list').getData();
		let length = await this.tm.getTN('condition_new_list').getData().length;
		entity_1[index_1].amount = ((entity_2[index_2].item_value / 100) * entity_1[index_1].percentage).toFixed(3);
		let new_net_value = 0;
		for (let i = 1; i < length; i++) {
			if (entity_1[i].cal_type == "MINUS" && new_net_value > 0) {
				new_net_value = new_net_value - parseFloat(entity_1[i].amount)
			}

			if (entity_1[i].cal_type == "MINUS" && new_net_value == 0) {
				new_net_value = parseFloat(entity_2[index_2].item_value) - parseFloat(entity_1[i].amount)
			}
			if (entity_1[i].cal_type != "MINUS" && new_net_value > 0) {
				new_net_value = new_net_value + parseFloat(entity_1[i].amount);
			}

			if (entity_1[i].cal_type != "MINUS" && new_net_value == 0) {
				new_net_value = parseFloat(entity_2[index_2].item_value) + parseFloat(entity_1[i].amount)
			}
		}
		entity_2[index_2].gross_item_value = new_net_value;
		this.onItemGrossValueTotal();

	}
	public async onAddingAttachment() {
		await this.tm.getTN("o2c_so_hdr_detail/r_so_attachment").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onAddingProfitCenter() {
		await this.tm.getTN("o2c_so_hdr_detail/r_profit_center").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onAddingFunctionalArea() {
		await this.tm.getTN("o2c_so_hdr_detail/r_functional_area").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onAddingContactDetails() {
		await this.tm.getTN("o2c_so_hdr_detail/r_contact_details").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async onAddingSchedule() {
		await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}

	public async onAddingItemDetail() {
		let entity_1 = this.tm.getTN("o2c_so_hdr_detail").getData();
		let entity_2 = this.tm.getTN("item_detail_list").getData();
		let index = this.tm.getTN("item_detail_list").getActiveIndex();
		let length = this.tm.getTN("item_detail_list").getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity_2[i].item_value);
		}
		if (entity_1.net_value > total) {
			await this.tm.getTN("o2c_so_hdr_detail/r_item_details").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
			entity_2[index].start_date = entity_1.project_start_date;
			entity_2[index].end_date = entity_1.project_end_date;
			entity_2[index].po = entity_1.customer_po_number;
			await this.navTo(({ S: "p_o2c_so_hdr", SS: "s_o2c_condition" }));
		}
		else {
			sap.m.MessageBox.error("Items net value can not be greater than SO net value", {
				title: "Error",
			});
		}

	}
	public async onSettingSO(oEvent: sap.ui.base.Event) {
		let user = (await this.transaction.get$User()).login_id;
		let entity = this.tm.getTN("o2c_so_hdr_detail").getData();

		if (entity.s_created_by == user) {
			sap.m.MessageBox.confirm("Are you sure to send SO for approval", {
				title: "Confirm",
				actions: [sap.m.MessageBox.Action.YES,
				sap.m.MessageBox.Action.NO],
				onClose: async (oAction) => {
					if (oAction == "YES") {
						let entity_1 = this.tm.getTN("o2c_so_hdr_detail").getData();
						let entity_2 = this.tm.getTN('profit_center_list').getData();
						let x = this.tm.getTN("o2c_so_hdr_detail").getData();
						let so = x.so;
						for (let i = 0; i < entity_2.length; i++) {
							entity_2[i].so = entity_1.so;
						}
						await this.setEntity1();
						await this.toUpdateList()
						if (this.flag == 1) {
							sap.m.MessageToast.show(so + " SO has been send for approval", {
								duration: 3000,
								width: "20em",
							})
						}
						await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_o2c_so_hdr_search" }));
						await this.tm.getTN("query_status").executeP()
					}
					if (oAction == "NO") {
						await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_communication" }))

					}

				}
			})
		}
		else {
			sap.m.MessageBox.error("Regrettably, this SO may only be submitted for approval by its creator.", {
				title: "Error",
			});
		}
	}
	public async toUpdateList() {
		let list = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('q_s_status', { loadAll: true, s_status: 'New' });
		await this.tm.getTN("o2c_so_hdr_list").setData(list);
		await this.tm.getTN("o2c_so_hdr_list").refresh();
	}
	public async empidFunction(name) {
		let entity = await this.tm.getTN('o2c_so_hdr_detail').getData();
		let desig;
		//checking by removing the query inside loopss
		let desig_master = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { loadAll: true, 'company_code': entity.company, 'name': name })
		if (desig_master.length) {
			//desig = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('d_o2c_employee_designation', { loadAll: true,'designation': desig_master[0].designation_id })
			desig = await this.transaction.getExecutedQuery('q_so_desig_fch', { loadAll: true, designation: desig_master[0].designation_id, from_date: new Date(), to_date: new Date() });
			console.log(desig);
		}
		let Array = [];
		for (let i = 0; i < desig.length; i++) {
			Array[i] = desig[i].employee_id;
		}
		if (Array.length)
			this.org = await this.transaction.getExecutedQuery('q_empid_acc_design', { loadAll: true, employee_id: Array, business_area: entity.business_area, company_code: entity.company, active_till: new Date(), active_from: new Date() });

	}

	public async setEntity1() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let date = new Date()
		//let x = date.toLocaleDateString()
		let req_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		//let req_date = new Date(x)
		let time = date.getTime()
		let req_time = new Date(time);
		let curr_date = new Date()
		let uniqueTeamHeads = new Set();

		// According to the types
		if (entity.type == "SO") {

			let data = await this.transaction.createEntityP('d_o2c_so_status_hrd', { s_object_type: -1, so: entity.so, rfq_type: entity.type, requestor: entity.s_created_by, request_date: req_date, request_time: req_time, status: "Pending with FI" }, true);

			//await o2c_so_status_hrd_entity.newEntityP(0, { s_object_type: -1, so: entity.so, rfq_type: entity.type, requestor: entity.s_created_by, request_date: req_date, request_time: req_time, status: "Pending" }, true)
			let id = data.req_no;
			//According to team Heads
			let entity_profit = this.tm.getTN('profit_center_list').getData();
			for (let i = 0; i < entity_profit.length; i++) {
				if (!uniqueTeamHeads.has(entity_profit[i].team_head.toUpperCase())) {
					uniqueTeamHeads.add(entity_profit[i].team_head.toUpperCase());

					if ((entity_profit[i].team_head).toUpperCase() != (entity.s_created_by).toUpperCase()) {
						let data1 = await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: "Team", approved_by: entity_profit[i].team_head, request_date: req_date, request_time: req_time, status: "Pending", so: entity.so }, true)
						data.status = "Pending";

					}
					else {
						let data1 = await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: "Team", approved_by: entity_profit[i].team_head, request_date: req_date, request_time: req_time, status: "Approved", so: entity.so }, true)
					}
				}
			}
			//call
			let name = "FINANCE";
			await this.empidFunction(name);
			if (this.org.length == 0) {

				console.log("Not")
				sap.m.MessageToast.show("In this business area there is no Finance assigned yet", {
					duration: 3000,
					width: "20em",
				})
			}
			else {

				for (let i = 0; i < this.org.length; i++) {

					await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: name, approved_by: this.org[i].employee_id, request_date: req_date, request_time: req_time, status: "Pending", so: entity.so }, true)
				}
				this.flag = 1;
				await this.send_so();
			}




		}


		else if (entity.type == "NBS") {

			let name = "FINANCE";
			await this.empidFunction(name);
			if (this.org.length == 0) {

				console.log("Not")
				sap.m.MessageToast.show("In this business area there is no Finance assigned yet", {
					duration: 3000,
					width: "20em",
				})
			}
			else {
				let data = await this.transaction.createEntityP('d_o2c_so_status_hrd', { s_object_type: -1, so: entity.so, rfq_type: entity.type, requestor: entity.s_created_by, request_date: req_date, request_time: req_time, status: "Pending with FI" }, true)
				let id = data.req_no;
				for (let i = 0; i < this.org.length; i++) {
					await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: name, approved_by: this.org[i].employee_id, request_date: req_date, request_time: req_time, status: "Pending", so: entity.so }, true)

				}
				await this.send_so();
				this.flag = 1;

			}





		}
		else if (entity.type == "ISP") {

			let name = "MD";
			await this.empidFunction(name);
			if (this.org.length == 0) {

				console.log("Not")
				sap.m.MessageToast.show("In this business area there is no MD assigned yet", {
					duration: 3000,
					width: "20em",
				})
			}
			else {
				let data = await this.transaction.createEntityP('d_o2c_so_status_hrd', { s_object_type: -1, so: entity.so, rfq_type: entity.type, requestor: entity.s_created_by, request_date: req_date, request_time: req_time, status: "Pending with MD" }, true)
				let id = data.req_no;
				for (let i = 0; i < this.org.length; i++) {
					await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: name, approved_by: this.org[i].employee_id, request_date: req_date, request_time: req_time, status: "Pending", so: entity.so }, true)
				}

				await this.send_so();
				this.flag = 1;
			}
		}


		else {
			let team_head = 0;
			let data = await this.transaction.createEntityP('d_o2c_so_status_hrd', { s_object_type: -1, so: entity.so, rfq_type: entity.type, requestor: entity.s_created_by, request_date: req_date, request_time: req_time, status: "Approved" }, true)
			let id = data.req_no;
			//According to team Heads
			let entity_profit = this.tm.getTN('profit_center_list').getData();
			for (let i = 0; i < entity_profit.length; i++) {
				if (!uniqueTeamHeads.has(entity_profit[i].team_head.toUpperCase())) {
					uniqueTeamHeads.add(entity_profit[i].team_head.toUpperCase());
					if ((entity_profit[i].team_head).toUpperCase() != entity.s_created_by.toUpperCase()) {
						await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: "Team", approved_by: entity_profit[i].team_head, request_date: req_date, request_time: req_time, status: "Pending", so: entity.so }, true)
						data.status = "Pending";
						team_head++;
					}
					else {
						await this.transaction.createEntityP('d_o2c_so_status_itm', { s_object_type: -1, req_no: id, so_role: "Team", approved_by: entity_profit[i].team_head, request_date: req_date, request_time: req_time, status: "Approved", so: entity.so }, true)
					}
				}
			}
			if (team_head == 0) {
				let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
				entity.s_status = "Approved";
				await this.tm.commitP("SO Approved", "Save Failed", true, true);
				sap.m.MessageToast.show(entity.so + " SO has been send for approval", {
					duration: 3000,
					width: "20em",
				})
			}
			else {

				await this.send_so();
				this.flag = 1;
			}

		}
	}
	public async send_so() {

		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let entity_profit = this.tm.getTN('profit_center_list').getData();
		entity.profit_length = entity_profit.length;
		entity.s_status = "Pending";
		await this.tm.commitP("SO send for approval", "Save Failed", true, true);
	}
	public async onDownloadCommunicationAttachment(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/comment_list/", ''));
		let document: d_o2c_so_comment = this.tm.getTN("comment_list").getData()[index];
		document.attachment.downloadAttachP();
	}
	public async onItemCategory() {
		let entity = await this.tm.getTN('condition_new_list').getData();
		if (entity.length == 0) {
			await this.tm.getTN("condition_new_list").createEntityP({ s_object_type: -1, cal_type: "ADD" }, "Created Successfully", "Created Failed", null, "Last", true, true);
		}
		let index_2 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_1 = await this.tm.getTN('condition_new_list').getData();
		let entity_2 = await this.tm.getTN('item_detail_list').getData();

		if (entity_2[index_2].item_category == "Project") {
			entity_1[0].condition_type = 'Fees'
		}
		if (entity_2[index_2].item_category == "Licence") {
			entity_1[0].condition_type = 'TL'
		}
		if (entity_2[index_2].item_category == "Expense") {
			entity_1[0].condition_type = 'EX'
		}
		if (entity_2[index_2].item_category == "CR") {
			entity_1[0].condition_type = 'CR'
		}
	}
	public async onAddingCondition() {
		await this.tm.getTN("condition_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
	}
	public async onAddingGrossValue() {
		let entity_1 = await this.tm.getTN('item_detail_list').getData();
		let entity_2 = await this.tm.getTN('o2c_so_hdr_detail').getData();
		let len = await this.tm.getTN('item_detail_list').getData().length;
		let x = 0;
		for (let i = 0; i < len; i++) {
			x += parseFloat(entity_1[i].gross_item_value);
		}
		entity_2.gross_value = x;
	}
	public async onFuncArea() {
		let entity = this.tm.getTN("functional_area_list").getData();
		let length = this.tm.getTN("functional_area_list").getData().length;
		for (let i = 1; i < length; i++) {
			if (entity[0].functional_area == entity[i].functional_area) {
				sap.m.MessageBox.error("We can not use same functional area again", {
					title: "Error",
				});
				entity[0].functional_area = undefined
			}
		}

	}
	public onFuncPercentage(): boolean {
		let entity = this.tm.getTN("functional_area_list").getData();
		let length = this.tm.getTN("functional_area_list").getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].percentage);
		}
		if (Math.ceil(total) < 100) {
			return false;
		}
		return true;
	}
	public onProfitPercentage(): boolean {
		let entity = this.tm.getTN("profit_center_list").getData();
		let length = this.tm.getTN("profit_center_list").getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].percentage);
		}
		if (Math.ceil(total) < 100) {
			return false;
		}
		return true;
	}
	public onHeaderDateChange() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		if (entity.project_start_date > entity.project_end_date) {
			sap.m.MessageBox.error("Project start date can't be greater than project end date", {
				title: "Error",
			});
			entity.project_end_date = undefined;
		}
	}
	public onItemStartDateChange() {
		let entity_1 = this.tm.getTN('o2c_so_hdr_detail').getData();
		let index_2 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_2 = this.tm.getTN('item_detail_list').getData();
		if (entity_2[index_2].start_date < entity_1.project_start_date) {
			sap.m.MessageBox.error("Start Date must be greater than project start date", {
				title: "Error",
			});
			entity_2[index_2].start_date = undefined;
		}
	}
	public onItemEndDateChange() {
		let entity_1 = this.tm.getTN('o2c_so_hdr_detail').getData();
		let index_2 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_2 = this.tm.getTN('item_detail_list').getData();
		if (entity_2[index_2].end_date > entity_1.project_end_date) {
			sap.m.MessageBox.error("End Date must be smaller than project end date", {
				title: "Error",
			});
			entity_2[index_2].end_date = undefined;
		}
	}
	public async onFuncPercentageTotal() {
		let entity = this.tm.getTN('functional_area_list').getData();
		let length = this.tm.getTN('functional_area_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].percentage);
		}
		entity[0].text2 = total.toFixed(2);
	}
	public async onFuncAmountTotal() {
		let entity = await this.tm.getTN('functional_area_list').getData();
		let length = await this.tm.getTN('functional_area_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].amount);
		}
		entity[0].text3 = total.toFixed(2);
	}
	public async cancelling() {
		await this.transaction.rollback();
		await this.tm.getTN("o2c_so_hdr_list").refresh();
		await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_o2c_so_hdr_search" }));
		await this.setMode("DISPLAY");
	}

	public async onProfitPercentageTotal() {
		let entity = this.tm.getTN('profit_center_list').getData();
		let length = this.tm.getTN('profit_center_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].percentage);
		}
		entity[0].text2 = total.toFixed(2);
	}
	public async onProfitAmountTotal() {
		let entity = await this.tm.getTN('profit_center_list').getData();
		let length = await this.tm.getTN('profit_center_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].amount);
		}
		entity[0].text3 = total.toFixed(2);
	}
	public async onItemNetValueTotal() {
		let entity = await this.tm.getTN('item_detail_list').getData();
		let length = await this.tm.getTN('item_detail_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].item_value);
		}
		entity[0].text1 = total;
	}
	public async onItemGrossValueTotal() {
		let entity = await this.tm.getTN('item_detail_list').getData();
		let length = await this.tm.getTN('item_detail_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseFloat(entity[i].gross_item_value);
		}
		entity[0].text3 = total;
		this.onAddingGrossValue();
	}
	public onProjectValue(): boolean {
		let entity_1 = this.tm.getTN('item_detail_list').getData();
		let entity_2 = this.tm.getTN("o2c_so_hdr_detail").getData();
		let length = this.tm.getTN('item_detail_list').getData().length;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += parseInt(entity_1[i].item_value);
		}
		let header_net_value = parseInt(entity_2.net_value);
		if (header_net_value == total) {
			return true;
		}
		else {
			return false;
		}
	}
	public async onGeneratingBilling() {
		let entity_1 = this.tm.getTN('item_detail_list').getData();
		let index_1 = this.tm.getTN('item_detail_list').getActiveIndex();
		let entity_2 = this.tm.getTN('schedules_new_list').getData();
		let start_date = entity_1[index_1].start_date;
		let end_date = entity_1[index_1].end_date;
		let s_year = start_date.getFullYear();
		let s_month = start_date.getMonth() + 1;
		let l_year = end_date.getFullYear();
		let l_month = end_date.getMonth() + 1;
		let s_date = start_date.getDate();
		let e_date = end_date.getDate();
		let invoice_cycle = entity_1[index_1].invoice_cycle;
		let length = 0;
		const map1 = new Map();
		map1.set(1, 3);
		map1.set(2, 3);
		map1.set(3, 3);
		map1.set(4, 6);
		map1.set(5, 6);
		map1.set(6, 6);
		map1.set(7, 9);
		map1.set(8, 9);
		map1.set(9, 9);
		map1.set(10, 12);
		map1.set(11, 12);
		map1.set(12, 12);
		if (invoice_cycle == 'MON') {
			if (s_year == l_year) {
				length = parseInt(l_month) - parseInt(s_month)
			}
			else {
				let new_year = l_year - s_year;
				length = (l_month + (12 * new_year)) - s_month;
			}
			let exp_amt = (entity_1[index_1].gross_item_value / (length + 1)).toFixed(2);
			if (s_year == l_year && s_month == l_month) {
				await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
				entity_2[0].start__date = new Date(s_year, s_month - 1, s_date);
				let x = new Date(s_year, s_month, 0).getDate();
				entity_2[0].end_date = new Date(s_year, s_month - 1, e_date);
				entity_2[0].expected_amount = exp_amt;
				entity_2[0].actual_date = new Date(entity_2[0].end_date.getFullYear(), entity_2[0].end_date.getMonth(), entity_2[0].end_date.getDate() + 1);
			}
			else {
				for (let i = 0; i <= length; i++) {
					if (i == 0) {
						await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
						entity_2[i].start__date = new Date(s_year, s_month - 1, s_date);
						let x = new Date(s_year, s_month, 0).getDate();
						entity_2[i].end_date = new Date(s_year, s_month - 1, x);
						entity_2[i].expected_amount = exp_amt;
						entity_2[i].actual_date = new Date(s_year, s_month - 1, x + 1);
					}
					if (i > 0 && i < length) {
						let z = s_month + i
						await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
						entity_2[i].start__date = new Date(s_year, s_month - 1 + i, 1);
						let x = new Date(s_year, z, 0).getDate();
						entity_2[i].end_date = new Date(s_year, s_month - 1 + i, x);
						entity_2[i].expected_amount = exp_amt;
						entity_2[i].actual_date = new Date(s_year, s_month - 1 + i, x + 1);
					}
					if (i == length) {
						await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
						entity_2[i].start__date = new Date(s_year, s_month - 1 + i, 1);
						entity_2[i].end_date = new Date(s_year, s_month - 1 + i, e_date);
						entity_2[i].expected_amount = exp_amt;
						entity_2[i].actual_date = new Date(s_year, s_month - 1 + i, e_date + 1);
					}
				}
			}
		}
		if (invoice_cycle == 'QR') {
			let i = 0;
			let j = start_date;
			while (j < end_date) {
				await this.tm.getTN("schedules_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
				if (i == 0) {
					entity_2[i].start__date = new Date(s_year, s_month - 1, s_date);
					let x = new Date(s_year, map1.get(s_month), 0).getDate();
					entity_2[i].end_date = new Date(s_year, map1.get(s_month) - 1, x);
					entity_2[i].actual_date = new Date(entity_2[i].end_date.getFullYear(), entity_2[i].end_date.getMonth(), entity_2[i].end_date.getDate() + 1);
				}
				else {
					entity_2[i].start__date = new Date(entity_2[i - 1].end_date.getFullYear(), entity_2[i - 1].end_date.getMonth(), entity_2[i - 1].end_date.getDate() + 1);
					let n_mon = entity_2[i].start__date
					let new_month = n_mon.getMonth()
					let z = new_month + 2;
					let n_year = entity_2[i].start__date;
					let new_year = n_year.getFullYear();
					let x = new Date(new_year, z + 1, 0).getDate();
					let end_date_dummy = new Date(new_year, z, x);
					if (end_date_dummy < end_date) {
						entity_2[i].end_date = end_date_dummy;
					}
					else {
						entity_2[i].end_date = end_date;
					}

					entity_2[i].actual_date = new Date(entity_2[i].end_date.getFullYear(), entity_2[i].end_date.getMonth(), entity_2[i].end_date.getDate() + 1);
				}
				j = entity_2[i].end_date;
				i++;

			}
			let exp_amt = (entity_1[index_1].gross_item_value / (entity_2.length)).toFixed(2);
			for (let x = 0; x < entity_2.length; x++) {
				entity_2[x].expected_amount = exp_amt;
			}
		}


	}
	public async other_commant() {
		this.setMode("EDIT");
		let other_comment = this.tm.getTN("other_comment").getData().comment;
		let full_name = this.get_name()
		// let last_name = UserInfo.getActiveUser().r_last_name;
		// if (last_name == null) {
		// 	full_name = UserInfo.getActiveUser().r_first_name
		// }
		// else
		// 	full_name = UserInfo.getActiveUser().r_first_name +" "+ UserInfo.getActiveUser().r_last_name;
		let date = new Date().toLocaleDateString();
		let time = new Date().toLocaleTimeString();
		this.comment_create = await this.tm.getTN("comment_list").getData().newEntityP(0, { s_object_type: -1, comment: other_comment, user_name: full_name, curr_time: time, mime_type: date, file_name: this.filenm }, true);
		await this.tm.getTN("other_comment").setProperty('comment', null);
		await this.comment_create.attachment.setAttachmentP(this.fileup, this.filenm);
		await this.tm.getTN("other_comment").setProperty('attachment_url', null);
		this.setMode("EDIT");
		this.filenm = null;
		this.fileup = null;
	}
	public async documentUpload(oEvent) {
		this.fileup = oEvent.mParameters.files[0];
		this.filenm = oEvent.mParameters.files[0].name;
	}
	public async home() {
		await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_o2c_so_hdr_search" }));
		this.setMode("REVIEW");
	}
	public async project_Lead_Search(oEvent) {
		await this.tm.getTN("proj_lead_list").applyfilterP('full_name', oEvent.mParameters.value);
		// if(await this.tm.getTN("proj_lead_list").getData().length==0)
		// {
		// 	await this.tm.getTN("proj_lead_list").applyfilterP('employee_id',oEvent.mParameters.value);
		// }
		await this.tm.getTN("proj_lead_list").refresh();
	}
	public async project_Manager_Search(oEvent) {
		await this.tm.getTN("team_head_list").applyfilterP('full_name', oEvent.mParameters.value);
		await this.tm.getTN("team_head_list").refresh();
	}
	public async project_Head_Search(oEvent) {
		await this.tm.getTN("team_list_new").applyfilterP('full_name', oEvent.mParameters.value);
		await this.tm.getTN("team_list_new").refresh();
	}
	public async add_from_customer() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let contact_entity = this.tm.getTN('contact_details_list').getData();
		let customer_id = entity.bill_to_customer;
		let list = <KloEntitySet<d_o2c_customers_contact>>await this.transaction.getExecutedQuery('d_o2c_customers_contact', { loadAll: true, 'k_id': customer_id })
		for (let i = 0; i < list.length; i++) {
			contact_entity[i].contact_details_for_followup = list[i].contact_number;
			contact_entity[i].email = list[i].email_id;
		}
	}
	public async onMilestonePercentage(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let item_list = this.tm.getTN("item_detail_list").getData();
		let item_index = this.tm.getTN("item_detail_list").getActiveIndex()
		let milestone_list = this.tm.getTN("billing_new_list").getData();
		let milestone_index = parseInt(path.replace("/billing_new_list/", ''))
		if (milestone_list[milestone_index].percentage > 100) {
			sap.m.MessageBox.error("Percentage can not be more than 100%", {
				title: "Error",
			});
			milestone_list[milestone_index].percentage = 0;
			milestone_list[milestone_index].amount = 0;
		}
		else {
			await this.onAddingMilestonePercentage();
			milestone_list[milestone_index].amount = ((item_list[item_index].item_value / 100) * milestone_list[milestone_index].percentage).toFixed(2);
			await this.onAddingMilestoneAmount();
		}


	}
	public async onMilestoneAmount(oEvent: sap.ui.base.Event) {
		let num;
		let path = this.getPathFromEvent(oEvent);
		let item_list = this.tm.getTN("item_detail_list").getData();
		let item_index = this.tm.getTN("item_detail_list").getActiveIndex()
		let milestone_list = this.tm.getTN("billing_new_list").getData();
		let milestone_index = parseInt(path.replace("/billing_new_list/", ''))

		if (milestone_list[milestone_index].amount > item_list[item_index].item_value) {
			sap.m.MessageBox.error("Milestone amount can not be greater than Item amount", {
				title: "Error",
			});
			milestone_list[milestone_index].percentage = 0;
			milestone_list[milestone_index].amount = 0;
		}
		else {
			await this.onAddingMilestoneAmount();
			num = ((((item_list[item_index].item_value - milestone_list[milestone_index].amount) / item_list[item_index].item_value)) * 100).toFixed(2);
			milestone_list[milestone_index].percentage = (100 - num).toFixed(2);
			await this.onAddingMilestonePercentage();
		}

	}
	public async onAddingMilestonePercentage() {
		let milestone_list = this.tm.getTN("billing_new_list").getData();
		let milestone_index = this.tm.getTN("billing_new_list").getActiveIndex()
		let list = this.tm.getTN("billing_new_list").getData();
		let total_percentage = 0;
		for (let i = 0; i < list.length; i++) {
			total_percentage += parseFloat(list[i].percentage);
		}
		if (total_percentage > 100) {
			sap.m.MessageBox.error("Total percentage can not be more than 100%", {
				title: "Error",
			});
			milestone_list[milestone_index].percentage = 0;
		}
		else {
			list[0].text_4 = total_percentage;
		}

	}
	public async onAddingMilestoneAmount() {
		let list = this.tm.getTN("billing_new_list").getData();
		let total_amount = 0;
		for (let i = 0; i < list.length; i++) {
			total_amount += parseFloat(list[i].amount);
		}
		list[0].text_3 = total_amount;
	}
	public async onAddingMilestone() {
		this.tm.getTN("billing_new_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false)
	}

	public async onDuplicateSO() {
		let entity = this.tm.getTN('o2c_so_hdr_detail').getData();
		let bill_to_customer = entity.bill_to_customer
		let po_number = entity.customer_po_number
		if (bill_to_customer != undefined && po_number != undefined) {
			let list = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'bill_to_customer': bill_to_customer, 'customer_po_number': po_number });

			for (let i = 0; i < list.length; i++) {
				if (this.isInCurrentFinancialYear(list[i].s_created_on)) {
					sap.m.MessageBox.error("Sorry,this SO has already been created", {
						title: "Error",
					});
					entity.bill_to_customer = undefined;
					entity.ship_to_customer = undefined;
					entity.customer_po_number = undefined;
					break;
				}
			}
		}

	}
	public isInCurrentFinancialYear(inputDate): boolean {
		const currentDate = new Date();
		const currentFinancialYearStart = new Date(currentDate.getFullYear() - 1, 3, 1);
		const currentFinancialYearEnd = new Date(currentDate.getFullYear(), 2, 31);
		return inputDate >= currentFinancialYearStart && inputDate <= currentFinancialYearEnd;
	}
	public onCustomerContactList(): boolean {
		let list = this.tm.getTN("contact_details_list").getData();
		for (let i = 0; i < list.length; i++) {
			if (list[i].sales_responsible == 'Yes')
				return true;
		}

		return false;
	}
	public get_name(): string {
		let full_name: string;
		let activeUser = UserInfo.getActiveUser();
		if (activeUser) {
			let first_name = activeUser.r_first_name;
			let last_name = activeUser.r_last_name;

			if (last_name == null || last_name === '') {
				full_name = first_name;
			} else {
				full_name = first_name + ' ' + last_name;
			}
		} else {
			full_name = '';
		}
		return full_name;
	}
	public async so_filter() {
		let user = (await this.transaction.get$User()).login_id;

		await this.tm.getTN("o2c_so_hdr_list").applyfilterP('s_created_by', user);
	}
	public async so_reset() {
		await this.tm.getTN("o2c_so_hdr_list").resetP(true);
	}
	public async so_creator_name() {
		let entity = this.tm.getTN("o2c_so_hdr_detail").getData();
		let emp_name = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': entity.s_created_by });
		// entity.so_created_by = entity.s_created_by.concat(" - ",emp_name[0].first_name," ",emp_name[0].last_name);
		this.tm.getTN("o2c_so_hdr_detail").setProperty('so_created_by', entity.s_created_by.concat(" - ", emp_name[0].first_name, " ", emp_name[0].last_name));
	}
	public async confirmdelete() { // Function of Corfirmation for Cancelling Changes in Detail
		sap.m.MessageBox.confirm("Are You Sure You want to Delete the SO Permanently", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					this.onDelete();
				}
			}
		})
	}
	public async onDelete() {
		await this.tm.getTN('o2c_so_hdr_detail').setActive();
		let entity: d_o2c_so_hdr = await this.tm.getTN('o2c_so_hdr_detail').getData();
		let comment = await entity.r_comment.fetch();
		let item = await entity.r_item_details.fetch();
		let statusHeader = await entity.r_status_hdr.fetch();
		const deleteEntities = async (entityArray) => {
			for (let i = entityArray.length - 1; i >= 0; i--) {
				await entityArray[i].deleteP();
			}
		};

		const deleteRelatedEntities = async (entity, propertyName) => {
			if (Array.isArray(entity[propertyName]) && entity[propertyName].length > 0) {
				await deleteEntities(entity[propertyName]);
			}
		};

		await deleteRelatedEntities(entity, 'r_so_attachment');
		await deleteRelatedEntities(entity, 'r_profit_center');
		await deleteRelatedEntities(entity, 'r_functional_area');
		await deleteRelatedEntities(entity, 'r_contact_details');
		await deleteRelatedEntities(entity, 'r_comment');

		if (entity.r_item_details.length > 0) {
			for (let i = entity.r_item_details.length - 1; i >= 0; i--) {
				const item = await entity.r_item_details[i].fetch();
				await item.r_condition_new.fetch();
				await item.r_schedule_new.fetch();
				await item.r_billing_new.fetch();
				await deleteRelatedEntities(item, 'r_condition_new');
				await deleteRelatedEntities(item, 'r_schedule_new');
				await deleteRelatedEntities(item, 'r_billing_new');
				await item.deleteP();
			}
		}

		if (entity.r_status_hdr.length > 0) {
			for (let i = entity.r_status_hdr.length - 1; i >= 0; i--) {
				const statusHeader = await entity.r_status_hdr[i].fetch();
				await statusHeader.r_status_itm.fetch();
				if (statusHeader.r_status_itm.length > 0) {
					await deleteEntities(statusHeader.r_status_itm);
				}
				await statusHeader.deleteP();
			}
		}

		await entity.deleteP();
		await this.tm.commitP("Delete Successful", "Delete Failed", true, true);
		await this.navTo(({ S: "p_o2c_so_hdr", SS: "pa_o2c_so_hdr_search" }));
		await this.toUpdateList();
		await this.setMode("DISPLAY");

	}

	public async check(oEvent) {
		if (oEvent.mParameters.selectedKey == 'pa_communication') {
			console.log("Check")
			await this.tm.getTN("comm_tab").setData({ click: "enter" });
		}
		else {
			await this.tm.getTN("comm_tab").setData({ click: "" });
		}
	}

	public async budgetedPO() {
		let entity = this.tm.getTN("o2c_so_hdr_detail").getData();
		if (entity.net_value != undefined && entity.cr_rate != undefined) {
			entity.budgeted_pd = (parseFloat(entity.net_value) / parseFloat(entity.cr_rate)).toFixed(2);
		}

	}
	//end...8March
}
