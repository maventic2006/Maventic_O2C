import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_fa_report")
export default class p_fa_report extends KloController {
  public onInit() {}
  public onBeforeRendering() {}
  public onAfterRendering() {}
  public onExit() {}
  public async onPageEnter() {
    // Fetch user login id
    const user = await this.transaction.get$User();
    const loginId = user.login_id;
    const roleID = (await this.transaction.get$Role()).role_id;
    await this.tm.getTN("emp_role").setData({});
    await this.tm.getTN("selected_pc").setData({});
    await this.tm.getTN("financial_area_info").setData({});
    await this.tm.getTN("emp_role").setProperty("roler", roleID);
    const empOrg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      { loadAll: true, employee_id: loginId, is_primary: true }
    );
    await this.tm
      .getTN("functioal_search")
      .setProperty("profit_center", empOrg[0].profit_centre);
    await this.deliveryManagerSearch();
    // this.tm.getTN("business_area_other").setData(empOrg[0].business_area);
    this.tm.getTN("chart_bar_other").setData([]);
    if (roleID === "MANAGER") {
      const busyDialog = new sap.m.BusyDialog();
      busyDialog.open();

      // Initial date setup
      let currentDate = new Date();
      await this.updateData(currentDate);

      busyDialog.close();
    }
  }
  public async onUpButtonClick(): Promise<void> {
    const dateStr = await this.tm.getTN("date_other").getData();
    let currentDate = new Date(dateStr.split("-")[0]);
    currentDate.setFullYear(currentDate.getFullYear() - 1);
    await this.updateData(currentDate);
  }
  public async onDownButtonClick(): Promise<void> {
    const dateStr = await this.tm.getTN("date_other").getData();
    let currentDate = new Date(dateStr.split("-")[0]);
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    await this.updateData(currentDate);
  }
  public async updateData(currentDate: Date): Promise<void> {
    this.tm.getTN("chart_bar_other").setData([]);
    await this.tm
      .getTN("date_other")
      .setData(`${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`);
    const user = await this.transaction.get$User();
    const mmID = user.login_id.toUpperCase();

    // Fetching profit and delivery data
    const soProfitManager = await this.transaction.getExecutedQuery(
      "d_o2c_so_profit",
      { loadAll: true, project_manager: mmID }
    );
    for (const manager of soProfitManager) {
      await manager.r_profit_header.fetch();
    }

    const deliveryManagerTarget = await this.transaction.getExecutedQuery(
      "d_o2c_fa_target_del_item",
      { loadAll: true, delivery_manager: mmID }
    );
    for (const manager of deliveryManagerTarget) {
      await manager.r_delivery_header.fetch();
    }

    let amount = 0;
    let deliveryTarget = 0;

    // Calculate amount for profit
    soProfitManager.forEach((item: any) => {
      if (
        item.r_profit_header.length > 0 &&
        mmID === item.project_manager &&
        this.isWithinFinancialYear(
          currentDate,
          item.r_profit_header[0].project_start_date,
          item.r_profit_header[0].project_end_date
        )
      ) {
        amount += parseFloat(item.amount) || 0;
      }
    });

    // Calculate target for delivery
    deliveryManagerTarget.forEach((item: any) => {
      if (
        item.r_delivery_header.length > 0 &&
        mmID === item.delivery_manager &&
        this.isWithinFinancialYear(
          currentDate,
          item.r_delivery_header[0].start_date,
          item.r_delivery_header[0].end_date
        )
      ) {
        deliveryTarget += parseFloat(item.delivery_target) || 0;
      }
    });

    // Prepare data for chart
    const chartItem = {
      Category: await this.getEmployeeName(mmID),
      Achieved: amount,
      Target: deliveryTarget,
    };

    // Set chart data
    await this.tm.getTN("chart_bar_other").setData([chartItem]);
  }
  public async getEmployeeName(mm_id) {
    try {
      const empData = await this.transaction.getExecutedQuery(
        "d_o2c_employee",
        { loadAll: true, employee_id: mm_id }
      );
      if (empData && empData.length > 0) {
        return empData[0].full_name;
      } else {
        throw new Error("Employee not found");
      }
    } catch (error) {
      throw new Error("Error retrieving employee name: " + error.message);
    }
  }
  public async getFunctionalName(functional_name) {
    const functional_area_name = await this.transaction.getExecutedQuery(
      "d_o2c_functional_area",
      { loadAll: true, functional_area: functional_name }
    );
    return functional_area_name[0].name;
  }
  public isWithinFinancialYear(targetYear, projectStartDate, projectEndDate) {
    const fiscalYearStart = new Date(targetYear.getFullYear(), 3, 1);
    const fiscalYearEnd = new Date(targetYear.getFullYear() + 1, 2, 31);

    return (
      projectStartDate >= fiscalYearStart && projectEndDate <= fiscalYearEnd
    );
  }
  public async getCustomerName(customer_id) {
    const customerName = await this.transaction.getExecutedQuery(
      "d_o2c_customers",
      { loadAll: true, customer_id: customer_id }
    );
    if (customerName && customerName.length > 0) {
      return customerName[0].customer_name;
    }
  }
  public async graph_view() {
    const user = await this.transaction.get$User();
    const loginId = user.login_id;
    const empOrg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      { loadAll: true, employee_id: loginId, is_primary: true }
    );
    const search = this.tm.getTN("functioal_search").getData();
    await this.tm
      .getTN("date_other")
      .setData(
        search.target_fy.getFullYear() +
          "-" +
          (search.target_fy.getFullYear() + 1)
      );
      if (search.functional_view === "FA") {
        let func_area_list = [];
        let busyDialog = new sap.m.BusyDialog();
        busyDialog.open();
        this.tm.getTN("chart_bar_other").setData([]);
        let funcAreasArray = [];
      
        if (!search.functional_area || search.functional_area.length === 0) {
          sap.m.MessageBox.error("Please select the Functional Area", {
            title: "Error",
          });
        } else {
          funcAreasArray = search.functional_area;
      
          const [soFunctionalArea, functionalAreaTarget] = await Promise.all([
            this.transaction.getExecutedQuery("d_o2c_so_func_area", {
              loadAll: true,
              functional_area: funcAreasArray,
            }),
            this.transaction.getExecutedQuery("d_pc_trgt_hdr", {
              loadAll: true,
              functional_area: funcAreasArray,
            }),
          ]);
      
          await Promise.all(
            soFunctionalArea.map((item) => item.r_functional_header.fetch())
          );
      
          const chartData = [];
      
          for (const area of funcAreasArray) {
            let totalAmount = 0;
            let targetAmount = 0;
      
            for (const item of soFunctionalArea) {
              if (item.r_functional_header.length > 0) {
                if (
                  area === item.functional_area &&
                  this.isWithinFinancialYear(
                    search.target_fy,
                    item.r_functional_header[0].project_start_date,
                    item.r_functional_header[0].project_end_date
                  )
                ) {
                  func_area_list.push(item);
      
                  let attachment = await item.r_functional_header[0].r_so_attachment.fetch();
                  const grossValueSum = attachment.reduce(
                    (sum, attachment) => sum + (attachment.gross_value || 0),
                    0
                  );
      
                  const percentage = item.percentage || 0;
                  totalAmount += (grossValueSum * (percentage / 100)) || 0;
                }
              }
            }
      
            functionalAreaTarget.forEach((item) => {
              if (
                area === item.functional_area &&
                this.isWithinFinancialYear(
                  search.target_fy,
                  item.start_date,
                  item.end_date
                )
              ) {
                targetAmount += parseFloat(item.overall_target) || 0;
              }
            });
      
            const chartItem = {
              Category: await this.getFunctionalName(area),
              Achieved: totalAmount,
              Target: targetAmount,
            };
      
            const existingIndex = chartData.findIndex(
              (data) => data.Category === chartItem.Category
            );
      
            if (existingIndex !== -1) {
              chartData[existingIndex] = chartItem;
            } else {
              chartData.push(chartItem);
            }
          }
      
          await this.tm.getTN("chart_bar_other").setData(chartData);
      
          let array_list = new Map();
      
          for (const item of func_area_list) {
            let attachment = await item.r_functional_header[0].r_so_attachment.fetch();
            const grossValueSum = attachment.reduce(
              (sum, attachment) => sum + (attachment.gross_value || 0),
              0
            );
      
            const funcHdrInfo = {
              so: item.r_functional_header[0].so,
              type: item.r_functional_header[0].type,
              project_name: item.r_functional_header[0].project_name,
              start_date: item.r_functional_header[0].project_start_date,
              end_date: item.r_functional_header[0].project_end_date,
              currency: item.r_functional_header[0].currency,
              gross_value: grossValueSum,
              sales_responsible: this.getEmployeeName(
                item.r_functional_header[0].sales_responsible
              ),
              customer_name: this.getCustomerName(
                item.r_functional_header[0].bill_to_customer
              ),
            };
      
            if (!array_list.has(funcHdrInfo.so)) {
              array_list.set(funcHdrInfo.so, funcHdrInfo);
            }
          }
      
          let functional_area_array = Array.from(array_list.values());
          functional_area_array.sort((a, b) => a.so.localeCompare(b.so));
          await this.tm
            .getTN("financial_area_info")
            .setData(functional_area_array);
          await this.tm.getTN("financial_area_info").refresh();
          busyDialog.close();
        }
      }
       else if (search.functional_view === "DM") {
      let delivery_manager_list = [];
      if (
        !search.profit_center &&
        (!search.delivery_manager || search.delivery_manager.length === 0)
      ) {
        sap.m.MessageBox.error(
          "Please select Profit Center or Delivery Manager",
          {
            title: "Error",
          }
        );
      } else {
        let busyDialog = new sap.m.BusyDialog();
        busyDialog.open();
        this.tm.getTN("chart_bar_other").setData([]);
        let mmIDs = [];
    
        if (!search.delivery_manager || search.delivery_manager.length === 0) {
          const managerInfo = await this.transaction.getExecutedQuery(
            "q_get_manager",
            { loadAll: true, profit_centre: search.profit_center }
          );
          mmIDs = managerInfo.map((info) => info.employee_id);
        } else {
          mmIDs = search.delivery_manager;
        }
    
        const [soProfitManager, deliveryManagerTarget] = await Promise.all([
          this.transaction.getExecutedQuery("d_o2c_so_profit", {
            loadAll: true,
            project_manager: mmIDs,
          }),
          this.transaction.getExecutedQuery("d_o2c_fa_target_del_item", {
            loadAll: true,
            delivery_manager: mmIDs,
          }),
        ]);
    
        await Promise.all(
          soProfitManager.map((item) => item.r_profit_header.fetch())
        );
        await Promise.all(
          deliveryManagerTarget.map((item) => item.r_delivery_header.fetch())
        );
    
        const chartData = [];
    
        for (const mm_id of mmIDs) {
          let amount = 0;
          let deliveryTarget = 0;
    
          for (const item of soProfitManager) {
            if (item.r_profit_header.length > 0) {
              if (
                mm_id === item.project_manager &&
                this.isWithinFinancialYear(
                  search.target_fy,
                  item.r_profit_header[0].project_start_date,
                  item.r_profit_header[0].project_end_date
                )
              ) {
                delivery_manager_list.push(item);
    
                let attachment =
                  await item.r_profit_header[0].r_so_attachment.fetch();
                const grossValueSum = attachment.reduce(
                  (sum, attachment) => sum + (attachment.gross_value || 0),
                  0
                );
    
                const percentage = item.percentage || 0;
                amount += (percentage / 100) * grossValueSum;
              }
            }
          }
    
          for (const item of deliveryManagerTarget) {
            if (item.r_delivery_header.length > 0) {
              if (
                mm_id === item.delivery_manager &&
                this.isWithinFinancialYear(
                  search.target_fy,
                  item.r_delivery_header[0].start_date,
                  item.r_delivery_header[0].end_date
                )
              ) {
                deliveryTarget += parseFloat(item.delivery_target) || 0;
              }
            }
          }
    
          const chartItem = {
            Category: await this.getEmployeeName(mm_id),
            Achieved: amount,
            Target: deliveryTarget,
          };
    
          const existingIndex = chartData.findIndex(
            (data) => data.Category === chartItem.Category
          );
          if (existingIndex !== -1) {
            chartData[existingIndex] = chartItem;
          } else {
            chartData.push(chartItem);
          }
        }
    
        await this.tm.getTN("chart_bar_other").setData(chartData);
    
        let array_list = new Map();
    
        for (const item of delivery_manager_list) {
          let attachment =
            await item.r_profit_header[0].r_so_attachment.fetch();
          const grossValueSum = attachment.reduce(
            (sum, attachment) => sum + (attachment.gross_value || 0),
            0
          );
    
          const deliveryManagerHdr = {
            so: item.r_profit_header[0].so,
            type: item.r_profit_header[0].type,
            project_name: item.r_profit_header[0].project_name,
            start_date: item.r_profit_header[0].project_start_date,
            end_date: item.r_profit_header[0].project_end_date,
            currency: item.r_profit_header[0].currency,
            gross_value: grossValueSum,
            sales_responsible: this.getEmployeeName(
              item.r_profit_header[0].sales_responsible
            ),
            customer_name: this.getCustomerName(
              item.r_profit_header[0].bill_to_customer
            ),
          };
    
          if (!array_list.has(deliveryManagerHdr.so)) {
            array_list.set(deliveryManagerHdr.so, deliveryManagerHdr);
          }
        }
    
        let deliveryManagerArray = Array.from(array_list.values());
    
        deliveryManagerArray.sort((a, b) => a.so.localeCompare(b.so));
        await this.tm
          .getTN("financial_area_info")
          .setData(deliveryManagerArray);
        await this.tm.getTN("financial_area_info").refresh();
        busyDialog.close();
      }
    }
     else if (search.functional_view === "TO") {
      let target_owner_list = [];
      let busyDialog = new sap.m.BusyDialog();
      busyDialog.open();
      this.tm.getTN("chart_bar_other").setData([]);
      let mmIDs = [];
      if (!search.target_owner || search.target_owner.length === 0) {
        sap.m.MessageBox.error("Please select the Target Owner", {
          title: "Error",
        });
      } else {
        mmIDs = search.target_owner;

        const soSalesResponsible = await this.transaction.getExecutedQuery(
          "d_o2c_so_hdr",
          { loadAll: true, sales_responsible: search.target_owner }
        );
        // const empName = await this.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': search.target_owner });
        const salesTargetNode = await this.transaction.getExecutedQuery(
          "d_o2c_fa_target_sales_item",
          { loadAll: true, target_owner: search.target_owner }
        );
        for (let i = 0; i < salesTargetNode.length; i++) {
          await salesTargetNode[i].r_target_hdr.fetch();
        }
        let chartData = [];

        for (const mm_id of mmIDs) {
          let amount = 0;
          let salesTarget = 0;

          for (const item of soSalesResponsible) {
            if (
              item.sales_responsible == mm_id &&
              this.isWithinFinancialYear(
                search.target_fy,
                item.project_start_date,
                item.project_end_date
              )
            ) {
              target_owner_list.push(item);
              let attachment = await item.r_so_attachment.fetch();
              const grossValueSum = attachment.reduce(
                (sum, attachment) => sum + (attachment.gross_value || 0),
                0
              );
              amount += parseFloat(grossValueSum) || 0;
            }
          }

          for (const item of salesTargetNode) {
            if (item.r_target_hdr.length > 0) {
              if (
                item.target_owner == mm_id &&
                this.isWithinFinancialYear(
                  search.target_fy,
                  item.r_target_hdr[0].start_date,
                  item.r_target_hdr[0].end_date
                )
              ) {
                salesTarget += parseFloat(item.target_amount) || 0;
              }
            } else {
              salesTarget += 0;
            }
          }

          // Prepare data for chart inside the loop
          const chartItem = {
            Category: await this.getEmployeeName(mm_id),
            Achieved: amount,
            Target: salesTarget,
          };

          chartData.push(chartItem);
        }

        // Set chart data
        await this.tm.getTN("chart_bar_other").setData(chartData);
      }
      let array_list = new Set();
      for (const item of target_owner_list) {
        let attachment = await item.r_so_attachment.fetch();
        const grossValueSum = attachment.reduce(
          (sum, attachment) => sum + (attachment.gross_value || 0),
          0
        );
        let deliveryManagerHdr = {
          so: item.so,
          type: item.type,
          project_name: item.project_name,
          start_date: item.project_start_date,
          end_date: item.project_end_date,
          currency: item.currency,
          gross_value: grossValueSum,
          sales_responsible: this.getEmployeeName(item.sales_responsible),
          customer_name: this.getCustomerName(item.bill_to_customer),
        };
        array_list.add(deliveryManagerHdr);
      }

      let targetOwnerArray = Array.from(array_list);

      targetOwnerArray.sort((a, b) => a.so.localeCompare(b.so));
      await this.tm.getTN("financial_area_info").setData(targetOwnerArray);
      await this.tm.getTN("financial_area_info").refresh();
      busyDialog.close();
    }
  }

  public async deliveryManagerSearch() {
    let profit_id = this.tm.getTN("functioal_search").getData().profit_center;
    let dm = await this.transaction.getExecutedQuery(
      "q_delivery_manager_trgt",
      {
        profit_c: profit_id,
        loadAll: true,
        partialSelected: ["employee_id", "full_name"],
      }
    );
    await this.tm.getTN("selected_pc").setData(dm);
    // await this.tm.getTN("delivery_manager_search").setProperty('profit_c', profit_id);
    // await this.tm.getTN("delivery_manager_search").executeP();
    // await this.tm.getTN("functioal_search").refresh()
  }
}
