import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pa_emp_detail")
export default class p_pa_emp_detail extends KloController {

    public empGrading = [];
    public paCycleTableData = [];
    public employeeData = [];
    public allLMGraded = [];
    public loginID;
    public roleID;

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).


        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is loading.."
        });
        busyDialog.open();
        this.tm.getTN("other").setData({});

        this.loginID = (await this.transaction.get$User()).login_id;

        //loadAll true is using because first time without loadAll true the data is not coming
        this.employeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': this.loginID, expandAll: 'r_employee_org', partialSelected: ['employee_id', 'line_manager'] });

        let loginUserOrgBArea = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.business_area))).map((businessArea) => ({ key: businessArea }));
        let loginUserOrgPC = Array.from(new Set(this.employeeData[0].r_employee_org.map((item) => item.profit_centre))).map((PC) => ({ key: PC }));

        //Login user Org set in the drop down of search
        this.tm.getTN("other").setProperty('businessAreaList', loginUserOrgBArea);
        this.tm.getTN("other").setProperty('profitCenterList', loginUserOrgPC);
        //Need to change
        await this.getNextFinancialYears("2025-2026");

        //Primary Org of the login user should be set in the search by default
        let primaryOrg = this.employeeData[0].r_employee_org.filter((item) => item.is_primary == true);

        this.tm.getTN("other").setProperty('companyCode', primaryOrg[0].company_code);
        this.tm.getTN("other").setProperty('businessArea', primaryOrg[0].business_area);
        this.tm.getTN("other").setProperty('profitCenter', primaryOrg[0].profit_centre);
        this.tm.getTN("other").setProperty('fyear', new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));

        this.tm.getTN("other").setProperty('loginUser', this.loginID.toUpperCase());

        await this.lineManagerData();

        //Function call for mantee of the above company code, business area, PC and Fiscal year
        await this.searchData();
        busyDialog.close();

    }
    public async lineManagerData() {
        let allEmployeeData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, partialSelected: ['employee_id', 'line_manager'] });

        const visited = new Map<string, { employeeID: string; name: string }>();
        const seenEmployees = new Set<string>();

        const loginUser = await this.transaction.get$User();
        const loginUserID = loginUser.login_id;

        const otherData = await this.tm.getTN("other").getData();
        const businessArea = otherData.businessArea;
        const profitCenter = otherData.profitCenter;

        const queue: string[] = [loginUserID];

        while (queue.length > 0) {
            const currentManagers = [...queue];
            queue.length = 0;

            const employeeResults = await this.transaction.getExecutedQuery('q_mantees_based_on_org', {
                line_manager: currentManagers,
                business_area: businessArea,
                profit_center: profitCenter,
                loadAll: true
            });

            for (const emp of employeeResults) {
                const empId = emp.employee_id;
                const lmId = emp.line_manager;

                if (!seenEmployees.has(empId)) {
                    seenEmployees.add(empId);

                    // Store manager info uniquely
                    if (!visited.has(lmId.toUpperCase())) {
                        const lmi = allEmployeeData.find(item => item.employee_id.toUpperCase() === lmId.toUpperCase());
                        visited.set(lmId, {
                            employeeID: lmId.toUpperCase(),
                            name: lmi ? lmi.full_name : ''
                        });
                    }

                    queue.push(empId); // Continue BFS
                }
            }
        }

        // Add login user at the start if not already in visited
        if (!visited.has(loginUserID.toUpperCase())) {
            const loginUserName = allEmployeeData.find(item => item.employee_id.toUpperCase() === loginUserID.toUpperCase());
            visited.set(loginUserID, {
                employeeID: loginUserID.toUpperCase(),
                name: loginUserName ? loginUserName.full_name : ''
            });
        }

        const finalList = Array.from(visited.values());
        await this.tm.getTN("other").setProperty('lm', finalList);
    }


    public async searchData() {
        const tm = this.tm;
    
        // Step 1: Get initial search data
        const searchData = await tm.getTN("other").getData();
    
        const empSearchTN = tm.getTN("pa_ind_emp_search");
    
        // Step 2: Set search parameters
        await Promise.all([
            empSearchTN.setProperty('business_area', searchData.businessArea),
            empSearchTN.setProperty('company_code', searchData.companyCode),
            empSearchTN.setProperty('profit_center', searchData.profitCenter),
            empSearchTN.setProperty('fyear', searchData.fyear)
        ]);
    
        // Step 3: Execute search
        await empSearchTN.executeP();
        await empSearchTN.setActive(0);
    
        // Step 4: Get chart data
        const chartData = (await tm.getTN('list_pa_ind_emp').getData())[0];
    
        // Step 5: Process each employee in parallel
        await Promise.all(chartData.r_emp_planing_detail.map(async emp => {
            const [empData, empExpHistory] = await Promise.all([
                emp.r_pa_emp_details.fetch(),
                emp.r_pa_emp_history.fetch()
            ]);
    
            const joiningDate = new Date(empData[0].joining_date).getTime();
            const currentTime = Date.now();
    
            const mavExp = this.calculateExperience(currentTime, joiningDate);
    
            let prevExp = 0;
            for (const history of empExpHistory) {
                const from = new Date(history.from_date).getTime();
                const to = new Date(history.to_date).getTime();
                prevExp += this.calculateExperience(to, from);
            }
    
            emp['mav_exp'] = mavExp;
            emp['prev_exp'] = prevExp;
            emp['total_exp'] = mavExp + prevExp;
        }));
    }
    
    private calculateExperience(startDate: number, endDate: number): number {
        const diffTime = Math.abs(startDate - endDate);
        const days = diffTime / (1000 * 60 * 60 * 24);
        const totalYears = (days / 30.44) / 12;
        return Math.ceil(totalYears * 10) / 10; // round to 1 decimal place
    }
    


    public async getNextFinancialYears(currentYear: string) {
        const fiscalYears = [];
    
        // Get the base start year from the provided financial year (e.g., "2023-2024")
        const baseStartYear = parseInt(currentYear.split('-')[0], 10);
    
        // Determine the current financial year start
        const today = new Date();
        const currentFYStart = today.getMonth() + 1 >= 4
            ? today.getFullYear()
            : today.getFullYear() - 1;
    
        const endYear = currentFYStart + 2;
    
        // Build financial years list from baseStartYear to endYear
        for (let year = baseStartYear; year <= endYear; year++) {
            fiscalYears.push({ year: `${year}-${year + 1}` });
        }
    
        // Set the fiscal years in the TM object
        await this.tm.getTN("other").setProperty('fiscal', fiscalYears);
    }
    

}