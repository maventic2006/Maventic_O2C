import { q_o2c_pa_grading_transient as q_o2c_pa_grading_transient_gen } from "o2c_v2/query_gen/q_o2c_pa_grading_transient"
import { paFinancialYear } from "o2c_v2/util/paFinancialYear";
export class q_o2c_pa_grading_transient extends q_o2c_pa_grading_transient_gen {
    public empGradingData = [];
    public async employeeGradingFunc(oEvent) {
        let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        let txn = oEvent.getTxn();
        let qInstance1 = await txn.getQueryP('q_mantees_based_on_org');//this way you can get instance of any query

        //set 
        qInstance1.setProperty("line_manager", oEvent.object.line_manager);
        qInstance1.setProperty("profit_center", oEvent.object.profit_center);

        //set End
        await qInstance1.setLoadAll(true);
        let es = await qInstance1.executeP();//execute here
        let es1=es.filter((e)=>e.type!="T01" && e.is_fresher!=true)
        let qInstance2 = await txn.getQueryP('q_o2c_employee_pa_cycle');//this way you can get instance of any query

        //set 
        qInstance2.setProperty("company_code", oEvent.object.company_code);
        qInstance2.setProperty("profit_center", oEvent.object.profit_center);
        qInstance2.setProperty("fyear", oEvent.object.fyear);
        qInstance2.setProperty("totp", oEvent.object.totp);


        //set End
        await qInstance2.setLoadAll(true);
        let es2 = await qInstance2.executeP();//execute here
        if (es1.length || es2.length) {
            await this.getEmployeeGradingData(es1, es2, instance, oEvent.object);
        }
        instance.skipDBQueryExecution();

    }

    public async getEmployeeGradingData(data1, data2, instance, other) {
        const inputYear = await paFinancialYear.getFinancialYearDates(other.fyear);
        // Iterate over each cycle
        for (let i = 0; i < data1.length; i++) {
            let empDesignation = await this.txn.getExecutedQuery('q_o2c_emp_current_desig', { employee_id: data1[i].employee_id, from_date: inputYear.startDate, to_date: inputYear.endDate, partialSelected: 'name' });
            let currentDesignation = await empDesignation[0]?.r_designation_name?.name;
            let employeeHistory = await data1[i].r_emp_history.fetch();
            let maventicExperience = await paFinancialYear.experienceInYear(new Date(), data1[i].joining_date);
            let previousYearExperience = 0;
            for (let k = 0; k < employeeHistory.length; k++) {
                let prevExp = await paFinancialYear.experienceInYear(employeeHistory[k].to_date, employeeHistory[k].from_date);
                previousYearExperience += parseFloat(prevExp);
            }
            // Round to 1 decimal place
            previousYearExperience = parseFloat(previousYearExperience.toFixed(1));
            let calculatedPreviousExp = await paFinancialYear.sumOfYear(previousYearExperience, maventicExperience);

            const PAFromDate = await this.paExperience(data1[i].employee_id, other.totp);
            let maventicPAExperience;
            if (PAFromDate) {
                maventicPAExperience = await paFinancialYear.experienceInYear(PAFromDate, data1[i].confirmation_date);
            }
            let previousYearPAExperience = 0;
            for (let k = 0; k < employeeHistory.length; k++) {
                let prevExp = await paFinancialYear.experienceInYear(employeeHistory[k].to_date, employeeHistory[k].from_date);
                previousYearPAExperience += parseFloat(prevExp);
            }
            previousYearPAExperience = parseFloat(previousYearPAExperience.toFixed(1));
            let pa_exp = await paFinancialYear.sumOfYear(previousYearPAExperience ? previousYearPAExperience : 0, maventicPAExperience ? maventicPAExperience : 0);
            let calculatedPaExp = pa_exp ? pa_exp : 0;
            let paGradingData, bAreaSearch;
            if (data2.length == 1 && data2.business_area == "ALL") {
                paGradingData = await data2[0].r_pa_emp_planning_hdr.find(item => item.employee_id === data1[i].employee_id);
                bAreaSearch = data2[0].business_area;
            }
            else {
                for (let barea = 0; barea < data2.length; barea++) {
                    paGradingData = await data2[barea].r_pa_emp_planning_hdr.find(item => item.employee_id === data1[i].employee_id);
                    bAreaSearch = data2[barea].business_area;
                }
            }
            let currentEmpOrg = await data1[i].r_employee_org.find((item) => item.is_primary == true);
            let data = {
                my_key:Date.now().toString() + "_" + (i),
                hdr_pa_req_id: paGradingData?.hdr_pa_req_id,
                employee_id: data1[i].employee_id,
                full_name: data1[i].full_name,
                confirmation_date:data1[i].confirmation_date,
                company_code_search: other.company_code,
                business_area: currentEmpOrg.business_area,
                business_area_search: bAreaSearch,
                profit_center_search: other.profit_center,
                fyear_search: other.fyear,
                work_mode: data1[i].work_mode,
                designation: currentDesignation,
                line_manager: data1[i].line_manager,
                previous_exp: calculatedPreviousExp,
                pa_exp: paGradingData ? paGradingData.pa_exp : calculatedPaExp,
                category: paGradingData?.pa_category_id,
                employee_type: paGradingData?.employee_type

            }

            // Push the processed data into the categoryData array
            this.empGradingData.push(data);
        }

        await instance.setResults([]);
        await instance.setResults(this.empGradingData);
        //console.log(await instance.getResults());
        this.empGradingData = [];
    }
    public async paExperience(employeeID, code) {
        let empSalaryData
        empSalaryData = await this.txn.getExecutedQuery('q_o2c_employee_salary_hdr', { loadAll: true, employee_id: employeeID, 'totp': code });
        let PAFromDate;
        if (empSalaryData && empSalaryData.length) {
            PAFromDate = new Date(empSalaryData[0].to_date);
            new Date(PAFromDate.setDate(PAFromDate.getDate() + 1));
        }
        return PAFromDate;
    }
}
//new screen of grading...19 Sep..