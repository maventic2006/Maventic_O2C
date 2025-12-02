import { KloEntitySet } from 'kloBo_7-2-103';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_emp_general_config } from 'o2c_v2/entity_gen/d_o2c_emp_general_config';
import { d_o2c_emp_pa_cycle } from 'o2c_v2/entity_gen/d_o2c_emp_pa_cycle';
import { d_o2c_emp_pa_planning_hdr } from 'o2c_v2/entity_gen/d_o2c_emp_pa_planning_hdr';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_employee_benefitconfig } from 'o2c_v2/entity_gen/d_o2c_employee_benefitconfig';
import { d_o2c_employee_designation } from 'o2c_v2/entity_gen/d_o2c_employee_designation';
import { d_o2c_employee_salary_hdr } from 'o2c_v2/entity_gen/d_o2c_employee_salary_hdr';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_assgn_category")
export default class p_emp_assgn_category extends KloController {
	public empGrading = [];
	public paCycleTableData = [];
	public employeeData = [];
	public allLMGraded = [];
	public loginID;
	public roleID;

	public async onPageEnter() {
		//access control
		let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
		if (general_config[0].high_value == 1) {

			let busyDialog = new sap.m.BusyDialog({
				text: "Please Wait, Data is loading.."
			});
			busyDialog.open();
			this.tm.getTN("other").setData({});
			await this.tm.getTN("button_visiblity").setData({ 'visible': true });

			this.loginID = (await this.transaction.get$User()).login_id;
			this.roleID = (await this.transaction.get$Role()).role_id;

			//loadAll true is using because first time without loadAll true the data is not coming
			this.employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.loginID, expandAll: 'r_employee_org', partialSelected: ['employee_id', 'line_manager'] });

			let loginUserOrgBArea = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.business_area))).map((businessArea) => ({ key: businessArea }));
			let loginUserOrgPC = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.profit_centre))).map((PC) => ({ key: PC }));

			//Login user Org set in the drop down of search
			this.tm.getTN("other").setProperty('businessAreaList', loginUserOrgBArea);
			this.tm.getTN("other").setProperty('profitCenterList', loginUserOrgPC);

			//Primary Org of the login user should be set in the search by default
			let primaryOrg = this.employeeData[0].r_employee_org.filter((item) => item.is_primary == true);

			let general_config_pa = <KloEntitySet<d_o2c_emp_general_config>>await this.transaction.getExecutedQuery("d_o2c_emp_general_config", { company_code: primaryOrg[0].company_code, parameter_name: "FY", module_type: "PA", loadAll: true });
			const lastExclusiveWorkingDate = await paFinancialYear.getNextFinancialYears(general_config_pa[0].parameter_values, general_config_pa[0].parameter_value2);
			this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
			this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
			this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
			await this.tm.getTN("other").setProperty('fiscal', lastExclusiveWorkingDate);
			this.tm.getTN("other").setProperty('fyear', new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));

			this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());

			//Need to change by recursive query
			await this.lineManagerData();

			const inputYear = await paFinancialYear.getFinancialYearDates(await this.tm.getTN("other").getData().fyear);

			//Function call for mantee of the above company code, business area, PC and Fiscal year
			await this.manteeData(inputYear.startDate, inputYear.endDate);

			//For dropdown of grading 
			let gradingData = await this.transaction.getExecutedQuery('d_o2c_pa_category_master', { loadAll: true });
			let gradingList = gradingData.map((item) => {
				return { key: item.pa_category_description };
			});
			this.tm.getTN("other").setProperty('grading', gradingList);
			busyDialog.close();
		}
	}
	//Need to change by recursive query
	public async lineManagerData() {
		let allEmployeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, partialSelected: ['employee_id', 'line_manager'] });

		const visited = new Map<string, { employeeID: string; name: string }>();
		const seenEmployees = new Set<string>();

		const loginUser = await this.transaction.get$User();
		const loginUserID = loginUser.login_id;

		const otherData = await this.tm.getTN("other").getData();
		const businessArea = otherData.businessArea;
		const profitCenter = otherData.profitCenter;

		const queue: string[] = [loginUserID];

		while (queue.length > 0) {
			const currentManagers = [...queue];
			queue.length = 0;

			const employeeResults = await this.transaction.getExecutedQuery('q_mantees_based_on_org', {
				line_manager: currentManagers,
				business_area: businessArea,
				profit_center: profitCenter,
				loadAll: true
			});

			for (const emp of employeeResults) {
				const empId = emp.employee_id;
				const lmId = emp.line_manager;

				if (!seenEmployees.has(empId)) {
					seenEmployees.add(empId);

					// Store manager info uniquely
					if (!visited.has(lmId.toUpperCase())) {
						const lmi = allEmployeeData.find(item => item.employee_id.toUpperCase() === lmId.toUpperCase());
						visited.set(lmId, {
							employeeID: lmId.toUpperCase(),
							name: lmi ? lmi.full_name : ''
						});
					}

					queue.push(empId); // Continue BFS
				}
			}
		}

		// Add login user at the start if not already in visited
		if (!visited.has(loginUserID.toUpperCase())) {
			const loginUserName = allEmployeeData.find(item => item.employee_id.toUpperCase() === loginUserID.toUpperCase());
			visited.set(loginUserID, {
				employeeID: loginUserID.toUpperCase(),
				name: loginUserName ? loginUserName.full_name : ''
			});
		}

		const finalList = Array.from(visited.values());
		await this.tm.getTN("other").setProperty('lm', finalList);
	}

	public async manteeData(fiscalSDate, fiscalEDate) {
		this.allLMGraded = [];
		let searchData = await this.tm.getTN("other").getData();
		await this.tm.getTN("search_new").setProperty('line_manager', searchData.loginUser);
		await this.tm.getTN("search_new").setProperty('business_area', searchData.businessArea);
		await this.tm.getTN("search_new").setProperty('profit_center', searchData.profitCenter);

		await this.tm.getTN("search_new").executeP();
		let list = await this.tm.getTN("o2c_employee_list").getData();

		this.paCycleTableData = await this.fnFetchPACycleData(searchData.fyear)

		this.empGrading = this.paCycleTableData[0]?.r_pa_cycle_emp_planning;

		for (let emp of list) {
			emp['prev_grading'] = "";
			emp['hdr_pa_req_id'] = "";
			let empDesignation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_o2c_emp_current_desig', { employee_id: emp.employee_id, from_date: fiscalSDate, to_date: fiscalEDate, partialSelected: 'name' });
			emp['designation'] = await empDesignation[0]?.r_designation_name?.name;

			// //total Experience of Employee
			let employeeHistory = await emp.r_emp_history.fetch();

			let maventicExperience = await paFinancialYear.experienceInYear(new Date(), emp.joining_date);
			let previousYearExperience = 0;
			for (let k = 0; k < employeeHistory.length; k++) {
				let prevExp = await paFinancialYear.experienceInYear(employeeHistory[k].to_date, employeeHistory[k].from_date);
				previousYearExperience += parseFloat(prevExp);
			}
			emp['total_experience'] = await paFinancialYear.sumOfYear(previousYearExperience, maventicExperience);

			if (this.empGrading) {
				let empPAPlanning = this.empGrading.filter((item) => item.employee_id == emp.employee_id)
				// this.paCycleTableData.push(await empPAPlanning[0]?.getParentEntityP());
				if (empPAPlanning) {
					emp['prev_grading'] = empPAPlanning[0]?.pa_category_id;
					emp['hdr_pa_req_id'] = empPAPlanning[0]?.hdr_pa_req_id;
				}
			}
		}
		if (this.paCycleTableData.length)
			this.allLMGraded = await this.transaction.getExecutedQuery('d_o2c_pa_cycle_id_lm', { pa_cycle_id: this.paCycleTableData[0]?.pa_cycle_id, loadAll: true, partialSelected: ['pa_cycle_id', 'line_manager_id'] });

		let lmGraded = this.allLMGraded.filter((item) => item.line_manager_id.toLowerCase() == searchData.loginUser.toLowerCase() && item.s_status == "Graded");
		if (lmGraded.length)
			await this.tm.getTN("button_visiblity").setData({ 'visible': false });

	}
	public async fnFetchPACycleData(fyear) {
		let searchData = await this.tm.getTN("other").getData();
		await this.tm.getTN("emp_pa_search_data").setProperty('company_code', searchData.companyCode);
		await this.tm.getTN("emp_pa_search_data").setProperty('business_area', searchData.businessArea);
		await this.tm.getTN("emp_pa_search_data").setProperty('profit_center', searchData.profitCenter);
		await this.tm.getTN("emp_pa_search_data").setProperty('fyear', fyear);
		await this.tm.getTN("emp_pa_search_data").executeP();

		await this.tm.getTN("emp_pa_search_data").getData().setLoadAll(true);
		await this.tm.getTN("emp_pa_search_data").getData().refreshP();

		let d = await this.tm.getTN("o2c_pa_cycle_list").getData();
		return d;
	}
	//SEARCH BUTTON
	public async onSearchChange() {
		//this.paCycleTableData = [];
		this.empGrading = [];
		await this.tm.getTN("button_visiblity").setData({ 'visible': true });
		let selectedFYear = await this.tm.getTN("other").getData().fyear;
		let inputYear = await paFinancialYear.getFinancialYearDates(selectedFYear);

		await this.manteeData(inputYear.startDate, inputYear.endDate);
	}
	//On the change of grading the property edited will be true as it is edited and in save only save the edited one
	public async onChangeGrading(oEvent) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_employee_list/", ""));
		let list = await this.tm.getTN("o2c_employee_list").getData()[index];
		await this.updateGradingData(list);
	}
	public async updateGradingData(list) {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait, Data is loading.."
		});
		busyDialog.open();
		let fromDate, toDate, prevPADate, newPADate, totalCostPrev, ctcPrev, fixedPrev, bonusTableData;
		let searchData = await this.tm.getTN("other").getData();
		let allBenefit = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.transaction.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true, company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter });
		// Define benefit mappings
		let benefitMap = [
			{ name: "Performance Bonus" },
			{ name: "Retention Bonus" },
			{ name: "Company Bonus" }
		];
		let inputYear = await paFinancialYear.getFinancialYearDates(searchData.fyear);
		if (this.paCycleTableData.length == 0) {
			//Pa Cycle Table
			let paCycleTableData = await this.transaction.createEntityP("d_o2c_emp_pa_cycle", { company_code: searchData.companyCode, business_area: searchData.businessArea, profit_center: searchData.profitCenter, pa_cycle: 1, fiscal_year: searchData.fyear, start_date: inputYear.startDate, end_date: inputYear.endDate });
			this.paCycleTableData.push(paCycleTableData);
		}
		if (list.hdr_pa_req_id) {

			let employeeData = this.empGrading?.filter((item) => item.hdr_pa_req_id == list.hdr_pa_req_id);
			//employeeData[0].pa_category_id = list.prev_grading;
			if (employeeData && employeeData.length > 0) {
				employeeData[0].pa_category_id = list.prev_grading;
			}
		}
		else {
			//if (this.allLMGraded.length == 0) {
			if (this.paCycleTableData[0].r_all_lm.length == 0 && this.allLMGraded.length == 0) {
				let pcbasedDesignation = await this.transaction.getExecutedQuery('q_pa_pc_manager', { company_code: searchData.companyCode, business_area: searchData.businessArea, pc: searchData.profitCenter, designation: 'MANAGER' });
				const profit_info = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { loadAll: true, company_code: searchData.companyCode, profit_center: searchData.profitCenter });
				for (let i = 0; i < pcbasedDesignation.length; i++) {
					let paCycleIdLm = await this.transaction.createEntityP("d_o2c_pa_cycle_id_lm", { pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, line_manager_id: pcbasedDesignation[i].employee_id, s_status: "Save As Draft" });
					this.allLMGraded.push(paCycleIdLm);
				}
				let paCycleIdTH = await this.transaction.createEntityP("d_o2c_pa_cycle_id_lm", { pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, line_manager_id: profit_info[0].team_head, s_status: "Save As Draft" });
				this.allLMGraded.push(paCycleIdTH);
			}
			else {
				if (this.allLMGraded.length == 0) {
					this.allLMGraded = [];
					this.allLMGraded = (this.paCycleTableData[0].r_all_lm);
				}
			}
			//PA From Date & PA To Date & Last PA Date & Delta Month
			//Need to change below two line---START
			let previousStartYear = new Date().getFullYear() - 1;
			let previousEndYear = new Date().getFullYear();
			//Need to change above two line---END

			let prevPACycleDataBasedOnYear = <KloEntitySet<d_o2c_emp_pa_cycle>>await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'fyear': previousStartYear + "-" + previousEndYear });
			let prevEmployeePAData = prevPACycleDataBasedOnYear[0]?.r_pa_cycle_emp_planning.filter((item) => item.employee_id == list.employee_id)
			//PA Experience
			//let pACycleData = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter });
			//let employeePAData = pACycleData?.[0].r_pa_cycle_emp_planning.filter((item) => item.employee_id == list.employee_id)

			//PA Month
			let empSalaryData = <KloEntitySet<d_o2c_employee_salary_hdr>>await this.transaction.getExecutedQuery('q_emp_salary_data_1', { loadAll: true, employee_id: list.employee_id });
			const monthName = empSalaryData?.[0]?.to_date
				? new Date(new Date(empSalaryData[0].to_date).setDate(new Date(empSalaryData[0].to_date).getDate() + 1))
					.toLocaleString("default", { month: "long" })
				: "";
			//if(prevEmployeePAData.length)//cant use length as prevEmployeePAData is giving undefined
			if (prevEmployeePAData) {
				fromDate = new Date(prevEmployeePAData[0].to_date);
				new Date(fromDate.setDate(fromDate.getDate() + 1));
				toDate = new Date((prevEmployeePAData[0].to_date).setFullYear((prevEmployeePAData[0].to_date).getFullYear() + 1));
				prevPADate = new Date(prevEmployeePAData[0].from_date);
				totalCostPrev = prevEmployeePAData[0].total_cost_new;
				ctcPrev = prevEmployeePAData[0].ctc_new;
				fixedPrev = prevEmployeePAData[0].fixed_prev;
				//bonus
				//bonusTableData = prevEmployeePAData[0].r_emp_pa_planning_hdr_item;

			}
			else {
				fromDate = new Date((list.confirmation_date).setFullYear((list.confirmation_date).getFullYear() + 1))
				toDate = new Date(fromDate.setFullYear(fromDate.getFullYear() + 1));
				prevPADate = new Date(list.confirmation_date);
				totalCostPrev = empSalaryData?.[0]?.total_cost;
				ctcPrev = empSalaryData?.[0]?.ctc;
				fixedPrev = empSalaryData?.[0]?.fixed;
				//bonus
				bonusTableData = empSalaryData[0]?.r_salary_hdr_items;
			}
			//Date
			newPADate = fromDate;
			let deltaMonth = (
				(new Date(newPADate).getFullYear() - new Date(prevPADate).getFullYear()) * 12 +
				(new Date(newPADate).getMonth() - new Date(prevPADate).getMonth())
			);

			let empPlanningHdr = <KloEntitySet<d_o2c_emp_pa_planning_hdr>>await this.transaction.createEntityP("d_o2c_emp_pa_planning_hdr", { pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, employee_id: list.employee_id, approval_cycle: 0, pa_category_id: list.prev_grading, from_date: fromDate, to_date: toDate, employee_designation_prev: list.designation, line_manager_id: list.line_manager, pa_month: monthName, prev_pa_date: prevPADate, new_pa_date: newPADate, delta_month: deltaMonth, total_cost_prev: totalCostPrev, total_cost_new: 0, ctc_prev: ctcPrev, ctc_new: 0, fixed_prev: fixedPrev, fixed_new: 0, s_status: "Pending" });
			list.hdr_pa_req_id = empPlanningHdr.hdr_pa_req_id;

			// Loop through each bonus type and process if the benefit exists
			for (let benefit of benefitMap) {
				let matchedBenefit = allBenefit.find(item => item.benefit_name === benefit.name);
				let perviousBonusData = bonusTableData?.filter((item) => item.benefit_id == matchedBenefit?.benefit_id)
				//if (perviousBonusData) {
				await empPlanningHdr.r_emp_pa_planning_hdr_item.newEntityP(0, {
					benefit_id: matchedBenefit.benefit_id,
					planned_amount_prev: perviousBonusData?.[0]?.planned_amount,
					disbursed_amount_prev: perviousBonusData?.[0]?.actual_amount,
					planned_amount_new:0,
					pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
					currency: perviousBonusData?.[0]?.currency,
					start_date: new Date(),
					end_date: new Date()
				});
				//}

			}
		}
		busyDialog.close();

	}
	public async onEdit() {
		this.setMode("EDIT");
		await this.tm.getTN("emp_pa_search_data").getData().refreshP();
	}

	public async onSave() {
		//if login user designation is not Manager/Team Head or Top Management then show Error
		//else run below code
		await this.tm.commitP("Save Successfully", "Save Failed", false, true);
	}
	public async onSubmit() {
		let lmi = await this.tm.getTN("other").getData().loginUser;
		//if login user designation is not Manager/Team Head or Top Management then show Error
		//else run below code
		let totalExp = [];
		let empData = await this.tm.getTN("o2c_employee_list").getData();
		let gradingNullCount = 0;
		for (let i = 0; i < empData.length; i++) {
			let empTotalExp = await this.tm.getTN("o2c_employee_list").getData()[i].total_experience;
			totalExp[i] = empTotalExp;
			if (empData[i].prev_grading == '' || empData[i].prev_grading == null || empData[i].prev_grading == undefined) {
				gradingNullCount++;
			}
		}
		if (gradingNullCount == 0) {
			await this.createCategoryPlanning(totalExp);
			let loginUserData = this.allLMGraded.filter((item) => item.line_manager_id.toLowerCase() == lmi.toLowerCase());
			loginUserData[0].s_status = "Graded";
			await this.tm.commitP("Submit Successfully", "Submit Failed", false, true);
			await this.tm.getTN("button_visiblity").setData({ 'visible': false });

		}
		else {
			sap.m.MessageToast.show("Please fill all the grading before submit or you can do the draft", { duration: 1000 });
		}
	}

	public async createCategoryPlanning(experience) {
		let prevYearPACycle = [];
		//Mayank is using this variable
		let category_pl_req_id;

		let currentCategoryHdr = this.paCycleTableData[0]?.r_pa_cycle_catgry;
		if (currentCategoryHdr) {
			category_pl_req_id = await this.categoryPlanningUpdate(experience, this.paCycleTableData, currentCategoryHdr);

		}
		else {
			let searchData = await this.tm.getTN("other").getData();
			//Need to change below two line---START
			let previousStartYear = new Date().getFullYear() - 1
			let previousEndYear = new Date().getFullYear();
			//Need to change above two line---END

			prevYearPACycle = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'fyear': previousStartYear + "-" + previousEndYear });
			category_pl_req_id = await this.categoryPlanningUpdate(experience, prevYearPACycle, currentCategoryHdr);

		}
	}
	// public async categoryPlanningUpdate(allExperience, paCycleData, categoryHdr) {
	// 	let paCatgryPlanningHdr, paCatgryPlanningItm;
	// 	let count = 1;
	// 	let experience = Array.from(new Set(allExperience));
	// 	let empList = await this.tm.getTN("o2c_employee_list").getData();
	// 	let gradingList = await this.tm.getTN("other").getData().grading;
	// 	//Need to change the below line
	// 	// count = paCycleData[0].r_pa_cycle_catgry[0].r_pa_catgry_planning_hdr_itm.length + 1;

	// 	if (!categoryHdr) {
	// 		paCatgryPlanningHdr = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_hdr", { pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, approval_cycle: 1, total_cost_value: paCycleData.length ? categoryHdr[0].total_cost_value : 0, s_status: "New",action_status:"New"});
	// 		for (let i = 0; i < experience.length; i++) {

	// 			for (let j = 0; j < gradingList.length; j++) {
	// 				let prevYearCatItmBasedOnExp = paCycleData[0]?.r_pa_cycle_catgry[0].r_pa_catgry_planning_hdr_itm.filter((item) => item.exp == experience[i] && item.category_id == gradingList[j].key);
	// 				let noOfEmployeeBasedOnExp = empList.filter((item) => item.total_experience == experience[i] && item.prev_grading == gradingList[j].key)
	// 				paCatgryPlanningItm = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_itm", { pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, category_pl_req_id: paCatgryPlanningHdr.category_pl_req_id, ctc_value: prevYearCatItmBasedOnExp ? prevYearCatItmBasedOnExp[0].ctc_value : 0, max_total_value: prevYearCatItmBasedOnExp ? prevYearCatItmBasedOnExp[0].max_total_value : 0, no_of_employee: noOfEmployeeBasedOnExp ? noOfEmployeeBasedOnExp.length : 0, exp: experience[i], category_id: gradingList[j].key, line_item: count++, fixed_value: prevYearCatItmBasedOnExp ? prevYearCatItmBasedOnExp[0].fixed_value : 0 });

	// 				//Benefit creation 
	// 				const benefitIds = ["B11", "B12", "B13"];

	// 				// Create benefit entries
	// 				let currentBenefitData = {};
	// 				for (const benefitId of benefitIds) {
	// 					currentBenefitData[benefitId] = await this.transaction.createEntityP(
	// 						"d_o2c_pa_cat_plan_benfit_det",
	// 						{
	// 							pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
	// 							category_pl_req_id: paCatgryPlanningHdr.category_pl_req_id,
	// 							category_planing_guid: paCatgryPlanningItm.category_planing_guid,
	// 							line_item: paCatgryPlanningItm.line_item,
	// 							category_id: paCatgryPlanningItm.category_id,
	// 							benefit_id: benefitId,
	// 							bonus_perc: 0,
	// 							bonus_amount: 0,
	// 						}
	// 					);
	// 				}

	// 				if (prevYearCatItmBasedOnExp) {
	// 					// Map previous year benefits by benefit_id
	// 					const prevBenefitsMap = {};
	// 					for (const benefit of prevYearCatItmBasedOnExp.r_category_benefit_detail.length) {
	// 						prevBenefitsMap[benefit.benefit_id] = benefit;
	// 					}

	// 					// Update current benefit data with previous year's values
	// 					for (const benefitId of benefitIds) {
	// 						if (prevBenefitsMap[benefitId]) {
	// 							currentBenefitData[benefitId].bonus_perc = prevBenefitsMap[benefitId].bonus_perc;
	// 							currentBenefitData[benefitId].bonus_amount = prevBenefitsMap[benefitId].bonus_amount;
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 		await this.createCategoryApprovalData(paCatgryPlanningHdr.category_pl_req_id);
	// 	}

	// 	else {
	// 		let categoryItmData = paCycleData[0].r_pa_cycle_catgry.r_pa_catgry_planning_hdr_itm;
	// 		// //Work around
	// 		// await categoryItmData.applyFilterP(null);
	// 		for (let i = 0; i < experience.length; i++) {
	// 			for (let j = 0; j < gradingList.length; j++) {
	// 				let prevYearCatItmBasedOnExp = categoryItmData.filter((item) => item.exp == experience[i] && item.category_id == gradingList[j].key);
	// 				//As the no_of employee is not updating for that we have done the below line---FW team has suggested
	// 				await prevYearCatItmBasedOnExp[0].fetch();
	// 				let noOfEmployeeBasedOnExp = empList.filter((item) => item.total_experience == experience[i] && item.prev_grading == gradingList[j].key);
	// 				prevYearCatItmBasedOnExp[0].no_of_employee = parseInt(prevYearCatItmBasedOnExp[0].no_of_employee) + parseInt(noOfEmployeeBasedOnExp.length);
	// 			}
	// 		}
	// 	}
	// }
	public async categoryPlanningUpdate(allExperience, paCycleData, categoryHdr) {
		let paCatgryPlanningHdr;
		let paCatgryPlanningItm;
		let count = 1;
		const experience = Array.from(new Set(allExperience));
		const empList = await this.tm.getTN("o2c_employee_list").getData();
		const gradingList = await this.tm.getTN("other").getData().grading;

		if (!categoryHdr) {
			paCatgryPlanningHdr = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_hdr", {
				pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
				approval_cycle: 1,
				total_cost_value: paCycleData.length ? categoryHdr[0].total_cost_value : 0,
				s_status: "New",
				action_status: "New"
			});

			for (const exp of experience) {
				for (const grade of gradingList) {
					const prevYearCatItmBasedOnExp = paCycleData[0]?.r_pa_cycle_catgry[0].r_pa_catgry_planning_hdr_itm.filter(
						(item) => item.exp == exp && item.category_id == grade.key
					);

					const noOfEmployeeBasedOnExp = empList.filter(
						(item) => item.total_experience == exp && item.prev_grading == grade.key
					);

					paCatgryPlanningItm = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_itm", {
						pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
						category_pl_req_id: paCatgryPlanningHdr.category_pl_req_id,
						ctc_value: prevYearCatItmBasedOnExp?.[0]?.ctc_value || 0,
						max_total_value: prevYearCatItmBasedOnExp?.[0]?.max_total_value || 0,
						no_of_employee: noOfEmployeeBasedOnExp.length,
						exp,
						category_id: grade.key,
						line_item: count++,
						fixed_value: prevYearCatItmBasedOnExp?.[0]?.fixed_value || 0
					});

					const benefitIds = ["B11", "B12", "B13"];
					const currentBenefitData = {};

					for (const benefitId of benefitIds) {
						currentBenefitData[benefitId] = await this.transaction.createEntityP("d_o2c_pa_cat_plan_benfit_det", {
							pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
							category_pl_req_id: paCatgryPlanningHdr.category_pl_req_id,
							category_planing_guid: paCatgryPlanningItm.category_planing_guid,
							line_item: paCatgryPlanningItm.line_item,
							category_id: paCatgryPlanningItm.category_id,
							benefit_id: benefitId,
							bonus_perc: 0,
							bonus_amount: 0
						});
					}

					if (prevYearCatItmBasedOnExp?.length) {
						const prevBenefitsMap = prevYearCatItmBasedOnExp[0].r_category_benefit_detail.reduce((map, benefit) => {
							map[benefit.benefit_id] = benefit;
							return map;
						}, {});

						for (const benefitId of benefitIds) {
							if (prevBenefitsMap[benefitId]) {
								currentBenefitData[benefitId].bonus_perc = prevBenefitsMap[benefitId].bonus_perc;
								currentBenefitData[benefitId].bonus_amount = prevBenefitsMap[benefitId].bonus_amount;
							}
						}
					}
				}
			}

			await this.createCategoryApprovalData(paCatgryPlanningHdr.category_pl_req_id);
		} else {
			const categoryItmData = paCycleData[0].r_pa_cycle_catgry.r_pa_catgry_planning_hdr_itm;
			// Find the maximum line_item value
			let count = Math.max(...categoryItmData.map(item => item.line_item)) + 1;

			for (const exp of experience) {
				for (const grade of gradingList) {
					let prevYearCatItmBasedOnExp = categoryItmData.find(
						(item) => item.exp == exp && item.category_id == grade.key
					);

					if (!prevYearCatItmBasedOnExp) {
						prevYearCatItmBasedOnExp = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_itm", {
							pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
							category_pl_req_id: categoryHdr.category_pl_req_id,
							ctc_value: 0,
							max_total_value: 0,
							no_of_employee: 0,
							exp,
							category_id: grade.key,
							line_item: count++,
							fixed_value: 0
						});

						const benefitIds = ["B11", "B12", "B13"];
						const currentBenefitData = {};

						for (const benefitId of benefitIds) {
							currentBenefitData[benefitId] = await this.transaction.createEntityP("d_o2c_pa_cat_plan_benfit_det", {
								pa_cycle_id: this.paCycleTableData[0].pa_cycle_id,
								category_pl_req_id: categoryHdr.category_pl_req_id,
								category_planing_guid: prevYearCatItmBasedOnExp.category_planing_guid,
								line_item: prevYearCatItmBasedOnExp.line_item,
								category_id: prevYearCatItmBasedOnExp.category_id,
								benefit_id: benefitId,
								bonus_perc: 0,
								bonus_amount: 0
							});
						}
					}
					//As the no_of employee is not updating for that we have done the below line---FW team has suggested
					await prevYearCatItmBasedOnExp?.fetch();
					const noOfEmployeeBasedOnExp = empList.filter(
						(item) => item.total_experience == exp && item.prev_grading == grade.key
					);

					prevYearCatItmBasedOnExp.no_of_employee += noOfEmployeeBasedOnExp.length;
				}
			}
		}
	}
	//--------------------------------------------------------------------------------
	//Mayank Coding
	public async createCategoryApprovalData(category_pl_req_id) {
		let orgData = await this.tm.getTN('other').getData();
		// Changed by manish sir (only team head can plan)
		await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { company_code: orgData.companyCode, business_area: orgData.businessArea, profit_center: orgData.profitCenter, pa_cycle_id: this.paCycleTableData[0].pa_cycle_id, pending_with_role: "TEAM_HEAD", pending_with_name: "name", pending_with_id: "id", actioned_by_id: "id", category_pl_req_id: category_pl_req_id, s_status: "Pending", approval_control: "Y", approval_level: 0, apr_cycle: 1, is_active: true });
	}
	//----------------------------------------------------------------------------------

	// public async gradingFilter() {
	// 	let filterData = await this.tm.getTN("other").getData();
	// 	let list = await this.tm.getTN("o2c_employee_list").getData();
	// 	await this.tm.getTN("o2c_employee_list").applyfilterP('prev_grading', filterData.filter);
	// 	await this.tm.getTN("o2c_employee_list").refresh();
	// }
}

//31/5/25 AF---9:22PM