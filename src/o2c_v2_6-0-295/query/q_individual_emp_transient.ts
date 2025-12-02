import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_individual_emp_transient as q_individual_emp_transient_gen } from "o2c_v2/query_gen/q_individual_emp_transient"
import { paFinancialYear } from "o2c_v2/util/paFinancialYear";
export class q_individual_emp_transient extends q_individual_emp_transient_gen {
    public individualEmployee = [];
    /* old table code


  public async individualEmployeePA(oEvent) {
      let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
      instance.setLoadAll(true);
      let txn = oEvent.getTxn();
      let qInstance = await txn.getQueryP('q_indvidual_employee_page');//this way you can get instance of any query

      //set 
      qInstance.setProperty("company_code", oEvent.object.company_code);
      qInstance.setProperty("business_area", oEvent.object.business_area);
      qInstance.setProperty("profit_center", oEvent.object.profit_center);
      qInstance.setProperty("fyear", oEvent.object.fyear);
      if(((await this.txn.get$Role()).role_id)=="FINANCE"){
          qInstance.setProperty("status","Accepted");
          qInstance.setProperty("lmi",oEvent.object.lmi);
      }
      else{
      qInstance.setProperty("lmi",oEvent.object.lmi);
      }
      //set End
      await qInstance.setLoadAll(true);
      let es = await qInstance.executeP();//execute here

      if (es.length) {
          await this.getIndividualEmployeePAData(es, instance,oEvent.object.lmi);
      }
      instance.skipDBQueryExecution();

  }

  public async getIndividualEmployeePAData(a, instance,lm) {
      let allEmployeeData = await this.txn.getExecutedQuery('d_o2c_employee', { loadAll: true, expandAll: "r_emp_history" });
      //const cycleEmployee = a[0].r_pa_cycle_emp_planning;
      let cycleEmployee;
      if(((await this.txn.get$Role()).role_id)=="FINANCE"){
          cycleEmployee = a[0].r_pa_cycle_emp_planning.filter((item)=>item.line_manager_id==lm || item.s_status=="Accepted");
      }
      else{
        cycleEmployee = a[0].r_pa_cycle_emp_planning.filter((item)=>item.line_manager_id==lm);
      }
      //const cycleEmployee = a[0].r_pa_cycle_emp_planning.filter((item)=>item.line_manager_id==lm);---old code
      const cycleCategory = a[0].r_pa_cycle_catgry.r_pa_catgry_planning_hdr_itm;
      let t = 1;
      // Iterate over each cycle
      for (let i = 0; i < cycleEmployee.length; i++) {
          let totalCost, ctc, fixed, PBonus, RBonus, CBonus;
          let filterPBonus = cycleEmployee[i].r_emp_pa_planning_hdr_item.filter((item) => item.benefit_id == "B11");
          let filterRBonus = cycleEmployee[i].r_emp_pa_planning_hdr_item.filter((item) => item.benefit_id == "B12");
          let filterCBonus = cycleEmployee[i].r_emp_pa_planning_hdr_item.filter((item) => item.benefit_id == "B13");
          let employeeData = allEmployeeData.filter((item) => item.employee_id == cycleEmployee[i].employee_id)
          let maventicExperience = await this.experienceInYear(new Date(), employeeData[0].joining_date);
          let previousYearExperience = 0;
          for (let k = 0; k < employeeData[0].r_emp_history.length; k++) {
              let prevExp = await this.experienceInYear(employeeData[0].r_emp_history[k].to_date,employeeData[0].r_emp_history[k].from_date);
              previousYearExperience += parseFloat(prevExp);
          }
          let totalExperience = await this.sumOfYear(previousYearExperience, parseFloat(maventicExperience));
          let paExperience = await this.experienceInYear(cycleEmployee[i].from_date, employeeData[0].confirmation_date);

          for (let j = 0; j < 3; j++) {
              let stageData = ["Current", "Preferred", "Proposed"];
              if (stageData[j] == "Current") {
                  totalCost = cycleEmployee[i].total_cost_prev;
                  ctc = cycleEmployee[i].ctc_prev;
                  fixed = cycleEmployee[i].fixed_prev;
                  PBonus = filterPBonus[0].disbursed_amount_prev;
                  RBonus = filterRBonus[0].disbursed_amount_prev;
                  CBonus = filterCBonus[0].disbursed_amount_prev;
              }
              else if (stageData[j] == "Preferred") {
                  let filterCategoryItm = cycleCategory.filter((item) => item.exp == totalExperience && item.category_id == cycleEmployee[i].pa_category_id)
                  let filterCategoryPerformanceBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B11")
                  let filterCategoryRetentionBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B12")
                  let filterCategoryCompanyBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B13")
                  totalCost = filterCategoryItm[0].max_total_value;
                  ctc = filterCategoryItm[0].ctc_value;
                  fixed = filterCategoryItm[0].fixed_value;
                  PBonus = filterCategoryPerformanceBenefit[0].bonus_amount;
                  RBonus = filterCategoryRetentionBenefit[0].bonus_amount;
                  CBonus = filterCategoryCompanyBenefit[0].bonus_amount;
              }
              else {
                  totalCost = cycleEmployee[i].total_cost_new;
                  ctc = cycleEmployee[i].ctc_new;
                  fixed = cycleEmployee[i].fixed_new;
                  PBonus = filterPBonus[0].planned_amount_new;
                  RBonus = filterRBonus[0].planned_amount_new;
                  CBonus = filterCBonus[0].planned_amount_new;
              }
              let data = {
                  company_code: a[0].company_code,
                  business_area: a[0].business_area,
                  profit_center: a[0].profit_center,
                  indvidual_emp_guid: t,//need to change
                  serial_no: i + 1,
                  hdr_pa_req_id: cycleEmployee[i].hdr_pa_req_id,
                  pa_cycle_id: cycleEmployee[i].pa_cycle_id,
                  s_status: cycleEmployee[i].s_status,
                  employee_id: cycleEmployee[i].employee_id,
                  line_manager: cycleEmployee[i].line_manager_id,
                  employee_designation_prev: cycleEmployee[i].employee_designation_prev,
                  employee_name: employeeData[0].full_name,
                  stage: stageData[j],
                  date_of_confirmation: employeeData[0].confirmation_date?.getTime(),
                  total_cost: totalCost,//divided into 3 row
                  ctc: ctc,//divided into 3 row
                  fixed: fixed,//divided into 3 row
                  category: cycleEmployee[i].pa_category_id,
                  pa_month: cycleEmployee[i].pa_month,
                  pa_effective_from_date: cycleEmployee[i].from_date?.getTime(),
                  pa_effective_to_date: cycleEmployee[i].to_date?.getTime(),
                  total_experience: totalExperience,
                  previous_experience: previousYearExperience,
                  maventic_experience: maventicExperience,
                  //pa_experience: paExperience + previousYearExperience,
                  //delta_month: cycleEmployee[i].deltamonth,
                  //last_hike_perc: ((cycleEmployee[i].total_cost_new - cycleEmployee[i].total_cost_prev) / cycleEmployee[i].total_cost_prev) * 100,
                  last_pa_date: cycleEmployee[i].prev_pa_date?.getTime(),
                  new_pa_date: cycleEmployee[i].from_date?.getTime(),
                  to_be_designation: cycleEmployee[i].employee_designation_new,
                  warning_flag: cycleEmployee[i].warning_flag,
                  remarks: cycleEmployee[i].remarks,
                  performance_bonus: PBonus,
                  pb_start_date: new Date(),
                  pb_end_date: new Date(),
                  retention_bonus: RBonus,
                  company_bonus: CBonus,
                  approval_cycle: cycleEmployee[i].approval_cycle
              }
              t++;
              // Push the processed data into the categoryData array
              this.individualEmployee.push(data);
          }
      }
      await instance.setResults([]);
      //console.log(await instance.getResults());
      await instance.setResults(this.individualEmployee);
      //console.log(await instance.getResults());
      this.individualEmployee=[];
  }*/

    //New Code

    public async individualEmployeePA(oEvent) {
        let instance = oEvent.getObject();//it will give you the instance of the query for which callback is created
        instance.setLoadAll(true);
        let txn = oEvent.getTxn();
        let qInstance = await txn.getQueryP('q_pa_individual_employee_scn');//this way you can get instance of any query

        //set 
        qInstance.setProperty("company_code", oEvent.object.company_code);
        qInstance.setProperty("business_area", oEvent.object.business_area);
        qInstance.setProperty("profit_center", oEvent.object.profit_center);
        qInstance.setProperty("fyear", oEvent.object.fyear);
        if (((await this.txn.get$Role()).role_id) == "FINANCE") {
            qInstance.setProperty("status", "Accepted");
            qInstance.setProperty("lmi", oEvent.object.lmi);
        }
        else {
            qInstance.setProperty("lmi", oEvent.object.lmi);
        }
        //set End
        await qInstance.setLoadAll(true);
        let es = await qInstance.executeP();//execute here

        if (es.length) {
            await this.getIndividualEmployeePAData(es, instance, oEvent.object.lmi, oEvent.object.fyear,oEvent.object.paStatus);
        }
        instance.skipDBQueryExecution();

    }

    public async getIndividualEmployeePAData(a, instance, lm, fiscal,paStatus) {
        const inputYear = await paFinancialYear.getFinancialYearDates(fiscal);
        let allEmployeeData = await this.txn.getExecutedQuery('d_o2c_employee', { loadAll: true, expandAll: "r_emp_history" });
        let paCycleIndEmployee = a[0].r_pa_emp_planning_hdr;
        if (paStatus != "ALL"){
            paCycleIndEmployee=paCycleIndEmployee.filter((item)=>item.s_status==paStatus)
        }
        let cycleEmployee;
        if (((await this.txn.get$Role()).role_id) == "FINANCE") {
            // cycleEmployee = a[0].r_pa_emp_planning_hdr.filter((item) => item.line_manager_id == lm || item.s_status == "Accepted");
            cycleEmployee = paCycleIndEmployee.filter((item) => item.line_manager_id == lm || item.s_status == "Accepted");
        }
        else {
            //cycleEmployee = a[0].r_pa_emp_planning_hdr.filter((item) => item.line_manager_id == lm);
            cycleEmployee = paCycleIndEmployee.filter((item) => item.line_manager_id == lm);
        }
        const cycleCategory = a[0].r_pa_cycle_catgry.r_pa_catgry_planning_hdr_itm;
        let t = 1;
        // Iterate over each cycle
        for (let i = 0; i < cycleEmployee.length; i++) {
            let totalCost, ctc, fixed, PBonus, RBonus, CBonus;
            let pb_start_date, pb_end_date, rb_start_date, rb_end_date, cb_start_date, cb_end_date;

            let filterPBonus = cycleEmployee[i].r_pa_emp_ind_hdr_itm.filter((item) => item.benefit_id == "B11");
            let filterRBonus = cycleEmployee[i].r_pa_emp_ind_hdr_itm.filter((item) => item.benefit_id == "B12");
            let filterCBonus = cycleEmployee[i].r_pa_emp_ind_hdr_itm.filter((item) => item.benefit_id == "B13");
            let employeeData = allEmployeeData.filter((item) => item.employee_id == cycleEmployee[i].employee_id)
            let maventicExperience = await this.experienceInYear(new Date(), employeeData[0].joining_date);
            let previousYearExperience = 0;
            for (let k = 0; k < employeeData[0].r_emp_history.length; k++) {
                let prevExp = await this.experienceInYear(employeeData[0].r_emp_history[k].to_date, employeeData[0].r_emp_history[k].from_date);
                previousYearExperience += parseFloat(prevExp);
            }
            // Round to 1 decimal place
            previousYearExperience = parseFloat(previousYearExperience.toFixed(1));
            let totalExperience = await this.sumOfYear(previousYearExperience, parseFloat(maventicExperience));
            let paExperience = await this.experienceInYear(cycleEmployee[i].from_date, employeeData[0].confirmation_date);

            //Bonus start date/end date
            for (let j = 0; j < 3; j++) {
                // let pb_start_date = filterPBonus[0].start_date, pb_end_date = filterPBonus[0].end_date, rb_start_date = filterRBonus[0].start_date, rb_end_date = filterRBonus[0].end_date, cb_start_date = filterCBonus[0].start_date, cb_end_date = filterCBonus[0].end_date;
                let stageData = ["Current", "Preferred", "Proposed"];
                if (stageData[j] == "Current") {
                    totalCost = cycleEmployee[i].total_cost_prev;
                    ctc = cycleEmployee[i].ctc_prev;
                    fixed = cycleEmployee[i].fixed_prev;
                    PBonus = filterPBonus[0].disbursed_amount_prev;
                    RBonus = filterRBonus[0].disbursed_amount_prev;
                    CBonus = filterCBonus[0].disbursed_amount_prev;
                    pb_start_date = filterPBonus[0].start_date_prev
                    pb_end_date = filterPBonus[0].end_date_prev
                    rb_start_date = filterRBonus[0].start_date_prev
                    rb_end_date = filterRBonus[0].end_date_prev
                    cb_start_date = filterCBonus[0].start_date_prev
                    cb_end_date = filterCBonus[0].end_date_prev
                }
                else if (stageData[j] == "Preferred") {
                    let filterCategoryItm = cycleCategory.filter((item) => item.exp == Math.floor(cycleEmployee[i].pa_exp) && item.category_id == cycleEmployee[i].pa_category_id /*&& item.work_location==employeeData[0].work_mode*/)
                    let filterCategoryPerformanceBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B11")
                    let filterCategoryRetentionBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B12")
                    let filterCategoryCompanyBenefit = filterCategoryItm[0].r_category_benefit_detail.filter((item) => item.benefit_id == "B13")
                    totalCost = filterCategoryItm[0].max_total_value;
                    ctc = filterCategoryItm[0].ctc_value;
                    fixed = filterCategoryItm[0].fixed_value;
                    PBonus = filterCategoryPerformanceBenefit[0].bonus_amount;
                    RBonus = filterCategoryRetentionBenefit[0].bonus_amount;
                    CBonus = filterCategoryCompanyBenefit[0].bonus_amount;
                    pb_start_date = filterCategoryPerformanceBenefit[0].start_date;
                    pb_end_date = filterCategoryPerformanceBenefit[0].end_date;
                    rb_start_date = filterCategoryRetentionBenefit[0].start_date;
                    rb_end_date = filterCategoryRetentionBenefit[0].end_date;
                    cb_start_date = filterCategoryCompanyBenefit[0].start_date;
                    cb_end_date = filterCategoryCompanyBenefit[0].end_date;
                }
                else {
                    totalCost = cycleEmployee[i].total_cost_new;
                    ctc = cycleEmployee[i].ctc_new;
                    fixed = cycleEmployee[i].fixed_new;
                    PBonus = filterPBonus[0].planned_amount_new;
                    CBonus = filterCBonus[0].planned_amount_new;
                    pb_start_date = filterPBonus[0].start_date;
                    pb_end_date = filterPBonus[0].end_date;
                    cb_start_date = filterCBonus[0].start_date;
                    cb_end_date = filterCBonus[0].end_date;
                    if (filterRBonus.length > 0) {
                        const bonus = filterRBonus[0];

                        // Planned amount
                        if (bonus.planned_amount_new > 0) {
                            RBonus = bonus.planned_amount_new;
                        } else if (!(bonus.start_date_prev >= inputYear.startDate && bonus.end_date_prev <= inputYear.endDate)) {
                            RBonus = 0;
                        }
                        else {
                            RBonus = bonus.planned_amount_prev;
                        }

                        // rb_end_date
                        if (bonus.end_date) {
                            rb_end_date = bonus.end_date;
                        } else if (!(bonus.start_date_prev >= inputYear.startDate && bonus.end_date_prev <= inputYear.endDate)) {
                            rb_end_date = "";
                        }
                        else {
                            rb_end_date = bonus.end_date_prev;
                        }

                        // rb_start_date
                        if (bonus.start_date) {
                            rb_start_date = bonus.start_date;
                        } else if (!(bonus.start_date_prev >= inputYear.startDate && bonus.end_date_prev <= inputYear.endDate)) {
                            rb_start_date = "";
                        }
                        else {
                            rb_start_date = bonus.start_date_prev;
                        }
                    }
                }
                let bArea = cycleEmployee[0].r_employee_master.r_employee_org.find((e) => e.is_primary == true);
                let data = {
                    company_code: a[0].company_code,
                    // business_area: a[0].business_area,
                    business_area: bArea.business_area,
                    work_mode: cycleEmployee[0].r_employee_master.work_mode,
                    employee_type: cycleEmployee[0].employee_type,
                    profit_center: a[0].profit_center,
                    indvidual_emp_guid: t,//need to change
                    serial_no: i + 1,
                    hdr_pa_req_id: cycleEmployee[i].hdr_pa_req_id,
                    pa_cycle_id: cycleEmployee[i].pa_cycle_id,
                    s_status: cycleEmployee[i].s_status,
                    employee_id: cycleEmployee[i].employee_id,
                    line_manager: cycleEmployee[i].line_manager_id,
                    employee_designation_prev: cycleEmployee[i].employee_designation_prev,
                    employee_name: employeeData[0].full_name,
                    stage: stageData[j],
                    date_of_confirmation: employeeData[0].confirmation_date?.getTime(),
                    total_cost: totalCost,//divided into 3 row
                    ctc: ctc,//divided into 3 row
                    fixed: fixed,//divided into 3 row
                    category: cycleEmployee[i].pa_category_id,
                    pa_month: cycleEmployee[i].pa_month,
                    pa_effective_from_date: cycleEmployee[i].from_date?.getTime(),
                    pa_effective_to_date: cycleEmployee[i].to_date?.getTime(),
                    total_experience: totalExperience,
                    previous_experience: previousYearExperience,
                    maventic_experience: maventicExperience,
                    pa_experience: cycleEmployee[i].pa_exp,
                    delta: cycleEmployee[i].delta,
                    //last_hike_perc: ((cycleEmployee[i].total_cost_new - cycleEmployee[i].total_cost_prev) / cycleEmployee[i].total_cost_prev) * 100,
                    last_pa_date: cycleEmployee[i].prev_pa_date?.getTime(),
                    new_pa_date: cycleEmployee[i].from_date?.getTime(),
                    to_be_designation: cycleEmployee[i].employee_designation_new,
                    warning_flag: cycleEmployee[i].warning_flag,
                    remarks: cycleEmployee[i].remark,
                    performance_bonus: PBonus,
                    pb_start_date: pb_start_date,
                    pb_end_date: pb_end_date,
                    rb_start_date: rb_start_date,
                    rb_end_date: rb_end_date,
                    cb_start_date: cb_start_date,
                    cb_end_date: cb_end_date,
                    retention_bonus: RBonus,
                    company_bonus: CBonus,
                    approval_cycle: cycleEmployee[i].approval_cycle
                }
                t++;
                // Push the processed data into the categoryData array
                this.individualEmployee.push(data);

            }
        }
        await instance.setResults([]);
        //console.log(await instance.getResults());
        await instance.setResults(this.individualEmployee);
        //console.log(await instance.getResults());
        this.individualEmployee = [];
    }
    public async generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    public experienceInYear(fromDate, toDate) {
        // Calculate total difference in months
        let totalMonths = (fromDate.getFullYear() - toDate.getFullYear()) * 12;
        totalMonths += fromDate.getMonth() - toDate.getMonth();

        // Adjust for day difference
        if (fromDate.getDate() < toDate.getDate()) {
            totalMonths -= 1;
        }
        // Convert months to years with decimal
        const yearIndecimal = (totalMonths / 12).toFixed(1); // keep one decimal place
        return yearIndecimal;
    }
    public async sumOfYear(year1, year2) {
        // Extract years and months manually
        let prevYears = Math.floor(year1);
        let mavYears = Math.floor(year2);
        // Extract months using string split
        let prevMonths = parseInt(year1.toString().split('.')[1] || '0');
        let mavMonths = parseInt(year2.toString().split('.')[1] || '0');

        // Total months
        let totalMonths = (prevYears + mavYears) * 12 + prevMonths + mavMonths;

        // Convert to years and months
        let years = Math.floor(totalMonths / 12);
        let months = totalMonths % 12;

        // Proper output
        let yearSum = parseFloat(`${years}.${months}`);
        return yearSum;
    }
}
//22/06/25 AF