import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
import { Status } from "o2c_v2/util/enum";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_emp_performanc")
export default class p_pms_emp_performanc extends KloController {
	public async onPageEnter() {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ppms");
		await this.tm.getTN("showNextButton").setData(true);
		await this.tm.getTN("quick_filters").setData(["Show Setting Pending", "Show Review Pending", "Show On Track", "Show All"]);
		this.tm.getTN("quick_filter_text").setData({ value: "Quick Filter" });
		await this.tm.getTN("review_items").setData(Status.reviewStatus);
		await this.tm.getTN("status_list").setData(["Planned", "Planning Pending", "NA"]);
		await this.tm.getTN("status_list_emp").setData(["Planned", "Planning Pending", "Waiting For Manager", "NA"]); //
		await this.tm.getTN("status_list_agreed").setData(["Pending", "Finalized", "Missed by MGR", "Missed by EMP", "Under Review"]);
	}
	public async onUploadEmpPlannedValue() {
		let busyDialog = new sap.m.BusyDialog({ text: "Submitting planned KPI values..." });
		busyDialog.open();
		try {
			let flag = true;
			let empPerformanceData = this.tm.getTN("r_emp_performance_list").getData();
			for (let empData of empPerformanceData) {
				if (empData.item_scope == "Public" && empData.emp_planned_value) {
					empData.emp_planned_status = "1";
				} else if (empData.item_scope !== "Private") {
					flag = false;
					return sap.m["MessageToast"].show("Can not save as planned value is missing..");
				}
			}
			if (flag) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_emp_planned_submitted", true);
			await this.tm.commitP("Your planned KPI values have been submitted", "Failed while submitting planned KPI values.", true, true);
			await this.getPlannedCount();
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async getGoalRemaks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_group", { loadAll: true, pg_group_id: this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]].pg_group });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0].goal_remarks ? GoalData[0].goal_remarks : "No Information.");
	}
	public async onSaveNext() {
		await this.tm.commitP("Save successful", "Save Failed", true, false);
		let activeIndex = this.tm.getTN("r_emp_performance_list").getActiveIndex();
		if (activeIndex == this.tm.getTN("r_emp_performance_list").getData().length - 2) {
			this.tm.getTN("r_emp_performance_list").setActive(++activeIndex);
			return await this.tm.getTN("showNextButton").setData(false);
		}
		this.tm.getTN("r_emp_performance_list").setActive(++activeIndex);
	}
	public async onClickGoal(oEvent) {
		try {
			let oPath = this.getPathFromEvent(oEvent);
			let goalHeaderDetail = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
			let activeIndex = oPath.split("/")[2];
			if (+activeIndex <= this.tm.getTN("r_emp_performance_list").getData().length - 2) {
				await this.tm.getTN("showNextButton").setData(true);
			}
			await this.tm.getTN("r_emp_performance_list").setActive(activeIndex);
			if (new Date() <= goalHeaderDetail.goal_setting_ed && new Date() >= goalHeaderDetail.goal_setting_sd && !goalHeaderDetail.is_emp_planned_submitted) await this.tm.getTN("isDialogEditVis").setData(true);
			else if (new Date() <= goalHeaderDetail.goal_setting_rev_ed && new Date() >= goalHeaderDetail.goal_setting_rev_sd && !goalHeaderDetail.is_emp_target_sub) await this.tm.getTN("isDialogEditVis").setData(true);
			else await this.tm.getTN("isDialogEditVis").setData(false);
			this.openDialog("pa_goal_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onEditDialog() {
		this.setMode("EDIT");
		await this.tm.getTN("isDialogEditVis").setData(false);
		let index = this.tm.getTN("r_emp_performance_list").getActiveIndex();
		if (+index == this.tm.getTN("r_emp_performance_list").getData().length - 1) {
			await this.tm.getTN("showNextButton").setData(false);
		}
	}
	public async onSubmitPlannedValue() {
		try {
			if (this.tm.getTN("pms_performance_emp_hdr_detail").getData().is_emp_planned_submitted) {
				this.tm.getTN("r_emp_performance_detail").setProperty("emp_planned_status", "1");
			}
			await this.tm.commitP("Save Successful", "Save Failed", true, true);
			await this.getPlannedCount();
			this.closeDialog("pa_goal_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onCloseDialog() {
		await this.refreshTransnode("r_emp_performance_detail");
		this.closeDialog("pa_goal_detail");
	}
	public async onEmpPerformance(oEvent) {
		// let flag = false;
		// let oThis = this;
		// let oSection = this.getActiveControlById(null, "s_card_list");
		// oSection.addEventDelegate({
		// 	onAfterRendering: function (oEvent) {
		// 		if (flag) return;
		// 		let oPerFormanceDetail = oThis.tm.getTN("pms_performance_emp_hdr_detail").getData();
		// 		let sUserLoginID = oThis.transaction.getUserID();
		// 		if (oPerFormanceDetail.manager_id !== sUserLoginID) {
		// 			let aFilter = new sap.ui.model.Filter({
		// 				filters: [new sap.ui.model.Filter("item_scope", sap.ui.model.FilterOperator.EQ, "Public")],
		// 			});
		// 			let oBindings = oSection.getBinding("items");
		// 			(<sap.ui.model.json.JSONListBinding>oBindings).filter(aFilter);
		// 			flag = true;
		// 		}
		// 	},
		// });
		// await this.tm.getTN("r_emp_performance_list").applyFilterP("item_scope", "Public");
		await this.getPlannedCount();
	}
	public async getPlannedCount() {
		let listData = await this.tm.getTN("pms_performance_emp_hdr_detail").getData().r_emp_performance.fetch();
		let totalCount = listData.filter((e) => e.item_scope == "Public");
		let plannedCount = totalCount.filter((e) => e.emp_planned_value);
		await this.tm.getTN("plannedCount").setData(`(${plannedCount.length} / ${totalCount.length})`);
	}
	public async onQuickFilter(oEvent, param) {
		let selectedFilter = oEvent.mParameters.item.mProperties.text;
		// await this.tm.getTN("quick_filter_text").setData({value : selectedFilter});
		if (selectedFilter == "Show Setting Pending") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Setting Pending" });
			return this.filterData("emp_planned_status", "pending");
		} else if (selectedFilter == "Show Review Pending") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Review Pending" });
			return this.filterData("review_actual_status", "pending"); // later we have to change this review pID
		} else if (selectedFilter == "Show All") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Showing All" });
			return this.filterData("", null);
		}
		await this.tm.getTN("quick_filter_text").setData({ value: "On Track" });
		this.filterData("track", "On Track");
	}
	public filterData(pID, value) {
		let oSection = this.getActiveControlById(null, "s_card_list");
		let aFilter;
		if (!pID) {
			aFilter = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("item_scope", sap.ui.model.FilterOperator.EQ, "Public")],
			});
		}
		if (value !== null) {
			if (value == "pending") value = null; // making the value as null to get all the pending items. as by default null value is maintained.
			aFilter = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("item_scope", sap.ui.model.FilterOperator.EQ, "Public"), new sap.ui.model.Filter(pID, sap.ui.model.FilterOperator.EQ, value)],
				and: true,
			});
		}
		let oBindings = oSection.getBinding("items");
		(<sap.ui.model.json.JSONListBinding>oBindings).filter(aFilter);
	}
	public async getGoalExtensionRemarks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_extension", { loadAll: true, pg_grop_ext_id: this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]].pg_group_ext });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0]?.remarks ? GoalData[0].remarks : "No Information.");
	}
	public async onCreateAchievementFromSelectedGoal(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let headerData = await this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let goalDetail = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		this.navTo({ S: "p_pms_emp_achievemen", SS: "s_pms_ach_detail", AD: JSON.stringify({ goalData: { pg_group: goalDetail.pg_group, pg_group_ext: goalDetail.pg_group_ext, manager_id: headerData.manager_id, manager_name: headerData.mgr_name, employee_id: headerData.employee_id, employee_name: headerData.emp_name } }) });
	}
	public async navToAchievements(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let goalDetail = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		let performanceHeaderData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let allAchievements = await this.transaction.getExecutedQuery("q_pms_emp_achievement", { loadAll: true, employee_id: performanceHeaderData.employee_id });
		//Looping through all the achievements and checking any achievement is present for current employee.
		for (let data of allAchievements) {
			if (data.link_goal == goalDetail.pg_group && data.employee_id == performanceHeaderData.employee_id) {
				let jsonData = { employee_id: performanceHeaderData.employee_id, goal: goalDetail.pg_group, key: "showAchievement" };
				return await this.navTo({ S: "p_pms_emp_achievemen", SS: "s_pms_ach_list", AD: JSON.stringify({ goalData: jsonData }) });
			}
		}
		sap.m["MessageToast"].show(`Looks like you haven’t added any achievements yet.`);
	}
	public async NavToUpcomingReview(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let goalDetail = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		let performanceData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let reviewRecords = await this.transaction.getExecutedQuery("q_pms_self_goal_review", { loadAll: true, employee_id: performanceData.employee_id });
		if (reviewRecords.length <= 0) return sap.m["MessageToast"].show("You have no upcoming reviews.");
		let json = { goal: goalDetail.pg_group, employee_id: performanceData.employee_id, key: "upcomingReview" };
		this.navTo({ S: "p_pms_self_rev_hdr", SS: "s_pms_per_list", AD: JSON.stringify(json) });
	}
	public async onSubmitTargetValue() {
		let isAllFinalValSub = this.checkAllFinalValSubmitted();
		if (!isAllFinalValSub) return sap.m["MessageToast"].show("Target values are missing for few items. Please submit!!");
		let bDialog = new sap.m.BusyDialog({ text: "Uploading final values..." });
		let messageBox = await this.getMessageBox();
		await messageBox.confirm("Are you sure you want to submit final value?", {
			actions: [messageBox.Action.YES, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					bDialog.open();
					let allGoals = this.tm.getTN("r_emp_performance_list").getData();
					for (let goal of allGoals) {
						goal.target_val_status = "Submitted";
					}
					this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_emp_target_sub", true);
					try {
						await this.tm.commitP("The target values have been submitted successfully.", "Error while submitting target value", true, true);
					} catch (e) {
						throw new Error(e);
					} finally {
						bDialog.close();
					}
				}
			},
		});
	}
	public async checkAllFinalValSubmitted() {
		for (let item of this.tm.getTN("r_emp_performance_list").getData()) {
			if (!item.pge_actual_value) {
				return false;
			}
		}
		return true;
	}
	public onEnterEmpStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Planned") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", 1);
		}
		if (value == "Waiting For Manager") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
		if (value == "Planned Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", false);
		}
	}
	public onSearchMgrStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Planned") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
		}
		if (value == "NA") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
		if (value == "Planned Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
	}
	public async onSearchSettingStatus(oEvent) {
		let searchedValue = oEvent.mParameters.value;
		if (searchedValue == "Finalized") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("setting_actual_status", "Completed");
		} else if (searchedValue == "Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		} else if (searchedValue == "Missed by MGR") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		} else if (searchedValue == "Missed by EMP") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", false);
		} else if (searchedValue == "Under Review") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		}
	}
	public async onResetSearch() {
		this.getActiveControlById("setting_statu_copy03", "s_pms_per_search").setValue(null);
		this.getActiveControlById("setting_statu_copy01", "s_pms_per_search").setValue(null);
		this.getActiveControlById("setting_statu_copy02", "s_pms_per_search").setValue(null);
		this.getActiveControlById("review_status_copy01", "s_pms_per_search").setValue(null);
	}
	public async onClickRefresh() {
		await this.tm.getTN("pms_performance_emp_hdr_list").getData().refreshP();
		let qInstance = <any>await this.transaction.getQueryP("d_pms_performance_emp_item");
		await qInstance.refreshP();
	}
}
