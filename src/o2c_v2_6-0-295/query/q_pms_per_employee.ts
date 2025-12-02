import { EventContext } from "kloBo/EventContext";
import { q_pms_per_employee as q_pms_per_employee_gen } from "o2c_v2/query_gen/q_pms_per_employee";
export class q_pms_per_employee extends q_pms_per_employee_gen {
	public async onBeforeQuery(oEvent: EventContext) {
		let qInstance = oEvent.getObject();
		qInstance.appraisal_id = qInstance.appraisal_data;
		qInstance.included_IN = ["all", "true"];
		qInstance.loadAll = true;
	}
}
