import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_new_settlement")
export default class p_new_settlement extends KloController{
	
	/*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
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
      let expense_list = await this.tm.getTN("receipt_list").getData();
      let total_reimburse = 0.0;
      for (let j = 0; j < this.selected_expenses_index.length; j++) {
        total_reimburse = total_reimburse + + Number(expense_list[j].reimbursement_amount);;
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
      await this.expenseStatusChange();
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
    await this.tm.getTN("receipt_list").setActive(index);
    let detail = await this.tm.getTN("receipt_list").getData()[index];
    let transaction = await this.tm.getTN("transaction_entry").getData();
    //let workflowlist = await this.tm.getTN("receipt_workflow_list").getData();
    let reimburse = Number(detail.reimbursement_amount);
    /*await this.tm.getTN("receipt_workflow_list").createEntityP(
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
    );*/
    detail.transaction_status = "Paid";
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
      .setProperty("expense", detail.receipt_id);
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
  public async expenseStatusChange(){
    if (this.selected_expenses_index.length > 0) {
      const allData = await this.tm.getTN("receipt_list").getData();
        const expense_list = this.selected_expenses_index.map(idx => allData[idx]);
      expense_list.sort((a, b) => {
      return (a.request_id ?? 0) - (b.request_id ?? 0);
        });
        const request_ids: number[] = [];
  const receipt_ids: number[] = [];

  for (const item of expense_list) {
    if (item.request_id) request_ids.push(item.request_id);
    if (item.receipt_id) receipt_ids.push(item.receipt_id);
  let requestData;
  // Remove duplicates
  const unique_request_ids = Array.from(new Set(request_ids));
  const unique_receipt_ids = Array.from(new Set(receipt_ids));
  if(unique_request_ids && unique_request_ids.length>0){
    requestData = await this.transaction.getExecutedQuery("d_o2c_expense_header", { request_id: unique_request_ids,loadAll: true});
    for(let i=0; i< requestData.length;i++){
        let current_expense_receipt =await requestData[i].r_expense_receipt.fetch();
        const isAllValid = current_expense_receipt.every((r) => {
      return (
        r.transaction_status === "Paid" ||
        new Set(unique_receipt_ids).has(r.receipt_id)
      );
    });

    if (isAllValid) {
      requestData[i].expense_status = "Paid"
      let workflowlist = await requestData[i].r_workflow_log.fetch();
      await requestData[i].r_workflow_log.newEntityP(0, {
        approver: this.login_id.toUpperCase(),
        role: "FINANCE",
        created_on: new Date(),
        approved_on: new Date(),
        s_status: "Paid",
        profit_center: workflowlist[0].profit_center
    });
}
}
    }
  }

  }}
  public async StatusFix(){
    let c= await this.transaction.getExecutedQuery('d_o2c_expense_receipt',{loadAll:true})
    for(let i =0; i< c.length; i ++){
      if(c[i].transient_status=="Paid")
        {c[i].transaction_status="Paid"} 
      else
        {c[i].transaction_status="Ready for Payment"}
    }
    await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
  }
}