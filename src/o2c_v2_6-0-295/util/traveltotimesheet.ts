import { KloTransaction } from "kloBo/KloTransaction";

export class traveltotimesheet {
    public static async fnTravelingDays(txn,startingday,endingday,employeeid){
        let TravelList = await txn.getExecutedQuery('q_travel_timesheet_days',{starting_date:startingday,ending_date:endingday,employeei:employeeid,loadAll: true});
        const travelDates = [];
        const filterredtravelDates =await this.addOverlapDates(travelDates, startingday, endingday, TravelList);
        return filterredtravelDates
    }
    public static async addOverlapDates(datesArray, start1, end1, travels) {
        const startDate1 = new Date(start1);
        const endDate1 = new Date(end1);
    
        for (const travel of travels) {
            const startDate2 = new Date(travel.travel_start_date);
            const endDate2 = travel.travel_end_date ? new Date(travel.travel_end_date) : endDate1; // Default to primary end date if travel end is missing
    
            // Find overlap period
            const overlapStart = new Date(Math.max(startDate1.getTime(), startDate2.getTime()));
            const overlapEnd = new Date(Math.min(endDate1.getTime(), endDate2.getTime()));
    
            // Add overlapping dates to the array
            if (overlapEnd >= overlapStart) {
                let currentDate = overlapStart;
                while (currentDate <= overlapEnd) {
                    const formattedDate = new Date(currentDate);
                    if (!datesArray.some(date => date.getTime() === formattedDate.getTime())) {
                        datesArray.push(formattedDate);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        }
        return datesArray
    }
}