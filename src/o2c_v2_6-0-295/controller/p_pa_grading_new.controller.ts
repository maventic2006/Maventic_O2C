import { KloEntitySet } from 'kloBo_7-2-103';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_general_confg } from 'o2c_v2/entity_gen/d_general_confg';
import { d_o2c_emp_general_config } from 'o2c_v2/entity_gen/d_o2c_emp_general_config';
import { d_o2c_emp_pa_cycle } from 'o2c_v2/entity_gen/d_o2c_emp_pa_cycle';
import { d_pa_ind_emp_planning_hdr } from 'o2c_v2/entity_gen/d_pa_ind_emp_planning_hdr';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_employee_benefitconfig } from 'o2c_v2/entity_gen/d_o2c_employee_benefitconfig';
import { d_o2c_employee_designation } from 'o2c_v2/entity_gen/d_o2c_employee_designation';
import { d_o2c_employee_salary_hdr } from 'o2c_v2/entity_gen/d_o2c_employee_salary_hdr';
import { paFinancialYear } from 'o2c_v2/util/paFinancialYear';
import { authDoneForUser } from 'o2c_v2/util/authDoneForUser';
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { q_o2c_employee_salary_hdr } from 'o2c_v2/query_gen/q_o2c_employee_salary_hdr';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_grading_new")
export default class p_pa_grading_new extends KloController {

    public empGrading = [];
    public paCycleTableData = [];
    public employeeData = [];
    public allLMGraded = [];
    public loginID;
    public roleID;
    public code;
    public flag;
    public _resolveLoginPromise;
    public async onPageEnter() {
        const waitForLogin = new Promise<void>((resolve) => {
            this._resolveLoginPromise = resolve;
        });
        await this.openDialog("p_pa_dialog_box");
        // Wait here until login completes and dialog is closed
        await waitForLogin;
        await this.onFunc(); // Only runs after successful login + dialog closed
    }
    public async onEscapeEvent() {
        //Avoid escape button click
    }
    public async onLoginSubmit() {
        this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "");
        this.code = this.tm.getTNFromEmbedded("totp_code", "s_pa_login").getData().code;
        // let loginID = (await this.transaction.get$User()).login_id;	
        this.loginID = (await this.transaction.get$User()).login_id;
        if (this.code) {
            const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
                data: {
                    loginID: this.loginID,
                    totpCode: this.code
                },
                method: "POST"
            });
            if (!response) {
                this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Invalid TOTP code. Please check the code and try again");
                // this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('code',"");
            }
            else {
                await this.closeDialog("p_pa_dialog_box");
                // ✅ Resolve the promise to resume `abc()`
                if (this._resolveLoginPromise) {
                    this._resolveLoginPromise();
                    this._resolveLoginPromise = null;
                }
            }
        }
        else {
            this.tm.getTNFromEmbedded("totp_code", "s_pa_login").setProperty('msg', "Please enter TOTP Code");

        }
    }
    public async onCancel() {
		// Resolve the promise to unblock `onPageEnter`, if it exists
		if (this._resolveLoginPromise) {
			this._resolveLoginPromise();
			this._resolveLoginPromise = null;
		}
		await this.navTo({ F: "kloTouch", S: "p_homePage" })
	}
    public async onFunc() {
        let general_config = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "PA" });
        if (general_config[0].high_value == 1) {

            let busyDialog = new sap.m.BusyDialog({
                text: "Please Wait, Data is loading.."
            });
            busyDialog.open();
            this.loginID = (await this.transaction.get$User()).login_id;
            this.tm.getTN("other").setData({});
            // this.tm.getTN("grading_count").setData({});
            await this.tm.getTN("button_visiblity").setData({ 'visible': true });
            this.roleID = (await this.transaction.get$Role()).role_id;
            //loadAll true is using because first time without loadAll true the data is not coming
            this.employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.loginID, expandAll: 'r_employee_org', partialSelected: ['employee_id', 'line_manager'] });
            const employeeOrgResult = await paFinancialYear.employeeUniqueOrg(this.transaction, this.employeeData[0].r_employee_org);
            //Login user Org set in the drop down of search
            this.tm.getTN("other").setProperty('companyList', employeeOrgResult.loginUserOrgCompany);
            this.tm.getTN("other").setProperty('businessAreaList', employeeOrgResult.loginUserOrgBArea);
            this.tm.getTN("other").setProperty('profitCenterList', employeeOrgResult.loginUserOrgPC);
            //Primary Org of the login user should be set in the search by default
            let primaryOrg = this.employeeData[0].r_employee_org.filter((item) => item.is_primary == true);
            let general_config_pa = <KloEntitySet<d_o2c_emp_general_config>>await this.transaction.getExecutedQuery("d_o2c_emp_general_config", { company_code: primaryOrg[0].company_code, parameter_name: "FY", module_type: "PA", loadAll: true });
            const lastExclusiveWorkingDate = await paFinancialYear.getNextFinancialYears(general_config_pa[0].parameter_values, general_config_pa[0].parameter_value2);
            this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
            this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
            this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
            await this.tm.getTN("other").setProperty('fiscal', lastExclusiveWorkingDate);
            this.tm.getTN("other").setProperty('fyear', await paFinancialYear.getFinancialYear(new Date()));
            this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());
            //Function call for mantee of the above company code, business area, PC and Fiscal year
            await this.manteeData(await this.tm.getTN("other").getData().fyear);

            //Grading count
            const gradingList = await this.tm.getTN("grading_list").getData();
            const chunkSize = Math.ceil(gradingList.length / 3); // fixed chunk size

            for (let t = 0; t < 3; t++) {
                const propertyName = `category_${t + 1}`;
                const start = t * chunkSize;
                const end = start + chunkSize;
                const chunk = gradingList.slice(start, end);
                let categoryListData = chunk.map(item => ({ key: item.pa_category_id }));
                await this.gradingCount(categoryListData);
                this.tm.getTN(propertyName).setData(categoryListData);
                // this.tm.getTN("grading_count").setProperty(propertyName, categoryListData);

            }
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
                //business_area: businessArea,
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

    public async manteeData(fyear) {
        let searchData = await this.tm.getTN("other").getData();
        await this.lineManagerData();
        let paCycleData = await this.transaction.getExecutedQuery("d_o2c_emp_pa_cycle", { loadAll: true, company_code: searchData.companyCode, profit_center: searchData.profitCenter });
        let currentPaCycleData = paCycleData.filter((item) => item.fiscal_year == searchData.fyear);
        if (currentPaCycleData.length) {
            this.allLMGraded = [];

            await this.tm.getTN("search_transient").setProperty('company_code', searchData.companyCode);
            //await this.tm.getTN("search_transient").setProperty('business_area', searchData.businessArea);
            await this.tm.getTN("search_transient").setProperty('profit_center', searchData.profitCenter);
            await this.tm.getTN("search_transient").setProperty('line_manager', searchData.loginUser);
            await this.tm.getTN("search_transient").setProperty('fyear', fyear);
            await this.tm.getTN("search_transient").setProperty('totp', this.code);
            await this.tm.getTN("search_transient").executeP();


            // let paCycleData = await this.transaction.getExecutedQuery("d_o2c_emp_pa_cycle", { loadAll: true, company_code: searchData.companyCode, profit_center: searchData.profitCenter });
            // let currentPaCycleData = paCycleData.filter((item) => item.fiscal_year == searchData.fyear);
            let lmData;
            for (let i = 0; i < currentPaCycleData.length; i++) {
                lmData = await currentPaCycleData[i].r_all_lm.find(
                    (item) => item.line_manager_id.toLowerCase() === searchData.loginUser.toLowerCase() && item.s_status === "Graded"
                );

                if (lmData) {
                    await this.tm.getTN("button_visiblity").setData({ visible: false });
                    break; // Stop looping once the condition is met
                }
            }
        }
        else {
            sap.m.MessageBox.error("PA is not triggered yet!!", { duration: 1000 });

        }

    }
    //SEARCH BUTTON
    public async onSearchChange() {
        this.setMode("DISPLAY");
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is loading.."
        });
        busyDialog.open();
        await this.tm.getTN("button_visiblity").setData({ 'visible': true });
        await this.manteeData(await this.tm.getTN("other").getData().fyear);
        busyDialog.close();
    }

    public async onEdit() {
        this.setMode("EDIT");
        let busyID = this.showBusy({ blocked: true });
        await this.tm.getTN("search_transient").getData().refreshP();
        this.hideBusy(busyID);
    }

    public async onSave() {
        let searchData = await this.tm.getTN("other").getData();
        let paCycleData = await this.transaction.getExecutedQuery("d_o2c_emp_pa_cycle", { loadAll: true, company_code: searchData.companyCode, profit_center: searchData.profitCenter });
        let currentPaCycleData = paCycleData.filter((item) => item.fiscal_year == searchData.fyear);
        let lmData;
        for (let i = 0; i < currentPaCycleData.length; i++) {
            lmData = await currentPaCycleData[i].r_all_lm.filter((item) => item.line_manager_id.toLowerCase() === searchData.loginUser.toLowerCase())
            if (lmData) {
                lmData.map((e) => e.s_status = "Save As Draft");
                //lmData.s_status = "Save As Draft";
            }
        }
        try {
            await this.tm.commitP("Save Successfully", "Save Failed", false, true);
        }
        catch (e) {
            if (e.message.includes("Unauthorized")) {
                const waitForLogin = new Promise<void>((resolve) => {
                    this._resolveLoginPromise = resolve;
                });

                await this.openDialog("p_pa_dialog_box");

                // Wait here until login completes and dialog is closed
                await waitForLogin;
                // Retry the query
                await this.tm.commitP("Save Successfully", "Save Failed", false, true);
            }
        }
    }
    //Pending for 7 Sep 25
    public async onSubmit() {
        const searchData = await this.tm.getTN("other").getData();
        const empData = await this.tm.getTN("list_transient").getData();

        // Check for missing grading
        const gradingNullCount = empData.filter(emp => !emp.category).length;

        if (gradingNullCount > 0) {
            sap.m.MessageToast.show("Please fill in all the grading fields before submitting, or just save it as a draft.", { duration: 1000 });
            return;
        }

        let paCycleData = await this.transaction.getExecutedQuery("d_o2c_emp_pa_cycle", {
            loadAll: true,
            company_code: searchData.companyCode,
            profit_center: searchData.profitCenter
        });

        let currentPaCycleData = paCycleData.filter(item => item.fiscal_year == searchData.fyear);

        for (let cycle of currentPaCycleData) {
            const isAllBusinessArea = currentPaCycleData.length === 1 && cycle.business_area === "ALL";

            // Filter employee data if needed
            const relevantEmpData = isAllBusinessArea ? empData : empData.filter(emp => emp.business_area_search === cycle.business_area);

            // Calculate total experience
            const totalExp = relevantEmpData.map(emp => Math.floor(emp.pa_exp));

            // Call category planning logic
            await this.createCategoryPlanning(totalExp);

            // Update status for line manager
            let lmData = await cycle.r_all_lm.filter((lm) => lm.line_manager_id.toLowerCase() === searchData.loginUser.toLowerCase());
            if (lmData) {
                lmData.map((e) => e.s_status = "Graded");
                //lmData.s_status = "Graded";
            }

            // TOTP Verification & Commit
            const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getTotpCodeVerification", true),
                data: {
                    loginID: this.loginID,
                    totpCode: this.code
                },
                method: "POST"
            });

            //if (response) {
            await this.tm.commitP("Submit Successfully", "Submit Failed", false, true);
            await this.tm.getTN("button_visiblity").setData({ visible: false });
            //} else {
            // await this.openDialog("p_pa_dialog_box");
            // await this.onLoginSubmit();
            // }
        }
    }

    public async createCategoryPlanning(experience) {
        let prevYearPACycle = [];
        //Mayank is using this variable
        let category_pl_req_id;
        let searchData = await this.tm.getTN("other").getData();
        let paCycleData = await this.transaction.getExecutedQuery("d_o2c_emp_pa_cycle", { loadAll: true, company_code: searchData.companyCode, profit_center: searchData.profitCenter });
        let currentPaCycleData = paCycleData.filter((item) => item.fiscal_year == searchData.fyear);
        for (const cycle of currentPaCycleData) {

            let currentCategoryHdr = cycle.r_pa_cycle_catgry;
            if (currentCategoryHdr) {
                category_pl_req_id = await this.categoryPlanningUpdate(experience, cycle, cycle, currentCategoryHdr);

            }
            else {

                //Need to change below two line---START
                let previousStartYear = new Date().getFullYear() - 1
                let previousEndYear = new Date().getFullYear();
                //Need to change above two line---END
                try {
                    prevYearPACycle = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'fyear': previousStartYear + "-" + previousEndYear, 'totp': this.code });

                }
                catch (e) {
                    if (e.message.includes("Unauthorized")) {
                        const waitForLogin = new Promise<void>((resolve) => {
                            this._resolveLoginPromise = resolve;
                        });

                        await this.openDialog("p_pa_dialog_box");

                        // Wait here until login completes and dialog is closed
                        await waitForLogin;
                        // Retry the query
                        prevYearPACycle = await this.transaction.getExecutedQuery('q_o2c_employee_pa_cycle', { loadAll: true, 'company_code': searchData.companyCode, 'business_area': searchData.businessArea, 'profit_center': searchData.profitCenter, 'fyear': previousStartYear + "-" + previousEndYear, 'totp': this.code });
                    }
                }
                let prevPACycleData = prevYearPACycle.filter((item) => item.business_area == cycle.business_area)
                category_pl_req_id = await this.categoryPlanningUpdate(experience, prevPACycleData, cycle, currentCategoryHdr);


            }
        }
    }
    public async categoryPlanningUpdate(allExperience, paCycleData, currentCycle, categoryHdr) {
        let paCatgryPlanningHdr;
        let paCatgryPlanningItm;
        let count = 1;
        const experience = Array.from(new Set(allExperience));
        const empList = await this.tm.getTN("list_transient").getData();
        const gradingList = await this.tm.getTN("grading_list").getData();
        const workMode = await this.tm.getTN("work_list").getData();


        if (!categoryHdr) {
            paCatgryPlanningHdr = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_hdr", {
                pa_cycle_id: currentCycle.pa_cycle_id,
                approval_cycle: 1,
                total_cost_value: paCycleData.length ? categoryHdr[0].total_cost_value : 0,
                s_status: "New",
                action_status: "New"
            });

            for (const exp of experience) {
                for (const grade of gradingList) {
                    for (const work of workMode) {
                        const prevYearCatItmBasedOnExp = paCycleData?.r_pa_cycle_catgry?.r_pa_catgry_planning_hdr_itm.filter(
                            (item) => item.exp == exp && item.category_id == grade.pa_category_id && item.work_location == work.work_mode_id);

                        const noOfEmployeeBasedOnExp = empList.filter(
                            (item) => Math.floor(item.pa_exp) == exp && item.category == grade.pa_category_id && item.work_mode == work.work_mode_id);

                        paCatgryPlanningItm = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_itm", {
                            pa_cycle_id: currentCycle.pa_cycle_id,
                            category_pl_req_id: paCatgryPlanningHdr.category_pl_req_id,
                            ctc_value: prevYearCatItmBasedOnExp?.[0]?.ctc_value || 0,
                            max_total_value: prevYearCatItmBasedOnExp?.[0]?.max_total_value || 0,
                            no_of_employee: noOfEmployeeBasedOnExp.length,
                            exp,
                            work_location: work.work_mode_id,
                            category_id: grade.pa_category_id,
                            line_item: count++,
                            fixed_value: prevYearCatItmBasedOnExp?.[0]?.fixed_value || 0
                        });

                        const benefitIds = ["B11", "B12", "B13"];
                        const currentBenefitData = {};

                        for (const benefitId of benefitIds) {
                            currentBenefitData[benefitId] = await this.transaction.createEntityP("d_o2c_pa_cat_plan_benfit_det", {
                                pa_cycle_id: currentCycle.pa_cycle_id,
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
            }

            await this.createCategoryApprovalData(currentCycle, paCatgryPlanningHdr.category_pl_req_id);
        } else {
            const categoryItmData = paCycleData?.r_pa_cycle_catgry?.r_pa_catgry_planning_hdr_itm;
            // Find the maximum line_item value
            let count = Math.max(...categoryItmData.map(item => item.line_item)) + 1;

            for (const exp of experience) {
                for (const grade of gradingList) {
                    for (const work of workMode) {
                        let prevYearCatItmBasedOnExp = categoryItmData.find(
                            (item) => item.exp == exp && item.category_id == grade.pa_category_id && item.work_location == work.work_mode_id);

                        if (!prevYearCatItmBasedOnExp) {
                            prevYearCatItmBasedOnExp = await this.transaction.createEntityP("d_o2c_pa_catgry_planning_itm", {
                                pa_cycle_id: currentCycle.pa_cycle_id,
                                category_pl_req_id: categoryHdr.category_pl_req_id,
                                ctc_value: 0,
                                max_total_value: 0,
                                no_of_employee: 0,
                                exp,
                                work_location: work.work_mode_id,
                                category_id: grade.pa_category_id,
                                line_item: count++,
                                fixed_value: 0
                            });

                            const benefitIds = ["B11", "B12", "B13"];
                            const currentBenefitData = {};

                            for (const benefitId of benefitIds) {
                                currentBenefitData[benefitId] = await this.transaction.createEntityP("d_o2c_pa_cat_plan_benfit_det", {
                                    pa_cycle_id: currentCycle.pa_cycle_id,
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
                            (item) => Math.floor(item.pa_exp) == exp && item.category == grade.pa_category_id && item.work_mode == work.work_mode_id);

                        prevYearCatItmBasedOnExp.no_of_employee += noOfEmployeeBasedOnExp.length;
                    }
                }
            }
        }
    }
    //--------------------------------------------------------------------------------
    //Mayank Coding
    public async createCategoryApprovalData(currentpaCycle, category_pl_req_id) {
        let orgData = await this.tm.getTN('other').getData();
        // Changed by manish sir (only team head can plan)
        await this.transaction.createEntityP('d_o2c_pa_cat_plan_apprl_flw', { approval_type: "Category Planning", company_code: orgData.companyCode, business_area: orgData.businessArea, profit_center: orgData.profitCenter, pa_cycle_id: currentpaCycle.pa_cycle_id, pending_with_role: "TEAM_HEAD", pending_with_name: "name", pending_with_id: "id", actioned_by_id: "id", category_pl_req_id: category_pl_req_id, s_status: "Pending", approval_control: "Y", approval_level: 0, apr_cycle: 1, is_active: true });
    }
    // public async gradingCount(categoryListData) {
    //     const empData = await this.tm.getTN("list_transient").getData();
    //     for (let i = 0; i < categoryListData.length; i++) {
    //         let gradingCount = empData.filter((item) => ({key:item.grading == categoryListData[i].key}))
    //         this.tm.getTN("grading_count").setData( gradingCount.length);
    //     }
    // }
    public async gradingCount(categoryListData) {
        const empData = await this.tm.getTN("list_transient").getData();
        
        const counts = categoryListData.map((category) => {
            const count = empData.filter((item) => item.grading === category.key).length;
            return { key: category.key, count };
        });
    
        this.tm.getTN("grading_count").setData(counts);
    }
    
    //---------------------------------------------------------------------------------
}

//new screen of grading...08 Sep..


