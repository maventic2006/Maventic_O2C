import { ErrorType } from "kloBo/KloEnums";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { EventContext } from "kloBo/EventContext";
import { d_pms_annual_performance as d_pms_annual_performance_gen } from "o2c_v2/entity_gen/d_pms_annual_performance";
export class d_pms_annual_performance extends d_pms_annual_performance_gen {
	public async onCreateAnnualAppraisal(oEvent: EventContext) {
		let instance = oEvent.getObject();
		let txn = oEvent.getTxn();
		const [profitCentreDetails, empDesignationDetails, allActiveEmployees, employeeAddedToAppraisal] = await Promise.all([txn.getExecutedQuery("d_o2c_profit_centre", { skipMap: true, loadAll: true }), txn.getExecutedQuery("d_o2c_designation_master", { skipMap: true, loadAll: true }), txn.getExecutedQuery("q_employ_filter", { skipMap: true, loadAll: true }), txn.getExecutedQuery("q_pms_annual_per_employees", { skipMap: true, loadAll: true })]);
		let remainingEmployee = allActiveEmployees.filter((empData) => !employeeAddedToAppraisal.some((e) => e.employee_id === empData.employee_id));
		for (let empData of remainingEmployee) {
			let currentExperience = await this.getYearDifference(new Date().getTime(), empData.joining_date);
			let empHistory = await empData.r_emp_history?.fetch();
			let totalExperience = 0;
			for (let empHistoryData of empHistory) {
				totalExperience += await this.getYearDifference(empHistoryData.to_date, empHistoryData.from_date);
			}
			let empOrg = await empData.r_employee_org?.fetch();
			let empCurrentDept = profitCentreDetails.filter((e) => e.profit_center == empOrg[0]?.profit_centre);
			let empDesignationID = await empData.r_o2c_emp_designation?.fetch();
			let currentDesignation = empDesignationDetails.filter((e) => e.designation_id == empDesignationID[0]?.designation);
			await txn.createEntityP("d_pms_annual_per_employees", {
				current_experience: currentExperience,
				department: empCurrentDept[0]?.name,
				total_year_experience: totalExperience + currentExperience,
				designation: currentDesignation[0]?.name,
				employee_id: empData.employee_id,
				ap_id: instance.ap_id,
				full_name: empData.full_name,
				is_active: true,
				joining_date: empData.joining_date,
				first_name: empData.first_name,
				last_name: empData.last_name,
				official_mail: empData.official_mail,
				phone_number: empData.phone_number,
				line_manager: empData.line_manager,
				included: "all",
			});
		}
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
}
