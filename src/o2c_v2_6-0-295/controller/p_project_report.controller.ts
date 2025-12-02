import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_project_report")
export default class p_project_report extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public datecheck;
    public emporglist;
    public async onPageEnter() {
        let loginid = (await this.transaction.get$User()).login_id;
        let roleid = (await this.transaction.get$Role()).role_id;
        await this.tm.getTN("roler").setData({});
        await this.tm.getTN("roler").setProperty('roler', roleid);

        this.emporglist = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': loginid, 'is_primary': true, loadAll: true });
        await this.tm.getTN("team_head").setData({});
		await this.tm.getTN("team_head").setData({ profit: this.emporglist[0].profit_centre });
        await this.tm.getTN("o2c_timesheet_time_booking_search").setProperty('company_code', this.emporglist[0].company_code);
        if (roleid == "TEAM HEAD" || roleid == "TEAM_HEAD" || roleid == "MANAGER")
            await this.tm.getTN("o2c_timesheet_time_booking_search").setProperty('profit_centre', this.emporglist[0].profit_centre);
        if (roleid == "MANAGER")
            await await this.tm.getTN("o2c_timesheet_time_booking_search").setProperty('line_manager', loginid);

        const currentDate = new Date();

        // Get the first date of the current month
        const firstDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Get the last date of the current month
        const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        await this.tm.getTN("o2c_timesheet_time_booking_search").setProperty('start_hour', firstDate);
        await this.tm.getTN("o2c_timesheet_time_booking_search").setProperty('end_hour', lastDate);

        this.tm.getTN("o2c_timesheet_time_booking_search").getData().setLoadAll(true);
        // this.tm.getTN("o2c_timesheet_time_booking_search").getData().setExpandAll("r_booking_to_task_tr");
        await this.tm.getTN("o2c_timesheet_time_booking_search").executeP();
    }
    public async excelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is fetching..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let listData = await this.tm.getTN("o2c_timesheet_time_booking_list").getData();
        let jsonData = [];
        let taskDataMap = new Map();

        // Collect all task IDs that need to be fetched
        let taskIdsToFetch = listData
            .filter(item => !taskDataMap.has(item.task_id))
            .map(item => item.task_id);

        // Fetch data for all unique task IDs concurrently
        let fetchPromises = taskIdsToFetch.map(taskId => {
            let listItem = listData.find(item => item.task_id === taskId);
            return listItem.r_booking_to_task_tr.fetch().then(() => {
                taskDataMap.set(taskId, listItem.r_booking_to_task_tr[0]);
            });
        });

        await Promise.all(fetchPromises);

        // Build the jsonData array using the fetched data
        for (let index = 0; index < listData.length; index++) {
            let taskId = listData[index].task_id;
            let taskData = taskDataMap.get(taskId);

            jsonData.push({
                'Employee Id': taskData?.employee_id,
                'Employee Name': taskData?.employee_name,
                'Week Day': listData[index]?.transient_day,
                'Booking Date': listData[index]?.booking_date,
                'Hours Worked': listData[index]?.hours_worked,
                'Project Name': taskData?.project_name,
                'Project ID': taskData?.project_id,
                'PD': listData[index]?.transient_pd,
                'Task Name': taskData?.task_name,
                'Task ID': listData[index]?.task_id
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
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
        });


        XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet Data");

        // Write workbook to a file
        const filePath = 'timesheet_data.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();
    }
    public async getEmployeeName(mm_id) {
        try {
            const empData = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 'employee_id': mm_id });
            if (empData && empData.length > 0) {
                return empData[0].full_name;
            } else {
                throw new Error('Employee not found');
            }
        } catch (error) {
            throw new Error('Error retrieving employee name: ' + error.message);
        }
    }

    public async excelDownloadMergedWithLeaves(expandedLeaveData) {
        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let listData = await this.tm.getTN("o2c_timesheet_time_booking_list").getData();
        let jsonData = [];
        let taskDataMap = new Map();

        let taskIdsToFetch = listData
            .filter(item => !taskDataMap.has(item.task_id))
            .map(item => item.task_id);

        let fetchPromises = taskIdsToFetch.map(taskId => {
            let listItem = listData.find(item => item.task_id === taskId);
            return listItem.r_booking_to_task_tr.fetch().then(() => {
                taskDataMap.set(taskId, listItem.r_booking_to_task_tr[0]);
            });
        });

        await Promise.all(fetchPromises);

        for (let index = 0; index < listData.length; index++) {
            let taskId = listData[index].task_id;
            let taskData = taskDataMap.get(taskId);

            jsonData.push({
                'Employee Id': taskData?.employee_id,
                'Employee Name': taskData?.employee_name,
                'Week Day': listData[index]?.transient_day,
                'Booking Date': listData[index]?.booking_date,
                'Hours Worked': listData[index]?.hours_worked,
                'Project Name': taskData?.project_name,
                'Project ID': taskData?.project_id,
                'PD': listData[index]?.transient_pd,
                'Task Name': taskData?.task_name,
                'Task ID': listData[index]?.task_id
            });
        }
        
        let mergedData = await this.mergeData(jsonData, expandedLeaveData);
        mergedData = mergedData.filter(record => parseFloat(record['Hours Worked']) !== 0.00);
        const worksheet = XLSX.utils.json_to_sheet(mergedData);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet Data");

        const filePath = 'timesheet_data.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
    }

    public async leaveReport() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Merged Data is fetching..."
        });
        busyDialog.open();
        let start_hour = this.tm.getTN("o2c_timesheet_time_booking_search").getProperty('start_hour');
        let end_hour = this.tm.getTN("o2c_timesheet_time_booking_search").getProperty('end_hour');
        let employee_id = this.tm.getTN("o2c_timesheet_time_booking_search").getProperty('employee_id');
        let leaveData = await this.transaction.getExecutedQuery('q_timesheet_leave', {
            'start_date': start_hour,
            'end_date': end_hour,
            'profit_centre': this.emporglist[0].profit_centre,
            'employee_id': employee_id,
            loadAll: true
        });
        let expandedLeaveData = await this.expandLeaveEntries(leaveData);
        await this.excelDownloadMergedWithLeaves(expandedLeaveData);
        busyDialog.close();
    }

    public getWeekdayName(date: Date): string {
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return weekdays[date.getDay()];
    }

    public async expandLeaveEntries(leaves) {
        let leaveEntriesProcessed = [];
        let employeeNameCache: Map<string, string> = new Map();
    
        const startHourDate = new Date(this.tm.getTN("o2c_timesheet_time_booking_search").getProperty('start_hour'));
        const endHourDate = new Date(this.tm.getTN("o2c_timesheet_time_booking_search").getProperty('end_hour'));
    
        for (const leave of leaves) {
            const leaveStartDate = new Date(leave.start_date);
            const leaveEndDate = new Date(leave.end_date);
    
            const employeeId = leave.employee_id.substring(0, 2).toUpperCase() + leave.employee_id.substring(2);
    
            let employeeName: string;
    
            if (employeeNameCache.has(leave.employee_id)) {
                employeeName = employeeNameCache.get(leave.employee_id)!;
            } else {
                employeeName = await this.getEmployeeName(leave.employee_id);
                employeeNameCache.set(leave.employee_id, employeeName);
            }
    
            const actualStartDate = new Date(Math.max(leaveStartDate.getTime(), startHourDate.getTime()));
            const actualEndDate = new Date(Math.min(leaveEndDate.getTime(), endHourDate.getTime()));
    
            for (let d = new Date(actualStartDate); d <= actualEndDate; d.setDate(d.getDate() + 1)) {
                if (d.getDay() !== 0 && d.getDay() !== 6) {
                    let hoursWorked = '8.00';
                    let pd = 1;
    
                    if (leaveStartDate.getTime() === leaveEndDate.getTime() && leave.half_day_startdate && leave.half_day_enddate) {
                        hoursWorked = '8.00';
                        pd = 1;
                    } else if (leave.half_day_startdate && d.toDateString() === leaveStartDate.toDateString()) {
                        hoursWorked = '4.00';
                        pd = 0.5;
                    } else if (leave.half_day_enddate && d.toDateString() === leaveEndDate.toDateString()) {
                        hoursWorked = '4.00';
                        pd = 0.5
                    }
    
                    leaveEntriesProcessed.push({
                        'Employee Id': employeeId,
                        'Employee Name': employeeName,
                        'Week Day': this.getWeekdayName(d),
                        'Booking Date': new Date(d),
                        'Hours Worked': hoursWorked,
                        'Project Name': "Leave",
                        'Project ID': "Leave",
                        'PD': pd,
                        'Task Name': "Leave",
                        'Task ID': "Leave"
                    });
                }
            }
        }
    
        return leaveEntriesProcessed;
    }
    
    
    
    

    async mergeData(jsonData, leaveEntriesProcessed) {

        const jsonDataCopy = jsonData.map(entry => ({ ...entry }));

        const mergedData = [...jsonDataCopy, ...leaveEntriesProcessed];

        mergedData.sort((a, b) => {
            const dateA = new Date(a['Booking Date']);
            const dateB = new Date(b['Booking Date']);

            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });

        mergedData.sort((a, b) => {
            const empIdA = parseInt(a['Employee Id'].substring(2));
            const empIdB = parseInt(b['Employee Id'].substring(2));

            return empIdA - empIdB;
        });

        return mergedData;
    }










}