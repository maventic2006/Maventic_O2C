import { KloController } from "kloTouch/jspublic/KloController";
import { Status } from "o2c_v2/util/enum";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_performance_em")
export default class p_pms_performance_em extends KloController {
	public async onPageEnter() {
		await this.tm.getTN("status_list").setData(Status.statusMgr);
		await this.tm.getTN("status_list_emp").setData(Status.statusEmp);
		await this.tm.getTN("status_list_agreed").setData(Status.agreedStatus);
	}
	public async navToRollout(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let rolloutID = this.tm.getTN("pms_performance_emp_hdr_list").getData()[oPath.split("/")[2]].rollout_id;
		await this.navTo({ S: "p_pms_apg_rollout", SS: "s_pms_apg_list", key: "d_pms_apg_rollout@@" + rolloutID, TN: "pms_apg_rollout_list" });
	}
	// public showEmpPlannedStatus(empPlannedStatus, mgrPlannedStatus) {
	// 	if (!mgrPlannedStatus) return Status.notStarted;

	// 	if (empPlannedStatus) return Status.completed;
	// 	return Status.started;
	// }
	public onEnterEmpStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Planned") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", 1);
		}
		if (value == "Waiting For Manager") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
		if (value == "Planned Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", false);
		}
	}
	public onSearchMgrStatus(oEvent) {
		let value = oEvent.getParameters().value;
		if (value == "Planned") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
		}
		if (value == "NA") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
		if (value == "Planned Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
		}
	}
	public async onSearchSettingStatus(oEvent) {
		let searchedValue = oEvent.mParameters.value;
		if (searchedValue == "Finalized") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("setting_actual_status", "Completed");
		} else if (searchedValue == "Pending") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		} else if (searchedValue == "Missed by MGR") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", false);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		} else if (searchedValue == "Missed by EMP") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", false);
		} else if (searchedValue == "Under Review") {
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_mgr_planned_submitted", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("employee_plan_status", 1);
			this.tm.getTN("pms_performance_emp_hdr_search").setProperty("is_final_planned_submitted", false);
		}
	}
	public async onResetSearch() {
		this.getActiveControlById("setting_statu_copy01", "s_pms_per_search").setValue(null);
		this.getActiveControlById("employee_plan_copy01", "s_pms_per_search").setValue(null);
		this.getActiveControlById("setting_statu_copy02", "s_pms_per_search").setValue(null);
		this.getActiveControlById("employee_plan_s", "s_pms_per_search").setValue(null);
		this.getActiveControlById("setting_statu_copy01", "s_pms_per_search").setValue(null);
	}
	public async onRefresh() {
		await this.tm.getTN("pms_performance_emp_hdr_list").getData().refreshP();
	}
}
