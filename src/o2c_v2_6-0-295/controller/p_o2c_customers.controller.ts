import { KloAjax, AUTHORIZATION_TYPE } from "kloBo/kloCommon/KloAjaxHandler";
import { System } from "kloBo/kloCommon/System/System";
import { KloController } from 'kloTouch/jspublic/KloController';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { d_o2c_cust_apprvl_mstr } from 'o2c_v2/entity_gen/d_o2c_cust_apprvl_mstr';
import { d_o2c_cust_apprvl_flow } from 'o2c_v2/entity_gen/d_o2c_cust_apprvl_flow';
import { d_o2c_employee_designation } from 'o2c_v2/entity/d_o2c_employee_designation';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_general_confg } from "o2c_v2/entity_gen/d_general_confg";
import { d_o2c_customers } from "o2c_v2/entity/d_o2c_customers";
import { d_o2c_customers_map } from "o2c_v2/entity/d_o2c_customers_map";
import { d_o2c_address } from "o2c_v2/entity_gen/d_o2c_address";
import { d_o2c_customers_contact } from "o2c_v2/entity/d_o2c_customers_contact";
import { send } from "process";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_customers")
export default class p_o2c_customers extends KloController {
    public roleid;
    public company;
    public bus_area;
    public login_id;
    public full_name;
    public fileup;
    public filenm;
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter() { // Function For Setting Data on Entering Customer Screen
        this.roleid = (await this.transaction.get$Role()).role_id;
        this.login_id = (await this.transaction.get$User()).login_id;
        this.tm.getTN("o2c_customeer_search").setProperty('s_object_type', 'customer_type');
        this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Approved');
        if (this.roleid == "SALES") {
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', this.login_id.toLowerCase());
        }
        else {
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
        }
        await this.tm.getTN("o2c_customeer_search").executeP();
        this.tm.getTN("user_role_store").setData({});
        this.tm.getTN("other_comment").setData({});
        this.tm.getTN("login_id_store").setData({});
        let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: this.login_id, fdate: new Date().getTime(), tdate: new Date().getTime() });
        if (emp_designation.length > 0) {
            let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { designation_id: emp_designation[0].designation, loadAll: true });
            let name = emp_designation_name[0].name.toUpperCase();
            if (this.roleid == undefined)
                this.roleid = name;
            let UserInfo = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { employee_id: this.login_id, loadAll: true });
            this.full_name = UserInfo[0].first_name.concat(" ", UserInfo[0].last_name);
            let company_table = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: this.login_id, is_primary: true, loadAll: true })
            if (company_table[0]) {
                this.company = company_table[0].company_code;
                this.bus_area = company_table[0].business_area;
            }
        }
        let id_login = '';
        id_login = this.login_id;
        this.tm.getTN("user_role_store").setProperty('roler', this.roleid);
        this.tm.getTN("other_comment").setProperty('user_name', this.full_name);
        this.tm.getTN("login_id_store").setProperty('user_id', id_login?.toUpperCase());
    }
    public async resetlist() { // Function For Resetting Data on Customer Screen
        this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Approved');
        this.tm.getTN("o2c_customeer_search").setProperty('customer_status', '');
        if (this.roleid == "SALES") {
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', this.login_id.toLowerCase());
        }
        else {
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
        }
        await this.tm.getTN("o2c_customeer_search").executeP();
    }
    public async blockedlist() { // Function For Resetting Data on Customer Screen
        this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Blocked');
        this.tm.getTN("o2c_customeer_search").setProperty('customer_status', '');
        this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
        await this.tm.getTN("o2c_customeer_search").executeP();
    }
    public async navigate_detail(oEvent) { // Function For Navigating To Detail Screen
        this.setMode('DISPLAY');
        await this.navTo(({ SS: "pa_o2c_custom_detail" }), oEvent);
    }
    public tonavwebsite() { // Function For Navigating To the Provided Website
        let url = this.tm.getTN('o2c_custom_detail').getData().website_url;
        window.open(url, "_blank")
    }
    public async filter_list() { // Function For Filtering The Customer Pending With Me List
        if (this.roleid && this.roleid != 'TEAM_HEAD' && this.roleid != 'TEAM HEAD' && this.roleid != 'SALES') {
            this.tm.getTN("o2c_customeer_search").setProperty('s_status', ['Pending', 'Rejected', 'Saved as Draft']);
            this.tm.getTN("o2c_customeer_search").setProperty('customer_status', this.roleid);
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
            await this.tm.getTN("o2c_customeer_search").executeP();
        }
        else if (this.roleid == 'TEAM_HEAD' || this.roleid == 'TEAM HEAD' || this.roleid == 'SALES') {
            this.tm.getTN("o2c_customeer_search").setProperty('s_status', ['Rejected', 'Saved as Draft']);
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', this.login_id.toLowerCase());
            this.tm.getTN("o2c_customeer_search").setProperty('customer_status', ['SALES']);
            await this.tm.getTN("o2c_customeer_search").executeP();
        }
        else {
            this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Approved');
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
            await this.tm.getTN("o2c_customeer_search").executeP();
        }
    }
    public async approve_list() { // Function For Filtering The Customer Pending for Approval List
        if (this.roleid) {
            this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Pending');
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', this.login_id.toLowerCase());
            this.tm.getTN("o2c_customeer_search").setProperty('customer_status', ''/*['LEGAL', 'FINANCE']*/);
            await this.tm.getTN("o2c_customeer_search").executeP();
        }
        else {
            this.tm.getTN("o2c_customeer_search").setProperty('s_status', 'Approved');
            this.tm.getTN("o2c_customeer_search").setProperty('created_by', '');
            await this.tm.getTN("o2c_customeer_search").executeP();
        }
    }
    public async confirmreject() { // Function of Corfirmation for Rejecting
        sap.m.MessageBox.confirm("Are You Sure You want to Reject the Customer", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.rejection();
                }
            }
        })
    }
    public async rejection() { // Function for Rejection
        let entity = this.tm.getTN('o2c_custom_detail').getData();

        // Mail notification
        this.legalRejectNotification();

        let rejection_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { customer_id: entity.customer_id, approval_status: "Pending", loadAll: true })
        if (rejection_flow.length) {
            rejection_flow[0].approval_status = "Rejected";
            rejection_flow[0].action_datetime = rejection_flow[0].s_modified_on;
            entity.s_status = "Rejected";

            let cycle = entity.approval_cycle;
            entity.approval_cycle = cycle + 1;
        }
        entity.r_level = 0;
        entity.customer_status = 'SALES';
        // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
        await this.retrySave("Saved Successfully", "Save Failed");
        this.filter_list();


    }
    public async confirmapprove() { // Function of Corfirmation for Approval
        sap.m.MessageBox.confirm("Are You Sure You want to Approve the Customer", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.approval();
                }
            }
        })

    }
    public async approval() { // Function for Approval
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        let org = this.tm.getTN('o2c_customer_org_detail').getData();
        let approval_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { customer_id: entity.customer_id, approval_status: "Pending", pending_with_level: entity.r_level, loadAll: true })
        let approval_master = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: org.business_area, company_code: org.company_code, loadAll: true })

        if (approval_flow.length && approval_master.length) {
            approval_flow[0].approval_status = "Approved";
            approval_flow[0].action_datetime = approval_flow[0].s_modified_on;
            let level = entity.r_level;
            if (level < approval_master.length) {
                level = level + 1;
                entity.r_level = level;
                let level_str = String(level);
                let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: org.business_area, company_code: org.company_code, Level: level_str, loadAll: true })
                entity.customer_status = approval_role[0].Role;
                await this.tm.getTN("o2c_custom_detail/r_customer_approval").createEntityP({ s_object_type: "approval_object", approval_cycle: entity.approval_cycle, pending_with_role: level, pending_with_level: level, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: org.business_area, company_code: org.company_code }, null, null, null, "First", false, false, false);
            }
            else if (level == approval_master.length) {
                level = -1;
                entity.s_status = "Approved";
                entity.r_level = level;
                entity.customer_status = '';
                entity.previous_status = "Pending";

                //Customer Creation in ZOHO

                // const zoho_grant_type = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_grant_type", loadAll: true });
                // const zoho_redirect_uri = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_redirect_uri", loadAll: true });
                // const zoho_client_secret = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_client_secret", loadAll: true });
                // const zoho_client_id = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_client_id", loadAll: true });
                // const zoho_refresh_token = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_refresh_token", loadAll: true });
                // const organizationId = await this.transaction.getExecutedQuery('d_general_confg', { key: "zoho_organization_id", loadAll: true });

                // const billToParty = entity.r_customer_map.find(item => item.adress_type1 === "Bill to Party");

                // const customerGSTNumber = billToParty?.gstin_vat || "";

                // const firstO2CAddress = billToParty?.r_o2c_address?.[0] || {};

                // const customerAddress = `${firstO2CAddress.address_1 || ""} ${firstO2CAddress.address_2 || ""}`.trim();
                // const customerCity = firstO2CAddress.city || "";
                // const customerPinCode = firstO2CAddress.pincode || "";

                // const firstCustomerContact = entity.r_customer_contact?.[0] || {};

                // const customerContactPerson = `${firstCustomerContact.title || ""} ${firstCustomerContact.contact_name || ""}`.trim();
                // const customerContactNumber = firstCustomerContact.contact_number || "";
                // const customerContactEmailAddress = firstCustomerContact.email_id || "";
                // const customerContactDesignation = firstCustomerContact.contact_designation || "";
                // const customerWebsite = entity.domain_id || "";
                // const customerPaymentTerms = entity.payment_term || "";



                // const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                //     url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getZohoCustomerCreation", true),
                //     data: {
                //         zohoRefreshToken: zoho_refresh_token[0].low_value,
                //         zohoClientId: zoho_client_id[0].low_value,
                //         zohoClientSecret: zoho_client_secret[0].low_value,
                //         zohoRedirectURI: zoho_redirect_uri[0].low_value,
                //         zohoGrantType: zoho_grant_type[0].low_value,
                //         customerName: entity.customer_name,
                //         gstNumber: customerGSTNumber,
                //         customerAddress: customerAddress,
                //         customerCity: customerCity,
                //         customerPinCode: customerPinCode,
                //         customerContactPerson: customerContactPerson,
                //         customerContactNumber: customerContactNumber,
                //         customerContactEmailAddress: customerContactEmailAddress,
                //         customerContactDesignation: customerContactDesignation,
                //         customerWebsite:customerWebsite,
                //         customerPaymentTerms:customerPaymentTerms,
                //         organizationId:organizationId[0].low_value
                //     },
                //     method: "POST"
                // });

                // entity.external_customer_id = response.contact.contact_id

            }
            entity.approved_date = entity.s_modified_on;
            entity.approved_by = entity.s_modified_by;
        }
        // await this.tm.commitP("Saved Successfully", "Save Failed", true, true)
        await this.retrySave("Saved Successfully", "Save Failed");
        this.filter_list();

        // Mail Notification
        this.legalApproveNotification();
    }
    public async ndadownload() { // Function For Downloading NDA Document in General Info Tab
        let index = this.tm.getTN("o2c_custom_list").getActiveIndex();
        await this.tm.getTN("o2c_custom_list").getData()[index].upload_NDA.downloadAttachP();
    }
    public async msadownload() { // Function For Downloading MSA Document in General Info Tab
        let index = this.tm.getTN("o2c_custom_list").getActiveIndex();
        await this.tm.getTN("o2c_custom_list").getData()[index].upload_MSA.downloadAttachP();
    }
    public async uploadnda(oEvent) { // Function For Uploading NDA Document in General Info Tab
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        await entity.upload_NDA.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
        entity.is_NDA_available = entity.upload_NDA.hasAttachment
    }
    public async uploadmsa(oEvent) { // Function For Uploading MSA Document in General Info Tab
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        await entity.upload_MSA.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
        entity.is_msa_available = entity.upload_MSA.hasAttachment
    }
    public async docuploading(oEvent) { // Function For Uploading Documents in Document Tab
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/o2c_customers_doc_list/", ''));
        let document = this.tm.getTN("o2c_customers_doc_list").getData()[index];
        await document.file_location.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
        document.document_name = document.file_location.name;
    }
    public async mapuploading(oEvent) { // Function For Downloading Documents in Address Tab
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/o2c_customers_map_list/", ''));
        let map = this.tm.getTN("o2c_customers_map_list").getData()[index];
        await map.attachment.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
        map.adress_document_name = map.attachment.name;
    }
    public async docdownloading(oEvent) { // Function For Downloading Documents in Documents Tab
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/o2c_customers_doc_list/", ''));
        let document = this.tm.getTN("o2c_customers_doc_list").getData()[index];
        document.file_location.downloadAttachP();
    }
    public async mapdownloading(oEvent) { // Function For Downloading Documents in Address Tab
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/o2c_customers_map_list/", ''));
        let map = this.tm.getTN("o2c_customers_map_list").getData()[index];
        map.attachment.downloadAttachP();
    }
    public async onSave(oEvent, sendForApproval?) { // Function For Saving
        await this.tm.getTN("o2c_custom_detail").getData().validateP();
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        if (!entity.r_customer_contact || entity.r_customer_contact.length == 0) {
            sap.m.MessageBox.error("Contact Tab should not be Empty", { title: "Error", });
        }
        else if (!entity.r_customer_map || entity.r_customer_map.length == 0) {
            sap.m.MessageBox.error("Address Tab should not be Empty", { title: "Error", });
        }
        else if (entity.r_customer_map.length > 0) {
            let valid = false;
            for (let i = 0; i < entity.r_customer_map.length; i++) {
                if (entity.r_customer_map[i].adress_type1 == "Bill to Party") {
                    valid = true;
                    break;
                }
            }
            if (valid == false) {
                sap.m.MessageBox.error("Address Tab should have a Bill to Party", { title: "Error", });
            }
            else {
                await this.finalSave(sendForApproval);
            }
        }
    }
    public async finalSave(sendForApproval?) {
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        let entityorg = await this.tm.getTN('o2c_customer_org_detail').getData();
        if (entityorg) {
            entityorg.customer_name = entity.customer_name;
            entity.cal_buss = entityorg.business_area;
            entity.cal_comp = entityorg.company_code;
        }
        if (entity.r_level == 1 && entity.s_status == "Rejected") {
            entity.s_status = "Pending";
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: entityorg.business_area, company_code: entityorg.company_code, Level: 1, loadAll: true })
            entity.customer_status = approval_role[0].Role;
            let approval_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { customer_id: entity.customer_id, approval_status: "Pending", loadAll: true })
            approval_flow[0].business_area = entityorg.business_area;
            approval_flow[0].company_code = entityorg.company_code;
        }
        else if (entity.s_status == "Saved as Draft") {
            entity.s_status = "Pending";
            entity.r_level = 1;
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: entityorg.business_area, company_code: entityorg.company_code, Level: 1, loadAll: true })
            entity.customer_status = approval_role[0].Role;
            let approval_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { customer_id: entity.customer_id, approval_status: "Pending", loadAll: true })
            approval_flow[0].business_area = entityorg.business_area;
            approval_flow[0].company_code = entityorg.company_code;
        }
        else if (entity.s_status == '' || entity.s_status == undefined) {
            entity.s_status = "Pending";
            entity.r_level = 1;
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: entityorg.business_area, company_code: entityorg.company_code, Level: 1, loadAll: true })
            entity.customer_status = approval_role[0].Role;
        }
        if (entity.r_level == undefined) {
            entity.r_level = 1;
        }
        if (entity.customer_status == undefined && entity.customer_status != "Approved") {
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { business_area: entityorg.business_area, company_code: entityorg.company_code, Level: 1, loadAll: true })
            entity.customer_status = approval_role[0].Role;
        }
        let response = await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
        // let resawait this.retrySave("Saved Successfully", "Save Failed");
        if (response == false) {
            return;
        }
        if (sendForApproval == "sendForApproval") {
            this.tm.getTN("customer_notification").setProperty("type", "customerCreate");
            this.tm.getTN("customer_notification").setProperty("customer_id", entity.customer_id);
            this.tm.getTN("customer_notification").setProperty("sales_responsible_name", entity.sales_responsible_name);
            this.tm.getTN("customer_notification").setProperty("customer_name", entity.customer_name);
            await this.tm.getTN("customer_notification").executeP();
        }
    }
    public async onDraftSave() { // Function for Saving the Customer as Draft
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        let entityorg = await this.tm.getTN('o2c_customer_org_detail').getData();
        if (entityorg) {
            entityorg.customer_name = entity.customer_name;
            entity.cal_buss = entityorg.business_area;
            entity.cal_comp = entityorg.company_code;
            entity.s_status = "Saved as Draft";
            entity.r_level = 0;
            entity.customer_status = 'SALES';
            // await this.tm.commitP("Saved as Draft", "Save Failed", true, true);
            await this.retrySave("Saved Successfully", "Save Failed");
        }
    }
    public async onEdit() { // Function For Enabling Editting in Detail Section
        let entity = this.tm.getTN('o2c_custom_detail').getData();
        this.setMode("EDIT");
        if (entity.s_status == "Rejected") {
            entity.r_level = 1;
            await this.onRejection();
        }
        // else if (entity.s_status == "Approved" && this.login_id.toLowerCase() == entity.s_created_by.toLowerCase()) {
        //     entity.r_level = 1;
        //     entity.approval_cycle = entity.approval_cycle + 1;
        //     await this.onRejection();
        // }
    }
    public async onRejection() { // Function for Creating Log for Editing Rejected Customers
        let entity = await this.tm.getTN('o2c_custom_detail').getData();
        let entityorg = await this.tm.getTN('o2c_customer_org_detail').getData();
        await this.tm.getTN("o2c_custom_detail/r_customer_approval").createEntityP({ s_object_type: 'approval_object', approval_cycle: entity.approval_cycle, pending_with_role: 1, pending_with_level: 1, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: entityorg.business_area, company_code: entityorg.company_code }, null, null, null, "First", false, false, false);
    }
    public async cancelling() { // Function of Corfirmation for Cancelling Changes in Detail
        sap.m.MessageBox.confirm("Are You Sure You want cancel the UnSaved Changes", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.cancel();
                }
            }
        })
    }
    public async cancel() { // Function for Cancelling Changes in Detail
        await this.transaction.rollback();
        await this.tm.getTN("o2c_custom_list").refresh();//
        await this.navTo(({ S: "p_o2c_customers", SS: "pa_o2c_custom_search" }));
        await this.setMode("DISPLAY");
    }
    public async onCreate() { // Function for Creating New Customer
        await this.navTo(({ S: "p_o2c_customers", SS: "pa_o2c_custom_detail" }));
        await this.tm.getTN("o2c_custom_list").createEntityP({ customer_id: "####", s_object_type: "customer_type", is_NDA_required: true, msa_required: false, r_level: 0 }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        await this.tm.getTN("o2c_custom_detail").setActive(0);
        await this.tm.getTN("o2c_customer_org_list").createEntityP({ company_code: this.company, business_area: this.bus_area }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
    }
    public async onAddressCreate() { // Function for New Address Row Create in Address Tab 
        let address = await this.tm.getTN("o2c_customers_map_list").createEntityP({ is_communication_: false }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        await this.tm.getTN("o2c_customers_map_detail").setActive(0);
        //await this.tm.getTN("o2c_customers_map_list").getData()[0];
        address.address_id_test = address.address_map_id;
        await this.tm.getTN("o2c_custom_adr_list").createEntityP({ address_id: address.address_map_id }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        //let newadrdetail = await this.tm.getTN("o2c_custom_detail/r_customer_map").getData()[0].r_o2c_address.newEntityP(0, { address_id: address.address_map_id }, true);
        //this.tm.getTN('o2c_custom_adr_detail').setData(newadrdetail);//
    }
    public async other_commant() {
        let t_mode = this.getMode();
        let entity = await this.tm.getTN('o2c_custom_detail').getData();
        let other_comment = this.tm.getTN("other_comment").getData().comment;
        let date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        let time = new Date().toLocaleTimeString();
        let comment_create;
        if (other_comment) {
            comment_create = await this.tm.getTN("r_cust_com_list").createEntityP({ comment: other_comment, user_name: this.full_name, comment_time: time, comment_date: date, comment_flnm: this.filenm, customer_id: entity.customer_id }, "Creation Successful", "Creation Failed", null, "First", false, true, false);
            await this.tm.getTN("other_comment").setProperty('comment', null);
            if (this.filenm && this.fileup) {
                await comment_create.comment_attach.setAttachmentP(this.fileup, this.filenm);
            }
            await this.tm.getTN("other_comment").setProperty('attachment_url', null);
            this.filenm = null;
            this.fileup = null;
            if (t_mode != 'CREATE') {
                if (t_mode != 'EDIT') {
                    // await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
                    await this.retrySave("Saved Successfully", "Save Failed");
                    this.setMode('DISPLAY');
                }
                else {
                    this.setMode('EDIT');
                }
            }
            else {
                this.setMode('CREATE');
            }
        }
        else {
            sap.m.MessageBox.error("Please Write Comment", {
                title: "Error",
            });
        }
    }
    public async comment_documentUpload(oEvent) {
        this.fileup = oEvent.mParameters.files[0];
        this.filenm = oEvent.mParameters.files[0].name;
    }
    public async commentdownloading(oEvent) { // Function For Downloading Documents in Documents Tab
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/r_cust_com_list/", ''));
        let document = this.tm.getTN("r_cust_com_list").getData()[index];
        document.comment_attach.downloadAttachP();
    }
    public async confirmdelete() { // Function of Corfirmation for Cancelling Changes in Detail
        sap.m.MessageBox.confirm("Are You Sure You want to Delete the Customer Permanently", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.onDelete();
                }
            }
        })
    }
    public async onAddressDelete() {
        const selected = await this.getActiveControlById(null, "s_o2c_custom_map").getSelectedIndices();
        for (let inital = selected.length - 1; inital >= 0; inital--) {
            let map = await this.tm.getTN("o2c_customers_map_list").getData()[selected[0]];
            let addr = await this.tm.getTN("o2c_customers_map_list").getData()[selected[0]].r_o2c_address[0];
            addr.address_1 = "#";
            addr.address_2 = "#";
            addr.pincode = "1234";
            addr.city = "#";
            addr.district = "#";
            addr.state = "#";
            map.gstin_vat = "#";
            map.adress_type1 = "Ship to Party";
            map.country_code = "IND";
            await addr.deleteP();
            await this.tm.getTN("o2c_customers_map_list").getData()[selected[0]].deleteP();
        }
        await this.tm.getTN("o2c_customers_map_list").refresh();
    }
    public async onContactDelete() {
        const selected = await this.getActiveControlById(null, "s_o2c_custom_cont").getSelectedIndices();
        for (let inital = selected.length - 1; inital >= 0; inital--) {
            let cont = await this.tm.getTN("o2c_customers_cont_list").getData()[selected[0]];
            cont.title = "#";
            cont.contact_name = "#";
            cont.contact_designation = "#";
            cont.country_code = "#";
            cont.contact_number = 0;
            cont.email_id = "#";
            await cont.deleteP();
            await this.tm.getTN("o2c_customers_cont_list").getData()[selected[0]].deleteP();
        }
        await this.tm.getTN("o2c_customers_cont_list").refresh();
    }
    public async onDelete() {
        let entity = await this.tm.getTN('o2c_custom_detail').getData();
        if (entity.r_customer_coms.length && entity.r_customer_coms.length > 0) {
            let length = entity.r_customer_coms.length;
            for (let i = length - 1; i >= 0; i--)
                await entity.r_customer_coms[i].deleteP();
        }
        if (entity.r_customers_doc.length && entity.r_customers_doc.length > 0) {
            let length = entity.r_customers_doc.length;
            for (let i = length - 1; i >= 0; i--)
                await entity.r_customers_doc[i].deleteP();
        }
        if (entity.r_customer_approval.length && entity.r_customer_approval.length > 0) {
            let length = entity.r_customer_approval.length;
            for (let i = length - 1; i >= 0; i--)
                await entity.r_customer_approval[i].deleteP();
        }
        if (entity.r_customer_contact.length && entity.r_customer_contact.length > 0) {
            let length = entity.r_customer_contact.length;
            for (let i = length - 1; i >= 0; i--)
                await entity.r_customer_contact[i].deleteP();
        }
        if (entity.r_customer_map.length && entity.r_customer_map.length > 0) {
            let length = entity.r_customer_map.length;
            for (let i = length - 1; i >= 0; i--) {
                await entity.r_customer_map[i].r_o2c_address[0].deleteP();
                await entity.r_customer_map[i].deleteP();
            }
        }
        await entity.r_customer_organistion[0].deleteP();
        await entity.deleteP();
        await this.tm.getTN("o2c_custom_list").setActiveNext();
        await this.navTo(({ S: "p_o2c_customers", SS: "pa_o2c_custom_search" }));
        // await this.tm.commitP("Delete Successful", "Delete Failed", true, true);
        await this.retrySave("Delete Successful", "Delete Failed");
        await this.setMode("DISPLAY");
    }
    public async on_active_change() {
        let entity = await this.tm.getTN('o2c_custom_detail').getData();
        if (entity.is_archive == true) {
            entity.previous_status = entity.s_status;
            entity.s_status = "Blocked";
            // await this.tm.commitP("Customer Blocked", "Customer Block Failed", true, true);
            await this.retrySave("Customer Blocked", "Customer Block Failed");
        }
        else if (entity.is_archive == false) {
            entity.s_status = entity.previous_status;
            // await this.tm.commitP("Customer Unblocked", "Customer Unblock Failed", true, true);
            await this.retrySave("Customer Unblocked", "Customer Unblock Failed");
        }
    }
    public async onchanginggst(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/o2c_customers_map_list/", ''));
        let map = this.tm.getTN("o2c_customers_map_list").getData()[index];
        interface Address {
            buildingNumber: string;
            street: string;
            locality: string;
            district: string;
            pincode: string;
            state: string;
            natureOfBusiness: string[];
            floorNumber?: string;
            latitude?: string;
            longitude?: string;
        }
        let gst = map.gstin_vat;
        let appidsearch = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery('d_general_confg', { key: "customer_gsp_id", loadAll: true });
        let appId = appidsearch[0].low_value;
        let appsecretsearch = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery('d_general_confg', { key: "customer_gsp_secret", loadAll: true });
        let appsecret = appsecretsearch[0].low_value;
        let res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
            url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getGSTAddr", true),
            data: {
                gstapp: gst,
                appId: appId,
                appSecret: appsecret,
            },
            method: "POST"
        });
        if (res == "") {
            sap.m.MessageToast.show("Address cannot be fetched from GST", { duration: 2000 });
        }
        else {        // Parse the JSON string from 'res'
            const parsedData: any = JSON.parse(res);
            console.log(parsedData)
            // Extract addresses from parsed data
            // const addresses: Address[] = parsedData.pradr.map((addressData: any) => ({
            //     buildingNumber: addressData.addr.bno,
            //     street: addressData.addr.st,
            //     locality: addressData.addr.loc,
            //     district: addressData.addr.dst,
            //     pincode: addressData.addr.pncd,
            //     state: addressData.addr.stcd,
            //     natureOfBusiness: addressData.nature
            // }));
            map.r_o2c_address[0].address_1 = parsedData.pradr.addr.bno;
            map.r_o2c_address[0].address_2 = parsedData.pradr.addr.st;
            map.r_o2c_address[0].city = parsedData.pradr.addr.loc;
            map.r_o2c_address[0].district = parsedData.pradr.addr.dst;
            map.r_o2c_address[0].state = parsedData.pradr.addr.stcd;
            map.r_o2c_address[0].pincode = parsedData.pradr.addr.pncd;
            await this.tm.getTN("o2c_customers_map_list").refresh();
        }
    }
    public async legalRejectNotification() {
        // debugger;
        let detail = await this.tm.getTN("o2c_custom_detail").getData();
        await this.tm.getTN("customer_notification").setProperty('type', "rejectByLegal");
        await this.tm.getTN("customer_notification").setProperty('customer_id', detail.customer_id);
        await this.tm.getTN("customer_notification").setProperty('approver', this.full_name);
        await this.tm.getTN("customer_notification").executeP();
        sap.m.MessageToast.show("Reminder Mail for Customer Rejection is sent successfully!");
    }
    public async legalApproveNotification() {
        let detail = await this.tm.getTN("o2c_custom_detail").getData();
        await this.tm.getTN("customer_notification").setProperty('type', "approvedByLegal");
        await this.tm.getTN("customer_notification").setProperty('customer_id', detail.customer_id);
        await this.tm.getTN("customer_notification").setProperty('approver', this.full_name);
        await this.tm.getTN("customer_notification").executeP();
        sap.m.MessageToast.show("Reminder Mail for Customer Approve is sent successfully!");
    }

    public async onExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Downloading..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let allCustomer = <KloEntitySet<d_o2c_customers>>await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, s_object_type: "customer_type" });
        let addrMap = <KloEntitySet<d_o2c_customers_map>>await this.transaction.getExecutedQuery("d_o2c_customers_map", { loadAll: true, adress_type1: "Bill to Party" });
        let custAddr = <KloEntitySet<d_o2c_address>>await this.transaction.getExecutedQuery("d_o2c_address", { loadAll: true });
        let custContact = <KloEntitySet<d_o2c_customers_contact>>await this.transaction.getExecutedQuery("d_o2c_customers_contact", { loadAll: true });



        let jsonData = [];

        // Build the jsonData array using the fetched data
        for (let index = 0; index < allCustomer.length; index++) {

            let contactID = custContact.filter(item => item.k_id == allCustomer[index].customer_id);
            let addressID = addrMap.filter(item => (item.customer_id == allCustomer[index].customer_id))
            let address = [];
            if (addressID.length) {
                address = custAddr.filter(item => (item.address_id == addressID[0].address_id_test))
            }
            let status = allCustomer[index]?.s_status;
            jsonData.push({
                'Customer ID': allCustomer[index]?.customer_id,
                'Customer Name': allCustomer[index]?.customer_name,
                'Search Term': allCustomer[index]?.search_term,
                'Status': allCustomer[index]?.s_status,
                'Pending from whom': (status === 'Pending') ? allCustomer[index].customer_status : (status === 'Saved as Draft') ? allCustomer[index].sales_responsible : "N/A",
                'GST IN': addressID[0]?.gstin_vat,
                'Address': address[0]?.address_1 + "," + address[0]?.address_2 + "," + address[0]?.city + "," + address[0]?.district + "," + address[0]?.pincode,
                'Contact Person Name': contactID[0]?.contact_name,
                'Contact Person Phone Number': contactID[0]?.contact_number,
                'Contact Person Mail ID': contactID[0]?.email_id
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();

        // Set column widths
        worksheet['!cols'] = [
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 40 },
            { width: 20 },
            { width: 30 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");

        // Write workbook to a file
        const filePath = 'customer_data.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();

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