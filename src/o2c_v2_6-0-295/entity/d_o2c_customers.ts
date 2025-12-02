import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_o2c_customer_org } from "o2c_v2/entity_gen/d_o2c_customer_org";
import { d_id_series } from "o2c_v2/entity_gen/d_id_series";
import { d_o2c_cust_apprvl_flow } from "o2c_v2/entity_gen/d_o2c_cust_apprvl_flow";
import { d_o2c_customers as d_o2c_customers_gen } from "o2c_v2/entity_gen/d_o2c_customers";
import { validationUtil } from "o2c_v2/util/validationUtil";
import { d_o2c_employee } from "o2c_v2/entity_gen/d_o2c_employee";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { EventContext } from "kloBo_6-0-18";
import { d_o2c_employee_designation } from "o2c_v2/entity_gen/d_o2c_employee_designation";
import { d_o2c_designation_master } from "o2c_v2/entity_gen/d_o2c_designation_master";
import { error } from "console";

export class d_o2c_customers extends d_o2c_customers_gen {
  public async onCreatingEntity(oEvent) {
    let idquery = await this.txn.getQueryP('d_id_series');
    let newCustomer = <d_o2c_customers>oEvent.getObject();
    let id
    if (newCustomer.customer_id == "####") {
      let customersdetail = await idquery.executeP();
      if (newCustomer.s_object_type == "customer_type") {
        id = <d_id_series>(await customersdetail.newEntityP(0, { s_object_type: 'customers', key: 'a' }, null));
      }
      if (newCustomer.s_object_type == "vendor_type") {
        id = <d_id_series>(await customersdetail.newEntityP(0, { s_object_type: 'vendors', key: 'a' }, null));
      }
      newCustomer.customer_id = id.k_id;
      newCustomer.approval_cycle = 1;
      let emp_name = <KloEntitySet<d_o2c_employee>>await this.txn.getExecutedQuery('d_o2c_employee', { employee_id: newCustomer.s_created_by, loadAll: true });
      newCustomer.sales_responsible = newCustomer.s_created_by.toUpperCase();
      newCustomer.sales_responsible_name = emp_name[0].first_name.concat(" ", emp_name[0].last_name);
      let approvequery = await this.txn.getQueryP('d_o2c_cust_apprvl_flow');
      let approvedetail = await approvequery.executeP();
      let newapprove = <d_o2c_cust_apprvl_flow>(await approvedetail.newEntityP(0, { s_object_type: 'approval_object' }, null));
      newapprove.customer_id = newCustomer.customer_id;
      newapprove.pending_with_level = 1;
      newapprove.pending_with_role = 1;
      newapprove.approval_cycle = 1;
      newapprove.approval_status = 'Pending';
      let neworg = <d_o2c_customer_org>oEvent.getObject().r_customer_organistion;
      newapprove.company_code = neworg[0].company_code;
      newapprove.business_area = neworg[0].business_area;
      neworg[0].customer_id = newCustomer.customer_id;
      neworg[0].customer_name = newCustomer.customer_name;
      newCustomer.cal_buss = neworg[0].business_area;
      newCustomer.cal_comp = neworg[0].company_code;
      newapprove.insert_datetime = newapprove.s_created_on;
      for (let cont = 0; cont < newCustomer.r_customer_contact.length; cont++) {
        newCustomer.r_customer_contact[cont].k_id = newCustomer.customer_id;
      }
      for (let doc = 0; doc < newCustomer.r_customers_doc.length; doc++) {
        newCustomer.r_customers_doc[doc].customer_id = newCustomer.customer_id;
      }
      for (let map = 0; map < newCustomer.r_customer_map.length; map++) {
        newCustomer.r_customer_map[map].customer_id = newCustomer.customer_id;
      }
    }
  }


  public async onCreateNotif(oEvent: EventContext) {
    // let data = <d_o2c_customers>oEvent.getObject();
    // let legalIDArray = [];
    // let desig_id = <KloEntitySet<d_o2c_designation_master>>await this.txn.getExecutedQuery('d_o2c_designation_master', { name: 'LEGAL', loadAll: true });
    // let legalID = <KloEntitySet<d_o2c_employee_designation>>await this.txn.getExecutedQuery('d_o2c_employee_designation', { loadAll: true, designation: desig_id[0].designation_id });
    // for (let emp of legalID) {
    //   legalIDArray.push(emp.employee_id.toLowerCase());
    // }
    // try{
    //   data.txn.addNotification('customer_create_notif', this, {
    //     sales_responsible_name: data.sales_responsible_name, customer_name: data.customer_name, customer_id: data.customer_id
    //   }, legalIDArray);
    // }catch(e){
    //   this.error(e);
    //   throw new Error(e);
    // }
  }


  public async OnValidate() {
    if (!this.currency_type && this.s_status != "Saved as Draft") {
      this.errors.push(new ValidationError(this, "currency_type", "101", "Currency Type Missing"));
    }
    if (!this.industry_type && this.s_status != "Saved as Draft") {
      this.errors.push(new ValidationError(this, "industry_type", "101", "Industry Type Missing"));
    }
    if (this.domain_id && this.domain_id != "     ") {
      let regexdomain = new RegExp(/^(?!-)([a-z0-9-](?!--)(?!\.\.))+([\.]{1}[a-z0-9-]+)+$/i)
      if (!regexdomain.test(this.domain_id)) {
        this.errors.push(new ValidationError(this, "domain_id", "101", "Domain Name is Invalid"));
      }
      else if (this.r_customer_organistion[0]) {
        let company_code = this.r_customer_organistion[0].company_code;
        // excluding the list of rejected and blocked customer. As rejected or blocked customer domain can be used in future. 
        let customer_list = <KloEntitySet<d_o2c_customers>>await this.txn.getExecutedQuery('d_o2c_customers', { cal_comp: company_code, domain_id: this.domain_id, s_status: ["Saved as Draft","Approved","Pending"], loadAll: true })
        let dup_count = 0;
        if (customer_list.length > 0) {
          for (let i = 0; i < customer_list.length; i++) {
            if (customer_list[i].customer_id != this.customer_id) {
              dup_count = dup_count + 1;
            }
          }
          if (dup_count > 0) {
            this.errors.push(new ValidationError(this, "domain_id", "101", "Domain Already Exist"));
          }
        }
      }
    }
    if (this.website_url) {
      this.errors.concat(validationUtil.validatePattern(this, [
        { pattern: /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g, entityPropertyId: "website_url", msg: "Website URL is not proper" },
      ]))
    }
    if (this.customer_mail_id) {
      this.errors.concat(validationUtil.validatePattern(this, [
        { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, entityPropertyId: "customer_mail_id", msg: "Mail is not proper" }
      ]))
    }
    if (!this.is_NDA_available) {
      this.is_NDA_available = this.upload_NDA.hasAttachment;
    }
    if (!this.is_msa_available) {
      this.is_msa_available = this.upload_MSA.hasAttachment;
    }
    if (this.is_NDA_required == true && this.s_status != "Saved as Draft") {
      if (this.is_NDA_available == false) {
        this.errors.push(new ValidationError(this, "is_NDA_available", "101", "NDA File Missing"));
      }
      if (!this.NDA_expiry_date) {
        this.errors.push(new ValidationError(this, "NDA_expiry_date", "101", "NDA Expiry Date Missing"));
      }
    }
    if (this.is_NDA_required == false && this.is_NDA_available == false) {
      this.NDA_expiry_date = null;
    }
    if (this.msa_required == true && this.s_status != "Saved as Draft") {
      if (this.is_msa_available == false) {
        this.errors.push(new ValidationError(this, "is_msa_available", "101", "MSA File Missing"));
      }
      if (!this.MSA_expiry_date) {
        this.errors.push(new ValidationError(this, "MSA_expiry_date", "101", "MSA Expiry Date Missing"));
      }
    }
    if (this.MSA_expiry_date) {
      let today = new Date();
      if (this.MSA_expiry_date < today && this.s_status != "Approved") {
        this.errors.push(new ValidationError(this, "MSA_expiry_date", "101", "MSA Expiry Date Should be Future Date"));
      }
    }
    if (this.NDA_expiry_date) {
      let today = new Date();
      if (this.NDA_expiry_date < today && this.s_status != "Approved") {
        this.errors.push(new ValidationError(this, "NDA_expiry_date", "101", "NDA Expiry Date Should be Future Date"));
      }
    }
    if (this.msa_required == false && this.is_msa_available == false) {
      this.MSA_expiry_date = null;
    }
    // if (!this.gstin_vat && this.country_code=="IND") {
    //   this.errors.push(new ValidationError(this, "map_country", "101", "GST mandatory for Indian Address"));
    // }
    // if (this.r_customer_map.length != 0 && this.s_status != "Saved as Draft") {
    //   for (let i = 0; i < this.r_customer_map.length; i++) {
    //     let v = this.r_customer_map[i].r_o2c_address[0].address_1
    //     if (!v) {
    //       this.errors.push(new ValidationError(this, "address_1", "101", "Address 1 is missing"));
    //     }
    //   }
    // }
    for (let i = 0; i < (this.r_customer_contact.length); i++) {
      let num = this.r_customer_contact[i].contact_number;
      if (num) {
        let regex_phone = /^[0-9]{10}$/;
        if (!regex_phone.test(num) && this.r_customer_contact[i].country_code == "91") {
          this.errors.push(new ValidationError(this, "contact_number", "101", "Contact Number is not proper"));
        }
      }
      let linkedin = this.r_customer_contact[i].linkedin_link;
      if (linkedin) {
        let regex_linkedin = /^http(s)?:\/\/([\w]+\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?/gm;
        if (!regex_linkedin.test(linkedin)) {
          this.errors.push(new ValidationError(this, "linkedin_link", "101", "Linked In is not proper"));
        }
      }
    }
    if (this.s_status != "Approved" && this.r_customer_organistion && this.r_customer_organistion.length) {
      let org_name = this.r_customer_organistion[0].customer_name;
      if (this.customer_name != org_name) {
        org_name = this.customer_name;
        this.r_customer_organistion[0].customer_name = org_name;
      }
    }
  }
  public get domain_id(): string { return this.g("domain_id", "string"); }
  public set domain_id(newValue: string) {
    newValue = newValue.toLowerCase();
    newValue = newValue.replace(/\s/g, "");  //remove space  
    try {
      let url = new URL(newValue);
      newValue = url.hostname;
    }
    catch (err) {
      console.log(err);
    }

    let remove_prefix = ['http', 'https', 'www'];
    if (newValue.split("/").some(ele => remove_prefix.includes(ele)) || newValue.split(".").some(ele => remove_prefix.includes(ele))) {
      newValue = newValue.replace(/^https?:?\/?\/?/, ""); //Scheme
      newValue = newValue.replace(/^www\.?/, "");         //prefix
      newValue = newValue.replace(/:.*/, "");             //port     
      newValue = newValue.replace(/\/(.*)?/, "");         //path or filename   
    }
    this.s("domain_id", newValue, "string", false, false);
  }
}