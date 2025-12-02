import { KloEntitySet } from "kloBo/KloEntitySet";
import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
import { d_pms_performance_hdr_item } from "o2c_v2/entity_gen/d_pms_performance_hdr_item";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_apg_rollout")
export default class p_pms_apg_rollout extends KloController {
	public allEmployeeData;
	public currentAnnualPerformance;
	public appraisalCycleData;
	public async onPageEnter() {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ppms");
		this.appraisalCycleData = await this.transaction.getExecutedQuery("d_pms_appraisal_cycle", { status: "Released", loadAll: true });
		let appraisalCycle = [];
		this.appraisalCycleData.forEach((data) => appraisalCycle.push({ key: data.appraisal_cycle_id, text: `${this.getAppraisalPeriod(data.from_date.getMonth())} ${data.from_date.getDate()}, ${data.from_date.getFullYear()} - ${this.getAppraisalPeriod(data.to_date.getMonth())} ${data.to_date.getDate()}, ${data.to_date.getFullYear()}` }));
		await this.tm.getTN("appraisal_cycle").setData(appraisalCycle);
		await this.tm.getTN("template_list").setData(await this.transaction.getExecutedQuery("q_pms_performance_header", { loadAll: true }));
		await this.tm.getTN("all_employee_list").setData(await this.transaction.getExecutedQuery("q_filter_employee", { loadAll: true }));
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		let designationList = await this.transaction.getExecutedQuery("d_o2c_designation_master", { loadAll: true, company_code: currentUserCompanyCode[0].company_code }); // Hardcoded company code should be removed.
		let departmentList = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { company_code: currentUserCompanyCode[0].company_code, loadAll: true });
		await this.tm.getTN("department_list").setData(departmentList);
		await this.tm.getTN("designation_list").setData(designationList);
	}
	public async onSelectAppraisalYear() {
		// let selectedAppraisalCycle = this.appraisalCycleData.filter((e) => e.appraisal_cycle_id == this.tm.getTN("pms_apg_rollout_detail").getData().appraisal_year); commenting this line of code as we are not showing appraisal year in rollout. So all the cycles should be shown.
		let appraisalCycle = [];
		this.appraisalCycleData.forEach((data) => appraisalCycle.push({ key: data.appraisal_cycle_id, text: `${this.getAppraisalPeriod(data.from_date.getMonth())} ${data.from_date.getDate()}, ${data.from_date.getFullYear()} - ${this.getAppraisalPeriod(data.to_date.getMonth())} ${data.to_date.getDate()}, ${data.to_date.getFullYear()}` }));
		await this.tm.getTN("appraisal_cycle").setData(appraisalCycle);
	}
	// Creating an entry for rollout sd
	public async onCreateRollout() {
		try {
			this.setTracker(await this.tm.getTN("pms_apg_rollout_list").createEntityP({ status: "Draft", hr_manager: "Abhipsa Parija" }, "Created Successfully", "Failed", "s_pms_apg_detail", "First", true, true));
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSubmitTemplateForm() {
		let busyDialog = new sap.m.BusyDialog({ text: "Creating..." });
		busyDialog.open();
		let selectedAppraisalCycle = this.appraisalCycleData.filter((e) => e.appraisal_cycle_id == this.tm.getTN("selected_cycle").getData());
		try {
			let selected_template = this.tm
				.getTN("template_list")
				.getData()
				.filter((e) => e.pgh_id == this.tm.getTN("selected_template_key").getData());
			await this.tm.getTN("pms_apg_rollout_list").createEntityP(
				{
					start_date: selected_template[0].start_date,
					end_date: selected_template[0].end_date,
					header_id: selected_template[0].pgh_id,
					pg_header_template: selected_template[0].header_desc,
					team_manager: this.tm.getTN("selected_manager").getData(),
					manager_id: this.tm.getTN("selected_manager_key").getData(),
					hr_manager: "Abhipsa Parija",
					status: "Draft",
					appraisal_year: this.tm.getTN("selected_year").getData(),
					appraisal_cycle: this.tm
						.getTN("appraisal_cycle")
						.getData()
						.filter((e) => e.key == this.tm.getTN("selected_cycle").getData())[0].text,
					appraisal_cycle_from: selectedAppraisalCycle[0].from_date,
					appraisal_cycle_to: selectedAppraisalCycle[0].to_date,
				},
				"Created Successfully",
				"Failed",
				"s_pms_apg_detail",
				"First",
				true,
				true
			);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_templates");
			busyDialog.close();
		}
	}
	public async onSelectedAppraisalCycle() {
		let selectedAppraisalCycle = this.appraisalCycleData.filter((e) => e.appraisal_cycle_id == this.tm.getTN("selected_cycle").getData());
		this.tm.getTN("pms_apg_rollout_detail").setProperty("appraisal_year", this.tm.getTN("selected_cycle").getData());
		this.tm.getTN("pms_apg_rollout_detail").setProperty("appraisal_cycle_from", selectedAppraisalCycle[0].from_date.getTime());
		this.tm.getTN("pms_apg_rollout_detail").setProperty("appraisal_cycle_to", selectedAppraisalCycle[0].to_date.getTime());
	}
	public async onSelectEmployee() {
		try {
			let busyDialog = new sap.m.BusyDialog({ text: "Loading employee data, please wait..." });
			busyDialog.open();
			let rolloutData = this.tm.getTN("pms_apg_rollout_detail").getData();
			this.currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: rolloutData.appraisal_year, loadAll: true });
			let qInstance = this.tm.getTN("pms_per_empsearch").getData();
			qInstance.appraisal_data = this.currentAnnualPerformance[0]?.ap_id;
			this.allEmployeeData = await qInstance.executeP();
			// await this.tm.getTN("pms_per_list").setData(this.allEmployeeData.filter((e) => e.included != "false"));
			await this.tm.getTN("employee_list").setData(this.allEmployeeData);
			this.openDialog("pa_emp_list");
			this.getActiveControlById(null, "s_employee_list")?.deselectAll();
			busyDialog.close();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onFilterEmployee(oEvent) {
		let searchedValue = oEvent.getParameters().newValue;
		let filterData = this.allEmployeeData.filter((empData) => empData.first_name.includes(searchedValue) || empData.last_name.includes(searchedValue) || empData.employee_id.toLowerCase().includes(searchedValue.toLowerCase()) || empData.employee_id.toUpperCase().includes(searchedValue.toUpperCase()));
		await this.tm.getTN("employee_list").setData(filterData);
	}
	public getYearDifference(to_time, from_time): number {
		// Convert the timestamp to a Date object
		const givenDate: any = new Date(from_time);
		// Get the current date
		const currentDate: any = new Date(to_time);
		// Calculate the difference in time between the two dates
		const differenceInMilliseconds = currentDate - givenDate;
		// Define the number of milliseconds in a year (365.25 days to account for leap years)
		const millisecondsInOneYear = 1000 * 60 * 60 * 24 * 365.25;
		// Calculate the difference in years (decimal years)
		const differenceInYears = differenceInMilliseconds / millisecondsInOneYear;
		// Output the result as a decimal value
		return parseFloat(differenceInYears.toFixed(1));
	}
	//Adding employees to current rollout
	public async onSubmit() {
		let oData = (<sap.ui.table.Table>this.getActiveControlById(null, "s_employee_list")).getSelectedIndices();
		if (oData.length <= 0) return sap.m["MessageToast"].show("Please select at least one employee to proceed.");
		let busyDialog = new sap.m.BusyDialog({ text: "Assigning team members to appraisal..." });
		let rolloutDetail = await this.tm.getTN("pms_apg_rollout_detail").getData();
		let annualPerformanceEmployee = this.tm.getTN("pms_per_list").getData();
		// let annualPerformanceEmployee = await this.transaction.getExecutedQuery("d_pms_annual_performance", { ap_id: apDetails.ap_id, loadAll: true });
		// let annualPerformanceEmployee = await annualPerformance[0]?.r_annual_per_employees.fetch(); fdsf
		this.setMode("Create");
		busyDialog.open();
		try {
			for (let i = 0; i < oData.length; i++) {
				let emp_data = this.tm.getTN("pms_per_list").getData()[oData[i]];
				// Validating employee whether already added to any other appraisal cycle
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
			// sap.m["MessageToast"].show("Employee added successfully");
		}
	}
	//Creating entries for employees
	public async createRollout(rolloutData?) {
		let rolloutDetail = (await this.tm.getTN("pms_apg_rollout_detail").getData()) || rolloutData;
		let rolloutEmployee = (await this.tm.getTN("pms_apg_rollout_detail").getData()?.r_rollout_employees?.fetch()) || (await rolloutData?.r_rollout_employees?.fetch());
		let headerItems = <KloEntitySet<d_pms_performance_hdr_item>>await this.transaction.getExecutedQuery("d_pms_performance_hdr_item", { pgh_id: rolloutDetail.pg_header_template, loadAll: true });
		for (let emp_data of rolloutEmployee) {
			await this.transaction.createEntityP("d_pms_performance_emp_hdr", {
				rollout_id: rolloutDetail.apg_id,
				manager_id: rolloutDetail.manager_id,
				hr: rolloutDetail.hr_manager_vh.description,
				employee_id: emp_data.emp_id,
				emp_name: emp_data.emp_name,
				official_mail: emp_data.official_mail,
				mgr_name: rolloutDetail.team_manager,
				status: rolloutDetail.status,
				goal_setting_rev_ed: rolloutDetail.review_enid_date,
				goal_setting_rev_sd: rolloutDetail.review_start_date,
				goal_setting_ed: rolloutDetail.goal_setting_end_date,
				goal_setting_sd: rolloutDetail.goal_setting_start_date,
				pgh_id: rolloutDetail.pg_header_template,
				header_desc: rolloutDetail.pg_header_template, // this property can store rollout if required.
				end_date: rolloutDetail.end_date,
				start_date: rolloutDetail.start_date,
				creation_date: new Date().getTime(),
				appraisal_cycle_from: rolloutDetail.appraisal_cycle_from,
				appraisal_cycle_to: rolloutDetail.appraisal_cycle_to,
				appaisal_year: rolloutDetail.appraisal_year,
				appraisal_cycle: rolloutDetail.appraisal_cycle,
				feedback_type: rolloutDetail.feedback_type,
				js_template: rolloutDetail.js_template,
				is_mgr_planned_submitted: false, // explicitly marking these property value to false, as BOL is storing null as default value to a boolean, It's an issue which is raised.Once we get the fix, can remove these.
				is_emp_planned_submitted: false,
				is_final_planned_submitted: false,
			});
			for (let item of headerItems) {
				await this.transaction.createEntityP("d_pms_performance_emp_item", {
					sequence_no: item.sequence_no,
					review: item.review,
					emp_id: emp_data.emp_id,
					pgh_id: item.pgh_id,
					item_scope: item.item_scope,
					track: emp_data.track,
					weightage: item.weightage,
					pge_description: item.pge_description,
					pg_group_ext: item.pg_group_ext,
					pg_group: item.pg_group,
					start_date: rolloutDetail.start_date,
					end_date: rolloutDetail.end_date,
					status: "Not Yet Started",
				});
			}
		}
	}
	public async onApprove() {
		let busyDialog = new sap.m.BusyDialog({ text: "Rollout in progress. Please wait..." });
		busyDialog.open();
		try {
			let selectedIndices = this.tm.getTN("pms_apg_rollout_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a rollout to proceed.");
			for (let index of selectedIndices) {
				if (this.tm.getTN("pms_apg_rollout_list").getData()[index].status == "Draft") {
					sap.m["MessageToast"].show("Approval not possible: HR release and Manager approval are pending");
					// return;
				} else if (this.tm.getTN("pms_apg_rollout_list").getData()[index].manager_status !== "Approved") {
					sap.m["MessageToast"].show("Approval not possible: Manager approval is still pending.");
					// return;
				} else if (this.tm.getTN("pms_apg_rollout_list").getData()[index].status == "HR Approved") {
					sap.m["MessageToast"].show(this.tm.getTN("pms_apg_rollout_list").getData()[index].apg_id + " is already approved!!!");
					// return;
				} else {
					this.tm.getTN("pms_apg_rollout_list").getData()[index].status = "HR Approved";
					await this.createRollout(this.tm.getTN("pms_apg_rollout_list").getData()[index]);
				}
			}
			if (this.tm.getTN("pms_apg_rollout_list").getData().isDirty) {
				await this.tm.commitP("Rollout completed successfully.", "Error While Saving !!!", true, true);
			}
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async onDetailApprove() {
		let rolloutData = this.tm.getTN("pms_apg_rollout_detail").getData();
		let busyDialog = new sap.m.BusyDialog({ text: "Rollout in progress. Please wait." });
		if (rolloutData.manager_status !== "Approved") {
			sap.m["MessageToast"].show("Approval not possible: Manager approval is still pending.");
			return;
		} else if (rolloutData.status == "Draft") {
			sap.m["MessageToast"].show("Approval not possible: HR release and Manager approval are pending");
			return;
		} else if (rolloutData.status == "HR Approved") {
			sap.m["MessageToast"].show(rolloutData.apg_id + " is already approved!!!");
			return;
		}
		busyDialog.open();
		this.tm.getTN("pms_apg_rollout_detail").setProperty("status", "HR Approved");
		try {
			await this.createRollout();
			await this.setTracker(this.tm.getTN("pms_apg_rollout_detail").getData());
			await this.tm.commitP("Rollout completed successfully.", "Error in Rollout !!!", true, true);
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public async onNavToHeader(oEvent) {
		await this.navTo({ S: "p_pms_performance_he", SS: "s_r_heade_list", D: "d_pms_performance_header@@" + this.tm.getTN("pms_apg_rollout_detail").getData().pg_header_template }, oEvent);
	}
	public async onReleaseRollout() {
		let mBox = await this.getMessageBox();
		let employeeInRollout = this.tm.getTN("pms_apg_rollout_detail").getData().r_rollout_employees;
		if (employeeInRollout.length <= 0) return mBox.information("No employees found for this rollout. Please add employees first.");
		await mBox.confirm("Are you sure you want to release?", {
			actions: [mBox.Action.YES, mBox.Action.NO],
			emphasizedAction: mBox.Action.YES,
			onClose: async (oAction) => {
				if (oAction == "YES") {
					this.tm.getTN("pms_apg_rollout_detail").getData().status = "HR Released";
					this.tm.getTN("pms_apg_rollout_detail").getData().manager_status = "In-progress";
					await this.setTracker(this.tm.getTN("pms_apg_rollout_detail").getData());
					await this.tm.commitP("Released Successfully", "Error While Releasing !!!", true, true);
				}
			},
		});
	}
	/*Formatter function to show the rollout status.*/
	public async setStatus(managerStatus, hrStatus) {
		if (managerStatus == "Approved" && hrStatus == "HR Released") {
			return "Manager Approved";
		} else if (managerStatus == "Approved" && hrStatus == "HR Approved") return "HR Approved";
		else if (managerStatus != "Approved" && hrStatus == "HR Released") return "HR Released";
		else return "Draft";
	}

	/*Formatter function to show the designation based upon company code.*/
	public async designationSelect(value) {
		let currentUserCompanyCode = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: this.transaction.getUserID() });
		return currentUserCompanyCode[0].company_code;
	}
	public async OnPressSaveEmployee() {
		let totalEmpAddedInRollout = this.tm.getTN("r_rollout_employees_list").getData().length;
		this.tm.getTN("pms_apg_rollout_detail").getData().employee_count = totalEmpAddedInRollout;

		await this.tm.commitP("Saved Successful!", "Failed while saving", true, true);
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
	public getReviewCount(status, count) {
		if (status == "In-progress") return "Started";
		else if (status == "Not Started" && count > 30) return "Not Started";
		else if (status == "Not Started" && count < 30) return count + " d left";
		return "Completed";
	}
	public async onNavToRolloutDetail(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		this.navTo({ SS: "s_pms_apg_detail" }, oEvent);
		await this.setTracker(this.tm.getTN("pms_apg_rollout_list").getData()[path.split("/")[2]]);
		await this.isRolloutEditButtonVis(this.tm.getTN("pms_apg_rollout_list").getData()[path.split("/")[2]]);
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
	public async onSaveRollout() {
		await this.setTracker(this.tm.getTN("pms_apg_rollout_detail").getData());
		await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
	}
	public async onSubmitSelectedManager() {
		try {
			let selectedManagerIndex = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getSelectedIndices();
			let selectedManagerData = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getData()[selectedManagerIndex];
			this.tm.getTN("pms_apg_rollout_detail").setProperty("team_manager", selectedManagerData.full_name);
			this.tm.getTN("pms_apg_rollout_detail").setProperty("manager_id", selectedManagerData.employee_id);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_manager_list");
		}
	}
	public async onSelectedManagerForSearch() {
		try {
			let selectedManagerIndex = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getSelectedIndices();
			let selectedManagerData = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getData()[selectedManagerIndex];
			this.tm.getTN("pms_apg_rollout_search").setProperty("team_manager", selectedManagerData.full_name);
			this.tm.getTN("pms_apg_rollout_search").setProperty("manager_id", selectedManagerData.employee_id);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_search_mgr_dialog");
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
	public async onDeleteRollout() {
		let bDialog = new sap.m.BusyDialog();
		let selectedIndex = this.tm.getTN("pms_apg_rollout_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No item selected");
		for (let index of selectedIndex) {
			let rolloutData = this.tm.getTN("pms_apg_rollout_list").getData()[index];
			if (rolloutData.status !== "Draft" && rolloutData.manager_status == "Approved") return sap.m["MessageToast"].show("Only draft and released rollout can be deleted.");
		}
		let messageBox = await this.getMessageBox();
		await messageBox.warning("This action cannot be undone, are you sure you want to delete ?", {
			actions: [messageBox.Action.OK, messageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					bDialog.open();
					for (let index = selectedIndex.length - 1; index >= 0; index--) {
						let rolloutData = this.tm.getTN("pms_apg_rollout_list").getData()[selectedIndex[index]];
						let currentAnnualPerformance = await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: rolloutData.appraisal_year, loadAll: true });
						let qInstance = this.tm.getTN("pms_per_empsearch").getData();
						qInstance.appraisal_id = currentAnnualPerformance[0]?.ap_id;
						qInstance.loadAll = true;
						let appraisalEmployees = await qInstance.executeP();
						let rolloutEmployees = await this.tm.getTN("pms_apg_rollout_list").getData()[selectedIndex[index]].r_rollout_employees?.fetch();
						//getting delta between appraisalEmployee and rolloutEmployee and removing delta employees from this appraisal.
						if (rolloutEmployees.length > 0) {
							for (let emp of rolloutEmployees) {
								let appEmp = appraisalEmployees.filter((e) => e.employee_id == emp.emp_id);
								appEmp[0].included = "all";
							}
						}
						await this.tm.getTN("pms_apg_rollout_list").getData()[selectedIndex[index]].deleteP();
					}
					await this.tm.commitP("Deleted successfully", "deletion failed", true, true);
					bDialog.close();
				}
			},
		});
	}
	public async onDeleteEmp() {
		let oThis = this;
		let bDialog = new sap.m.BusyDialog();
		let selectedIndex = this.tm.getTN("r_rollout_employees_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No item selected");
		let qInstance = this.tm.getTN("pms_per_empsearch").getData();
		this.currentAnnualPerformance = this.currentAnnualPerformance || (await this.transaction.getExecutedQuery("d_pms_annual_performance", { appraisal_year: this.tm.getTN("pms_apg_rollout_detail").getData().appraisal_year, loadAll: true }));
		qInstance.appraisal_id = this.currentAnnualPerformance[0]?.ap_id;
		qInstance.loadAll = true;
		let allEmployeeData = await qInstance.executeP();
		let messageBox = await this.getMessageBox();
		await messageBox.warning(`This action cannot be undone, are you sure you want to delete (${selectedIndex.length} item) ?`, {
			actions: [messageBox.Action.DELETE, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.DELETE,
			onClose: async (oAction) => {
				if (oAction == "DELETE") {
					bDialog.open();
					for (let index = selectedIndex.length - 1; index >= 0; index--) {
						let empData = allEmployeeData.filter((e) => e.employee_id == oThis.tm.getTN("r_rollout_employees_list").getData()[selectedIndex[index]].emp_id);
						empData[0].included = "all";
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
	public async onRefresh() {
		await this.tm.getTN("pms_apg_rollout_list").getData().refreshP();
		let qInstance = <any>await this.transaction.getQueryP("d_pms_rollout_employees");
		await qInstance.refreshP();
	}
	public async isRolloutEditButtonVis(rolloutDetail) {
		if (rolloutDetail.status == "HR Released" && rolloutDetail.manager_status !== "Approved") return await this.tm.getTN("isRolloutEditButtonVis").setData(false);
		if (rolloutDetail.status == "HR Approved") return await this.tm.getTN("isRolloutEditButtonVis").setData(false);
		return await this.tm.getTN("isRolloutEditButtonVis").setData(true);
	}
}
