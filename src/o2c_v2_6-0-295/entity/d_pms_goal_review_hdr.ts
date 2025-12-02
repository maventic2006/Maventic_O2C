import { d_pms_goal_review_hdr as d_pms_goal_review_hdr_gen } from "o2c_v2/entity_gen/d_pms_goal_review_hdr";
export class d_pms_goal_review_hdr extends d_pms_goal_review_hdr_gen {
	public get emp_review_status() {
		if (new Date() >= this.r_goal_review[0]?.planned_date && new Date() <= this.r_goal_review[0]?.review_end_date && !this.is_emp_submitted_review) return "In-progress";
		if (!this.is_emp_submitted_review && new Date() < this.r_goal_review[0]?.planned_date) return "Not Started";
		if (this.is_emp_submitted_review) return "Completed";
		if (new Date() > this.r_goal_review[0]?.review_end_date && !this.is_emp_submitted_review) return "Not Completed";
	}
	public get status() {
		if (new Date() >= this.r_goal_review[0]?.planned_date && new Date() <= this.r_goal_review[0]?.review_end_date && !this.is_mgr_submitted_review) return "In-progress";
		if (!this.is_mgr_submitted_review && new Date() < this.r_goal_review[0]?.planned_date) return "Not Started";
		if (this.is_emp_submitted_review && this.is_mgr_submitted_review) return "Completed";
		if (new Date() > this.r_goal_review[0]?.review_end_date && !this.is_mgr_submitted_review) return "Not Completed";
	}
	public get planned_date() {
		return this.r_goal_review[0]?.planned_date;
	}
	public get review_end_date() {
		return this.r_goal_review[0]?.review_end_date;
	}
}
