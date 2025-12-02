import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_goal_group")
export default class p_pms_goal_group extends KloController {
	public async onPageEnter() {
		await this.tm.getTN("active_suggestion_items").setData([true, false]);
	}
	public async onAddChild() {
		await this.tm.getTN("pms_goal_group_detail").getData().r_goal_extension.newEntityP();
	}
}
