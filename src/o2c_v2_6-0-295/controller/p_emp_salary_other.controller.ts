import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_salary_other")
export default class p_emp_salary_other extends KloController {
    public async onPageEnter(oEvent) {
        await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "emp_salary_detail");

        let employeeID;
        if (oEvent.navToParams.AD) {
            employeeID = oEvent.navToParams.AD[0];
        }
        else {
            employeeID = (await this.transaction.get$User()).login_id;
        }
        let roleID = (await this.transaction.get$Role()).role_id;
        let employeeDetail = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': employeeID, partialSelected: ['full_name', 'profile_pic', 'joining_date'], loadAll: true });
        let empDesignation = await this.transaction.getExecutedQuery('q_o2c_emp_current_desig', { employee_id: employeeID, from_date: new Date(), to_date: new Date(), partialSelected: 'name', expandAll: 'r_designation_name', loadAll: true });

        await this.tm.getTN("colExp").setData({ button: true });

        let fyList = await this.getEmployeeFinancialYears(employeeDetail[0].joining_date);
        //Need to merge the below 2 line of code
        let fiscalYearSelected = `${(new Date().getFullYear())}-${new Date().getFullYear() + 1}`;
        let fiscalYear = await this.getFinancialYearDates(`${(new Date().getFullYear())}-${new Date().getFullYear() + 1}`);

        await this.salaryData(employeeID, new Date(fiscalYear.startDate), new Date(fiscalYear.endDate));
        await this.tm.getTN("other").setData({ employeeID: employeeID, fullname: employeeDetail[0].full_name, designation: empDesignation[0].r_designation_name.name,/*pic:employeeDetail[0].profile_pic*/ fyselected: fiscalYearSelected, fiscalDd: fyList });
        await this.tm.getTN("role").setData({ roleID });
    }

    public async colExpbutn() {
        const isExpanded = await this.tm.getTN("colExp").getData().button;

        const components = [
            "s_emp_component_area",
            "s_emp_bonus",
            "s_emp_contribution",
            "s_emp_contri_deduct",
            "s_retirement_benefit",
            "s_add_on_benefit"
        ];

        // Loop through each component and set expanded based on `isExpanded` value
        for (const componentId of components) {
            let component = await this.getActiveControlById(null, componentId);
            component.getParent().setExpanded(!isExpanded);
        }

        // Toggle the button state and set the data
        await this.tm.getTN("colExp").setData({ button: !isExpanded });
    }

    public async salaryData(employeeID, fdate, tdate) {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is loading..."
        });
        busyDialog.open();
        await this.tm.getTN("salary_search").setProperty('emp_id', employeeID);
        await this.tm.getTN("salary_search").setProperty('fdate', fdate);
        await this.tm.getTN("salary_search").setProperty('tdate', tdate);
        await this.tm.getTN("salary_search").executeP();

        let listData = await this.tm.getTN("list").getData();
        let countMap = listData.map(e => e.count_no);

        // Find the maximum count value
        let maxCount = Math.max(...countMap);

        // Get all indices where count_no equals maxCount
        let maxIndices = listData
            .map((item, index) => item.count_no === maxCount ? index : -1)
            .filter(index => index !== -1);

        // Set active on all indices (assuming setActive accepts an array)
        let empSalaryData = await this.tm.getTN("list").getData()[maxIndices];
        let data;
        if (empSalaryData) {
            // await this.tm.getTN("search_item_transient").setProperty('SalaryHdrData', empSalaryData);
            // await this.tm.getTN("search_item_transient").setProperty('salary_hdr_guid', empSalaryData.salary_hdr_guid);
            // await this.tm.getTN("search_item_transient").setProperty('key', empSalaryData.hdr_id);
            // await this.tm.getTN("search_item_transient").executeP();
            data =await empSalaryData?.r_salary_hdr_itm?await empSalaryData?.r_salary_hdr_itm:await empSalaryData?.r_salary_hdr_itm_log
        }
        else {
            sap.m.MessageBox.error("The salary details is not present in this finanical year", {
                title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
            });

        }
        //const data = await this.tm.getTN("item_list_transient").getData(); // get the actual data object
        await this.tm.getTN("trans").setData(data);           // set the data into the "trans" node
        busyDialog.close();
    }
    public async onfiscalYearChange() {

        let selectedFiscalYear = await this.tm.getTN("other").getData().fyselected;
        let inputYear = await this.getFinancialYearDates(selectedFiscalYear);
        let selectedFromDate = new Date(inputYear.startDate);
        let selectedToDate = new Date(inputYear.endDate);
        await this.salaryData(await this.tm.getTN("other").getData().employeeID, selectedFromDate, selectedToDate);
    }
    public getFinancialYearDates(inputDate: string): { startDate: Date, endDate: Date } {
        // Split the inputDate into start year and end year
        const years = inputDate.split('-');
        const startYear = parseInt(years[0], 10);
        const endYear = parseInt(years[1], 10);

        // Financial year starts on April 1st of the start year and ends on March 31st of the end year
        const financialYearStart = new Date(startYear, 3, 1); // April 1st of start year
        const financialYearEnd = new Date(endYear, 2, 31); // March 31st of end year

        // Return the start and end dates
        return {
            startDate: financialYearStart,
            endDate: financialYearEnd
        };
    }
    public async getEmployeeFinancialYears(joiningDate) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const financialYears = [];

        // Get the start year and end year for the current financial year (April to March)
        let startYear = currentYear;
        let endYear = currentYear + 1;

        // If the current month is before April (i.e., Jan, Feb, or Mar), adjust the financial year to the previous year
        if (currentDate.getMonth() < 3) { // Months are 0-based, so 3 means April
            startYear = currentYear - 1;
            endYear = currentYear;
        }

        // Adjust for joiningDate and calculate the financial years starting from the joining year
        let joiningYear = joiningDate.getFullYear();
        if (joiningDate.getMonth() < 3) {  // Before April, adjust the financial year
            joiningYear -= 1;
        }

        // Loop through years to generate financial years from the joining year onward
        for (let year = startYear; year >= joiningYear; year--) {
            let financialYear = `${year}-${year + 1}`;
            financialYears.push({ fy: financialYear });
        }

        return financialYears;
    }
    public async onSave() {
        let empSalaryData = await this.tm.getTN("list").getData();
        let empEarningList = empSalaryData[0].r_emp_earnings;
        let prevConveyanceAllowanceData = empEarningList.filter((item) => item.benefit_name == "Conveyance Allowance");
        let monetaryAllowanceData = await this.tm.getTN("otherlist").getData();
        let currConveyanceAllowanceData = monetaryAllowanceData.filter((item) => item.benefit_name == "Conveyance Allowance");
        if (currConveyanceAllowanceData[0].planned_amount != prevConveyanceAllowanceData[0].planned_amount) {
            prevConveyanceAllowanceData[0].planned_amount = currConveyanceAllowanceData[0].planned_amount;
        }
        await this.tm.commitP("Save Successful", "Save Failed", true, true);
    }


}

//AF 9:47AM
