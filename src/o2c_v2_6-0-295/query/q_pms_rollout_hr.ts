import { EventContext } from "kloBo/EventContext";
import { q_pms_rollout_hr as q_pms_rollout_hr_gen } from "o2c_v2/query_gen/q_pms_rollout_hr";
export class q_pms_rollout_hr extends q_pms_rollout_hr_gen {
	public onBefore(oEvent: EventContext) {
		let queryInstance = oEvent.getObject();
		queryInstance.setLoadAll(true);
	}
}
