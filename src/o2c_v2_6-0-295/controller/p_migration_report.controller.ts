import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_migration_report")
export default class p_migration_report extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public migrationData;
	public txn;
	public so = [];
	public pocount = true;
	public itemcheck = true;
	public dateCheck
	public async onPageEnter() {
		if (!window['XLSX']) {
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}
		//await this.tm.getTN("click").setData({'clicked':false})
		this.tm.getTN('so').setData({});
		await this.tm.getTN("other").setData({});
		let generalConfig = await this.transaction.getExecutedQuery('d_general_confg', { loadAll: true, 'key': "so_new" })
		this.dateCheck = generalConfig[0].date_input;
	}
	public async onOverallProcess() {
		//await this.tm.getTN("click").setData({'clicked':true})

		this.so = [];
		let migratedData = await this.transaction.getExecutedQuery('d_o2c_so_migration', { loadAll: true });
		if (migratedData.length) {
			let soDatas = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true });
			let soData = soDatas.filter(item => (item.s_created_on <= this.dateCheck))
			//let lastExecutedSoNo = migratedData[migratedData.length - 1].so
			//this.so = await this.transaction.getExecutedQuery('q_leftformigration', { loadAll: true, 'so': lastExecutedSoNo });

			for (let mData = 0; mData < soData.length; mData++) {
				let soInMigrationTable = migratedData.filter(item => (item.so == soData[mData].so))
				if (soInMigrationTable.length == 0)
					this.so.push(soData[mData]);
			}
		}

		else {
			this.so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true });
		}
		this.txn = await this.transaction.createTransaction();
		for (let i = 0; i < this.so.length; i++) {
			this.pocount = true;
			this.itemcheck = true;
			this.migrationData = await this.txn.createEntityP('d_o2c_so_migration', { s_object_type: -1, so: this.so[i].so, so_created_by: this.so[i].s_created_by }, true);
			await this.teamHeadData(this.so[i]);
			await this.onChangeGSTIN(this.so[i]);
			await this.addDataInTblApprovedStatus(this.so[i]);

		}
		//await this.tm.getTN("click").setData({ 'clicked': false })

	}
	public async onChangeGSTIN(so) {
		const gst_info = await this.transaction.getExecutedQuery('d_o2c_customers_map', { loadAll: true, 'customer_id': so.bill_to_customer });
		if (gst_info.length == 1)
			this.migrationData.gstin = true;
		else
			this.migrationData.gstin = false;
		await this.txn.commitP("Save Successful", "Save Failed", true, true);
	}
	public async addDataInTblApprovedStatus(so) {
		if (so.s_status == "Approved") {
			let reqNoData = [];
			let status_hdr = await so.r_status_hdr.fetch();
			for (let i = 0; i < status_hdr.length; i++) {
				let reqnoLength = status_hdr[i].req_no.length;
				reqNoData[i] = status_hdr[i].req_no.slice(1, reqnoLength + 1)

			}
			if (reqNoData.length) {
				let currentReqNoData = Math.max(...reqNoData);
				let currentReqNo = "R" + currentReqNoData;
				let status_itm = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', { loadAll: true, 'req_no': currentReqNo });
				for (let i = 0; i < status_itm.length; i++) {
					let action_name = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': status_itm[i].approved_by });
					let teamHeadProfitCntr;
					if (status_itm[i].so_role == "Team") {
						status_itm[i].so_role = "TEAM_HEAD";
						let teamHeadProfit = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { loadAll: true, 'team_head': status_itm[i].approved_by, 'company_code': so.company });
						teamHeadProfitCntr = teamHeadProfit[0].profit_center;
					}
					try {
						await this.transaction.createEntityP('d_o2c_so_approvall_flow', { s_object_type: -1, so_no: so.so, company_code: so.company, approval_cycle: 1, pending_with_role: status_itm[i].so_role, insert_datetime: status_itm[i].request_date, approval_status: "Approved", action_datetime: status_itm[i].s_modified_by, approved_type: "New", action_by: status_itm[i].approved_by, action_by_name: action_name[0].full_name, profit_center_name: teamHeadProfitCntr }, true);
					}
					catch {
						this.migrationData.approval = false;
						if (this.migrationData.save_as_draft == false)
							await this.attachData(so);
					}
				}
			}
			try {
				let soAttachment = await so.r_so_attachment.fetch();
				for (let i = 0; i < soAttachment.length; i++) {
					soAttachment[i].approval_status = "Approved";
				}
				await this.tm.commitP("Save Successful", "Save Failed", true, true);
				this.migrationData.approval = true;
				await this.txn.commitP("Save Successful", "Save Failed", true, true);
				if (this.migrationData.line_item_to_po == false)
					await this.attachData(so);
			}
			catch {
				this.migrationData.approval = false;
				await this.transaction.rollback();
				if (this.migrationData.line_item_to_po == false)
					await this.attachData(so);
			}
		}
		else {
			try {
				this.migrationData.approval = true;
				await this.txn.commitP("Save Successful", "Save Failed", true, true);
				if (this.migrationData.line_item_to_po == false)
					await this.attachData(so);
			}
			catch {
				await this.txn.rollback();
				if (this.migrationData.line_item_to_po == false)
					await this.attachData(so);
			}
		}
	}
	public async attachData(so) {
		let soAttachment = await so.r_so_attachment.fetch();
		let item = await so.r_item_details.fetch();
		if (soAttachment.length == 1 && item.length == 1) {
			soAttachment[0].po_no = so.customer_po_number;
			soAttachment[0].cr_rate = so.cr_rate;
			soAttachment[0].so_remark = so.customer_po_number;
		}
		else {
			for (let i = 0; i < soAttachment.length; i++) {
				if (so.type == "SO") {
					let pocheck = item.filter(item => (item.po == soAttachment[i].so_remark))
					if (pocheck.length && pocheck[0].po != null) {
						soAttachment[i].po_no = soAttachment[i].so_remark;
						soAttachment[i].cr_rate = so.cr_rate;
					}
					else {
						if (so.type == "SO" && (soAttachment[i].po_no == "" || soAttachment[i].po_no == null))
							this.pocount = false;
					}

				}
				if (so.type == "PS") {
					soAttachment[0].cr_rate = so.cr_rate;
					soAttachment[0].so_remark = so.customer_po_number;
				}
				if (so.type == "NBS" || so.type == "ISP") {
					this.migrationData.line_item_to_po = true;
				}
			}

		}
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.po_to_line_item == false) {
				let soAttachment = await so[0].r_so_attachment.fetch();
				for (let i = 0; i < soAttachment.length; i++) {
					soAttachment[i].gross_value = 0;
				}
				await this.itemData(so);
			}

		}
		catch {
			this.transaction.rollback();
			if (this.migrationData.po_to_line_item == false) {
				let soAttachment = await so.r_so_attachment.fetch();
				for (let i = 0; i < soAttachment.length; i++) {
					soAttachment[i].gross_value = 0;
				}
				await this.itemData(so);
			}

		}


	}
	public async itemData(so) {
		let soAttachment = await so.r_so_attachment.fetch();
		let soItem = await so.r_item_details.fetch();

		if (soAttachment.length == 1 && soItem.length == 1) {
			soItem[0].po = so.customer_po_number
			soItem[0].attachment_id = soAttachment[0].attachment_id;
			if (so.po_date == null || so.po_date == undefined || so.po_date == "") {
				so.po_date = so.project_start_date
			}
			await this.attachGrossValue(soItem[0].item_value, soAttachment[0], so.po_date, 1);
		}
		else {
			for (let i = 0; i < soItem.length; i++) {
				if (so.type == "SO") {
					let grossValue = 0;
					let poDate;
					let matchPO = soAttachment.filter(item => ((item.po_no != null) && (item.po_no == soItem[i].po || item.po_no == soItem[i].po_no)));

					if (so.po_date == null || so.po_date == undefined || so.po_date == "") {
						so.po_date = so.project_start_date
					}
					poDate = so.po_date;

					if (matchPO.length && this.pocount == true) {
						for (let j = 0; j < matchPO.length; j++) {
							soItem[i].po_no = soItem[i].po;
							soItem[i].attachment_id = matchPO[j].attachment_id;
							grossValue = parseFloat(soItem[i].item_value);
							await this.attachGrossValue(grossValue, matchPO[j], poDate, 0);
						}

					}
					else {
						if (so.type == "SO")
							this.itemcheck = false;
					}
				}
				if (so.type == "PS") {
					let grossValue = 0;
					let poDate = so.po_date;
					soItem[i].attachment_id = soAttachment[0].attachment_id;
					grossValue = parseFloat(soItem[i].item_value);
					soItem[i].attachment_id = soAttachment[0].attachment_id;
					await this.attachGrossValue(grossValue, soAttachment[0], poDate, 0);
				}
			}

		}

		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			if (this.itemcheck)
				this.migrationData.po_to_line_item = true;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.line_item_to_po == true && this.migrationData.po_to_line_item == true)
				await this.lastTableSync(so);
		}
		catch {
			this.migrationData.po_to_line_item = false;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			await this.transaction.rollback();
			if (this.migrationData.line_item_to_po == true && this.migrationData.po_to_line_item == true)
				await this.lastTableSync(so);
		}
	}
	public async attachGrossValue(grossValue, soAttachment, poDate, mapping) {
		if (mapping == 1)
			soAttachment.gross_value = parseFloat(grossValue);
		else
			soAttachment.gross_value = parseFloat(soAttachment.gross_value + grossValue);
		soAttachment.po_date = poDate;
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);

		}
		catch {
			this.migrationData.line_item_to_po = false;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			await this.transaction.rollback();

		}

		if (this.pocount)
			this.migrationData.line_item_to_po = true;
		else
			this.migrationData.line_item_to_po = false;
		await this.txn.commitP("Save Successful", "Save Failed", true, true);


	}
	public async lastTableSync(so) {
		const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let invoiceType = so.po_category;
		if (invoiceType == "Milestone")
			invoiceType = "MILESTONE"
		if (invoiceType == "T&M")
			invoiceType = "TNM"
		if (invoiceType == "MOFIX")
			invoiceType = "MONTHLYFIX"
		if (invoiceType == "Volume")
			invoiceType = "VOLUME"
		if (invoiceType == "Internal")
			invoiceType = "ONACT"

		let soItem = await so.r_item_details.fetch();
		for (let i = 0; i < soItem.length; i++) {
			soItem[i].invoice_type = invoiceType;
			if (soItem[i].item_category == "Licence")
				soItem[i].item_category = "LISC"
			if (soItem[i].item_category == "Project")
				soItem[i].item_category = "PROJFEE"
			if (soItem[i].item_category == "Expense")
				soItem[i].item_category = "EXPENSE"
			if (soItem[i].item_category == "CR")
				soItem[i].item_category = "PROJFEE"

			/*if (soItem[i].invoice_cycle == "MON")
				soItem[i].invoice_cycle = "MONTHLY"
			if (soItem[i].invoice_cycle == "QR")
				soItem[i].invoice_cycle = "QUTRLY"
			if (soItem[i].invoice_cycle == "MB")
				soItem[i].invoice_cycle = "MILSTBASED"*/

			if (soItem[i].invoice_type == "MILESTONE" && soItem[i].item_category == "PROJFEE") {
				soItem[i].invoice_cycle = "NA";
			}
			if (soItem[i].invoice_type == "MONTHLYFIX" && soItem[i].item_category == "PROJFEE") {
				if (soItem[i].invoice_cycle == "MON")
					soItem[i].invoice_cycle = "MONTHLY"
				if (soItem[i].invoice_cycle == "QR")
					soItem[i].invoice_cycle = "QUTRLY"
			}
			if (soItem[i].invoice_type == "TNM" && soItem[i].item_category == "PROJFEE") {
				if (soItem[i].invoice_cycle == "MON")
					soItem[i].invoice_cycle = "MONTHLY"
				if (soItem[i].invoice_cycle == "QR")
					soItem[i].invoice_cycle = "QUTRLY"
			}
			if (soItem[i].invoice_type == "VOLUME" && soItem[i].item_category == "PROJFEE") {
				soItem[i].invoice_cycle = "ONACT"
			}
			if (soItem[i].invoice_type == "MILESTONE" && soItem[i].item_category == "EXPENSE") {
				soItem[i].invoice_cycle = "NA"
			}
			if (soItem[i].invoice_type == "MONTHLYFIX" && soItem[i].item_category == "EXPENSE") {
				if (soItem[i].invoice_cycle == "MON")
					soItem[i].invoice_cycle = "MONTHLY"
				if (soItem[i].invoice_cycle == "QR")
					soItem[i].invoice_cycle = "QUTRLY"
			}
			if (soItem[i].invoice_type == "ONACT" && soItem[i].item_category == "EXPENSE") {
				soItem[i].invoice_cycle = "ONACT"
			}
			if (soItem[i].invoice_type == "MILESTONE" && soItem[i].item_category == "LISC") {
				soItem[i].invoice_cycle = "NA"
			}
			if (soItem[i].invoice_type == "VOLUME" && soItem[i].item_category == "LISC") {
				if (soItem[i].invoice_cycle == "MON")
					soItem[i].invoice_cycle = "MONTHLY"
				if (soItem[i].invoice_cycle == "QR")
					soItem[i].invoice_cycle = "QUTRLY"
			}
			let itemRelation = [];
			let itemRelationMilestone = await soItem[i].r_billing_new.fetch();
			for (let mile = 0; mile < itemRelationMilestone.length; mile++) {
				if ((itemRelationMilestone[mile].actual_date) == null || (itemRelationMilestone[mile].actual_date) == "" || (itemRelationMilestone[mile].actual_date) == undefined)
					itemRelationMilestone[mile].actual_date = so.project_end_date;
			}
			let itemRelationSchedule = await soItem[i].r_schedule_new.fetch();
			if (itemRelationMilestone.length) {
				itemRelation = itemRelationMilestone
			}
			if (itemRelationSchedule.length) {
				itemRelation = itemRelationSchedule
			}

			//Delete schedule table data which have invoiceType="Volume" and set in the volume table
			if (soItem[i].invoice_type == "VOLUME") {
				let volumeCreating = [];
				//soItem[i].soitem
				//milestone_description
				for (let volumeCreate = 0; volumeCreate < itemRelation.length; volumeCreate++) {
					let volumeDesc, invoice_status;
					let startMonth = (new Date(itemRelation[volumeCreate].start__date)).getMonth();
					let startMonthName = month[startMonth];
					let endMonth = (new Date(itemRelation[volumeCreate].end_date)).getMonth();
					let endMonthName = month[endMonth];
					if (startMonth == endMonth) {
						volumeDesc = startMonthName;
					}
					else {
						volumeDesc = startMonthName + "-" + endMonthName;
					}
					//quantity
					//amount
					//milestone_date
					//invoice status
					if (itemRelation[volumeCreate].status == "ic")
						invoice_status = "InvCan"
					else if (itemRelation[volumeCreate].status == "inv")
						invoice_status = "Invoiced"
					else if (itemRelation[volumeCreate].status == "oh")
						invoice_status = "OnHold"
					else if (itemRelation[volumeCreate].status == "pen")
						invoice_status = "Pending"
					else if (itemRelation[volumeCreate].status == "pr")
						invoice_status = "Paid"
					else
						invoice_status = "Pending";

					volumeCreating[volumeCreate] = await this.transaction.createEntityP('d_o2c_volume_based', { s_object_type: -1, 'soitem': soItem[i].soitem, 'quantity': 1, 'amount': itemRelation[volumeCreate].expected_amount, 'milestone_date': itemRelation[volumeCreate].actual_date, 'invoice_status': invoice_status, 'milestone_description': volumeDesc }, true);
				}
				if (itemRelationSchedule.length == volumeCreating.length) {
					for (let schData = 0; schData < itemRelationSchedule.length; schData++) {
						itemRelationSchedule[schData].deleteP();
					}
				}
			}
			else {
				for (let k = 0; k < itemRelation.length; k++) {
					//For schedule description
					if (itemRelationSchedule.length) {
						let startMonth = (new Date(itemRelation[k].start__date)).getMonth();
						let startMonthName = month[startMonth];
						let endMonth = (new Date(itemRelation[k].end_date)).getMonth();
						let endMonthName = month[endMonth];
						if (startMonth == endMonth) {
							itemRelation[k].description = startMonthName;
						}
						else {
							itemRelation[k].description = startMonthName + "-" + endMonthName;
						}
					}
					//For schedule and milestone invoice status
					if (itemRelation[k].status == "ic")
						itemRelation[k].status = "InvCan"
					else if (itemRelation[k].status == "inv")
						itemRelation[k].status = "Invoiced"
					else if (itemRelation[k].status == "oh")
						itemRelation[k].status = "OnHold"
					else if (itemRelation[k].status == "pen")
						itemRelation[k].status = "Pending"
					else if (itemRelation[k].status == "pr")
						itemRelation[k].status = "Paid"
					else
						itemRelation[k].status = "Pending";

				}
			}
			try {
				await this.tm.commitP("Save Successful", "Save Failed", true, true);
				this.migrationData.last_table_sync = true;
				await this.txn.commitP("Save Successful", "Save Failed", true, true);
				if (this.migrationData.pds == false)
					await this.changeToPDS(so);

			}
			catch {
				await this.transaction.rollback();
				await this.txn.rollback();
				if (this.migrationData.pds == false)
					await this.changeToPDS(so);
			}
		}
	}
	public async individualSO() {
		this.pocount = true;
		this.itemcheck = true;
		//await this.tm.getTN("click").setData({'clicked':true})
		//other
		let soNo = await this.tm.getTN("so").getData().no;
		let indSOs = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': soNo });
		let indSO = indSOs.filter(item => (item.s_created_on <= this.dateCheck))
		if (indSO.length == 0) {
			sap.m.MessageToast.show("This SO is created in New SO Screen", { duration: 2000 });
		}
		else {
			this.txn = await this.transaction.createTransaction();
			let migrationDataArray = await this.txn.getExecutedQuery('d_o2c_so_migration', { loadAll: true, 'so': soNo });
			this.migrationData = migrationDataArray[0]
			if (migrationDataArray.length == 0) {
				this.migrationData = await this.txn.createEntityP('d_o2c_so_migration', { s_object_type: -1, so: indSO[0].so, so_created_by: indSO[0].s_created_by }, true);
				await this.teamHeadData(indSO[0]);
			}
			if (this.migrationData.gstin == false)
				await this.onChangeGSTIN(indSO[0]);
			if (this.migrationData.approval == false)
				await this.addDataInTblApprovedStatus(indSO[0]);
			if (this.pocount == true)
				await this.attachData(indSO[0]);
			if (this.itemcheck == true) {
				let soAttachment = await indSO[0].r_so_attachment.fetch();
				for (let i = 0; i < soAttachment.length; i++) {
					soAttachment[i].gross_value = 0;
				}
				await this.itemData(indSO[0]);
			}
			if (this.migrationData.line_item_to_po == true && this.migrationData.po_to_line_item == true)
				await this.lastTableSync(indSO[0]);
			if (this.migrationData.pds == false)
				await this.changeToPDS(indSO[0]);
			if (this.migrationData.budgeted_pds == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.calculateBudgetedPD(indSO[0]);
			if (this.migrationData.billing_responsible == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.billingResponsible(indSO[0]);
			if (this.migrationData.duration_week == false)
				await this.durationInWeeks(indSO[0])
			if (this.migrationData.save_as_draft == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.addDataInTblSaveAsStatus(indSO[0]);

			await this.tm.getTN("so").setData({});
			//await this.tm.getTN("click").setData({ 'clicked': false })
		}
	}
	public async changeToPDS(so) {
		let profitCenter = await so.r_profit_center.fetch();
		for (let i = 0; i < profitCenter.length; i++) {
			if (so.cr_rate) {
				profitCenter[i].pds = (parseFloat(profitCenter[i].amount) / parseFloat(so.cr_rate));
			}
		}
		let funArea = await so.r_functional_area.fetch();
		for (let i = 0; i < funArea.length; i++) {
			if (so.cr_rate) {
				funArea[i].amount = (parseFloat(funArea[i].amount) / parseFloat(so.cr_rate));
			}
		}
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			this.migrationData.pds = true;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.budgeted_pds == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.calculateBudgetedPD(so);

		}
		catch {
			await this.transaction.rollback();
			await this.txn.rollback();
			if (this.migrationData.budgeted_pds == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.calculateBudgetedPD(so);
		}

	}
	public async calculateBudgetedPD(so) {
		let soAttachment = await so.r_so_attachment.fetch();
		for (let i = 0; i < soAttachment.length; i++) {
			let sumOfGrossLineItem1 = 0;
			let soItem = await soAttachment[i].r_attachmnt_itm.fetch();
			for (let j = 0; j < soItem.length; j++) {
				if (soItem[j].item_category === "PROJFEE" || soItem[j].item_category === "AMC" || soItem[j].item_category === "Project" || soItem[j].item_category === "CR")
					sumOfGrossLineItem1 += parseFloat(soItem[j].item_value);
			}
			soAttachment[i].budgeted_pd = (sumOfGrossLineItem1 / soAttachment[i].cr_rate);
			so.budgeted_pd += parseFloat(soAttachment[i].budgeted_pd);
		}
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			this.migrationData.budgeted_pds = true;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.duration_week == false)
				await this.durationInWeeks(so);
		}
		catch {
			await this.transaction.rollback();
			await this.txn.rollback();
			this.migrationData.budgeted_pds = false;
			if (this.migrationData.duration_week == false)
				await this.durationInWeeks(so);

		}
	}
	public async durationInWeeks(so) {
		let date1 = so.project_start_date;
		let date2 = so.project_end_date;
		let time_difference = date2.getTime() - date1.getTime();
		let days_difference = time_difference / (1000 * 60 * 60 * 24);
		let durationInWeek = Math.ceil(days_difference);
		so.duration_week = Number(durationInWeek);
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			this.migrationData.duration_week = true;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.billing_responsible == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.billingResponsible(so);
		}
		catch {
			await this.transaction.rollback();
			await this.txn.rollback();
			this.migrationData.duration_week = false;
			if (this.migrationData.billing_responsible == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.billingResponsible(so);
		}
	}
	public async billingResponsible(so) {
		let so_contact = await so.r_contact_details.fetch();
		let contactBillingTrue = so_contact.filter(item => (item.sales_responsible == "Yes"))
		if (contactBillingTrue.length == 0)
			so_contact[0].sales_responsible = true;
		else if (contactBillingTrue.length > 1)
			so_contact[0].sales_responsible = true;
		else
			contactBillingTrue[0].sales_responsible = true;
		try {
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			this.migrationData.billing_responsible = true;
			await this.txn.commitP("Save Successful", "Save Failed", true, true);
			if (this.migrationData.save_as_draft == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.addDataInTblSaveAsStatus(so);
		}
		catch {
			await this.transaction.rollback();
			await this.txn.rollback();
			this.migrationData.billing_responsible = false;
			if (this.migrationData.save_as_draft == false && this.migrationData.po_to_line_item == true && this.migrationData.line_item_to_po == true)
				await this.addDataInTblSaveAsStatus(so);
		}
	}

	public async addDataInTblSaveAsStatus(so) {
		if (so.s_status != "Approved") {
			so.s_status = "Save As Draft";

			try {
				await this.tm.commitP("Save Successful", "Save Failed", true, true);
				this.migrationData.save_as_draft = true;
				await this.txn.commitP("Save Successful", "Save Failed", true, true);
			}
			catch {
				this.migrationData.save_as_draft = false;

			}
		}
		else {
			try {
				this.migrationData.save_as_draft = true;
				await this.txn.commitP("Save Successful", "Save Failed", true, true);

			}
			catch {
				await this.txn.rollback();

			}
		}
	}
	public async teamHeadData(so) {
		let teamHead = []
		let profitCenterData = await so.r_profit_center.fetch();
		for (let i = 0; i < profitCenterData.length; i++) {
			teamHead.push(profitCenterData[i].team_head);
		}
		this.migrationData.team_head = teamHead;
		await this.txn.commitP("Save Successful", "Save Failed", true, true);
	}
	// public async grossItemToItem() {
	// 	let oBusyIndicator = new sap.m.BusyDialog();
	// 	oBusyIndicator.setText("Saving....");
	// 	oBusyIndicator.open();
	// 	let mig = await this.transaction.getExecutedQuery('d_o2c_so_migration', { loadAll: true, partialSelected: ['so'] });
	// 	for (let i = 0; i < mig.length; i++) {
	// 		let so_no = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': mig[i].so });
	// 		let soAttachment = await so_no[0].r_so_attachment.fetch();
	// 		if (soAttachment.length == 1) {
	// 			let soItem = await soAttachment[0].r_attachmnt_itm.fetch();
	// 			if (soItem.length == 1) {
	// 				soAttachment[0].gross_value = soItem[0].item_value;
	// 			}
	// 		}

	// 	}
	// 	oBusyIndicator.close();
	// 	await this.tm.commitP("Save Successful", "Save Failed", true, true);
	// 	sap.m.MessageToast.show("All Gross Value Data is switched successfully", { duration: 2000 });

	// }
	public async soToPSO() {
		let so_no = await this.tm.getTN("so").getData();
		let selectedSO = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': so_no.ps_so });
		selectedSO[0].type = "PS";
		await this.tm.commitP("Save Successful", "Save Failed", true, true);

	}
	/*public async psFinanceLineItem() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let migso = await this.transaction.getExecutedQuery('d_o2c_so_migration', { loadAll: true, partialSelected: ['so'] });
		for (let i = 0; i < migso.length; i++) {
			let migPSO = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': migso[i].so, 'type': "PS", 's_status': "Approved" });
			if (migPSO.length) {
				let financeData = await this.transaction.getExecutedQuery('d_o2c_so_approvall_flow', { loadAll: true, 'pending_with_role': "FINANCE", 'so_no': migPSO[0].so, partialSelected: ['so'] });
				if (financeData.length == 0) {
					let approvalCycleFlow;
					let crStatus;
					if (!(migPSO[0].approval_cycle))
						approvalCycleFlow = 1;
					if (migPSO[0].approval_cycle)
						approvalCycleFlow = migPSO[0].approval_cycle;
					if (!(migPSO[0].cr_status))
						crStatus = "New"
					if (migPSO[0].cr_status)
						crStatus = migPSO[0].cr_status;
					await this.transaction.createEntityP('d_o2c_so_approvall_flow', { s_object_type: -1, so_no: migPSO[0].so, company_code: migPSO[0].company_code, approval_cycle: approvalCycleFlow, pending_with_role: "Finance", insert_datetime: new Date(), approval_status: "Approved", approved_type: crStatus }, true);
				}

			}

		}
		oBusyIndicator.close();
		await this.tm.commitP("Save Successful", "Save Failed", true, true);
		sap.m.MessageToast.show("Finance got all the Old Provisional SO Access", { duration: 2000 });

	}*/
	public async isPrimaryPCSet() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let samePercentageDate = [];
		let soList = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, expandAll: 'r_profit_center', partialSelected: 'so' });
		for (let i = 0; i < soList.length; i++) {
			let filterPC = soList[i].r_profit_center.filter(item => (item.primary_profit_center == true))
			if (filterPC.length == 0) {
				if (soList[i].r_profit_center.length == 1) {
					soList[i].r_profit_center[0].primary_profit_center = true;
				}
				else {

					let pcPercentageArray = new Set();
					for (let j = 0; j < soList[i].r_profit_center.length; j++) {
						pcPercentageArray.add(parseFloat(soList[i].r_profit_center[j].percentage));
					}
					if (pcPercentageArray.size > 1) {
						let maxPCPercentage = Math.max(...Array.from(pcPercentageArray));
						let filterMaxPC = soList[i].r_profit_center.filter(item => (item.percentage == maxPCPercentage))
						filterMaxPC[0].primary_profit_center = true;
					}
					else {
						samePercentageDate.push(soList[i].so)
					}
				}

			}
		}
		console.log(samePercentageDate);
		oBusyIndicator.close();
		await this.tm.commitP("Save Successful", "Save Failed", true, true);
		sap.m.MessageToast.show("Primary Profit Center is added", { duration: 2000 });
	}
	//PO Project PDS
	public async poProjectPds() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let mso = [];
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, expandAll: 'r_so_attachment' });
		for (let i = 0; i < so.length; i++) {
			for (let j = 0; j < so[i].r_so_attachment.length; j++) {
				if (so[i].r_so_attachment[j].project_pds == "" || so[i].r_so_attachment[j].project_pds == undefined || so[i].r_so_attachment[j].project_pds == null) {
					if (so[i].r_so_attachment[j].budgeted_pd != null && so[i].r_so_attachment[j].budgeted_pd != undefined && so[i].r_so_attachment[j].budgeted_pd != "") {
						so[i].r_so_attachment[j].project_pds = so[i].r_so_attachment[j].budgeted_pd;
					}
					else {
						mso.push({
							so: so[i].so,
							budgetedPDS: so[i].r_so_attachment[j].budgeted_pd
						})
					}
				}
			}
			oBusyIndicator.close();
			await this.tm.commitP("Save Successful", "Save Failed", true, true);

		}

		sap.m.MessageToast.show("Project PDs added in PO Details", { duration: 2000 });
		console.log(mso);
	}
	//Profit Center Project PDS
	public async profitCenterProjectPds() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let soData=[];
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, expandAll: 'r_so_attachment,r_profit_center' });
		for (let i = 0; i < so.length; i++) {
			let sumPOProjectPDS = 0;
			for (let j = 0; j < so[i].r_so_attachment.length; j++) {
				sumPOProjectPDS += parseFloat(so[i].r_so_attachment[j].project_pds);
			}
			for (let k = 0; k < so[i].r_profit_center.length; k++) {
				//if (so[i].r_profit_center[k].project_pds == "" || so[i].r_profit_center[k].project_pds == undefined || so[i].r_profit_center[k].project_pds == null) {
					if (sumPOProjectPDS != null && sumPOProjectPDS != undefined) {
						so[i].r_profit_center[k].project_pds = (parseFloat(so[i].r_profit_center[k].percentage * sumPOProjectPDS) / 100).toFixed(2);
					}
					else {
						soData.push({
							so: so[i].so,
							budgetedPDS: sumPOProjectPDS
						})
					}
				//}
			}
			oBusyIndicator.close();
			await this.tm.commitP("Save Successful", "Save Failed", true, true);

		}

		sap.m.MessageToast.show("Project PDs added in Profit Center" , { duration: 2000 });
		console.log(soData);
	}
	//Profit Center Budgeted PDS
	public async profitCenterBudgetedPds() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let soData=[];
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, expandAll: 'r_so_attachment,r_profit_center' });
		for (let i = 0; i < so.length; i++) {
			let sumPOBudgetedPDS = 0;
			for (let j = 0; j < so[i].r_so_attachment.length; j++) {
				sumPOBudgetedPDS += parseFloat(so[i].r_so_attachment[j].budgeted_pd);
			}
			for (let k = 0; k < so[i].r_profit_center.length; k++) {
				//if (so[i].r_profit_center[k].project_pds == "" || so[i].r_profit_center[k].project_pds == undefined || so[i].r_profit_center[k].project_pds == null) {
					if (sumPOBudgetedPDS != null && sumPOBudgetedPDS != undefined) {
						so[i].r_profit_center[k].pds = (parseFloat(so[i].r_profit_center[k].percentage * sumPOBudgetedPDS) / 100).toFixed(2);
					}
					else {
						soData.push({
							so: so[i].so,
							budgetedPDS: sumPOBudgetedPDS
						})
					}
				//}
			}
			oBusyIndicator.close();
			await this.tm.commitP("Save Successful", "Save Failed", true, true);

		}

		sap.m.MessageToast.show("Budgeted  PDs added in Profit Center" , { duration: 2000 });
		console.log(soData);
	}
	// Budgeted Pds PO Details and SO
	public async BudgetedPDPO() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let data=[];
		let soNo = await this.tm.getTN("so").getData().number;
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': soNo, expandAll: 'r_so_attachment' });
		for (let i = 0; i < so.length; i++) {
			let sobudgetedpd = 0;
			let soAttachment = await so[i].r_so_attachment;
			for (let j = 0; j < soAttachment.length; j++) {
				let sumOfGrossLineItem1 = 0;
				let soItem = await soAttachment[j].r_attachmnt_itm.fetch();
				for (let k = 0; k < soItem.length; k++) {
					if (soItem[k].item_category === "PROJFEE" || soItem[k].item_category === "AMC" || soItem[k].item_category === "Project" || soItem[k].item_category === "CR")
						sumOfGrossLineItem1 += parseFloat(soItem[k].item_value);
				}
				if (soAttachment[j].cr_rate != null && soAttachment[j].cr_rate != undefined && soAttachment[j].cr_rate != "") {
					soAttachment[j].budgeted_pd = parseFloat((sumOfGrossLineItem1 / soAttachment[j].cr_rate).toFixed(2));
					sobudgetedpd += parseFloat(soAttachment[j].budgeted_pd);
				}
				else {
					data.push({
						so: so[i].so,
						crRate: soAttachment[j].cr_rate
					})
				}

			}
			so[i].budgeted_pd = parseFloat(sobudgetedpd.toFixed(2));

			oBusyIndicator.close();
			await this.tm.commitP("Save Successful", "Save Failed ", true, true, { duration: 2000 });
		}
		sap.m.MessageToast.show("Budgeted Pds of PO Details and SO", { duration: 2000 });
		console.log(data);

	}
	public async customerName() {
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Saving....");
		oBusyIndicator.open();
		let soNo = await this.tm.getTN("so").getData().number;
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': soNo, expandAll: 'r_contact_details' });
		let cust = await this.transaction.getExecutedQuery('d_o2c_customers_contact', { loadAll: true, 'k_id': so[0].bill_to_customer, expandAll: 'r_customer_contact' });
		for (let i = 0; i < so[0].r_contact_details.length; i++) {
			for (let j = 0; j < cust.length; j++) {
				if (so[0].r_contact_details[i].contact_details_for_followup == cust[j].contact_number) {
					so[0].r_contact_details[i].contact_identifer = cust[j].contact_id;
				}
			}
		}
		oBusyIndicator.close();
		await this.tm.commitP("Save Successful", "Save Failed", true, true);

	}
	public async openDialagBox() {
		let jsonData = [];
		let list = [];
		let soContact = await this.transaction.getExecutedQuery('d_o2c_so_contact', { loadAll: true });
		let contact = soContact.filter((item) => item.contact_identifer == null || item.contact_identifer == "" || item.contact_identifer == undefined);
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, expandAll: "r_profit_center" });
		for (let i = 0; i < contact.length; i++) {
			let soData = so.filter((e) => e.so_guid == contact[i].so_guid);
			if (soData.length > 0) {
				let pm = "", th = "";
				for (let j = 0; j < soData[0].r_profit_center.length; j++) {
					pm = pm + soData[0].r_profit_center[j].project_manager;
					th = th + soData[0].r_profit_center[j].team_head;
					if ((j + 1) != soData[0].r_profit_center.length) {
						pm = pm + ",";
						th = th + ",";
					}

				}
				jsonData.push({
					'so': soData[0].so,
					'type': soData[0].type,
					'project_manager': pm,
					'team_head': th,
					'status': soData[0].s_status

				})
			}
			list = jsonData;
		}

		await this.tm.getTN("other").setData(list);
		await this.navTo(({ TS: true, H: true, S: "p_migration_report", SS: "pageArea02" }));

	}
	public async downloadExcel() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is fetching..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		let listData = await this.tm.getTN("other").getData();
		let jsonData = [];

		// Build the jsonData array using the fetched data
		for (let index = 0; index < listData.length; index++) {

			jsonData.push({
				'SO': listData[index]?.so,
				'Type': listData[index]?.type,
				'Project Manager': listData[index]?.project_manager,
				'Team Head': listData[index]?.team_head,
				'Status': listData[index]?.status
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
			{ width: 20 }

		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
		});


		XLSX.utils.book_append_sheet(workbook, worksheet, "Blank Contact List");

		// Write workbook to a file
		const filePath = 'socontact.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();
	}
	public async onSetDataFunc() {
		let jData = [];
		let listData = [];
		let soData = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 's_status': ["Pending", "Approved", "Back To Edit", "Closed", "Call Back", "Archived"], 'expandAll': 'r_functional_area,r_profit_center' });
		let orgFunc = await this.transaction.getExecutedQuery('d_o2c_functional_area', { loadAll: true });
		for (let i = 0; i < soData.length; i++) {
			let pm = "", th = "";
			for (let j = 0; j < soData[i].r_profit_center.length; j++) {
				pm = pm + soData[i].r_profit_center[j].project_manager;
				th = th + soData[i].r_profit_center[j].team_head;
				if ((j + 1) != soData[i].r_profit_center.length) {
					pm = pm + ",";
					th = th + ",";
				}

			}
			let companyFunc = orgFunc.filter((item) => item.company_code == soData[i].company && item.business_area == soData[i].business_area);
			//Org Functional Area
			const aFuncAreaInfo: Array<Object> = [];
			for (let dd = 0; dd < companyFunc.length; dd++) {
				aFuncAreaInfo.push({
					functional_area_id: companyFunc[dd].functional_area,
					name: companyFunc[dd].name,
				});
			}
			for (let k = 0; k < soData[i].r_functional_area.length; k++) {
				let blankFunc = companyFunc.filter((item) => item.functional_area == soData[i].r_functional_area[k].functional_area);
				if (blankFunc.length == 0) {
					jData.push({
						'fid': soData[i].r_functional_area[k].fa_number,
						'fso': soData[i].so,
						'business': soData[i].business_area,
						'func': soData[i].r_functional_area[k].functional_area,
						'fproject_manager': pm,
						'fteam_head': th,
						'fstatus': soData[i].s_status,
						'replaceFunctional': aFuncAreaInfo
					})
				}
				listData = jData;
			}
		}
		await this.tm.getTN("other").setData(listData);
	}
	public async onDownload() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is fetching..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		let listData = await this.tm.getTN("other").getData();
		let jsonData = [];

		// Build the jsonData array using the fetched data
		for (let index = 0; index < listData.length; index++) {

			jsonData.push({
				'SO': listData[index]?.fso,
				'Business Area': listData[index]?.business,
				'SO Functional Area': listData[index]?.func,
				'Project Manager': listData[index]?.fproject_manager,
				'Team Head': listData[index]?.fteam_head,
				'Status': listData[index]?.fstatus
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
			{ width: 20 }

		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
		});


		XLSX.utils.book_append_sheet(workbook, worksheet, "Blank Functional AreaList");

		// Write workbook to a file
		const filePath = 'sofunctional.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();
	}
	public async onSave() {
		let data = await this.tm.getTN("other").getData();
		let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'expandAll': 'r_functional_area,r_profit_center' });
		for (let i = 0; i < data.length; i++) {
			if (data[i].functional_area_id == null || data[i].functional_area_id == undefined || data[i].functional_area_id == "") {
			}
			else {
				let soFilter = so.filter((item) => item.so == data[i].fso);
				if (soFilter.length > 0) {
					let funcFilter = soFilter[0].r_functional_area.filter((item) => item.fa_number == data[i].fid);
					if (funcFilter.length > 0) {
						funcFilter[0].functional_area = data[i].functional_area_id;
					}
				}
			}

		}
		await this.tm.commitP("Save Successful", "Save Failed", true, true);

	}
	public async onsiteReq(){
		let jData = [];
		let listData = [];
		let soOnsiteTrue = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true,'onsite_required':true, 'expandAll': 'r_so_travel_reimb,r_profit_center' });
	    let soOnsiteTrueWithoutTravel=soOnsiteTrue.filter((item)=>item.r_so_travel_reimb.length==0);
		for(let i=0;i<soOnsiteTrueWithoutTravel.length;i++){
			let pm = "", th = "";
			for (let j = 0; j < soOnsiteTrueWithoutTravel[i].r_profit_center.length; j++) {
				pm = pm + soOnsiteTrueWithoutTravel[i].r_profit_center[j].project_manager;
				th = th + soOnsiteTrueWithoutTravel[i].r_profit_center[j].team_head;
				if ((j + 1) != soOnsiteTrueWithoutTravel[i].r_profit_center.length) {
					pm = pm + ",";
					th = th + ",";
				}

			}
		      jData.push({
				'so': soOnsiteTrueWithoutTravel[i].so,
				'type': soOnsiteTrueWithoutTravel[i].type,
				'onsite':soOnsiteTrueWithoutTravel[i].onsite_required,
				'per_diem_rate':soOnsiteTrueWithoutTravel[i].per_diem_rate,
				'oproject_manager': pm,
				'oteam_head': th,
				'ostatus': soOnsiteTrueWithoutTravel[i].s_status,
				
			})
			listData = jData;
		}
		await this.tm.getTN("others").setData(listData);
	}
	public async onOnsiteDownload() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is fetching..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}

		let listData = await this.tm.getTN("others").getData();
		let jsonData = [];

		// Build the jsonData array using the fetched data
		for (let index = 0; index < listData.length; index++) {

			jsonData.push({
				'SO': listData[index]?.so,
				'Type': listData[index]?.type,
				'Onsite Required': listData[index]?.onsite,
				'Per Diem Rate': listData[index]?.per_diem_rate,
				'Project Manager': listData[index]?.oproject_manager,
				'Team Head': listData[index]?.oteam_head,
				'Status': listData[index]?.ostatus
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
			{ width: 20 }

		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1","G1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
		});


		XLSX.utils.book_append_sheet(workbook, worksheet, "Blank Functional AreaList");

		// Write workbook to a file
		const filePath = 'Onsite Required True without Per Diem Rate.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();
	}
}


//FINAL-2Jan