import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_o2c_emp_salary_item_trans as q_o2c_emp_salary_item_trans_gen } from "o2c_v2/query_gen/q_o2c_emp_salary_item_trans"
export class q_o2c_emp_salary_item_trans extends q_o2c_emp_salary_item_trans_gen {

    public employeeSalaryItem = [];
    //New Code

    public async empSalaryItemFunc(oEvent) {
        let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        const txn = oEvent.getTxn();
        const hdrId = oEvent.object.key;
        const setQueryProps = (query, key, value) => {
            query.setProperty(key, value);
        };

        const qInstance1 = await txn.getQueryP('d_o2c_employee_salary_hdr');
        const qInstance2 = await txn.getQueryP('d_o2c_emp_salary_hdr_log');

        // Set using helper
        setQueryProps(qInstance1, "hdr_id", hdrId);
        setQueryProps(qInstance2, "hdr_log_id", hdrId);

        const [es1, es2] = await Promise.all([
            qInstance1.executeP(),
            qInstance2.executeP()
        ]);

        const combinedResults = [...es1, ...es2];
        if (combinedResults.length) {
            let employeeSalaryItem = combinedResults[0].r_salary_hdr_items || combinedResults[0].r_salary_hdr_item_log;
            await this.getSalaryItemData(oEvent.object.salary_hdr_guid, oEvent.object.SalaryHdrData, employeeSalaryItem, instance);

        }
        instance.skipDBQueryExecution();

    }

    public async getSalaryItemData(salaryHdrGuid, SalaryHdrData, a, instance) {
        let salaryItemData;
        salaryItemData = {
            salary_item_guid: Date.now().toString(),
            salary_hdr_guid: SalaryHdrData.salary_hdr_guid,
            hdr_id: SalaryHdrData.hdr_id,
            itm_id: "",
            benefit_id: "CTC",
            benefit_type: "",
            planned_amount: SalaryHdrData.ctc,
            benefit_name:"",
            actual_amount: SalaryHdrData.ctc,
            start_date:"",
            end_date:""
        }
       salaryItemData = {
            salary_item_guid: Date.now().toString(),
            salary_hdr_guid: SalaryHdrData.salary_hdr_guid,
            hdr_id: SalaryHdrData.hdr_id,
            itm_id: "",
            benefit_id: "Basic",
            benefit_type: "",
            planned_amount: SalaryHdrData.basic,
            benefit_name:"",
            actual_amount: SalaryHdrData.basic,
            start_date:"",
            end_date:""
        }
        let allBenefit = <KloEntitySet<d_o2c_employee_benefitconfig>>await this.txn.getExecutedQuery('d_o2c_employee_benefitconfig', { loadAll: true, partialSelected: ['benefit', 'benefit_type'] });
        for (let j = 0; j < a.length; j++) {
            let selectedBenefit = allBenefit.find((item) => item.benefit == a[j].benefit_id);
            let hdrID = a[j]?.hdr_id || a[j]?.hdr_log_id;
            let itmID = a[j]?.itm_id || a[j]?.itm_log_id;
            // Do something with hdrID and employeeSalaryItem
            if (selectedBenefit.benifit_type == "Monetary Allowance") {
                let salaryItemData = {
                    salary_item_guid: Date.now().toString() + "_" + (j),
                    salary_hdr_guid: salaryHdrGuid,
                    hdr_id: hdrID,
                    itm_id: itmID,
                    benefit_id: a[j].benefit_id,
                    benefit_type: selectedBenefit.benifit_type,
                    planned_amount: a[j].planned_amount,
                    benefit_name: a[j].benefit_id,
                    actual_amount: a[j].actual_amount,
                    start_date: a[j].start_date,
                    end_date: a[j].end_date
                }
                this.employeeSalaryItem.push(salaryItemData);
            }
        }
        salaryItemData = {
            salary_item_guid: Date.now().toString(),
            salary_hdr_guid: SalaryHdrData.salary_hdr_guid,
            hdr_id: SalaryHdrData.hdr_id,
            itm_id: "",
            benefit_id: "Gross Pay",
            benefit_type: "",
            planned_amount: SalaryHdrData.gross_pay,
            benefit_name:"",
            actual_amount: SalaryHdrData.gross_pay,
            start_date:"",
            end_date:""
        }
        this.employeeSalaryItem.push(salaryItemData);
        await instance.setResults(this.employeeSalaryItem);
        this.employeeSalaryItem = [];

    }
}



//15/July--11:30PM
