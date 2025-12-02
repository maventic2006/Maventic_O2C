import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_self_goal_revi")
export default class p_pms_self_goal_revi extends KloController {
	public async onSubmit() {
		let messageBox = await this.getMessageBox();
		let bDialog = new sap.m.BusyDialog();
		await messageBox.confirm("Are you sure you want to submit?", {
			actions: [messageBox.Action.YES, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					bDialog.open();
					this.tm.getTN("pms_goal_review_detail").setProperty("emp_status", 1);
					try {
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
	public async onPageEnter(oEvent) {
		let goalData = oEvent.navToParams?.AD ? JSON.parse(oEvent.navToParams?.AD) : "";
		if (oEvent.navToParams?.AD && goalData.key == "upcomingReview") {
			let instance = this.tm.getTN("pms_goal_review_search").getData();
			instance.pg_goal = goalData.goal;
			instance.planned_date = new Date();
			instance.to_date = new Date().setMonth(new Date().getMonth() + 1);
			await instance.executeP();
		} else {
			await this.tm.getTN("pms_goal_review_search").executeP();
		}
	}
}
