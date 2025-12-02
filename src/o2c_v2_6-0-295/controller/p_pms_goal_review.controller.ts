import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_goal_review")
export default class p_pms_goal_review extends KloController {
	public async onPageEnter(oEvent) {
		let key = oEvent.navToParams.AD ? oEvent.navToParams.AD.key : "";
		let SelectedGoalData = oEvent?.navToParams?.AD;
		if (oEvent?.navToParams?.AD && key !== "upcomingReview") {
			let reviewHdrData = await this.transaction.getExecutedQuery("d_pms_goal_review_hdr", { employee_id: SelectedGoalData.employee_id });
			setTimeout(async () => {
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
			});
		} else if (oEvent?.navToParams?.AD && key == "upcomingReview") {
			let searchInstance = this.tm.getTN("pms_goal_review_search").getData();
			searchInstance.employee_id = SelectedGoalData.employee_id;
			searchInstance.pg_goal = SelectedGoalData.pg_group;
			searchInstance.planned_date = new Date();
			searchInstance.to_date = new Date().setMonth(new Date().getMonth() + 1);
			await searchInstance.executeP();
		} else {
			await this.tm.getTN("pms_goal_review_search").executeP();
		}
	}

	public async onSubmit() {
		let messageBox = await this.getMessageBox();
		let bDialog = new sap.m.BusyDialog();
		let gaolDetail = this.tm.getTN("pms_goal_review_detail").getData();
		await messageBox.confirm("Are you sure you want to submit?", {
			actions: [messageBox.Action.YES, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					bDialog.open();
					this.tm.getTN("pms_goal_review_detail").setProperty("mgr_status", 1);
					this.tm.getTN("pms_goal_review_detail").setProperty("actual_date", new Date());
					this.tm.getTN("pms_goal_review_detail").setProperty("status", "Completed");
					try {
						let performanceItem = await this.transaction.getExecutedQuery("d_pms_performance_emp_item", { pgit_id: gaolDetail.goal_ref_id, loadAll: true });
						performanceItem[0].track = gaolDetail.track;
						performanceItem[0].status = "Completed";
						await this.tm.commitP("Submitted successfully", "Error while submitting", true, true);
					} catch (e) {
						throw new Error(e);
					} finally {
						bDialog.close();
					}
				}
			},
		});
	}
}
