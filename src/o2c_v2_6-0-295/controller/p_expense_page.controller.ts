import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { AUTHORIZATION_TYPE, KloAjax } from "kloBo/kloCommon/KloAjaxHandler";
import { System } from "kloBo/kloCommon/System/System";
import { KloController } from "kloTouch/jspublic/KloController";
import { salesorder } from "o2c_v2/util/salesorder";
import { userInfo } from "os";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_expense_page")
export default class p_expense_page extends KloController {
  public onInit() { }
  public onBeforeRendering() { }
  public onAfterRendering() { }
  public onExit() { }
  public prym_role_id;
  public role_id;
  public login_id;
  public full_name;
  public UserInfo;
  public UserOrg;
  public receipt_verify;
  public business_area;
  public journey;
  public async onPageEnter(oEvent) {
    await FileLoaderUtils.loadCSSFile(
      this.getFlavor(),
      this.getFlavorVersion(),
      "expense_page"
    );
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    await this.tm.getTN("relation_screen_length").setData({});
    await this.tm.getTN("other_travel_comment").setData({});
    await this.tm.getTN("logged_employee").setData({});
    await this.tm.getTN("receipt_date_check").setData({});
    await this.tm.getTN("expense_creation_module").setData({});
    await this.tm.getTN("expense_sub_type_vh").setData({});
    await this.tm.getTN("expense_category_vh_select").setData({});
    let detail = await this.tm.getTN("expense_detail").getData();
    this.role_id = (await this.transaction.get$Role()).role_id;
    this.login_id = (await this.transaction.get$User()).login_id;
    this.prym_role_id = (await this.transaction.get$Role()).role_id;
    let role_list = await this.transaction.getExecutedQuery(
      "d_second_role_assyn",
      { employee_id: this.login_id, page_name: "Expense Page", loadAll: true }
    );
    if (role_list.length) {
      this.role_id = role_list[0].assyned_role;
    }
    await this.tm
      .getTN("receipt_date_check")
      .setProperty("role_id", this.role_id);
    this.UserInfo = await this.transaction.getExecutedQuery("d_o2c_employee", {
      employee_id: this.login_id,
      loadAll: true,
    });
    this.UserOrg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      { employee_id: this.login_id, is_primary: true, loadAll: true }
    );
    if (this.role_id == "FINANCE")
      this.receipt_verify = await this.transaction.getExecutedQuery(
        "d_o2c_expense_receipt_verify",
        { employee_id: "FINANCE", loadAll: true }
      );
    else if (this.role_id == "SM")
      this.receipt_verify = await this.transaction.getExecutedQuery(
        "d_o2c_expense_receipt_verify",
        { employee_id: "SM", loadAll: true }
      );
    else
      this.receipt_verify = await this.transaction.getExecutedQuery(
        "d_o2c_expense_receipt_verify",
        { employee_id: this.login_id, loadAll: true }
      );
    this.full_name = this.UserInfo[0].first_name.concat(
      " ",
      this.UserInfo[0].last_name
    );
    await this.tm
      .getTN("other_travel_comment")
      .setProperty("user_name", this.full_name);
    await this.tm
      .getTN("other_travel_comment")
      .setProperty("user_id", this.login_id);
    await this.tm
      .getTN("logged_employee")
      .setProperty("login_id", this.UserInfo[0].employee_id);
    await this.tm.getTN("logged_employee").setProperty("role_id", this.role_id);
    await this.tm
      .getTN("logged_employee")
      .setProperty("profit_center", this.UserOrg[0].profit_centre);
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_approval", "false");
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_comment", "false");
    const expense_id = oEvent.navToParams.expense;
    const mode_id = oEvent.navToParams.mode_id;
    if (expense_id != undefined) {
      if (mode_id == "EDIT") {
        let expense_list = this.tm.getTN("expense_list").getData();
        for (let i = 0; i < expense_list.length; i++) {
          if (expense_list[i].request_id == expense_id) {
            await this.tm.getTN("expense_list").setActive(i);
            let receipt = await expense_list[i].r_expense_receipt.fetch();
            await this.tm
              .getTN("relation_screen_length")
              .setProperty("receipt", receipt.length);
            break;
          }
        }
      } else if (mode_id == "CREATE") {
        const order_type = oEvent.navToParams.order_type;
        let expense = await this.tm.getTN("expense_list").createEntityP(
          {
            created_by: this.UserInfo[0].employee_id,
            employee_for: this.UserInfo[0].employee_id,
            expense_status: "New",
            travel_request_id: expense_id,
            journey_id: expense_id,
            employee_role_type: "ALL",
            category_id: "TRAVEL",
            order_type: order_type
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          false
        );
        await this.tm
          .getTN("expense_receipt_list")
          .createEntityP(
            {},
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            true,
            true,
            false
          );
        let employee = await this.transaction.getExecutedQuery("d_o2c_employee", {
          employee_id: expense.employee_for,
          loadAll: true,
        });
        let userDesig = await this.transaction.getExecutedQuery(
          "q_o2c_emp_current_desig",
          { employee_id: expense.employee_for, from_date: new Date(), end_date: new Date(), loadAll: true }
        );
        let DesigMaster = await this.transaction.getExecutedQuery(
          "d_o2c_designation_master",
          { designation_id: userDesig[0].designation, loadAll: true }
        );
        let userorg = await this.transaction.getExecutedQuery(
          "d_o2c_employee_org",
          { employee_id: expense.employee_for, is_primary: true, loadAll: true }
        );
        let CompanyName = await this.transaction.getExecutedQuery(
          "d_o2c_company_info",
          { company_code: userorg[0].company_code, loadAll: true }
        );
        await this.tm
          .getTN("receipt_attendee_list")
          .createEntityP(
            {
              employee_id: employee[0].employee_id,
              employee_name: employee[0].full_name,
              relationship_with_company: DesigMaster[0].name,
              company_name: CompanyName[0].name

            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            true,
            true,
            false
          );
        await this.tm.getTN("expense_workflow_list").createEntityP(
          {
            role: this.role_id,
            approver: this.UserInfo[0].employee_id,
            s_status: "In-Progress",
            profit_center: this.UserOrg[0].profit_centre,
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          false,
          false,
          false
        );
        // let travel_project_list = await this.transaction.getExecutedQuery(
        //   "d_o2c_expense_travel_project",
        //   { request_id: expense_id, loadAll: true }
        // );
        // for (let i = 0; i < travel_project_list.length; i++) {
        //   await this.tm.getTN("expense_project_list").createEntityP({
        //     project_id: travel_project_list[i].project_id,
        //     project_name: travel_project_list[i].project_name,
        //     split_percent: travel_project_list[i].split_percent,
        //     bill_to_customer: travel_project_list[i].bill_to_customer,
        //     so: travel_project_list[i].so,
        //     po_no: travel_project_list[i].po_no,
        //   });
        // }
        await this.tm.getTN("relation_screen_length").setProperty("receipt", 1);
        await this.tm
          .getTN("location_search")
          .setProperty("travel_type", ["International", "Domestic", "Local"]);
        await this.tm
          .getTN("location_search")
          .setProperty("business_area", this.business_area);
        await this.tm.getTN("location_search").executeP();
      }
      let request = await this.tm.getTN("expense_list").getActiveData();
      await this.tm
        .getTN("exp_project_search")
        .setProperty("employee", request.employee_for);
      await this.tm
        .getTN("exp_project_search")
        .setProperty("request_id", request.travel_request_id);
      await this.tm.getTN("exp_project_search").executeP();
      let status = [
        "Approved by Travel Desk",
        "Travel Completed",
        "Re Opened",
        "Travel Closed",
      ];
      await this.tm
        .getTN("travel_vh_search")
        .setProperty("query_status", status);
      await this.tm
        .getTN("travel_vh_search")
        .setProperty("query_employee", request.employee_for);
      await this.tm.getTN("travel_vh_search").executeP();
      let workflow_list = await request.r_workflow_log.fetch();
      await this.tm
        .getTN("logged_employee")
        .setProperty("pending_for_comment", "false");
      await this.tm
        .getTN("logged_employee")
        .setProperty("pending_for_approval", "false");
      for (let i = 0; i < workflow_list.length; i++) {
        if (
          workflow_list[i].s_status == "In-Progress" &&
          workflow_list[i].approver &&
          workflow_list[i].approver.toUpperCase() ==
          this.UserInfo[0].employee_id.toUpperCase()
        ) {
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_approval", "true");
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_comment", "true");
        } else if (
          workflow_list[i].s_status == "In-Progress" &&
          workflow_list[i].role == "FINANCE" &&
          this.role_id == "FINANCE"
        ) {
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_approval", "true");
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_comment", "true");
        } else if (
          workflow_list[i].s_status == "In-Progress" &&
          workflow_list[i].role == "SM" &&
          this.role_id == "SM"
        ) {
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_approval", "true");
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_comment", "true");
        }
      }
      if (
        request.expense_status == "New" ||
        request.expense_status == "Saved as Draft" ||
        request.expense_status == "Clarification Required"
      ) {
        if (
          this.UserInfo[0].employee_id.toUpperCase() ==
          request.created_by.toUpperCase()
        )
          await this.tm
            .getTN("logged_employee")
            .setProperty("pending_for_comment", "true");
      }
    } else if (detail) {
      let receipt = await detail.r_expense_receipt.fetch();
      await this.tm
        .getTN("relation_screen_length")
        .setProperty("receipt", receipt.length);
    }
    oBusyDailog.close(); //
  }
  public async onnavtodetail(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/expense_list/", ""));
    await this.transaction.rollback();
    let request = await this.tm.getTN("expense_list").getData()[index];
    await this.tm.getTN("expense_list").setActive(index);
    let userorg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      { employee_id: request.employee_for, is_primary: true, loadAll: true }
    );
    this.business_area = userorg[0].business_area;
    await this.tm
      .getTN("exp_project_search")
      .setProperty("employee", request.employee_for);
    await this.tm
      .getTN("exp_project_search")
      .setProperty("request_id", request.travel_request_id);
    await this.tm.getTN("exp_project_search").executeP();
    let status = [
      "Approved by Travel Desk",
      "Travel Completed",
      "Re Opened",
      "Travel Closed",
    ];
    await this.tm.getTN("travel_vh_search").setProperty("query_status", status);
    await this.tm
      .getTN("travel_vh_search")
      .setProperty("query_employee", request.employee_for);
    await this.tm.getTN("travel_vh_search").executeP();
    let workflow_list = await request.r_workflow_log.fetch();
    await this.tm
      .getTN("location_search")
      .setProperty("travel_type", ["International", "Domestic", "Local"]);
    await this.tm
      .getTN("location_search")
      .setProperty("business_area", this.business_area);
    await this.tm.getTN("location_search").executeP();
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_comment", "false");
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_approval", "false");
    await this.tm.getTN("receipt_date_check").setProperty("check", false);
    for (let i = 0; i < workflow_list.length; i++) {
      if (
        workflow_list[i].s_status == "In-Progress" &&
        workflow_list[i].approver &&
        workflow_list[i].approver.toUpperCase() ==
        this.UserInfo[0].employee_id.toUpperCase()
      ) {
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_approval", "true");
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_comment", "true");
      } else if (
        workflow_list[i].s_status == "In-Progress" &&
        workflow_list[i].role == "FINANCE" &&
        this.role_id == "FINANCE"
      ) {
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_approval", "true");
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_comment", "true");
      } else if (
        workflow_list[i].s_status == "In-Progress" &&
        workflow_list[i].role == "SM" &&
        this.role_id == "SM"
      ) {
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_approval", "true");
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_comment", "true");
      }
    }
    if (
      request.expense_status == "New" ||
      request.expense_status == "Saved as Draft" ||
      request.expense_status == "Clarification Required"
    ) {
      if (
        this.UserInfo[0].employee_id.toUpperCase() ==
        request.created_by.toUpperCase()
      )
        await this.tm
          .getTN("logged_employee")
          .setProperty("pending_for_comment", "true");
    }
    let receipt = await request.r_expense_receipt.fetch();
    await this.tm
      .getTN("relation_screen_length")
      .setProperty("receipt", receipt.length);
    let receipt_detail = receipt[0];
    for (let i = 0; i < receipt.length; i++) {
      receipt_detail = receipt[i];
      let vefication_filteredlist = this.receipt_verify.filter(
        (item) => item.receipt_id == receipt_detail.receipt_id
      );
      if (vefication_filteredlist.length == 0)
        receipt_detail.verification_check = false;
      else
        receipt_detail.verification_check =
          vefication_filteredlist[0].verfication_check;
    }
    const pd_list = await this.tm.getTN("r_local_perdiem").getData();
    if (pd_list && pd_list.length > 0) {
      await this.tm.getTN("relation_screen_length").setProperty("local_pd", pd_list.length);
    }
    await this.navTo({
      TS: true,
      H: true,
      S: "p_expense_page",
      SS: "pa_detail",
    });
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("expense_type", receipt_detail.receipt_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("order_type", request.order_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("category_id", request.category_id);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("user_role", request.employee_role_type);
    await this.tm.getTN("sub_type_vh").getData().setLoadAll(true);
    let sub_type = await this.tm.getTN("sub_type_vh").executeP();
    await this.tm.getTN("expense_sub_type_vh").setData(sub_type);
    await this.tm
      .getTN("new_type_vh")
      .setProperty("category_id", request.category_id);
    await this.tm
      .getTN("new_type_vh")
      .setProperty("user_role", request.employee_role_type);
    await this.tm
      .getTN("new_type_vh")
      .setProperty("order_type", request.order_type);
    await this.tm.getTN("new_type_vh").getData().setLoadAll(true);
    await this.tm.getTN("new_type_vh").setProperty("expense_type", request.expense_type);
    let type = await this.tm.getTN("new_type_vh").executeP();
    let type_list = type;
    let project = await receipt[0].r_receipt_project.fetch();
    let soList = [];
    for (let i = 0; i < project.length; i++) {
      const so = project[i].so;
      if (so && soList.indexOf(so) === -1) {
        soList.push(so);
      }
    }
    let tnm = await this.transaction.getExecutedQuery("q_so_expense_tnm_check", {
      so: soList,
      loadAll: true,
    });
    let tnm_check = [false];
    if (tnm.length > 0) {
      tnm_check = [false, true];
    }
    const uniqueExpenseTypes = Array.from(
      new Set(type_list.map((item) => item.expense_type).filter(Boolean))
    ).map((expense_type) => {
      const matchingItem = type_list.find(
        (item) => item.expense_type === expense_type
      );
      return {
        key: expense_type,
        description: matchingItem?.order_type,
        sub_type_check: matchingItem?.sub_type_check || false,
        per_diem_check: matchingItem?.per_diem_check || false,
        base_area_check: matchingItem?.base_area_check || false,
        distance_travel_check: matchingItem?.distance_travel_check || false,
        attendees_check: matchingItem?.attendees_check || false,
        location_required: matchingItem?.location_required || false,
        no_of_days_check: matchingItem?.no_of_days_check || false,
        t_and_m_only: tnm_check
      };
    });
    await this.tm.getTN("expense_type_vh").setData(uniqueExpenseTypes);
    let verification_check_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_receipt_verify",
      { receipt_id: receipt_detail.receipt_id, loadAll: true, skipMap: true }
    );
    let user_vefication_list;
    if (this.role_id == "FINANCE")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "FINANCE" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else if (this.role_id == "SM")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "SM" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id.toLowerCase() == this.login_id.toLowerCase()
      );
    if (user_vefication_list.length > 0 && user_vefication_list[0].verfication_check == false) {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "true");
    }
    else {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "false");
    }
  }
  public async navtoTravel() {
    let travel = this.tm.getTN("expense_detail").getData().travel_request_id;
    await this.navTo({
      TS: true,
      H: true,
      S: "p_travel_page",
      SS: "pa_detail",
    });
  }
  public async activeReceipt(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/expense_receipt_list/", ""));
    await this.tm.getTN("expense_receipt_list").setActive(index);
    let receipt_detail = this.tm.getTN("expense_receipt_list").getData()[index];
    let verification_check_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_receipt_verify",
      { receipt_id: receipt_detail.receipt_id, loadAll: true, skipMap: true }
    );
    let user_vefication_list;
    if (this.role_id == "FINANCE")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "FINANCE" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else if (this.role_id == "SM")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "SM" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id.toLowerCase() == this.login_id.toLowerCase()
      );
    if (user_vefication_list.length > 0 && user_vefication_list[0].verfication_check == false) {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "true");
    }
    else {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "false");
    }
    // let receipt = await this.tm.getTN("expense_receipt_list").getData()[index];
    // let currentDate = new Date(receipt.s_created_on);
    // const filingDeadline = new Date(receipt.receipt_date.getFullYear(), receipt.receipt_date.getMonth() + 1, 10); // Set to the 10th day of next month
    // // Check if filing is allowed
    // if (currentDate.getTime() <= filingDeadline.getTime()) {
    // 	await this.tm.getTN("receipt_date_check").setProperty('check',false);
    // } else {
    //   	console.log("Expense filing period has expired.");
    // 	await this.tm.getTN("receipt_date_check").setProperty('check',true);
    // }
  }
  //CREATION FUNCTIONS test
  public async newExpenseCreation() {
    let role_type;
    await this.navTo({
      TS: true,
      H: true,
      S: "p_expense_page",
      SS: "pa_detail",
    });
    if (this.role_id == "SALES" || this.role_id == "SM") {
      role_type = "SALES";
    } else {
      role_type = "DELIVERY";
    }
    await this.tm
      .getTN("location_search")
      .setProperty("travel_type", ["International", "Domestic", "Local"]);
    await this.tm
      .getTN("location_search")
      .setProperty("business_area", this.business_area);
    await this.tm.getTN("location_search").executeP();
    await this.tm.getTN("expense_list").createEntityP(
      {
        created_by: this.UserInfo[0].employee_id,
        employee_for: this.UserInfo[0].employee_id,
        expense_status: "New",
        employee_role_type: role_type,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      true,
      true,
      false
    );
    await this.tm
      .getTN("expense_receipt_list")
      .createEntityP(
        {},
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        true,
        true,
        false
      );

    await this.tm.getTN("expense_workflow_list").createEntityP(
      {
        role: this.role_id,
        approver: this.UserInfo[0].employee_id,
        s_status: "In-Progress",
        profit_center: this.UserOrg[0].profit_centre,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      false,
      false
    );
    await this.tm
      .getTN("exp_project_search")
      .setProperty("employee", this.UserInfo[0].employee_id);
    await this.tm
      .getTN("exp_project_search")
      .setProperty("request_id", undefined);
    await this.tm.getTN("relation_screen_length").setProperty("receipt", 1);
    await this.tm.getTN("exp_project_search").executeP();
  }
  public async newProjectCreation() {
    let expense = await this.tm.getTN("expense_detail").getData();
    await this.tm
      .getTN("receipt_project_list")
      .createEntityP(
        { receipt_expense_id: expense.request_id },
        "Creation Successful",
        "Creation Failed",
        null,
        "Last",
        true,
        true,
        false
      );
  }
  public async newAttendeesCreation() {
    await this.tm
      .getTN("receipt_attendee_list")
      .createEntityP(
        {},
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        true,
        true,
        false
      );
    await this.onAutoAmountCalculation()
  }
  public async newReceiptCreation() {
    let request = await this.tm.getTN("expense_detail").getData();
    await this.tm
      .getTN("expense_receipt_list")
      .createEntityP(
        { sal_reimburse_id: request.sal_reim_id, transaction_status: "Ready for Payment" },
        "Creation Successful",
        "Creation Failed",
        null,
        "Last",
        true,
        true,
        false
      );
    if (request.auto_project_check == true) {
      const today = new Date();
      let auto_project_check = await this.transaction.getExecutedQuery("q_expense_category_project", {
        business_area: this.UserOrg[0].business_area, expense_type: request.expense_type, date_new: today,
        loadAll: true,
      });
      let selected_project = await this.transaction.getExecutedQuery('d_o2c_project_header', { project_id: auto_project_check[0].project_id, loadAll: true });
      let so = await selected_project[0].r_project_so;
      request.order_type = so[0].type;
      await this.tm
        .getTN("receipt_project_list")
        .createEntityP(
          {
            receipt_expense_id: request.request_id,
            project_id: auto_project_check[0].project_id,
            so: so[0].so,
            bill_to_customer: so[0].bill_to_customer,
            project_name: so[0].project_name,
            split_percent: 100
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "Last",
          true,
          true,
          false
        );
    }
    let employee = await this.transaction.getExecutedQuery("d_o2c_employee", {
      employee_id: request.employee_for,
      loadAll: true,
    });
    let userDesig = await this.transaction.getExecutedQuery(
      "q_o2c_emp_current_desig",
      { employee_id: request.employee_for, from_date: new Date(), end_date: new Date(), loadAll: true }
    );
    let DesigMaster = await this.transaction.getExecutedQuery(
      "d_o2c_designation_master",
      { designation_id: userDesig[0].designation, loadAll: true }
    );
    let userorg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      { employee_id: request.employee_for, is_primary: true, loadAll: true }
    );
    let CompanyName = await this.transaction.getExecutedQuery(
      "d_o2c_company_info",
      { company_code: userorg[0].company_code, loadAll: true }
    );
    await this.tm
      .getTN("receipt_attendee_list")
      .createEntityP(
        {
          employee_id: employee[0].employee_id,
          employee_name: employee[0].full_name,
          relationship_with_company: DesigMaster[0].name,
          company_name: CompanyName[0].name

        },
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        true,
        true,
        false
      );
    let receipt = await request.r_expense_receipt.fetch();
    await this.tm
      .getTN("relation_screen_length")
      .setProperty("receipt", receipt.length);
  }
  //DELETE FUNCTIONS
  public async ProjectDeletion() {
    const selected = await this.getActiveControlById(
      null,
      "s_project_list"
    ).getSelectedIndices();
    await this.tm
      .getTN("receipt_project_list")
      .getData()
    [selected[0]].deleteP();
  }
  public async AttendeesDeletion() {
    const selected = await this.getActiveControlById(
      null,
      "s_attendees_list"
    ).getSelectedIndices();
    await this.tm
      .getTN("receipt_attendee_list")
      .getData()
    [selected[0]].deleteP();
    await this.onAutoAmountCalculation();
  }
  public async ReceiptDeletion() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      index
    ];
    let attendees_list = await this.tm.getTN("receipt_attendee_list").getData();
    let project_list = await this.tm.getTN("receipt_project_list").getData();
    let per_diem_list = await this.tm.getTN("receipt_per_diem").getData();
    if (attendees_list && attendees_list.length > 0)
      for (let i = attendees_list.length - 1; i >= 0; i--) {
        await attendees_list[i].deleteP();
      }
    if (project_list && project_list.length > 0)
      for (let i = project_list.length - 1; i >= 0; i--) {
        await project_list[i].deleteP();
      }
    if (per_diem_list && per_diem_list.length > 0)
      for (let i = per_diem_list.length - 1; i >= 0; i--) {
        await per_diem_list[i].deleteP();
      }
    let request = await this.tm.getTN("expense_detail").getData();
    await receipt_detail.deleteP();
    await this.tm.getTN("expense_receipt_list").setActive(0);
    let receipt = await request.r_expense_receipt.fetch();
    await this.tm
      .getTN("relation_screen_length")
      .setProperty("receipt", receipt.length);
  }
  //ACTION BUTTONS
  public editExpense() {
    this.setMode("EDIT");
  }
  public async onInvoiceChange() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      index
    ];
    const receipts = await this.transaction.getExecutedQuery(
      "d_o2c_expense_receipt",
      { loadAll: true, skipMap: true }
    );
    const invoiceToCheck = receipt_detail.invoice_id;
    let invoiceNumbers = receipts
      .map((receipt) => receipt.invoice_id)
      .filter((invoice) => invoice && invoice.trim() !== ""); // Remove null, empty, or whitespace-only

    let isInvoiceFound = invoiceNumbers.includes(invoiceToCheck);
    let receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    let receiptindex = index;
    for (let i = 0; i < receipt_list.length; i++) {
      if (
        receipt_detail.invoice_id == receipt_list[i].invoice_id &&
        receipt_list[i].receipt_date &&
        receipt_detail.receipt_date &&
        receipt_detail.receipt_date.getTime() ==
        receipt_list[i].receipt_date.getTime() &&
        receipt_detail.receipt_type == receipt_list[i].receipt_type &&
        i != index
      ) {
        if (
          receipt_detail.invoice_id &&
          receipt_detail.invoice_id != null &&
          receipt_detail.invoice_id != undefined &&
          receipt_detail.invoice_id != ""
        ) {
          receiptindex = i;
          break;
        }
      }
    }
    if (isInvoiceFound && index != receiptindex) {
      await this.tm.getTN("receipt_date_check").setProperty("invoice", true);
      receipt_detail.invoice_id = undefined;
    } else {
      await this.tm.getTN("receipt_date_check").setProperty("invoice", false);
    }
  }
  public async generatePerDiemEntries() {
    let applied_vacation_check = await this.vacation_approval_check();
    if (!applied_vacation_check) {
      sap.m.MessageBox.error(
        "Please approve Your Leaves within the timeframe of your travel before declaring Per Diem",
        { title: "Approved Leaves Required" }
      );
      return;
    }

    let declaration;
    let declaration_flag = false;
    let request = await this.tm.getTN("expense_detail").getData();
    let travel = await this.tm.getTN("expense_travel_detail").getData();
    let receipt = await this.tm.getTN("expense_receipt_detail").getData();

    if (!travel) {
      let travel_list = await this.transaction.getExecutedQuery("d_o2c_travel_header", {
        request_id: request.travel_request_id,
        loadAll: true,
        skipMap: true,
      });
      travel = travel_list[0];
    }

    let tripType = travel.trip_type;

    const travelPerDiems = await this.tm.getTN("expense_travel_list").getData()[0].r_travel_per_diem; // TN to fetch by travel relation

    // Step 2: Get all per diems via receipt relation
    let expensePerDiems = [];
    const receipts = request.r_expense_receipt || [];
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      if (receipt.expense_type === "Per Diem" && Array.isArray(receipt.r_receipt_per_diem)) {
        expensePerDiems.push(...receipt.r_receipt_per_diem);
      }
    }
    let allPerDiems = []
    // Step 3: Combine them
    if (travelPerDiems)
      allPerDiems = [...travelPerDiems, ...expensePerDiems];
    else
      allPerDiems = [...expensePerDiems];

    // Step 4: Build a Set of all dates
    let existingDates = new Set();

    allPerDiems.forEach(p => {
      const from = new Date(p.from_date);
      const to = new Date(p.to_date);
      const current = new Date(from);
      while (current <= to) {
        existingDates.add(current.toDateString());
        current.setDate(current.getDate() + 1);
      }
    });

    let approvedleaves = await this.transaction.getExecutedQuery("q_travel_vacation", {
      employee_id: request.employee_for,
      starting_date: travel.travel_start_date,
      ending_date: travel.travel_end_date,
      loadAll: true,
      skipMap: true,
    });

    const isVacationDay = (date: Date) =>
      approvedleaves.some(
        (leave) =>
          date.getTime() >= new Date(leave.start_date).getTime() &&
          date.getTime() <= new Date(leave.end_date).getTime()
      );

    const getAvailableDateRanges = (start, end, isVacationDayFn, existingDates) => {
      const ranges = [];
      let rangeStart = null;
      let tempDate = new Date(start);

      while (tempDate <= end) {
        const dateStr = tempDate.toDateString();
        const isBlocked = isVacationDayFn(tempDate) || existingDates.has(dateStr);

        if (!isBlocked) {
          if (!rangeStart) {
            rangeStart = new Date(tempDate);  // start a new range
          }
        } else {
          if (rangeStart) {
            const rangeEnd = new Date(tempDate);
            rangeEnd.setDate(rangeEnd.getDate() - 1);
            if (rangeEnd >= rangeStart) {
              ranges.push({ from: rangeStart, to: rangeEnd });
            }
            rangeStart = null;
          }
        }

        tempDate.setDate(tempDate.getDate() + 1);
      }

      if (rangeStart && rangeStart <= end) {
        ranges.push({ from: rangeStart, to: end });
      }

      return ranges;
    };


    if (tripType === "Local") {
      let fromDate = new Date(travel.travel_start_date);
      let toDate = new Date(travel.travel_end_date);
      const today = new Date();
      today.setDate(today.getDate() - 1);
      today.setHours(0, 0, 0, 0);
      toDate = toDate.getTime() < today.getTime() ? toDate : today;

      let projectlist = await this.tm.getTN("receipt_project_list").getData();
      let org_list = await this.transaction.getExecutedQuery("d_o2c_employee_org", {
        employee_id: request.employee_for,
        is_primary: true,
        loadAll: true,
      });
      let business_area = org_list[0].business_area;
      let location_list = await this.transaction.getExecutedQuery("d_o2c_pd_master", {
        business_area: business_area,
        travel_type: "Local",
        loadAll: true,
      });
      let location = location_list[0].travelling_location;
      let currency = location_list[0].currency_code;
      const projectIds = projectlist.map((project) => project.project_id);
      let pd_list = await this.transaction.getExecutedQuery("q_so_reimb_expense", {
        project_id: projectIds,
        city: location,
        loadAll: true,
      });
      let perdiem = 0;
      if (pd_list.length > 0) {
        perdiem = pd_list[0].applicable_reimb > 0 ? pd_list[0].applicable_reimb : pd_list[0].standard_reimb;
      }

      const ranges = getAvailableDateRanges(fromDate, toDate, isVacationDay, existingDates);
      for (const range of ranges) {
        let workingDays = 0;
        let currentDate = new Date(range.from);

        while (currentDate <= range.to) {
          const day = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
          if (day !== 0 && day !== 6) {
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (workingDays > 0) {
          try {
            declaration_flag = true;
            declaration = await this.tm.getTN("receipt_per_diem").createEntityP(
              {
                from_loc: location,
                to_loc: location,
                from_date: range.from,
                to_date: range.to,
                per_diem: perdiem,
                total_amount: perdiem * workingDays,
                expense_request_id: request.request_id,
                currency_code: currency,
                receipt_id: receipt.receipt_id,
                travel_request_id: travel.request_id,
                no_of_days: workingDays,
                journey_perdiem: perdiem,
              },
              "Creation Successful",
              "Creation Failed"
            );
          } catch (error) {
            console.error("Error creating per diem entry for local travel (excluding weekends):", error);
          }
        }
      }
      // Build a Set of all dates the system created per diem for
      const calculatedPerDiemDates = new Set<string>();
      for (const range of ranges) {
        let current = new Date(range.from);
        while (current <= range.to) {
          calculatedPerDiemDates.add(current.toDateString());
          current.setDate(current.getDate() + 1);
        }
      }

      // Now loop from travel start to end
      let checklistDate = new Date(fromDate);
      while (checklistDate <= toDate) {
        const dayStr = checklistDate.toLocaleDateString("en-US", { weekday: "long" });
        //const isChecked = calculatedPerDiemDates.has(checklistDate.toDateString());
        const day = checklistDate.getDay(); // 0 = Sun, 6 = Sat
        let c = 0;
        const isWeekend = day === 0 || day === 6;
        const isChecked = !isWeekend && ranges.some(range =>
          checklistDate >= new Date(range.from) && checklistDate <= new Date(range.to)
        );
        try {
          await this.tm.getTN("r_local_perdiem").createEntityP(
            {
              per_date: new Date(checklistDate),
              per_day: dayStr,
              claim: isChecked,
              per_amount: perdiem,
              receipt_id: receipt.request_id,
              pd_id: declaration.perdiem_guid
            },
            "Checklist Entry Created",
            "Checklist Entry Failed", null, 'Last'
          );
          c++;
        } catch (error) {
          console.error("Checklist creation failed for date", checklistDate, error);
        }
        await this.tm.getTN("relation_screen_length").setProperty("local_pd", c);
        checklistDate.setDate(checklistDate.getDate() + 1);
      }

    } else {
      let journeys = await travel.r_travel_journey.fetch();
      if (!journeys?.length) {
        console.warn("No travel journeys found.");
        return;
      }

      const travelEndDate = new Date(travel.travel_end_date);
      const today = new Date();
      today.setDate(today.getDate() - 1);
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < journeys.length; i++) {
        const currentJourney = journeys[i];
        const nextJourney = journeys[i + 1];
        let fromDate = new Date(currentJourney.departure);
        let toDate;

        if (
          nextJourney &&
          new Date(nextJourney.departure).getTime() !== travelEndDate.getTime() &&
          currentJourney.to_location != journeys[0].from_location
        ) {
          toDate = new Date(nextJourney.departure);
          toDate = toDate.getTime() < today.getTime() ? toDate : today;
          toDate.setDate(toDate.getDate() - 1);
        } else {
          if (currentJourney.to_location === journeys[0].from_location) continue;
          if (new Date(currentJourney.departure).getTime() < travelEndDate.getTime())
            toDate = travelEndDate.getTime() < today.getTime() ? travelEndDate : today;
        }

        const ranges = getAvailableDateRanges(fromDate, toDate, isVacationDay, existingDates);
        for (const range of ranges) {
          const numDays = Math.floor((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
          if (numDays > 0) {
            try {
              declaration_flag = true
              declaration = await this.tm.getTN("receipt_per_diem").createEntityP(
                {
                  from_loc: currentJourney.from_location,
                  to_loc: currentJourney.to_location,
                  from_date: range.from,
                  to_date: range.to,
                  per_diem: currentJourney.per_diem_amount,
                  total_amount: currentJourney.per_diem_amount * numDays,
                  expense_request_id: request.request_id,
                  currency_code: currentJourney.currency_code,
                  receipt_id: receipt.receipt_id,
                  travel_request_id: travel.request_id,
                  no_of_days: numDays,
                  journey_perdiem: currentJourney.per_diem_amount,
                },
                "Creation Successful",
                "Creation Failed"
              );
            } catch (error) {
              console.error("Error creating per diem entry:", error);
            }
          }
        }
      }
    }
    if (declaration_flag == true) {
      declaration_flag = false
      let exchangedata = await this.transaction.getExecutedQuery("q_exchange_rate", {
        loadAll: true,
        project_currency: declaration.currency_code,
        project_created_date: new Date(),
        partialSelected: ["currency_rate"],
      });
      receipt.receipt_date = new Date();
      receipt.currency_code = declaration.currency_code;
      receipt.exchange_rate = exchangedata?.length === 1 ? exchangedata[0].currency_rate : 0;
      receipt.business_purpose = "Per Diem Declaration";
    }
    await this.receipt_per_diem_calculation();
    await this.tm.getTN("receipt_per_diem").applysortP("from_date", "ASC");
  }
  public async refresh_per_diem_vacation() {
    let request = await this.tm.getTN("expense_detail").getData();
    let travel = await this.tm.getTN("expense_travel_detail").getData();
    let perdiem_list = await this.tm.getTN("receipt_per_diem").getData();
    let vacation_list = await this.transaction.getExecutedQuery(
      "q_travel_vacation",
      {
        employee_id: request.employee_for,
        starting_date: travel.travel_start_date,
        ending_date: travel.travel_end_date,
        loadAll: true,
        skipMap: true,
      }
    );
    perdiem_list.forEach((perdiem) => {
      let fromDate = new Date(perdiem.from_date);
      let toDate = new Date(perdiem.to_date);
      let numDays = 0;
      let tempDate = new Date(fromDate);
      while (tempDate.getTime() <= toDate.getTime()) {
        let isVacation = vacation_list.some(
          (vacation) =>
            tempDate.getTime() >= new Date(vacation.start_date).getTime() &&
            tempDate.getTime() <= new Date(vacation.end_date).getTime()
        );

        if (!isVacation) numDays++;
        tempDate.setDate(tempDate.getDate() + 1);
      }

      perdiem.no_of_days = numDays;
      perdiem.total_amount = numDays * Number(perdiem.per_diem);
    });
    await this.receipt_per_diem_calculation();
  }
  public async per_diem_declaration_calculation() {
    let receipt = await this.tm.getTN("expense_receipt_detail").getData();
    let perdiem_list = await this.tm.getTN("receipt_per_diem").getData();
    let allowance = await this.transaction.getExecutedQuery("d_general_confg", {
      key: [
        "per_diem_lunch_allowance",
        "per_diem_dinner_allowance",
        "per_diem_client_allowance",
      ],
      high_value: receipt.currency_code,
      loadAll: true,
      skipMap: true,
    });
    let k = allowance.filter(
      (allowance) => allowance.key === "perdiem_lunch_allowance"
    );
    let l = allowance.filter(
      (allowance) => allowance.key === "perdiem_dinner_allowance"
    );
    let m = allowance.filter(
      (allowance) => allowance.key === "perdiem_client_allowance"
    );
    for (let i = 0; i < perdiem_list.length; i++) {
      let per_diem = Number(perdiem_list[i].journey_perdiem);
      if (perdiem_list[i].la == true) {
        perdiem_list[i].per_diem = per_diem - k[0].low_value;
        per_diem = per_diem - k[0].low_value;
      }
      if (perdiem_list[i].da == true) {
        perdiem_list[i].per_diem = per_diem - l[0].low_value;
        per_diem = per_diem - k[0].low_value;
      }
      if (perdiem_list[i].ca == true) {
        perdiem_list[i].per_diem = per_diem - m[0].low_value;
        per_diem = per_diem - k[0].low_value;
      }
      if (
        perdiem_list[i].la == false &&
        perdiem_list[i].da == false &&
        perdiem_list[i].ca == false
      ) {
        perdiem_list[i].per_diem = perdiem_list[i].journey_perdiem;
      }
      perdiem_list[i].total_amount =
        perdiem_list[i].no_of_days * perdiem_list[i].per_diem;
    }
    await this.receipt_per_diem_calculation();
  }
  public async receipt_per_diem_calculation() {
    let receipt = await this.tm.getTN("expense_receipt_detail").getData();
    let perdiem_list = await this.tm.getTN("receipt_per_diem").getData();
    let total_amount = 0;
    for (let i = 0; i < perdiem_list.length; i++) {
      total_amount += Number(perdiem_list[i].total_amount);
    }
    receipt.receipt_amount = total_amount;
    receipt.expense_amount = total_amount;
    receipt.reimbursement_amount = total_amount * receipt.exchange_rate;
  }
  public async vacation_approval_check() {
    let receipt = await this.tm.getTN("expense_detail").getData();
    let travel = await this.tm.getTN("expense_travel_detail").getData();
    if (!travel) {
      let travel_list = await this.transaction.getExecutedQuery(
        "d_o2c_travel_header",
        {
          request_id: receipt.travel_request_id,
          loadAll: true,
          skipMap: true,
        }
      );
      travel = travel_list[0];
    }
    const applied_leaves = await this.transaction.getExecutedQuery(
      "q_expense_approved_vacation",
      {
        employee_i: receipt.employee_for,
        from_date: travel.travel_start_date,
        to_date: travel.travel_end_date,
        loadAll: true,
      }
    );
    if (applied_leaves.length == 0) return true;
    else return false;
  }
  public async ondatechange() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt = await this.tm.getTN("expense_receipt_list").getData()[index];
    let detail = await this.tm.getTN("expense_detail").getData();
    if (detail.travel_request_id) {
      let travel = await detail.r_expense_travel.fetch();
      if (
        receipt.receipt_date.getTime() <
        new Date(
          travel[0].travel_start_date.getTime() - 24 * 60 * 60 * 1000
        ) ||
        receipt.receipt_date.getTime() >
        new Date(travel[0].travel_end_date.getTime() + 24 * 60 * 60 * 1000)
      ) {
        sap.m.MessageBox.error("Expense Outside Travelling Days.", {
          title: "Expense Timeline",
        });
        await this.tm.getTN("receipt_date_check").setProperty("check", true);
        receipt.receipt_date = undefined;
      } else {
        await this.tm.getTN("receipt_date_check").setProperty("check", false);
      }
    } else {
      await this.tm.getTN("receipt_date_check").setProperty("check", false);
    }
    // let currentDate = new Date(receipt.s_created_on);
    // const filingDeadline = new Date(receipt.receipt_date.getFullYear(), receipt.receipt_date.getMonth() + 1, 10); // Set to the 10th day of next month
    // Check if filing is allowed
    // if (currentDate.getTime() <= filingDeadline.getTime()) {
    // 	await this.tm.getTN("receipt_date_check").setProperty('check',false);
    await this.exchangerate();
    // } else {
    //   console.log("Expense filing period has expired.");
    //   sap.m.MessageBox.error("Expense filing period has expired.", { title: "Expense Expired", });
    //   await this.tm.getTN("receipt_date_check").setProperty('check',true);
    // }
    await this.onInvoiceChange();
  }

  public async projectexceedcheck() {
    let request = await this.tm.getTN("expense_detail").getData();
    const receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    const project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: request.request_id,
        loadAll: true,
      });
    const projectIds = project_list.map((item) => item.project_id);
    const currentDate = new Date();
    const so_project_list = await this.transaction.getExecutedQuery(
      "d_o2c_project_header",
      { project_id: projectIds, expandAll: "r_project_so", loadAll: true }
    );
    const currencyArray = so_project_list.map(
      (item) => item.r_project_so[0].currency
    );
    let exchangedata = await this.transaction.getExecutedQuery(
      "q_exchange_rate",
      {
        loadAll: true,
        project_currency: currencyArray,
        project_created_date: currentDate,
        partialSelected: ["currency_rate"],
      }
    );
    let reimbursement_amount = 0;
    for (let i = 0; i < receipt_list.length; i++) {
      reimbursement_amount =
        reimbursement_amount + receipt_list[i].reimbursement_amount;
    }
    const splitDict = Object.fromEntries(
      project_list.map((item) => [item.project_id, item])
    );

    // Convert exchange_data into a lookup dictionary
    const exchangeDict = Object.fromEntries(
      exchangedata.map((item) => [item.currency_code, item.currency_rate])
    );

    // Merge data
    const mergedData = so_project_list.map((project) => {
      const currency = project.r_project_so[0]?.currency || "N/A"; // Default to "N/A" if missing
      const splitInfo = splitDict[project.project_id] || {
        split_percent: 0,
        po_no: "N/A",
      };
      const currencyRate = exchangeDict[currency] || 1;
      const splitAmount =
        (reimbursement_amount * splitInfo.split_percent) / 100;
      const convertedAmount = splitAmount / currencyRate;
      return {
        Project_ID: project.project_id,
        PO_No: splitInfo.po_no,
        Currency: currency,
        Split_Percent: splitInfo.split_percent, // Default to 0 if missing
        Currency_Rate: exchangeDict[currency] || "N/A",
        Split_Reimbursement: convertedAmount.toFixed(2), // Default to "N/A" if not found
      };
    });
    let exceed_amount = 0;
    for (let i = 0; i < mergedData.length; i++) {
      if (mergedData[i].PO_No) {
        let error_check = await salesorder.fnExceedExpense(
          this.transaction,
          parseFloat(mergedData[i].Split_Reimbursement),
          mergedData[i].Project_ID,
          mergedData[i].PO_No
        );
        exceed_amount = exceed_amount + error_check * mergedData[i].Currency_Rate;
      }
    }
    if (exceed_amount > 0) {
      request.exceeding_amount = exceed_amount;
    } else {
      request.exceeding_amount = undefined;
    }
  }
  public async onsoenter(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/receipt_project_list/", ""));
    let project = await this.tm.getTN("receipt_project_list").getData()[index];
    let so_list = await this.transaction.getExecutedQuery("d_o2c_so_hdr", {
      so: project.so,
    });
    let soGuid = so_list[0].so_guid;
    await this.navTo({ TS: true, H: true, S: "p_so", AD: soGuid });
  }
  public async onprojectenter(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/receipt_project_list/", ""));
    let project = await this.tm.getTN("receipt_project_list").getData()[index];
    let projectData = await this.transaction.getExecutedQuery(
      "d_o2c_project_header",
      { project_id: project.project_id }
    );
    await this.navTo({
      TS: true,
      H: true,
      S: "p_project",
      AD: projectData[0].project_guid,
    });
  }
  public async declarationtoJourney() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_receipt_list").getData()[index];
    this.journey[0].is_commute_customer = detail.is_lunch_customer;
    this.journey[0].is_commute_customer = detail.is_dinner_customer;
    this.journey[0].is_commute_customer = detail.is_commute_customer;
  }
  public async onAutoAmountCalculation() {
    let expense_index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[
      expense_index
    ];
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_receipt_list").getData()[index];
    const validation_list = await this.transaction.getExecutedQuery(
      "q_expense_validation",
      {
        category_id: expense_detail.category_id,
        business_area: this.business_area,
        employee_role: expense_detail.employee_role_type,
        expense_type: detail.receipt_type,
        loadAll: true,
      }
    );
    let filtered_validation = validation_list;
    if (filtered_validation.length > 0) {
      if (detail.sub_type_check == true && detail.receipt_sub_type) {
        filtered_validation = filtered_validation.filter(
          (item) => item.expense_sub_type === detail.receipt_sub_type
        );
      }
      if (detail.base_area_check == true && detail.base_area == true) {
        filtered_validation = filtered_validation.filter(
          (item) => item.base_area_check === "Base Area"
        );
      } else if (detail.base_area_check == true && detail.base_area == false) {
        filtered_validation = filtered_validation.filter(
          (item) => item.base_area_check === "Outstation"
        );
      }
      if (detail.location_required == true && detail.city_location) {
        const pd_master = await this.transaction.getExecutedQuery(
          "d_o2c_pd_master",
          { travelling_location: detail.city_location, loadAll: true }
        );
        filtered_validation = filtered_validation.filter(
          (item) => item.tier === pd_master[0].city_tier
        );
      }
      const condition = filtered_validation[0].flag_check
      let conditionsArray = condition.split(",");
      if (filtered_validation.length > 0) {
        if (
          conditionsArray.includes("Per KM") &&
          detail.distance_travel_check == true
        ) {
          let per_km_amount = 0;
          if (detail.auto_calculate == true) {
            detail.receipt_amount =
              (filtered_validation[0].expense_limit *
                detail.distance_traveled) /
              (detail.exchange_rate && detail.exchange_rate !== 0
                ? detail.exchange_rate
                : 1);
            detail.expense_amount = detail.receipt_amount;
            if (conditionsArray.includes("Per Head")) {
              detail.reimbursement_amount =
                filtered_validation[0].expense_limit * detail.distance_traveled * detail.r_receipt_attendee.length;
            }
            else {
              detail.reimbursement_amount =
                filtered_validation[0].expense_limit * detail.distance_traveled;
            }
          }
          if (
            detail.reimbursement_amount &&
            detail.reimbursement_amount != 0 &&
            detail.distance_traveled
          ) {
            if (conditionsArray.includes("Per Head")) {
              per_km_amount =
                detail.reimbursement_amount / (detail.distance_traveled * detail.r_receipt_attendee.length);
            }
            else {
              per_km_amount =
                detail.reimbursement_amount / detail.distance_traveled;
            }
          }
          if (per_km_amount > filtered_validation[0].expense_limit) {
            sap.m.MessageBox.error("Expense Amount is Exceeding", {
              title: "Error",
            });
            detail.receipt_amount = 0;
            detail.expense_amount = 0;
            detail.reimbursement_amount = 0;
          }
        } else if (conditionsArray.includes("Per Head") && !conditionsArray.includes("Per KM") && !conditionsArray.includes("Per Day")) {
          if (detail.auto_calculate == true) {
            detail.receipt_amount =
              (filtered_validation[0].expense_limit *
                (detail.r_receipt_attendee.length)) /
              (detail.exchange_rate && detail.exchange_rate !== 0
                ? detail.exchange_rate
                : 1);
            detail.expense_amount = detail.receipt_amount;
            detail.reimbursement_amount =
              filtered_validation[0].expense_limit *
              (detail.r_receipt_attendee.length);
          }
          let per_attendees_amount =
            detail.reimbursement_amount /
            (detail.r_receipt_attendee.length);
          if (per_attendees_amount > filtered_validation[0].expense_limit) {
            sap.m.MessageBox.error("Expense Amount is Exceeding", {
              title: "Error",
            });
            detail.receipt_amount = 0;
            detail.expense_amount = 0;
            detail.reimbursement_amount = 0;
          }
        } else if (conditionsArray.includes("Per Day")) {
          let per_day_amount = 0;
          if (detail.auto_calculate == true) {
            detail.receipt_amount =
              (filtered_validation[0].expense_limit * detail.number_of_days) /
              (detail.exchange_rate && detail.exchange_rate !== 0
                ? detail.exchange_rate
                : 1);
            detail.expense_amount = detail.receipt_amount;
            if (conditionsArray.includes("Per Head")) {
              detail.reimbursement_amount =
                filtered_validation[0].expense_limit * detail.number_of_days * detail.r_receipt_attendee.length;
            }
            else {
              detail.reimbursement_amount =
                filtered_validation[0].expense_limit * detail.number_of_days;
            }
          }
          if (detail.number_of_days && detail.number_of_days > 0) {
            if (conditionsArray.includes("Per Head")) {
              per_day_amount =
                detail.reimbursement_amount / (detail.number_of_days * detail.r_receipt_attendee.length);
            } else {
              per_day_amount =
                detail.reimbursement_amount / detail.number_of_days;
            }
          }
          if (per_day_amount > filtered_validation[0].expense_limit) {
            sap.m.MessageBox.error("Expense Amount is Exceeding", {
              title: "Error",
            });
            detail.receipt_amount = 0;
            detail.expense_amount = 0;
            detail.reimbursement_amount = 0;
          }
        } else {
          if (detail.auto_calculate == true) {
            detail.receipt_amount =
              filtered_validation[0].expense_limit /
              (detail.exchange_rate && detail.exchange_rate !== 0
                ? detail.exchange_rate
                : 1);
            detail.expense_amount = detail.receipt_amount;
            detail.reimbursement_amount = filtered_validation[0].expense_limit;
          }
          if (
            detail.reimbursement_amount > filtered_validation[0].expense_limit
          ) {
            sap.m.MessageBox.error("Expense Amount is Exceeding", {
              title: "Error",
            });
            detail.receipt_amount = 0;
            detail.expense_amount = 0;
            detail.reimbursement_amount = 0;
          }
        }
      }
    }
  }
  public async td_so_check() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    const receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    const projectIds = project_list.map((item) => item.project_id);
    const currentDate = new Date();
    const so_project_list = await this.transaction.getExecutedQuery(
      "d_o2c_project_header",
      { project_id: projectIds, expandAll: "r_project_so", loadAll: true }
    );
    const currencyArray = so_project_list.map(
      (item) => item.r_project_so[0].currency
    );
    let exchangedata = await this.transaction.getExecutedQuery(
      "q_exchange_rate",
      {
        loadAll: true,
        project_currency: currencyArray,
        project_created_date: currentDate,
        partialSelected: ["currency_rate"],
      }
    );
    let reimbursement_amount = 0;
    for (let i = 0; i < receipt_list.length; i++) {
      reimbursement_amount =
        reimbursement_amount + parseFloat(receipt_list[i].reimbursement_amount);
    }
    const splitDict = Object.fromEntries(
      project_list.map((item) => [item.project_id, item])
    );
    // Convert exchange_data into a lookup dictionary
    const exchangeDict = Object.fromEntries(
      exchangedata.map((item) => [item.currency_code, item.currency_rate])
    );
    // Merge data
    const mergedData = so_project_list.map((project) => {
      const currency = project.r_project_so[0]?.currency || "N/A"; // Default to "N/A" if missing
      const splitInfo = splitDict[project.project_id] || {
        split_percent: 0,
        po_no: "N/A",
      };
      const currencyRate = exchangeDict[currency] || 1;
      const splitAmount =
        (reimbursement_amount * splitInfo.split_percent) / 100;
      const convertedAmount = splitAmount / currencyRate;
      return {
        Project_ID: project.project_id,
        PO_No: splitInfo.po_no,
        Currency: currency,
        Split_Percent: splitInfo.split_percent, // Default to 0 if missing
        Currency_Rate: exchangeDict[currency] || "N/A",
        Split_Reimbursement: convertedAmount.toFixed(2), // Default to "N/A" if not found
      };
    });
    let so_check = true;
    for (let i = 0; i < mergedData.length; i++) {
      let error_check = await salesorder.fnAutoFillExpenseInSO(
        this.transaction,
        mergedData[i].Project_ID,
        mergedData[i].PO_No,
        parseFloat(mergedData[i].Split_Reimbursement),
        detail.descript,
        detail.request_id,
        "Expense API"
      );
      if (error_check == 1) {
        sap.m.MessageBox.error("Expense Amount is Exceeding", {
          title: "Error",
        });
        so_check = false;
        break;
      } else if (error_check == 2) {
        sap.m.MessageBox.error("Expense Amount not Maintained", {
          title: "Error",
        });
        so_check = false;
        break;
      }
    }
    if (so_check == true) await this.approveExpense();
  }
  public async so_check() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    const match = detail.total_amount.match(/\d+(\.\d+)?/); // Handles integers and decimals
    const floatValue = match ? parseFloat(match[0]) : null;
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    if (project_list[0].po_no) {
      let error_check = await salesorder.fnAutoFillExpenseInSO(
        this.transaction,
        project_list[0].project_id,
        project_list[0].po_no,
        floatValue,
        detail.descript,
        detail.request_id
      );
      if (error_check == 1) {
        sap.m.MessageBox.error("Expense Amount is Exceeding", { title: "Error" });
      } else if (error_check == 2) {
        sap.m.MessageBox.error("Expense Amount not Maintained", {
          title: "Error",
        });
      }
    }
  }
  public async saveExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    if (detail.expense_status == "New")
      detail.expense_status = "Saved as Draft";
    if (detail.travel_request_id) {
      const currencyTotals: { [key: string]: number } = {};
      const advanceTotals: { [key: string]: number } = {};
      const totalAmounts: { [key: string]: number } = {};
      const ExpenseTotals: { [key: string]: number } = {};
      const TransactionTotals: { [key: string]: number } = {};
      let travel_list = await this.transaction.getExecutedQuery(
        "d_o2c_travel_header",
        { request_id: detail.travel_request_id, expenadAll: true }
      );
      let expenses_list = await travel_list[0].r_travel_expense.fetch();
      let expenses_filteredlist = expenses_list.filter(
        (item) =>
          item.expense_status != "Rejected" &&
          item.expense_status != "Cancelled"
      );
      if (
        expenses_filteredlist.length !== undefined &&
        expenses_filteredlist.length > 0
      ) {
        let each_expense;
        for (let i = 0; i < expenses_filteredlist.length; i++) {
          each_expense = expenses_filteredlist[i].total_amount;
          const currencyTotals: { [key: string]: number } = {};
          const currencyPairs = each_expense.split(", ");
          for (let pair of currencyPairs) {
            const [currency, amount] = pair.split(": ");
            currencyTotals[currency] = parseFloat(amount);
          }
          let each_expense_object = currencyTotals;
          for (const [currency_code, amount] of Object.entries(
            each_expense_object
          )) {
            if (ExpenseTotals[currency_code]) {
              ExpenseTotals[currency_code] += parseFloat(amount);
            } else {
              ExpenseTotals[currency_code] = parseFloat(amount);
            }
          }
        }
        for (const currency_code of Object.keys(ExpenseTotals)) {
          totalAmounts[currency_code] = ExpenseTotals[currency_code];
        }
      }
      const totalAmountString = Object.entries(totalAmounts)
        .map(([currency, amount]) => `${currency}: ${amount}`)
        .join(", ");
      travel_list[0].totalamount = totalAmountString;
      let transaction_list = await travel_list[0].r_travel_transaction.fetch();
      for (let i = 0; i < transaction_list.length; i++) {
        const { currency_code, transaction_amount } = transaction_list[i];
        const amount = parseFloat(transaction_amount);

        if (TransactionTotals[currency_code]) {
          TransactionTotals[currency_code] += amount;
        } else {
          TransactionTotals[currency_code] = amount;
        }
      }
      const totalsTransaction = Object.entries(TransactionTotals)
        .map(([currency, amount]) => `${currency}: ${amount.toFixed(2)}`)
        .join(", ");
      travel_list[0].totaltransaction = totalsTransaction;
      const Totals = await this.StringtoObject(travel_list[0].totalamount);
      const remainingPerDiem: { [key: string]: number } = {};
      for (let currency in { ...Totals, ...TransactionTotals }) {
        const Amount = Totals[currency] || 0;
        const transactionAmount = TransactionTotals[currency] || 0;
        remainingPerDiem[currency] = Amount - transactionAmount;
      }
      const totalsString = Object.entries(remainingPerDiem)
        .map(([currency, amount]) => `${currency}: ${amount.toFixed(2)}`)
        .join(", ");
      travel_list[0].remainingbalance = totalsString;
    }
    let project = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    if (project.length > 0 && project[0].po_no) {
      await this.projectexceedcheck();
    }
    // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    await this.retrySave("Saved Successfully", "Save Failed");
  }
  public async StringtoObject(stringAmount: string) {
    const currencyTotals: { [key: string]: number } = {};
    const currencyPairs = stringAmount.split(", ");
    for (let pair of currencyPairs) {
      const [currency, amount] = pair.split(": ");
      currencyTotals[currency] = parseFloat(amount);
    }
    return currencyTotals;
  }
  public async discardChangesExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    await this.transaction.rollback();
    let receipt = await detail.r_expense_receipt.fetch();
    await this.tm
      .getTN("relation_screen_length")
      .setProperty("receipt", receipt.length);
    this.setMode("DISPLAY");
    if (detail.expense_status == "New")
      await this.navTo({
        TS: true,
        H: true,
        S: "p_expense_page",
        SS: "pa_front_list",
      });
  }
  //SUBMIT EXPENSE
  public async submitExpense() {
    let project_id_array = [];
    let notif_to = "";
    let notif_cc = new Set();
    let entity_profit = new Set();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    let role_store = this.role_id;
    let receipt = false;
    let split_check = false;
    let pc_store = this.UserOrg[0].profit_centre;
    let receiptlist = await this.tm.getTN("expense_receipt_list").getData();
    let emp_designation = await this.transaction.getExecutedQuery(
      "q_emp_current_designation",
      {
        loadAll: true,
        des_emp_id: detail.employee_for,
        fdate: new Date().getTime(),
        tdate: new Date().getTime(),
      }
    );
    if (emp_designation.length > 0) {
      for (let i = 0; i < receiptlist.length && receipt == false; i++) {
        if (
          receiptlist[i].receipt_date == undefined ||
          receiptlist[i].receipt_date == null
        ) {
          sap.m.MessageBox.error(
            "No Receipt Date Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_amount == undefined ||
          receiptlist[i].receipt_amount == null ||
          detail.receipt_amount == 0
        ) {
          sap.m.MessageBox.error(
            "No Receipt Amount Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (receiptlist[i].business_purpose == undefined) {
          sap.m.MessageBox.error(
            "Business Purpose Not Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].currency_code == undefined ||
          receiptlist[i].currency_code == null
        ) {
          sap.m.MessageBox.error(
            "No Currency Code Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_filename == undefined &&
          receiptlist[i].attach_req == true
        ) {
          sap.m.MessageBox.error(
            "No Receipt Attachment Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_sub_type == undefined &&
          receiptlist[i].sub_type_check == true
        ) {
          sap.m.MessageBox.error(
            "No Receipt Sub Type Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (!receiptlist[i].receipt_type) {
          sap.m.MessageBox.error(
            "No Receipt Type Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].city_location == undefined &&
          receiptlist[i].location_required == true
        ) {
          sap.m.MessageBox.error(
            "No City Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].number_of_days == undefined ||
            receiptlist[i].number_of_days == 0) &&
          receiptlist[i].no_of_days_check == true
        ) {
          sap.m.MessageBox.error(
            "No Days Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].from_loc == undefined ||
            receiptlist[i].to_loc == undefined ||
            receiptlist[i].from_loc == "" ||
            receiptlist[i].to_loc == "") &&
          receiptlist[i].distance_travel_check == true
        ) {
          sap.m.MessageBox.error(
            "No Location Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].distance_traveled == undefined ||
            receiptlist[i].distance_traveled == 0) &&
          receiptlist[i].distance_travel_check == true
        ) {
          sap.m.MessageBox.error(
            "No Distance Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        }
      } if (project_list.length == 0) {
        sap.m.MessageBox.error("Please Add Project", { title: "Error" });
      } else if (receipt == true) {
        //no message as it is already showing
      } else if (emp_designation.length == 0) {
        sap.m.MessageBox.error("Please Ask HR to add Designation", {
          title: "Error",
        });
      } else if (detail.descript == undefined || detail.descript == "") {
        sap.m.MessageBox.error("Provide Description", { title: "Error" });
      } else {
        if (detail.created_by != detail.employee_for) {
          let role_list = await this.transaction.getExecutedQuery(
            "d_second_role_assyn",
            {
              employee_id: detail.employee_for,
              page_name: "Expense Page",
              loadAll: true,
            }
          );
          if (role_list.length) {
            role_store = role_list[0].assyned_role;
            let userorg = await this.transaction.getExecutedQuery(
              "d_o2c_employee_org",
              {
                employee_id: detail.employee_for,
                is_primary: true,
                loadAll: true,
              }
            );
            pc_store = userorg[0].profit_centre;
          } else {
            let emp_designation = await this.transaction.getExecutedQuery(
              "q_emp_current_designation",
              {
                loadAll: true,
                des_emp_id: detail.employee_for,
                fdate: new Date().getTime(),
                tdate: new Date().getTime(),
              }
            );
            let emp_designation_name = await this.transaction.getExecutedQuery(
              "d_o2c_designation_master",
              { designation_id: emp_designation[0].designation, loadAll: true }
            );
            role_store = emp_designation_name[0].name;
            let userorg = await this.transaction.getExecutedQuery(
              "d_o2c_employee_org",
              {
                employee_id: detail.employee_for,
                is_primary: true,
                loadAll: true,
              }
            );
            pc_store = userorg[0].profit_centre;
          }
        }
        detail.expense_status = "Submitted";
        detail.submission_date = new Date();
        await detail.r_workflow_log.fetch();
        let workflow_list = detail.r_workflow_log[0];
        workflow_list.approver = this.UserInfo[0].employee_id;
        workflow_list.role = this.role_id;
        workflow_list.s_status = "Submitted";
        workflow_list.approved_on = new Date();
        if (
          role_store != "TEAM_HEAD" &&
          role_store != "SALES" &&
          role_store != "FINANCE" &&
          role_store != "SM"
        ) {
          for (let i = 0; i < project_list.length; i++) {
            project_id_array[i] = project_list[i].project_id;
          }
          let task_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_pm",
            { project_search_id: project_id_array, loadAll: true }
          );
          for (let i = 0; i < task_list.length; i++) {
            if (
              !entity_profit.has(task_list[i].project_manager.toUpperCase()) &&
              task_list[i].project_manager.toUpperCase() !=
              detail.employee_for.toUpperCase()
            ) {
              entity_profit.add(task_list[i].project_manager.toUpperCase());
              notif_cc.add(task_list[i].project_manager);
            }
          }
          const entityProfitArray = Array.from(entity_profit);
          for (let i = 0; i < entity_profit.size; i++) {
            await this.tm.getTN("expense_workflow_list").createEntityP(
              {
                role: "PM",
                approver: entityProfitArray[i],
                created_on: new Date(),
                s_status: "In-Progress",
                profit_center: pc_store,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
            let receipt_list = await this.tm
              .getTN("expense_receipt_list")
              .getData();
            for (let j = 0; j < receipt_list.length; j++) {
              await this.tm.getTN("expense_receipt_list").setActive(j);
              let receipt_detail = await this.tm
                .getTN("expense_receipt_list")
                .getData()[j];
              await this.tm.getTN("verification_list").createEntityP(
                {
                  receipt_id: receipt_detail.receipt_id,
                  employee_id: entityProfitArray[i],
                  verification_check: false,
                },
                "Creation Successful",
                "Creation Failed",
                null,
                "First",
                false,
                false,
                false
              );
            }
          }
          if (entity_profit.size == 0) {
            let team_head_list = await this.transaction.getExecutedQuery(
              "d_o2c_profit_centre",
              { profit_center: pc_store, loadAll: true }
            );
            let team_head = team_head_list[0].team_head;
            notif_cc.add(team_head_list[0].team_head);
            await this.tm.getTN("expense_workflow_list").createEntityP(
              {
                role: "TEAM_HEAD",
                approver: team_head,
                created_on: new Date(),
                s_status: "In-Progress",
                profit_center: pc_store,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
            let receipt_list = await this.tm
              .getTN("expense_receipt_list")
              .getData();
            for (let j = 0; j < receipt_list.length; j++) {
              await this.tm.getTN("expense_receipt_list").setActive(j);
              let receipt_detail = await this.tm
                .getTN("expense_receipt_list")
                .getData()[j];
              await this.tm.getTN("verification_list").createEntityP(
                {
                  receipt_id: receipt_detail.receipt_id,
                  employee_id: team_head,
                  verification_check: false,
                },
                "Creation Successful",
                "Creation Failed",
                null,
                "First",
                false,
                false,
                false
              );
            }
          }
        } else if (role_store == "TEAM_HEAD") {
          let finance_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_all_emp",
            { name: "FINANCE", loadAll: true }
          );
          for (let i = 0; i < finance_list.length; i++) {
            notif_cc.add(finance_list[i].employee_id);
          }
          let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "FINANCE", page_name: "Expense Page", loadAll: true });
          for (let i = 0; i < travel_desk_list.length; i++) {
            notif_cc.add(travel_desk_list[i].employee_id);
          }
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "FINANCE",
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: pc_store,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          let receipt_list = await this.tm
            .getTN("expense_receipt_list")
            .getData();
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getData()[j];
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: "FINANCE",
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        } else if (role_store == "SM") {
          let team_head_list = await this.transaction.getExecutedQuery(
            "d_o2c_profit_centre",
            { profit_center: pc_store, loadAll: true }
          );
          let team_head = team_head_list[0].team_head;
          if (this.login_id.toUpperCase() != team_head.toUpperCase()) {
            notif_cc.add(team_head_list[0].team_head);
            await this.tm.getTN("expense_workflow_list").createEntityP(
              {
                role: "TEAM_HEAD",
                approver: team_head,
                created_on: new Date(),
                s_status: "In-Progress",
                profit_center: pc_store,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
            let receipt_list = await this.tm
              .getTN("expense_receipt_list")
              .getData();
            for (let j = 0; j < receipt_list.length; j++) {
              await this.tm.getTN("expense_receipt_list").setActive(j);
              let receipt_detail = await this.tm
                .getTN("expense_receipt_list")
                .getData()[j];
              await this.tm.getTN("verification_list").createEntityP(
                {
                  receipt_id: receipt_detail.receipt_id,
                  employee_id: team_head,
                  verification_check: false,
                },
                "Creation Successful",
                "Creation Failed",
                null,
                "First",
                false,
                false,
                false
              );
            }
          } else {
            let finance_list = await this.transaction.getExecutedQuery(
              "q_travel_expense_all_emp",
              { name: "FINANCE", loadAll: true }
            );
            for (let i = 0; i < finance_list.length; i++) {
              notif_cc.add(finance_list[i].employee_id);
            }
            await this.tm.getTN("expense_workflow_list").createEntityP(
              {
                role: "FINANCE",
                created_on: new Date(),
                s_status: "In-Progress",
                profit_center: pc_store,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
            let receipt_list = await this.tm
              .getTN("expense_receipt_list")
              .getData();
            for (let j = 0; j < receipt_list.length; j++) {
              await this.tm.getTN("expense_receipt_list").setActive(j);
              let receipt_detail = await this.tm
                .getTN("expense_receipt_list")
                .getData()[j];
              await this.tm.getTN("verification_list").createEntityP(
                {
                  receipt_id: receipt_detail.receipt_id,
                  employee_id: "FINANCE",
                  verification_check: false,
                },
                "Creation Successful",
                "Creation Failed",
                null,
                "First",
                false,
                false,
                false
              );
            }
          }
        } else if (role_store == "SALES") {
          let sales_manager_list = await this.transaction.getExecutedQuery(
            "d_second_role_assyn",
            { assyned_role: "SM", page_name: "Expense Page", loadAll: true }
          );
          for (let i = 0; i < sales_manager_list.length; i++) {
            notif_cc.add(sales_manager_list[i].employee_id);
          }
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "SM",
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: pc_store,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          let receipt_list = await this.tm
            .getTN("expense_receipt_list")
            .getData();
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getData()[j];
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: "SM",
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        } else if (role_store == "FINANCE") {
          let finance_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_all_emp",
            { name: "FINANCE", loadAll: true }
          );
          for (let i = 0; i < finance_list.length; i++) {
            notif_cc.add(finance_list[i].employee_id);
          }
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "FINANCE",
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: pc_store,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          let receipt_list = await this.tm
            .getTN("expense_receipt_list")
            .getData();
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getData()[j];
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: "FINANCE",
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        }
        for (let i = 0; i < receiptlist.length; i++) {
          receiptlist[i].receipt_appr_status = "Pending";
        }
        notif_to = detail.created_by;
        const notif_cc_array = Array.from(notif_cc);
        for (let i = 0; i < notif_cc_array.length; i++) {
          notif_cc_array[i] = notif_cc_array[i].toLowerCase();
        }
        await this.tm.getTN("expense_notification_search").setProperty("expense", detail.request_id);
        await this.tm.getTN("expense_notification_search").setProperty("notif_to", notif_to);
        await this.tm.getTN("expense_notification_search").setProperty("approver", null);
        await this.tm.getTN("expense_notification_search").setProperty("notif_cc", notif_cc_array);
        await this.tm.getTN("expense_notification_search").setProperty("type", "Submit");
        await this.tm.getTN("expense_notification_search").executeP();
        await this.tm.getTN("logged_employee").setProperty("pending_for_comment", "false");
        await this.tm.getTN("logged_employee").setProperty("pending_for_approval", "false");
        // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
        await this.retrySave("Saved Successfully", "Save Failed");
        await this.tm.getTN("expense_workflow_list").refresh();
      }
    }
  }
  public async approveExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_detail").getData();
    let receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    let notif_to = "";
    let count = 0;
    let notif_cc = new Set();
    let workflow_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_workflow",
      { request_id: detail.request_id, loadAll: true, skipMap: true }
    );
    let workflow_transnode = await this.tm
      .getTN("expense_workflow_list")
      .getData();
    if (this.role_id == "TEAM_HEAD") {
      let inprocess_count = 0;
      let profit_center = "";
      for (let i = 0; i < workflow_list.length; i++) {
        if (
          workflow_list[i].approver.toUpperCase() ==
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Approved";
          workflow_transnode[i].s_status = "Approved";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
        } else if (
          workflow_list[i].approver.toUpperCase() !=
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          inprocess_count = inprocess_count + 1;
          notif_cc.add(workflow_list[i].approver);
        }
      }
      if (inprocess_count == 0) {
        detail.expense_status = "Approved by Team Head";
        let finance_list = await this.transaction.getExecutedQuery(
          "q_travel_expense_all_emp",
          { name: "FINANCE", loadAll: true }
        );
        for (let i = 0; i < finance_list.length; i++) {
          notif_cc.add(finance_list[i].employee_id);
        }
        let secondary_finance_list = await this.transaction.getExecutedQuery(
          "d_second_role_assyn",
          { assyned_role: "FINANCE", page_name: "Expense Page", loadAll: true }
        );
        for (let i = 0; i < secondary_finance_list.length; i++) {
          notif_cc.add(secondary_finance_list[i].employee_id);
        }
        await this.tm.getTN("expense_workflow_list").createEntityP(
          {
            role: "FINANCE",
            created_on: new Date(),
            s_status: "In-Progress",
            profit_center: profit_center,
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          false,
          false,
          false
        );
        for (let j = 0; j < receipt_list.length; j++) {
          await this.tm.getTN("expense_receipt_list").setActive(j);
          let receipt_detail = await this.tm
            .getTN("expense_receipt_list")
            .getActiveData();
          await this.tm.getTN("verification_list").createEntityP(
            {
              receipt_id: receipt_detail.receipt_id,
              employee_id: "FINANCE",
              verification_check: false,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
        }
      }
    } else if (this.role_id == "SM") {
      let inprocess_count = 0;
      let profit_center = "";
      let approver_flag = false;
      for (let i = 0; i < workflow_list.length; i++) {
        if (
          workflow_list[i].role == "SM" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].approver = this.UserInfo[0].employee_id;
          workflow_transnode[i].approver = this.UserInfo[0].employee_id;
          workflow_list[i].s_status = "Approved";
          workflow_transnode[i].s_status = "Approved";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
          approver_flag = true;
        } else if (
          workflow_list[i].approver.toUpperCase() !=
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].role == "SM" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          inprocess_count = inprocess_count + 1;
          notif_cc.add(workflow_list[i].approver);
          approver_flag = true;
        }
      }
      if (approver_flag == false) {
        for (let i = 0; i < workflow_list.length; i++) {
          if (
            workflow_list[i].approver.toUpperCase() ==
            this.UserInfo[0].employee_id.toUpperCase() &&
            workflow_list[i].s_status == "In-Progress"
          ) {
            workflow_list[i].s_status = "Approved";
            workflow_transnode[i].s_status = "Approved";
            workflow_list[i].approved_on = new Date();
            workflow_transnode[i].approved_on = new Date();
            profit_center = workflow_list[i].profit_center;
            notif_cc.add(workflow_list[i].approver);
          } else if (
            workflow_list[i].approver.toUpperCase() !=
            this.UserInfo[0].employee_id.toUpperCase() &&
            workflow_list[i].s_status == "In-Progress"
          ) {
            inprocess_count = inprocess_count + 1;
            notif_cc.add(workflow_list[i].approver);
          }
        }
      }
      if (inprocess_count == 0) {
        let team_head_list = await this.transaction.getExecutedQuery(
          "d_o2c_profit_centre",
          { profit_center: profit_center, loadAll: true }
        );
        let team_head = team_head_list[0].team_head;
        if (this.login_id.toUpperCase() != team_head.toUpperCase()) {
          detail.expense_status = "Approved by Sales Manager";
          notif_cc.add(team_head);
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "TEAM_HEAD",
              approver: team_head,
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: profit_center,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getActiveData();
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: team_head,
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        } else {
          detail.expense_status = "Approved by Team Head";
          let finance_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_all_emp",
            { name: "FINANCE", loadAll: true }
          );
          for (let i = 0; i < finance_list.length; i++) {
            notif_cc.add(finance_list[i].employee_id);
          }
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "FINANCE",
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: profit_center,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getActiveData();
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: "FINANCE",
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        }
      }
    } else if (this.role_id == "FINANCE") {
      let inprocess_count = 0;
      for (let i = 0; i < workflow_list.length; i++) {
        if (
          workflow_list[i].role == "FINANCE" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].approver = this.UserInfo[0].employee_id;
          workflow_transnode[i].approver = this.UserInfo[0].employee_id;
          workflow_list[i].s_status = "Approved";
          workflow_transnode[i].s_status = "Approved";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
        } else if (
          workflow_list[i].approver != this.UserInfo[0].employee_id &&
          workflow_list[i].role == "FINANCE" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          inprocess_count = inprocess_count + 1;
        }
        if (inprocess_count == 0) {
          let finance_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_all_emp",
            { name: "FINANCE", loadAll: true }
          );
          for (let i = 0; i < finance_list.length; i++) {
            notif_cc.add(finance_list[i].employee_id);
          }
          detail.expense_status = "Approved by Finance";
        }
      }
    } else {
      let inprocess_count = 0;
      let profit_center = "";
      for (let i = 0; i < workflow_list.length; i++) {
        if (
          workflow_list[i].approver.toUpperCase() ==
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].role == "PM" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Approved";
          workflow_transnode[i].s_status = "Approved";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
        } else if (
          workflow_list[i].approver.toUpperCase() !=
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].role == "PM" &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          inprocess_count = inprocess_count + 1;
          count = count + 1;
          notif_cc.add(workflow_list[i].approver);
        }
      }
      if (inprocess_count == 0) {
        let team_head_list = await this.transaction.getExecutedQuery(
          "d_o2c_profit_centre",
          { profit_center: profit_center, loadAll: true }
        );
        let team_head = team_head_list[0].team_head;
        let pm_flag = false;
        for (let i = 0; i < workflow_list.length; i++) {
          if (
            workflow_list[i].approver.toUpperCase() ==
            team_head.toUpperCase() &&
            workflow_list[i].s_status == "Approved"
          ) {
            pm_flag = true;
            break;
          }
        }
        if (pm_flag == false) {
          notif_cc.add(team_head);
          detail.expense_status = "Approved by Project Manager";
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "TEAM_HEAD",
              approver: team_head,
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: profit_center,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getActiveData();
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: team_head,
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        } else {
          detail.expense_status = "Approved by Team Head";
          let finance_list = await this.transaction.getExecutedQuery(
            "q_travel_expense_all_emp",
            { name: "FINANCE", loadAll: true }
          );
          for (let i = 0; i < finance_list.length; i++) {
            notif_cc.add(finance_list[i].employee_id);
          }
          let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "FINANCE", page_name: "Expense Page", loadAll: true });
          for (let i = 0; i < travel_desk_list.length; i++) {
            notif_cc.add(travel_desk_list[i].employee_id);
          }
          await this.tm.getTN("expense_workflow_list").createEntityP(
            {
              role: "FINANCE",
              created_on: new Date(),
              s_status: "In-Progress",
              profit_center: profit_center,
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            false,
            false
          );
          for (let j = 0; j < receipt_list.length; j++) {
            await this.tm.getTN("expense_receipt_list").setActive(j);
            let receipt_detail = await this.tm
              .getTN("expense_receipt_list")
              .getActiveData();
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt_detail.receipt_id,
                employee_id: "FINANCE",
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        }
      }
    }
    for (let i = 0; i < receipt_list.length && this.role_id != "FINANCE"; i++) {
      receipt_list[i].receipt_appr_status = "Pending";
    }
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    await this.tm.getTN("logged_employee").setProperty("pending_for_comment", "false");
    await this.tm.getTN("logged_employee").setProperty("pending_for_approval", "false");
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_notification_search").setProperty("expense", detail.request_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_to", notif_to);
    await this.tm.getTN("expense_notification_search").setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_cc", notif_cc_array);
    if (this.role_id == "FINANCE")
      await this.tm.getTN("expense_notification_search").setProperty("type", "ApproveFIN");
    else if (
      this.role_id != "FINANCE" &&
      this.role_id != "SM" &&
      this.role_id != "TEAM_HEAD" &&
      count != 0
    )
      await this.tm.getTN("expense_notification_search").setProperty("type", "ApprovePM");
    else
      await this.tm.getTN("expense_notification_search").setProperty("type", "Approve");
    await this.tm.getTN("expense_notification_search").executeP();
    await this.tm.getTN("expense_workflow_list").refresh();
    //await this.tm.getTN('expense_workflow_list').resetP(true);
  }
  public async rejectExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let workflow_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_workflow",
      { request_id: detail.request_id, loadAll: true, skipMap: true }
    );
    let workflow_transnode = await this.tm
      .getTN("expense_workflow_list")
      .getData();
    let notif_to = "";
    let notif_cc = new Set();
    for (let i = 0; i < workflow_list.length; i++) {
      if (this.role_id != "FINANCE" && this.role_id != "SM") {
        if (
          workflow_list[i].approver.toUpperCase() ==
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Rejected";
          workflow_transnode[i].s_status = "Rejected";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          notif_cc.add(workflow_list[i].approver);
        } else if (
          workflow_list[i].approver.toUpperCase() !=
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Rejected by Other";
          workflow_transnode[i].s_status = "Rejected by Other";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          notif_cc.add(workflow_list[i].approver);
        }
      } else {
        if (
          workflow_list[i].role == this.role_id &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Rejected";
          workflow_transnode[i].s_status = "Rejected";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          workflow_list[i].approver = this.UserInfo[0].employee_id;
          workflow_transnode[i].approver = this.UserInfo[0].employee_id;
          notif_cc.add(workflow_list[i].approver);
        }
      }
    }
    detail.expense_status = "Rejected";
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    let perdiem = await detail.e_expense_perdiem.fetch();
    for (let i = perdiem.length - 1; i >= 0; i--) {
      await perdiem[i].deleteP();
    }
    await this.tm.getTN("expense_notification_search").setProperty("expense", detail.request_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_to", notif_to);
    await this.tm.getTN("expense_notification_search").setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_cc", notif_cc_array);
    await this.tm.getTN("expense_notification_search").setProperty("type", "Reject");
    await this.tm.getTN("expense_notification_search").executeP();
    await this.tm.getTN("logged_employee").setProperty("pending_for_comment", "false");
    await this.tm.getTN("logged_employee").setProperty("pending_for_approval", "false");
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_workflow_list").refresh();
  }
  public async returnBackExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let workflow_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_workflow",
      { request_id: detail.request_id, loadAll: true, skipMap: true }
    );
    let workflow_transnode = await this.tm
      .getTN("expense_workflow_list")
      .getData();
    let notif_to = "";
    let notif_cc = new Set();
    let creator_role = "";
    let profit_center = "";
    for (let i = 0; i < workflow_list.length; i++) {
      if (this.role_id != "FINANCE" && this.role_id != "SM") {
        if (
          workflow_list[i].approver.toUpperCase() ==
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Returned Back";
          workflow_transnode[i].s_status = "Returned Back";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
        } else if (
          workflow_list[i].approver.toUpperCase() !=
          this.UserInfo[0].employee_id.toUpperCase() &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Returned Back";
          workflow_transnode[i].s_status = "Returned Back";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
        }
      } else {
        if (
          workflow_list[i].role == this.role_id &&
          workflow_list[i].s_status == "In-Progress"
        ) {
          workflow_list[i].s_status = "Returned Back";
          workflow_transnode[i].s_status = "Returned Back";
          workflow_list[i].approved_on = new Date();
          workflow_transnode[i].approved_on = new Date();
          workflow_list[i].approver = this.UserInfo[0].employee_id;
          workflow_transnode[i].approver = this.UserInfo[0].employee_id;
          profit_center = workflow_list[i].profit_center;
          notif_cc.add(workflow_list[i].approver);
        }
      }
      if (workflow_list[i].s_status == "Submitted") {
        creator_role = workflow_list[i].role;
        profit_center = workflow_list[i].profit_center;
      }
    }
    detail.expense_status = "Clarification Required";
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    await this.tm.getTN("expense_notification_search").setProperty("expense", detail.request_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_to", notif_to);
    await this.tm.getTN("expense_notification_search").setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_cc", notif_cc_array);
    await this.tm.getTN("expense_notification_search").setProperty("type", "Return");
    await this.tm.getTN("expense_notification_search").executeP();
    await this.tm.getTN("expense_workflow_list").createEntityP({ role: creator_role, approver: detail.created_by, created_on: new Date(), s_status: "In-Progress", profit_center: profit_center, }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
    await this.tm.getTN("logged_employee").setProperty("pending_for_approval", "false");
    await this.tm.getTN("logged_employee").setProperty("pending_for_comment", "false");
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_workflow_list").refresh();
  }
  public async clarificationProvidedforExpense() {
    let notif_to = "";
    let notif_cc = new Set();
    let returner_list = new Set();
    let returner_role = "";
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let receipt = await this.tm.getTN("expense_receipt_list").getData();
    for (let i = 0; i < receipt.length; i++) {
      if (receipt[i].receipt_appr_status == "Rejected") {
        receipt[i].receipt_appr_status == "Pending";
      }
    }
    let workflow_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_workflow",
      { request_id: detail.request_id, loadAll: true, skipMap: true }
    );
    let workflow_transnode = await this.tm
      .getTN("expense_workflow_list")
      .getData();
    for (let i = 0; i < workflow_list.length; i++) {
      if (workflow_list[i].s_status == "Returned Back") {
        workflow_list[i].s_status = "Returned-Back";
        workflow_transnode[i].s_status = "Returned-Back";
        returner_list.add(workflow_list[i].approver);
        notif_cc.add(workflow_list[i].approver);
        returner_role = workflow_list[i].role;
      } else if (workflow_list[i].s_status == "In-Progress") {
        workflow_list[i].s_status = "Clarification Provided";
        workflow_transnode[i].s_status = "Clarification Provided";
        workflow_list[i].approved_on = new Date();
        workflow_transnode[i].approved_on = new Date();
      }
    }
    const returnerArray = Array.from(returner_list);
    for (let i = 0; i < returnerArray.length; i++) {
      if (returner_role != "FINANCE" && returner_role != "SM") {
        await this.tm.getTN("expense_workflow_list").createEntityP(
          {
            role: returner_role,
            approver: returnerArray[i],
            created_on: new Date(),
            s_status: "In-Progress",
            profit_center: this.UserOrg[0].profit_centre,
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          false,
          false,
          false
        );
        for (let j = 0; j < receipt.length; j++) {
          if (receipt[j].r_expense_receipt_verify.length == 0) {
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt[j].receipt_id,
                employee_id: returnerArray[i],
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        }
      }
      else {
        await this.tm.getTN("expense_workflow_list").createEntityP(
          {
            role: returner_role,
            created_on: new Date(),
            s_status: "In-Progress",
            profit_center: this.UserOrg[0].profit_centre,
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          false,
          false,
          false
        );
        for (let j = 0; j < receipt.length; j++) {
          if (receipt[j].r_expense_receipt_verify.length == 0) {
            await this.tm.getTN("verification_list").createEntityP(
              {
                receipt_id: receipt[j].receipt_id,
                employee_id: returner_role,
                verification_check: false,
              },
              "Creation Successful",
              "Creation Failed",
              null,
              "First",
              false,
              false,
              false
            );
          }
        }
      }
    }
    detail.expense_status = "Clarification Provided";
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("expense", detail.request_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_to", notif_to);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_cc", notif_cc_array);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("type", "Clarity");
    await this.tm.getTN("expense_notification_search").executeP();
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_approval", "false");
    await this.tm
      .getTN("logged_employee")
      .setProperty("pending_for_comment", "false");
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_workflow_list").refresh();
  }
  public async cancelExpense() {
    let notif_to = "";
    let notif_cc = new Set();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let workflow_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_workflow",
      { request_id: detail.request_id, loadAll: true, skipMap: true }
    );
    workflow_list[0].s_status = "Cancelled";
    await detail.deleteP();
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.navTo({
      TS: true,
      H: true,
      S: "p_expense_page",
      SS: "pa_front_list",
    });
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("expense", detail.request_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_to", notif_to);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_cc", notif_cc_array);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("type", "Cancel");
    await this.tm.getTN("expense_notification_search").executeP();
  }
  public async cancelExpensebyFinance() {
    let notif_to = "";
    let notif_cc = new Set();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    await this.tm.getTN("expense_workflow_list").createEntityP(
      {
        approver: this.UserInfo[0].employee_id,
        role: "FINANCE",
        created_on: new Date(),
        approved_on: new Date(),
        s_status: "Cancelled",
        profit_center: this.UserOrg[0].profit_centre,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      false,
      false
    );
    detail.expense_status = "Cancelled";
    notif_to = detail.created_by;
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("expense", detail.request_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_to", notif_to);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_cc", notif_cc_array);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("type", "CancelFIN");
    await this.tm.getTN("expense_notification_search").executeP();
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_workflow_list").refresh();
  }
  public async PayExpense() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    await this.tm.getTN("expense_workflow_list").createEntityP(
      {
        approver: this.UserInfo[0].employee_id,
        role: "FINANCE",
        created_on: new Date(),
        approved_on: new Date(),
        s_status: "Paid",
        profit_center: this.UserOrg[0].profit_centre,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      false,
      false
    );
    detail.expense_status = "Paid";
    let notif_to = "";
    let notif_cc = new Set();
    notif_to = detail.created_by;
    notif_cc.add(this.UserInfo[0].employee_id);
    const notif_cc_array = Array.from(notif_cc);
    for (let i = 0; i < notif_cc_array.length; i++) {
      notif_cc_array[i] = notif_cc_array[i].toLowerCase();
    }
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("expense", detail.request_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_to", notif_to);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_cc", notif_cc_array);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("type", "Paid");
    await this.tm.getTN("expense_notification_search").executeP();
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.tm.getTN("expense_workflow_list").refresh();
  }
  //MANUPULATING DATA

  public async onpovaluehelp(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/receipt_project_list/", ""));
    let detail = await this.tm.getTN("receipt_project_list").getData()[index];
    await this.tm
      .getTN("po_search")
      .setProperty("project_id", detail.project_id);
    await this.tm.getTN("po_search").executeP();
    // if (this.role_id != "FINANCE") {
    //   let polist = await this.tm.getTN("po_list").getData();
    //   polist.push({
    //     po_no: "PO not Maintained",
    //   });
    // }
  }
  public async onpovaluehelpselect() {
    await this.tm.getTN("po_search").setProperty("project_id", undefined);
    await this.tm.getTN("po_search").executeP();
    await this.projectexceedcheck();
  }
  public async receipt_verification(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/expense_receipt_list/", ""));
    let receipt = this.tm.getTN("expense_receipt_list").getData()[index];
    let vefication_filteredlist = this.receipt_verify.filter(
      (item) => item.receipt_id == receipt.receipt_id
    );
    if (vefication_filteredlist.length == 0) receipt.verification_check = false;
    else
      vefication_filteredlist[0].verfication_check = receipt.verification_check;
    if (this.getMode() == "DISPLAY" || this.getMode() == undefined) {
      // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
      await this.retrySave("Saved Successfully", "Save Failed");
    }
  }
  public async exchangerate() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      index
    ];
    let exchangedata = await this.transaction.getExecutedQuery(
      "q_exchange_rate",
      {
        loadAll: true,
        project_currency: receipt_detail.currency_code,
        project_created_date: receipt_detail.receipt_date,
        partialSelected: ["currency_rate"],
      }
    );
    if (exchangedata && exchangedata.length == 1)
      receipt_detail.exchange_rate = exchangedata[0].currency_rate;
    else receipt_detail.exchange_rate = 0;
    await this.totalamountcalucation();
  }
  public async ontravelvaluehelp() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let status = ["Approved by Travel Desk", "Travel Completed", "Re Opened"];
    await this.tm.getTN("travel_vh_search").setProperty("query_status", status);
    await this.tm.getTN("travel_vh_search").executeP();
  }
  public async ontravelconfirm() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let status = [
      "Approved by Travel Desk",
      "Travel Completed",
      "Re Opened",
      "Travel Closed",
    ];
    await this.tm.getTN("travel_vh_search").setProperty("query_status", status);
    await this.tm.getTN("travel_vh_search").executeP();
    await this.tm
      .getTN("exp_project_search")
      .setProperty("employee", detail.employee_for);
    await this.tm
      .getTN("exp_project_search")
      .setProperty("request_id", detail.travel_request_id);
    await this.tm.getTN("exp_project_search").executeP();
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    for (let i = project_list.length - 1; i >= 0; i--) {
      project_list[i].deleteP();
    }
    if (detail.travel_request_id) {
      let travel_project_list = await this.transaction.getExecutedQuery(
        "d_o2c_expense_travel_project",
        { request_id: detail.travel_request_id, loadAll: true }
      );
      for (let i = 0; i < travel_project_list.length; i++) {
        await this.tm.getTN("expense_project_list").createEntityP({
          project_id: travel_project_list[i].project_id,
          so: travel_project_list[i].s_modified_by,
          project_name: travel_project_list[i].project_name,
          split_percent: travel_project_list[i].split_percent,
          bill_to_customer: travel_project_list[i].bill_to_customer,
        });
      }
    }
  }
  public async totalamountcalucation() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let receipt = this.tm.getTN("expense_receipt_detail").getData();
    let receipt_amount = receipt.receipt_amount;
    let personal_amount = receipt.personal_amount;
    if (receipt_amount == undefined) {
      receipt_amount = 0;
    }
    if (personal_amount == undefined) {
      personal_amount = 0;
    }
    let totalamount = parseFloat(receipt_amount) + parseFloat(personal_amount);
    receipt.expense_amount = totalamount;
    if (receipt.receipt_amount * parseFloat(receipt.exchange_rate))
      receipt.reimbursement_amount = parseFloat(
        (receipt.receipt_amount * parseFloat(receipt.exchange_rate)).toFixed(2)
      );
    else receipt.reimbursement_amount = 0;
    if (detail.category_id == 'SALARY_REIMBURSEMENT') {
      let sal_verification = await this.onSalVerification()
      if (sal_verification == false) {
        receipt.reimbursement_amount = 0;
        receipt.receipt_amount = 0;
      }
    }
    await this.onAutoAmountCalculation();
  }
  public async receiptdownloading() {
    let document = this.tm.getTN("expense_receipt_detail").getData();
    document.receipt_attach.downloadAttachP();
  }
  public async receiptuploading(oEvent) {
    let receipt = this.tm.getTN("expense_receipt_detail").getData();
    // await receipt.receipt_attach.setAttachmentP(
    //   oEvent.mParameters.files[0],
    //   oEvent.mParameters.files[0].name
    // );
    receipt.receipt_filename = receipt.receipt_attach.name;
    if (receipt.receipt_attach) {
      try {
        const base64 = await this.toBase64(receipt.receipt_attach);
        console.log("Base64 PDF Data:", base64);
        // Call your API function
        let res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
          url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "expenseOCRUpdate", true),
          data: {
            base64file: base64
          },
          method: "POST"
        });
        if (!receipt.invoice_id)
          receipt.invoice_id = res.requested_data.pdf_data.Bill_No
        if (!receipt.receipt_date) {
          const [month, day, year] = res.requested_data.pdf_data.Date.split('/').map(Number);
          const date = new Date(2000 + year, month - 1, day);
          receipt.receipt_date = date;
        }
        if (!receipt.amount)
          receipt.amount = Number(res.requested_data.pdf_data.Total_Amount)
        await this.tm.getTN("expense_receipt_detail").refresh();
      } catch (err) {
        console.error("Failed to convert file:", err);
      }
    };
  }
  public async onchangeProjectID(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let index = parseInt(sPath.replace("/receipt_project_list/", ""));
    let project = await this.tm.getTN("receipt_project_list").getData()[index];
    let expenseindex = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[expenseindex];
    //let selected_project = await this.transaction.getExecutedQuery('q_expense_project_vh',{project_id:project.project_id,employee:detail.employee_for,loadAll:true});
    let projects = await this.tm.getTN("exp_project_list").getData();
    const selected_project = projects.find(
      (p) => p.project_id === project.project_id
    );
    let so = await selected_project.r_project_so;
    detail.order_type = so[0].type;
    project.bill_to_customer = so[0].bill_to_customer;
    project.project_name = so[0].project_name;
    project.per_diem = so[0].per_diem_rate;
    project.so = so[0].so;

    //Auto Expense Type
    const expenseType = await this.receipt_type_request();
    if (expenseType.length == 1) {
      let receiptlist = await this.tm.getTN("expense_receipt_detail").getData();
      receiptlist.receipt_type = expenseType[0].key;
    }
  }
  public async onemployee_idchange() {
    let role_id;
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let employee = await this.transaction.getExecutedQuery("d_o2c_employee", {
      employee_id: detail.employee_for,
      loadAll: true,
    });
    let emp_designation = await this.transaction.getExecutedQuery(
      "q_emp_current_designation",
      {
        loadAll: true,
        des_emp_id: detail.employee_for,
        fdate: new Date().getTime(),
        tdate: new Date().getTime(),
      }
    );
    let emp_designation_name = await this.transaction.getExecutedQuery(
      "d_o2c_designation_master",
      { designation_id: emp_designation[0].designation, loadAll: true }
    );
    if (emp_designation_name) {
      role_id = emp_designation_name[0].name;
    }
    let role_list = await this.transaction.getExecutedQuery(
      "d_second_role_assyn",
      { employee_id: this.login_id, page_name: "Expense Page", loadAll: true }
    );
    if (role_list.length) {
      role_id = role_list[0].assyned_role;
    }
    if (role_id == "SALES" || role_id == "SM") {
      detail.employee_role_type = "SALES";
    } else {
      detail.employee_role_type = "DELIVERY";
    }
    await this.tm
      .getTN("exp_project_search")
      .setProperty("employee", employee[0].employee_id);
    await this.tm
      .getTN("exp_project_search")
      .setProperty("request_id", detail.travel_request_id);
    await this.tm.getTN("exp_project_search").executeP();
  }
  //COMMENTING ACTION
  public async onCommentingofSubmitingExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    let receipt = false;
    let split_check = false;
    let receiptlist = await this.tm.getTN("expense_receipt_list").getData();
    let emp_designation = await this.transaction.getExecutedQuery(
      "q_emp_current_designation",
      {
        loadAll: true,
        des_emp_id: detail.employee_for,
        fdate: new Date().getTime(),
        tdate: new Date().getTime(),
      }
    );
    //let emp_designation_name =await this.transaction.getExecutedQuery('d_o2c_designation_master', { designation_id: emp_designation[0].designation, loadAll: true });
    if (emp_designation.length > 0) {
      if (project_list.length > 0) {
        const grouped = {};
        for (const item of project_list) {
          const reqId = item.request_id;
          if (!grouped[reqId]) grouped[reqId] = [];
          grouped[reqId].push(parseFloat(item.split_percent));
        }
        // Check sums and break early
        for (const reqId in grouped) {
          const sum = grouped[reqId].reduce((a, b) => a + b, 0);
          if (sum !== 100) {
            split_check = true;
            break;
          }
        }
      }
      for (let i = 0; i < receiptlist.length && receipt == false; i++) {
        if (
          receiptlist[i].receipt_date == undefined ||
          receiptlist[i].receipt_date == null
        ) {
          sap.m.MessageBox.error(
            "No Receipt Date Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_amount == undefined ||
          receiptlist[i].receipt_amount == null ||
          detail.receipt_amount == 0
        ) {
          sap.m.MessageBox.error(
            "No Receipt Amount Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (receiptlist[i].business_purpose == undefined) {
          sap.m.MessageBox.error(
            "Business Purpose Not Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].currency_code == undefined ||
          receiptlist[i].currency_code == null
        ) {
          sap.m.MessageBox.error(
            "No Currency Code Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_filename == undefined &&
          receiptlist[i].attach_req == true
        ) {
          sap.m.MessageBox.error(
            "No Receipt Attachment Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].receipt_sub_type == undefined &&
          receiptlist[i].sub_type_check == true
        ) {
          sap.m.MessageBox.error(
            "No Receipt Sub Type Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (!receiptlist[i].receipt_type) {
          sap.m.MessageBox.error(
            "No Receipt Type Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          receiptlist[i].city_location == undefined &&
          receiptlist[i].location_required == true
        ) {
          sap.m.MessageBox.error(
            "No City Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].number_of_days == undefined ||
            receiptlist[i].number_of_days == 0) &&
          receiptlist[i].no_of_days_check == true
        ) {
          sap.m.MessageBox.error(
            "No Days Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].from_loc == undefined ||
            receiptlist[i].to_loc == undefined ||
            receiptlist[i].from_loc == "" ||
            receiptlist[i].to_loc == "") &&
          receiptlist[i].distance_travel_check == true
        ) {
          sap.m.MessageBox.error(
            "No Location Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        } else if (
          (receiptlist[i].distance_traveled == undefined ||
            receiptlist[i].distance_traveled == 0) &&
          receiptlist[i].distance_travel_check == true
        ) {
          sap.m.MessageBox.error(
            "No Distance Found for " + receiptlist[i].receipt_id,
            { title: "Error" }
          );
          receipt = true;
          break;
        }
      }
      if (split_check == true) {
        sap.m.MessageBox.error("Overall Project Split to be 100%", {
          title: "Error",
        });
      } else if (receipt == true) {
      } else if (project_list.length == 0) {
        sap.m.MessageBox.error("Please Add Project", { title: "Error" });
      } else if (emp_designation.length == 0) {
        sap.m.MessageBox.error("Please Ask HR to add Designation", {
          title: "Error",
        });
      } else if (detail.descript == undefined || detail.descript == "") {
        sap.m.MessageBox.error("Provide Description", { title: "Error" });
      }
      // 	else if (detail.location == undefined || detail.location == '') {
      // 		sap.m.MessageBox.error("Provide Location", { title: "Error", });
      // }
      else {
        sap.m.MessageBox.confirm(
          "Are You Sure You want to Submit this Expense Request",
          {
            title: "Confirm",
            actions: [
              sap.m.MessageBox.Action.OK,
              sap.m.MessageBox.Action.CANCEL,
            ],
            onClose: (oAction) => {
              if (oAction == "OK") {
                this.submitExpense();
              }
            },
          }
        );
      }
    }
    oBusyDailog.close();
  }
  public async commentingExpense() {
    let t_mode = this.getMode();
    let other_comment = this.tm.getTN("other_travel_comment").getData().comment;
    let date = new Date();
    if (other_comment) {
      await this.tm.getTN("expense_comment_list").createEntityP({ comment: other_comment, user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id, }, "Creation Successful", "Creation Failed", null, "First", false, true, false);
      await this.tm.getTN("other_travel_comment").setProperty("comment", null);
      if (t_mode != "CREATE") {
        if (t_mode != "EDIT") {
          // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
          await this.retrySave("Saved Successfully", "Save Failed");
          this.setMode("DISPLAY");
        } else {
          this.setMode("EDIT");
        }
      } else {
        this.setMode("CREATE");
      }
    } else {
      sap.m.MessageBox.error("Please Write Comment", {
        title: "Error",
      });
    }
  }
  public async onCommentingofApproveExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let pocheck = 0;
    let order_type_list = await this.transaction.getExecutedQuery("d_o2c_so_type_master", { type_id: detail.order_type, loadAll: true, });
    let receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    let approval_check = true;
    for (let i = 0; i < receipt_list.length; i++) {
      if (receipt_list[i].verification_check != true) {
        approval_check = false;
        break;
      }
      else if (receipt_list[i].receipt_appr_status == "Rejected") {
        approval_check = false;
        break;
      }
    }
    for (let i = 0; i < detail.r_expense_project.length; i++) {
      if (
        detail.r_expense_project[i].po_no == undefined ||
        detail.r_expense_project[i].po_no == "" ||
        detail.r_expense_project[i].po_no == "PO not Maintained"
      ) {
        pocheck = pocheck + 1;
      }
    }
    if (order_type_list.length > 0 && order_type_list[0].financial_impact == "C") {
      pocheck = 0;
    }
    if (this.role_id == "FINANCE" && pocheck != 0) {
      sap.m.MessageBox.error("Please Provide PO Numbers in Project Section", {
        title: "Error",
      });
    }
    else if (approval_check == false) {
      sap.m.MessageBox.error("Please Approve all Receipts before Approving the Request", {
        title: "Error",
      });
    }
    else {
      let date = new Date();
      await this.tm.getTN("expense_comment_list").createEntityP(
        {
          user_name: this.full_name,
          time_of_comment: date,
          user_id: this.UserInfo[0].employee_id,
        },
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        false,
        true,
        false
      );
      await this.openDialog("pa_approve_dialog");
    }
    oBusyDailog.close();
  }
  public async onCommentingofRejectExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let date = new Date();
    await this.tm.getTN("expense_comment_list").createEntityP(
      {
        user_name: this.full_name,
        time_of_comment: date,
        user_id: this.UserInfo[0].employee_id,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      true,
      false
    );
    await this.openDialog("pa_reject_dialog");
    oBusyDailog.close();
  }
  public async onCommentingofReturnBackExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let date = new Date();
    await this.tm.getTN("expense_comment_list").createEntityP(
      {
        user_name: this.full_name,
        time_of_comment: date,
        user_id: this.UserInfo[0].employee_id,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      true,
      false
    );
    await this.openDialog("pa_return_dialog");
    oBusyDailog.close();
  }
  public async onCommentingofClarificationExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let project_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_travel_project",
      {
        receipt_expense_id: detail.request_id,
        loadAll: true,
      });
    let receiptlist = await this.tm.getTN("expense_receipt_detail").getData();
    let receipt = false;
    let split_check = false;
    if (project_list.length > 0) {
      const grouped = {};
      for (const item of project_list) {
        const reqId = item.request_id;
        if (!grouped[reqId]) grouped[reqId] = [];
        grouped[reqId].push(parseFloat(item.split_percent));
      }
      // Check sums and break early
      for (const reqId in grouped) {
        const sum = grouped[reqId].reduce((a, b) => a + b, 0);
        if (sum !== 100) {
          split_check = true;
          break;
        }
      }
    }
    for (let i = 0; i < receiptlist.length && receipt == false; i++) {
      if (
        receiptlist[i].receipt_date == undefined ||
        receiptlist[i].receipt_date == null
      ) {
        sap.m.MessageBox.error(
          "No Receipt Date Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        receiptlist[i].receipt_amount == undefined ||
        receiptlist[i].receipt_amount == null ||
        detail.receipt_amount == 0
      ) {
        sap.m.MessageBox.error(
          "No Receipt Amount Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (receiptlist[i].business_purpose == undefined) {
        sap.m.MessageBox.error(
          "Business Purpose Not Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        receiptlist[i].currency_code == undefined ||
        receiptlist[i].currency_code == null
      ) {
        sap.m.MessageBox.error(
          "No Currency Code Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        receiptlist[i].receipt_filename == undefined &&
        receiptlist[i].attach_req == true
      ) {
        sap.m.MessageBox.error(
          "No Receipt Attachment Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        receiptlist[i].receipt_sub_type == undefined &&
        receiptlist[i].sub_type_check == true
      ) {
        sap.m.MessageBox.error(
          "No Receipt Sub Type Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (!receiptlist[i].receipt_type) {
        sap.m.MessageBox.error(
          "No Receipt Type Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        receiptlist[i].city_location == undefined &&
        receiptlist[i].location_required == true
      ) {
        sap.m.MessageBox.error(
          "No City Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        (receiptlist[i].number_of_days == undefined ||
          receiptlist[i].number_of_days == 0) &&
        receiptlist[i].no_of_days_check == true
      ) {
        sap.m.MessageBox.error(
          "No Days Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        (receiptlist[i].from_loc == undefined ||
          receiptlist[i].to_loc == undefined ||
          receiptlist[i].from_loc == "" ||
          receiptlist[i].to_loc == "") &&
        receiptlist[i].distance_travel_check == true
      ) {
        sap.m.MessageBox.error(
          "No Location Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      } else if (
        (receiptlist[i].distance_traveled == undefined ||
          receiptlist[i].distance_traveled == 0) &&
        receiptlist[i].distance_travel_check == true
      ) {
        sap.m.MessageBox.error(
          "No Distance Found for " + receiptlist[i].receipt_id,
          { title: "Error" }
        );
        receipt = true;
        break;
      }
    }
    if (split_check == true) {
      sap.m.MessageBox.error("Overall Project Split to be 100%", {
        title: "Error",
      });
    } else if (receipt == true) {
      //sap.m.MessageBox.error("Overall Project Split to be 100%", { title: "Error", });
    } else if (project_list.length == 0) {
      sap.m.MessageBox.error("No Project Details Found", { title: "Error" });
    } else if (detail.descript == undefined || detail.descript == "") {
      sap.m.MessageBox.error("Provide Description", { title: "Error" });
    } else {
      let date = new Date();
      await this.tm.getTN("expense_comment_list").createEntityP(
        {
          user_name: this.full_name,
          time_of_comment: date,
          user_id: this.UserInfo[0].employee_id,
        },
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        false,
        true,
        false
      );
      await this.openDialog("pa_clarify_dialog");
    }
    oBusyDailog.close();
  }
  public async onCommentingofCancellingExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    sap.m.MessageBox.confirm("Are You Sure You want to Discard this Expense", {
      title: "Confirm",
      actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
      onClose: (oAction) => {
        if (oAction == "OK") {
          this.cancelExpense();
        }
      },
    });
    oBusyDailog.close();
  }
  public async onCommentingofFinanceCancelExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let date = new Date();
    await this.tm.getTN("expense_comment_list").createEntityP(
      {
        user_name: this.full_name,
        time_of_comment: date,
        user_id: this.UserInfo[0].employee_id,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      true,
      false
    );
    await this.openDialog("pa_cancel_fin_dialog");
    oBusyDailog.close();
  }
  public async onCommentingofPayExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let date = new Date();
    await this.tm.getTN("expense_comment_list").createEntityP(
      {
        user_name: this.full_name,
        time_of_comment: date,
        user_id: this.UserInfo[0].employee_id,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      true,
      false
    );
    await this.openDialog("pa_pay_dialog");
    oBusyDailog.close();
  }
  //CONFIRMATION ACTION
  public async confirmApproveExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    //Gaand
    let order_type_list = await this.transaction.getExecutedQuery("d_o2c_so_type_master", { type_id: detail.order_type, loadAll: true, });
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error("Please provide a Comment before Approving", {
        title: "Error",
      });
    } else {
      this.setMode("DISPLAY");
      await this.closeDialog("pa_approve_dialog");
      if (this.role_id == "FINANCE" && order_type_list && order_type_list.length > 0 && order_type_list[0].financial_impact == "P") {
        await this.td_so_check();
      } else {
        await this.approveExpense();
      }
    }
    oBusyDailog.close();
  }
  public async confirmRejectExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error("Please provide a Comment before Rejecting", {
        title: "Error",
      });
    } else {
      this.setMode("DISPLAY");
      await this.closeDialog("pa_reject_dialog");
      await this.rejectExpense();
    }
    oBusyDailog.close();
  }
  public async confirmReturnBackExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error("Please provide a Comment before Returning Back", {
        title: "Error",
      });
    } else {
      await this.setMode("DISPLAY");
      await this.closeDialog("pa_return_dialog");
      await this.returnBackExpense();
    }
    oBusyDailog.close();
  }
  public async confirmClarificationExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error(
        "Please provide a Comment before Providing Clarification",
        { title: "Error" }
      );
    } else {
      await this.setMode("DISPLAY");
      await this.closeDialog("pa_clarify_dialog");
      await this.clarificationProvidedforExpense();
    }
    oBusyDailog.close();
  }
  public async confirmCancellingExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error("Please provide a Comment before Cancelling", {
        title: "Error",
      });
    } else {
      await this.setMode("DISPLAY");
      await this.closeDialog("pa_cancel_dialog");
      await this.cancelExpense();
    }
    oBusyDailog.close();
  }
  public async confirmFinanceCancelExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error("Please provide a Comment before Cancelling", {
        title: "Error",
      });
    } else {
      this.setMode("DISPLAY");
      await this.closeDialog("pa_cancel_fin_dialog");
      await this.cancelExpensebyFinance();
    }
    oBusyDailog.close();
  }
  public async confirmPaymentExpense() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = "";
    comment = detail.r_expense_comment[0].comment;
    let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, "");
    if (trimmedcomment == "" || comment == undefined) {
      sap.m.MessageBox.error(
        "Please provide a Comment before Confirming Payment",
        { title: "Error" }
      );
    } else {
      this.setMode("DISPLAY");
      await this.closeDialog("pa_pay_dialog");
      await this.PayExpense();
    }
    oBusyDailog.close();
  }
  public async cancelApproveExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_approve_dialog");
  }
  public async cancelRejectExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_reject_dialog");
  }
  public async cancelReturnBackExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_return_dialog");
  }
  public async cancelClarificationExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_clarify_dialog");
  }
  public async cancelCancellingExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_cancel_dialog");
  }
  public async cancelFinanceCancellingExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_cancel_dialog");
  }
  public async cancelPayExpense() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_pay_dialog");
  }
  public async onMisClose() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let comment = detail.r_expense_comment[0].comment;
    if (comment == undefined || comment == null) {
      await this.transaction.rollback();
    }
    this.setMode("DISPLAY");
  }
  //DECLARATION:
  public async declarationrequiredcheck() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[index];
    let userOrg = await this.transaction.getExecutedQuery(
      "d_o2c_employee_org",
      {
        employee_id: expense_detail.employee_for,
        is_primary: true,
        loadAll: true,
      }
    );
    let business_area = userOrg[0].business_area;
    if (expense_detail.journey_id)
      this.journey = await this.transaction.getExecutedQuery(
        "d_o2c_travel_journey",
        { journey_id: expense_detail.journey_id, loadAll: true }
      );
    const master = await this.transaction.getExecutedQuery("d_o2c_pd_master", {
      travelling_location: expense_detail.location,
      business_area: business_area,
      loadAll: true,
    });
    let perdiem = 0;
    if (!master || master.length == 0) {
      sap.m.MessageBox.error("Per Diem not Maintained in Master Table", {
        title: "Error",
      });
    } else if (
      this.journey &&
      this.journey.length > 0 &&
      expense_detail.journey_id
    )
      perdiem = this.journey[0].per_diem_amount;
    const master_perdiem = master[0].per_diem_amount;
    if (
      expense_detail.travel_request_id &&
      perdiem &&
      perdiem >= master_perdiem
    ) {
      await this.openDialog("pa_declare_dialog");
    } else if (master && master.length != 0) {
      let oBusyDailog = new sap.m.BusyDialog();
      oBusyDailog.open();
      await this.submitExpense();
      oBusyDailog.close();
    }
  }
  public async declaration_submit() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    await this.submitExpense();
    oBusyDailog.close();
    await this.closeDialog("pa_declare_dialog");
    this.journey = undefined;
  }
  public async declaration_cancel() {
    await this.transaction.rollback();
    await this.closeDialog("pa_declare_dialog");
    this.journey = undefined;
  }
  public async creation_module() {
    let emp_designation = await this.transaction.getExecutedQuery(
      "q_emp_current_designation",
      {
        loadAll: true,
        des_emp_id: this.login_id,
        fdate: new Date().getTime(),
        tdate: new Date().getTime(),
      }
    );
    if (emp_designation.length > 0) {
      await this.openDialog("pa_expense_creation");
      let creation_check = await this.tm
        .getTN("expense_creation_module")
        .getData();
      let sal_present = await this.tm.getTN("salary_reimburse_list").getData();
      let categories = [
        { category_id: "TRAVEL", description: "Travel" },
        { category_id: "NON_TRAVEL", description: "Non Travel" },
      ];
      if (sal_present.length > 0) {
        categories = [
          { category_id: "TRAVEL", description: "Travel" },
          { category_id: "NON_TRAVEL", description: "Non Travel" },
          { category_id: "SALARY_REIMBURSEMENT", description: "Salary Re-Imbursement" },
        ];
      }
      await this.tm.getTN("expense_category_vh_select").setData(categories);
      if (
        creation_check == undefined ||
        creation_check.category_id == undefined
      ) {
        await this.tm
          .getTN("expense_creation_module")
          .setProperty("category_id", "TRAVEL");
        await this.tm
          .getTN("expense_creation_module")
          .setProperty("category_check", true);
        await this.tm
          .getTN("expense_creation_module")
          .setProperty("local_travel_check", false);
        await this.tm
          .getTN("expense_creation_module")
          .setProperty("selected_employee_id", this.UserInfo[0].employee_id);
      }
    }
    else
      sap.m.MessageBox.error("Please Contact HR to add Designation", {
        title: "Error",
      });
  }
  public async category_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    if (creation_check.category_check == true) {
      await this.tm
        .getTN("expense_creation_module")
        .setProperty("category_id", "TRAVEL");
      await this.tm
        .getTN("expense_creation_module")
        .setProperty("creation_role", "ALL");
    } else if (creation_check.category_check == false) {
      await this.tm
        .getTN("expense_creation_module")
        .setProperty("category_id", "NON_TRAVEL");
    }
  }
  public async employee_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.it_check = false;
    creation_check.admin_check = false;
    creation_check.finance_check = false;
    creation_check.hr_check = false;
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("creation_role", "ALL");
  }
  public async it_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.employee_check = false;
    creation_check.admin_check = false;
    creation_check.finance_check = false;
    creation_check.hr_check = false;
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("creation_role", "IT");
  }
  public async admin_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.employee_check = false;
    creation_check.it_check = false;
    creation_check.finance_check = false;
    creation_check.hr_check = false;
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("creation_role", "ADMIN");
  }
  public async finance_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.employee_check = false;
    creation_check.it_check = false;
    creation_check.admin_check = false;
    creation_check.hr_check = false;
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("creation_role", this.role_id);
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("expense_type", "Project Expense");
  }
  public async hr_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.employee_check = false;
    creation_check.it_check = false;
    creation_check.finance_check = false;
    creation_check.admin_check = false;
    await this.tm
      .getTN("expense_creation_module")
      .setProperty("creation_role", "HR");
  }
  public async local_travel_check() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    creation_check.selected_travel_id = false;
  }
  public async onCreationEmployeeVhChange() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    if (creation_check.category_id == "TRAVEL") {
      creation_check.selected_travel_id = undefined;
    }
  }
  public async onCreationTravelVh() {
    let creation_check = await this.tm
      .getTN("expense_creation_module")
      .getData();
    let status = ["Approved by Travel Desk", "Travel Completed", "Re Opened"];
    await this.tm
      .getTN("travel_vh_search")
      .setProperty("query_employee", creation_check.selected_employee_id);
    await this.tm.getTN("travel_vh_search").setProperty("query_status", status);
    await this.tm.getTN("travel_vh_search").executeP();
  }
  public async newAllExpenseCreation() {
    let auto_project = false;
    let auto_project_check;
    let so;
    let receipt;
    let emp_designation = await this.transaction.getExecutedQuery(
      "q_emp_current_designation",
      {
        loadAll: true,
        des_emp_id: this.login_id,
        fdate: new Date().getTime(),
        tdate: new Date().getTime(),
      }
    );
    if (emp_designation.length > 0) {
      let oBusyDailog = new sap.m.BusyDialog();
      oBusyDailog.open();
      let creation_check = await this.tm
        .getTN("expense_creation_module")
        .getData();
      await this.navTo({
        TS: true,
        H: true,
        S: "p_expense_page",
        SS: "pa_detail",
      });
      await this.tm
        .getTN("location_search")
        .setProperty("travel_type", ["International", "Domestic", "Local"]);
      await this.tm
        .getTN("location_search")
        .setProperty("business_area", this.business_area);
      await this.tm.getTN("location_search").executeP();
      await this.closeDialog("pa_expense_creation");
      let detail;
      let sal_reimburse_id;
      if (creation_check.category_id == "TRAVEL" && creation_check.local_travel_check == false) {
        let travel_list = await this.transaction.getExecutedQuery("d_o2c_travel_header", { request_id: creation_check.selected_travel_id, loadAll: true, expandAll: "r_travel_per_diem" });
        detail = await this.tm.getTN("expense_list").createEntityP(
          {
            created_by: creation_check.selected_employee_id,
            employee_for: creation_check.selected_employee_id,
            expense_status: "New",
            employee_role_type: "ALL",
            category_id: creation_check.category_id,
            travel_request_id: creation_check.selected_travel_id,
            r_expense_travel: travel_list[0]
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          true
        );
        let travel = await this.tm.getTN("expense_travel_list").getData();
        await travel.push(travel_list[0]);
        let perdiem = await this.tm.getTN("travel_per_diem").getData();
        perdiem = travel[0].r_travel_per_diem;
        //if (detail.travel_request_id) {
        // let travel_project_list = await this.transaction.getExecutedQuery(
        //   "d_o2c_expense_travel_project",
        //   { request_id: creation_check.selected_travel_id, loadAll: true }
        // );
        // let projectArray = [];
        // for (let i = 0; i < travel_project_list.length; i++) {
        //   await this.tm.getTN("expense_project_list").createEntityP({
        //     project_id: travel_project_list[i].project_id,
        //     so: travel_project_list[i].so,
        //     project_name: travel_project_list[i].project_name,
        //     split_percent: travel_project_list[i].split_percent,
        //     bill_to_customer: travel_project_list[i].bill_to_customer,
        //     po_no: travel_project_list[i].po_no,
        //   });
        //   projectArray[i] = travel_project_list[i].project_id;
        // }
        // let selected_project = await this.transaction.getExecutedQuery(
        //   "q_travel_project_vh",
        //   {
        //     project_id: projectArray[0],
        //     employee: detail.employee_for,
        //     loadAll: true,
        //   }
        // );
        // if (selected_project.length > 0) {
        //   let so = await selected_project[0].r_project_so.fetch();
        //   detail.order_type = so[0].type;
        // }
        //}
      }
      else if (creation_check.category_id == "SALARY_REIMBURSEMENT") {
        let reimbursement = await this.tm.getTN("salary_reimburse_list").getData()[0];
        sal_reimburse_id = reimbursement.sal_reim_id;
        detail = await this.tm.getTN("expense_list").createEntityP(
          {
            created_by: creation_check.selected_employee_id,
            employee_for: creation_check.selected_employee_id,
            expense_status: "New",
            employee_role_type: creation_check.creation_role,
            category_id: creation_check.category_id,
            sal_reimb_id: reimbursement.sal_reim_id,
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          false
        );
      }
      else {
        const today = new Date();
        auto_project_check = await this.transaction.getExecutedQuery("q_expense_category_project", {
          business_area: this.UserOrg[0].business_area, expense_type: creation_check.expense_type, date_new: today,
          loadAll: true,
        });
        if (auto_project_check.length && auto_project_check.length > 0) {
          auto_project = true;
        }
        detail = await this.tm.getTN("expense_list").createEntityP(
          {
            created_by: creation_check.selected_employee_id,
            employee_for: creation_check.selected_employee_id,
            expense_status: "New",
            employee_role_type: creation_check.creation_role,
            category_id: creation_check.category_id,
            expense_type: creation_check.expense_type,
            auto_project_check: auto_project
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          false
        );
      }
      receipt = await this.tm
        .getTN("expense_receipt_list")
        .createEntityP(
          { sal_reimburse_id: sal_reimburse_id },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          false
        );
      if (auto_project == true) {
        let selected_project = await this.transaction.getExecutedQuery('d_o2c_project_header', { project_id: auto_project_check[0].project_id, loadAll: true });
        so = await selected_project[0].r_project_so.fetch();
        detail.order_type = so[0].type;
        await this.tm
          .getTN("receipt_project_list")
          .createEntityP(
            {
              receipt_expense_id: detail.request_id,
              project_id: auto_project_check[0].project_id,
              so: so[0].so,
              bill_to_customer: so[0].bill_to_customer,
              project_name: so[0].project_name,
              split_percent: 100
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "Last",
            true,
            true,
            false
          );
      }
      let employee = await this.transaction.getExecutedQuery("d_o2c_employee", {
        employee_id: detail.employee_for,
        loadAll: true,
      });
      let userDesig = await this.transaction.getExecutedQuery(
        "q_o2c_emp_current_desig",
        { employee_id: detail.employee_for, from_date: new Date(), end_date: new Date(), loadAll: true }
      );
      let DesigMaster = await this.transaction.getExecutedQuery(
        "d_o2c_designation_master",
        { designation_id: userDesig[0].designation, loadAll: true }
      );
      let userorg = await this.transaction.getExecutedQuery(
        "d_o2c_employee_org",
        { employee_id: detail.employee_for, is_primary: true, loadAll: true }
      );
      let CompanyName = await this.transaction.getExecutedQuery(
        "d_o2c_company_info",
        { company_code: userorg[0].company_code, loadAll: true }
      );
      await this.tm
        .getTN("receipt_attendee_list")
        .createEntityP(
          {
            employee_id: employee[0].employee_id,
            employee_name: employee[0].full_name,
            relationship_with_company: DesigMaster[0].name,
            company_name: CompanyName[0].name;
          },
          "Creation Successful",
          "Creation Failed",
          null,
          "First",
          true,
          true,
          false
        );
      await this.tm.getTN("expense_workflow_list").createEntityP(
        {
          role: this.role_id,
          approver: this.UserInfo[0].employee_id,
          s_status: "In-Progress",
          profit_center: this.UserOrg[0].profit_centre,
        },
        "Creation Successful",
        "Creation Failed",
        null,
        "First",
        false,
        false,
        false
      );
      let travel_check = undefined;
      if (creation_check.category_id == "TRAVEL")
        travel_check = creation_check.selected_travel_id;
      await this.tm
        .getTN("exp_project_search")
        .setProperty("employee", this.UserInfo[0].employee_id);
      await this.tm
        .getTN("exp_project_search")
        .setProperty("request_id", creation_check.selected_travel_id);
      await this.tm.getTN("relation_screen_length").setProperty("receipt", 1);
      await this.tm.getTN("exp_project_search").executeP();
      await this.tm
        .getTN("new_type_vh")
        .setProperty("category_id", creation_check.category_id);
      await this.tm
        .getTN("new_type_vh")
        .setProperty("user_role", creation_check.creation_role);
      await this.tm.getTN("new_type_vh").setProperty("expense_type", creation_check.expense_type);
      // if(auto_project==true){
      //   let tnm = await this.transaction.getExecutedQuery("q_so_expense_tnm_check", {
      //     so: so,
      //     loadAll: true,
      //   });
      //   let hasTnm = tnm.length > 0;

      // // Load type vh data
      // if(hasTnm){
      //   await this.tm.getTN("new_type_vh").setProperty("tnm_only", true);
      // }
      // else{
      //    await this.tm.getTN("new_type_vh").setProperty("tnm_only", false);
      // }
      // await this.tm.getTN("new_type_vh").setProperty("order_type", detail.order_type);
      // }
      let expense_type = await this.tm.getTN("new_type_vh").executeP();
      // if(auto_project==true)
      // receipt.receipt_type = expense_type[0].key;
      oBusyDailog.close();
    }
    else {
      sap.m.MessageBox.error("Please Contact HR to add Designation", {
        title: "Error",
      });
    }
  }
  // 
  public async receipt_type_request() {
    // Get selected expense
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[index];

    // Get selected receipt (✅ fixed index usage)
    let receipt_index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt = await this.tm.getTN("expense_receipt_list").getData()[receipt_index];

    // Fetch related projects
    let project = await receipt.r_receipt_project.fetch();
    let soList = [];
    for (let i = 0; i < project.length; i++) {
      const so = project[i].so;
      if (so && soList.indexOf(so) === -1) {
        soList.push(so);
      }
    }

    // Check TNM
    let tnm = await this.transaction.getExecutedQuery("q_so_expense_tnm_check", {
      so: soList,
      loadAll: true,
    });
    let hasTnm = tnm.length > 0;

    // Load type vh data
    if (hasTnm) {
      await this.tm.getTN("new_type_vh").setProperty("tnm_only", true);
    }
    else {
      await this.tm.getTN("new_type_vh").setProperty("tnm_only", false);
    }
    await this.tm.getTN("new_type_vh").setProperty("order_type", expense_detail.order_type);
    await this.tm.getTN("new_type_vh").getData().setLoadAll(true);
    let type_list = await this.tm.getTN("new_type_vh").executeP();

    // Build lookup map for expense types
    const typeMap = new Map(type_list.map((item) => [item.expense_type, item]));

    // Collect unique expense types
    const uniqueExpenseTypes = Array.from(
      new Set(type_list.map((item) => item.expense_type).filter(Boolean))
    );

    const expenseTypes: any[] = [];

    for (const expense_type of uniqueExpenseTypes) {
      const matchingItem = typeMap.get(expense_type);
      const baseObj = {
        key: expense_type,
        description: matchingItem?.order_type,
        sub_type_check: matchingItem?.sub_type_check || false,
        per_diem_check: matchingItem?.per_diem_check || false,
        base_area_check: matchingItem?.base_area_check || false,
        distance_travel_check: matchingItem?.distance_travel_check || false,
        attendees_check: matchingItem?.attendees_check || false,
        location_required: matchingItem?.location_required || false,
        no_of_days_check: matchingItem?.no_of_days_check || false,
        attanchment_req: matchingItem?.attanchment_req || false,
        auto_calculate: matchingItem?.auto_calculate || false,
      };
      expenseTypes.push({ ...baseObj });
    }
    // Set final data
    await this.tm.getTN("expense_type_vh").setData(expenseTypes);
    return expenseTypes;
  }
  public async receipt_type_confirm() {
    let type_list = await this.tm.getTN("expense_type_vh").getData();
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      index
    ];
    let type = receipt_detail.receipt_type;
    let subtype = receipt_detail.receipt_sub_type;
    let matchedObject;
    if (subtype) {
      // Search for exact type + subtype match
      matchedObject = type_list.find(
        (item) => item.key === type && item.sub_type === subtype
      );
    }
    // If not found OR subtype is empty → search for undefined subtype
    if (!matchedObject) {
      matchedObject = type_list.find(
        (item) => item.key === type && (item.sub_key === undefined || item.sub_key === null)
      );
    }
    receipt_detail.location_required = matchedObject.location_required;
    receipt_detail.attendees_check = matchedObject.attendees_check;
    receipt_detail.distance_travel_check = matchedObject.distance_travel_check;
    receipt_detail.base_area_check = matchedObject.base_area_check;
    receipt_detail.sub_type_check = matchedObject.sub_type_check;
    receipt_detail.per_diem_check = matchedObject.per_diem_check;
    receipt_detail.no_of_days_check = matchedObject.no_of_days_check;
    receipt_detail.attach_req = matchedObject.attanchment_req;
    receipt_detail.auto_calculate = matchedObject.auto_calculate;
  }
  public async subTypeRequest() {

    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[index];
    let receipt_index = await this.tm
      .getTN("expense_receipt_list")
      .getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      receipt_index
    ];
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("expense_type", receipt_detail.receipt_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("order_type", expense_detail.order_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("category_id", expense_detail.category_id);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("user_role", expense_detail.employee_role_type);
    await this.tm.getTN("sub_type_vh").getData().setLoadAll(true);
    let sub_type = await this.tm.getTN("sub_type_vh").executeP();
    await this.tm.getTN("expense_sub_type_vh").setData(sub_type);
    let type_list = sub_type;
    //await this.tm.getTN("new_type_vh").setData(sub_type);
    // Build lookup map for expense types
    const typeMap = new Map(
      type_list.map((item) => [
        `${item.expense_type}|${item.expense_sub_type}`,
        item
      ])
    );

    // Step 2: Collect unique combinations of type + subtype
    const uniqueCombinations = Array.from(
      new Set(
        type_list
          .map((item) => `${item.expense_type}|${item.expense_sub_type}`)
          .filter(Boolean)
      )
    );

    const expenseTypes: any[] = [];

    // Step 3: Loop through unique combinations
    for (const combo of uniqueCombinations) {
      const matchingItem = typeMap.get(combo);

      if (!matchingItem) continue;

      const baseObj = {
        key: matchingItem.expense_type,
        sub_type: matchingItem.expense_sub_type,
        description: matchingItem.order_type,
        sub_type_check: matchingItem.sub_type_check || false,
        per_diem_check: matchingItem.per_diem_check || false,
        base_area_check: matchingItem.base_area_check || false,
        distance_travel_check: matchingItem.distance_travel_check || false,
        attendees_check: matchingItem.attendees_check || false,
        location_required: matchingItem.location_required || false,
        no_of_days_check: matchingItem.no_of_days_check || false,
        attanchment_req: matchingItem.attanchment_req || false,
        auto_calculate: matchingItem.auto_calculate || false,
      };

      expenseTypes.push(baseObj);
    }
    // Set final data
    await this.tm.getTN("expense_type_vh").setData(expenseTypes);
  }
  public async onNavtoReceipt(oEvent) {
    let sPath: string = this.getPathFromEvent(oEvent);
    let receipt_index = parseInt(sPath.replace("/expense_receipt_list/", ""));
    await this.tm.getTN("expense_receipt_list").setActive(receipt_index);
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[index];
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[
      receipt_index
    ];
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("expense_type", receipt_detail.receipt_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("order_type", expense_detail.order_type);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("category_id", expense_detail.category_id);
    await this.tm
      .getTN("sub_type_vh")
      .setProperty("user_role", expense_detail.employee_role_type);
    await this.tm.getTN("sub_type_vh").getData().setLoadAll(true);
    let sub_type = await this.tm.getTN("sub_type_vh").executeP();
    await this.tm.getTN("expense_sub_type_vh").setData(sub_type);
    await this.tm
      .getTN("new_type_vh")
      .setProperty("order_type", expense_detail.order_type);
    await this.tm.getTN("new_type_vh").getData().setLoadAll(true);
    await this.tm.getTN("new_type_vh").setProperty("expense_type", expense_detail.expense_type);
    let type = await this.tm.getTN("new_type_vh").executeP();
    let type_list = type;
    let project = await receipt_detail.r_receipt_project.fetch();
    let soList = [];
    for (let i = 0; i < project.length; i++) {
      const so = project[i].so;
      if (so && soList.indexOf(so) === -1) {
        soList.push(so);
      }
    }
    let tnm = await this.transaction.getExecutedQuery("q_so_expense_tnm_check", {
      so: soList,
      loadAll: true,
    });
    let tnm_check = [false];
    if (tnm.length > 0) {
      tnm_check = [false, true];
    }
    const uniqueExpenseTypes = Array.from(
      new Set(type_list.map((item) => item.expense_type).filter(Boolean))
    ).map((expense_type) => {
      const matchingItem = type_list.find(
        (item) => item.expense_type === expense_type
      );
      return {
        key: expense_type,
        description: matchingItem?.order_type,
        sub_type: matchingItem?.request_sub_type,
        sub_type_check: matchingItem?.sub_type_check || false,
        per_diem_check: matchingItem?.per_diem_check || false,
        base_area_check: matchingItem?.base_area_check || false,
        distance_travel_check: matchingItem?.distance_travel_check || false,
        attendees_check: matchingItem?.attendees_check || false,
        location_required: matchingItem?.location_required || false,
        no_of_days_check: matchingItem?.no_of_days_check || false,
        attanchment_req: matchingItem?.attanchment_req || false,
        auto_calculate: matchingItem?.auto_calculate || false,
        t_and_m_only: tnm_check
      };
    });
    await this.tm.getTN("expense_type_vh").setData(uniqueExpenseTypes);
    let verification_check_list = await this.transaction.getExecutedQuery(
      "d_o2c_expense_receipt_verify",
      { receipt_id: receipt_detail.receipt_id, loadAll: true, skipMap: true }
    );
    let user_vefication_list;
    if (this.role_id == "FINANCE")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "FINANCE" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else if (this.role_id == "SM")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "SM" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id.toLowerCase() == this.login_id.toLowerCase()
      );
    if (user_vefication_list.length > 0 && user_vefication_list[0].verfication_check == false) {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "true");
    }
    else {
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "false");
    }
    const pd_list = await this.tm.getTN("r_local_perdiem").getData();
    if (pd_list && pd_list.length > 0) {
      await this.tm.getTN("relation_screen_length").setProperty("local_pd", pd_list.length);
    }
  }
  public async onCommentingReceiptApproval() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let date = new Date();
    await this.tm.getTN("r_receipt_comment_list").createEntityP(
      {
        user_name: this.full_name,
        time_of_comment: date,
        user_id: this.UserInfo[0].employee_id,
      },
      "Creation Successful",
      "Creation Failed",
      null,
      "First",
      false,
      false,
      false
    );
    await this.openDialog("pa_rec_appr_com");
    oBusyDailog.close();
  }
  public async receipt_approval() {
    let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
    let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[index];
    let user_vefication_list;
    let verification_check_list = await receipt_detail.r_expense_receipt_verify.fetch();
    if (this.role_id == "FINANCE")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "FINANCE" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else if (this.role_id == "SM")
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id == "SM" ||
          item.employee_id.toLowerCase() === this.login_id.toLowerCase()
      );
    else
      user_vefication_list = verification_check_list.filter(
        (item) => item.employee_id.toLowerCase() == this.login_id.toLowerCase()
      );
    user_vefication_list[0].verfication_check = true;
    let already_checked_list = verification_check_list.filter(
      (item) => item.verfication_check != true
    );
    receipt_detail.verification_check = true;
    if (already_checked_list.length == 0)
      receipt_detail.receipt_appr_status = "Approved";
    let receipt_new_remark = await this.tm.getTN("r_receipt_comment_list").getData()[0];
    if (receipt_new_remark.comment == null || receipt_new_remark.comment == undefined || receipt_new_remark.comment == '')
      await receipt_new_remark.deleteP();
    // await this.tm.commitP("Saved Successfully", "Save Failed", false, true);
    await this.retrySave("Saved Successfully", "Save Failed");
    await this.closeDialog("pa_rec_appr_com");
    await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "false");
  }
  public async receipt_rejection() {
    let receipt_new_remark = await this.tm.getTN("r_receipt_comment_list").getData()[0];
    if (receipt_new_remark.comment == null || receipt_new_remark.comment == undefined || receipt_new_remark.comment == '') {
      sap.m.MessageBox.error("Please Add Remark before Rejecting the Receipt", {
        title: "Error",
      });
    }
    else {
      let index = await this.tm.getTN("expense_receipt_list").getActiveIndex();
      let receipt_detail = await this.tm.getTN("expense_receipt_list").getData()[index];
      let verification_check_list = await this.transaction.getExecutedQuery(
        "d_o2c_expense_receipt_verify",
        { receipt_id: receipt_detail.receipt_id, loadAll: true, skipMap: true }
      );
      for (let i = 0; i < verification_check_list.length; i++) {
        if (verification_check_list[i].verification_check != true) {
          verification_check_list[i].verification_check = true
        }
      }
      receipt_detail.verification_check = true;
      receipt_detail.receipt_appr_status = "Rejected";
      // await this.tm.commitP("Saved Successfully", "Save Failed", false, true);
      await this.retrySave("Saved Successfully", "Save Failed");
      await this.closeDialog("pa_rec_appr_com");
      await this.tm.getTN("logged_employee").setProperty("pending_for_rec_approval", "false");
    }
  }
  public async cancelApprovalReceipt() {
    await this.transaction.rollback();
    this.setMode("DISPLAY");
    await this.closeDialog("pa_rec_appr_com");
  }
  public async onMaxAmountcChange() {
    let reimbursement = await this.tm.getTN("salary_reimburse_list").getData();
    if (reimbursement[0].previous_reimburse != reimbursement[0].max_reimburse) {
      reimbursement[0].reim_status = "Pending";
      // await this.tm.commitP("Sent for Finance Approval", "Save Failed", true, true);
      await this.retrySave("Sent for Finance Approval", "Save Failed");
    }
    else
      // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
      await this.retrySave("Saved Successfully", "Save Failed");
  }
  public async onSalVerification() {
    let reimbursement = await this.tm.getTN("salary_reimburse_list").getData()[0];
    let reimbursement_receipt_list = await reimbursement.r_reimburse_receipt.fetch();
    let current_receipt_list = await this.tm.getTN("expense_receipt_list").getData();
    // Step 1: Create a Set of receipt_ids from current_receipt_list
    const currentIds = new Set(current_receipt_list.map(r => r.receipt_id));
    // Step 2: Filter reimbursement_receipt_list to get only those NOT in current
    const uniqueReimburseReceipts = reimbursement_receipt_list.filter(
      r => !currentIds.has(r.receipt_id)
    );
    // Step 3: Combine with current_receipt_list
    const combinedReceipts = [...current_receipt_list, ...uniqueReimburseReceipts];
    // Step 4: Calculate total reimbursement_amount
    let totalReimbursementAmount = combinedReceipts.reduce((sum, receipt) => {
      return sum + (parseFloat(receipt.reimbursement_amount) || 0);
    }, 0);
    //console.log("Total Reimbursement Amount:", totalReimbursementAmount);
    if (totalReimbursementAmount <= reimbursement.max_reimburse) {
      return true;
    }
    else {
      sap.m.MessageBox.error(
        "Receipt Amount exceeding Max Limit by " + (totalReimbursementAmount - reimbursement.max_reimburse),
        { title: "Error" }
      );
      return false;
    }
  }
  public async toBase64(wrapper: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Try to extract the actual Blob if it's wrapped inside `.attachment`
        const file = wrapper?.attachment || wrapper;

        if (!file || typeof file.size !== "number" || typeof file.type !== "string") {
          return reject(new Error("Invalid Blob: Could not extract valid file"));
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // strip prefix
          resolve(base64);
        };

        reader.onerror = reject;
      } catch (error) {
        reject(new Error("Error during base64 conversion: " + error));
      }
    });
  }
  public async markAsReady() {
    let index = await this.tm.getTN("expense_list").getActiveIndex();
    let expense_detail = await this.tm.getTN("expense_list").getData()[index];
    expense_detail.expense_status = "Ready for Payment"
    // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    await this.retrySave("Saved Successfully", "Save Failed");
  }
  public async isallchecked() {
    //let checkeddays=await this.tm.getTN("r_local_perdiem").getData();
    // let checkedDays = await this.tm.getTN("r_local_perdiem").getData();
    // let claimedDays = checkedDays.filter(day => day.claim === true);
    // let totalPerAmount = claimedDays.reduce((sum, day) => {
    //   return sum + (day.per_amount || 0); // fallback to 0 if undefined/null
    // }, 0);
    // let perdiem=await this.tm.getTN("receipt_per_diem").getData()[0];
    // perdiem.no_of_days=claimedDays.length;
    // perdiem.total_amount=totalPerAmount;

    const checkedDays = await this.tm.getTN("r_local_perdiem").getData();
    let claimedDays = checkedDays.filter(day => day.claim === true);

    // Get all receipt per diem entries
    const perdiemList = await this.tm.getTN("receipt_per_diem").getData();

    for (const perdiem of perdiemList) {
      const fromDate = new Date(perdiem.from_date);
      const toDate = new Date(perdiem.to_date);

      // Get matching claimed days for current perdiem
      const matchingDays: any[] = [];

      // Use manual loop so we can also remove matched days
      claimedDays = claimedDays.filter(day => {
        const checkDate = new Date(day.per_date);
        const isInRange = checkDate >= fromDate && checkDate <= toDate;
        if (isInRange) {
          matchingDays.push(day); // collect matched day
          return false; // remove from claimedDays
        }
        return true; // keep for future iterations
      });

      // Update perdiem fields
      perdiem.no_of_days = matchingDays.length;
      perdiem.total_amount = matchingDays.reduce((sum, day) => sum + (day.per_amount || 0), 0);
    }
    await this.per_diem_declaration_calculation();
  }
  public async mailreminder() {
    const approver = await this.tm.getTN("expense_workflow_list").getData()
    await this.tm.getTN("expense_notification_search").setProperty("notif_to", approver[0].approver);
    await this.tm.getTN("expense_notification_search").setProperty("approver", this.UserInfo[0].employee_id);
    await this.tm.getTN("expense_notification_search").setProperty("notif_cc", this.login_id);
    await this.tm.getTN("expense_notification_search").setProperty("type", "reminder");
    await this.tm.getTN("expense_notification_search").executeP();
  }

  public async retrySave(sSuccessMessage: string, sErrMessage: string) {
    // Retry logic for commit operation
    let retryCount = 0;
    const maxRetries = 5;
    let commitSuccess = false;

    while (retryCount < maxRetries && !commitSuccess) {
      try {
        await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
        commitSuccess = true;
      } catch (error) {
        retryCount++;
        console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

        if (retryCount >= maxRetries) {
          sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
          throw error;
        }
        // Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
      }
    }
  }
}