import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_idseries } from "o2c_v2_base/entity_gen/d_idseries";
import { d_o2c_so_hdr as d_o2c_so_hdr_gen } from "o2c_v2/entity_gen/d_o2c_so_hdr";
import { validationUtil } from "o2c_v2/util/validationUtil";
import { d_o2c_employee } from "./d_o2c_employee";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_profit_centre } from "o2c_v2/entity_gen/d_o2c_profit_centre";
import { employeeName } from "o2c_v2/util/employeeName";
import { count } from "console";
export class d_o2c_so_hdr extends d_o2c_so_hdr_gen {
  public async onCreateEntity(oEvent) {
    let newid = <d_o2c_so_hdr>oEvent.getObject();
    let idquery = await this.txn.getQueryP('d_idseries')
    idquery.setLoadAll(true);
    let employeeid = await idquery.executeP();
    let id = <d_idseries>(await employeeid.newEntityP(0, { s_object_type: 'so_header' }, null));
    newid.so = id.a_id;
    // let emp_name = <KloEntitySet<d_o2c_employee>> await this.txn.getExecutedQuery('d_o2c_employee', { 'employee_id': newid.s_created_by});
    // newid.so_created_by = newid.s_created_by.concat(" - ",emp_name[0].first_name," ",emp_name[0].last_name);
  }
  public get item_pds(): string {
    let totalAmount = 0; // Initialize total amount variable

    for (let i = 0; i < this.r_so_attachment.length; i++) {
      // Add the item_pd_or_qty to totalAmount
      totalAmount += this.r_so_attachment[i].budgeted_pd;
    }

    // Return the total amount
    return totalAmount.toString();
  }
  public set item_pds(new_value: string) { this.s("item_pds", new_value, "string", false, false) }

  public get transient_po(): string {
    //   let pos = '';
    //   if(this.type == 'SO')
    //   {
    //     if (this.r_item_details.length > 0) {
    //       if (this.r_item_details.length === 1) {
    //         pos = this.r_item_details[0].po || this.customer_po_number || '';
    //       } else {
    //         pos = this.r_item_details[0].po || this.customer_po_number || '';
    //         let remainingPosCount = this.r_item_details.length - 1;
    //         pos += '+' + remainingPosCount;
    //       }
    //     } else {
    //       pos = this.customer_po_number || '';
    //     }
    // }
    //   return pos;
    let po = ''
    for (let i = 0; i < this.r_so_attachment.length; i++) {
      if (i > 0) {
        po += ","
      }
      po += this.r_so_attachment[i].po_no
    }
    return po;
  }
  public set transient_po(new_value: string) { this.s("transient_po", new_value, "string", false, false) }

  public get currently_pending_with(): string {
    let pending_with = '';
    let pendingCount = 0;
    if (this.s_status === "Call Back") {
      return this.s_created_by.toUpperCase()
    }
    if (this.s_status !== "Approved" || this.cr_status === "Open") {
      for (let i = 0; i < this.r_currently_pending.length; i++) {
        const pendingItem = this.r_currently_pending[i];

        if (this.approval_cycle === pendingItem.approval_cycle && pendingItem.approval_status === "Pending") {
          if (pendingItem.pending_with_role.includes("FINANCE")) {
            return "FINANCE";
          }
          if (pendingCount > 0) {
            pending_with += ",";
          }
          pending_with += pendingItem.pending_with_role;
          // //Add by Albia for name
          // for (let j = 0; j < this.r_profit_center.length; j++) {
          //   if (j > 0) {
          //     pending_with += ",";
          //   }
          //   let pending = this.r_profit_center[j].team_head;
          //   pending_with += pending;
          // }
          // //End
          pendingCount++;
        }

        if (pendingItem.approval_status === "Return Back" && this.approval_cycle === pendingItem.approval_cycle) {
          return this.s_created_by.toUpperCase();
        }
      }
    }
    return pending_with;
  }

  public set currently_pending_with(new_value: string) { this.s("currently_pending_with", new_value, "string", false, false) }

  public get trans_po_to_line(): boolean {
    if (this.r_so_attachment.length === 1 && this.r_item_details.length === 1) {
      return true;
    }
    if (this.r_so_attachment.length > 1) {

      const itemDetailsRemarks = new Set(this.r_item_details.map(item => item.po));

      for (const attachment of this.r_so_attachment) {
        if (!itemDetailsRemarks.has(attachment.so_remark)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  public set trans_po_to_line(new_value: string) { this.s("trans_po_to_line", new_value, "boolean", false, false) }

  public get trans_line_to_po(): boolean {

    if (this.r_so_attachment.length === 1 && this.r_item_details.length === 1) {
      return true;
    }


    if (this.r_item_details.length > 1) {

      const attachmentRemarks = new Set(this.r_so_attachment.map(attachment => attachment.so_remark));
      for (const item of this.r_item_details) {
        if (!attachmentRemarks.has(item.po)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  public set trans_line_to_po(new_value: string) { this.s("trans_line_to_po", new_value, "boolean", false, false) }

  public get transient_pro_manager(): string {
    let project_manager = ''
    for (let i = 0; i < this.r_profit_center.length; i++) {
      if (i > 0) {
        project_manager += ",";
      }
      let profit_pm = this.r_profit_center[i].project_manager;
      project_manager += profit_pm;
    }
    return project_manager
  }

  public set transient_pro_manager(new_value: string) { this.s("transient_pro_manager", new_value, "string", false, false) }


  public get transient_gross(): string {
    let gross_value = 0;
    for (let i = 0; i < this.r_so_attachment.length; i++) {
      gross_value += this.r_so_attachment[i].gross_value
    }
    return gross_value.toString();
  }
  public set transient_gross(new_value: string) { this.s("transient_gross", new_value, "string", false, false) }

  public get transient_profit_center(): string {
    let profit_center = ''
    for (let i = 0; i < this.r_profit_center.length; i++) {
      if (i > 0) {
        profit_center += ","
      }
      let pc = this.r_profit_center[i].profit_center
      profit_center += pc
    }
    return profit_center;
  }
  public set transient_profit_center(new_value: string) { this.s("transient_profit_center", new_value, "string", false, false) }

  //new added for Team Head Start
  public get trans_team_head(): string {
    let th = ''
    for (let i = 0; i < this.r_profit_center.length; i++) {
      if (i > 0) {
       th += ",";
      }
      let teamHead = this.r_profit_center[i].team_head;
      th += teamHead;
    }
    return th;
  }

  public set trans_team_head(new_value: string) { this.s("trans_team_head", new_value, "string", false, false) }
  //new code End

   //new added for Project Start
   public get transient_project_id(): string {
    let proj = ''
    for (let i = 0; i < this.r_project.length; i++) {
      if(this.r_project[i].s_status == "Archived"){
        continue;
      }
      if (i > 0) {
       proj += ",";
      }
      let projectID = this.r_project[i].project_id;
      proj += projectID;
    }
    return proj;
  }

  public set transient_project_id(new_value: string) { this.s("transient_project_id", new_value, "string", false, false) }
  //new code End

  //Pending PO count start..
  public get trans_pending_po_count(): number {
    let count = 0;
    for (let i = 0; i < this.r_so_attachment.length; i++) {
      if(this.r_so_attachment[i].attachment_type == "AM"){
        count++;
      }
    }
    return count;
  }
  public set trans_pending_po_count(new_value: number) { this.s("trans_pending_po_count", new_value, "number", false, false) }
  
  public async OnValidate() {
    if (this.s_status != "Save As Draft") {
      if (this.type == "PS") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //   { entityPropertyId: "company", msg: "Company is mandatory" },
          //   { entityPropertyId: "type", msg: "Order Type is mandatory" },
          //   { entityPropertyId: "business_area", msg: "Business Area is mandatory" },
          //   // {entityPropertyId:"po_category",msg:"PO Category is mandatory"},
          //   { entityPropertyId: "project_name", msg: "Project Name is mandatory" },
          //   { entityPropertyId: "project_start_date", msg: "Project Start Date is mandatory" },
          //   { entityPropertyId: "project_end_date", msg: "Project End Date is mandatory" },
          //   { entityPropertyId: "office_calendar", msg: "Office Calender is mandatory" },
          //  // { entityPropertyId: "bill_to_customer", msg: "Bill To Customer is mandatory" },
          //   // {entityPropertyId:"ship_to_customer",msg:"Ship To Customer is mandatory"},
          //  // { entityPropertyId: "currency", msg: "Currency is mandatory" },
          //   // {entityPropertyId:"cr_rate",msg:"CR Rate is mandatory"},
          //   // {entityPropertyId:"net_value",msg:"Net Value is mandatory"},
          //   // {entityPropertyId:"gross_value",msg:"Gross Value is mandatory"},
          //   { entityPropertyId: "pre_sales", msg: "Pre Sales By is mandatory" },
          //   //{ entityPropertyId: "sales_responsible", msg: "Sales Responsible is mandatory" },
          //   //{ entityPropertyId: "reimbursement_remark", msg: "Reimbursement Remark is mandatory" },
        ]))
      }
      if (this.type == "PS" && this.onsite_required == true) {
        this.errors.concat(validationUtil.validateMandatory(this, [
          // { entityPropertyId: "reimbursement_rules", msg: "Reimbursement Rules is mandatory" },
          // { entityPropertyId: "per_diem_rate", msg: "Per Diem Rate is mandatory" }
        ]))
      }
      if (this.type == "PS" && this.onsite_required == true && this.reimbursement_rules === "CIP") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //{ entityPropertyId: "is_reimbursement_billable", msg: "Cost Included in Project is mandatory" }
        ]))
      }
      if (this.type == "NBS") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          // { entityPropertyId: "company", msg: "Company is mandatory" },
          // { entityPropertyId: "type", msg: "Order Type is mandatory" },
          // { entityPropertyId: "business_area", msg: "Business Area is mandatory" },
          // // {entityPropertyId:"po_category",msg:"PO Category is mandatory"},
          // { entityPropertyId: "project_name", msg: "Project Name is mandatory" },
          // { entityPropertyId: "project_start_date", msg: "Project Start Date is mandatory" },
          // { entityPropertyId: "project_end_date", msg: "Project End Date is mandatory" },
          // { entityPropertyId: "office_calendar", msg: "Office Calender is mandatory" },
          // //{ entityPropertyId: "reimbursement_remark", msg: "Reimbursement Remark is mandatory" },
        ]))
      }
      if (this.type == "NBS" && this.onsite_required == true) {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //{ entityPropertyId: "reimbursement_rules", msg: "Reimbursement Rules is mandatory" },
          //{ entityPropertyId: "per_diem_rate", msg: "Per Diem Rate is mandatory" },
        ]))
      }
      if (this.type == "NBS" && this.onsite_required == true && this.reimbursement_rules === "CIP") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //{ entityPropertyId: "is_reimbursement_billable", msg: "Cost Included in Project is mandatory" }
        ]))
      }
      if (this.type == "ISP") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          // { entityPropertyId: "company", msg: "Company is mandatory" },
          // { entityPropertyId: "type", msg: "Order Type is mandatory" },
          // { entityPropertyId: "business_area", msg: "Business Area is mandatory" },
          // // {entityPropertyId:"po_category",msg:"PO Category is mandatory"},
          // { entityPropertyId: "project_name", msg: "Project Name is mandatory" },
          // { entityPropertyId: "project_start_date", msg: "Project Start Date is mandatory" },
          // { entityPropertyId: "project_end_date", msg: "Project End Date is mandatory" },
          // { entityPropertyId: "office_calendar", msg: "Office Calender is mandatory" },
          // //{ entityPropertyId: "bill_to_customer", msg: "Bill To Customer is mandatory" },
          // // {entityPropertyId:"ship_to_customer",msg:"Ship To Customer is mandatory"},
          // //{ entityPropertyId: "currency", msg: "Currency is mandatory" },
          // // {entityPropertyId:"net_value",msg:"Net Value is mandatory"},
          // // {entityPropertyId:"gross_value",msg:"Gross Value is mandatory"},
          // // {entityPropertyId:"customer_po_number",msg:"Customer PO Number"},
          // //{ entityPropertyId: "reimbursement_remark", msg: "Reimbursement Remark is mandatory" },
        ]))
      }
      if (this.type == "ISP" && this.onsite_required == true) {
        this.errors.concat(validationUtil.validateMandatory(this, [
          // { entityPropertyId: "reimbursement_rules", msg: "Reimbursement Rules is mandatory" },
          //{ entityPropertyId: "per_diem_rate", msg: "Per Diem Rate is mandatory" }
        ]))
      }
      if (this.type == "ISP" && this.onsite_required == true && this.reimbursement_rules === "CIP") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //{ entityPropertyId: "is_reimbursement_billable", msg: "Cost Included in Project is mandatory" }
        ]))
      }
      if (this.type == "SO") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //   { entityPropertyId: "company", msg: "Company is mandatory" },
          //   { entityPropertyId: "type", msg: "Order Type is mandatory" },
          //   { entityPropertyId: "business_area", msg: "Business Area is mandatory" },
          //   // {entityPropertyId:"po_category",msg:"PO Category is mandatory"},
          //   { entityPropertyId: "project_name", msg: "Project Name is mandatory" },
          //   { entityPropertyId: "project_start_date", msg: "Project Start Date is mandatory" },
          //   { entityPropertyId: "project_end_date", msg: "Project End Date is mandatory" },
          //   { entityPropertyId: "office_calendar", msg: "Office Calender is mandatory" },
          //  // { entityPropertyId: "bill_to_customer", msg: "Bill To Customer is mandatory" },
          //   // {entityPropertyId:"ship_to_customer",msg:"Ship To Customer is mandatory"},
          //   // {entityPropertyId:"customer_po_number",msg:"Customer PO Number is mandatory"},
          //   //{ entityPropertyId: "currency", msg: "Currency is mandatory" },
          //   // {entityPropertyId:"net_value",msg:"Net Value is mandatory"},
          //   // {entityPropertyId:"gross_value",msg:"Gross Value is mandatory"},
          //   // {entityPropertyId:"cr_rate",msg:"CR Rate is mandatory"},
          //   { entityPropertyId: "pre_sales", msg: "Pre Sales By is mandatory" },
          //   //{ entityPropertyId: "sales_responsible", msg: "Sales Responsible is mandatory" },
          //   //{ entityPropertyId: "reimbursement_remark", msg: "Reimbursement Remark is mandatory" },
        ]))
      }
      if (this.type == "SO" && this.onsite_required == true) {
        this.errors.concat(validationUtil.validateMandatory(this, [
          // { entityPropertyId: "reimbursement_rules", msg: "Reimbursement Rules is mandatory" },
          // { entityPropertyId: "per_diem_rate", msg: "Per Diem Rate is mandatory" },
        ]))
      }
      if (this.type == "SO" && this.onsite_required == true && this.reimbursement_rules === "CIP") {
        this.errors.concat(validationUtil.validateMandatory(this, [
          //{ entityPropertyId: "is_reimbursement_billable", msg: "Cost Included in Project is mandatory" }
        ]))
      }
    }
  }

}