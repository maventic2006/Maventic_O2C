import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_job_desc")
export default class p_pms_job_desc extends KloController {
	public async navToDetail() {
		try {
			await this.tm.getTN("pms_job_description_list").createEntityP({}, null, null, "s_pms_job_detail", "First", true, true, false);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSaveChild() {
		try {
			await this.tm.commitP("Successfully Committed", "Failed", true, true);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_dialog");
		}
	}
	public async onSelectAttribute(oEvent) {
		let busyDialog = new sap.m.BusyDialog({ text: "loading..." });
		busyDialog.open();
		let oPath = this.getPathFromEvent(oEvent);
		let selectedAttribute = oEvent.mParameters.selectedItem.mProperties;
		let attributeData = <any>await this.transaction.getExecutedQuery("d_pms_attribute", { attribute_id: selectedAttribute.key, loadAll: true, skipMap: true });
		this.tm.getTN("r_pms_jd_skills_list").getData()[oPath.split("/")[2]].attribute_type = attributeData[0].attribute_type;
		this.tm.getTN("r_pms_jd_skills_list").getData()[oPath.split("/")[2]].lower_base = attributeData[0].lower_base;
		this.tm.getTN("r_pms_jd_skills_list").getData()[oPath.split("/")[2]].higher_base = attributeData[0].higher_base;
		busyDialog.close();
	}
	public async onCreateChild() {
		this.setMode("CREATE");
		await this.tm.getTN("pms_job_description_detail").getData().r_pms_jd_skills.newEntityP();
	}
	public async showAttributeList() {
		let busyDialog = new sap.m.BusyDialog({ text: "Loading all attributes..." });
		try {
			busyDialog.open();
			let attributesData = await this.transaction.getExecutedQuery("q_pms_attribute", { loadAll: true });
			await this.tm.getTN("attributes").setData(attributesData);
			this.openDialog("pa_attributes");
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async onSubmitAttributes() {
		this.setMode("CREATE");
		let attributeData = this.tm.getTN("attributes").getData();
		let selectedIndices = (<sap.ui.table.Table>this.getActiveControlById(null, "s_attributes")).getSelectedIndices();
		for (let index of selectedIndices) {
			await this.tm
				.getTN("pms_job_description_detail")
				.getData()
				.r_pms_jd_skills.newEntityP(-1, { sequence_no: this.tm.getTN("r_pms_jd_skills_list").getData().length + 1, attribute_text: attributeData[index].attribute_id, attribute_type: attributeData[index].attribute_type, lower_base: attributeData[index].lower_base, higher_base: attributeData[index].higher_base });
		}
		this.closeDialog("pa_attributes");
	}
	public async onClickCopy(oEvent, param) {
		let busyDialog = new sap.m.BusyDialog();
		let selectedIndex = this.tm.getTN("pms_job_description_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a skill matrix to proceed.");
		busyDialog.open();
		let copyData;
		if (param.param == "list") {
			copyData = this.tm.getTN("pms_job_description_list").getData()[selectedIndex[0]];
		} else {
			copyData = this.tm.getTN("pms_job_description_detail").getData();
		}
		try {
			let pData = await this.tm.getTN("pms_job_description_list").createEntityP({ role_description: copyData.role_description, status: copyData.status, valid_from: copyData.valid_from, valid_to: copyData.valid_to }, null, null, null, "First", true, true, false);
			let childData = await copyData.r_pms_jd_skills.fetch();
			if (childData.length > 0) {
				let oRelData = [];
				for (let jd_skill of childData) {
					oRelData.push(await pData.r_pms_jd_skills.newEntityP(0, { attribute_text: jd_skill.attribute_text, attribute_type: jd_skill.attribute_type, base_rating: jd_skill.base_rating, criticality: jd_skill.criticality, higher_base: jd_skill.higher_base, lower_base: jd_skill.lower_base, remarks: jd_skill.remarks, weightage: jd_skill.weightage }));
				}
				await this.tm.getTN("r_pms_jd_skills_list").setData(oRelData);
			}
		} catch (e) {
			throw new Error(e);
		}
		await this.navTo({ SS: "s_pms_job_detail" });
		busyDialog.close();
	}
	public async onReleaseJD() {
		try {
			let selectedIndices = this.tm.getTN("pms_job_description_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a skill matrix to proceed.");
			for (let index of selectedIndices) {
				this.tm.getTN("pms_job_description_list").getData()[index].status = "1";
			}
			await this.tm.commitP("The selected skill matrix has been released.", "Failed While Releasing...", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSaveJobSkill() {
		let weightageSum = 0;
		this.tm
			.getTN("r_pms_jd_skills_list")
			.getData()
			.filter((e) => (weightageSum += e.weightage));
		if (weightageSum > 100) {
			return (await this.getMessageBox()).information("Please ensure that the total weightage is 100 or less.");
		}
		await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
	}
}
