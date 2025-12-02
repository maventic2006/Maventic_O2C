import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_appraisal_cycl")
export default class p_pms_appraisal_cycl extends KloController {
	public async onAddChild() {
		this.setMode("Create");
		await this.tm.getTN("pms_appraisal_cycle_detail").getData().r_appraisal_quarter.newEntityP();
	}
	public async onPageEnter() {
		await this.tm.getTN("allYears").setData([new Date().getFullYear(), new Date().getFullYear() + 1]);
	}
	public async onReleaseAppraisal() {
		try {
			let selectedIndices = this.tm.getTN("pms_appraisal_cycle_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select an appraisal to proceed.");
			for (let index of selectedIndices) {
				this.tm.getTN("pms_appraisal_cycle_list").getData()[index].status = "Released";
			}
			await this.tm.commitP("Appraisal cycle released successfully.", "Failed while releasing...", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async OnDetailRelease() {
		try {
			this.tm.getTN("pms_appraisal_cycle_detail").getData().status = "Released";
			await this.tm.commitP("Appraisal cycle released successfully.", "Failed while releasing...", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
}
