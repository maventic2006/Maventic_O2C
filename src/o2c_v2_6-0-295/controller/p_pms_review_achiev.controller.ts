import { System } from "kloBo/kloCommon/System/System";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_review_achiev")
export default class p_pms_review_achiev extends KloController {
	public async onPageEnter(oEvent) {
		await this.tm.getTN("status_items").setData(["In-Progress", "Approved", "Rejected"]);
		await this.tm.getTN("achievement_type_items").setData(["Training", "Certification", "Customer Success", "Conference"]);
		let goalData = oEvent.navToParams?.AD ? JSON.parse(oEvent.navToParams?.AD).goalData : "";
		if (oEvent.navToParams?.AD && goalData.key == "showAchievement") {
			let instance = this.tm.getTN("pms_achievement_search").getData();
			instance.goal_group = goalData.goal;
			instance.employe = goalData.employee_id;
			await instance.executeP();
		} else {
			await this.tm.getTN("pms_achievement_search").executeP();
		}
	}

	public async onAdd(oEvent) {
		try {
			// After moving to O2C, remove the hard coded value
			let currentEmpDetail = await this.transaction.getExecutedQuery("q_employ_filter", { employee_id: this.transaction.getUserID(), loadAll: true });
			// let empManager = await this.transaction.getExecutedQuery("q_o2c_team_head_manager", { employee_id: currentEmpDetail[0].line_manager, loadAll: true });
			let empManager = await this.transaction.getExecutedQuery("q_employ_filter", { employee_id: currentEmpDetail[0].line_manager, loadAll: true });
			await this.tm.getTN("pms_achievement_list").createEntityP({ date_of_creation: new Date().getTime(), employee_id: this.transaction.getUserID(), manager_id: empManager[0].employee_id, manager_name: empManager[0].full_name }, null, null, "s_achieve_detail", "First", true, true, false);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmit(oEvent, param) {
		let busyDialog = new sap.m.BusyDialog("Saving...");
		try {
			let oData = this.tm.getTN("pms_achievement_list");
			for (let index of oData.getSelectedIndices()) {
				this.tm.getTN("pms_achievement_list").getData()[index].manager_status = param.param;
				this.tm.getTN("pms_achievement_list").getData()[index].mgr_remarks = this.tm.getTN("remarks").getData();
			}
			await this.tm.commitP("Approved successfully", "Failed while Saving", true, true);
		} catch (e) {
			throw new Error(e);
		} finally {
			await this.closeDialog(param.param == "Approved" ? "pa_dialog" : param.param == "Reject" ? "pa_reject" : "pa_rework");
			busyDialog.close();
		}
	}
	public async onDetailSubmit() {
		this.tm.getTN("pms_achievement_detail").setProperty("manager_status", "Approved");
		this.tm.getTN("pms_achievement_detail").setProperty("mgr_remarks", this.tm.getTN("remarks").getData());
		try {
			await this.tm.commitP("Saved Successfully", "Failed while Saving", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onClickReject() {
		let oData = this.tm.getTN("pms_achievement_list");
		if (!(oData.getSelectedIndices().length > 0)) return (await this.getMessageBox()).information("No Items Selected");
		await this.tm.getTN("remarks").setData(null);
		await this.openDialog("pa_reject");
	}
	public async onReject() {
		let oData = this.tm.getTN("pms_achievement_list");
		for (let index of oData.getSelectedIndices()) {
			this.tm.getTN("pms_achievement_list").getData()[index].manager_status = "Rejected";
			this.tm.getTN("pms_achievement_list").getData()[index].mgr_remarks = this.tm.getTN("remarks").getData();
		}
		try {
			await this.tm.commitP("Saved Successfully", "Failed while Saving", true, true);
		} catch (e) {
			console.log(e);
		}
		await this.openDialog("pa_reject");
	}
	public async onClickRework() {
		let oData = this.tm.getTN("pms_achievement_list");
		if (!(oData.getSelectedIndices().length > 0)) return (await this.getMessageBox()).information("No Item Selected");
		await this.tm.getTN("remarks").setData(null);
		await this.openDialog("pa_rework");
	}
	public async onApprove(oEvent) {
		let selectedIndices = this.tm.getTN("pms_achievement_list").getSelectedIndices();
		if (selectedIndices.length <= 0) return (await this.getMessageBox()).information("No Item Selected");
		await this.tm.getTN("remarks").setData(null);
		await this.openDialog("pa_dialog");
	}
	public async showAttachment(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let itemData = this.tm.getTN("r_pms_attachment_list").getData()[oPath.split("/")[2]].attachment;
		let serverUrl = System.getInstance().getServerURL();
		let url = serverUrl + (await itemData.getAttachmentP());
		await this.tm.getTN("attachment_path").setData(url);
		this.openDialog("pa_attach");
		//
		console.log(serverUrl);
	}
	public async downloadAttachment(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		await this.tm.getTN("r_pms_attachment_list").getData()[oPath.split("/")[2]].attachment.downloadAttachP();
	}
}
