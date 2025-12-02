import { q_pa_budgt_allocatn_trans as q_pa_budgt_allocatn_trans_gen } from "o2c_v2/query_gen/q_pa_budgt_allocatn_trans"
import { employeeHierarchy } from "o2c_v2/util/employeeHierarchy";
export class q_pa_budgt_allocatn_trans extends q_pa_budgt_allocatn_trans_gen {
    public managerData = [];
    public login_id
    public async budgetAllocation(oEvent) {
        this.login_id = (await this.txn.get$User()).login_id;
        let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        let txn = oEvent.getTxn();
        let qSavedData = await txn.getQueryP('q_o2c_lmi_directreported');//this way you can get instance of any query
        qSavedData.setProperty('login_id', this.login_id);
        await qSavedData.setLoadAll(true);
        let savedData = await qSavedData.executeP();//execute here
        if (savedData.length) {
            let employeeArray = savedData.map((item) => item.employee_id);
            employeeArray.push(this.login_id);
            // let employeeArray = [...new Set([...savedData.map(item => item.employee_id), this.login_id])];
            let qInstance1 = await txn.getQueryP('q_o2c_pa_employee');//this way you can get instance of any query
            //set 
            qInstance1.setProperty("company_code", oEvent.object.company_code);
            if (oEvent.object.business_area != "ALL")
                qInstance1.setProperty("business_area", oEvent.object.business_area);
            qInstance1.setProperty("profit_center", oEvent.object.profit_center);
            qInstance1.setProperty("employee_id", employeeArray);
            qInstance1.setProperty("curr_date", new Date());
            //set End
            await qInstance1.setLoadAll(true);
            let es1 = await qInstance1.executeP();//execute here
            if (es1.length) {
                let paCycleData = await txn.getExecutedQuery('q_o2c_employee_pa_cycle', { company_code: oEvent.object.company_code, business_area: oEvent.object.business_area, profit_center: oEvent.object.profit_center, fyear: oEvent.object.fiscal });
                await this.setManagerData(txn, es1, paCycleData, instance);
            }
        }
        instance.skipDBQueryExecution();
    }
    public async setManagerData(txn, a, paCycleData, instance) {
        let paCycleDataBudget = paCycleData.length ? await paCycleData[0].r_pa_budget : ''
        for (let i = 0; i < a.length; i++) {
            let employeeBudget = paCycleDataBudget?.find((item) => item.line_manager_id.toLowerCase() == a[i].employee_id.toLowerCase());
            let employeeData = await this.manteeDirectIndirectReport(txn, a[i].employee_id);
            let data = {
                my_guid: Date.now().toString() + "_" + (i),
                my_key: employeeBudget ? employeeBudget.my_key : "",
                pa_cycle_id:employeeBudget?employeeBudget.pa_cycle_id:paCycleData[0].pa_cycle_id,
                line_manager_id: a[i].employee_id,
                no_of_employee: employeeBudget ? employeeBudget.no_of_employee : employeeData,
                total_budget: employeeBudget ? parseFloat(employeeBudget.allotted_budget) + parseFloat(employeeBudget.unulilised_budget) : "",
                allocated_percentage: employeeBudget?.allocated_percen,
                allocated_amount: employeeBudget?.allotted_budget,
                unulilised_budget:employeeBudget?.unulilised_budget,
                comment: employeeBudget ? employeeBudget.comment : "",
            }

            // Push the processed data into the categoryData array
            this.managerData.push(data);
        }
        await instance.setResults([]);
        await instance.setResults(this.managerData);
        this.managerData = [];
    }
    public async manteeDirectIndirectReport(txn, employeeID) {
        let empArray = await employeeHierarchy.lineManagerEmployeeHierarchy(txn);
        const normalizedUserId = employeeID.toLowerCase();

        // Find a matching key in empArray ignoring case
        const matchingKey = Object.keys(empArray).find(
            key => key.toLowerCase() === normalizedUserId
        );
      
        //return matchingKey;
        return Array.isArray(empArray[matchingKey])
        ? empArray[matchingKey].length
        : 0;
    }
}
//06 Sep 25 12 AM