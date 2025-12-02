import { q_empl_filter as q_empl_filter_gen } from "o2c_v2/query_gen/q_empl_filter";
export class q_empl_filter extends q_empl_filter_gen {
	public async onBeforeQuery(oEvent) {
		// const ruleInstance = oEvent.getObject();
		// // ruleInstance._q._qVar.filerFileds = ["employee_id", "first_name", "last_name"];
		// ruleInstance._q.qp._qVar.filerFileds = ["employee_id", "first_name", "last_name"];







		// 	const filterString = ruleInstance._q._qVar._filerstring;
		// 	const whereCond = {
		// 		rightnode: {
		// 			operator: "like",
		// 			leftvalue: "d_o2c_employee.first_name",
		// 			rightvalue: `%${filterString}%`,
		// 		},
		// 		leftnode: {
		// 			operator: "like",
		// 			leftvalue: "d_o2c_employee.last_name",
		// 			rightvalue: `%${filterString}%`,
		// 		},
		// 		whereoperator: "OR",
		// 	};
		// 	if (filterString) {
		// 		ruleInstance._q.applyColumnFilterP(whereCond);
		// 		ruleInstance._q._qVar.filerFileds = ruleInstance._q._qVar.filerFileds.filter((e) => e != "full_name");
		// 		ruleInstance._q._qVar._filerstring = null;
		// 	}
	}
}
