import { KloController } from "kloTouch/jspublic/KloController";
import { Status } from "o2c_v2/util/enum";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_goal_rev_hdr")
export default class p_pms_goal_rev_hdr extends KloController {
	public async onPageEnter(oEvent) {
		let key = oEvent.navToParams.AD ? oEvent.navToParams.AD.key : "";
		let SelectedGoalData = oEvent?.navToParams?.AD;
		if (oEvent?.navToParams?.AD && key !== "upcomingReview") {
			let reviewHdrData = await this.transaction.getExecutedQuery("d_pms_goal_review_hdr", { employee_id: SelectedGoalData.employee_id });
			await this.tm.getTN("pms_goal_review_list").createEntityP(
				{
					manager_name: SelectedGoalData.manager_name,
					manager_id: SelectedGoalData.manager_id,
					employee_name: SelectedGoalData.employee_name,
					employee_id: SelectedGoalData.employee_id,
					performance_group: SelectedGoalData.performance_group,
					p_group_extension: SelectedGoalData.p_group_extension,
					pge_description: SelectedGoalData.pge_description,
					status: "Started",
					track: SelectedGoalData.track,
					hr_id: SelectedGoalData.hr_id,
					goal_rev_hdr_id: reviewHdrData[0]?.goal_rev_hdr_id,
					weightage: SelectedGoalData.weightage,
				},
				"Create Successful",
				"Creation Failed",
				"s_pms_goa_detail",
				"First",
				true,
				true
			);
		} else if (oEvent?.navToParams?.AD && key == "upcomingReview") {
			let searchInstance = this.tm.getTN("pms_goal_review_hdr_search").getData();
			searchInstance.employee_id = SelectedGoalData.employee_id;
			// searchInstance.pg_goal = SelectedGoalData.pg_group;
			// searchInstance.planned_date = new Date();
			// searchInstance.to_date = new Date().setMonth(new Date().getMonth() + 1);
			await searchInstance.executeP();
		} else {
			await this.tm.getTN("status_list").setData(Status.reviewStatus);
			await this.tm.getTN("pms_goal_review_hdr_search").executeP();
		}
	}
	public async onEditDialog() {
		if (!this.tm.getTN("pms_goal_review_hdr_detail").getData().is_emp_submitted_review) return (await this.getMessageBox()).information("Waiting for employee input before you can evaluate this KPI");
		await this.tm.getTN("showNextButton").setData(true);
		this.setMode("EDIT");
		await this.tm.getTN("isDialogEditVis").setData(false);
		let index = this.tm.getTN("r_assigned_kpis").getActiveIndex();
		await this.enableFinalValue(this.tm.getTN("r_assigned_kpis").getData()[index]);
		if (+index == this.tm.getTN("r_assigned_kpis").getData().length - 1) {
			await this.tm.getTN("showNextButton").setData(false);
		}
	}
	public async enableFinalValue(currentData) {
		let mode = this.getMode();
		let headerData = this.tm.getTN("pms_goal_review_hdr_detail").getData();
		if (currentData.item_scope == "Public" && currentData.emp_planned_status == "1" && !headerData.setting_actual_status && (mode == "EDIT" || mode == "Create")) return await this.tm.getTN("enable_final_value_field").setData(true);
		if (currentData.item_scope == "Private" && currentData.mgr_planned_status == "1" && currentData.emp_planned_status !== "1" /* && !headerData.setting_actual_status */ && (mode == "EDIT" || mode == "CREATE")) return await this.tm.getTN("enable_final_value_field").setData(true);
		return await this.tm.getTN("enable_final_value_field").setData(false);
	}
	public async onClickGoal(oEvent) {
		try {
			let oPath = this.getPathFromEvent(oEvent);
			let goalHeaderDetail = this.tm.getTN("pms_goal_review_hdr_detail").getData();
			let index = oPath.split("/")[2];
			await this.tm.getTN("enable_final_value_field").setData(false);
			if (+index <= this.tm.getTN("r_assigned_kpis").getData().length - 2) {
				await this.tm.getTN("showNextButton").setData(true);
			}
			await this.tm.getTN("r_assigned_kpis").setActive(index);
			if (new Date() <= goalHeaderDetail.goal_setting_ed && new Date() >= goalHeaderDetail.goal_setting_sd && !goalHeaderDetail.setting_actual_status) await this.tm.getTN("isDialogEditVis").setData(true);
			else if (new Date() <= goalHeaderDetail.goal_setting_rev_ed && new Date() >= goalHeaderDetail.goal_setting_rev_sd && !goalHeaderDetail.is_mgr_final_sub) await this.tm.getTN("isDialogEditVis").setData(true);
			else await this.tm.getTN("isDialogEditVis").setData(false);
			this.openDialog("pa_goal_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onCloseDialog() {
		await this.refreshTransnode("r_assigned_kpi_detail");
		this.closeDialog("pa_goal_detail");
	}
	public async navToAchievements(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let goalDetail = this.tm.getTN("r_assigned_kpis").getData()[oPath.split("/")[2]];
		let performanceHeaderData = this.tm.getTN("pms_goal_review_hdr_detail").getData();
		let allAchievements = await this.transaction.getExecutedQuery("q_pms_review_achievement", { loadAll: true, manager_id: performanceHeaderData.manager_id });
		for (let data of allAchievements) {
			if (data.employee_id == performanceHeaderData.employee_id) {
				let jsonData = { employee_id: performanceHeaderData.employee_id, goal: goalDetail.pg_group, key: "showAchievement" };
				return await this.navTo({ S: "p_pms_review_achiev", AD: JSON.stringify(jsonData) });
			}
		}
		sap.m["MessageToast"].show(`No achievements found for ${performanceHeaderData.emp_name}`);
	}
	// public async NavToUpcomingReview(oEvent) {
	// 	let oPath = this.getPathFromEvent(oEvent);
	// 	let goalDetail = this.tm.getTN("r_assigned_kpis").getData()[oPath.split("/")[2]];
	// 	let performanceData = this.tm.getTN("r_assigned_kpi_detail").getData();
	// 	let reviewRecords = await this.transaction.getExecutedQuery("q_pms_goal_review_hdr", { loadAll: true, employee_id: performanceData.employee_id });
	// 	if (reviewRecords.length <= 0) return sap.m["MessageToast"].show("No upcoming review!!!");
	// 	let json = { pg_group: goalDetail.pg_group, employee_id: performanceData.employee_id, key: "upcomingReview" };
	// 	this.navTo({ S: "p_pms_goal_review", SS: "s_pms_goa_list", AD: json });
	// }
	public checkEmployeeAchievement() {
		let allKpiData = this.tm.getTN("r_assigned_kpis").getData();
		return allKpiData.filter((e) => e.item_scope == "Public" && !e.actual_value).length > 0 ? true : false;
	}
	public async onSubmit() {
		let messageBox = await this.getMessageBox();
		let bDialog = new sap.m.BusyDialog({ text: "Submitting review please wait..." });
		let performanceData = this.tm.getTN("pms_goal_review_hdr_detail").getData();
		let allKpis = this.tm.getTN("r_assigned_kpis").getData();
		let isEmpAchiementSub = this.checkEmployeeAchievement();
		if (isEmpAchiementSub) return sap.m["MessageToast"].show("Cannot submit final values — employee has not submitted achieved values yet.");
		await messageBox.confirm("Please confirm that you’ve reviewed all KPIs before submitting.", {
			actions: [messageBox.Action.YES, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					try {
						bDialog.open();
						let behind, onTrack, ahead;
						let performanceItems = await this.transaction.getExecutedQuery("d_pms_performance_emp_item", { pgit_id: allKpis.map((e) => e.goal_ref_id), loadAll: true });
						for (let goal of allKpis) {
							if (goal.track == "Ahead") ahead = true;
							else if (goal.track == "Behind") behind = true;
							else if (goal.track == "On Track") onTrack = true;
							// goal.final_val_status = "Submitted";
							// goal.review_status = "Submitted";
							for (let item of performanceItems) {
								if (item.pg_group == goal.performance_group && goal.p_group_extension == item.pg_group_ext) {
									item.track = goal.track;
									item.final_planned_value = goal.final_planned_value;
								}
								// item.status = "Completed"; Will show what will be the status for header.
							}
						}
						let rolloutData = await this.transaction.getExecutedQuery("d_pms_apg_rollout", { loadAll: true, apg_id: performanceData.rollout_id });
						let rolloutEmp = await rolloutData[0].r_rollout_employees.fetch();
						for (let emp of rolloutEmp) {
							if (emp.emp_id == performanceData.employee_id) {
								// emp.status = "Completed";
								emp.track = behind ? "Behind" : ahead ? "Ahead" : "On Track";
							}
						}
						this.tm.getTN("pms_goal_review_hdr_detail").setProperty("is_mgr_submitted_review", 1);
						this.tm.getTN("pms_goal_review_hdr_detail").setProperty("actual_date", new Date());
						// this.tm.getTN("pms_goal_review_hdr_detail").setProperty("status", "Completed");
						await this.tm.commitP(`KPI review for ${performanceData.employee_name} submitted successfully.`, "Error while submitting", true, true);
					} catch (e) {
						throw new Error(e);
					} finally {
						bDialog.close();
					}
				}
			},
		});
	}
	public async onSaveNext() {
		await this.tm.commitP("Save successful", "Save Failed", true, false);
		let activeIndex = this.tm.getTN("r_assigned_kpis").getActiveIndex();
		if (activeIndex == this.tm.getTN("r_assigned_kpis").getData().length - 2) {
			this.tm.getTN("r_assigned_kpis").setActive(++activeIndex);
			return await this.tm.getTN("showNextButton").setData(false);
		}
		this.tm.getTN("r_assigned_kpis").setActive(++activeIndex);
	}
	public async onSaveDialogData() {
		await this.tm.commitP("Saved successfully", "Error while saving.", true, true);
		this.closeDialog("pa_goal_detail");
	}
	// public async getPlannedCount() {
	// 	let listData = await this.tm.getTN("pms_goal_review_hdr_detail").getData().r_goal_review.fetch();
	// 	let totalCount = listData.length;
	// 	// let plannedCount = listData.filter((e) => e.pge_metric_value);
	// 	let finalPlannedCount = listData.filter((e) => e.fina);
	// 	// await this.tm.getTN("plannedCount").setData(`(${plannedCount.length} / ${totalCount})`);
	// 	await this.tm.getTN("finalPlannedCount").setData(`(${finalPlannedCount.length} / ${totalCount})`);
	// 	if (!this.showInformationMgsOneTime && this.tm.getTN("pms_performance_emp_hdr_detail").getData().is_final_planned_submitted && !this.tm.getTN("pms_performance_emp_hdr_detail").getData().setting_actual_status) {
	// 		(await this.getMessageBox()).information("Final values are saved. Please" + (this.tm.getTN("pms_performance_emp_hdr_detail").getData().feedback_type == "360" ? ` add the reviewers (if not added) and ` : " ") + "complete the goal setting.");
	// 		this.showInformationMgsOneTime = true;
	// 	}
	// 	// this.tm.getTN("quick_filter_text").setData({ value: "Quick Filter" });
	// }
	public async onClickRefresh() {
		await this.tm.getTN("pms_goal_review_hdr_list").getData().refreshP();
		let qInstance = <any>await this.transaction.getQueryP("d_pms_goal_review");
		await qInstance.refreshP();
	}
	public onSearchSettingStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Completed") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_mgr_submitted_review", 1);
		}
		if (value == "In-progress") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_mgr_submitted_review", false);
		}
	}
	public onEnterEmployeePlane(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Completed") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_emp_submitted_review", 1);
		}
		if (value == "In-progress") {
			this.tm.getTN("pms_goal_review_hdr_search").setProperty("is_emp_submitted_review", false);
		}
	}
	public async onResetSearch() {
		this.getActiveControlById("setting_status", "s_pms_per_search").setValue(null);
		this.getActiveControlById("employee_plan_s", "s_pms_per_search").setValue(null);
	}
}
