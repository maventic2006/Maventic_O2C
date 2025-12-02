import { System } from "kloBo/kloCommon/System/System";
import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
import KloAttach from "kloTouch/KloControl/KloAttach";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_emp_achievemen")
export default class p_pms_emp_achievemen extends KloController {
	public async onPageEnter(oEvent) {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ppms");
		await this.tm.getTN("status_items").setData(["In-Progress", "Submitted"]);
		await this.tm.getTN("achievement_type_items").setData(["Training", "Certification", "Customer Success", "Conference"]);
		let goalData = oEvent.navToParams?.AD ? JSON.parse(oEvent.navToParams?.AD).goalData : "";
		if (oEvent.navToParams?.AD && goalData.key == "showAchievement") {
			let instance = this.tm.getTN("pms_achievement_search").getData();
			instance.goal_group = goalData.goal;
			await instance.executeP();
		} else if (oEvent.navToParams?.AD && goalData.key !== "showAchievement" && goalData) {
			await this.tm.getTN("pms_achievement_list").createEntityP({ date_of_creation: new Date().getTime(), emp_name: goalData.employee_name, employee_id: goalData.employee_id, manager_id: goalData.manager_id, manager_name: goalData.manager_name, link_goal: goalData.pg_group, pge_description: goalData.pg_group_ext }, null, null, null, "First", true, true, false);
		} else {
			await this.tm.getTN("pms_achievement_search").executeP();
		}
	}
	public async onAddAchievement(goal?) {
		try {
			//getting employee's manager
			let currentEmployeeDetail = await this.transaction.getExecutedQuery("q_employ_filter", { loadAll: true, employee_id: this.transaction.getUserID() });
			let empManager = await this.transaction.getExecutedQuery("q_employ_filter", { employee_id: currentEmployeeDetail[0].line_manager, loadAll: true });
			// let empManager = await this.transaction.getExecutedQuery("q_o2c_team_head_manager", { employee_id: currentEmployeeDetail[0].line_manager, loadAll: true }); // as we are not considering line manager in q_o2c_team_head_manager query no data will come.
			await this.tm.getTN("pms_achievement_list").createEntityP({ date_of_creation: new Date().getTime(), /*s_object_type: "0"*/ emp_name: currentEmployeeDetail[0]?.full_name, employee_id: this.transaction.getUserID(), manager_id: currentEmployeeDetail[0]?.line_manager, manager_name: empManager[0].full_name }, null, null, "s_pms_ach_detail", "First", true, true, false);
		} catch (e) {
			console.log(e);
		}
	}
	public async onUploadAttachment(oEvent) {
		this.setMode("CREATE");
		try {
			let attachmentData = await this.tm
				.getTN("pms_achievement_detail")
				.getData()
				.r_attachments.newEntityP(0, { achievement_id: this.tm.getTN("pms_achievement_detail").getData().achievement_id });
			let oData = <KloAttach>this.getActiveControlById("attachment", "s_attachment");
			oData.setValue(attachmentData.attachment);
			await oData.openKloAttach();
			oData.attachEventOnce("onAfterSave", (e) => {
				this.tm.getTN("pms_achievement_detail").$M.checkUpdate(true);
			});
		} catch (e) {
			throw new Error(e);
		}
	}

	public async onSelectAchievementDate(oEvent) {
		try {
			let achievement_date = new Date(oEvent.getParameters().value);
			// getting data from appraisal cycle may cause conflicts so better check first in appraisal employee table. If emp is present in any of the appraisal then we can get appraisal cycle details from there.
			let appraisalData = await this.transaction.getExecutedQuery("d_pms_appraisal_cycle", { loadAll: true });
			for (let data of appraisalData) {
				if (data.from_date <= achievement_date && data.to_date >= achievement_date) {
					this.tm.getTN("pms_achievement_detail").setProperty("appraisal_cycle", `${this.getAppraisalPeriod(data.from_date.getMonth())} ${data.from_date.getDate()}, ${data.from_date.getFullYear()} - ${this.getAppraisalPeriod(data.to_date.getMonth())} ${data.to_date.getDate()}, ${data.to_date.getFullYear()}`);
					this.tm.getTN("pms_achievement_detail").setProperty("appraisal_year", data.from_date.getFullYear());
					this.tm.getTN("pms_achievement_detail").setProperty("appraisal_starts_on", data.from_date);
					this.tm.getTN("pms_achievement_detail").setProperty("appraisal_ends_on", data.to_date);
				}
			}
		} catch (e) {
			throw new Error(e);
		}
	}
	public getAppraisalPeriod(month) {
		switch (month) {
			case 0:
				return "Jan";
			case 1:
				return "Feb";
			case 2:
				return "Mar";
			case 3:
				return "Apr";
			case 4:
				return "May";
			case 5:
				return "Jun";
			case 6:
				return "Jul";
			case 7:
				return "Aug";
			case 8:
				return "Sept";
			case 9:
				return "Oct";
			case 10:
				return "Nov";
			case 11:
				return "Dec";
		}
	}
	public async onSubmitSelectedManager() {
		//
		try {
			let selectedManagerIndex = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getSelectedIndices();
			let selectedManagerData = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getData()[selectedManagerIndex];
			this.tm.getTN("pms_achievement_detail").setProperty("manager_name", selectedManagerData.full_name);
			this.tm.getTN("pms_achievement_detail").setProperty("manager_id", selectedManagerData.employee_id);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_manager_list");
		}
	}
	public async onSaveAchievement() {
		try {
			let currentEmployee = await this.transaction.getExecutedQuery("q_employ_filter", { employee_id: this.transaction.getUserID(), loadAll: true });
			this.tm.getTN("pms_achievement_detail").setProperty("emp_name", currentEmployee[0]?.full_name);
			this.tm.getTN("pms_achievement_detail").setProperty("employee_id", currentEmployee[0]?.employee_id);
			await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmitAchievement() {
		try {
			let selectedIndices = this.tm.getTN("pms_achievement_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No item selected");
			let messageBox = await this.getMessageBox();
			await messageBox.confirm("Are you sure you want to submit ?", {
				actions: [messageBox.Action.OK, messageBox.Action.CANCEL],
				emphasizedAction: messageBox.Action.OK,
				onClose: async (oAction) => {
					if (oAction == "OK") {
						for (let index of selectedIndices) {
							this.tm.getTN("pms_achievement_list").getData()[index].status = "Submitted";
						}
					}
					await this.tm.commitP("Achievement Submitted Successfully", "Error While Submitting !!!", true, true);
				},
			});
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmitAchiveFromDetail() {
		try {
			let messageBox = await this.getMessageBox();
			await messageBox.confirm("Are you sure you want to submit ?", {
				actions: [messageBox.Action.OK, messageBox.Action.CANCEL],
				emphasizedAction: messageBox.Action.OK,
				onClose: async (oAction) => {
					if (oAction == "OK") {
						this.tm.getTN("pms_achievement_detail").getData().status = "Submitted";
					}
					await this.tm.commitP("Achievement Submitted Successfully", "Error While Submitting !!!", true, true);
				},
			});
		} catch (e) {
			throw new Error(e);
		}
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
