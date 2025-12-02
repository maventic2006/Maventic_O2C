import {d_o2c_expense_receipt as d_o2c_expense_receipt_gen} from "o2c_v2/entity_gen/d_o2c_expense_receipt"
export class d_o2c_expense_receipt extends d_o2c_expense_receipt_gen{
    // public get verification_check(): Boolean{
    //     let login_id=this.txn.get$User().login_id;
    //     let vefication_list=this.r_expense_receipt_verify       
    //     if(vefication_list.length>0){
    //     let vefication_filteredlist=vefication_list.filter((item) => item.employee_id == login_id )
    //     if(vefication_filteredlist.length==0)
    //     return false;
    //     else
    //     return vefication_filteredlist[0].verfication_check;
    //     }
    //     else
        
    //     return false;//
    // }
    public get transient_employee(): string {
        let employee="";
        let expense = this.r_receipt_expense
        if (expense.length != 0) {
            employee=expense[0].employee_for
        };
        return employee;
    }
    public get transient_team(): string {
        let team="";
        let workflow_list = this.r_receipt_expense_workflow
        if (workflow_list.length != 0) {
                team=workflow_list[0].profit_center
        };
        return team;
    }
    public get transient_status(): string {
        let pending_with="";
        let expense = this.r_receipt_expense
        if (expense.length != 0) {
            pending_with=expense[0].expense_status
        };
        return pending_with;
    }
    public get transient_travel_id(): string {
        let pending_with="";
        let expense = this.r_receipt_expense
        if (expense.length != 0) {
            pending_with=expense[0].travel_request_id
        };
        return pending_with;
    }
    public get transient_project(): string {
    const projects = this.r_receipt_project;
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
}
