import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_feedback_mgr")
export default class p_pms_feedback_mgr extends KloController {
	public async onPageEnter() {
		await this.tm.getTN("showNextButton").setData(true);
		await this.tm.getTN("isAssessor").setData(false);
		await this.tm.getTN("isAssessee").setData(false);
		await this.tm.getTN("quick_filters").setData(["My Feedback", "Assessee Feedback", "Peers Feedback", "Show All"]);
		this.tm.getTN("quick_filter_text").setData({ value: "Showing All" });
		let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { loadAll: true });
		let qInstance = this.tm.getTN("pms_per_empsearch").getData();
		qInstance.loadAll = true;
		qInstance.appraisal_data = currentAnnualPerformance[0]?.ap_id;
		let allEmployeeData = await qInstance.executeP();
		await this.tm.getTN("employee_list").setData(allEmployeeData);
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		const designationList = await this.transaction.getExecutedQuery("d_o2c_designation_master", { loadAll: true, company_code: currentUserCompanyCode[0].company_code }); // Hardcoded company code should be removed.
		const departmentList = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { company_code: currentUserCompanyCode[0].company_code, loadAll: true });
		await this.tm.getTN("department_list").setData(departmentList);
		await this.tm.getTN("designation_list").setData(designationList);
		await this.tm.getTN("all_employee_list").setData(await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true }));
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
		await this.tm.getTN("pms_feedback_list").createEntityP({ feedback_desciption: "Quick Feedback", assessor_type: "Self", date_of_initiation: new Date().getTime(), assessor: loggedInEmpDetail[0]?.employee_id, assessor_name: loggedInEmpDetail[0]?.full_name, feedback_type: "Ad hoc" }, null, null, null, "First", true, true, false);
		this.openDialog("pa_quick_feedback");
	}
	public async onRequestFeedback() {
		let busyDialog = new sap.m.BusyDialog();
		busyDialog.open();
		let loggedInEmpDetail = this.tm
			.getTN("employee_list")
			.getData()
			.filter((e) => e.employee_id.toLowerCase() == this.transaction.$SYSTEM.userID.toLowerCase());
		let assignedKpiId = await this.transaction.getExecutedQuery("q_pms_performance_emp_item", { emp_id: loggedInEmpDetail[0]?.employee_id, loadAll: true });
		let actualKPi = await this.transaction.getExecutedQuery("d_pms_goal_extension", { pg_grop_ext_id: assignedKpiId.map((e) => e.pg_group_ext), loadAll: true });
		await this.tm.getTN("assigned_goals").setData(actualKPi.map((e) => e.pg_grp_ext_desc));
		await this.tm.getTN("pms_feedback_list").createEntityP({ feedback_desciption: "Requested Feedback", is_requested: true, assessor_type: "Self", date_of_initiation: new Date().getTime(), assessee: loggedInEmpDetail[0]?.employee_id, assessee_name: loggedInEmpDetail[0]?.full_name, feedback_type: "Ad hoc" }, null, null, null, "First", true, true, false);
		await this.tm.getTN("isFieldEditable").setData(false);
		this.openDialog("pa_request_feedback");
		busyDialog.close();
	}
	public async onEditRequestFeedback() {
		let feedbackData = this.tm.getTN("pms_feedback_detail").getData();
		if (feedbackData.assessor.toLocaleLowerCase() == this.transaction.$SYSTEM.userID.toLocaleLowerCase() && feedbackData.status != "Submitted") {
			await this.tm.getTN("isFieldEditable").setData(true);
		} else {
			await this.tm.getTN("isFieldEditable").setData(false);
		}
		this.setMode("EDIT");
		// let assignedKpiId = await this.transaction.getExecutedQuery("q_pms_performance_emp_item", { emp_id: loggedInEmpDetail[0]?.employee_id, loadAll: true });
		// let actualKPi = await this.transaction.getExecutedQuery("d_pms_goal_extension", { pg_grop_ext_id: assignedKpiId.map((e) => e.pg_group_ext), loadAll: true });
		// await this.tm.getTN("assigned_goals").setData(actualKPi.map((e) => e.pg_grp_ext_desc));
	}
	public async onCancelRequestFeedback() {
		if (this.transaction.getDirtyBOs().length > 0) await this.refreshTransnode("pms_feedback_list");
		this.closeDialog("pa_request_feedback");
	}
	public async onCancelQuickFeedback() {
		if (this.transaction.getDirtyBOs().length > 0) await this.refreshTransnode("pms_feedback_list");
		this.closeDialog("pa_quick_feedback");
	}
	public async onSubmitQuickFeedback() {
		this.tm.getTN("pms_feedback_detail").setProperty("status", "Submitted");
		await this.tm.commitP("Submitted successfully", "Error While Saving !!!", true, true);
		this.closeDialog("pa_quick_feedback");
	}
	public async onSubmitRequestFeedback() {
		let feedbackData = this.tm.getTN("pms_feedback_detail").getData();
		if (feedbackData.assessor.toLocaleLowerCase() == this.transaction.$SYSTEM.userID.toLocaleLowerCase()) {
			this.tm.getTN("pms_feedback_detail").setProperty("status", "Submitted");
		} else {
			this.tm.getTN("pms_feedback_detail").setProperty("self_status", "Submitted");
		}
		await this.tm.commitP("Submitted successfully", "Error While Saving !!!", true, true);
		this.closeDialog("pa_request_feedback");
	}
	//navigating to feedback detail
	public async navToDetail(oEvent) {
		let index = +this.getPathFromEvent(oEvent).split("/")[2];
		if (this.tm.getTN("pms_feedback_list").getData()[index].feedback_type !== "Ad hoc") await this.navTo({ SS: "s_feedback_detail" }, oEvent);
		else if (this.tm.getTN("pms_feedback_list").getData()[index].is_requested) {
			this.tm.getTN("pms_feedback_list").setActive(index);
			if (this.tm.getTN("pms_feedback_list").getActiveData().assessor.toLocaleLowerCase() == this.transaction.$SYSTEM.userID.toLocaleLowerCase() && this.tm.getTN("pms_feedback_list").getActiveData().status != "Submitted") {
				await this.tm.getTN("isFieldEditable").setData(true);
			} else {
				await this.tm.getTN("isFieldEditable").setData(false);
			}
			this.openDialog("pa_request_feedback");
		} else {
			this.tm.getTN("pms_feedback_list").setActive(index);
			this.openDialog("pa_quick_feedback");
		}
	}
	public async onQuickFilter(oEvent, param) {
		let selectedFilter = oEvent.mParameters.item.mProperties.text;
		// await this.tm.getTN("quick_filter_text").setData({ value: selectedFilter });
		if (selectedFilter == "My Feedback") {
			await this.tm.getTN("quick_filter_text").setData({ value: "My Feedback" });
			return await this.tm.getTN("pms_feedback_list").applyfilterP("assessor", this.transaction.getUserID());
		} else if (selectedFilter == "Assessee Feedback") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Assessee Feedback" });
			return await this.tm.getTN("pms_feedback_list").applyfilterP("assessor_type", "Self");
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
		let activeIndex = this.tm.getTN("r_pms_feedback_skills02").getActiveIndex();
		if (activeIndex == this.tm.getTN("r_pms_feedback_skills02").getData().length - 2) {
			this.tm.getTN("r_pms_feedback_skills02").setActive(++activeIndex);
			return await this.tm.getTN("showNextButton").setData(false);
		}
		this.tm.getTN("r_pms_feedback_skills02").setActive(++activeIndex);
	}
	public async onClickSkill(oEvent) {
		try {
			let oPath = this.getPathFromEvent(oEvent);
			let index = oPath.split("/")[2];
			await this.tm.getTN("enable_final_value_field").setData(false);
			if (+index <= this.tm.getTN("r_pms_feedback_skills02").getData().length - 2) {
				await this.tm.getTN("showNextButton").setData(true);
			}
			await this.tm.getTN("r_pms_feedback_skills02").setActive(index);
			this.openDialog("pa_skill_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onEditDialog() {
		let index = this.tm.getTN("r_pms_feedback_skills02").getActiveIndex();
		if (+index == this.tm.getTN("r_pms_feedback_skills02").getData().length - 1) {
			await this.tm.getTN("showNextButton").setData(false);
		}
		this.setMode("EDIT");
	}
	public async onCloseDialog() {
		await this.refreshTransnode("r_pms_feedback_skills02");
		this.closeDialog("pa_skill_detail");
	}
	public async onSaveEnterFeedback() {
		let assessorType = this.tm.getTN("pms_feedback_detail").getData().assessor_type;
		if (assessorType == "Manager") {
			this.tm.getTN("r_pms_feedback_skill_detail02").setProperty("mgr_status", 1);
			await this.tm.commitP("Saved Successfully", "Error while Saving!!", true, true);
		}
		this.closeDialog("pa_skill_detail");
	}
	public async onSubmitFeedback() {
		let assessorType = this.tm.getTN("pms_feedback_detail").getData().assessor_type;
		let mBox = await this.getMessageBox();
		await mBox.confirm("Are you sure you want to release?", {
			actions: [mBox.Action.YES, mBox.Action.CANCEL],
			emphasizedAction: mBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					let skillCopyData = this.tm.getTN("pms_feedback_detail").getData().r_feedback_skills;
					let skillData = this.tm.getTN("r_pms_feedback_skills02").getData();
					if (assessorType == "Manager") {
						for (let index = 0; index < skillData.length; index++) {
							let managerSkillData = await this.transaction.getExecutedQuery("d_pms_feedback_skill", { fskills_copy_id: skillData[index].fskills_copy_id, loadAll: true });
							managerSkillData[0].feedback_manager_remarks = skillData[index].feedback_manager_remarks;
							managerSkillData[0].feedback_manager_rating = skillData[index].feedback_manager_rating;
							managerSkillData[0].final_score_by_manager = skillData[index].final_score_by_manager;
							managerSkillData[0].final_remarks = skillData[index].final_remarks;
							managerSkillData[0].status = "Submitted";
							skillCopyData[index].feedback_manager_rating = skillData[index].feedback_manager_rating;
							skillCopyData[index].feedback_manager_remarks = skillData[index].feedback_manager_remarks;
							skillCopyData[index].final_score_by_manager = skillData[index].final_score_by_manager;
							skillCopyData[index].final_remarks = skillData[index].final_remarks;
							skillCopyData[index].status = "Submitted";
						}
						this.tm.getTN("pms_feedback_detail").setProperty("status", "Submitted");
					}
					await this.tm.commitP("Saved successfully", "Error while Saving!!", true, true);
				}
			},
		});
	}
	public async navToSkillDetail(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		await this.tm.getTN("r_pms_feedback_skills02").setActive(+oPath.split("/")[2]);
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
