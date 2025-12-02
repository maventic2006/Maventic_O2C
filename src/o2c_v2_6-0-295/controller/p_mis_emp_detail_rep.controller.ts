import { KloController } from 'kloTouch/jspublic/KloController'
// import { q_mis_emp_detail_report } from 'o2c_v2/query_gen/q_mis_emp_detail_report';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_mis_emp_detail_rep")
export default class p_mis_emp_detail_rep extends KloController {
    public filteredData = [];
    // public pc;
    public allActiveEmp;
    // public profitCentre;
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onPageEnter(oEvent) {
        let select_month = oEvent.navToParams.monthPC;
        // let month = new Date(select_month); 
        // this.pc = oEvent.navToParams.pc;
        // this.profitCentre = oEvent.navToParams.profitCenter;
        // let month = new Date("04/01/2024");
        // let pc = "MPC1";
        await this.tm.getTN("list").setData({});
        // await this.tm.getTN("emp_mis_search").setProperty('select_month', month);
        // await this.tm.getTN("emp_mis_search").setProperty('profit_centre', pc);
        // await this.tm.getTN("emp_mis_search").executeP();

        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is loading..."
        });
        busyDialog.open();
        // let filteredData = [];
        let emp_id;
        //Total Active Employee
        this.allActiveEmp = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, expandAll: 'r_employee_org' });

        try {

            for (let j = 0; j < select_month.length; j++) {

                for (let i = 0; i < this.allActiveEmp.length; i++) {
                    emp_id = this.allActiveEmp[i].employee_id;
                    let emp_org = this.allActiveEmp[i].r_employee_org;
                    let filterEmpData = [];
                    if (emp_org.length > 0) {
                        filterEmpData = emp_org.filter(item => {
                            let activeTillDate = this.allActiveEmp[i].is_active ? item.active_till : this.allActiveEmp[i].last_working_day;

                            return (item.profit_centre == select_month[j].PC && item.is_primary == true
                                && (select_month[j].month.getFullYear() > item.active_from.getFullYear() || (select_month[j].month.getFullYear() === item.active_from.getFullYear() && select_month[j].month.getMonth() >= item.active_from.getMonth()))
                                && (select_month[j].month.getFullYear() < activeTillDate.getFullYear() || (select_month[j].month.getFullYear() === activeTillDate.getFullYear() && select_month[j].month.getMonth() <= activeTillDate.getMonth())));
                        });
                    }
                    if (filterEmpData.length > 0) {

                        this.filteredData.push({
                            month: select_month[j].month.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                            employee_id: this.allActiveEmp[i].employee_id,
                            full_name: this.allActiveEmp[i].full_name,
                            s_status: this.allActiveEmp[i].s_status,
                            type: this.allActiveEmp[i].type === "T01" ? "Provisional" : this.allActiveEmp[i].type === "T02" ? "Permanent" : "Contract",
                            is_fresher: this.allActiveEmp[i].is_fresher,
                            line_manager: this.allActiveEmp[i].line_manager,
                            profit_centre: select_month[j].PC,
                            business_area: filterEmpData[0]?.business_area,
                            pc_name: select_month[j].profitCenter
                        });
                    }
                }
            }
        } catch (e) {
            sap.m.MessageBox.show(emp_id);
            console.log(e);
        }

        await this.tm.getTN("length").setData({ "length": this.filteredData.length });

        await this.tm.getTN("list").setData(this.filteredData);
        busyDialog.close();
    }

    public async onExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let businessArea = await this.transaction.getExecutedQuery('d_o2c_business_area', {
            loadAll: true
        })

        let jsonData = [];

        // Build the jsonData array using the fetched data
        for (let index = 0; index < this.filteredData.length; index++) {
            let business_area = businessArea.filter((item) => item.business_area === this.filteredData[index]?.business_area)

            jsonData.push({
                'Month': this.filteredData[index].month,
                'Employee ID': this.filteredData[index]?.employee_id,
                'Employee Name': this.filteredData[index]?.full_name,
                'Status': this.filteredData[index]?.s_status,
                'Employment Type': this.filteredData[index]?.type,
                'Is Fresher': this.filteredData[index]?.is_fresher,
                'Line Manager': this.filteredData[index]?.line_manager,
                'Profit Center': this.filteredData[index].pc_name,
                'Business Area': business_area[0]?.name
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();

        // Set column widths
        worksheet['!cols'] = [
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 30 },
            { width: 30 },
            { width: 30 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Detail Data");

        // Write workbook to a file
        const filePath = 'emp_detail_data.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();

    }
}