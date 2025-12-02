import { KloEntitySet } from 'kloBo_6-0/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_so_milestone } from 'o2c_v2/entity_gen/d_o2c_so_milestone';
import { d_o2c_so_schedule } from 'o2c_v2/entity_gen/d_o2c_so_schedule';
declare let KloUI5: any;
var monthsData;
@KloUI5("o2c_v2.controller.p_so_target")
export default class p_so_target extends KloController {
  public onInit() {
  }
  public onBeforeRendering() {
  }
  public onAfterRendering() {
  }
  public onExit() {
  }
  public array_list = new Set();
  public async onPageEnter() {
    let login_id = (await this.transaction.get$User()).login_id;
    let emp_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': login_id, is_primary: true, loadAll: true });

    this.tm.getTN("grid_info_other").setData({});
    this.tm.getTN("delivery_info_other").setData({});
    this.tm.getTN("targe_type_other").setData({});
    monthsData = [
      { key: "Jan", month: "January" },
      { key: "Feb", month: "February" },
      { key: "Mar", month: "March" },
      { key: "Apr", month: "April" },
      { key: "May", month: "May" },
      { key: "Jun", month: "June" },
      { key: "Jul", month: "July" },
      { key: "Aug", month: "August" },
      { key: "Sep", month: "September" },
      { key: "Oct", month: "October" },
      { key: "Nov", month: "November" },
      { key: "Dec", month: "December" }
    ];

    await this.tm.getTN("month_combobox_data").setData(monthsData);
    await this.tm.getTN("filter_search").setProperty('company_code', emp_org[0].company_code);
  }
  // Function to calculate monthly sums
  public async calculateMonthlySums(data, amountField) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthlySums = {};
    monthNames.forEach(monthName => {
      monthlySums[monthName] = 0;
    });

    // Loop through each data object
    data.forEach(item => {
      // Determine the date field to use
      const dateString = item.actual_date || item.project_start_date || item.milestone_date;
      if (dateString) {
        const date = new Date(dateString);
        const monthIndex = date.getMonth();

        // Add amount to corresponding month's sum
        if (!isNaN(monthIndex)) {
          const monthName = monthNames[monthIndex];
          monthlySums[monthName] += parseFloat(item[amountField]);
        }
      }
    });

    return monthlySums;
  }

  public aggregateMonthlySums(sums1, sums2, sums3) {
    const aggregatedSums = {};
    for (let month in sums1) {
      aggregatedSums[month] = (sums1[month] || 0) + (sums2[month] || 0) + (sums3[month] || 0);
    }
    for (let month in sums2) {
      if (!(month in aggregatedSums)) {
        aggregatedSums[month] = (sums1[month] || 0) + (sums2[month] || 0) + (sums3[month] || 0);
      }
    }
    for (let month in sums3) {
      if (!(month in aggregatedSums)) {
        aggregatedSums[month] = (sums1[month] || 0) + (sums2[month] || 0) + (sums3[month] || 0);
      }
    }
    return aggregatedSums;
  }


  public async generateChartData(itemTargets, totalAchievement, inrAchivement, otherAchivement, headerTargets) {
    const months = [
      "Apr", "May", "Jun", "Jul", "Aug", "Sep",
      "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
    ];
    const totalTarget = headerTargets[0].overall_target;
    const monthlyData = [];

    // Loop through each month
    months.forEach(month => {
      // Find the corresponding target data for the current month
      const targetData = itemTargets.find(item => item.month === month);

      if (targetData) {
        // Extract target value for the month
        const targetValue = ((totalTarget * targetData.target) / 100);

        // Get total achievement for the month
        const achievement = totalAchievement[month] || 0;
        let inrAchive = inrAchivement[month] || 0;
        let otherAchive = otherAchivement[month] || 0;

        // Create an object with month, target value, and total achievement
        const monthObject = {
          month: month,
          Target: targetValue,
          Total_Achievement: achievement,
          IND_Achivement: inrAchive,
          Abroad_Achivement: otherAchive
        };

        // Push the month object to the result array
        monthlyData.push(monthObject);
      }
    });

    return monthlyData;
  }
  public async calculateMonthlySum(data, amountCallback) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthlySums = {};
    monthNames.forEach(monthName => {
      monthlySums[monthName] = 0;
    });
    for (const item of data) {
      await item.r_so_attachment.fetch();

      const amount = await amountCallback(item);

      const dateString = item.actual_date || item.project_start_date || item.milestone_date;
      if (dateString) {
        const date = new Date(dateString);
        const monthIndex = date.getMonth();

        if (!isNaN(monthIndex)) {
          const monthName = monthNames[monthIndex];
          monthlySums[monthName] += parseFloat(amount);
        }
      }
    }

    return monthlySums;
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
  public async getCustomerName(customer_id) {
    const customerName = await this.transaction.getExecutedQuery('d_o2c_customers', { loadAll: true, 'customer_id': customer_id });
    if (customerName && customerName.length > 0) {
      return customerName[0].customer_name
    }
  }
  // public async onAfterSearch() {
  //   let oComboBox = await this.getActiveControlById('month', 's_filter_selected');
  //   oComboBox.setValue('');

  //   await this.tm.getTN("chart_line_other").setData(null);
  //   await this.tm.getTN("chart_bar_other").setData(null);

  //   let targeType = this.tm.getTN("filter_search").getProperty('target_type');
  //   let selectedYear = this.tm.getTN("filter_search").getProperty('start_date');
  //   let profitCenter = this.tm.getTN("filter_search").getProperty('profit_center');
  //   await this.tm.getTN("targe_type_other").setData(targeType);
  //   let nextYear = selectedYear.getFullYear() + 1;
  //   let targetFY = selectedYear.getFullYear().toString() + "-" + nextYear.toString();
  //   await this.tm.getTN("company_code_other").setData({ target_type: targeType, start_date: targetFY, profir_center: profitCenter });

  //   let headerTargets = await this.transaction.getExecutedQuery('q_so_target', { 'target_type': targeType, "target_fy": targetFY, 'profit_center': profitCenter, loadAll: true });

  //   let monthlyTargets = await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': headerTargets[0].header_id, "target_type": targeType, loadAll: true });
  //   if (targeType == "Delivery") {
  //     // Data from milestone table
  //     let yearMilestone = await this.transaction.getExecutedQuery('q_milestone_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let INRcurrency = await this.transaction.getExecutedQuery('q_milestone_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let otherCurrency = yearMilestone.filter(x => !INRcurrency.includes(x));
  //     // await yearMilestone.setExpandAll('r_milestone_item');
  //     // Data from schedule table
  //     let yearSchedule = await this.transaction.getExecutedQuery('q_schedule_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let inrCurrencySchedule = await this.transaction.getExecutedQuery('q_schedule_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let otherCurrencySchedule = yearSchedule.filter(x => !inrCurrencySchedule.includes(x));
  //     // await yearSchedule.setExpandAll('r_schedule_item');
  //     // Data from Volume table
  //     let yearVolume = await this.transaction.getExecutedQuery('q_volume_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let inrCurrencyVolume = await this.transaction.getExecutedQuery('q_volume_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let otherCurrencyVolume = yearVolume.filter(x => !inrCurrencyVolume.includes(x));
  //     // await yearVolume.setExpandAll('r_volume_item');
  //     // Calculate monthly sums for milestones
  //     let totalAchievements = await this.calculateMonthlySums(yearMilestone, 'amount');
  //     let inrAchivement = await this.calculateMonthlySums(INRcurrency, 'amount');
  //     let otherAchivement = await this.calculateMonthlySums(otherCurrency, 'amount');

  //     // Calculate monthly sums for schedules
  //     let totalScheduleAchievements = await this.calculateMonthlySums(yearSchedule, 'expected_amount');
  //     let inrScheduleAchievement = await this.calculateMonthlySums(inrCurrencySchedule, 'expected_amount');
  //     let otherScheduleAchievement = await this.calculateMonthlySums(otherCurrencySchedule, 'expected_amount');

  //     // Calculate monthly sums for volume
  //     let totalVolumeAchievements = await this.calculateMonthlySums(yearVolume, 'amount');
  //     let inrVolumeAchievement = await this.calculateMonthlySums(inrCurrencyVolume, 'amount');
  //     let otherVolumeAchievement = await this.calculateMonthlySums(otherCurrencyVolume, 'amount');

  //     // Aggregate achievements and schedules
  //     let totalAggregatedAchievements = this.aggregateMonthlySums(totalAchievements, totalScheduleAchievements, totalVolumeAchievements);
  //     let inrAggregatedAchievements = this.aggregateMonthlySums(inrAchivement, inrScheduleAchievement, inrVolumeAchievement);
  //     let otherAggregatedAchievements = this.aggregateMonthlySums(otherAchivement, otherScheduleAchievement, otherVolumeAchievement);

  //     // Generate chart data using the aggregated data
  //     let chartData = await this.generateChartData(monthlyTargets, totalAggregatedAchievements, inrAggregatedAchievements, otherAggregatedAchievements, headerTargets);

  //     await this.tm.getTN("chart_line_other").setData(chartData);
  //     await this.tm.getTN("chart_line_other").refresh();
  //     await this.tm.getTN("target_search").executeP();
  //     let array_list = new Set();
  //     // Fetch and process yearMilestone
  //     await Promise.all(yearMilestone.map(async milestone => {
  //       await milestone.r_milestone_item.fetch();
  //       const mile = milestone.r_milestone_item;
  //       const item = await mile[0].r_item_header.fetch();
  //       const attachment = await item[0].r_so_attachment.fetch();
  //       const profit_center = await item[0].r_profit_center.fetch();
  //       const projectManagerNames = await Promise.all(
  //         profit_center.map(async pc => {
  //           const employeeName = await this.getEmployeeName(pc.project_manager);
  //           return employeeName;
  //         })
  //       );

  //       const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //       let item_list = mile
  //       const invoiceTypes = item_list
  //         .map(detail => detail.invoice_type)
  //         .filter(type => type !== undefined && type !== null)
  //         .join(', ');
  //       const milestoneItemHdr = {
  //         so: item[0].so,
  //         type: item[0].type,
  //         project_name: item[0].project_name,
  //         start_date: item[0].project_start_date,
  //         end_date: item[0].project_end_date,
  //         currency: item[0].currency,
  //         milestone_date: milestone.actual_date,
  //         milestone_amount: milestone.amount,
  //         customer_name: this.getCustomerName(item[0].bill_to_customer),
  //         invoice_type: invoiceTypes,
  //         gross_value: grossValueSum,
  //         project_manager: projectManagerNames.join(', ')
  //       };
  //       array_list.add(milestoneItemHdr);
  //     }));

  //     // Fetch and process yearSchedule
  //     const schedulePromises = yearSchedule.map(async scheduleEntry => {
  //       await scheduleEntry.r_schedule_item.fetch();
  //       const schedule = scheduleEntry.r_schedule_item;
  //       const item = await schedule[0].r_item_header.fetch();
  //       const attachment = await item[0].r_so_attachment.fetch();
  //       const profit_center = await item[0].r_profit_center.fetch();
  //       const projectManagerNames = await Promise.all(
  //         profit_center.map(async pc => {
  //           const employeeName = await this.getEmployeeName(pc.project_manager);
  //           return employeeName;
  //         })
  //       );

  //       const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //       let item_list = schedule
  //       const invoiceTypes = item_list
  //         .map(detail => detail.invoice_type)
  //         .filter(type => type !== undefined && type !== null)
  //         .join(', ');
  //       const scheduleItemHdr = {
  //         so: item[0].so,
  //         type: item[0].type,
  //         project_name: item[0].project_name,
  //         start_date: item[0].project_start_date,
  //         end_date: item[0].project_end_date,
  //         currency: item[0].currency,
  //         milestone_date: scheduleEntry.actual_date,
  //         milestone_amount: scheduleEntry.expected_amount,
  //         customer_name: this.getCustomerName(item[0].bill_to_customer),
  //         invoice_type: invoiceTypes,
  //         gross_value: grossValueSum,
  //         project_manager: projectManagerNames.join(', ')
  //       };
  //       array_list.add(scheduleItemHdr);
  //     });

  //     await Promise.all(schedulePromises);

  //     // Fetch and process yearVolume
  //     await Promise.all(yearVolume.map(async volume => {
  //       await volume.r_volume_item.fetch();
  //       const vol = volume.r_volume_item;
  //       const item = await vol[0].r_item_header.fetch();
  //       const attachment = await item[0].r_so_attachment.fetch();
  //       const profit_center = await item[0].r_profit_center.fetch();
  //       const projectManagerNames = await Promise.all(
  //         profit_center.map(async pc => {
  //           const employeeName = await this.getEmployeeName(pc.project_manager);
  //           return employeeName;
  //         })
  //       );

  //       const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //       let item_list = vol
  //       const invoiceTypes = item_list
  //         .map(detail => detail.invoice_type)
  //         .filter(type => type !== undefined && type !== null)
  //         .join(', ');
  //       const volumeItemHdr = {
  //         so: item[0].so,
  //         type: item[0].type,
  //         project_name: item[0].project_name,
  //         start_date: item[0].project_start_date,
  //         end_date: item[0].project_end_date,
  //         currency: item[0].currency,
  //         milestone_date: volume.milestone_date,
  //         milestone_amount: volume.amount,
  //         customer_name: this.getCustomerName(item[0].bill_to_customer),
  //         invoice_type: invoiceTypes,
  //         gross_value: grossValueSum,
  //         project_manager: projectManagerNames.join(', ')
  //       };
  //       array_list.add(volumeItemHdr);
  //     }));

  //     const delivery_table = Array.from(array_list).sort((a, b) => a.so.localeCompare(b.so));

  //     await this.tm.getTN("delivery_info_other").setData(delivery_table);
  //     await this.tm.getTN("delivery_info_other").refresh();

  //   }
  //   if (targeType == "Sales") {
  //     // Data from SO Header Table
  //     let totalSalesAchieved = await this.transaction.getExecutedQuery('q_sales_achievement', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
  //     let inrSalesAchieved = await this.transaction.getExecutedQuery('q_sales_achievement', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, currency: "INR", loadAll: true });
  //     let otherSalesAchieved = totalSalesAchieved.filter(x => !inrSalesAchieved.includes(x));

  //     let totalSalesMonthlyAchievements = await this.calculateMonthlySum(totalSalesAchieved, sale => {
  //       return sale.r_so_attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //     });

  //     let totalINRSalesMonthlyAchievements = await this.calculateMonthlySum(inrSalesAchieved, sale => {
  //       return sale.r_so_attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //     });

  //     let totalOtherSalesMonthlyAchievements = await this.calculateMonthlySum(otherSalesAchieved, sale => {
  //       return sale.r_so_attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
  //     });


  //     // Generate chart data using the header information
  //     let chartData = await this.generateChartData(monthlyTargets, totalSalesMonthlyAchievements, totalINRSalesMonthlyAchievements, totalOtherSalesMonthlyAchievements, headerTargets);

  //     await this.tm.getTN("chart_line_other").setData(chartData);
  //     await this.tm.getTN("chart_line_other").refresh();

  //     await this.tm.getTN("target_search").executeP();
  //     const gridInfoPromises = totalSalesAchieved.map(async sale => {
  //       await sale.r_profit_center.fetch();
  //       await sale.r_so_attachment.fetch();
  //       await sale.r_item_details.fetch();

  //       const projectManagerNames = await Promise.all(
  //         sale.r_profit_center.map(async pc => {
  //           const employeeName = await this.getEmployeeName(pc.project_manager);
  //           return employeeName;
  //         })
  //       );

  //       const grossValueSum = sale.r_so_attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);

  //       const invoiceTypes = sale.r_item_details
  //         .map(detail => detail.invoice_type)
  //         .filter(type => type !== undefined && type !== null)
  //         .join(', ');

  //       return {
  //         so: sale.so,
  //         project_manager: projectManagerNames.join(', '),
  //         gross_value: grossValueSum,
  //         currency: sale.currency,
  //         start_date: sale.project_start_date,
  //         end_date: sale.project_end_date,
  //         project_name: sale.project_name,
  //         sales_responsible: this.getEmployeeName(sale.sales_responsible),
  //         type: sale.type,
  //         customer_name: this.getCustomerName(sale.bill_to_customer),
  //         category: invoiceTypes
  //       };
  //     });

  //     let gridInfoArray = await Promise.all(gridInfoPromises);
  //     gridInfoArray = gridInfoArray.sort((a, b) => (a.so > b.so) ? 1 : ((a.so < b.so) ? -1 : 0));
  //     await this.tm.getTN("grid_info_other").setData(gridInfoArray);
  //     await this.tm.getTN("grid_info_other").refresh();
  //   }


  // }

  public async onAfterSearch() {
    let oComboBox = await this.getActiveControlById('month', 's_filter_selected');
    oComboBox.setValue('');

    await this.tm.getTN("chart_line_other").setData(null);
    await this.tm.getTN("chart_bar_other").setData(null);

    let targeType = this.tm.getTN("filter_search").getProperty('target_type');
    let selectedYear = this.tm.getTN("filter_search").getProperty('start_date');
    let profitCenter = this.tm.getTN("filter_search").getProperty('profit_center');
    await this.tm.getTN("targe_type_other").setData(targeType);
    let nextYear = selectedYear.getFullYear() + 1;
    let targetFY = selectedYear.getFullYear().toString() + "-" + nextYear.toString();
    await this.tm.getTN("company_code_other").setData({ target_type: targeType, start_date: targetFY, profir_center: profitCenter });

    let headerTargets = await this.transaction.getExecutedQuery('q_so_target', { 'target_type': targeType, "target_fy": targetFY, 'profit_center': profitCenter, loadAll: true });

    let monthlyTargets = await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': headerTargets[0].header_id, "target_type": targeType, loadAll: true });
    if (targeType == "Delivery") {
      // Data from milestone table
      let yearMilestone = await this.transaction.getExecutedQuery('q_milestone_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let INRcurrency = await this.transaction.getExecutedQuery('q_milestone_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let otherCurrency = yearMilestone.filter(x => !INRcurrency.includes(x));

      let yearSchedule = await this.transaction.getExecutedQuery('q_schedule_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let inrCurrencySchedule = await this.transaction.getExecutedQuery('q_schedule_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let otherCurrencySchedule = yearSchedule.filter(x => !inrCurrencySchedule.includes(x));

      let yearVolume = await this.transaction.getExecutedQuery('q_volume_currency', { 'profit_center': profitCenter, start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let inrCurrencyVolume = await this.transaction.getExecutedQuery('q_volume_currency', { 'profit_center': profitCenter, currency: "INR", start_date: headerTargets[0].start_date, end_date: headerTargets[0].end_date, loadAll: true });
      let otherCurrencyVolume = yearVolume.filter(x => !inrCurrencyVolume.includes(x));

      // Calculate monthly sums for milestones
      let totalAchievements = await this.calculateMonthlySums(yearMilestone, 'amount');
      let inrAchivement = await this.calculateMonthlySums(INRcurrency, 'amount');
      let otherAchivement = await this.calculateMonthlySums(otherCurrency, 'amount');

      // Calculate monthly sums for schedules
      let totalScheduleAchievements = await this.calculateMonthlySums(yearSchedule, 'expected_amount');
      let inrScheduleAchievement = await this.calculateMonthlySums(inrCurrencySchedule, 'expected_amount');
      let otherScheduleAchievement = await this.calculateMonthlySums(otherCurrencySchedule, 'expected_amount');

      // Calculate monthly sums for volume
      let totalVolumeAchievements = await this.calculateMonthlySums(yearVolume, 'amount');
      let inrVolumeAchievement = await this.calculateMonthlySums(inrCurrencyVolume, 'amount');
      let otherVolumeAchievement = await this.calculateMonthlySums(otherCurrencyVolume, 'amount');

      // Aggregate achievements and schedules
      let totalAggregatedAchievements = this.aggregateMonthlySums(totalAchievements, totalScheduleAchievements, totalVolumeAchievements);
      let inrAggregatedAchievements = this.aggregateMonthlySums(inrAchivement, inrScheduleAchievement, inrVolumeAchievement);
      let otherAggregatedAchievements = this.aggregateMonthlySums(otherAchivement, otherScheduleAchievement, otherVolumeAchievement);

      // Generate chart data using the aggregated data
      let chartData = await this.generateChartData(monthlyTargets, totalAggregatedAchievements, inrAggregatedAchievements, otherAggregatedAchievements, headerTargets);

      await this.tm.getTN("chart_line_other").setData(chartData);
      await this.tm.getTN("chart_line_other").refresh();
      await this.tm.getTN("target_search").executeP();

      // Initialize array to store items
      let array_list = [];

      // Fetch and process yearMilestone
      await Promise.all(yearMilestone.map(async milestone => {
        await milestone.r_milestone_item.fetch();
        const mile = milestone.r_milestone_item;
        const item = await mile[0].r_item_header.fetch();

        // Only add if s_status is Approved
        if (item[0].s_status === "Approved") {
          const attachment = await item[0].r_so_attachment.fetch();
          const profit_center = await item[0].r_profit_center.fetch();
          const projectManagerNames = await Promise.all(
            profit_center.map(async pc => {
              const employeeName = await this.getEmployeeName(pc.project_manager);
              return employeeName;
            })
          );

          const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
          const invoiceTypes = mile
            .map(detail => detail.invoice_type)
            .filter(type => type !== undefined && type !== null)
            .join(', ');

          const milestoneItemHdr = {
            so: item[0].so,
            type: item[0].type,
            project_name: item[0].project_name,
            start_date: item[0].project_start_date,
            end_date: item[0].project_end_date,
            currency: item[0].currency,
            milestone_date: milestone.actual_date,
            milestone_amount: milestone.amount,
            customer_name: this.getCustomerName(item[0].bill_to_customer),
            invoice_type: invoiceTypes,
            gross_value: grossValueSum,
            project_manager: projectManagerNames.join(', ')
          };

          array_list.push(milestoneItemHdr);
        }
      }));

      // Fetch and process yearSchedule
      const schedulePromises = yearSchedule.map(async scheduleEntry => {
        await scheduleEntry.r_schedule_item.fetch();
        const schedule = scheduleEntry.r_schedule_item;
        const item = await schedule[0].r_item_header.fetch();

        // Only add if s_status is Approved
        if (item[0].s_status === "Approved") {
          const attachment = await item[0].r_so_attachment.fetch();
          const profit_center = await item[0].r_profit_center.fetch();
          const projectManagerNames = await Promise.all(
            profit_center.map(async pc => {
              const employeeName = await this.getEmployeeName(pc.project_manager);
              return employeeName;
            })
          );

          const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
          const invoiceTypes = schedule
            .map(detail => detail.invoice_type)
            .filter(type => type !== undefined && type !== null)
            .join(', ');

          const scheduleItemHdr = {
            so: item[0].so,
            type: item[0].type,
            project_name: item[0].project_name,
            start_date: item[0].project_start_date,
            end_date: item[0].project_end_date,
            currency: item[0].currency,
            milestone_date: scheduleEntry.actual_date,
            milestone_amount: scheduleEntry.expected_amount,
            customer_name: this.getCustomerName(item[0].bill_to_customer),
            invoice_type: invoiceTypes,
            gross_value: grossValueSum,
            project_manager: projectManagerNames.join(', ')
          };

          array_list.push(scheduleItemHdr);
        }
      });

      await Promise.all(schedulePromises);

      // Fetch and process yearVolume
      await Promise.all(yearVolume.map(async volume => {
        await volume.r_volume_item.fetch();
        const vol = volume.r_volume_item;
        const item = await vol[0].r_item_header.fetch();

        // Only add if s_status is Approved
        if (item[0].s_status === "Approved") {
          const attachment = await item[0].r_so_attachment.fetch();
          const profit_center = await item[0].r_profit_center.fetch();
          const projectManagerNames = await Promise.all(
            profit_center.map(async pc => {
              const employeeName = await this.getEmployeeName(pc.project_manager);
              return employeeName;
            })
          );

          const grossValueSum = attachment.reduce((sum, attachment) => sum + (attachment.gross_value || 0), 0);
          const invoiceTypes = vol
            .map(detail => detail.invoice_type)
            .filter(type => type !== undefined && type !== null)
            .join(', ');

          const volumeItemHdr = {
            so: item[0].so,
            type: item[0].type,
            project_name: item[0].project_name,
            start_date: item[0].project_start_date,
            end_date: item[0].project_end_date,
            currency: item[0].currency,
            milestone_date: volume.milestone_date,
            milestone_amount: volume.amount,
            customer_name: this.getCustomerName(item[0].bill_to_customer),
            invoice_type: invoiceTypes,
            gross_value: grossValueSum,
            project_manager: projectManagerNames.join(', ')
          };

          array_list.push(volumeItemHdr);
        }
      }));

      await this.tm.getTN("delivery_info_other").setData(array_list);
      await this.tm.getTN("delivery_info_other").refresh();
    }
    if (targeType == "Sales") {
      // Data from SO Header Table
      let totalSalesAchieved = await this.transaction.getExecutedQuery(
        "q_sales_achievement",
        {
          profit_center: profitCenter,
          start_date: headerTargets[0].start_date,
          end_date: headerTargets[0].end_date,
          loadAll: true,
        }
      );
      let inrSalesAchieved = await this.transaction.getExecutedQuery(
        "q_sales_achievement",
        {
          profit_center: profitCenter,
          start_date: headerTargets[0].start_date,
          end_date: headerTargets[0].end_date,
          currency: "INR",
          loadAll: true,
        }
      );
      let otherSalesAchieved = totalSalesAchieved.filter(
        (x) => !inrSalesAchieved.includes(x)
      );

      let totalSalesMonthlyAchievements = await this.calculateMonthlySum(
        totalSalesAchieved,
        (sale) => {
          return sale.r_so_attachment.reduce(
            (sum, attachment) => sum + (attachment.gross_value || 0),
            0
          );
        }
      );

      let totalINRSalesMonthlyAchievements = await this.calculateMonthlySum(
        inrSalesAchieved,
        (sale) => {
          return sale.r_so_attachment.reduce(
            (sum, attachment) => sum + (attachment.gross_value || 0),
            0
          );
        }
      );

      let totalOtherSalesMonthlyAchievements = await this.calculateMonthlySum(
        otherSalesAchieved,
        (sale) => {
          return sale.r_so_attachment.reduce(
            (sum, attachment) => sum + (attachment.gross_value || 0),
            0
          );
        }
      );

      // Generate chart data using the header information
      let chartData = await this.generateChartData(
        monthlyTargets,
        totalSalesMonthlyAchievements,
        totalINRSalesMonthlyAchievements,
        totalOtherSalesMonthlyAchievements,
        headerTargets
      );

      await this.tm.getTN("chart_line_other").setData(chartData);
      await this.tm.getTN("chart_line_other").refresh();

      await this.tm.getTN("target_search").executeP();
      const gridInfoPromises = totalSalesAchieved.map(async (sale) => {
        if (sale.s_status === "Approved") {
          await sale.r_profit_center.fetch();
          await sale.r_so_attachment.fetch();
          await sale.r_item_details.fetch();

          const projectManagerNames = await Promise.all(
            sale.r_profit_center.map(async (pc) => {
              const employeeName = await this.getEmployeeName(
                pc.project_manager
              );
              return employeeName;
            })
          );

          const grossValueSum = sale.r_so_attachment.reduce(
            (sum, attachment) => sum + (attachment.gross_value || 0),
            0
          );

          const invoiceTypes = sale.r_item_details
            .map((detail) => detail.invoice_type)
            .filter((type) => type !== undefined && type !== null)
            .join(", ");

          return {
            so: sale.so,
            project_manager: projectManagerNames.join(", "),
            gross_value: grossValueSum,
            currency: sale.currency,
            start_date: sale.project_start_date,
            end_date: sale.project_end_date,
            project_name: sale.project_name,
            sales_responsible: this.getEmployeeName(sale.sales_responsible),
            type: sale.type,
            customer_name: this.getCustomerName(sale.bill_to_customer),
            category: invoiceTypes,
          };
        }
      });

      let gridInfoArray = await Promise.all(gridInfoPromises);
      gridInfoArray = gridInfoArray.sort((a, b) =>
        a.so > b.so ? 1 : a.so < b.so ? -1 : 0
      );
      await this.tm.getTN("grid_info_other").setData(gridInfoArray);
      await this.tm.getTN("grid_info_other").refresh();
    }
  }





  public async onMonthChange(oEvent) {
    let selectedMonth = oEvent.getSource().getSelectedKey();
    await this.tm.getTN("chart_bar_other").setData(null);

    let chartData = this.tm.getTN("chart_line_other").getData();
    let barChartData = chartData.filter(item => (item.month === selectedMonth));

    await this.tm.getTN("chart_bar_other").setData(barChartData);
    await this.tm.getTN("chart_bar_other").refresh()
  }
  public async onTypeChange(oEvent) {
    return;
    let type = oEvent.getSource().getSelectedKey();
    await this.tm.getTN("chart_bar_other").setData(null);
    let target_so_item_del = await this.transaction.getExecutedQuery("d_pc_trgt_mnthly_itm", { target_type: type, loadAll: true });

    let chartData1 = []
    let month = []
    this.sortByMonth(target_so_item_del);
    for (let i = 0; i < target_so_item_del.length; i++) {
      let obj = {
        Category: target_so_item_del[i].month,
        Value: target_so_item_del[i].target
      }
      chartData1.push(obj);
    }

    await this.tm.getTN("chart_bar_other").setData(chartData1);
    await this.tm.getTN("chart_bar_other").refresh()
  }

  public sortByMonth(target_so_item_del) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    target_so_item_del.sort(function (a, b) {
      return months.indexOf(a.month)
        - months.indexOf(b.month);
    });
  }
}