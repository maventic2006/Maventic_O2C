import { q_pms_self_goal_item as q_pms_self_goal_item_gen } from "o2c_v2/query_gen/q_pms_self_goal_item";
export class q_pms_self_goal_item extends q_pms_self_goal_item_gen {
	public async onBeforeQuery(oEvent: EventContext) {
		let instance = <any>oEvent.getObject();
		instance.planned_date = new Date().setDate(new Date().getDate() - 1);
		instance.to_date = new Date().setMonth(new Date().getMonth() + 1);
	}
}
