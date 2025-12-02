import { KloTransaction } from "kloBo/KloTransaction";

export class calendarworkingdays {
    public static async fnGetDateByWorkingDays(txn, Year, Month, noOfWorkingDays) {
        let startDate = new Date(Year, Month, 1);
        let soBusinessArea = sap.ui.getCore().getModel("mPageData").getProperty('/businessAreaId');
        let businessOfficeCal = await txn.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': soBusinessArea });

        let officeCalData = await txn.getExecutedQuery("q_office_cal_data", { loadAll: true, office_calendar_id: businessOfficeCal[0].office_calender });
        let holidayData = await txn.getExecutedQuery('d_o2c_holiday_calendar', { loadAll: true, 'holiday_calender_id': officeCalData[0].holiday_calender_id });

        //Making the Array of Holiday Date
        let holidayDates = [];
        for (let i = 0; i < holidayData.length; i++) {
            holidayDates[i] = holidayData[i].holiday_date;
        }

        //Making the Array of Weekend Day
        const daysNo = [];
        const days = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];

        days.forEach((day, index) => {
            if (officeCalData[0][`${day}_working`] === "0.00") {
                daysNo.push(index + 1);
            }
        });

        //Count of Office weekend and Holiday 
        let getDateByWorkingDays = await this.officeWeekend(startDate, noOfWorkingDays, daysNo, holidayDates);
        // console.log(getDateByWorkingDays);
        return getDateByWorkingDays;


    }
    public static async officeWeekend(startDate, noOfWorkingDays, daysNo, holidayDates) {
        const currentDate = new Date(startDate); // Create a copy of startDate
        let daysAdded = 0;
        while (daysAdded < noOfWorkingDays) {
            // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
            const dayOfWeek = currentDate.getDay() + 1; // Adjust to match daysNo values (1 for Monday, 7 for Sunday)

            //Office weekend count
            if ((!(daysNo.includes(dayOfWeek))) && (!(holidayDates.some(holiday => holiday.getTime() === currentDate.getTime())))) {
                daysAdded++;
            }

            // Move to the next day
            if (daysAdded < noOfWorkingDays)
                currentDate.setDate(currentDate.getDate() + 1);
            else
                currentDate.setDate(currentDate.getDate());

        }
        return currentDate;

    }
    public static async fnGetWorkingDayByRange(controller,soBusinessArea, startDate, EndDate) {

        //let soBusinessArea = sap.ui.getCore().getModel("mPageData").getProperty('/businessAreaId');
        let businessOfficeCal = await controller.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': soBusinessArea });

        let officeCalData = await controller.transaction.getExecutedQuery("q_office_cal_data", { loadAll: true, office_calendar_id: businessOfficeCal[0].office_calender });
        let holidayData = await controller.transaction.getExecutedQuery('d_o2c_holiday_calendar', { loadAll: true, 'holiday_calender_id': officeCalData[0].holiday_calender_id });

        //Making the Array of Holiday Date
        let holidayDates = [];
        for (let i = 0; i < holidayData.length; i++) {
            holidayDates[i] = holidayData[i].holiday_date;
        }

        //Making the Array of Weekend Day
        const daysNo = [];
        const days = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];

        days.forEach((day, index) => {
            if (officeCalData[0][`${day}_working`] === "0.00") {
                daysNo.push(index + 1);
            }
        });

        //Count of Office weekend and Holiday 
        let getDateByRange = await this.leaveData(startDate, EndDate, daysNo, holidayDates);
        return getDateByRange;


    }
    public static async leaveData(startDate, endDate, daysNo, holidayDates) {
        let workingDate = [];
        try {
            while (startDate <= endDate) {
                const startDateDay = startDate.getDay() + 1;
                //const sDate= new Date(startDate);
                if ((!(daysNo.includes(startDateDay))) &&(!(holidayDates.some(holiday => holiday.getTime() === startDate.getTime()))))
                {
                    workingDate.push(new Date(startDate));
                }
                startDate.setDate(startDate.getDate() + 1);
            }
        }
        catch (e) {
            console.log("Error"+ e)
        }
        return workingDate;
    }


}
//19Nov 2024 2PM AF