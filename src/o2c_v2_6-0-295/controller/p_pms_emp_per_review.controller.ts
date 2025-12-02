import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
import { Status } from "o2c_v2/util/enum";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_emp_per_review")
export default class p_pms_emp_per_review extends KloController {
	public showInformationMgsOneTime = false;
	public async onPageEnter() {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ppms");
		await this.tm.getTN("quick_filters").setData(["Show Setting Pending", "Show Review Pending", "Show On Track", "Show All"]);
		await this.tm.getTN("showNextButton").setData(true);
		await this.tm.getTN("enable_final_value_field").setData(true);
		this.tm.getTN("quick_filter_text").setData({ value: "Quick Filter" });
		await this.tm.getTN("all_employee_list").setData(await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true }));
		await this.tm.getTN("review_items").setData(Status.reviewStatus);
		await this.tm.getTN("status_list").setData(["Planned", "Planning Pending", "NA"]);
		await this.tm.getTN("status_list_emp").setData(["Planned", "Planning Pending", "Waiting For Manager", "NA"]);
		await this.tm.getTN("status_list_agreed").setData(["Pending", "Finalized", "Missed by MGR", "Missed by EMP", "Under Review"]);
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		// Suggestion items for employee search
		let designationList = await this.transaction.getExecutedQuery("d_o2c_designation_master", { loadAll: true, company_code: currentUserCompanyCode[0].company_code }); // Hardcoded company code should be removed.
		let departmentList = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { company_code: currentUserCompanyCode[0].company_code, loadAll: true });
		await this.tm.getTN("department_list").setData(departmentList);
		await this.tm.getTN("designation_list").setData(designationList);
	}
	public isEditable(performanceDetai) {
		if (performanceDetai.review_actual_status !== "Completed" && new Date() >= performanceDetai.goal_setting_rev_sd && (this.getMode() == "EDIT" || this.getMode() == "CREATE")) return true;
		return false;
	}
	public async onUploadPlannedValue(oEvent, pId) {
		let busyDialog = new sap.m.BusyDialog({ text: "Submitting initial KPI values..." });
		busyDialog.open();
		try {
			let flag = true;
			let empPerformanceData = this.tm.getTN("r_emp_performance_list").getData();
			for (let empData of empPerformanceData) {
				if (empData.pge_metric_value) {
					empData.mgr_planned_status = "1";
				} else {
					flag = false;
					return sap.m["MessageToast"].show("Can not save as planned value is missing..");
				}
			}
			if (flag) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_mgr_planned_submitted", true);
			await this.tm.commitP("Initial KPI values submitted successfully.", "Failed while submitting initial KPI values.", true, true);
			this.getPlannedCount();
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async onSubmitPlannedValue() {
		try {
			if (this.tm.getTN("pms_performance_emp_hdr_detail").getData().is_mgr_planned_submitted) {
				this.tm.getTN("r_emp_performance_detail").setProperty("mgr_final_val_status", "1");
			}
			let isAllFinalValSub = this.checkMgrSubFinalValue();
			// if (isAllFinalValSub) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("setting_actual_status", "Completed");
			if (isAllFinalValSub) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_final_planned_submitted", true);
			await this.tm.commitP("Initial KPI values submitted successfully.", "Submission Failed", true, true);
			await this.getPlannedCount();
			this.closeDialog("pa_goal_detail");
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onCopyEmpPlannedValue(oEvent, pId) {
		let busyDialog = new sap.m.BusyDialog({ text: "Submitting initial KPI values..." });
		busyDialog.open();
		try {
			let selectedIndices = this.tm.getTN("r_emp_performance_list").getSelectedIndices();
			for (let index of selectedIndices) {
				this.tm.getTN("r_emp_performance_list").getData()[index].final_planned_value = this.tm.getTN("r_emp_performance_list").getData()[index].emp_planned_value;
				this.tm.getTN("r_emp_performance_list").getData()[index].mgr_final_val_status = "1";
				this.tm.getTN("r_emp_performance_list").getData()[index].status = "Started";
			}
			let isAllFinalValSub = this.checkMgrSubFinalValue();
			// if (isAllFinalValSub) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("setting_actual_status", "Completed");
			if (isAllFinalValSub) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_final_planned_submitted", true);
			await this.tm.commitP("Initial KPI values submitted successfully.", "Failed while submitting initial KPI values.", true, true);
			await this.getPlannedCount();
			this.getActiveControlById(null, "s_card_list").deselectAll();
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public generateQuarterlyReviewDates(startDateStr, endDateStr, review) {
		let reviewTypeCount = review == "Quarter" ? 4 : 6;
		const startDate = new Date(startDateStr);
		const endDate = new Date(endDateStr);
		const reviewDates = [];

		let currentDate = new Date(startDate);

		while (currentDate < endDate) {
			// Move to the next quarter
			currentDate.setMonth(currentDate.getMonth() + reviewTypeCount);

			reviewDates.push({ from_date: new Date(currentDate) }); // Push a copy of the date. In case of system generated review dates, No end date for review is finalized yet.
		}

		return reviewDates;
	}
	public async submitFinalValue() {
		let performanceData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		if (performanceData.feedback_type == "360" && (await performanceData.r_mr_header.fetch()).length <= 0) return sap.m["MessageToast"].show("Can not submit: No reviewer found for this goal");
		let busyDialog = new sap.m.BusyDialog({ text: "Submitting final KPI values..." });
		let messageBox = await this.getMessageBox();
		await messageBox.confirm("Are you sure you want to submit final value?", {
			actions: [messageBox.Action.YES, messageBox.Action.NO],
			emphasizedAction: messageBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					busyDialog.open();
					try {
						let appraisalQuarterData = await this.transaction.getExecutedQuery("d_pms_appraisal_quarter", { loadAll: true, appraisal_id: performanceData.appaisal_year });
						let performanceEmpData = this.tm.getTN("r_emp_performance_list").getData();
						let goalReviewHdrData = await this.transaction.createEntityP("d_pms_goal_review_hdr", {
							appraisal_year: performanceData.appaisal_year,
							appraisal_cycle: performanceData.appraisal_cycle,
							manager_name: performanceData.mgr_name,
							manager_id: performanceData.manager_id,
							employee_name: performanceData.emp_name,
							employee_id: performanceData.employee_id,
							rollout_id: performanceData.rollout_id,
						});
						for (let performance of performanceEmpData) {
							performance.status = "Started";
							performance.track = "";
							if (performance.review == "Quarter") {
								let quarterlyDates;
								if (appraisalQuarterData.length > 0) quarterlyDates = appraisalQuarterData.map((e) => ({ from_date: e.appraisal_quarter_from, to_date: e.appraisal_quarter_to }));
								else quarterlyDates = this.generateQuarterlyReviewDates(performanceData.start_date, performanceData.end_date, performance.review);
								for (let date of quarterlyDates) {
									await this.transaction.createEntityP("d_pms_goal_review", {
										goal_rev_hdr_id: goalReviewHdrData.goal_rev_hdr_id,
										planned_date: date.from_date,
										review_end_date: date.to_date,
										manager_name: performanceData.mgr_name,
										manager_id: performanceData.manager_id,
										employee_name: performanceData.emp_name,
										employee_id: performanceData.employee_id,
										performance_group: performance.pg_group,
										p_group_extension: performance.pg_group_ext,
										pge_description: performance.pge_description,
										status: "Started",
										track: "",
										hr_id: performanceData.hr,
										final_planned_value: performance.final_planned_value,
										uom: performance.uom,
										goal_ref_id: performance.pgit_id,
										item_scope: performance.item_scope,
										weightage: performance.weightage,
									});
								}
								// 4 records will get created
							} else if (performance.review == "6 Months") {
								//two records will get created
								let quarterlyDates;
								if (appraisalQuarterData.length > 0) quarterlyDates = appraisalQuarterData.map((e) => ({ from_date: e.appraisal_quarter_from, to_date: e.appraisal_quarter_to }));
								else quarterlyDates = this.generateQuarterlyReviewDates(performanceData.start_date, performanceData.end_date, performance.review);
								for (let index = 0; index < 1; index++) {
									await this.transaction.createEntityP("d_pms_goal_review", {
										goal_rev_hdr_id: goalReviewHdrData.goal_rev_hdr_id,
										planned_date: quarterlyDates[index]?.from_date, // for review in 6 month, there is not review end date.
										review_end_date: new Date(quarterlyDates[index].from_date).setDate(new Date(quarterlyDates[index].from_date).getDate() + 10),
										manager_name: performanceData.mgr_name,
										manager_id: performanceData.manager_id,
										employee_name: performanceData.emp_name,
										employee_id: performanceData.employee_id,
										performance_group: performance.pg_group,
										p_group_extension: performance.pg_group_ext,
										pge_description: performance.pge_description,
										status: "Started",
										track: "",
										hr_id: performanceData.hr,
										goal_ref_id: performance.pgit_id,
										final_planned_value: performance.final_planned_value,
										item_scope: performance.item_scope,
										uom: performance.uom,
										weightage: performance.weightage,
									});
								}
							} else {
								await this.transaction.createEntityP("d_pms_goal_review", {
									goal_rev_hdr_id: goalReviewHdrData.goal_rev_hdr_id,
									planned_date: performanceData.goal_setting_rev_sd,
									review_end_date: performanceData.goal_setting_rev_ed,
									manager_name: performanceData.mgr_name,
									manager_id: performanceData.manager_id,
									employee_name: performanceData.emp_name,
									employee_id: performanceData.employee_id,
									performance_group: performance.pg_group,
									p_group_extension: performance.pg_group_ext,
									pge_description: performance.pge_description,
									status: "Started",
									track: "",
									hr_id: performanceData.hr,
									goal_ref_id: performance.pgit_id,
									final_planned_value: performance.final_planned_value,
									item_scope: performance.item_scope,
									uom: performance.uom,
									weightage: performance.weightage,
								});
							}
						}
						if (performanceData.is_final_planned_submitted) {
							this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("setting_actual_status", "Completed");
							let rolloutData = await this.transaction.getExecutedQuery("d_pms_apg_rollout", { loadAll: true, apg_id: performanceData.rollout_id });
							let rolloutEmp = await rolloutData[0].r_rollout_employees.fetch();
							for (let emp of rolloutEmp) {
								if (emp.emp_id == performanceData.employee_id) {
									emp.status = "Started";
									emp.track = "On Track";
								}
							}
							// getting the reviewer list and creating feedback records for them(Peers)
							let reviewerList = performanceData.r_mr_header;
							let skillData = await this.transaction.getExecutedQuery("d_pms_jd_skills", { job_description_id: performanceData.js_template, loadAll: true });
							for (let reviewer of reviewerList) {
								let feedbackData = await this.transaction.createEntityP("d_pms_feedback", {
									manager: performanceData.mgr_name,
									is_pa: true,
									feedback_type: "360",
									feedback_desciption: "360 for PA",
									assessor: reviewer.employee_id,
									assessor_name: reviewer.employee_name,
									assessee: performanceData.employee_id,
									assessee_name: performanceData.emp_name,
									job_desc_id: performanceData.js_template,
									peers_status: "Pending",
									assessor_type: "Peer",
									date_of_initiation: performanceData.goal_setting_rev_sd,
									date_of_closure: performanceData.goal_setting_rev_ed,
								});
								for (let skill of skillData) {
									let skillData = await this.transaction.createEntityP("d_pms_feedback_skill", { feedback_id: feedbackData.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
									let skillCopyData = await this.transaction.createEntityP("d_pms_feedback_skill_copy", { feedback_id: feedbackData.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
									skillData.fskills_copy_id = skillCopyData.fskills_copy_id;
								}
							}
							//creating feedback for self review
							let selfFeedback = await this.transaction.createEntityP("d_pms_feedback", {
								manager: performanceData.mgr_name,
								is_pa: true,
								feedback_type: "360",
								feedback_desciption: "360 feedback for PA",
								assessor: performanceData.employee_id,
								assessor_name: performanceData.emp_name,
								assessee: performanceData.employee_id,
								assessee_name: performanceData.emp_name,
								job_desc_id: performanceData.js_template,
								self_status: "Pending",
								assessor_type: "Self",
								date_of_initiation: performanceData.goal_setting_rev_sd,
								date_of_closure: performanceData.goal_setting_rev_ed,
							});
							let selfSkillData;
							for (let skill of skillData) {
								selfSkillData = await this.transaction.createEntityP("d_pms_feedback_skill", { feedback_id: selfFeedback.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
								await this.transaction.createEntityP("d_pms_feedback_skill_copy", { feedback_id: selfFeedback.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
							}
							//creating feedback for Manager review
							let mgrFeedback = await this.transaction.createEntityP("d_pms_feedback", {
								manager: performanceData.mgr_name,
								is_pa: true,
								feedback_type: "360",
								feedback_desciption: "360 for PA",
								assessor: rolloutData[0].manager_id,
								assessor_name: rolloutData[0].team_manager,
								assessee: performanceData.employee_id,
								assessee_name: performanceData.emp_name,
								job_desc_id: performanceData.js_template,
								status: "Pending",
								assessor_type: "Manager",
								date_of_initiation: performanceData.goal_setting_rev_sd,
								date_of_closure: performanceData.goal_setting_rev_ed,
							});
							for (let skill of skillData) {
								await this.transaction.createEntityP("d_pms_feedback_skill", { feedback_id: mgrFeedback.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
								let mgrSkillData = await this.transaction.createEntityP("d_pms_feedback_skill_copy", { fskills_copy_id: selfSkillData.fskills_id, feedback_id: mgrFeedback.feedback_id, kpi_skill: skill.attribute_text, weightage: skill.weightage, criticality: skill.criticality, higher_scale: skill.higher_base, lower_scale: skill.lower_base, rating: skill.base_rating });
								selfSkillData.fskills_copy_id = mgrSkillData.fskills_copy_id;
							}
							await this.transaction.createEntityP("d_pms_mr_emp_header", {
								employee_name: performanceData.emp_name,
								appraisal_start_from: rolloutData[0].start_date,
								appraisal_end_on: rolloutData[0].end_date,
								feedback_type: rolloutData[0].feedback_type,
								manager_id: rolloutData[0].manager_id,
								manager_name: rolloutData[0].team_manager,
								employee_id: performanceData.employee_id,
								appraisal_cycle: rolloutData[0].appraisal_cycle,
								appraisal_year: rolloutData[0].appraisal_year,
								hr_id: rolloutData[0].hr_manager,
							});
						}
						await this.tm.commitP("Final KPI values are submitted successfully", "Setting Failed", true, true);
					} catch (e) {
						throw new Error(e);
					} finally {
						busyDialog.close();
					}
				}
			},
		});
	}
	public async onCopyMgrPlannedValue(oEvent, pId) {
		let busyDialog = new sap.m.BusyDialog({ text: "Submitting initial KPI values..." });
		busyDialog.open();
		try {
			let selectedIndices = this.tm.getTN("r_emp_performance_list").getSelectedIndices();
			for (let index of selectedIndices) {
				this.tm.getTN("r_emp_performance_list").getData()[index].final_planned_value = this.tm.getTN("r_emp_performance_list").getData()[index].pge_metric_value;
				this.tm.getTN("r_emp_performance_list").getData()[index].mgr_final_val_status = "1";
				this.tm.getTN("r_emp_performance_list").getData()[index].status = "Started";
			}
			let isAllFinalValSub = this.checkMgrSubFinalValue();
			if (isAllFinalValSub) this.tm.getTN("pms_performance_emp_hdr_detail").setProperty("is_final_planned_submitted", true);
			await this.tm.commitP("Initial KPI values submitted successfully.", "Failed while submitting initial KPI values", true, true);
			await this.getPlannedCount();
			this.getActiveControlById(null, "s_card_list").deselectAll();
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public checkMgrSubFinalValue() {
		let allData = this.tm.getTN("r_emp_performance_list").getData();
		let flag = true;
		for (let data of allData) {
			if (data.mgr_final_val_status !== "1") flag = false;
		}
		return flag;
	}
	public async enableFinalValue(currentData) {
		let mode = this.getMode();
		let headerData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		if (currentData.item_scope == "Public" && currentData.emp_planned_status == "1" && !headerData.setting_actual_status && (mode == "EDIT" || mode == "CREATE")) return await this.tm.getTN("enable_final_value_field").setData(true);
		if (currentData.item_scope == "Private" && currentData.mgr_planned_status == "1" && currentData.emp_planned_status !== "1" /* && !headerData.setting_actual_status */ && (mode == "EDIT" || mode == "CREATE")) return await this.tm.getTN("enable_final_value_field").setData(true);
		return await this.tm.getTN("enable_final_value_field").setData(false);
	}
	public async getGoalRemaks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_group", { loadAll: true, pg_group_id: this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]].pg_group });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0].goal_remarks ? GoalData[0].goal_remarks : "No Information.");
	}
	public async getGoalExtensionRemarks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_extension", { loadAll: true, pg_grop_ext_id: this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]].pg_group_ext });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0]?.remarks ? GoalData[0].remarks : "No Information.");
	}
	public async onClickGoal(oEvent) {
		try {
			let oPath = this.getPathFromEvent(oEvent);
			let goalHeaderDetail = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
			let index = oPath.split("/")[2];
			await this.tm.getTN("enable_final_value_field").setData(false);
			if (+index <= this.tm.getTN("r_emp_performance_list").getData().length - 2) {
				await this.tm.getTN("showNextButton").setData(true);
			}
			await this.tm.getTN("r_emp_performance_list").setActive(index);
			if (new Date() <= goalHeaderDetail.goal_setting_ed && new Date() >= goalHeaderDetail.goal_setting_sd && !goalHeaderDetail.setting_actual_status) await this.tm.getTN("isDialogEditVis").setData(true);
			else if (new Date() <= goalHeaderDetail.goal_setting_rev_ed && new Date() >= goalHeaderDetail.goal_setting_rev_sd && !goalHeaderDetail.is_mgr_final_sub) await this.tm.getTN("isDialogEditVis").setData(true);
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
		await this.enableFinalValue(this.tm.getTN("r_emp_performance_list").getData()[index]);
		if (+index == this.tm.getTN("r_emp_performance_list").getData().length - 1) {
			await this.tm.getTN("showNextButton").setData(false);
		}
	}
	public async onCloseDialog() {
		await this.refreshTransnode("r_emp_performance_detail");
		this.closeDialog("pa_goal_detail");
	}
	public async onAddGoal(oEvent) {
		this.setMode("CREATE");
		await this.tm.getTN("pms_performance_emp_hdr_detail").getData().r_emp_performance.newEntityP();
		await this.tm.getTN("r_emp_performance_list").setActive(0);
		this.openDialog("pa_goal_detail");
	}
	public async getPlannedCount() {
		let listData = await this.tm.getTN("pms_performance_emp_hdr_detail").getData().r_emp_performance.fetch();
		let totalCount = listData.length;
		let plannedCount = listData.filter((e) => e.pge_metric_value);
		let finalPlannedCount = listData.filter((e) => e.final_planned_value);
		await this.tm.getTN("plannedCount").setData(`(${plannedCount.length} / ${totalCount})`);
		await this.tm.getTN("finalPlannedCount").setData(`(${finalPlannedCount.length} / ${totalCount})`);
		if (!this.showInformationMgsOneTime && this.tm.getTN("pms_performance_emp_hdr_detail").getData().is_final_planned_submitted && !this.tm.getTN("pms_performance_emp_hdr_detail").getData().setting_actual_status) {
			(await this.getMessageBox()).information("Final values are saved. Please" + (this.tm.getTN("pms_performance_emp_hdr_detail").getData().feedback_type == "360" ? ` add the reviewers (if not added) and ` : " ") + "complete the goal setting.");
			this.showInformationMgsOneTime = true;
		}
		// this.tm.getTN("quick_filter_text").setData({ value: "Quick Filter" });
	}
	public async onNavToDetail(oEvent) {
		await this.navTo({ SS: "s_pms_per_detail" }, oEvent);
		this.showInformationMgsOneTime = false;
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
	public onClickMassSelect() {
		this.getActiveControlById(null, "s_card_list").selectAll();
	}
	public showEmpPlannedStatus(empPlannedStatus, mgrPlannedStatus) {
		if (!mgrPlannedStatus) return "Not Started";
		if (empPlannedStatus) return "Completed";
		return "Started";
	}
	public isButtonEnable(listData) {
		let total = listData.length;
		let activeIndex = this.tm.getTN("r_emp_performance_list").getActiveIndex();
		if (total - 1 == activeIndex) return false;
		return true;
	}
	public async onClickRefresh() {
		await this.tm.getTN("pms_performance_emp_hdr_list").getData().refreshP();
		let qInstance = <any>await this.transaction.getQueryP("d_pms_performance_emp_item");
		await qInstance.refreshP();
	}
	public async onQuickFilter(oEvent, param) {
		let selectedFilter = oEvent.mParameters.item.mProperties.text;
		if (selectedFilter == "Show Setting Pending") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Setting Pending" });
			return this.filterData("mgr_final_val_status", "pending");
		} else if (selectedFilter == "Show Review Pending") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Review Pending" });
			return this.filterData("review_status", "pending"); // later we have to change this review pID
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
		if (value !== null) {
			if (value == "pending") value = null; // making the value as null to get all the pending items. as by default null value is maintained.
			aFilter = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter(pID, sap.ui.model.FilterOperator.EQ, value)],
			});
		}
		let oBindings = oSection.getBinding("items");
		(<sap.ui.model.json.JSONListBinding>oBindings).filter(aFilter);
	}
	public isFinalValueVis(performanceData) {
		let mode = this.getMode();
		if (performanceData.is_emp_planned_submitted && performanceData.is_mgr_planned_submitted && !performanceData.setting_actual_status && mode == "EDIT") return true;
		return false;
	}
	public async onCreateReviewFromSelectedGoal(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let performanceHeaderData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let SelectedGoalData = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		let json = {
			manager_name: performanceHeaderData.mgr_name,
			manager_id: performanceHeaderData.manager_id,
			employee_name: performanceHeaderData.emp_name,
			employee_id: performanceHeaderData.employee_id,
			performance_group: SelectedGoalData.pg_group,
			p_group_extension: SelectedGoalData.pg_group_ext,
			pge_description: SelectedGoalData.pge_description,
			track: SelectedGoalData.track,
			hr_id: performanceHeaderData.hr,
			weightage: SelectedGoalData.weightage,
		};
		await this.navTo({ S: "p_pms_goal_review", SS: "s_pms_goa_list", AD: json });
		// this.setMode("CREATE");
		// await this.tm.getTN("pms_goal_review_list").createEntityP({ manager_id: performanceHeaderData.manager_id, employee_id: performanceHeaderData.employee_id, performance_group: SelectedGoalData.pg_group, p_group_extension: SelectedGoalData.pg_group_ext, pge_description: SelectedGoalData.pge_description, status: SelectedGoalData.status, track: SelectedGoalData.track, hr_id: performanceHeaderData.hr }, "Create Successful", "Creation Failed", "s_pms_goa_detail", "First", true);
	}
	public async navToAchievements(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let goalDetail = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		let performanceHeaderData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let allAchievements = await this.transaction.getExecutedQuery("q_pms_review_achievement", { loadAll: true, manager_id: performanceHeaderData.manager_id });
		for (let data of allAchievements) {
			if (data.employee_id == performanceHeaderData.employee_id) {
				let jsonData = { employee_id: performanceHeaderData.employee_id, goal: goalDetail.pg_group, key: "showAchievement" };
				return await this.navTo({ S: "p_pms_review_achiev", AD: JSON.stringify(jsonData) });
			}
		}
		sap.m["MessageToast"].show(`No achievements found for ${performanceHeaderData.emp_name}`);
	}
	public async NavToUpcomingReview(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let goalDetail = this.tm.getTN("r_emp_performance_list").getData()[oPath.split("/")[2]];
		let performanceData = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
		let reviewRecords = await this.transaction.getExecutedQuery("q_pms_goal_review_hdr_item", { loadAll: true, employee_id: performanceData.employee_id });
		if (reviewRecords.length <= 0) return sap.m["MessageToast"].show("No upcoming review found for this KPI.");
		let json = { pg_group: goalDetail.pg_group, employee_id: performanceData.employee_id, key: "upcomingReview" };
		this.navTo({ S: "p_pms_goal_rev_hdr", SS: "s_pms_per_list", AD: json });
	}
	public async onAddReviewer() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			let emp_header_detail = this.tm.getTN("pms_performance_emp_hdr_detail").getData();
			let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: emp_header_detail.appaisal_year, loadAll: true });
			let qInstance = this.tm.getTN("pms_per_empsearch").getData();
			qInstance.appraisal_id = currentAnnualPerformance[0]?.ap_id;
			qInstance.included_IN = ["all", "true"];
			qInstance.loadAll = true;
			let allEmployeeData = await qInstance.executeP();
			// await this.tm.getTN("employee_list").setData(allEmployeeData);
			this.openDialog("pa_emp_list");
			this.getActiveControlById(null, "s_employee_list")?.deselectAll();
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmit() {
		let oData = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (oData.length <= 0) return sap.m["MessageToast"].show("No Items Selected");
		let busyDialog = new sap.m.BusyDialog({ text: "Creating..." });
		this.setMode("CREATE");
		busyDialog.open();
		try {
			for (let i = 0; i < oData.length; i++) {
				let emp_data = this.tm.getTN("pms_per_emp_list").getData()[oData[i]];
				// Validating if the employee is already added or not.
				let currentRolloutEmp = this.tm.getTN("r_mr_header_list").getData();
				let isEmpAlreadySelected;
				if (currentRolloutEmp.length > 0) {
					isEmpAlreadySelected = currentRolloutEmp.filter((e) => e.employee_id == emp_data.employee_id);
				}
				if (currentRolloutEmp.length > 0 && isEmpAlreadySelected?.length > 0) {
					sap.m["MessageToast"].show(`Can not add employee ${emp_data.full_name} as he is added as a reviewer.`);
					continue;
				}
				await this.tm
					.getTN("pms_performance_emp_hdr_detail")
					.getData()
					.r_mr_header.newEntityP(0, { employee_name: emp_data.first_name + " " + emp_data.last_name, employee_id: emp_data.employee_id });
			}
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_emp_list");
			busyDialog.close();
		}
	}
	public onEnterEmployeePlan(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Planned") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_emp_planned_submitted", 1);
		}
		if (value == "Waiting For Manager") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
		if (value == "Planning Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_emp_planned_submitted", false);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_emp_planned_submitted", undefined);
		}
		// if (value == "Started") {
		// 	this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
		// 	this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_emp_planned_submitted", 0);
		// }
	}
	public async onDeleteGoal() {
		let oThis = this;
		let bDialog = new sap.m.BusyDialog();
		let selectedIndex = this.tm.getTN("r_emp_performance_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No item selected");
		let messageBox = await this.getMessageBox();
		await messageBox.warning(`This action cannot be undone, are you sure you want to delete (${selectedIndex.length} item) ?`, {
			actions: [messageBox.Action.DELETE, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.DELETE,
			onClose: async (oAction) => {
				if (oAction == "DELETE") {
					bDialog.open();
					for (let index = selectedIndex.length - 1; index >= 0; index--) {
						await oThis.tm.getTN("r_emp_performance_list").getData()[selectedIndex[index]].deleteP();
					}
					await oThis.tm.commitP("Deleted successfully", "Deletion failed", true, true);
					bDialog.close();
				}
			},
		});
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
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("setting_actual_s", "Completed");
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
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("setting_actual_s", undefined);
		}
	}
	public async checkAllFinalValSubmitted() {
		for (let item of this.tm.getTN("r_emp_performance_list").getData()) {
			if (!item.final_value) {
				return false;
			}
		}
		return true;
	}
	public async onResetSearch() {
		this.getActiveControlById("setting_status", "s_pms_per_search").setValue(null);
		this.getActiveControlById("employee_plan_s", "s_pms_per_search").setValue(null);
		this.getActiveControlById("setting_statu_copy01", "s_pms_per_search").setValue(null);
		this.getActiveControlById("review_status", "s_pms_per_search").setValue(null);
	}
}
