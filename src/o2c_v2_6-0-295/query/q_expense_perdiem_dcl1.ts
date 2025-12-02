import { q_expense_perdiem_dcl1 as q_expense_perdiem_dcl1_gen } from "o2c_v2/query_gen/q_expense_perdiem_dcl1";
export class q_expense_perdiem_dcl1 extends q_expense_perdiem_dcl1_gen {
  public async perdiem_list_caller(oEvent) {
    let instance = oEvent.getObject(); //it will give you the instance of the query for which callback is created
    instance.setLoadAll(true);
    let txn = oEvent.getTxn();
    let qInstance = await txn.getQueryP("q_expense_perdiem_dcl"); //this way you can get instance of any query
    // await qInstance.setLoadAll(true);
    // await qInstance.setExpandAll("r_perdiem_local");
    // await qInstance.setExpandAll("r_perdiem_travel");
    // await qInstance.setExpandAll(["r_perdiem_local", "r_perdiem_travel"]);
    const from_date = instance.from_date;
    const to_date = instance.to_date;
    qInstance.setProperty("from_date", instance.from_date);
    qInstance.setProperty("to_date", instance.to_date);
    qInstance.setProperty("employee_id", instance.employee);
    qInstance.setProperty("expense_status", instance.status);
    let leaveinstance = await txn.getQueryP("q_travel_vacation");
    await leaveinstance.setLoadAll(true);
    leaveinstance.setProperty("starting_date", instance.from_date);
    leaveinstance.setProperty("ending_date", instance.to_date);
    const leaveData = await leaveinstance.executeP();
    const Alldata = await qInstance.executeP();
    for (let i = 0; i < (await Alldata).length; i++) {
      if (Alldata[i].from_date <= from_date.getTime()) {
        Alldata[i].transient_start_date = from_date.getTime();
      } else {
        Alldata[i].transient_start_date = Alldata[i].from_date;
      }
      if (Alldata[i].to_date >= to_date.getTime()) {
        Alldata[i].transient_end_date = to_date.getTime();
      } else {
        Alldata[i].transient_end_date = Alldata[i].to_date;
      }
      if (Alldata[i].r_perdiem_travel[0].trip_type === "Local" && Alldata[i].r_perdiem_local && Alldata[i].r_perdiem_local?.length > 0) {
        Alldata[i].transient_no_of_days = await this.localPerdiemEligibleDays(
          Alldata[i].transient_start_date,
          Alldata[i].transient_end_date,
          Alldata[i].from_date,
          Alldata[i].to_date,
          Alldata[i].r_perdiem_local
        );
        Alldata[i].transient_total_amount =
          Alldata[i].transient_no_of_days * Alldata[i].per_diem;
      }

      else {
        Alldata[i].transient_no_of_days = this.getEligiblePerDiemDays(
          Alldata[i].employee,
          Alldata[i].transient_start_date,
          Alldata[i].transient_end_date,
          leaveData
        );
        Alldata[i].transient_total_amount =
          Alldata[i].transient_no_of_days * Alldata[i].per_diem;
      }
    }
    let results = await qInstance.getResults();
    await instance.setResults(results);
    instance.skipDBQueryExecution();
  }
  public getEligiblePerDiemDays(
    employee_id,
    transient_start_date,
    transient_end_date,
    leaveData
  ) {
    const start = new Date(transient_start_date);
    const end = new Date(transient_end_date);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

    // Filter leaves for this employee
    const employeeLeaves =
      leaveData?.filter((leave) => leave.employee_id === employee_id) || [];

    // If no leaves for this employee, return totalDays
    if (employeeLeaves.length === 0) {
      return totalDays;
    }

    // Otherwise, calculate overlapping leave days
    let leaveOverlapCount = 0;

    employeeLeaves.forEach((leave) => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);

      if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) return;

      const overlapStart = leaveStart > start ? leaveStart : start;
      const overlapEnd = leaveEnd < end ? leaveEnd : end;

      if (overlapStart <= overlapEnd) {
        const overlapDays =
          Math.floor(
            (overlapEnd.getTime() - overlapStart.getTime()) / MS_PER_DAY
          ) + 1;
        leaveOverlapCount += overlapDays;
      }
    });

    return totalDays - leaveOverlapCount;
  }
  public async localPerdiemEligibleDays(
    transient_start_date,
    transient_end_date,
    pd_start_date,
    pd_end_date,
    localdays) {
    if (!Array.isArray(localdays) || localdays.length === 0) return 0;

    let count = 0;

    for (const row of localdays) {
      if (!row.claim) continue; // must be selected

      const day = new Date(row.per_date).getTime();
      if (isNaN(day)) continue;

      // Check if it is within the selected date range
      if (day >= transient_start_date.getTime() && day <= transient_end_date.getTime() && day >= pd_start_date.getTime() && day <= pd_end_date.getTime()) {
        count++;
      }
    }

    return count;
  }
}
