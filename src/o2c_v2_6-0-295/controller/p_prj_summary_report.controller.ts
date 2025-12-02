import { debug } from 'console';
import { KloEntitySet } from 'kloBo_7-2-52';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_project_header } from 'o2c_v2/entity/d_o2c_project_header';
import { d_o2c_timesheet_time_booking } from 'o2c_v2/entity/d_o2c_timesheet_time_booking';
import { d_o2c_timesheet_header } from 'o2c_v2/entity_gen/d_o2c_timesheet_header';
import { d_o2c_timesheet_task } from 'o2c_v2/entity_gen/d_o2c_timesheet_task';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_prj_summary_report")
let all_project = [];
let report_list = [];
let project_id;
let profit_center;
let so_id;
let fiscal_year = new Date;
let customer;
let pm;
let role;
export default class p_prj_summary_report extends KloController {

    public async onPrjSearch() {
        debugger;
        let search_data = await this.tm.getTN("prj_report_search").getData();
        project_id = search_data.project_id;
        profit_center = search_data.profit_center ? search_data.profit_center : search_data.pc_th;
        so_id = search_data.so_id;
        fiscal_year = search_data.fiscal_year;
        customer = search_data.customer;
        pm = search_data.project_manager;
        await this.onProjectReport();
    }

    public async onPageEnter() {
        //This event will be called whenever the screen enterss the visible area by means of navigation (Both front and back navigation).
        await this.tm.getTN("role_other").setData({});
        //Setting the search transnode 
        let prj_search = await this.tm.getTN("prj_report_search").getData();
        prj_search.fiscal_year = new Date();
        role = (await this.transaction.get$Role()).role_id;
        let th_pc = [];
        if (role == "TEAM_HEAD") {
            let th_pc_list = await this.tm.getTN("pc_teamhead_list").getData();
            th_pc_list.map((pc) => {
                th_pc.push(pc.profit_center);
            })
            prj_search.pc_th = th_pc;
        }
        // let credentials = await this.tm.getTN("role_other").getData();
        await this.tm.getTN("role_other").setProperty("roler",role);
        // credentials.roler = role;
        if (role == "MANAGER") {
            let user_id = (await this.transaction.get$User()).login_id;
            // credentials.user = user_id;
            await this.tm.getTN("role_other").setProperty("user",user_id);
            pm = user_id;
        }
        profit_center = th_pc;
        await this.onProjectReport();
    }

    //consumed effort calculation....
    public async addConsumedEffort(monthName, year, approvedTimesheets, timesheetBookedBasedTasks) {

        let totalConsumedPDs = 0;
        // const months = [
        //     'January', 'February', 'March', 'April', 'May', 'June',
        //     'July', 'August', 'September', 'October', 'November', 'December'
        // ];

        // for (let i = 0; i < monthlyPlanning.length; i++) {
        let consumedEffort = 0;
        // const [monthName, year] = monthlyPlanning[0].month.split(" ");
        // const index = months.indexOf(monthName);
        const startDate = new Date(year, monthName, 1);
        const endDate = new Date(year, monthName + 1, 0);
        //Change the date
        let sDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        let eDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        //End
        let per_month_consume = 0;
        const timeSheetHeaderBasedDate = approvedTimesheets.filter(item => item.from_date >= sDate && item.to_date <= eDate);
        if (timeSheetHeaderBasedDate.length > 0) {
            const timeSheetBasedDate = timesheetBookedBasedTasks.filter(item => item.booking_date >= startDate && item.booking_date <= endDate);
            for (const task of timeSheetBasedDate) {
                consumedEffort += parseFloat(task.hours_worked ? task.hours_worked : 0);
            }
            per_month_consume = (consumedEffort / 8);
        }
        totalConsumedPDs += parseFloat(per_month_consume);
        // }

        // sap.ui.getCore().getModel("mPageData").setProperty('/bookedPDs', totalConsumedPDs.toFixed(2));


        return {
            totalConsumedPDs: totalConsumedPDs,
            month: monthName,
            year: year
        };
        // let newAvailablePds = project_info[0].available_pds_new - totalConsumedPDs;
        // sap.ui.getCore().getModel("mPageData").setProperty('/availablePDs1', newAvailablePds.toFixed(2));


        /*public async onPageModelReady() {
            //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
        }*/

        /*public async onPageExit() {
              //This event will be called in the source screen whenever the developer navigates to a different screen.
        }*/



    }

    public async onProjectReport() {
        let start_date = new Date(fiscal_year.getFullYear(), 3, 1);
        let start_month = start_date.getMonth();
        let start_year = start_date.getFullYear();
        let end_date = new Date(fiscal_year.getFullYear() + 1, 2, 31);
        let end_month = end_date.getMonth();
        let end_year = end_date.getFullYear();
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        if (role == "MANAGER") {
            let user_id = (await this.transaction.get$User()).login_id;
            pm = user_id;
        }
        busyDialog.open();
        all_project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("q_prj_summary_rpt", {
            loadAll: true,
            project_id: project_id,
            so_id: so_id,
            profit_center: profit_center,
            customer: customer,
            fy_start_date: start_date,
            fy_end_date: end_date,
            project_manager: pm,
            // expandAll: 'r_project_so/r_profit_center,r_project_so/r_so_attachment'
        });
        let ts_header =<KloEntitySet<d_o2c_timesheet_header>> await this.transaction.getExecutedQuery("d_o2c_timesheet_header",{loadAll: true,'over_all_status': "Approved"});
        let ts_time_booking =<KloEntitySet<d_o2c_timesheet_time_booking>> await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', {loadAll: true});


        report_list = [];
        for (let project of all_project) {
            // let relation = await project.r_project_so.fetch();
            let all_so = project.r_project_so.length ? project.r_project_so : await project.r_project_so.fetch();
            let all_profit = all_so[0].r_profit_center.length ? all_so[0].r_profit_center : await all_so[0].r_profit_center.fetch();
            let all_attachment = all_so[0].r_so_attachment.length ? all_so[0].r_so_attachment : await all_so[0].r_so_attachment.fetch();
            const totalGrossValue = all_attachment.reduce((sum, attachment) => sum + attachment.gross_value, 0);
            const totalCRValue = all_attachment.reduce((sum, attachment) => sum + attachment.cr_rate, 0);
            let profit = all_profit.find((item) => item.profit_center == project.profit_center);

            //month wise consumption code starts... 
            // let taskIDs = [];
            let approvedSubmitIDs = [];
            let approvedTaskIDs = new Set();
            let approvedTimesheets = [];
            let timesheetBookedBasedTasks = [];

            const approvedTasks = <KloEntitySet<d_o2c_timesheet_task>>await this.transaction.getExecutedQuery('q_approved_tasktimesheet', {
                loadAll: true,
                project_id: project.project_id
            });


            approvedSubmitIDs = approvedTasks.map(task => task.submit_id);

            // If there are approved submit IDs, get approved timesheets
            // This may throw error of large URI
            if (approvedSubmitIDs.length > 0) {
                debugger;
                approvedTimesheets = ts_header.filter(item => approvedSubmitIDs.includes(item.submit_id));
                // approvedTimesheets = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {
                //     loadAll: true,
                //     'submit_id': approvedSubmitIDs,
                //     'over_all_status': "Approved"
                // });

                const timesheetApprovedSubmitIDs = approvedTimesheets.map(sheet => sheet.submit_id);
                const headerApprovedTask = approvedTasks.filter(item => timesheetApprovedSubmitIDs.includes(item.submit_id));
                approvedTaskIDs = new Set(headerApprovedTask.map(task => task.task_id));
            }

            // If there are approved task IDs, process monthly planning
            // This may throw error of large URI
            if (approvedTaskIDs.size > 0) {
                timesheetBookedBasedTasks = ts_time_booking.filter(item => approvedTaskIDs.has(item.task_id))
                // timesheetBookedBasedTasks = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', {
                //     loadAll: true,
                //     'task_id': approvedTaskIDs
                // });
            }

            let all_consumed_pd_prj = [];

            let prj_start_date = project.r_project_so[0].project_start_date;
            while (prj_start_date <= project.r_project_so[0].project_end_date) {
                all_consumed_pd_prj.push(await this.addConsumedEffort(prj_start_date.getMonth(), prj_start_date.getFullYear(), approvedTimesheets, timesheetBookedBasedTasks));
                prj_start_date.setMonth(prj_start_date.getMonth() + 1); // Increment by one month
            }

            let monthwise_consumed_pd = [];
            let total_consumed_pd = 0;
            let before_fy_pds = 0;
            let after_fy_pds = 0;
            for (let i = 0; i < all_consumed_pd_prj.length; i++) {
                if ((all_consumed_pd_prj[i].year > start_year || (all_consumed_pd_prj[i].year === start_year && all_consumed_pd_prj[i].month >= start_month))
                    && (all_consumed_pd_prj[i].year < end_year || (all_consumed_pd_prj[i].year === end_year && all_consumed_pd_prj[i].month <= end_month))) {
                    monthwise_consumed_pd.push(all_consumed_pd_prj[i].totalConsumedPDs);
                    total_consumed_pd += all_consumed_pd_prj[i].totalConsumedPDs;
                } else if (all_consumed_pd_prj[i].year < start_year || (all_consumed_pd_prj[i].year === start_year && all_consumed_pd_prj[i].month < start_month)) {
                    before_fy_pds += all_consumed_pd_prj[i].totalConsumedPDs;
                } else if (all_consumed_pd_prj[i].year > end_year || (all_consumed_pd_prj[i].year === end_year && all_consumed_pd_prj[i].month > end_month)) {
                    after_fy_pds += all_consumed_pd_prj[i].totalConsumedPDs;
                }
            }
            // month wise consumption ends.. 

            let prj_json = {
                so_id: project.so_id,
                project_id: project.project_id,
                project_name: project.r_project_so[0].project_name,
                project_start_date: project.r_project_so[0].project_start_date,
                project_end_date: project.r_project_so[0].project_end_date,
                total_project_pds: project.total_project_pds,
                gross_value: ((totalGrossValue * profit.percentage) / 100).toFixed(2),
                cr_rate: ((totalCRValue * profit.percentage) / 100).toFixed(2),
                april: monthwise_consumed_pd[0] ? monthwise_consumed_pd[0] : 0,
                may: monthwise_consumed_pd[1] ? monthwise_consumed_pd[1] : 0,
                june: monthwise_consumed_pd[2] ? monthwise_consumed_pd[2] : 0,
                july: monthwise_consumed_pd[3] ? monthwise_consumed_pd[3] : 0,
                aug: monthwise_consumed_pd[4] ? monthwise_consumed_pd[4] : 0,
                sept: monthwise_consumed_pd[5] ? monthwise_consumed_pd[5] : 0,
                oct: monthwise_consumed_pd[6] ? monthwise_consumed_pd[6] : 0,
                nov: monthwise_consumed_pd[7] ? monthwise_consumed_pd[7] : 0,
                dec: monthwise_consumed_pd[8] ? monthwise_consumed_pd[8] : 0,
                jan: monthwise_consumed_pd[9] ? monthwise_consumed_pd[9] : 0,
                feb: monthwise_consumed_pd[10] ? monthwise_consumed_pd[10] : 0,
                mar: monthwise_consumed_pd[11] ? monthwise_consumed_pd[11] : 0,
                consumed_pd: total_consumed_pd,
                balanced_pd: parseFloat(project.total_project_pds) - total_consumed_pd - before_fy_pds - after_fy_pds,
                b4_fy_pd: before_fy_pds,
                total_consume_pd: total_consumed_pd + before_fy_pds + after_fy_pds,
                after_fy_pd: after_fy_pds
            }
            report_list.push(prj_json);
        }
        await this.tm.getTN("report_other").setData(report_list);
        busyDialog.close();
    }

    // To display the fiscal year in a format... 2024-2025 but didn't work.
    public async fyDisplay(oEvent) {
        let source = oEvent.getSource();
        let fiscalYear;
        if (source) {
            // Extract the year from the selected date
            const selectedYear = new Date(source.mProperties.dateValue).getFullYear();

            // Calculate the fiscal year range
            fiscalYear = `${selectedYear}-${selectedYear + 1}`;
        }
        let c = this.getActiveControlById("fiscal_year","s_prj_search");
        c.setValue(fiscalYear);
    }

    // Download the the result as Excel... Not used the FW download because the result was stored in other type transnode.
    public async onExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Downloading..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let jsonData = [];

        let file_name = "Project SummaryReport_".concat(".xlsx");
        // console.log(file_name);
        for (let project of report_list) {
            jsonData.push({
                'SO ID': project.so_id,
                'Project ID': project.project_id,
                'Project Name': project.project_name,
                'Project Start Date': project.project_start_date,
                'Project End Date': project.project_end_date,
                'Gross Value': project.gross_value,
                'CR Rate': project.cr_rate,
                'Total Budgeted Pd': project.total_project_pds,
                'Consumed Pd before FY': project.b4_fy_pd,
                'Current Consumed Pd': project.consumed_pd,
                'Consumed Pd after FY': project.after_fy_pd,
                'Total Consume Pd': project.total_consume_pd,
                'Balanced Pd': project.balanced_pd,
                'April': project.april,
                'May': project.may,
                'June': project.june,
                'July': project.july,
                'August': project.aug,
                'September': project.sept,
                'October': project.oct,
                'November': project.nov,
                'December': project.dec,
                'January': project.jan,
                'February': project.feb,
                'March': project.mar
            })
        }
        var ws = XLSX.utils.json_to_sheet(jsonData);
        // Set column widths
        ws['!cols'] = Array(24).fill({ width: 20 });

        // Apply styles conditionally to 'Balanced Pd' cells
        const balanceColIndex = 12; // Column index of 'Balanced Pd' (0-based)
        const budgetColIndex = 7; // Column index of 'Total Budgeted Pd' (0-based)
        const dataStartRow = 2; // Data starts from the 2nd row (1-based)

        jsonData.forEach((row, index) => {
            let balancedPd = row['Balanced Pd'];
            let totalBudgetedPd = row['Total Budgeted Pd'];
            let cellAddress = XLSX.utils.encode_cell({ r: index + dataStartRow - 1, c: balanceColIndex });

            if (totalBudgetedPd && balancedPd < 0.2 * totalBudgetedPd) {
                ws[cellAddress].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "FFD580" } // Orange color
                    },
                };
            }
            if(balancedPd < 0){
                // let cellAddress = XLSX.utils.encode_cell({ r: index + dataStartRow - 1, c: balanceColIndex });
                ws[cellAddress].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "FF6666" } // Red color
                    },
                    // font: {
                    //     color: { rgb: "FFFFFF" } // White text for better contrast
                    // }
                };
            }
            if(totalBudgetedPd && balancedPd >= 0.2 * totalBudgetedPd){
                ws[cellAddress].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "32CD32" } // Green color
                    },
                };
            }
        });

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1", "M1", "N1", "O1", "P1", "Q1", "R1", "S1", "T1", "U1", "V1", "W1", "X1", "Y1"];
        headerCells.forEach(cell => {
            ws[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Project Summary Report");
        XLSX.writeFile(wb, file_name, { compression: true });
        busyDialog.close();
    }

}
// AH 6-Jan-2025..2:25 PM 