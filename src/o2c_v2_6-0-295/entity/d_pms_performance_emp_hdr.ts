import { d_pms_performance_emp_hdr as d_pms_performance_emp_hdr_gen } from "o2c_v2/entity_gen/d_pms_performance_emp_hdr";
export class d_pms_performance_emp_hdr extends d_pms_performance_emp_hdr_gen {
	public get goal_setting_status() {
		if (this.setting_actual_status) return "Completed";
		if (new Date() >= this.goal_setting_sd && new Date() <= this.goal_setting_ed) return "Started";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed) return "Not Completed";
		return "Not Started";
	}
	public get goal_review_staus() {
		if (this.review_actual_status) return this.review_actual_status;
		if (new Date() >= this.goal_setting_rev_sd && new Date() <= this.goal_setting_rev_ed) return "Started";
		if (!this.review_actual_status && new Date() >= this.goal_setting_rev_sd && new Date() > this.goal_setting_rev_ed) return "Not Completed";
		return "Not Started";
	}
	public get mgr_planned_submitted_status() {
		if (this.goal_setting_sd > new Date()) return "Planning Not Started";
		if (new Date() >= this.goal_setting_sd && new Date() <= this.goal_setting_ed && !this.is_mgr_planned_submitted) return "Planning Pending";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed && (!this.is_mgr_planned_submitted || !this.is_final_planned_submitted)) return "NA";
		if (this.is_mgr_planned_submitted) return "Planned";
	}
	public get emp_planned_submitted_status() {
		if (this.goal_setting_sd > new Date()) return "Planning Not Started";
		if (new Date() >= this.goal_setting_sd && new Date() <= this.goal_setting_ed && !this.is_mgr_planned_submitted) return "Waiting For Manager";
		if (new Date() >= this.goal_setting_sd && new Date() <= this.goal_setting_ed && this.is_mgr_planned_submitted && !this.is_emp_planned_submitted) return "Planning Pending";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed && !this.is_emp_planned_submitted) return "NA";
		if (this.is_emp_planned_submitted) return "Planned";
	}
	public get agreed_planned_status() {
		if (this.setting_actual_status) return "Finalized";
		if (new Date() >= this.goal_setting_sd && new Date() <= this.goal_setting_ed && this.is_emp_planned_submitted && this.is_mgr_planned_submitted && !this.review_actual_status) return "Under Review";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed && !this.is_mgr_planned_submitted) return "Missed by MGR";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed && this.is_mgr_planned_submitted && this.is_emp_planned_submitted && !this.is_final_planned_submitted) return "Missed by MGR";
		if (!this.setting_actual_status && new Date() >= this.goal_setting_sd && new Date() > this.goal_setting_ed && this.is_mgr_planned_submitted && !this.is_emp_planned_submitted) return "Missed by EMP";
		return "Pending";
	}
}
