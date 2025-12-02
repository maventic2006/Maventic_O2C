import { EventContext } from "kloBo/EventContext";
import { q_pms_performance_emp_item as q_pms_performance_emp_item_gen } from "o2c_v2/query_gen/q_pms_performance_emp_item";
export class q_pms_performance_emp_item extends q_pms_performance_emp_item_gen {
	public async onBeforeQuery(oEvent: EventContext) {
		let instance = oEvent.getObject();
		let txn = oEvent.getTxn();
		let currentUserRole = txn.$SYSTEM.roleID;
		if (currentUserRole == "EMPLOYEE") {
			instance.item_scope = "Public";
		}
	}
}
