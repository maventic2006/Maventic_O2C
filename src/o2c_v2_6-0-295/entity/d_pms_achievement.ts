import { d_pms_achievement as d_pms_achievement_gen } from "o2c_v2/entity_gen/d_pms_achievement";
export class d_pms_achievement extends d_pms_achievement_gen {
	public appraisalData;
	// public get appraisal_quarter(): string {
	// 	return this.g("appraisal_quarter", "string");
	// }
	// public async getAppraisalData() {
	// 	this.appraisalData = await this.txn.getExecutedQuery("d_pms_appraisal_cycle", { loadAll: true });
	// }
	// public set appraisal_quarter(new_value: Date) {
	// 	let achievement_date: Date = new_value;
	// 	for (let data of this.appraisalData) {
	// 		if (data.appraisal_cycle_from >= achievement_date && data.appraisal_cycle_to <= achievement_date) {
	// 			for (let item of data.r_appraisal_quarter) {
	// 				if (item.appraisal_quarter_from >= achievement_date && item.appraisal_quarter_to <= achievement_date) {
	// 					this.s("appraisal_quarter", item.appraisal_quarter_from + "-" + item.appraisal_quarter_to, "string", false, false);
	// 					break;
	// 				}
	// 			}
	// 		}
	// 	}

	// 	// let appraisalQuarter;
	// 	// if (achievement_date.getMonth() >= 0 && achievement_date.getMonth() <= 2) appraisalQuarter = "Jan-Mar ";
	// 	// if (achievement_date.getMonth() >= 3 && achievement_date.getMonth() <= 5) appraisalQuarter = "Apr-Jun ";
	// 	// if (achievement_date.getMonth() >= 6 && achievement_date.getMonth() <= 8) appraisalQuarter = "Jul-Sep ";
	// 	// if (achievement_date.getMonth() >= 9 && achievement_date.getMonth() <= 11) appraisalQuarter = "Oct-Dec ";
	// 	// new_value = appraisalQuarter + achievement_date.getFullYear();
	// }
	// public get date_of_achievement(): Date {
	// 	return this.g("date_of_achievement", "Date");
	// }
	// public set date_of_achievement(new_value) {
	// 	this.s("date_of_achievement", new_value, "Date", false, false);
	// 	this.appraisal_cycle = this.date_of_achievement.getFullYear() + "";
	// 	this.appraisal_quarter = new_value;
	// }
}
