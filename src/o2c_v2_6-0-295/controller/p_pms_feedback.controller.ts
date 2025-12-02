import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_feedback")
export default class p_pms_feedback extends KloController {
	public async onPageEnter() {
		await this.tm.getTN("showNextButton").setData(true);
		await this.tm.getTN("isAssessor").setData(false);
		await this.tm.getTN("isAssessee").setData(false);
		await this.tm.getTN("quick_filters").setData(["My Feedback", "Peers Feedback", "Manager Feedback", "Show All"]);
		this.tm.getTN("quick_filter_text").setData({ value: "Showing All" });
		let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { loadAll: true });
		let qInstance = this.tm.getTN("pms_per_empsearch").getData();
		qInstance.appraisal_data = currentAnnualPerformance[0]?.ap_id;
		qInstance.loadAll = true;
		let allEmployeeData = await qInstance.executeP();
		await this.tm.getTN("employee_list").setData(allEmployeeData);
	}
	public async onOpenDialog() {
		await this.tm.getTN("skill_item").setData();
		await this.openDialog("pageArea03");
	}
	public async onRaiseFeedback() {
		let loggedInEmpDetail = this.tm
			.getTN("employee_list")
			.getData()
			.filter((e) => e.employee_id.toLowerCase() == this.transaction.$SYSTEM.userID.toLowerCase());
		await this.tm.getTN("pms_feedback_list").createEntityP({ assessor_type: "Self", date_of_initiation: new Date().getTime(), assessor: loggedInEmpDetail[0]?.employee_id, assessor_name: loggedInEmpDetail[0]?.full_name }, null, null, "s_feedback_detail", "First", true, true, false);
	}
	public async onAddQuickFeedback() {
		let loggedInEmpDetail = this.tm
			.getTN("employee_list")
			.getData()
			.filter((e) => e.employee_id.toLowerCase() == this.transaction.$SYSTEM.userID.toLowerCase());
		await this.tm.getTN("pms_feedback_list").createEntityP({ assessor_type: "Self", date_of_initiation: new Date().getTime(), assessor: loggedInEmpDetail[0]?.employee_id, assessor_name: loggedInEmpDetail[0]?.full_name, feedback_type: "Ad hoc" }, null, null, "s_feedback_detail", "First", true, true, false);
	}
	public async onRequestFeedback() {
		let loggedInEmpDetail = this.tm
			.getTN("employee_list")
			.getData()
			.filter((e) => e.employee_id.toLowerCase() == this.transaction.$SYSTEM.userID.toLowerCase());
		await this.tm.getTN("pms_feedback_list").createEntityP({ assessor_type: "Self", date_of_initiation: new Date().getTime(), assessee: loggedInEmpDetail[0]?.employee_id, assessee_name: loggedInEmpDetail[0]?.full_name }, null, null, "s_feedback_detail", "First", true, true, false);
	}
	public async onQuickFilter(oEvent, param) {
		let selectedFilter = oEvent.mParameters.item.mProperties.text;
		// await this.tm.getTN("quick_filter_text").setData({ value: selectedFilter });
		if (selectedFilter == "My Feedback") {
			await this.tm.getTN("quick_filter_text").setData({ value: "My Feedback" });
			return await this.tm.getTN("pms_feedback_list").applyfilterP("assessor", this.transaction.getUserID());
		} else if (selectedFilter == "Manager Feedback") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Manager Feedback" });
			return await this.tm.getTN("pms_feedback_list").applyfilterP("assessor_type", "Manager");
		} else if (selectedFilter == "Peers Feedback") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Peers Feedback" });
			return await this.tm.getTN("pms_feedback_list").applyfilterP("assessor_type", "Peer");
		}
		await this.tm.getTN("pms_feedback_list").applyfilterP("assessee", "");
		await this.tm.getTN("quick_filter_text").setData({ value: "Showing All" });
	}
	public async getStatus(assessorType, status, peerStatus, selfStatus) {
		if (assessorType == "Self") return selfStatus;
		if (assessorType == "Peer") return peerStatus;
		return status;
	}
	public async isEditButtonEnable() {
		let currentLoggedInUser = this.transaction.getUserID();
		let detail = this.tm.getTN("pms_feedback_detail").getData();
		let assessor_type01 = this.checkAccessorType(detail.assessor_type);
		let status = assessor_type01 == "status" ? detail.status : assessor_type01 == "self_status" ? detail.self_status : detail.peer_status;
		if (detail.assessor.toLowerCase() == currentLoggedInUser.toLocaleLowerCase() && status !== "Submitted") {
			return true;
		}
		return false;
	}

	public checkAccessorType(assessor_type) {
		if (assessor_type == "Self") return "self_status";
		else if (assessor_type == "Manager") return "status";
		return "peers_status";
	}
	public async onSelectAssessee() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			await this.tm.getTN("isAssessee").setData(true);
			await this.tm.getTN("isAssessor").setData(false);

			this.openDialog("pa_emp_list");
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSelectAssessor() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			await this.tm.getTN("isAssessor").setData(true);
			await this.tm.getTN("isAssessee").setData(false);
			this.openDialog("pa_emp_list");
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmitAssessor() {
		let selectedIndex = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No Items Selected");
		let selectedEmployee = this.tm.getTN("pms_per_list").getData()[selectedIndex[0]];
		this.tm.getTN("pms_feedback_detail").setProperty("assessor", selectedEmployee.employee_id);
		this.tm.getTN("pms_feedback_detail").setProperty("assessor_name", selectedEmployee.full_name);
		this.closeDialog("pa_emp_list");
	}
	public async onSubmitAssessee() {
		let selectedIndex = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No Items Selected");
		let selectedEmployee = this.tm.getTN("pms_per_list").getData()[selectedIndex[0]];
		this.tm.getTN("pms_feedback_detail").setProperty("assessee", selectedEmployee.employee_id);
		this.tm.getTN("pms_feedback_detail").setProperty("assessee_name", selectedEmployee.full_name);
		this.closeDialog("pa_emp_list");
	}
	public async onSaveNext() {
		await this.tm.commitP("Save successful", "Save Failed", true, false);
		let activeIndex = this.tm.getTN("r_pms_feedback_skills").getActiveIndex();
		if (activeIndex == this.tm.getTN("r_pms_feedback_skills").getData().length - 2) {
			this.tm.getTN("r_pms_feedback_skills").setActive(++activeIndex);
			return await this.tm.getTN("showNextButton").setData(false);
		}
		this.tm.getTN("r_pms_feedback_skills").setActive(++activeIndex);
	}
	public async onClickSkill(oEvent) {
		try {
			let oPath = this.getPathFromEvent(oEvent);
			let index = oPath.split("/")[2];
			await this.tm.getTN("enable_final_value_field").setData(false);
			if (+index <= this.tm.getTN("r_pms_feedback_skills").getData().length - 2) {
				await this.tm.getTN("showNextButton").setData(true);
			}
			await this.tm.getTN("r_pms_feedback_skills").setActive(index);
			this.openDialog("pa_skill_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onEditDialog() {
		let index = this.tm.getTN("r_pms_feedback_skills").getActiveIndex();
		if (+index == this.tm.getTN("r_pms_feedback_skills").getData().length - 1) {
			await this.tm.getTN("showNextButton").setData(false);
		}
		this.setMode("EDIT");
	}
	public async onCloseDialog() {
		await this.refreshTransnode("r_pms_feedback_skills");
		this.closeDialog("pa_skill_detail");
	}
	public async onSaveEnterFeedback() {
		let assessorType = this.tm.getTN("pms_feedback_detail").getData().assessor_type;
		if (assessorType == "Self") {
			this.tm.getTN("r_pms_feedback_skill_detail").setProperty("self_status", 1);
		}
		if (assessorType == "Peers") {
			this.tm.getTN("r_pms_feedback_skill_detail").setProperty("peer_status", 1);
		}
		if (assessorType == "Manager") {
			this.tm.getTN("r_pms_feedback_skill_detail").setProperty("mgr_status", 1);
		}
		await this.tm.commitP("Saved Successfully", "Error while Saving!!", true, true);
		this.closeDialog("pa_skill_detail");
	}
	public async onSubmitFeedback() {
		let assessorType = this.tm.getTN("pms_feedback_detail").getData().assessor_type;
		let mBox = await this.getMessageBox();
		await mBox.confirm("Are you sure you want to submit?", {
			actions: [mBox.Action.YES, mBox.Action.CANCEL],
			emphasizedAction: mBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					let skillCopyData = this.tm.getTN("pms_feedback_detail").getData().r_feedback_skills_copy;
					let skillData = this.tm.getTN("r_pms_feedback_skills").getData();
					if (assessorType == "Self") {
						for (let index = 0; index < skillData.length; index++) {
							let managerSkillData = await this.transaction.getExecutedQuery("d_pms_feedback_skill_copy", { fskills_copy_id: skillData[index].fskills_copy_id, loadAll: true });
							managerSkillData[0].feedback = skillData[index].feedback;
							managerSkillData[0].peers_rating = skillData[index].peers_rating;
							managerSkillData[0].employee_rating = skillData[index].employee_rating;
							managerSkillData[0].employee_remarks = skillData[index].employee_remarks;
							managerSkillData[0].self_status = "Submitted";
							skillCopyData[index].feedback = skillData[index].feedback;
							skillCopyData[index].peers_rating = skillData[index].peers_rating;
							skillCopyData[index].employee_rating = skillData[index].employee_rating;
							skillCopyData[index].employee_remarks = skillData[index].employee_remarks;
							skillCopyData[index].self_status = "Submitted";
						}
						this.tm.getTN("pms_feedback_detail").setProperty("self_status", "Submitted");
					}
					if (assessorType == "Peers") {
						for (let index = 0; index < skillData.length; index++) {
							skillCopyData[index].feedback = skillData[index].feedback;
							skillCopyData[index].peers_rating = skillData[index].peers_rating;
							skillCopyData[index].employee_rating = skillData[index].employee_rating;
							skillCopyData[index].employee_remarks = skillData[index].employee_remarks;
							skillCopyData[index].peers_status = "Submitted";
						}
						this.tm.getTN("pms_feedback_detail").setProperty("peer_status", "Submitted");
					}
					await this.tm.commitP("Saved Successfully", "Error while Saving!!", true, true);
				}
			},
		});
	}
	public async navToSkillDetail(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		await this.tm.getTN("r_pms_feedback_skills").setActive(+oPath.split("/")[2]);
		this.openDialog("pa_skill_detail");
	}
	public async onEnterStatus(oEvent) {
		let enteredValue = oEvent.mParameters.value;
		let is_peer: boolean = true,
			is_self: boolean = true;
		let feedbackList = this.tm.getTN("pms_feedback_list").getData();
		for (let feedback of feedbackList) {
			if (feedback.peers_status && feedback.peers_status != enteredValue) is_peer = false;
			if (feedback.self_status && feedback.self_status != enteredValue) is_self = false;
		}
		if (is_peer) this.tm.getTN("pms_feedback_search").setProperty("peers_status", enteredValue);
		if (is_self) this.tm.getTN("pms_feedback_search").setProperty("self_status", enteredValue);
	}
}
