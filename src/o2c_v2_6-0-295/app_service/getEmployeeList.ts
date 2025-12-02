import { KloAppService } from "kloBo/KloAppService";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_designation_master } from "o2c_v2/entity_gen/d_o2c_designation_master";
import { d_o2c_employee } from "o2c_v2/entity_gen/d_o2c_employee";

export class getEmployeeList extends KloAppService {

    public async onExecute() {
        // Write your code here
        let jsonData = [];
        const designation_master = <KloEntitySet<d_o2c_designation_master>>await this.txn.getExecutedQuery("d_o2c_designation_master", { loadAll: true });
        const all_employee_list = <KloEntitySet<d_o2c_employee>>await this.txn.getExecutedQuery("d_o2c_employee", { loadAll: true });
        const empMap = Object.fromEntries(all_employee_list.map(e => [e.employee_id, e.full_name]));
        const empSet = new Set(this.data.aFilteredData);
        const filteredEmployees = all_employee_list.filter(emp =>
            empSet.has(emp.employee_id)
        );

        // Build the jsonData array using the fetched data
        for (let index = 0; index < filteredEmployees.length; index++) {
            const empData = filteredEmployees[index]; // Store once and reuse

            await empData.r_employee_org.fetch();
            let emp_org = empData.r_employee_org.find(item => item.is_primary === true);

            let emp_designation = null;
            await empData.r_o2c_emp_designation.fetch();

            if (empData.r_o2c_emp_designation?.length) {
                const today = new Date().getTime();

                // Filter all records where today's date lies between from_date and to_date (considering empty fields)
                emp_designation = empData.r_o2c_emp_designation.find(item => {
                    const fromDate = item.from_date ? new Date(item.from_date).getTime() : null;
                    const toDate = item.to_date ? new Date(item.to_date).getTime() : null;

                    // Include if:
                    // - from_date is empty (open start) OR today >= from_date
                    // - and to_date is empty (open end) OR today <= to_date
                    return (!fromDate || today >= fromDate) && (!toDate || today <= toDate);
                });
            }

            const employeeDetails = {
                'Employee ID': empData?.employee_id,
                'Employee Name': empData?.full_name,
                'Confirmation Date': getEmployeeList.formatDate(empData?.confirmation_date),
                'Is Active': empData?.is_active,
                'Status': empData?.s_status,
                'Location': emp_org?.business_area,
                'Team': emp_org?.profit_centre,
                'Joining Date': getEmployeeList.formatDate(empData?.joining_date),
                'Phone Number': empData?.phone_number,
                'Is Fresher': empData?.is_fresher,
                'Personal Mail': empData?.personal_mail,
                'Official Mail': empData?.official_mail,
                'Gender': empData?.gender === "gen1" ? "Male" : "Female",
                'Previous Experience In Month': empData?.previous_exp_Months,
                'Approved By': empMap[empData?.approved_by?.toUpperCase()] || "",
                'Marital Status': empData?.maritial_status == null
                    ? ""
                    : empData?.maritial_status === "M01"
                        ? "Single"
                        : empData?.maritial_status === "M02"
                            ? "Married"
                            : empData?.maritial_status === "M03"
                                ? "Divorced"
                                : empData?.maritial_status === "M04"
                                    ? "Widow"
                                    : "",
                'Father Name': empData?.father_name,
                'Date of Birth': getEmployeeList.formatDate(empData?.date_of_birth),
                'Is Passport Available': empData?.is_passport_available,
                'Line Manager': empMap[empData?.line_manager?.toUpperCase()] || "",
                'Hiring Manager': empMap[empData?.s_created_by?.toUpperCase()] || "",
                'Bank Name': empData?.bank_name,
                'Ifsc Code': empData?.ifsc_code,
                'Account Number': empData?.account_number,
                'Work Mode': empData?.work_mode,
                'Designation': designation_master.find(e => e.designation_id === emp_designation?.designation)?.name,
            };

            jsonData.push(employeeDetails);
        }

        return jsonData;
    }

    private static formatDate(dateValue: string | Date | null | undefined) {
        if (!dateValue) return "";

        const d = dateValue instanceof Date ? dateValue : new Date(dateValue);

        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
        const year = d.getUTCFullYear();

        return `${day} ${month} ${year}`;
    }

}