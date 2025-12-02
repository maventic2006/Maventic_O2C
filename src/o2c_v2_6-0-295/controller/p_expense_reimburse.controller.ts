import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_expense_reimburse")
export default class p_expense_reimburse extends KloController {
  public login_id;
  public selected_expenses_index;
  public async onPageEnter() {
    await this.tm.getTN("transaction_entry").setData({});
    await this.tm.getTN("selected_expenses").setData({});
  }
  public async onSettlePayment() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    this.selected_expenses_index = await this.getActiveControlById(
      null,
      "s_list"
    ).getSelectedIndices();
    if (this.selected_expenses_index.length > 0) {
      let expense_list = await this.tm.getTN("expense_list").getData();
      let total_reimburse = 0.0;
      for (let j = 0; j < this.selected_expenses_index.length; j++) {
        let current_expense = expense_list[this.selected_expenses_index[j]];
        let current_expense_receipt =
          await current_expense.r_expense_receipt.fetch();
        let reimburse = 0.0;
        for (let i = 0; i < current_expense_receipt.length; i++) {
          reimburse =
            reimburse + Number(current_expense_receipt[i].reimbursement_amount);
        }
        total_reimburse = total_reimburse + reimburse;
      }
      await this.tm
        .getTN("transaction_entry")
        .setProperty("settle_money", true);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_amount", total_reimburse);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("no_of_expenses", this.selected_expenses_index.length);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_id", null);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_date", null);
      await this.tm.getTN("transaction_entry").setProperty("bank_name", null);
    } else sap.m.MessageBox.error("No Expenses Selected", { title: "Error" });
    oBusyDailog.close();
  }
  public async onCancelSettlement() {
    await this.tm.getTN("transaction_entry").setProperty("settle_money", false);
    await this.tm
      .getTN("transaction_entry")
      .setProperty("transaction_id", null);
    await this.tm
      .getTN("transaction_entry")
      .setProperty("transaction_date", null);
    await this.tm.getTN("transaction_entry").setProperty("bank_name", null);
    await this.tm
      .getTN("transaction_entry")
      .setProperty("transaction_amount", null);
    await this.tm
      .getTN("transaction_entry")
      .setProperty("no_of_expenses", null);
  }
  public async confirmSettlement() {
    let oBusyDailog = new sap.m.BusyDialog();
    oBusyDailog.open();
    let transaction = await this.tm.getTN("transaction_entry").getData();
    if (!transaction.transaction_id) {
      sap.m.MessageBox.error("Transaction ID is mandatory", { title: "Error" });
    } else if (!transaction.transaction_date) {
      sap.m.MessageBox.error("Transaction Date is mandatory", {
        title: "Error",
      });
    } else if (!transaction.bank_name) {
      sap.m.MessageBox.error("Bank Name is mandatory", { title: "Error" });
    } else {
      for (let j = 0; j < this.selected_expenses_index.length; j++) {
        await this.PayExpense(this.selected_expenses_index[j]);
      }
      await this.tm
        .getTN("transaction_entry")
        .setProperty("settle_money", false);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_id", null);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_date", null);
      await this.tm.getTN("transaction_entry").setProperty("bank_name", null);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("transaction_amount", null);
      await this.tm
        .getTN("transaction_entry")
        .setProperty("no_of_expenses", null);
      await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
      await this.tm.getTN("expense_search").executeP();
      oBusyDailog.close();
    }
  }
  public async PayExpense(index) {
    this.login_id = (await this.transaction.get$User()).login_id;
    await this.tm.getTN("expense_list").setActive(index);
    let detail = await this.tm.getTN("expense_list").getData()[index];
    let transaction = await this.tm.getTN("transaction_entry").getData();
    let workflowlist = await this.tm.getTN("expense_workflow_list").getData();
    let receipt_list = await detail.r_expense_receipt.fetch();
    let reimburse = 0.0;
    for (let i = 0; i < receipt_list.length; i++) {
      reimburse = reimburse + Number(receipt_list[i].reimbursement_amount);
    }
    await this.tm.getTN("expense_workflow_list").createEntityP(
      {
        approver: this.login_id.toUpperCase(),
        role: "FINANCE",
        created_on: new Date(),
        approved_on: new Date(),
        s_status: "Paid",
        profit_center: workflowlist[0].profit_center,
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
    detail.transaction_id = transaction.transaction_id;
    detail.transaction_date = transaction.transaction_date;
    detail.transaction_amount = reimburse;
    detail.bank_name = transaction.bank_name;
    let notif_to = "";
    let notif_cc = new Set();
    notif_to = detail.created_by;
    notif_cc.add(this.login_id);
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
      .setProperty("approver", this.login_id);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("notif_cc", notif_cc_array);
    await this.tm
      .getTN("expense_notification_search")
      .setProperty("type", "Paid");
    await this.tm.getTN("expense_notification_search").executeP();
  }
}