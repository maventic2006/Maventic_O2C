import { EventContext } from "kloBo/EventContext";
import { q_o2c_team_head_manager as q_o2c_team_head_manager_gen } from "o2c_v2/query_gen/q_o2c_team_head_manager";

export class q_o2c_team_head_manager extends q_o2c_team_head_manager_gen {
	public async onBeforeQuery(oEvent: EventContext) {
		// let instance = oEvent.getObject();
		// instance.setExpandAll("r_employee_org");
	}
}
