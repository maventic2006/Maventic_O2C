import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_cust_apprvl_flow } from 'o2c_v2/entity_gen/d_o2c_cust_apprvl_flow';
import { d_o2c_employee_designation } from 'o2c_v2/entity/d_o2c_employee_designation';
import { d_o2c_cust_apprvl_mstr } from 'o2c_v2/entity_gen/d_o2c_cust_apprvl_mstr';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_customers_adm")
export default class p_o2c_customers_adm extends KloController {
    public flag: boolean;
    public login_level;
    public array;
    public roleid;
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onPageEnter() { // Function For Setting Data on Entering Vendor Screen
        this.tm.getTN("o2c_vendor_search").setProperty('s_object_type', 'vendor_type');
        this.tm.getTN("o2c_vendor_search").setProperty('s_status', 'Approved');
        await this.tm.getTN("o2c_vendor_search").executeP();
        this.roleid = (await this.transaction.get$Role()).role_id;
        let employeeid = (await this.transaction.get$User()).login_id;
        this.tm.getTN("user_role_store").setData({});
        let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: employeeid, fdate: new Date().getTime(), tdate: new Date().getTime() });
        if (emp_designation.length > 0) {
            let emp_designation_name = <KloEntitySet<d_o2c_designation_master>>await this.transaction.getExecutedQuery('d_o2c_designation_master', { 'designation_id': emp_designation[0].designation });
            let name = emp_designation_name[0].name.toUpperCase();
            this.roleid = name;
        }
        this.tm.getTN("user_role_store").setProperty('roler', this.roleid);
    }
    public async resetlist() { // Function For Resetting Data on Vendor Screen
        this.tm.getTN("o2c_vendor_search").setProperty('s_status', 'Approved');
        this.tm.getTN("o2c_vendor_search").setProperty('customer_status', '');
        await this.tm.getTN("o2c_vendor_search").executeP();
    }
    public async navigate_detail(oEvent) { // Function For Navigating To Detail Screen
        await this.navTo(({ SS: "pa_o2c_cus_detail06" }), oEvent);
    }
    public tonavwebsite() { // Function For Navigating To the Provided Website
        let url = this.tm.getTN('o2c_customers_detail').getData().website_url;
        window.open(url, "_blank")
    }
    public async filter_list() { // Function For Filtering The Customer List
        if (this.roleid) {
            this.tm.getTN("o2c_vendor_search").setProperty('s_status', ['Pending', 'Rejected', 'Saved as Draft']);
            this.tm.getTN("o2c_vendor_search").setProperty('customer_status', this.roleid);
            await this.tm.getTN("o2c_vendor_search").executeP();
        }
        else {
            this.tm.getTN("o2c_vendor_search").setProperty('s_status', 'Approved');
            await this.tm.getTN("o2c_vendor_search").executeP();
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
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        let rejection_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { "customer_id": entity.customer_id, 'approval_status': "Pending" })
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
    public async confirmapprove() { // Function of Confirmation for Approval
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
    public async approval() {  // Function for Approval
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        let org = this.tm.getTN('o2c_customer_org_detail').getData();
        let approval_flow = <KloEntitySet<d_o2c_cust_apprvl_flow>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_flow', { "customer_id": entity.customer_id, 'approval_status': "Pending", 'pending_with_level': entity.r_level })
        let approval_master = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { "business_area": org.business_area, "company_code": org.company_code })
        if (approval_flow.length && approval_master.length) {
            approval_flow[0].approval_status = "Approved";
            approval_flow[0].action_datetime = approval_flow[0].s_modified_on;
            let level = entity.r_level;
            if (level < approval_master.length) {
                level = level + 1;
                entity.r_level = level;
                let level_str = String(level);
                let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { "business_area": org.business_area, "company_code": org.company_code, "Level": level_str })
                entity.customer_status = approval_role[0].Role;
                await this.tm.getTN("o2c_customers_detail/r_customer_approval").createEntityP({ s_object_type: "approval_object", approval_cycle: entity.approval_cycle, pending_with_role: level, pending_with_level: level, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: org.business_area, company_code: org.company_code }, null, null, null, "First", false, false, false);
            }
            else if (level == approval_master.length) {
                level = -1;
                entity.s_status = "Approved";
                entity.r_level = level;
                entity.customer_status = '';
            }
            entity.approved_date = entity.s_modified_on;
            entity.approved_by = entity.s_modified_by;
        }
        // await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
        await this.retrySave("Saved Successfully", "Save Failed");
        this.filter_list();
    }
    public async ndadownload() { // Function For Downloading NDA Document in General Info Tab
        let index = this.tm.getTN("o2c_customers_list").getActiveIndex();
        await this.tm.getTN("o2c_customers_list").getData()[index].upload_NDA.downloadAttachP();
    }
    public async msadownload() { // Function For Downloading MSA Document in General Info Tab
        let index = this.tm.getTN("o2c_customers_list").getActiveIndex();
        await this.tm.getTN("o2c_customers_list").getData()[index].upload_MSA.downloadAttachP();
    }
    public async uploadnda(oEvent) { // Function For Uploading NDA Document in General Info Tab
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        await entity.upload_NDA.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
        entity.is_NDA_available = entity.upload_NDA.hasAttachment
    }
    public async uploadmsa(oEvent) { // Function For Uploading MSA Document in General Info Tab
        let entity = this.tm.getTN('o2c_customers_detail').getData();
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
    public async docdownloading(oEvent) {  // Function For Downloading Documents in Documents Tab
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
    public async onSave() { // Function For Saving
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        let entityorg = await this.tm.getTN('o2c_customer_org_detail').getData();
        entityorg.customer_name = entity.customer_name;
        entity.cal_buss = entityorg.business_area;
        entity.cal_comp = entityorg.company_code;
        if (entity.r_level == 1 && entity.s_status == "Rejected") {
            entity.s_status = "Pending";
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { "business_area": entityorg.business_area, "company_code": entityorg.company_code, "LEVEL": 1 })
            entity.customer_status = approval_role[0].Role;
        }
        if (entity.s_status == "Saved as Draft" || entity.s_status == null) {
            entity.s_status = "Pending";
            entity.r_level = 1;
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { "business_area": entityorg.business_area, "company_code": entityorg.company_code, "LEVEL": 1 })
            entity.customer_status = approval_role[0].Role;
        }
        if (entity.r_level == undefined) {
            entity.r_level = 1;
        }
        if (entity.customer_status == undefined && entity.customer_status != "Approved") {
            let approval_role = <KloEntitySet<d_o2c_cust_apprvl_mstr>>await this.transaction.getExecutedQuery('d_o2c_cust_apprvl_mstr', { "business_area": entityorg.business_area, "company_code": entityorg.company_code, "LEVEL": 1 })
            entity.customer_status = approval_role[0].Role;
        }
        // this.tm.commitP("Saved Successfully", "Save Failed", true, true);
        await this.retrySave("Saved Successfully", "Save Failed");

    }
    public async onDraftSave() { // Function for Saving the Customer as Draft
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        entity.s_status = "Saved as Draft";
        entity.r_level = 0;
        entity.customer_status = 'SALES'
        // await this.tm.commitP("Saved as Draft", "Save Failed", true, true);
        await this.retrySave("Saved as Draft", "Save Failed");
    }
    public onEdit() { // Function For Enabling Editting in Detail Section
        let entity = this.tm.getTN('o2c_customers_detail').getData();
        this.setMode("EDIT");
        if (entity.s_status == "Rejected") {
            entity.r_level = 1;
            this.onRejection();
        }
    }
    public async onRejection() { // Function for Creating Log for Editing Rejected Customers
        let entity = await this.tm.getTN('o2c_customers_detail').getData();
        let entityorg = await this.tm.getTN('o2c_customer_org_detail').getData();
        await this.tm.getTN("o2c_customers_detail/r_customer_approval").createEntityP({ s_object_type: 'approval_object', approval_cycle: entity.approval_cycle, pending_with_role: 1, pending_with_level: 1, insert_datetime: entity.s_modified_on, approval_status: "Pending", business_area: entityorg.business_area, company_code: entityorg.company_code }, null, null, null, "First", false, false, false);
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
        await this.tm.getTN("o2c_customers_list").refresh();
        await this.navTo(({ S: "p_o2c_customers_adm", SS: "pa_o2c_cus_search03" }));
        await this.setMode("DISPLAY");
    }
    public async onCreate() { // Function for Creating New Customer
        await this.navTo(({ S: "p_o2c_customers_adm", SS: "pa_o2c_cus_detail06" }));
        await this.tm.getTN("o2c_customers_list").createEntityP({ customer_id: " ", s_object_type: "vendor_type" }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        await this.tm.getTN("o2c_customers_detail").setActive(0);
        let neworg = await this.tm.getTN("o2c_customers_detail").getData().r_customer_organistion.newEntityP();
        this.tm.getTN('o2c_customer_org_detail').setData(neworg);
    }
    public async onAddressCreate() { // Function for New Address Row Create in Address Tab 
        await this.tm.getTN("o2c_customers_map_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        await this.tm.getTN("o2c_customers_map_detail").setActive(0);
        let address = this.tm.getTN("o2c_customers_map_list").getData()[0];
        address.address_id_text = address.address_map_id;
        let newadrdetail = await this.tm.getTN("o2c_customers_detail/r_customer_map").getData()[0].r_o2c_address.newEntityP();
        this.tm.getTN("o2c_custom_detail/r_customer_map").getData()[0].r_o2c_address[0].address_id = address.address_map_id;
        this.tm.getTN('r_o2c_address_detail').setData(newadrdetail);
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
