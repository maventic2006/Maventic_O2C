import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_annual_perform")
export default class p_pms_annual_perform extends KloController {
	public appraisalCycleData;
	public async onPageEnter() {
		this.tm.getTN("quick_filter_text").setData({ value: "Showing Included" });
		this.appraisalCycleData = await this.transaction.getExecutedQuery("d_pms_appraisal_cycle", { status: "Released", loadAll: true });
		await this.tm.getTN("all_employee_list").setData(await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true }));
	}
	public async onQuickFilter(oEvent, param) {
		let selectedFilter = oEvent.mParameters.item.mProperties.text;
		// await this.tm.getTN("quick_filter_text").setData({ value: selectedFilter });
		if (selectedFilter == "Show Excluded") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Showing Excluded" });
			return this.filterData("false");
		} else if (selectedFilter == "Show Included") {
			await this.tm.getTN("quick_filter_text").setData({ value: "Showing Included" });
			return this.filterData("true");
		}
		await this.tm.getTN("quick_filter_text").setData({ value: "Showing All" });
		this.filterData(undefined);
	}
	public filterData(isIncluded) {
		let oSection = this.getActiveControlById(null, "s_r_annua_list");
		let aFilter;
		if (isIncluded !== undefined) {
			aFilter = new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("included", sap.ui.model.FilterOperator.EQ, isIncluded)],
			});
		}
		let oBindings = oSection.getBinding("rows");
		(<sap.ui.model.json.JSONListBinding>oBindings).filter(aFilter);
	}
	public async onCreateAnnualPerformance() {
		await this.tm.getTN("pms_annual_performance_list").createEntityP({}, null, null, "s_pms_ann_detail", "First", true, true);
		await this.tm.getTN("activeEmployeeData").setData(null);
	}
	public async onSelectAppraisalYear() {
		let selectedAppraisalCycle = this.appraisalCycleData.filter((e) => e.appraisal_cycle_id == this.tm.getTN("pms_annual_performance_detail").getData().appraisal_year);
		let appraisalCycle = [];
		selectedAppraisalCycle.forEach((data) => appraisalCycle.push({ key: data.appraisal_cycle_id, text: `${this.getAppraisalPeriod(data.from_date.getMonth())} ${data.from_date.getDate()}, ${data.from_date.getFullYear()} - ${this.getAppraisalPeriod(data.to_date.getMonth())} ${data.to_date.getDate()}, ${data.to_date.getFullYear()}` }));
		await this.tm.getTN("appraisal_cycle").setData(appraisalCycle);
	}
	public getAppraisalPeriod(month) {
		switch (month) {
			case 0:
				return "Jan";
			case 1:
				return "Feb";
			case 2:
				return "Mar";
			case 3:
				return "Apr";
			case 4:
				return "May";
			case 5:
				return "Jun";
			case 6:
				return "Jul";
			case 7:
				return "Aug";
			case 8:
				return "Sept";
			case 9:
				return "Oct";
			case 10:
				return "Nov";
			case 11:
				return "Dec";
		}
	}
	public async navToDetail(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		await this.navTo({ SS: "s_pms_ann_detail" }, oEvent);
		let allActiveEmployees = await this.transaction.getExecutedQuery("d_pms_annual_per_employees", { ap_id: this.tm.getTN("pms_annual_performance_list").getData()[oPath.split("/")[2]].ap_id, loadAll: true });
		await this.setAppraisalCount(allActiveEmployees);
	}
	public async setAppraisalCount(allActiveEmployees) {
		let includedEmployee = allActiveEmployees.filter((empData) => empData.included == "true");
		let excludedEmployee = allActiveEmployees.filter((empData) => empData.included == "false");
		await this.tm.getTN("activeEmployeeData").setData({ total_employees: allActiveEmployees.length, included_count: includedEmployee.length, excluded_count: excludedEmployee.length });
		await this.tm.getTN("quick_filters").setData(["Show Excluded", "Show Included", "Show All"]);
	}
	public async onRelease() {
		try {
			let selectedIndices = this.tm.getTN("pms_annual_performance_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select an appraisal to proceed.");
			for (let index of selectedIndices) {
				this.tm.getTN("pms_annual_performance_list").getData()[index].status = "1";
			}
			await this.tm.commitP("Appraisal cycle released successfully", "Failed While Releasing...", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSaveAppraisal() {
		await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
		await this.tm.getTN("pms_annual_performance_detail").getData().r_annual_per_employees.refreshP();
		await this.setAppraisalCount(this.tm.getTN("pms_annual_performance_detail").getData().r_annual_per_employees);
	}
	public async showEmpIncludedList(oEvent, isIncluded = "true") {
		let flag = false;
		let oThis = this;
		let oSection = this.getActiveControlById(null, "s_r_annua_list");
		oSection.addEventDelegate({
			onAfterRendering: function (oEvent) {
				if (flag) return;
				let aFilter = new sap.ui.model.Filter({
					filters: [new sap.ui.model.Filter("included", sap.ui.model.FilterOperator.EQ, isIncluded)],
				});
				let oBindings = oSection.getBinding("rows");
				(<sap.ui.model.json.JSONListBinding>oBindings).filter(aFilter);
				flag = true;
			},
		});
	}

	public async onClickExclude() {
		let selectedIndices = this.tm.getTN("r_annual_per_employees_list").getSelectedIndices();
		if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select an employee to proceed.");
		await this.tm.getTN("exclusion_reason").setData(null);
		this.openDialog("pa_reason_dialog");
	}
	public async submitExclude() {
		try {
			let selectedIndices = this.tm.getTN("r_annual_per_employees_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select an employee to proceed.");
			for (let index of selectedIndices) {
				this.tm.getTN("r_annual_per_employees_list").getData()[index].included = "false";
				this.tm.getTN("r_annual_per_employees_list").getData()[index].exclusion_reason = this.tm.getTN("exclusion_reason").getData();
			}
			await this.tm.commitP("Selected employee excluded successfully.", "Failed While Excluding...", true, true);
			this.closeDialog("pa_reason_dialog");
		} catch (e) {
			throw new Error(e);
		}
	}
}
