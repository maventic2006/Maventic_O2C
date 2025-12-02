import { d_pms_apg_rollout as d_pms_apg_rollout_gen } from "o2c_v2/entity_gen/d_pms_apg_rollout";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
export class d_pms_apg_rollout extends d_pms_apg_rollout_gen {
	public empPerformanceData;
	public isDataFetched;

	public async OnValidate(): Promise<ValidationError[]> {
		if (this.status !== "Draft") {
			if (!this.goal_setting_start_date) this.errors.push(new ValidationError(this, "goal_setting_start_date", "11", "Value required !!", ErrorType.ERROR));
			if (!this.goal_setting_end_date) this.errors.push(new ValidationError(this, "goal_setting_end_date", "11", "Value required !!", ErrorType.ERROR));
			if (!this.review_start_date) this.errors.push(new ValidationError(this, "review_start_date", "11", "Value required !!", ErrorType.ERROR));
			if (!this.review_enid_date) this.errors.push(new ValidationError(this, "review_enid_date", "11", "Value required !!", ErrorType.ERROR));
		}
		if (this.goal_setting_end_date < this.goal_setting_start_date) this.errors.push(new ValidationError(this, "goal_setting_start_date", "11", "Start Date should not be greater than End Date", ErrorType.ERROR));
		if (this.review_start_date > this.review_enid_date) this.errors.push(new ValidationError(this, "review_start_date", "11", "Start Date should not be greater than End Date", ErrorType.ERROR));
		if (this.goal_setting_end_date > this.end_date) this.errors.push(new ValidationError(this, "goal_setting_end_date", "11", "Value should lie within Appraisal Cycle", ErrorType.ERROR));
		if (this.goal_setting_start_date < this.start_date) this.errors.push(new ValidationError(this, "goal_setting_start_date", "11", "Value should lie within Appraisal Cycle", ErrorType.ERROR));
		if (this.review_enid_date > this.end_date) this.errors.push(new ValidationError(this, "review_enid_date", "11", "Value should lie within Appraisal Cycle", ErrorType.ERROR));
		if (this.review_start_date < this.start_date) this.errors.push(new ValidationError(this, "review_start_date", "11", "Value should lie within Appraisal Cycle", ErrorType.ERROR));
		return this.errors;
	}

	public get days_left_for_pending(): number {
		if (this.goal_setting_start_date > new Date()) {
			return this.getDaysDifference(this.goal_setting_start_date, new Date());
		} else if (this.goal_setting_start_date < new Date() && this.goal_setting_end_date > new Date()) {
			return this.getDaysDifference(this.goal_setting_end_date, new Date());
		}
		return 0;
	}
	public get days_left_for_review(): number {
		if (this.review_start_date > new Date()) {
			return this.getDaysDifference(this.review_start_date, new Date());
		} else if (this.review_start_date < new Date() && this.review_enid_date > new Date()) return this.getDaysDifference(this.review_enid_date, new Date());
		return 0;
	}
	public get goal_review_status() {
		if (this.review_start_date < new Date() && this.review_enid_date > new Date()) {
			return "In-progress";
		} else if (this.review_start_date && this.review_start_date < new Date()) {
			return "Completed";
		}
		return "Not Started";
	}
	public get goal_setting_status() {
		if (this.goal_setting_start_date < new Date() && this.goal_setting_end_date > new Date()) {
			return "In-progress";
		} else if (this.goal_setting_start_date && this.goal_setting_start_date < new Date()) {
			return "Completed";
		}
		return "Not Started";
	}
	public getDaysDifference(date1, date2) {
		// Ensure both dates are valid Date objects
		const startDate = new Date(date1);
		const endDate = new Date(date2);

		// Get the time difference in milliseconds
		const timeDifference = startDate - endDate;

		// Convert the time difference from milliseconds to days
		const dayDifference = timeDifference / (1000 * 60 * 60 * 24);

		return Math.round(dayDifference); // Return absolute value to handle negative differences
	}
}
