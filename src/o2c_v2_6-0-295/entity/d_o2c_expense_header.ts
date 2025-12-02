import { d_o2c_expense_header as d_o2c_expense_header_gen } from "o2c_v2/entity_gen/d_o2c_expense_header";
export class d_o2c_expense_header extends d_o2c_expense_header_gen {
  public get days_since_action(): number {
    let last_work_day;
    let workflow_list = this.r_workflow_log;
    if (
      workflow_list.length != 0 &&
      this.expense_status != "Saved as Draft" &&
      this.expense_status != "New"
    ) {
      if (workflow_list[0].approved_on) {
        last_work_day =
          new Date().getTime() - workflow_list[0].approved_on.getTime();
        return Math.trunc(last_work_day / (1000 * 60 * 60 * 24));
      } else {
        last_work_day =
          new Date().getTime() - workflow_list[0].created_on.getTime();
        return Math.trunc(last_work_day / (1000 * 60 * 60 * 24));
      }
    }
  }
  public get pending_with(): string {
    let pending_with = "";
    let workflow_list = this.r_workflow_log;
    if (workflow_list.length != 0) {
      for (let i = 0; i < workflow_list.length; i++) {
        if (workflow_list[i].s_status == "In-Progress") {
          pending_with = workflow_list[i].role;
          break;
        }
      }
    }
    return pending_with;
  }
  public get total_amount(): string {
    let receipt_list = this.r_expense_receipt;
    if (!receipt_list || receipt_list.length === 0) {
      return "No data";
    } else {
      const currencyTotals: { [key: string]: number } = {};
      for (let i = 0; i < receipt_list.length; i++) {
        const { currency_code, expense_amount } = receipt_list[i];
        const amount = Number(expense_amount);

        if (currencyTotals[currency_code]) {
          currencyTotals[currency_code] += amount;
        } else {
          currencyTotals[currency_code] = amount;
        }
      }
      const totalsString = Object.entries(currencyTotals)
        .map(([currency, amount]) => `${currency}: ${amount.toFixed(2)}`)
        .join(", ");

      return totalsString;
    }
  }
  // public get project_list(): string {
  //   const projects = this.r_expense_project;
  //   if (projects && projects.length > 0) {
  //     const projectNames = projects.map((p) => p.project_name).join(", ");
  //     return projectNames;
  //   } else return "";
  // }
  public get project_list(): string {
    const projects = this.r_expense_project;
    if (Array.isArray(projects) && projects.length > 0) {
      const seen = new Set<string>();
      const uniqueNames: string[] = [];
  
      for (const p of projects) {
        const name = p?.project_name?.trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          uniqueNames.push(name);
        }
      }
  
      return uniqueNames.join(", ");
    } else {
      return "";
    }
  }
  public get reimburse_amount(): number {
    const receiptList = this.r_expense_receipt;
    if (receiptList && receiptList.length>0) {
      const total = Object.values(receiptList).reduce((sum, receipt: any) => {
        return sum + (parseFloat(receipt.reimbursement_amount) || 0);
      }, 0);
      return parseFloat(total.toFixed(2));
    } else {
      return 0.00;
    }
  }
  public get type_list(): string {
    const receipt = this.r_expense_receipt;
    if (Array.isArray(receipt) && receipt.length > 0) {
      const seen = new Set<string>();
      const uniquetype: string[] = [];
  
      for (const p of receipt) {
        const type = p?.receipt_type?.trim();
        if (type && !seen.has(type)) {
          seen.add(type);
          uniquetype.push(type);
        }
      }
  
      return uniquetype.join(", ");
    } else {
      return "";
    }
  }
}