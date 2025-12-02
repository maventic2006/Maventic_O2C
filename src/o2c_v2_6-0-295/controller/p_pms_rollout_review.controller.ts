import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_rollout_review")
export default class p_pms_rollout_review extends KloController {
	public allEmployeeData;
	public async onPageEnter() {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ppms");
		let appraisalCycle = [];
		let appraisalCycleData = await this.transaction.getExecutedQuery("d_pms_appraisal_cycle", { status: "Released", loadAll: true });
		appraisalCycleData.forEach((data) => appraisalCycle.push({ key: data.appraisal_cycle_id, text: `${this.getAppraisalPeriod(data.from_date.getMonth())} ${data.from_date.getDate()}, ${data.from_date.getFullYear()} - ${this.getAppraisalPeriod(data.to_date.getMonth())} ${data.to_date.getDate()}, ${data.to_date.getFullYear()}` }));
		await this.tm.getTN("appraisal_cycle").setData(appraisalCycle);
		await this.tm.getTN("all_employee_list").setData(await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true }));
		//checking logged in user's company code
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		let designationList = await this.transaction.getExecutedQuery("d_o2c_designation_master", { loadAll: true, company_code: currentUserCompanyCode[0].company_code });
		let departmentList = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { company_code: currentUserCompanyCode[0].company_code, loadAll: true });
		await this.tm.getTN("department_list").setData(departmentList);
		await this.tm.getTN("designation_list").setData(designationList);
		await this.tm.getTN("status_list").setData(["Approved", "Rejected", "In-progress"]);
	}

	public async onSelectEmployee() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			let rolloutData = this.tm.getTN("pms_apg_rollout_detail").getData();
			let annualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: rolloutData.appraisal_year, loadAll: true });
			let qInstance = this.tm.getTN("pms_per_empsearch").getData();
			qInstance.appraisal_data = annualPerformance[0]?.ap_id;
			this.allEmployeeData = await qInstance.executeP();
			await this.tm.getTN("employee_list").setData(this.allEmployeeData);
			this.openDialog("pa_emp_list");
			this.getActiveControlById(null, "s_employee_list")?.deselectAll();
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async getSettingCount(param) {
		let performanceData = await this.transaction.getExecutedQuery("d_pms_performance_emp_hdr", { rollout_id: param, setting_actual_status: "Completed" });
		return performanceData.length;
	}
	public async getComReviewCount(param) {
		let performanceData = await this.transaction.getExecutedQuery("d_pms_performance_emp_hdr", { rollout_id: param, review_actual_status: "Completed" });
		return performanceData.length;
	}
	public async onSubmit() {
		let oData = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (oData.length <= 0) return sap.m["MessageToast"].show("No Items Selected");
		let busyDialog = new sap.m.BusyDialog({ text: "Creating..." });
		let rolloutDetail = await this.tm.getTN("pms_apg_rollout_detail").getData();
		let annualPerformanceEmployee = this.tm.getTN("pms_per_list").getData();
		// let annualPerformanceEmployee = await this.transaction.getExecutedQuery("d_pms_annual_performance", { ap_id: apDetails.ap_id, loadAll: true });
		// let annualPerformanceEmployee = await annualPerformance[0]?.r_annual_per_employees.fetch(); fdsf
		this.setMode("Create");
		busyDialog.open();
		try {
			for (let i = 0; i < oData.length; i++) {
				let emp_data = this.tm.getTN("pms_per_list").getData()[oData[i]];
				// validate this employee is added to any other appraisal cycle or not
				let isEmpAddedToAppraisal = await this.transaction.getExecutedQuery("d_pms_annual_per_employees", { loadAll: true, employee_id: emp_data.employee_id, included: "true" });
				let currentRolloutEmp = this.tm.getTN("r_rollout_employees_list").getData();
				let isEmpAlreadySelected;
				if (currentRolloutEmp.length > 0) {
					isEmpAlreadySelected = currentRolloutEmp.filter((e) => e.emp_id == emp_data.employee_id);
				}
				if (isEmpAddedToAppraisal.length > 0 || (currentRolloutEmp.length > 0 && isEmpAlreadySelected?.length > 0)) {
					sap.m["MessageToast"].show(`Can not add employee ${emp_data.full_name} as he is added to another appraisal cycle`);
					continue;
				}
				await this.tm
					.getTN("pms_apg_rollout_detail")
					.getData()
					.r_rollout_employees.newEntityP(0, { official_mail: emp_data.official_mail, department: emp_data.department, designation: emp_data.designation, total_year_experience: emp_data.total_year_experience, current_experience: emp_data.current_experience, date_of_joining: emp_data.joining_date, emp_id: emp_data.employee_id, emp_name: emp_data.first_name + " " + emp_data.last_name, status: "Not Started" });

				let filterData = annualPerformanceEmployee.filter((e) => e.employee_id == emp_data.employee_id);
				if (filterData.length > 0) {
					filterData[0].included = "true";
				}
			}
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_emp_list");
			busyDialog.close();
		}
	}
	public async onFilterEmployee(oEvent) {
		let searchedValue = oEvent.getParameters().newValue;
		let filterData = this.allEmployeeData.filter((empData) => empData.first_name.includes(searchedValue) || empData.last_name.includes(searchedValue) || empData.employee_id.includes(searchedValue));
		await this.tm.getTN("employee_list").setData(filterData);
	}
	public async onNavToHeader(oEvent) {
		await this.navTo({ S: "p_pms_performance_he", SS: "s_pms_per_detail", D: "d_pms_performance_header@@" + this.tm.getTN("pms_apg_rollout_detail").getData().pg_header_template }, oEvent);
	}
	public getReviewCount(status, count) {
		if (status == "In-progress") return "Started";
		else if (status == "Not Started" && count > 30) return "Not Started";
		else if (status == "Not Started" && count < 30) return count + " d left";
		return "Completed";
	}
	public async onApprove() {
		let busyDialog = new sap.m.BusyDialog({});
		try {
			let selectedIndices = this.tm.getTN("pms_apg_rollout_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No Item Selected!!!");
			busyDialog.open();
			for (let index of selectedIndices) {
				// PR0030 @Arjun 28Aug2025 APPS-2166
				if (this.tm.getTN("pms_apg_rollout_list").getData()[index].manager_status == "Approved") {
					sap.m["MessageToast"].show(this.tm.getTN("pms_apg_rollout_list").getData()[index].apg_id + " is already approved!!!");
					// return;
				} else if (this.tm.getTN("pms_apg_rollout_list").getData()[index].status == "HR Released" && this.tm.getTN("pms_apg_rollout_list").getData()[index].manager_status !== "Approve") this.tm.getTN("pms_apg_rollout_list").getData()[index].manager_status = "Approved";
			}
			if (this.tm.getTN("pms_apg_rollout_list").getData().isDirty) {
				await this.tm.commitP("Rollout approved", "Error While Approving !!!", true, true);
			}
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public openRejectDialog() {
		this.tm.getTN("remarks").setData(null);
		this.openDialog("pa_reject_dialog");
	}
	public async onSubmitReject() {
		let busyDialog = new sap.m.BusyDialog({});
		let selectedIndices = this.tm.getTN("pms_apg_rollout_list").getSelectedIndices();
		if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No Item Selected!!!");
		busyDialog.open();
		for (let index of selectedIndices) {
			if (this.tm.getTN("pms_apg_rollout_list").getData()[index].status == "HR Released") {
				this.tm.getTN("pms_apg_rollout_list").getData()[index].manager_status = "Rejected";
				this.tm.getTN("pms_apg_rollout_list").getData()[index].mgr_remarks = this.tm.getTN("remarks").getData();
				this.tm.getTN("pms_apg_rollout_list").getData()[index].status == "Draft";
			}
			try {
				if (this.tm.getTN("pms_apg_rollout_list").getData().isDirty) {
					await this.tm.commitP("Rollout rejected", "Error While Approving !!!", true, true);
				}
			} catch (e) {
				throw new Error(e);
			} finally {
				busyDialog.close();
			}
		}
	}
	public async onDetailApprove() {
		// let selectedIndices = this.tm.getTN('pms_apg_rollout_list').getSelectedIndices
		let busyDialog = new sap.m.BusyDialog();
		let mBox = await this.getMessageBox();
		busyDialog.open();
		try {
			await mBox.confirm("Are you sure you want to approve?", {
				actions: [mBox.Action.YES, mBox.Action.NO],
				emphasizedAction: mBox.Action.YES,
				onClose: async (oAction) => {
					if (oAction == "YES") {
						this.tm.getTN("pms_apg_rollout_detail").setProperty("manager_status", "Approved");
						await this.tm.commitP("Approved successfully", "Error while Approving...", true, true);
						await this.setTracker(this.tm.getTN("pms_apg_rollout_detail").getData());
					}
				},
			});
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async onNavToRolloutDetail(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		this.navTo({ SS: "s_pms_apg_detail" }, oEvent);
		await this.setTracker(this.tm.getTN("pms_apg_rollout_list").getData()[path.split("/")[2]]);
	}
	public async setTracker(rolloutDetail) {
		let trackArray = [];
		if (rolloutDetail.manager_status == "Approved" && rolloutDetail.status == "HR Approved") {
			trackArray.push({ flag: true, text: "HR Released" });
			trackArray.push({ flag: true, text: "Manager Approved" });
			trackArray.push({ flag: true, text: "HR Approved" });
		} else if (rolloutDetail.status == "HR Released" && rolloutDetail.manager_status == "Approved") {
			trackArray.push({ flag: true, text: "HR Released" });
			trackArray.push({ flag: true, text: "Manager Approved" });
			trackArray.push({ flag: false, text: "HR Approved" });
		} else if (rolloutDetail.status == "HR Released") {
			trackArray.push({ flag: true, text: "HR Released" });
			trackArray.push({ flag: false, text: "Manager Approved" });
			trackArray.push({ flag: false, text: "HR Approved" });
		} else if (rolloutDetail.status == "Draft") {
			trackArray.push({ flag: false, text: "HR Released" });
			trackArray.push({ flag: false, text: "Manager Approved" });
			trackArray.push({ flag: false, text: "HR Approved" });
		}
		await this.tm.getTN("timeline").setData(trackArray);
	}
	/*Formatter function to show the designation based upon company code.*/
	public async designationSelect(value) {
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		return currentUserCompanyCode[0].company_code;
	}
	public async onDeleteEmp() {
		let oThis = this;
		let bDialog = new sap.m.BusyDialog();
		let selectedIndex = this.tm.getTN("r_rollout_employees_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No item selected");
		let qInstance = this.tm.getTN("pms_per_empsearch").getData();
		let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: this.tm.getTN("pms_apg_rollout_detail").getData().appraisal_year, loadAll: true });
		qInstance.appraisal_id = currentAnnualPerformance[0]?.ap_id;
		qInstance.loadAll = true;
		let allEmployeeData = await qInstance.executeP();
		let messageBox = await this.getMessageBox();
		await messageBox.warning("This action cannot be undone, are you sure you want to delete ?", {
			actions: [messageBox.Action.OK, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.OK,
			onClose: async (oAction) => {
				if (oAction == "OK") {
					bDialog.open();
					for (let index = selectedIndex.length - 1; index >= 0; index--) {
						let empData = allEmployeeData.filter((e) => e.employee_id == oThis.tm.getTN("r_rollout_employees_list").getData()[selectedIndex[index]].emp_id);
						empData[0].included = undefined;
						await oThis.tm.getTN("r_rollout_employees_list").getData()[selectedIndex[index]].deleteP();
					}
					let totalEmpAddedInRollout = oThis.tm.getTN("r_rollout_employees_list").getData().length;
					oThis.tm.getTN("pms_apg_rollout_detail").setProperty("employee_count", totalEmpAddedInRollout);
					await oThis.tm.commitP("Deleted successfully", "deletion failed", true, true);
					bDialog.close();
				}
			},
		});
	}
	public async OnPressSaveEmployee() {
		let totalEmpAddedInRollout = this.tm.getTN("r_rollout_employees_list").getData().length;
		this.tm.getTN("pms_apg_rollout_detail").getData().employee_count = totalEmpAddedInRollout;

		await this.tm.commitP("Saved Successful!", "Failed while saving", true, true);
	}
	/*Formatter function to show the rollout status.*/
	public async setStatus(managerStatus, hrStatus) {
		if (managerStatus == "Approved" && hrStatus == "HR Released") {
			return "Manager Approved";
		} else if (managerStatus == "Approved" && hrStatus == "HR Approved") return "HR Approved";
		else if (managerStatus != "Approved" && hrStatus == "HR Released") return "HR Released";
		else return "Draft";
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
	public async onRefresh() {
		await this.tm.getTN("pms_apg_rollout_list").getData().refreshP();
		let qInstance = <any>await this.transaction.getQueryP("d_pms_rollout_employees");
		await qInstance.refreshP();
	}
}
