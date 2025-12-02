import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { KloEntitySet } from "kloBo_7-2-165";
import { d_o2c_employee_benefitconfig } from "o2c_v2/entity_gen/d_o2c_employee_benefitconfig";
import { q_o2c_emp_salary_transient as q_o2c_emp_salary_transient_gen } from "o2c_v2/query_gen/q_o2c_emp_salary_transient"
import { paFinancialYear } from "o2c_v2/util/paFinancialYear";
export class q_o2c_emp_salary_transient extends q_o2c_emp_salary_transient_gen {

    public employeeSalary = [];
    public relationData = [];
    public async employeeSalaryFunc(oEvent) {
        const instance = oEvent.getObject();
        instance.setLoadAll(true);
        const txn = oEvent.getTxn();

        const emp_id = oEvent.object.emp_id;
        const fdate = oEvent.object.fdate;
        const tdate = oEvent.object.tdate;
        //const inputYear = await paFinancialYear.getFinancialYearDates(year);


        // Helper to set properties on queries
        const setQueryProps = (query, emp_id, fdate, tdate) => {
            query.setProperty("emp_id", emp_id);
            query.setProperty("fdate", fdate);
            query.setProperty("tdate", tdate);
            query.setLoadAll(true);
        };

        const qInstance1 = await txn.getQueryP('q_o2c_employee_salary_hdr');
        const qInstance2 = await txn.getQueryP('q_o2c_emp_salary_hdr_log');

        setQueryProps(qInstance1, emp_id, fdate, tdate);
        setQueryProps(qInstance2, emp_id, fdate, tdate);

        const [es1, es2] = await Promise.all([
            qInstance1.executeP(),
            qInstance2.executeP()
        ]);

        const combinedResults = [...es1, ...es2];

        if (combinedResults.length) {
            combinedResults.sort((a, b) => new Date(a.from_date) - new Date(b.from_date));
            await this.getSalaryData(txn,combinedResults, instance);
        }

        instance.skipDBQueryExecution();
    }

    public async getSalaryData(txn,a, instance) {
        for (let i = 0; i < a.length; i++) {
            let benefitConfig =await txn.getExecutedQuery("d_o2c_employee_benefitconfig", { loadAll: true,'company_code':a[i].company_code,'business_area':a[i].business_area,'profit_center':a[i].profit_center});
            let hdrID = a[i]?.hdr_id || a[i]?.hdr_log_id;
            let employeeSalaryItem = a[i]?.r_salary_hdr_items || a[i]?.r_salary_hdr_item_log;
            console.log(employeeSalaryItem);
            for (let j = 0; j < employeeSalaryItem.length; j++) {
                let benefitItemData=benefitConfig.find((item)=>item.benefit==employeeSalaryItem[j].benefit_id)
                let salaryHdrGuid = Date.now().toString() + "_" + (j);
                let itmID = employeeSalaryItem[j]?.itm_id || employeeSalaryItem[j]?.itm_log_id;
                let salaryHdrData = {
                    salary_hdr_guid: salaryHdrGuid,
                    count_no: i,
                    hdr_id: hdrID,
                    company_code: a[i].company_code,
                    business_area: a[i].business_area,
                    profit_center: a[i].profit_center,
                    employee_id: a[i].employee_id,
                    from_date: a[i].from_date,
                    to_date: a[i].to_date,
                    currency: a[i].currency,
                    total_cost: a[i].total_cost,
                    fixed: a[i].fixed,
                    ctc: a[i].ctc,
                    gross_pay: a[i].gross_pay,
                    basic: a[i].basic,
                    remark: a[i].remark,
                    total_cost_perc: a[i].total_cost_perc,
                    basic_perc: a[i].basic_perc,
                    fixed_hike_perc: a[i].fixed_hike_perc,
                    net_take_home_annually: a[i].net_take_home_annually,
                    itm_id: itmID,
                    benefit_type: benefitItemData?.benifit_type,
                    benefit_id: benefitItemData?.benefit,
                    benefit_name: benefitItemData?.benefit_name,
                    start_date: employeeSalaryItem[j].start_date,
                    end_date: employeeSalaryItem[j].end_date,
                    actual_amount: employeeSalaryItem[j].actual_amount,
                    planned_amount: employeeSalaryItem[j].planned_amount
                }
                this.employeeSalary.push(salaryHdrData);
            }
        }
        await instance.setResults(this.employeeSalary);
        this.employeeSalary = [];
    }

}

//12 Oct 2025 ----->11:30PM