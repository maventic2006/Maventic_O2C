import { KloTransaction } from "kloBo/KloTransaction";

export class employeeHierarchy {
	public static async lineManagerEmployeeHierarchy(txn) {
		const employees = await txn.getExecutedQuery("d_o2c_employee", { loadAll: true });

		// Step 1: Build direct report map with empty arrays for all employees
		const directReportsMap = {};
		for (const { employee_id, line_manager } of employees) {
			if (!directReportsMap[employee_id]) {
				directReportsMap[employee_id] = [];
			}
			if (line_manager !== null) {
				if (!directReportsMap[line_manager]) {
					directReportsMap[line_manager] = [];
				}
				directReportsMap[line_manager].push(employee_id);
			}
		}

		// Step 3: Build full hierarchy map
		const fullHierarchyMap = {};
		for (const employeeId in directReportsMap) {
			fullHierarchyMap[employeeId] = await this.getAllReports((employeeId), directReportsMap);
		}
		debugger;
		console.log(fullHierarchyMap);
		return (fullHierarchyMap);

	}
	// Step 2: Recursive function to get full hierarchy
	public static async getAllReports(managerId, map) {
		const result = [];
		const visited = new Set();

		function dfs(currentId) {
			if (!map[currentId]) return;
			if (visited.has(currentId)) return;  // Prevent revisiting nodes (cycle detection)
			visited.add(currentId);

			for (const reportId of map[currentId]) {
				result.push(reportId);
				dfs(reportId);
			}
		}

		dfs(managerId);
		return result;
	}


}
