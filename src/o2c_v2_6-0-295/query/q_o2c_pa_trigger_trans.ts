import { q_o2c_pa_trigger_trans as q_o2c_pa_trigger_trans_gen } from "o2c_v2/query_gen/q_o2c_pa_trigger_trans"
import { employeeHierarchy } from "o2c_v2/util/employeeHierarchy";
import values from "sap/base/util/values";
export class q_o2c_pa_trigger_trans extends q_o2c_pa_trigger_trans_gen {
	public managerData = [];
	public login_id
	public async paTriggerFunc(oEvent) {
		this.login_id = (await this.txn.get$User()).login_id;
		let PAtype = '';
		let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
		instance.setLoadAll(true);
		let txn = oEvent.getTxn();

		let qSavedData = await txn.getQueryP('q_o2c_employee_pa_cycle');//this way you can get instance of any query
		//set 
		qSavedData.setProperty("company_code", oEvent.object.company_code);
		if (oEvent.object.business_area != "ALL")
			qSavedData.setProperty("business_area", oEvent.object.business_area);
		qSavedData.setProperty("profit_center", oEvent.object.profit_center);
		qSavedData.setProperty("fyear", oEvent.object.fiscal);
		//set End
		await qSavedData.setLoadAll(true);
		let savedData = await qSavedData.executeP();//execute here
		if (savedData.length == 0) {
			let employeeData = await txn.getExecutedQuery('q_o2c_pa_manager', { designation: 'MANAGER', line_manager: this.login_id, curr_date: new Date() });
			let employeeArray = employeeData.map((item) => item.employee_id);
			employeeArray.push(this.login_id);
			if (employeeArray.length) {
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
					PAtype = "Not PA Trigger"
					await this.setManagerData(txn, PAtype, es1, instance);
				}
			}
		}
		else {
			PAtype = "PA Trigger";

			let lineManagerArray = savedData[0].r_all_lm.filter((item) => item.manager_id.toLowerCase() == this.login_id.toLowerCase() || item.line_manager_id.toLowerCase() == this.login_id.toLowerCase());
			await this.setManagerData(txn, PAtype, lineManagerArray, instance);
		}
		instance.skipDBQueryExecution();
	}
	public async setManagerData(txn, PAtype, a, instance) {
		const usePA = PAtype === "Not PA Trigger";

		const employeeId = usePA ? "employee_id" : "line_manager_id";
		const lineManager = usePA ? "line_manager" : "manager_id";

		for (let i = 0; i < a.length; i++) {
			const status = usePA ? "Open" : a[i].s_status == "Save As Draft" ? "Pending" : a[i].s_status;
			let employeeData = await this.manteeDirectIndirectReport(txn, a[i][employeeId]);
			let menteeData = await this.manteeDirectReport(txn, a[i][employeeId]);
			let data = {
				my_key: Date.now().toString() + "_" + (i),
				serial_no: i + 1,
				employee_id: a[i][employeeId],
				mentee_count: menteeData,
				email_id: a[i][lineManager],
				total_employee: employeeData,
				status: status
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
	public async manteeDirectReport(txn, employeeID){
		let menteeData = await txn.getExecutedQuery('d_o2c_employee', { line_manager: employeeID});
		return menteeData?menteeData.length:0;
	}
}
//Finally done 1/9/25.