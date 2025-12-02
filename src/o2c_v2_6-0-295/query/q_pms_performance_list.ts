import { EventContext } from "kloBo/EventContext";
import { q_pms_performance_list as q_pms_performance_list_gen } from "o2c_v2/query_gen/q_pms_performance_list";

export class q_pms_performance_list extends q_pms_performance_list_gen {
	public async onBeforeQuery(oEvent: EventContext) {
		let instance = oEvent.getObject();
		instance.setLoadAll(true);
		let currentDate = new Date();
		if (instance.setting_status) {
			if (instance.setting_status == "Completed") {
				instance.setting_actual_status = "Completed";
			}
			if (instance.setting_status == "Not Started") {
				instance.goal_setting_sd_GEQ = currentDate;
				instance.setting_actual_status_NE = "Completed";
			}
			if (instance.setting_status == "Started") {
				instance.setProperty("goal_setting_sd_LEQ", currentDate.getTime());
				instance.setProperty("goal_setting_en_GEQ", currentDate.getTime());
				instance.setProperty("setting_actual_status_NE", "Completed");
				//instance.setting_actual_status = [];
			}
			if (instance.setting_status == "Not Completed") {
				instance.goal_setting_sd_LEQ = currentDate;
				instance.goal_setting_sd_LEQ = currentDate;
				instance.setting_actual_status_NE = "Completed";
			}
		}
		if (instance.review_status) {
			if (instance.review_status == "Completed") {
				instance.review_actual_status = "Completed";
			}
			if (instance.review_status == "Not Started") {
				instance.goal_setting_rev_sd_GEQ = currentDate;
				instance.review_actual_status_NE = "Completed";
			}
			if (instance.review_status == "Started") {
				instance.goal_setting_rev_sd_LEQ = currentDate;
				instance.goal_setting_rev_ed_GEQ = currentDate;
				instance.review_actual_status_NE = "Completed";
			}
			if (instance.review_status == "Not Completed") {
				instance.goal_setting_rev_sd_LEQ = currentDate;
				instance.goal_setting_rev_sd_LEQ = currentDate;
				instance.review_actual_status_NE = "Completed";
			}
		}
		if (instance.employee_plan_status == "Completed") {
			instance.is_emp_planned_submitted = true;
		} else if (instance.employee_plan_status == "Not Started") {
			instance.is_emp_planned_submitted_NE = true;
		} else if (instance.employee_plan_status == "Started") {
			instance.is_mgr_planned_submitted = true;
		}
	}
}
