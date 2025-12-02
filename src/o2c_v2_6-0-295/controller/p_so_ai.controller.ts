import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { UserInfo } from "kloBo/Adm/UserInfo";
import { KloController } from "kloTouch/jspublic/KloController";
import { d_o2c_so_milestone } from "o2c_v2/entity_gen/d_o2c_so_milestone";
import { d_o2c_volume_based } from "o2c_v2/entity_gen/d_o2c_volume_based";
import { KloEntitySet } from "kloBo_7-2-129";
import { d_o2c_project_header } from "o2c_v2/entity/d_o2c_project_header";
import { d_o2c_so_hdr } from "o2c_v2/entity/d_o2c_so_hdr";
import { d_o2c_pd_master } from "o2c_v2/entity_gen/d_o2c_pd_master";
import { log } from "console";
import { d_o2c_so_profit } from "o2c_v2/entity_gen/d_o2c_so_profit";

@KloUI5("o2c_v2.controller.p_so_ai")
let projectData; export default class p_so_ai extends KloController {
    public company_code;
    public header_detail;
    public profit_center = [];
    public functional_area = [];
    public travel_table_data = [];
    public contact_detail = [];
    public poTableLineItem1 = [];
    public poTableLineItem2 = [];
    public selectedPoSubscription = [];
    public poTableLineItem3 = [];
    public totalSoGrossValue = 0;
    public saveFlag;
    public count = 0;
    public maxApprovalCycle = 0;
    public secondRole;
    public travelType;
    public employee_name_info;
    public VALID_TYPES = {
        ANY: "ANY",
        NUM: "NUM",
        TEXT: "TEXT",
        PHONE: "PHONE",
        EMAIL: "EMAIL",
        LINKEDIN: "LINKEDIN",
    };
    public expense_list = [];

    private popupDialogBox: sap.ui.core.Control | sap.ui.core.Control[];

    /**
     * === FORMATTER START ===
     */
    public formatKeyValue(aData: any, sKey: string) {
        if (!Array.isArray(aData) || !sKey) {
            return "NA";
        }

        for (const item of aData) {
            const keys = Object.keys(item);
            if (keys.length < 2) continue;

            const keyField = keys[0];
            const valField = keys[1];

            if (item[keyField] === sKey) {
                return item[valField] || "";
            }
        }

        return "NA";
    }

    public fnFomatAvatarFromName(sName: string) {
        return sName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    }

    /**
     * === FORMATTER END ===
     */
    public fnConvertJsToUi5Date(date: Date) {
        if (date === null || date === undefined) return "";
        return date.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", });
    }

    public fnInitializePageModel() {
        const oLocalModel = new sap.ui.model.json.JSONModel({
            submitButtonEnabled: false,
            saveDraftButtonEnabled: false,
            CancelButtonEnabled: false,
            ApproveButtonEnabled: false,
            Back2EditButtonEnabled: false,
            CallBackButtonEnabled: false,
            editButtonEnabled: false,
            deleteButtonEnabled: false,
            // AI Vars
            poDocFile: null,
            isAiAssistEnabled: false,
            // TextBox Enable / Disable
            isEditBasicDetails: false,
            isEditInvoiceStatus: false,
            isEditPerDiemRate: false,
            isNewPoAddRow: false,
            isEditComment: false,
            isEditOrderType: false,
            isMilestoneInvoiceEdit: false,
            isEditTravelTable: false,
            // Header Details
            company: "",
            companyCode: "",
            businessAreaList: [],
            businessAreaSelected: "",
            orderTypesList: [],
            orderTypeSelected: "SO",
            soNumber: "NA",
            createdOn: "",
            createdBy: "",
            createdById: "",
            createdByName: "",
            // Login User Info
            loginUserId: null,
            soStatus: "",
            loginUserRole: "",
            loginProfitCenters: [],
            // Project Details
            project_name: "",
            office_calendar: "",
            durationInWeeks: "",
            project_start_date: "",
            project_end_date: "",
            productType: "",
            productTypeList: [],
            // Customer Details
            customerList: [],
            bill_to_customer: "",
            billToAddressList: [],
            bill_to_address: "",
            addressAndGSTMappingList: [],
            gstin: "",
            currencyList: [],
            currency: "",
            parentSoList: [],
            currExchangeRate: "",
            parent_po: "",
            external_number: "",
            customerContactNameList: [],
            customerContactTable: [],
            //Sales Team
            preSalesAndResponsibleList: [],
            preSalesBySelected: "",
            salesResponsibleSelected: "",
            permanentSalesResponsible: "",
            // Expense table
            tableExpense: [],
            // OnSite Rules
            onSiteRadioButton: { yes: true, no: false },
            reimbRulesList: [
                {
                    key: 'ACT',
                    value: 'On Actual Bill To Client'
                },
                {
                    key: 'CIP',
                    value: 'Client Included In Project'
                }
            ],
            reimbursement_rules: "",
            reimbursement_remark: "",
            tableTravel: [],
            travelTypesDropDown: [],
            travelCityReimburseMapping: [],
            //PO Details
            poHeaderTable: [],
            ddPOItemCategories: (this.fnGetPoLineItemDropDownMapping()).ddItemCategories, // use category universal fo all po line
            isPoHasTnM: false,
            poSumOfGross: 0,
            poSumOfpDs: 0,
            poSumOfProjectPDs: 0,
            ddPOSubscriptionMapping: [],
            // Profit Center
            profitCenterTable: [],
            profitCenterList: [],
            // Functional Area
            functionalAreaTable: [],
            functionalAreaList: [],
            // Comments and FLow Table
            commentTextLength: 0,
            commentText: "",
            commentsAndFlowTable: [],
        });

        oLocalModel.setSizeLimit(300000); // for combo-box dropdown limit

        sap.ui.getCore().setModel(oLocalModel, "mPageData");
    }

    busyMessageQueue = [];
    oBusyDialog = new sap.m.BusyDialog({ text: "" });

    public fnShowBusyDialog(openNewDialog: boolean, busyMessageText: string = "Loading...") {
        return;
        if (openNewDialog) {
            this.busyMessageQueue.push(busyMessageText);
        }
        else {
            this.busyMessageQueue.pop();
        }

        const sLastBusyMessage = this.busyMessageQueue[this.busyMessageQueue.length - 1];
        if (sLastBusyMessage) {
            this.oBusyDialog.setText(sLastBusyMessage);
            this.oBusyDialog.open();
        } else {
            this.oBusyDialog.close();
        }
    }

    public fnShowErrorPopup(sErrorMessage = "") {
        sap.m.MessageBox.error(sErrorMessage, {
            title: "Error", // default
            onClose: null, // default
            styleClass: "", // default
            actions: sap.m.MessageBox.Action.CLOSE, // default
            emphasizedAction: null, // default
            initialFocus: null, // default
            textDirection: sap.ui.core.TextDirection.Inherit, // default
        });
    }

    public fnShowWarnPopup(sMessage = "") {
        sap.m.MessageBox.warning(sMessage, {
            title: "Warning",
            onClose: null,
            styleClass: "",
            actions: sap.m.MessageBox.Action.OK,
            emphasizedAction: sap.m.MessageBox.Action.OK,
            initialFocus: null,
            textDirection: sap.ui.core.TextDirection.Inherit,
            dependentOn: null
        });
    }

    public async onPageEnter(oEvent) {
        // --- To Load XML ---
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_so_ai";
        const view = await sap.ui.core.Fragment.load({ name: sViewName, controller: this, });
        this.getActiveControlById(null, "pageLayout01", "p_so_ai").addContent(view);

        // --- To Load CSS ---
        FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "p_sales_order_stylesheet");
        // --- END ---

        this.fnInitializePageModel();

        this.fnShowBusyDialog(true, "Fetching Values For Dependent Input Fields.");

        // =======>>> Get Saved SO Basic Details ====== //
        let savedCompanyCode = null;
        let savedCreatedBy = null;
        let savedBusinessAreaKey = null;
        let savedCreatedOnDate = null;
        const so_guid = oEvent.navToParams.AD;
        let so_info = null;

        // ---- SO STATUS ---- //
        if (so_guid !== undefined) {
            so_info = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, so_guid: so_guid });

            savedCompanyCode = so_info[0].company;
            savedCreatedBy = so_info[0].s_created_by;
            savedBusinessAreaKey = so_info[0].business_area;
            savedCreatedOnDate = so_info[0].s_created_on;

            sap.ui.getCore().getModel("mPageData").setProperty("/soStatus", so_info[0].s_status);
        } else {
            sap.ui.getCore().getModel("mPageData").setProperty("/soStatus", "New");
        }

        // ---[ HEADER DETAILS ]---
        // s_created_by data
        let login_id = (await this.transaction.get$User()).login_id;

        if (savedCreatedBy === null) {
            savedCreatedBy = login_id;
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/createdById", savedCreatedBy);
        sap.ui.getCore().getModel("mPageData").setProperty("/loginUserId", login_id);

        this.employee_name_info = await this.transaction.getExecutedQuery("d_o2c_employee", { partialSelected: ['first_name', 'last_name', 'full_name'], loadAll: true });
        const empNameFilter = this.employee_name_info.filter((item) => item.employee_id.toUpperCase() == savedCreatedBy.toUpperCase());
        const employee_name = empNameFilter[0].full_name;
        sap.ui.getCore().getModel("mPageData").setProperty("/createdByName", employee_name);

        // company_code  and company_name data
        const emp_org = await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: login_id, is_primary: true, partialSelect: ["company_code"], loadAll: true, });

        if (savedCompanyCode === null) {
            this.company_code = emp_org[0].company_code;
        } else {
            this.company_code = savedCompanyCode;
        }

        await this.tm.getTN("current_pending").setData({});

        const comp_info = await this.transaction.getExecutedQuery("d_o2c_company_info", { loadAll: true, company_code: this.company_code });
        const company_name = comp_info[0].name;
        sap.ui.getCore().getModel("mPageData").setProperty("/company", company_name);
        sap.ui.getCore().getModel("mPageData").setProperty("/companyCode", this.company_code);

        //s_created_on data
        const created_on = savedCreatedOnDate === null ? new Date() : savedCreatedOnDate;
        sap.ui.getCore().getModel("mPageData").setProperty("/createdOn", created_on);
        sap.ui.getCore().getModel("mPageData").setProperty("/createdOnMMddYYYY", this.fnConvertJsToUi5Date(created_on));

        // BUSINESS AREA
        // Get Assigned Business Area List of login user
        const employee_org = await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, employee_id: login_id });
        const active_employee_org = employee_org.filter((item) => new Date(item.active_from) <= new Date() && new Date(item.active_till) >= new Date() && item.company_code == this.company_code)

        // Fetch Total Business Area
        const business_info = await this.transaction.getExecutedQuery("d_o2c_business_area", { loadAll: true, company_code: this.company_code });
        const aBusinessInfo: Array<Object> = [];
        business_info.forEach((oBArea) => {
            aBusinessInfo.push({
                business_code: oBArea.business_area,
                business_name: oBArea.name,
                isEnabled: active_employee_org.find((oEmpOrg) => oEmpOrg.business_area === oBArea.business_area) ? true : false
            });
        });

        sap.ui.getCore().getModel("mPageData").setProperty("/businessAreaList", aBusinessInfo);

        // Select Default Business Area
        let sDefaultBusinessCode = "";

        const oDefaultBusinessArea = aBusinessInfo.find((oBsArea) => {
            const aRegexIndex = oBsArea.business_name.toLocaleLowerCase().match(/bangalore/);
            return (aRegexIndex !== null && oBsArea.isEnabled) ? true : false;
        });

        if (oDefaultBusinessArea) {
            sDefaultBusinessCode = oDefaultBusinessArea.business_code;
        }
        else {
            const userBArea = aBusinessInfo.find((item) => item.isEnabled == true);
            sDefaultBusinessCode = userBArea.business_code;
        }

        const businessAreaSelected = savedBusinessAreaKey === null ? sDefaultBusinessCode : savedBusinessAreaKey;
        sap.ui.getCore().getModel("mPageData").setProperty("/businessAreaSelected", businessAreaSelected);

        this.onBusinessAreaChange();

        // ---[ CUSTOMER DETAILS ]---
        //customer data
        const customer_info = await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, s_status: "Approved" });
        const aCustomerInfo: Array<Object> = [];
        for (let i = 0; i < customer_info.length; i++) {
            aCustomerInfo.push({
                cust_id: customer_info[i].customer_id,
                cust_name: customer_info[i].customer_name,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/customerList", aCustomerInfo);

        // currency
        const currency_info = await this.transaction.getExecutedQuery("d_o2c_currency", { loadAll: true });
        const aCurrencyInfo: Array<Object> = [];
        for (let i = 0; i < currency_info.length; i++) {
            aCurrencyInfo.push({
                currency_id: currency_info[i].currency_code,
                currency_name: currency_info[i].currency_name,
            });
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/currencyList", aCurrencyInfo);

        // Country codes
        const country_name_info = await this.transaction.getExecutedQuery("d_o2c_country", { loadAll: true });
        const aCountryInfo: Array<Object> = [];
        for (let i = 0; i < country_name_info.length; i++) {
            aCountryInfo.push({
                country_code: country_name_info[i].iso_code,
                country_name: country_name_info[i].country_name,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/countryList", aCountryInfo);

        //Product type data
        const productTypeList = [];
        const product_info = await this.transaction.getExecutedQuery("d_o2c_product_master", { loadAll: true, partialSelected: ['product_id', 'product_description', 'so_no'] });
        for (let i = 0; i < product_info.length; i++) {
            productTypeList.push({
                product_id: product_info[i].product_id,
                product_description: product_info[i].product_description,
                so_no: product_info[i].so_no
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/productTypeList", productTypeList);

        // ---[ SALES TEAM ]---
        //employee data for pre-sales and sales responsible data
        const employee_info = await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true, s_status: "Approved" });
        const aEmployeeInfo: Array<Object> = [];
        for (let i = 0; i < employee_info.length; i++) {
            aEmployeeInfo.push({
                emp_id: employee_info[i].employee_id,
                emp_name: employee_info[i].full_name,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/preSalesAndResponsibleList", aEmployeeInfo);

        // --- [PROFIT CENTRE] ---
        //profit center data in profit_cntr_id and profit_cntr_name
        const profit_info = await this.transaction.getExecutedQuery("d_o2c_profit_centre", { loadAll: true, company_code: this.company_code });
        const aProfitInfo: Array<Object> = [];

        for (let i = 0; i < profit_info.length; i++) {
            const team_head_name_info = await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: profit_info[i].team_head, loadAll: true });
            const team_head_name = team_head_name_info[0].full_name;
            aProfitInfo.push({
                profit_cntr_id: profit_info[i].profit_center,
                profit_cntr_name: profit_info[i].name,
                team_head: profit_info[i].team_head,
                team_head_name,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/profitCenterList", aProfitInfo);

        // ---- Role Based Button Variable ---//
        const roleId = (await this.transaction.get$Role()).role_id;
        const user_login_id = (await this.transaction.get$User()).login_id;
        let role_list = await this.transaction.getExecutedQuery("d_second_role_assyn", { employee_id: user_login_id, page_name: "SO", loadAll: true });
        if (role_list.length) {
            this.secondRole = role_list[0].assyned_role;
        }

        this.tm.getTN("user_role").setData({ role: false });
        const so_number = so_info === null ? "" : so_info[0].so;
        const so_app_cycle = so_info === null ? "" : so_info[0].approval_cycle;
        const type = so_info === null ? "" : so_info[0].type;
        const bArea = so_info === null ? "" : so_info[0].business_area;
        const status = so_info === null ? "" : so_info[0].s_status;
        const cr_status = so_info === null ? "" : so_info[0].cr_status;

        // Order type
        let orderTypesList = [
            { key: "SO", text: "SO", isEnabled: true },
            { key: "PS", text: "Provisional SO", isEnabled: false },
            { key: "NBS", text: "Non Billable SO", isEnabled: roleId === "TEAM_HEAD" },
            { key: "ISP", text: "Product Development", isEnabled: roleId === "TEAM_HEAD" },
            { key: "PSL", text: "Pre Sales", isEnabled: roleId === "TEAM_HEAD" },
            { key: "ETR", text: "Employee Training", isEnabled: roleId === "TEAM_HEAD" }
        ];

        sap.ui.getCore().getModel("mPageData").setProperty("/orderTypesList", orderTypesList);

        // Subscription - PO Table
        const productData = await this.transaction.getExecutedQuery("d_o2c_product_based_api_type", { loadAll: true });
        let ddPOSubscriptionMapping = []
        productData.forEach(element => {
            ddPOSubscriptionMapping.push({ product: element.product, id: element.api_id, type: element.subscription_type, api_name: element.api_name })
        });
        sap.ui.getCore().getModel("mPageData").setProperty("/ddPOSubscriptionMapping", ddPOSubscriptionMapping);

        //Profit Center check for the approval Flow----> START
        let loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
            loadAll: true, 'employee_id': user_login_id, 'active_till': new Date()
        });

        const loginProfitCenters = [];
        for (let i = 0; i < loginOrg.length; i++) {
            loginProfitCenters.push(loginOrg[i].profit_centre);
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/loginProfitCenters", loginProfitCenters);

        //Profit Center check for the approval Flow----> END
        const approvalMasterAll = await this.transaction.getExecutedQuery("d_o2c_so_approval_master", { loadAll: true, so_type: type, role: (await this.transaction.get$Role()).role_id, business_area: bArea, });

        const approvalFlowAll = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: so_number, approval_cycle: so_app_cycle, pending_with_role: (await this.transaction.get$Role()).role_id });
        const exceptThisLogin = approvalFlowAll.filter((item) => item.approval_status == "Approved");
        const approvalFlow = approvalFlowAll.filter((item) => item.approval_status == "Pending");

        if (approvalFlow.length && status != "Back To Edit" && cr_status != "Return Back") {
            if (approvalMasterAll[0].consensus_approval == true) {
                let exceptLoginID = exceptThisLogin.filter((item) => item.action_by == user_login_id);
                if (exceptLoginID.length)
                    this.tm.getTN("user_role").setData({ role: false });
                else
                    this.tm.getTN("user_role").setData({ role: true });
            } else {
                if (exceptThisLogin.length == 0)
                    this.tm.getTN("user_role").setData({ role: true });
            }
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/loginUserRole", roleId);

        if (roleId === "FINANCE" || this.secondRole) {
            sap.ui.getCore().getModel("mPageData").setProperty("/isMilestoneInvoiceEdit", true);
        }

        // If SO Has Data // AutoFill the Form
        if (so_guid !== undefined) {
            this.fnShowBusyDialog(false);
            this.fnShowBusyDialog(true, "Downloading Saved SO Data");
            this.fnShowBusyDialog(true); // Dummy
            await this.fnFetchAndAutoFillSOData(so_guid);

            //use this user_role value for approve and back to edit button
            const isApprovalRole = this.tm.getTN("user_role").getData().role;

            // If SO Is Discarded / Archive 
            if (so_info[0].s_status === "Archived") {
                // Do Nothing // No Button Visible
            }
            else if (isApprovalRole) {
                this.enableEditInputFields([4]); // enable comment box

                if (so_info !== null && so_info[0].s_status === "Pending") {
                    if (roleId === "TEAM_HEAD" || roleId === "FINANCE") {
                        this.showTopButtons(["APPROVE", "BACK2EDIT", "EDIT"]);
                    } else {
                        this.showTopButtons(["APPROVE", "BACK2EDIT"]);
                    }
                } else if (so_info !== null && so_info[0].s_status === "Call Back") {
                    this.showTopButtons([]);
                } else {
                    this.showTopButtons(["APPROVE", "BACK2EDIT", "EDIT"]);
                }
            } else {
                // If Creator is Same OR Login is Sales Responsible
                const salesResponsible = sap.ui.getCore().getModel("mPageData").getProperty("/salesResponsibleSelected");
                if (login_id === savedCreatedBy || login_id.toLowerCase() === salesResponsible.toLowerCase()) {
                    if (so_info !== null && (so_info[0].s_status === "Pending")) {
                        if (cr_status == "Open") {
                            this.showTopButtons([]);
                        } else {
                            this.showTopButtons(['CALLBACK']);
                        }
                    } else {
                        this.showTopButtons(['EDIT']);
                    }
                } else {
                    // If Creator is Different
                    if (so_info !== null && (so_info[0].s_status === "Back To Edit" || so_info[0].s_status === "Call Back")) {
                        this.showTopButtons([]);
                    } else if (so_info !== null && so_info[0].cr_status === "Return Back") {
                        this.showTopButtons([]);
                    } else {
                        this.showTopButtons(["EDIT"]);
                    }
                }
            }

            // Delete Button (EXCLUSIVE)

            const salesResponsible = sap.ui.getCore().getModel("mPageData").getProperty("/salesResponsibleSelected");
            if (so_info[0].s_status === "Archived") {
                // No Delete Button
            }
            else if ((so_info[0].s_status !== "Approved" && so_info[0].s_status !== "Closed") && (login_id === savedCreatedBy || login_id.toLowerCase() === salesResponsible.toLowerCase() || roleId === "TEAM_HEAD" || roleId === "FINANCE")) {
                sap.ui.getCore().getModel("mPageData").setProperty("/deleteButtonEnabled", true);
            }
        }
        //  If SO Has No Data // Initialize the page
        else {
            this.onAddPoBtnPress();
            this.onProfitCentreAddRow();
            this.onPressEditBtn();
        }

        this.fnShowBusyDialog(false);
    }

    public async onPressAIAssistButton() {
        const oView = this.getView();
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_so_ai_assist_dialog";

        this.popupDialogBox = await sap.ui.core.Fragment.load({ name: sViewName, controller: this });

        oView.addDependent(this.popupDialogBox);
        this.popupDialogBox.open();
    }

    public onPressInformationAccept() {
        const oModel = sap.ui.getCore().getModel("mPageData");
        this.fnEnableNextTab();

        const oTabsVisibility = oModel.getProperty("/tabsVisibility");
        const isAllTabsActive = Object.values(oTabsVisibility).every(value => value === true);

        if (isAllTabsActive) {
            oModel.setProperty("/isAiAssistEnabled", false);
        }


        // Scroll Tab

    }

    public disableAllTabs() {
        const oModel = sap.ui.getCore().getModel("mPageData");
        const oTabsVisibility = oModel.getProperty("/tabsVisibility");

        const length = Object.keys(oTabsVisibility).length;
        for (let i = 1; i <= length; i++) {
            const key = `tab${i}`;
            oTabsVisibility[key] = false;
        }

        oModel.setProperty("/tabsVisibility", oTabsVisibility);
    }

    public fnEnableNextTab() {
        const oModel = sap.ui.getCore().getModel("mPageData");
        const oTabsVisibility = oModel.getProperty("/tabsVisibility");

        const length = Object.keys(oTabsVisibility).length;
        for (let i = 1; i <= length; i++) {
            const key = `tab${i}`;
            if (!oTabsVisibility[key]) {
                oTabsVisibility[key] = true;
                break;
            }
        }

        oModel.setProperty("/tabsVisibility", oTabsVisibility);
    }

    public onPoDocUploadPress() {
        const oModel = sap.ui.getCore().getModel("mPageData");
        this.disableAllTabs();
        this.fnEnableNextTab();
        this.onPopupDialogCloseBtnPress();
        oModel.setProperty("/isAiAssistEnabled", true);


        // HTTP Call
        const oData = {
            requested_data: {
                product_type: "NA",
                project_details: {
                    project_name: "Fiori Work Package for Plant Maintenance",
                    total_project_duration_in_days: 84,
                    total_project_cost: 46200,
                    budgeted_PD: 193
                },
                onsite_project: false,
                po_items: [
                    {
                        type_of_item: "Fixed Price",
                        item_qty: 1,
                        item_rate: 46200,
                        unit: "activity unit",
                        item_gross_value: 46200,
                        invoice_type: "Milestone",
                        invoice_cycle: "NA",
                        start_date: "2025-06-15",
                        end_date: "2025-09-06",
                        minimum_billing_amount: "NA",
                        per_unit_price: "NA",
                        billing_milestones: [
                            {
                                milestone_name: "Kick off",
                                milestone_amount: 9240,
                                milestone_due_date: "2025-06-16",
                                milestone_start_date: "2025-06-15",
                                milestone_end_date: "2025-06-15",
                                duration_in_days: 1,
                                reason: "Project Kickoff"
                            },
                            {
                                milestone_name: "Blueprint Completion",
                                milestone_amount: 13860,
                                milestone_due_date: "2025-06-23",
                                milestone_start_date: "2025-06-16",
                                milestone_end_date: "2025-06-22",
                                duration_in_days: 7,
                                reason: "BBP Preparation duration"
                            },
                            {
                                milestone_name: "UAT Completion",
                                milestone_amount: 9240,
                                milestone_due_date: "2025-08-11",
                                milestone_start_date: "2025-06-23",
                                milestone_end_date: "2025-08-10",
                                duration_in_days: 49,
                                reason: "Development(5 Weeks) + SIT (2 Weeks) + UT(1 Week) = 8 weeks"
                            },
                            {
                                milestone_name: "Go Live",
                                milestone_amount: 9240,
                                milestone_due_date: "2025-08-25",
                                milestone_start_date: "2025-08-11",
                                milestone_end_date: "2025-08-24",
                                duration_in_days: 14,
                                reason: "UAT duration"
                            },
                            {
                                milestone_name: "PGLS Completion",
                                milestone_amount: 4620,
                                milestone_due_date: "2025-09-08",
                                milestone_start_date: "2025-08-25",
                                milestone_end_date: "2025-09-07",
                                duration_in_days: 14,
                                reason: "Go-live (1 day) + PGLS (2 Weeks) = 1 + 14 = 15 -1 = 14 days."
                            }
                        ]
                    }
                ]
            }
        };

        const oSoData = oData.requested_data;

        oModel.setProperty("/project_name", oSoData.project_details.project_name);
        oModel.setProperty("/VS_project_name", sap.ui.core.ValueState.Success);

        oModel.setProperty("/durationInWeeks", Number(oSoData.project_details.total_project_duration_in_days) / 7);
        oModel.setProperty("/VS_durationInWeeks", sap.ui.core.ValueState.Success);

        oModel.setProperty("/productType", oSoData.product_type);
        oModel.setProperty("/VS_productType", sap.ui.core.ValueState.Success);

        oModel.setProperty("/poSumOfpDs", oSoData.project_details.budgeted_PD);
        oModel.setProperty("/VS_poSumOfpDs", sap.ui.core.ValueState.Success);

        oModel.setProperty("/isEditTravelTable", !oSoData.onsite_project);
    }

    public async onOrderTypeSelectionChange() {
        const orderTypeSelected = sap.ui.getCore().getModel("mPageData").getProperty("/orderTypeSelected");
        const oModel = sap.ui.getCore().getModel("mPageData");

        const poHeaderTable = oModel.getProperty("/poHeaderTable");
        const functionalAreaTable = oModel.getProperty("/functionalAreaTable");

        switch (orderTypeSelected) {
            case "SO":
                if (poHeaderTable.length <= 0) {
                    this.onAddPoBtnPress();
                }
                if (functionalAreaTable.length <= 0) {
                    this.onFunctionalAreaAddRow();
                }

                // If Approved PO // Hide Provisional Option From DropDown
                const soStatus = oModel.getProperty("/soStatus");
                if (soStatus === "Approved") {
                    oModel.setProperty("/orderTypesList", [{ key: "SO", text: "SO" }]);

                    const poHeaderTable = oModel.getProperty("/poHeaderTable");
                    for (let i = 0; i < poHeaderTable.length; i++) {
                        const sPathL_1 = "/poHeaderTable/" + i;
                        oModel.setProperty(sPathL_1 + "/isPoRowEditable", true);

                        const aPoLineItemTable = oModel.getProperty(sPathL_1 + "/aPoLineItemTable");
                        for (let j = 0; j < aPoLineItemTable.length; j++) {
                            const sPathL_2 = sPathL_1 + "/aPoLineItemTable/" + j;
                            oModel.setProperty(sPathL_2 + "/isPoRowEditable", true);

                            const aLastLineItemTable = oModel.getProperty(sPathL_2 + "/aLastLineItemTable");
                            for (let k = 0; k < aLastLineItemTable.length; k++) {
                                const sPathL_3 = sPathL_2 + "/aLastLineItemTable/" + k;
                                oModel.setProperty(sPathL_3 + "/isPoRowEditable", true);
                            }
                        }
                    }
                }

                // In Po Table All Attachment Type Will Be Selected To 'PO Attachment'
                for (let i = 0; i < poHeaderTable.length; i++) {
                    oModel.setProperty("/poHeaderTable/" + i + "/DocType", "POA");
                }
                break;

            case "PS":
                if (poHeaderTable.length <= 0) {
                    this.onAddPoBtnPress();
                }
                if (functionalAreaTable.length <= 0) {
                    this.onFunctionalAreaAddRow();
                }

                // In Po Table All Attachment Type Will Be Selected To 'Approval Mail'
                for (let i = 0; i < poHeaderTable.length; i++) {
                    oModel.setProperty("/poHeaderTable/" + i + "/DocType", "AM");
                }
                break;

            //For Non Billable So // Clear Properties of Hidden Fields
            case "PSL":
            case "ETR":
            case "NBS":
            case "ISP":
                // Clear Selected Customer
                oModel.setProperty("/bill_to_customer", "");
                this.fnResetCustomerDependentInputs();

                // Clear Sales Team
                oModel.setProperty("/preSalesBySelected", "");
                oModel.setProperty("/salesResponsibleSelected", "");
                oModel.setProperty("/permanentSalesResponsible", "");

                // Clear Onsite Rules
                this.onOnsiteRuleNoSelect();

                // Delete PO Table Entries
                let poTable = oModel.getProperty("/poHeaderTable");
                for (let po of poTable) {
                    await this.onPoL1TableDelete(po.rowID);
                }
                oModel.setProperty("/poHeaderTable", []);

                // Clear Calculated PO Data
                oModel.setProperty("/poSumOfpDs", "");
                oModel.setProperty("/poSumOfGross", "");

                // Delete Profit Centre Entries
                let pcTable = oModel.getProperty("/profitCenterTable");
                for (let pc of pcTable) {
                    await this.onProfitCenterDelete(pc.rowID);
                }
                oModel.setProperty("/profitCenterTable", []);

                // Delete Functional Area Entries
                let faTable = oModel.getProperty("/functionalAreaTable");
                for (let fa of faTable) {
                    await this.onFuncAreaDelete(fa.rowID);
                }
                oModel.setProperty("/functionalAreaTable", []);

                // Add
                this.onProfitCentreAddRow();
                this.onFunctionalAreaAddRow();

                this.header_detail.bill_to_customer = "";
                this.header_detail.pre_sales = "";
                this.header_detail.sale_responsible = "";
                break;
        }
    }


    public onProductTypeChange(oEvent: Event) {
        // Loop through all po and reset selected API Type
        const poHeaderTable = sap.ui.getCore().getModel("mPageData").getProperty("/poHeaderTable");
        for (let i = 0; i < poHeaderTable.length; i++) {
            const aPoLineItemTable = poHeaderTable[i].aPoLineItemTable;
            for (let j = 0; j < aPoLineItemTable.length; j++) {
                const oRowPoLineItemTable = aPoLineItemTable[j];
                if (oRowPoLineItemTable.ddSelectedItemCategory === "API" || oRowPoLineItemTable.ddSelectedItemCategory === "AMC") {
                    sap.ui.getCore().getModel("mPageData").setProperty("/poHeaderTable/" + i + "/aPoLineItemTable/" + j + "/ddSelectedPOSubscription", []);
                }
            }
        }
    }

    public async onBusinessAreaChange(oEvent: Event = null) {
        // Reset Dependent Field
        sap.ui.getCore().getModel("mPageData").setProperty("/officeCalenderList", []);
        sap.ui.getCore().getModel("mPageData").setProperty("/office_calendar", null);
        sap.ui.getCore().getModel("mPageData").setProperty("/functionalAreaList", []);

        if (this.fnComboBoxResetValueState(oEvent)) return;

        const business_code = sap.ui.getCore().getModel("mPageData").getProperty("/businessAreaSelected");

        this.fnShowBusyDialog(true, "Fetching Office Calender");
        //<Office Calendar of Project Details>
        //office calendar data "office_name" it should autopopulated and "office_id" it will store in the DB
        const ba_office_id_info = await this.transaction.getExecutedQuery("d_o2c_business_area", { loadAll: true, company_code: this.company_code, business_area: business_code, });
        const office_calender = ba_office_id_info[0].office_calender;
        const ba_office_name_info = await this.transaction.getExecutedQuery("d_o2c_office_calendar_hdr", { loadAll: true, office_calendar_id: office_calender });
        if (ba_office_name_info.length) {
            const office_name = ba_office_name_info[0].description;
        }

        //office calendar data "description"  and "office_id" , it will come in the value help
        const office_info = await this.transaction.getExecutedQuery("d_o2c_office_calendar_hdr", { loadAll: true });
        const aOfficeInfo: Array<Object> = [];
        for (let i = 0; i < office_info.length; i++) {
            aOfficeInfo.push({
                office_calendar_id: office_info[i].office_calendar_id,
                office_name: office_info[i].description,
            });
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/officeCalenderList", aOfficeInfo);
        sap.ui.getCore().getModel("mPageData").setProperty("/office_calendar", office_calender);

        this.fnResetSetValueStateErrorNoActPath("/office_calendar", false);

        this.fnShowBusyDialog(true, "Fetching Functional Area List");
        const func_area_info = await this.transaction.getExecutedQuery("d_o2c_functional_area", { loadAll: true, company_code: this.company_code, business_area: business_code, });
        const aFuncAreaInfo: Array<Object> = [];
        for (let i = 0; i < func_area_info.length; i++) {
            aFuncAreaInfo.push({
                functional_area: func_area_info[i].functional_area,
                name: func_area_info[i].name,
            });
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/functionalAreaList", aFuncAreaInfo);

        // Clear functional area of prev BA which was added by user
        const functionalAreaTable = sap.ui.getCore().getModel("mPageData").getProperty("/functionalAreaTable");
        functionalAreaTable.map((currFuncArea: any) => {
            currFuncArea.functionalAreaSelected = "";
        })
        sap.ui.getCore().getModel("mPageData").setProperty("/functionalAreaTable", functionalAreaTable);

        if (functionalAreaTable.length <= 0) {
            // Create Empty row
            this.onFunctionalAreaAddRow();
        }

        this.fnShowBusyDialog(true, "Fetching Travel City Reimbursement Mapping");
        // fetch travel type
        const aTravelData = <KloEntitySet<d_o2c_pd_master>>await this.transaction.getExecutedQuery("d_o2c_pd_master", { loadAll: true, 'business_area': business_code, partialSelected: ['travel_type', 'travelling_location', 'per_diem_amount'] });
        const travelCityReimburseMapping = []
        aTravelData.forEach((oTravelData) => {
            travelCityReimburseMapping.push({
                travel_type: oTravelData.travel_type,
                travelling_location: oTravelData.travelling_location,
                per_diem_amount: oTravelData.per_diem_amount,
                currency: oTravelData.currency_code
            })
        });

        const uniqueTravelTypeSet = new Set<string>();
        travelCityReimburseMapping.forEach(oTravelCityMap => {
            uniqueTravelTypeSet.add(oTravelCityMap.travel_type);
        });

        // Map the unique Type inDropDown
        const aUniqueTravelTypes = Array.from(uniqueTravelTypeSet).map(travel_type => ({ travel_type }));

        sap.ui.getCore().getModel("mPageData").setProperty("/travelTypesDropDown", aUniqueTravelTypes);
        sap.ui.getCore().getModel("mPageData").setProperty("/travelCityReimburseMapping", travelCityReimburseMapping);

        this.fnShowBusyDialog(false);
        this.fnShowBusyDialog(false);
        this.fnShowBusyDialog(false);
    }

    public fnEstimateProjDate(oEvent: Event, inputIdentity: string) {
        let durationInWeeks = "";
        let project_start_date = "";
        let project_end_date = "";

        let durationInDays: any;
        let dateStart: any;
        let dateEnd: any;

        const fetchInputDatesAndWeeks = () => {
            durationInWeeks = sap.ui.getCore().getModel("mPageData").getProperty("/durationInWeeks");
            project_start_date = sap.ui.getCore().getModel("mPageData").getProperty("/project_start_date");
            project_end_date = sap.ui.getCore().getModel("mPageData").getProperty("/project_end_date");

            durationInDays = durationInWeeks === "" ? "" : Number(durationInWeeks) * 7;
            dateStart = project_start_date === "" ? "" : new Date(project_start_date);
            dateEnd = project_end_date === "" ? "" : new Date(project_end_date);
        };

        const dateFormat = (date: Date) => {
            var dd = date.getDate();
            var mm = date.getMonth() + 1;
            var yyyy = date.getFullYear();
            return mm + "/" + dd + "/" + (yyyy % 100);
        };

        let newDate = new Date();
        let daysDifference = 0;

        switch (inputIdentity) {
            case "DURATION":
                fetchInputDatesAndWeeks();
                if (dateEnd !== "") {
                    newDate = dateEnd;
                    newDate.setDate(dateEnd.getDate() - durationInDays);
                    sap.ui.getCore().getModel("mPageData").setProperty("/project_start_date", dateFormat(newDate));
                    this.fnResetSetValueStateErrorNoActPath("/project_start_date", false);
                }
                break;
            case "START_DATE":
                this.fnDateInputResetValueState(oEvent);
                fetchInputDatesAndWeeks();
                if (dateEnd !== "" && dateStart !== "") {
                    const diffTime = dateEnd - dateStart;
                    daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    sap.ui.getCore().getModel("mPageData").setProperty("/durationInWeeks", (daysDifference / 7).toFixed(1));
                    this.fnResetSetValueStateErrorNoActPath("/durationInWeeks", false);
                }
                break;
            case "END_DATE":
                if (oEvent) this.fnDateInputResetValueState(oEvent);
                fetchInputDatesAndWeeks();
                if (dateStart !== "" && dateEnd !== "") {
                    const diffTime = dateEnd - dateStart;
                    daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    sap.ui.getCore().getModel("mPageData").setProperty("/durationInWeeks", (daysDifference / 7).toFixed(1));
                    this.fnResetSetValueStateErrorNoActPath("/durationInWeeks", false);
                }
                break;
        }

        if (daysDifference < 0 || durationInDays < 0) {
            // reset [input] , end date & duration
            this.fnResetSetValueStateErrorNoActPath("/durationInWeeks", true, "Negative values not allowed"
            );
            this.fnResetSetValueStateErrorNoActPath("/project_start_date", true, "Start Date Should Smaller than End Date"
            );

            sap.ui.getCore().getModel("mPageData").setProperty("/durationInWeeks", "");
            sap.ui.getCore().getModel("mPageData").setProperty("/project_start_date", "");
        }
    }

    public async onContactManagerBtnPress() {
        const oView = this.getView();
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_so_contact_manager_dialog";

        this.popupDialogBox = await sap.ui.core.Fragment.load({ name: sViewName, controller: this });

        oView.addDependent(this.popupDialogBox);
        this.popupDialogBox.open();
    }

    public onContactEditRowBtnPress(oEvent: Event) {
        // Get Contact Data Of Selected Row
        const path: string = oEvent.getSource().getParent().getBindingContextPath();
        // -- Get Data and pass as parameter
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const oTableRowData = oPageDataModel.getProperty(path);

        this.onPopupDialogCloseBtnPress();
        this.fnContactEditorFormPopup(oTableRowData);
    }

    public onContactCreateBtnPress() {
        this.onPopupDialogCloseBtnPress();
        this.fnContactEditorFormPopup();
    }

    public async fnContactEditorFormPopup(oTableRowData = null) {
        const oView = this.getView();

        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_so_edit_contact_form_dialog";

        this.popupDialogBox = await sap.ui.core.Fragment.load({ name: sViewName, controller: this });

        if (oTableRowData === null) {
            this.popupDialogBox.setModel(new sap.ui.model.json.JSONModel({
                contact_id: "",
                title: "Mr",
                contact_name: "",
                country_code: "IND",
                email_id: "",
                contact_number: "",
                linkedin_link: "",
            }));
        } else {
            const { contact_id, title, contact_name, country_code, contact_number, email_id, linkedin_link, } = oTableRowData;
            this.popupDialogBox.setModel(new sap.ui.model.json.JSONModel({
                contactInfoBackup: oTableRowData,
                contact_id,
                title,
                contact_name,
                country_code,
                email_id,
                contact_number,
                linkedin_link,
            }));
        }

        oView.addDependent(this.popupDialogBox);
        this.popupDialogBox.open();
    }

    public onContactNumberChange(oEvent: Event) {
        this.fnInputBoxResetValueState(oEvent);

        const IsNan = isNaN(oEvent.getSource().getValue());
        if (IsNan) {
            oEvent.getSource().setValue(null);
        }
    }

    public async onContactSaveButtonPress() {
        const oModelPopup = this.popupDialogBox.getModel();

        const aAllInputErrors = [
            this.isInvalidInputBoxEntry("/contact_name", this.VALID_TYPES.TEXT, true, oModelPopup),
            this.isInvalidInputBoxEntry("/email_id", this.VALID_TYPES.EMAIL, true, oModelPopup),
            this.isInvalidInputBoxEntry("/country_code", this.VALID_TYPES.TEXT, true, oModelPopup),
            this.isInvalidInputBoxEntry("/contact_number", this.VALID_TYPES.PHONE, true, oModelPopup),
            this.isInvalidInputBoxEntry("/linkedin_link", this.VALID_TYPES.LINKEDIN, false, oModelPopup),
        ];

        if (aAllInputErrors.find((error) => error)) return; // if error === true

        const { ...oData } = oModelPopup.getProperty("/");

        const { contact_id, title, contact_name, country_code, email_id, contact_number, linkedin_link, } = oData;

        this.fnShowBusyDialog(true, "Contact Saving...");
        if (contact_id === "") {
            //  New Contact Create
            const oPageDataModel = sap.ui.getCore().getModel("mPageData");
            const cust_id = oPageDataModel.getProperty("/bill_to_customer");

            await this.transaction.createEntityP("d_o2c_customers_contact", {
                s_object_type: -1,
                title: title,
                contact_designation: "IT Manager",
                contact_name: contact_name,
                k_id: cust_id,
                country_code: country_code,
                email_id: email_id,
                contact_number: contact_number,
                linkedin_link: linkedin_link,
            }, true);
            await this.tm.commitP("Save Successful", "Save Failed", true, true);
            this.fnShowBusyDialog(false);
            this.popupDialogBox.destroy();
            this.fnFetchAllCustomerContacts();
        } else {
            // Update Contact
            const oContactInfoBackup = oData["contactInfoBackup"];
            delete oData["contactInfoBackup"];

            // Validate for new changes // If New Submitted is Same As Old Data -> Return
            if (JSON.stringify(oContactInfoBackup) == JSON.stringify(oData)) return;

            const contact_update = await this.transaction.getExecutedQuery("d_o2c_customers_contact", { loadAll: true, contact_id: contact_id });
            contact_update[0].title = title;
            contact_update[0].contact_name = contact_name;
            contact_update[0].country_code = country_code;
            contact_update[0].email_id = email_id;
            contact_update[0].contact_number = contact_number;
            contact_update[0].linkedin_link = linkedin_link;

            await this.tm.commitP("Save successfull", "Save Failed", true, true);
            this.fnShowBusyDialog(false);
            this.popupDialogBox.destroy();
            this.fnFetchAllCustomerContacts();
        }
    }

    public onAddContactRowButtonPress() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const customerContactTable: Array<any> = oPageDataModel.getProperty("/customerContactTable");

        customerContactTable.push({
            contact_id: "",
            contact_name: "",
            contact_role: "",
            contact_number: "",
            email_id: "",
            billingResponsible: false,
        });

        oPageDataModel.setProperty("/customerContactTable", customerContactTable);
    }

    public onContactNameChange(oEvent: Event) {
        if (this.fnComboBoxResetValueState(oEvent)) return;

        // Get Row Binding
        const path: string = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath();

        // -- Get Table row data
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const oTableRowData = oPageDataModel.getProperty(path);

        // -- Fetch contact Information from Offline Model
        const contactPersonList = oPageDataModel.getProperty("/contactPersonList");
        const { contact_name, contact_number, email_id } = contactPersonList.find(
            (el) => el.contact_id === oTableRowData.contact_id
        );

        // Assign New Properties
        oPageDataModel.setProperty(path, { ...oTableRowData, ...{ contact_name, contact_number, email_id }, });
    }

    public onContactTblRowDeletePress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        //delete from backend for customer contact
        const rowID = oPageDataModel.getProperty(sPath + "/rowID");
        if (rowID !== "") {
            this.onCustomerContactDelete(rowID);
        }
        //delete from frontend
        this.onTableRowDeletePress(oEvent);
    }

    public onBillingResponsibleCheckBox() {
        // Customer Contact Table
        const customerContactTable: Array<any> = sap.ui.getCore().getModel("mPageData").getProperty("/customerContactTable");

        // Rest All RedBox Error State
        for (let index = 0; index < customerContactTable.length; index++) {
            const sPath = "/customerContactTable/" + index;

            this.fnResetSetValueStateErrorNoActPath(sPath + "/billingResponsible", false);
        }
    }

    public onPopupDialogCloseBtnPress() {
        this.popupDialogBox.destroy();
    }

    public async fnFetchAllCustomerContacts() {
        const cust_id = sap.ui.getCore().getModel("mPageData").getProperty("/bill_to_customer");
        sap.ui.getCore().getModel("mPageData").setProperty("/contactPersonList", []);

        // Fetch All Contact List
        const contact_info = await this.transaction.getExecutedQuery("d_o2c_customers_contact", { loadAll: true, k_id: cust_id });
        const aContactInfo: Array<Object> = [];
        for (let i = 0; i < contact_info.length; i++) {
            aContactInfo.push({
                contact_id: contact_info[i].contact_id,
                title: contact_info[i].title,
                contact_name: contact_info[i].contact_name,
                country_code: contact_info[i].country_code,
                email_id: contact_info[i].email_id,
                contact_number: contact_info[i].contact_number,
                linkedin_link: contact_info[i].linkedin_link,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/contactPersonList", aContactInfo);
    }

    public fnResetCustomerDependentInputs() {
        sap.ui.getCore().getModel("mPageData").setProperty("/currency", "");
        sap.ui.getCore().getModel("mPageData").setProperty("/salesResponsibleSelected", "");
        sap.ui.getCore().getModel("mPageData").setProperty("/permanentSalesResponsible", "");
        sap.ui.getCore().getModel("mPageData").setProperty("/billToAddressList", []);
        this.selectBillToAddress("");
        sap.ui.getCore().getModel("mPageData").setProperty("/parent_po", "");
        sap.ui.getCore().getModel("mPageData").setProperty("/gstin", "");
        sap.ui.getCore().getModel("mPageData").setProperty("/customerContactTable", []);
    }

    public async onCustomerChange(oEvent: Event, selectedBillToAddress = null, selectedParentSo = null) {
        // Reset Dependent Input Values
        this.fnResetCustomerDependentInputs();

        //Check DUPLICATE : After Change Customer
        this.duplicatesSO();

        if (this.fnComboBoxResetValueState(oEvent)) return;

        // [START]

        const cust_id = sap.ui.getCore().getModel("mPageData").getProperty("/bill_to_customer");

        //Perform Address_ID <-> GST , Mapping
        const gst_info = await this.transaction.getExecutedQuery("d_o2c_customers_map", { loadAll: true, customer_id: cust_id });

        const addressAndGSTMappingList: Array<object> = [];
        const allAddressIds = [];
        for (let i = 0; i < gst_info.length; i++) {
            allAddressIds.push(gst_info[i].address_id_test);
            addressAndGSTMappingList.push({ address_id: gst_info[i].address_id_test, gst: gst_info[i].gstin_vat, });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/addressAndGSTMappingList", addressAndGSTMappingList);

        // [+] Fetch All Addresses
        this.fnShowBusyDialog(true, "Fetching Customer Addresses");
        const address_info = await this.transaction.getExecutedQuery("d_o2c_address", { loadAll: true, address_id: allAddressIds });
        const aAddressInfo: Array<Object> = [];
        for (let i = 0; i < address_info.length; i++) {
            //Add GST In this List Also
            let gstin = "";

            const oAddGstMap = addressAndGSTMappingList.find(
                (adgst) => adgst.address_id === address_info[i].address_id
            );

            if (oAddGstMap) {
                gstin = oAddGstMap.gst;
            }

            aAddressInfo.push({
                cust_address_id: address_info[i].address_id,
                cust_address: address_info[i].address_1,
                cust_add_gstin: gstin,
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/billToAddressList", aAddressInfo);
        // [UI] Select BillToAddress and Gst Data
        if (selectedBillToAddress !== null) {
            this.selectBillToAddress(selectedBillToAddress);
        } else {
            const bill_to_address = addressAndGSTMappingList.length === 1 ? addressAndGSTMappingList[0].address_id : "";
            this.selectBillToAddress(bill_to_address);
        }

        this.fnShowBusyDialog(true, "Fetching Contact Person Information");
        this.fnFetchAllCustomerContacts();

        // [+] Fetch All Parent SO
        const so_info = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, bill_to_customer: cust_id, });
        const aSOInfo: Array<Object> = [];
        for (let i = 0; i < so_info.length; i++) {
            aSOInfo.push({
                so: so_info[i].so,
                project_name: so_info[i].project_name
            });
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/parentSoList", aSOInfo);
        // [UI] Select Parent SO DropDown
        if (selectedParentSo !== null) {
            sap.ui.getCore().getModel("mPageData").setProperty("/parent_po", selectedParentSo);
        } else {
            sap.ui.getCore().getModel("mPageData").setProperty("/parent_po", "");
        }

        // On Change Change Manually  : Set Sales_Responsible & Currency
        if (selectedBillToAddress === null) {
            this.fnShowBusyDialog(true, "Selecting Currency & Sales Responsible");
            const cust_currency_info = await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, customer_id: cust_id, partialSelect: ["currency_type", "sales_responsible"], });

            let currency_id = "";
            let sale_responsible = "";

            for (let i = 0; i < cust_currency_info.length; i++) {
                currency_id = cust_currency_info[i].currency_type;
                sale_responsible = cust_currency_info[i].sales_responsible;
            }

            // [UI] Select Currency DropDown
            sap.ui.getCore().getModel("mPageData").setProperty("/currency", currency_id);
            this.fnResetSetValueStateErrorNoActPath("/currency", false);

            sap.ui.getCore().getModel("mPageData").setProperty("/currExchangeRate", "");
            this.fetchCurrencyExchange();

            // [UI] Select Sales Responsible DropDown
            sap.ui.getCore().getModel("mPageData").setProperty("/salesResponsibleSelected", sale_responsible.toUpperCase());
            sap.ui.getCore().getModel("mPageData").setProperty("/permanentSalesResponsible", sale_responsible.toUpperCase());
            this.fnResetSetValueStateErrorNoActPath("salesResponsibleSelected", false);
        }

        this.fnShowBusyDialog(false);
        this.fnShowBusyDialog(false);
        this.fnShowBusyDialog(false);
    }

    public async onCustomerAddressVh() {
        const oView = this.getView();

        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_so_customer_address_dialog";

        this.popupDialogBox = await sap.ui.core.Fragment.load({
            name: sViewName,
            controller: this,
        });

        oView.addDependent(this.popupDialogBox);
        this.popupDialogBox.open();
    }

    /**
     * onSalesResponsibleChange
     */
    public async onSalesResponsibleChange(oEvent: Event) {
        this.fnComboBoxResetValueState(oEvent);

        // Selected Sales Responsible
        const salesResponsibleSelected = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/salesResponsibleSelected");
        // permanent Sales Responsible
        const permanentSalesResponsible = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/permanentSalesResponsible");
        //customer ID
        const customerId = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/bill_to_customer");
        if (
            permanentSalesResponsible !== salesResponsibleSelected &&
            customerId != ""
        ) {
            // popup Update | No
            sap.m.MessageBox.confirm(
                "Do you want to update this Sales Responsible in Customer.",
                {
                    title: "Confirm",
                    actions: ["Update", "No"],
                    emphasizedAction: "No",
                    onClose: async (oAction) => {
                        // If Update
                        // TODO - ALBIA
                        if (oAction == "Update") {
                            let customerSalesResp = await this.transaction.getExecutedQuery(
                                "d_o2c_customers",
                                { loadAll: true, customer_id: customerId }
                            );
                            customerSalesResp[0].sales_responsible =
                                salesResponsibleSelected.toLocaleLowerCase();
                            let employeeName = await this.transaction.getExecutedQuery(
                                "d_o2c_employee",
                                { loadAll: true, employee_id: salesResponsibleSelected }
                            );
                            customerSalesResp[0].sales_responsible_name =
                                employeeName[0].full_name;
                            await this.tm.commitP("Updated", "Updated Failed", true, true);
                            sap.ui
                                .getCore()
                                .getModel("mPageData")
                                .setProperty(
                                    "/permanentSalesResponsible",
                                    salesResponsibleSelected
                                );
                        }
                    },
                }
            );
        }
    }

    public onOnsiteRuleNoSelect() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        if (oPageDataModel.getProperty("/onSiteRadioButton/yes")) return;

        oPageDataModel.setProperty("/reimbursement_rules", "");
        oPageDataModel.setProperty("/reimbursement_remark", "");
    }

    /**
     * onAddOSTravelButtonPress
     */
    public onAddOSTravelButtonPress() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const tableTravel: Array<any> = oPageDataModel.getProperty("/tableTravel");

        tableTravel.push({
            travel_id: "",
            toCityDropdown: [],
            travelTypeSelected: "",
            toCitySelected: "",
            standardReimburse: "",
            applicableReimburse: ""
        });

        oPageDataModel.setProperty("/tableTravel", tableTravel);
    }

    /**
     * onTravelTableDeleteBtnPress
     */
    public onTravelTblRowDeletePress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();

        //delete from backend
        const rowID = oPageDataModel.getProperty(sRowPath + "/rowID");


        if (rowID !== "") {
            this.onTravelDelete(rowID);
        }
        //delete from frontend
        this.fnDeleteRowFromTable(sRowPath);

    }

    public onTravelTypeDDChange(oEvent: Event) {
        this.fnComboBoxResetValueState(oEvent);
        const sRowPath: string = oEvent.getSource().getParent().getParent().getBindingContextPath();
        // -- Get Table row data
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const travelType = oEvent.getSource().getValue();
        const aTavelCityDropDown = this.getTavelCityDropDown(travelType);

        oPageDataModel.setProperty(sRowPath + "/toCityDropdown", aTavelCityDropDown);
        oPageDataModel.setProperty(sRowPath + "/toCitySelected", "");
        oPageDataModel.setProperty(sRowPath + "/standardReimburse", "");
        oPageDataModel.setProperty(sRowPath + "/currency", "");
    }

    public onToCityDDChange(oEvent: Event) {
        this.fnComboBoxResetValueState(oEvent);
        const sRowPath: string = oEvent.getSource().getParent().getParent().getBindingContextPath();
        // -- Get Table row data
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const { travelTypeSelected, toCitySelected } = oPageDataModel.getProperty(sRowPath);

        const standardReimburse = this.getStandardReimburseVal(travelTypeSelected, toCitySelected);
        const currencyCode = this.getReimburseCurrencyCode(travelTypeSelected, toCitySelected);
        oPageDataModel.setProperty(sRowPath + "/standardReimburse", standardReimburse);
        oPageDataModel.setProperty(sRowPath + "/currency", currencyCode);
    }

    public getTavelCityDropDown(travelType: string) {
        const aTravelCityReimburseMapping = sap.ui.getCore().getModel("mPageData").getProperty("/travelCityReimburseMapping");
        const aTavelCityDropDown = aTravelCityReimburseMapping
            .filter(oMapping => oMapping.travel_type === travelType)
            .map(oTravelMap => ({ travelling_location: oTravelMap.travelling_location }));

        return aTavelCityDropDown;
    }

    public getStandardReimburseVal(travelType: string, travelCity: string) {
        const aTravelCityReimburseMapping = sap.ui.getCore().getModel("mPageData").getProperty("/travelCityReimburseMapping");
        const aTavelCityDropDown = aTravelCityReimburseMapping.find(oMapping => oMapping.travel_type === travelType && oMapping.travelling_location === travelCity);

        if (aTavelCityDropDown) {
            return aTavelCityDropDown.per_diem_amount;
        } else {
            return "N/A";
        }
    }

    public getReimburseCurrencyCode(travelType: string, travelCity: string) {
        const aTravelCityReimburseMapping = sap.ui.getCore().getModel("mPageData").getProperty("/travelCityReimburseMapping");
        const aTavelCityDropDown = aTravelCityReimburseMapping.find(oMapping => oMapping.travel_type === travelType && oMapping.travelling_location === travelCity);

        if (aTavelCityDropDown) {
            return aTavelCityDropDown.currency;
        } else {
            return "";
        }
    }

    public onProfitCentreAddRow() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const profitCenterTable: Array<any> =
            oPageDataModel.getProperty("/profitCenterTable");

        // check if there is any Primary Selected
        let primaryPc = true;
        if (profitCenterTable.find((el) => el.primaryPc)) {
            primaryPc = false;
        }

        profitCenterTable.push({
            rowID: "",
            profitCentre: "",
            percentage: "",
            pDs: "",
            projectPDs: "",
            projectLead: "",
            manager: "",
            teamHeadSelected: "",
            primaryPc,
            ProjectId: '',
            projectIdClickable: false
        });

        oPageDataModel.setProperty("/profitCenterTable", profitCenterTable);
    }

    public onProfitCenterChange(oEvent: Event) {
        if (this.fnComboBoxResetValueState(oEvent)) return;

        // Get Row Binding
        const sPath: string = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();

        // -- Get Table Row Data
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const oTableRow = oPageDataModel.getProperty(sPath);

        // -- Set Team Head
        const profitCenterList = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/profitCenterList");
        const { team_head } = profitCenterList.find(
            (a) => a.profit_cntr_id === oTableRow.profitCentre
        );
        oTableRow.teamHeadSelected = team_head;
        this.fnResetSetValueStateErrorNoActPath(sPath + "/teamHeadSelected", false);

        // -- UpDate Table
        oPageDataModel.setProperty(sPath, oTableRow);
    }

    public onProfitCenterRadioBtnPress(oEvent: Event) {
        const sPath: string = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();

        // -- Get Data
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const [...aTableRows]: Array<any> =
            oPageDataModel.getProperty("/profitCenterTable");

        // -- Unselect All Radio Button
        aTableRows.map((oCurrRow) => {
            oCurrRow.primaryPc = false;
        });

        // -- Select Only One RadioButton
        const aRegexIndex = sPath.match(/([^/]+)$/);
        if (aRegexIndex === null) return;
        const selectedIndex = parseInt(aRegexIndex[1]);

        // -- Update Table Row
        aTableRows[selectedIndex]["primaryPc"] = true;
        oPageDataModel.setProperty("/profitCenterTable", aTableRows);
    }

    /**
     * onPressProfitCenterProjId
     */
    public async onPressProfitCenterProjId(oEvent: Event) {
        const projectID = oEvent.getSource().getText();
        //TODO --ALBIA
        this.header_detail.r_project?.q ?? await this.header_detail.r_project.fetch();
        let projectGuid = await this.header_detail.r_project.filter((item) => item.project_id == projectID);

        await this.navTo(({ TS: true, H: true, S: 'p_project', AD: projectGuid[0].project_guid }));
    }

    public onFunctionalAreaAddRow() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const functionalAreaTable: Array<any> = oPageDataModel.getProperty(
            "/functionalAreaTable"
        );

        functionalAreaTable.push({
            rowID: "",
            functionalAreaSelected: "",
            percentage: "",
            pDs: "",
        });

        oPageDataModel.setProperty("/functionalAreaTable", functionalAreaTable);
    }

    public onProfitCentreTableRowDeletePress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // Do Not Delete If No Of Rows are only One remaining.
        const profitCenterTable = oPageDataModel.getProperty("/profitCenterTable");
        if (profitCenterTable.length <= 1) return;

        const sPath: string = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        const { primaryPc, rowID } = oPageDataModel.getProperty(sPath);

        this.fnDeleteRowFromTable(sPath);

        // If Deleted Row Was Primary -> Make first row Profit Centre Primary
        if (primaryPc) {
            oPageDataModel.setProperty("/profitCenterTable/0/primaryPc", true);
        }

        this.onProfitCenterDelete(rowID);
    }

    public onFunctionalAreaTableRowDeletePress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const orderTypeSelected = oPageDataModel.getProperty("/orderTypeSelected");
        if (orderTypeSelected !== "NBS") {
            // Do Not Delete If No Of Rows are only One remaining.
            const functionalAreaTable = oPageDataModel.getProperty(
                "/functionalAreaTable"
            );
            if (functionalAreaTable.length <= 1) return;
        }

        const sPath: string = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        const { rowID } = oPageDataModel.getProperty(sPath);
        this.fnDeleteRowFromTable(sPath);

        this.onFuncAreaDelete(rowID);
    }

    public onPoDateChange(oEvent: Event) {
        this.fnDateInputResetValueState(oEvent);

        //Check DUPLICATE : After Change // PO DATE
        this.duplicatesSO(
            "PO_CHANGE",
            oEvent.getSource().getParent().getBindingContextPath()
        );
    }

    public onPONumberChange(oEvent: Event) {
        //Check DUPLICATE : After Change In PO Number
        this.duplicatesSO(
            "PO_CHANGE",
            oEvent.getSource().getParent().getBindingContextPath()
        );
    }

    public async onPOTableRowLI_1DeletePress(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();

        if (!await this.fnShowConfirmationDialog("Table Row Will Be Deleted.")) {
            return;
        }

        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const orderTypeSelected = sap.ui.getCore().getModel("mPageData").getProperty("/orderTypeSelected");

        // Do Not Delete If No Of Rows are only One remaining only for SO.
        const poHeaderTable = oPageDataModel.getProperty("/poHeaderTable");
        if (orderTypeSelected === "SO" && poHeaderTable.length <= 1) {
            return;
        }

        //delete from backend
        const rowID = oPageDataModel.getProperty(sPath + "/rowID");
        if (rowID !== "") {
            this.onPoL1TableDelete(rowID);
        }
        //delete from Frontend
        this.fnDeleteRowFromTable(sPath);

        this.fnPerformSumOfTotalGrossWithoutTax();
        this.fnPerformSumOfTotalPDs();

        this.fnReCalculateFunctionalAreaPDs();
        this.fnReCalculateProfitCenterPDs();
    }

    public async onPOTableRowLI_2DeletePress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sRowPath: string = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContextPath();

        if (!await this.fnShowConfirmationDialog("Table Row Will Be Deleted.")) {
            return;
        }

        //delete from backend
        const rowID = oPageDataModel.getProperty(sRowPath + "/rowID");
        if (rowID !== "") {
            this.onPoL2TableDelete(rowID);
        }

        //delete from Frontend
        this.fnDeleteRowFromTable(sRowPath);
    }

    public async onPOTableRowLI_3DeletePress(oEvent: Event, tableName: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();

        if (!await this.fnShowConfirmationDialog("Table Row Will Be Deleted.")) {
            return;
        }

        //delete from backend
        const rowID = oPageDataModel.getProperty(sRowPath + "/rowID");
        if (rowID !== "") {
            this.onPoL3TableDelete(rowID, tableName);
        }

        //delete from Frontend
        this.fnDeleteRowFromTable(sRowPath);
    }

    public onTableRowDeletePress(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();

        this.fnDeleteRowFromTable(sPath);
    }

    public fnDeleteRowFromTable(sRowPath: string) {
        const aRegexIndex = sRowPath.match(/([^/]+)$/); // Get Last Index To Delete
        if (aRegexIndex === null) return;
        const indexToDelete = parseInt(aRegexIndex[1]);
        const sPathToUpdate = sRowPath.replace(/\/[^/]+$/, ""); // Get Model Path To Update
        if (sPathToUpdate === null) return;

        // -- Get Data
        const aTableRows: Array<any> = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty(sPathToUpdate);

        // -- Delete Data
        aTableRows.splice(indexToDelete, 1);

        // -- Update Data
        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty(sPathToUpdate + "/", [...aTableRows]);
    }

    public selectBillToAddress(billToAddressId: string) {
        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/bill_to_address", billToAddressId);

        const billToAddressList = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/billToAddressList");

        const oBillToAddr = billToAddressList.find(
            (x) => x.cust_address_id === billToAddressId
        );

        if (oBillToAddr) {
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty("/bill_to_addressName", oBillToAddr.cust_address);
        } else {
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty("/bill_to_addressName", "");
        }

        this.fnResetSetValueStateErrorNoActPath("/bill_to_address", false);

        this.onBillToAddressChange();
    }

    public onCustomerAddressSelectionPress(oEvent: Event) {
        const oSelectedItem = oEvent.getParameter("listItem");
        const oContext = oSelectedItem.getBindingContext("mPageData");
        const oSelectedObject = oContext.getObject();

        const cust_address_id = oSelectedObject.cust_address_id;
        this.selectBillToAddress(cust_address_id);

        this.onPopupDialogCloseBtnPress();
    }

    public async onBillToAddressChange() {
        // Reset Dependent Inputs
        sap.ui.getCore().getModel("mPageData").setProperty("/gstin", "");

        const addressAndGSTMappingList = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/addressAndGSTMappingList");
        const bill_to_address = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/bill_to_address");
        const oAddressAndGSTMapping = addressAndGSTMappingList.find(
            (el) => el.address_id === bill_to_address
        );

        if (oAddressAndGSTMapping === undefined) return;
        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/gstin", oAddressAndGSTMapping.gst);
    }

    public async onAddPoBtnPress() {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const aPoHeaderTable: Array<any> =
            oPageDataModel.getProperty("/poHeaderTable");
        const orderTypeSelected = oPageDataModel.getProperty("/orderTypeSelected");

        aPoHeaderTable.push({
            isPoRowEditable: true,
            isPoRowProvisionalEditable: true,
            approval_status: "",
            rowID: "",
            isThisTableExpanded: false,
            DocType: orderTypeSelected === "SO" ? "POA" : "AM",
            AttachedCopy: "",
            AttachedCopyDownloaded: "",
            ProposalCopy: "",
            ProposalCopyDownloaded: "",
            PONumber: "",
            CRNumber: "",
            PODate: "",
            GrossValue: "",
            BudgetedPD: "",
            projectPD: "",
            CRRate: "",
            TaxChecked: false,
            Remark: "",
            aPoLineItemTable: [],
        });

        oPageDataModel.setProperty("/poHeaderTable", aPoHeaderTable);
    }

    public onLineItemCreateBtnPress(oEvent: Event) {
        const path: string = "/poHeaderTable/0"
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const oPoHeaderTableRow = oPageDataModel.getProperty(path);

        //Assign DropDown Item Value To Rows
        const { ddInvoiceTypes, ddInvoiceCycle } = this.fnGetPoLineItemDropDownMapping();

        oPoHeaderTableRow.isThisTableExpanded = true;
        oPoHeaderTableRow.aPoLineItemTable.push({
            rowID: "",
            isThisTableExpanded: false,
            ddInvoiceTypes,
            ddInvoiceCycle,
            ddSelectedItemCategory: "",
            ddSelectedItemCategory_BACKUP: "",
            Quantity: "",
            Quantity_BACKUP: "",
            Rate: "",
            Rate_BACKUP: "",
            Unit: "AU",
            GrossValue: "",
            GrossValue_BACKUP: "",
            ddSelectedInvoiceType: "",
            ddSelectedInvoiceType_BACKUP: "",
            ddSelectedInvoiceCycle: "",
            ddSelectedInvoiceCycle_BACKUP: "",
            StartDate: "",
            isStartDateEditable: true,
            EndDate: "",
            EndDate_BACKUP: "",
            MinimumBillingRate: "",
            MinimumBillingRateEnabled: false,
            ddSelectedPOSubscription: [],
            aSavedPoSubscriptionIdMap: [],
            unitSubscriptionEnabled: false,
            PerAPIPrice: "",
            BalanceAmount: "",
            aLastLineItemTableIdentity: "",
            aLastLineItemTable: [],
        });

        oPageDataModel.setProperty(path, oPoHeaderTableRow);
    }

    public onAttachCopyUpload(oEvent: Event) {
        this.fnInputBoxResetValueState(oEvent);
        const path = oEvent
            .getSource()
            .getParent()
            .getParent()
            .getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        oPageDataModel.setProperty(
            path + "/AttachedCopy",
            oEvent.mParameters.files[0]
        );
    }

    public onProposalCopyUpload(oEvent: Event) {
        this.fnInputBoxResetValueState(oEvent);
        const path = oEvent
            .getSource()
            .getParent()
            .getParent()
            .getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        oPageDataModel.setProperty(
            path + "/ProposalCopy",
            oEvent.mParameters.files[0]
        );
    }

    public async onDownloadAttachCopy(oEvent: Event) {
        const path = oEvent
            .getSource()
            .getParent()
            .getParent()
            .getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/AttachedCopyDownloaded");
        await qq.downloadAttachP();
    }

    public async onDownloadProposalCopy(oEvent: Event) {
        const path = oEvent
            .getSource()
            .getParent()
            .getParent()
            .getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/ProposalCopyDownloaded");
        await qq.downloadAttachP();
    }

    public fnGetGeneratedScheduleBasedTable(sPathLItem2: string, oModel: sap.ui.model.Model) {
        // For Schedule Based Table | StartDate , EndDate , Qty , Rate | is much needed
        const oPoHeaderTblLineItemRow = oModel.getProperty(sPathLItem2);
        const { StartDate, EndDate, Quantity, Rate, GrossValue, ddSelectedInvoiceCycle, ddSelectedItemCategory, } = oPoHeaderTblLineItemRow;

        let invalidInputFlag = false;

        if (StartDate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/StartDate", true, "Please Select Any Value");
            invalidInputFlag = true;
        }
        if (EndDate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/EndDate", true, "Please Select Any Value");
            invalidInputFlag = true;
        } else if (new Date(EndDate).toString() !== "Invalid Date" && new Date(StartDate).toString() !== "Invalid Date") {
            if (new Date(EndDate).getTime() - new Date(StartDate).getTime() < 0) {
                oModel.setProperty(sPathLItem2 + '/EndDate', '');
                oModel.setProperty(sPathLItem2 + '/EndDate_BACKUP', '');
                this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/EndDate", true, "EndDate Should Be Greater Than Start Date");
                invalidInputFlag = true;
            }
        }

        if (Quantity === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/Quantity", true, "Please Enter Any Value");
            invalidInputFlag = true;
        }
        if (Rate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/Rate", true, "Please Enter Any Value");
            invalidInputFlag = true;
        }

        if (invalidInputFlag) {
            return [];
        }

        const aScheduleBasedAmountDistribution = this.fnGetScheduleBasedAmountDistribution(StartDate, EndDate, ddSelectedInvoiceCycle, GrossValue, ddSelectedItemCategory);

        const aLastLineItemTable = [];

        aScheduleBasedAmountDistribution.forEach((el) => {
            aLastLineItemTable.push({
                isPoRowEditable: true,
                rowID: "",
                description: el.description,
                startDate: el.startDate,
                endDate: el.endDate,
                amount: el.amount,
                billdate: el.milestoneDate,
                invoiceStatus: "Pending",
                invoice_date: "",
                invoice_number: "",
                remark: "",
            });
        });

        // For Future Use -> Set Backup For Generated Table Parameter
        // It will help to revert user input while next re-Calculation error
        oModel.setProperty(sPathLItem2 + '/Quantity_BACKUP', Quantity);
        oModel.setProperty(sPathLItem2 + '/Rate_BACKUP', Rate);
        oModel.setProperty(sPathLItem2 + '/GrossValue_BACKUP', GrossValue);
        oModel.setProperty(sPathLItem2 + '/EndDate_BACKUP', EndDate);

        return aLastLineItemTable;
    }

    public fnGetGenerateVolumeTable(sPathLItem2: string, oModel: sap.ui.model.Model) {
        // For Volume Based Table | StartDate , EndDate , Qty , Rate | is much needed
        const oPoHeaderTblLineItemRow = oModel.getProperty(sPathLItem2);
        const { StartDate, EndDate, Quantity, Rate, GrossValue, ddSelectedInvoiceCycle, ddSelectedItemCategory, MinimumBillingRate } = oPoHeaderTblLineItemRow;

        let invalidInputFlag = false;

        if (StartDate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/StartDate", true, "Please Select Any Value");
            invalidInputFlag = true;
        }
        if (EndDate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/EndDate", true, "Please Select Any Value");
            invalidInputFlag = true;
        } else if (new Date(EndDate).toString() !== "Invalid Date" && new Date(StartDate).toString() !== "Invalid Date") {
            if (new Date(EndDate).getTime() - new Date(StartDate).getTime() < 0) {
                oModel.setProperty(sPathLItem2 + '/EndDate', '');
                oModel.setProperty(sPathLItem2 + '/EndDate_BACKUP', '');
                this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/EndDate", true, "EndDate Should Be Greater Than Start Date");
                invalidInputFlag = true;
            }
        }

        if (Quantity === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/Quantity", true, "Please Enter Any Value");
            invalidInputFlag = true;
        }
        if (Rate === "") {
            this.fnResetSetValueStateErrorNoActPath(sPathLItem2 + "/Rate", true, "Please Enter Any Value");
            invalidInputFlag = true;
        }

        if (invalidInputFlag) {
            return [];
        }

        const aVolumeBasedAmountDistribution = this.fnGetVolumeBasedAmountDistribution(StartDate, EndDate, ddSelectedInvoiceCycle, GrossValue, Quantity, ddSelectedItemCategory, MinimumBillingRate);

        const aLastLineItemTable = [];

        aVolumeBasedAmountDistribution.forEach((el) => {
            aLastLineItemTable.push({
                isPoRowEditable: true,
                rowID: "",
                description: el.description,
                Quantity: el.Quantity,
                amount: el.amount,
                startDate: el.startDate,
                endDate: el.endDate,
                milestoneDate: el.milestoneDate,
                invoiceStatus: "Pending",
                invoice_date: "",
                invoice_number: "",
                remark: ""
            });
        });

        // For Future Use -> Set Backup For Generated Table Parameter
        // It will help to revert user input while next re-Calculation error
        oModel.setProperty(sPathLItem2 + '/Quantity_BACKUP', Quantity);
        oModel.setProperty(sPathLItem2 + '/Rate_BACKUP', Rate);
        oModel.setProperty(sPathLItem2 + '/GrossValue_BACKUP', GrossValue);
        oModel.setProperty(sPathLItem2 + '/EndDate_BACKUP', EndDate);

        return aLastLineItemTable;
    }

    public fnAddLastLineItemTable(oEvent: Event): void {
        const sPath: string = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const oPoHeaderTblLineItemRow = oPageDataModel.getProperty(sPath);
        const { ddSelectedItemCategory, ddSelectedInvoiceType, ddSelectedInvoiceCycle } = oPoHeaderTblLineItemRow;

        // Check If ItemCategory , InvType , InvCycle is selected or Not
        if (ddSelectedItemCategory === "") {
            this.fnResetSetValueStateErrorNoActPath(sPath + "/ddSelectedItemCategory", true, "Please Select Any Value");
            return;
        }
        if (ddSelectedInvoiceType === "") {
            this.fnResetSetValueStateErrorNoActPath(sPath + "/ddSelectedInvoiceType", true, "Please Select Any Value");
            return;
        }
        if (ddSelectedInvoiceCycle === "") {
            this.fnResetSetValueStateErrorNoActPath(sPath + "/ddSelectedInvoiceCycle", true, "Please Select Any Value");
            return;
        }

        // Guess Table Identity Based on selected ItemCategory , InvType , InvCycle
        const sTableIdentifier = this.fnGetTableNameFromMapping(ddSelectedItemCategory, ddSelectedInvoiceType, ddSelectedInvoiceCycle);

        if (oPoHeaderTblLineItemRow.aLastLineItemTableIdentity !== sTableIdentifier) {
            oPoHeaderTblLineItemRow.aLastLineItemTable = [];
        }

        switch (sTableIdentifier) {
            case "TABLE_MILESTONE_BASED":
                oPoHeaderTblLineItemRow.aLastLineItemTableIdentity = sTableIdentifier;
                oPoHeaderTblLineItemRow.aLastLineItemTable.push({
                    isPoRowEditable: true,
                    rowID: "",
                    description: "",
                    amount: "",
                    percentage: "",
                    date: "",
                    status: "Pending",
                    invoice_date: "",
                    invoice_number: "",
                    remark: ""
                });
                break;

            case "TABLE_SCHEDULE_BASED":
                const aLastLineItemTable = this.fnGetGeneratedScheduleBasedTable(sPath, oPageDataModel);
                if (aLastLineItemTable.length <= 0) return;

                oPoHeaderTblLineItemRow.aLastLineItemTableIdentity = sTableIdentifier;
                oPoHeaderTblLineItemRow.aLastLineItemTable = aLastLineItemTable;
                break;
            case "TABLE_VOLUME_BASED":
                // If AMC
                if (ddSelectedItemCategory === "AMC" || ddSelectedInvoiceCycle === "ONACT") {
                    oPoHeaderTblLineItemRow.aLastLineItemTableIdentity = sTableIdentifier;
                    oPoHeaderTblLineItemRow.aLastLineItemTable.push({
                        isPoRowEditable: true,
                        rowID: "",
                        description: "",
                        Quantity: "",
                        amount: "",
                        startDate: "",
                        endDate: "",
                        milestoneDate: "",
                        invoiceStatus: "Pending",
                        invoice_date: "",
                        invoice_number: "",
                        remark: ""
                    });

                } else {
                    const aLastLineItemTable = this.fnGetGenerateVolumeTable(sPath, oPageDataModel);
                    if (aLastLineItemTable.length <= 0) return;

                    oPoHeaderTblLineItemRow.aLastLineItemTableIdentity = sTableIdentifier;
                    oPoHeaderTblLineItemRow.aLastLineItemTable = aLastLineItemTable;
                }

                break;
        }

        oPoHeaderTblLineItemRow.isThisTableExpanded = true;

        oPageDataModel.setProperty(sPath, oPoHeaderTblLineItemRow);
    }

    public fnGetPoLineItemDropDownMapping(iItemCategoryKey = "", iInvoiceTypeKey = "") {
        const aDropDownItemCategories = [
            { key: "PROJFEE", value: "Project Fee", isEnabled: true },
            { key: "TNM", value: "T&M", isEnabled: true },
            { key: "EXPENSE", value: "Expense", isEnabled: true },
            { key: "LISC", value: "License", isEnabled: true },
            { key: "USRSUBSCR", value: "User Subscription", isEnabled: true },
            { key: "API", value: "API", isEnabled: true },
            { key: "AMC", value: "AMC", isEnabled: true },
        ];

        const aDropDownInviceTypes = [
            {
                key: "MILESTONE",
                value: "Milestone",
                dependentItemCategoryKeys: ["PROJFEE", "EXPENSE", "LISC", "USRSUBSCR"],
            },
            {
                key: "TNM",
                value: "T&M",
                dependentItemCategoryKeys: ["PROJFEE"]
            },
            {
                key: "MONTHLYFIX",
                value: "Fix",
                dependentItemCategoryKeys: ["PROJFEE", "EXPENSE", "API", "AMC"],
            },
            {
                key: "VOLUME",
                value: "Volume",
                dependentItemCategoryKeys: ["PROJFEE", "TNM", "LISC", "USRSUBSCR", "AMC"],
            },
            {
                key: "ONACT",
                value: "On Actual",
                dependentItemCategoryKeys: ["EXPENSE", "API"],
            },
        ];

        const aDropDownInvoiceCycle = [
            {
                key: "NA",
                value: "N/A",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["MILESTONE"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["MILESTONE"],
                    },
                    {
                        dependentItemCategoryKey: "LISC",
                        dependentInvoiceTypeKeys: ["MILESTONE"],
                    },
                    {
                        dependentItemCategoryKey: "USRSUBSCR",
                        dependentInvoiceTypeKeys: ["MILESTONE"],
                    },
                ],
            },
            {
                key: "MONTHLY",
                value: "Monthly",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["TNM", "MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "TNM",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "LISC",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "USRSUBSCR",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "API",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "ONACT"],
                    },
                    {
                        dependentItemCategoryKey: "AMC",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "VOLUME"],
                    },
                ],
            },
            {
                key: "QUTRLY",
                value: "Quarterly",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["TNM", "MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "TNM",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "LISC",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "USRSUBSCR",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "API",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "ONACT"],
                    },
                    {
                        dependentItemCategoryKey: "AMC",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "VOLUME"],
                    },
                ],
            },
            {
                key: "HALFYEARLY",
                value: "Half Yearly",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["TNM", "MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "TNM",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "LISC",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "USRSUBSCR",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "API",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "ONACT"],
                    },
                    {
                        dependentItemCategoryKey: "AMC",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "VOLUME"],
                    },
                ],
            },
            {
                key: "YEARLY",
                value: "Yearly",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["TNM", "MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "TNM",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX"],
                    },
                    {
                        dependentItemCategoryKey: "LISC",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "USRSUBSCR",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "API",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "ONACT"],
                    },
                    {
                        dependentItemCategoryKey: "AMC",
                        dependentInvoiceTypeKeys: ["MONTHLYFIX", "VOLUME"],
                    },
                ],
            },
            {
                key: "MILSTBASED",
                value: "",
                dependentKeys: [],
            },
            {
                key: "ONACT",
                value: "On Actual",
                dependentKeys: [
                    {
                        dependentItemCategoryKey: "PROJFEE",
                        dependentInvoiceTypeKeys: ["VOLUME"],
                    },
                    {
                        dependentItemCategoryKey: "EXPENSE",
                        dependentInvoiceTypeKeys: ["ONACT"],
                    },
                ],
            },
        ];

        const ddInvoiceTypes = aDropDownInviceTypes.filter((element) =>
            element.dependentItemCategoryKeys.includes(iItemCategoryKey)
        );

        ddInvoiceTypes.map((element) => {
            delete element.dependentItemCategoryKeys;
        });

        const ddInvoiceCycle = aDropDownInvoiceCycle.filter((element) =>
            element.dependentKeys.findIndex(
                (el) =>
                    el.dependentItemCategoryKey === iItemCategoryKey &&
                    el.dependentInvoiceTypeKeys.includes(iInvoiceTypeKey)
            ) === -1
                ? false
                : true
        );

        ddInvoiceCycle.map((element) => {
            delete element.dependentKeys;
        });

        return {
            ddItemCategories: aDropDownItemCategories,
            ddInvoiceTypes,
            ddInvoiceCycle,
        };
    }

    public fnGetTableNameFromMapping(itemCategory = "", invoiceType = "", InvoiceCycle = ""): string {
        const aTableIdentifierMappings = {
            TNM: {
                VOLUME: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
            PROJFEE: {
                MILESTONE: {
                    NA: "TABLE_MILESTONE_BASED",
                },
                TNM: {
                    MONTHLY: "TABLE_SCHEDULE_BASED",
                    QUTRLY: "TABLE_SCHEDULE_BASED",
                    HALFYEARLY: "TABLE_SCHEDULE_BASED",
                    YEARLY: "TABLE_SCHEDULE_BASED",
                },
                MONTHLYFIX: {
                    MONTHLY: "TABLE_SCHEDULE_BASED",
                    QUTRLY: "TABLE_SCHEDULE_BASED",
                    HALFYEARLY: "TABLE_SCHEDULE_BASED",
                    YEARLY: "TABLE_SCHEDULE_BASED",
                },
                VOLUME: {
                    ONACT: "TABLE_VOLUME_BASED",
                },
            },
            TNM: {
                VOLUME: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
            EXPENSE: {
                MILESTONE: {
                    NA: "TABLE_MILESTONE_BASED",
                },

                MONTHLYFIX: {
                    MONTHLY: "TABLE_SCHEDULE_BASED",
                    QUTRLY: "TABLE_SCHEDULE_BASED",
                    HALFYEARLY: "TABLE_SCHEDULE_BASED",
                    YEARLY: "TABLE_SCHEDULE_BASED",
                },
                ONACT: {
                    ONACT: "TABLE_MILESTONE_BASED",
                },
            },
            LISC: {
                MILESTONE: {
                    NA: "TABLE_MILESTONE_BASED",
                },

                VOLUME: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
            USRSUBSCR: {
                MILESTONE: {
                    NA: "TABLE_MILESTONE_BASED",
                },

                VOLUME: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
            API: {
                MONTHLYFIX: {
                    MONTHLY: "TABLE_SCHEDULE_BASED",
                    QUTRLY: "TABLE_SCHEDULE_BASED",
                    HALFYEARLY: "TABLE_SCHEDULE_BASED",
                    YEARLY: "TABLE_SCHEDULE_BASED",
                },
                ONACT: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
            AMC: {
                MONTHLYFIX: {
                    MONTHLY: "TABLE_SCHEDULE_BASED",
                    QUTRLY: "TABLE_SCHEDULE_BASED",
                    HALFYEARLY: "TABLE_SCHEDULE_BASED",
                    YEARLY: "TABLE_SCHEDULE_BASED",
                },
                VOLUME: {
                    MONTHLY: "TABLE_VOLUME_BASED",
                    QUTRLY: "TABLE_VOLUME_BASED",
                    HALFYEARLY: "TABLE_VOLUME_BASED",
                    YEARLY: "TABLE_VOLUME_BASED",
                },
            },
        };
        let sTableNameIdentity = "";
        try {
            sTableNameIdentity =
                aTableIdentifierMappings[itemCategory][invoiceType][InvoiceCycle];
        } catch (error) {
            // Do Nothing
        }

        return sTableNameIdentity;
    }

    public onExpandCollapseHeaderTable(oEvent: Event) {
        const sRowPath: string = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const isThisTableExpanded = oPageDataModel.getProperty(
            sRowPath + "/isThisTableExpanded"
        );

        oPageDataModel.setProperty(
            sRowPath + "/isThisTableExpanded",
            !isThisTableExpanded
        );
    }

    /**
     * checkAndSetPoItemCategoryDropDown
     */
    public checkAndSetPoItemCategoryDropDown() {
        const oModel = sap.ui.getCore().getModel("mPageData");

        const poHeaderTable = oModel.getProperty("/poHeaderTable");
        let poHasTnMorProjFee = "";

        poHeaderTable.forEach(({ aPoLineItemTable }) => {
            const isTnMExist = aPoLineItemTable.find(({ ddSelectedItemCategory }) => ddSelectedItemCategory === "TNM");
            const isProjfeeExist = aPoLineItemTable.find(({ ddSelectedItemCategory }) => ddSelectedItemCategory === "PROJFEE");

            if (isTnMExist) {
                poHasTnMorProjFee = "TNM";
                return
            }

            if (isProjfeeExist) {
                poHasTnMorProjFee = "PROJFEE";
                return;
            }
        });

        // if "poHasTnMorProjFee" is still empty => Enable dropdown for both TnM and ProjFee
        const ddPOItemCategories = oModel.getProperty("/ddPOItemCategories");

        ddPOItemCategories.map(oItem => {
            if (oItem.key === "PROJFEE" && poHasTnMorProjFee === "TNM") oItem.isEnabled = false;
            else if (oItem.key === "TNM" && poHasTnMorProjFee === "PROJFEE") oItem.isEnabled = false;
            else oItem.isEnabled = true;
        });

        oModel.setProperty("/ddPOItemCategories", ddPOItemCategories);
    }

    public async onCurrencyChange(oEvent: Event) {
        this.fnComboBoxResetValueState(oEvent);

        sap.ui.getCore().getModel("mPageData").setProperty("/currExchangeRate", "");
        this.fetchCurrencyExchange();

        // Loop Into Po Table And Reset All Tax Checked Error Property
        const poHeaderTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poHeaderTable");

        for (let i = 0; i < poHeaderTable.length; i++) {
            this.fnResetSetValueStateErrorNoActPath(
                "/poHeaderTable/" + i + "/TaxChecked",
                false
            );
        }
    }

    public async fetchCurrencyExchange() {
        this.fnShowBusyDialog(true, "Fetching Currency Exchange");
        const selectedCurrency = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/currency");

        const createdDate = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/createdOn");

        let exchangedata = await this.transaction.getExecutedQuery(
            "q_exchange_rate",
            {
                loadAll: true,
                project_currency: selectedCurrency,
                project_created_date: createdDate,
                partialSelected: ["currency_rate"],
            }
        );
        if (exchangedata && exchangedata.length)
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty("/currExchangeRate", exchangedata[0].currency_rate);

        this.fnShowBusyDialog(false);
    }

    public onSelectTaxChecked(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        this.fnResetSetValueStateErrorNoActPath(sRowPath + "/TaxChecked", false);
    }

    public fnShowConfirmationDialog(message: String) {
        return new Promise<boolean>((resolve, reject) => {
            sap.m.MessageBox.confirm(message, {
                title: "Confirm",
                actions: ["I Agree", "Cancel"],
                emphasizedAction: "I Agree",
                onClose: (oAction) => {
                    if (oAction === "Cancel") {
                        resolve(false)
                    } else {
                        resolve(true);
                    }
                }
            });
        })
    }

    public async onSoLineItemSelectionChange1(oEvent: Event) {
        const oSource = oEvent.getSource();

        this.fnInputBoxResetValueStateUsingSource(oSource);

        //get curr selected item key
        const sRowPath = oSource.getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const ddSelectedItemCategoryKey = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");
        const ddSelectedItemCategoryKey_BACKUP = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory_BACKUP");
        const aLastLineItemTable = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTable");

        // check popup
        // restore backup if no
        if (aLastLineItemTable.length > 0) {
            if (!await this.fnShowConfirmationDialog("Milestone Table Will Be Deleted")) {
                oPageDataModel.setProperty(sRowPath + "/ddSelectedItemCategory", ddSelectedItemCategoryKey_BACKUP);
                return;
            }
        }

        // check for dropdown
        this.checkAndSetPoItemCategoryDropDown();

        // fetch Next Dependent DropDown
        const { ddInvoiceTypes, ddInvoiceCycle } = this.fnGetPoLineItemDropDownMapping(ddSelectedItemCategoryKey);

        oPageDataModel.setProperty(sRowPath + "/ddInvoiceTypes", ddInvoiceTypes);
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceType", "");
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceType_BACKUP", "");

        oPageDataModel.setProperty(sRowPath + "/ddInvoiceCycle", []);
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle", "");
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle_BACKUP", "");

        oPageDataModel.setProperty(sRowPath + "/BalanceAmount", "");
        oPageDataModel.setProperty(sRowPath + "/BalanceAmountEditable", true);

        oPageDataModel.setProperty(sRowPath + "/ddSelectedPOSubscription", []);
        this.fnResetSetValueStateErrorNoActPath(sRowPath + "/ddSelectedPOSubscription", false);

        if (ddSelectedItemCategoryKey === "API" || ddSelectedItemCategoryKey === "USRSUBSCR") {
            oPageDataModel.setProperty(sRowPath + "/unitSubscriptionEnabled", true);
            oPageDataModel.setProperty(sRowPath + "/MinimumBillingRateEnabled", true);
        } else {
            oPageDataModel.setProperty(sRowPath + "/unitSubscriptionEnabled", false);
            oPageDataModel.setProperty(sRowPath + "/MinimumBillingRateEnabled", false);
            oPageDataModel.setProperty(sRowPath + "/PerAPIPrice", "");
            oPageDataModel.setProperty(sRowPath + "/MinimumBillingRate", "");
        }

        // Check and rest unit
        const Unit = oPageDataModel.getProperty(sRowPath + "/Unit");
        if (ddSelectedItemCategoryKey === "API" && Unit !== "AU") {
            oPageDataModel.setProperty(sRowPath + "/Unit", "AU");
        }

        // Reset Last Line Table
        const lastLine = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTable");
        await this.deleteLastItemTblRowBackend(sRowPath); // Del all from backend
        oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", []);
        oPageDataModel.setProperty(sRowPath + "/aLastLineItemTableIdentity", "");

        // Calculate Budgeted PDs
        const aRowPathParent = sRowPath.match(/(\/poHeaderTable\/\d+)/);
        if (aRowPathParent) {
            this.fnAutoCalculateBudgetedPD(aRowPathParent[1]);
            this.fnReCalculateFunctionalAreaPDs();
            this.fnReCalculateProfitCenterPDs();
        }
    }

    public async onSoLineItemSelectionChange2(oEvent: Event) {
        const oSource = oEvent.getSource();

        this.fnInputBoxResetValueStateUsingSource(oSource);

        //get curr selected item key
        const sRowPath = oSource.getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const ddSelectedItemCategoryKey = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");
        const ddSelectedInvoiceTypeKey = oPageDataModel.getProperty(sRowPath + "/ddSelectedInvoiceType");
        const ddSelectedInvoiceType_BACKUP = oPageDataModel.getProperty(sRowPath + "/ddSelectedInvoiceType_BACKUP");
        const aLastLineItemTable = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTable");

        // check popup
        // restore backup if no
        if (aLastLineItemTable.length > 0) {
            if (!await this.fnShowConfirmationDialog("Milestone Table Will Be Deleted")) {
                oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceType", ddSelectedInvoiceType_BACKUP);
                return;
            }

        }

        // fetch Next Dependent DropDown
        const { ddInvoiceTypes, ddInvoiceCycle } = this.fnGetPoLineItemDropDownMapping(ddSelectedItemCategoryKey, ddSelectedInvoiceTypeKey);
        oPageDataModel.setProperty(sRowPath + "/ddInvoiceCycle", ddInvoiceCycle);
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle", "");
        oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle_BACKUP", "");

        if (ddInvoiceCycle.length === 1) {
            oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle", ddInvoiceCycle[0].key);
            oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle_BACKUP", ddInvoiceCycle[0].key);
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/ddSelectedInvoiceCycle", false);
            this.onSoLineItemSelectionChange3_BySource(oSource);
        } else {
            oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle", "");
            oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle_BACKUP", "");
        }

        oPageDataModel.setProperty(sRowPath + "/BalanceAmount", "");
        oPageDataModel.setProperty(sRowPath + "/BalanceAmountEditable", true);

        // Reset Last Line Table
        const lastLine = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTable");
        await this.deleteLastItemTblRowBackend(sRowPath);
        oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", []);
        oPageDataModel.setProperty(sRowPath + "/aLastLineItemTableIdentity", "");
    }

    public async onSoLineItemSelectionChange3(event: Event) {
        this.onSoLineItemSelectionChange3_BySource(event.getSource());
    }

    public async onSoLineItemSelectionChange3_BySource(oSource: any) {
        this.fnInputBoxResetValueStateUsingSource(oSource);

        //get curr selected item key
        const sRowPath = oSource.getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const ddSelectedItemCategoryKey = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");
        const ddSelectedInvoiceTypeKey = oPageDataModel.getProperty(sRowPath + "/ddSelectedInvoiceType");
        const ddSelectedInvoiceCycle = oPageDataModel.getProperty(sRowPath + "/ddSelectedInvoiceCycle");
        const ddSelectedInvoiceCycle_BACKUP = oPageDataModel.getProperty(sRowPath + "/ddSelectedInvoiceCycle_BACKUP");

        // Exclusive Code
        if (ddSelectedInvoiceTypeKey === "VOLUME" && ddSelectedInvoiceCycle === "ONACT") {
            oPageDataModel.setProperty(sRowPath + "/BalanceAmountEditable", false);
            this.fnCalculateBalanceAmount(sRowPath);
        }

        //Get Table Identifier Name
        const sNewTableIdentity = this.fnGetTableNameFromMapping(ddSelectedItemCategoryKey, ddSelectedInvoiceTypeKey, ddSelectedInvoiceCycle);
        const sOldTableIdentity = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTableIdentity");
        const aLastLineItemTable = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTable");

        if (sNewTableIdentity !== sOldTableIdentity) {
            // check popup
            // restore backup if no
            if (aLastLineItemTable.length > 0) {
                if (!await this.fnShowConfirmationDialog("Milestone Table Will Be Deleted")) {
                    oPageDataModel.setProperty(sRowPath + "/ddSelectedInvoiceCycle", ddSelectedInvoiceCycle_BACKUP);
                    return;
                }
            }

            // Delete Last Line Table // User Has to Click Plus Btton To New Table
            await this.deleteLastItemTblRowBackend(sRowPath);
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", []);
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTableIdentity", "");
        } else if (sNewTableIdentity === sOldTableIdentity && sNewTableIdentity === "TABLE_SCHEDULE_BASED") {
            // Assingn New Milestione Table // Month,Year,Quarter etc..
            const aLastLineItemTable = this.fnGetGeneratedScheduleBasedTable(sRowPath, oPageDataModel);
            if (aLastLineItemTable) {
                await this.deleteLastItemTblRowBackend(sRowPath);
                oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
            }
        } else if (sNewTableIdentity === sOldTableIdentity && sNewTableIdentity === "TABLE_VOLUME_BASED") {
            // Assingn New Milestione Table // Month,Year,Quarter etc..
            const aLastLineItemTable = this.fnGetGenerateVolumeTable(sRowPath, oPageDataModel);
            if (aLastLineItemTable) {
                await this.deleteLastItemTblRowBackend(sRowPath);
                oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
            }
        }
    }

    public fnCalculateBalanceAmount(path: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const GrossValue = oPageDataModel.getProperty(path + "/GrossValue");
        const aLastLineItemTable = oPageDataModel.getProperty(
            path + "/aLastLineItemTable"
        );

        let totalAmount = 0;
        aLastLineItemTable.forEach((element) => {
            totalAmount += Number(element.amount);
        });

        oPageDataModel.setProperty(
            path + "/BalanceAmount",
            GrossValue - totalAmount
        );
    }

    public async scheduleTableAmountReCalculate(sRowPath: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // Get Required Necessary Values From Line Item_2
        const { Quantity, Rate, GrossValue, EndDate, ddSelectedInvoiceCycle, ddSelectedItemCategory, aLastLineItemTable, Quantity_BACKUP, Rate_BACKUP, GrossValue_BACKUP, EndDate_BACKUP } = oPageDataModel.getProperty(sRowPath);

        // Find The Last Row Of Milestone Table whose [Invoice / Payment] has been done.
        // Subtract PAID Milestone Amount From Input-Gross & Find New Gross.
        let lastInvoicedIndex = -1;
        let scheduleTotalGrossValue = GrossValue;

        for (let i = 0; i < aLastLineItemTable.length; i++) {
            const oMilestoneTableRow = aLastLineItemTable[i];
            if (oMilestoneTableRow['invoiceStatus'] === 'Invoiced' || oMilestoneTableRow['invoiceStatus'] === 'Paid') {
                lastInvoicedIndex = i;
                scheduleTotalGrossValue -= oMilestoneTableRow['amount'];
            }
        }

        // Split Table Into 
        // [1]->Invoiced 
        // [2]->Non-Invoiced
        const aInvoicedMilestoneTable = aLastLineItemTable.slice(0, lastInvoicedIndex + 1);
        const aNonInvoicedMilestoneTable = aLastLineItemTable.slice(lastInvoicedIndex + 1);

        let newDateForNonInvoiced = '';

        if (aInvoicedMilestoneTable.length > 0) {
            const dateIncrement = new Date(aInvoicedMilestoneTable[lastInvoicedIndex].endDate);
            dateIncrement.setDate(dateIncrement.getDate() + 1);

            newDateForNonInvoiced = this.fnConvertJsToUi5Date(dateIncrement);
        } else {
            newDateForNonInvoiced = aNonInvoicedMilestoneTable[0].startDate;
        }

        // Distribute Amount For New Non Invoiced Rows
        const aScheduleBasedAmountDistribution = this.fnGetScheduleBasedAmountDistribution(newDateForNonInvoiced, EndDate, ddSelectedInvoiceCycle, scheduleTotalGrossValue, ddSelectedItemCategory);

        // After Amount Distribution 
        // Create New Rows Of Schedule based table
        const aNewNonInvoiceMilestoneTable = [];

        aScheduleBasedAmountDistribution.forEach((el) => {
            const oldTableRowData = aNonInvoicedMilestoneTable.find(({ startDate, endDate }) => (startDate === el.startDate && endDate === el.endDate));

            aNewNonInvoiceMilestoneTable.push({
                isPoRowEditable: true,
                rowID: "",
                description: oldTableRowData ? oldTableRowData.description : el.description,
                startDate: el.startDate,
                endDate: el.endDate,
                amount: el.amount,
                billdate: el.milestoneDate,
                invoiceStatus: oldTableRowData ? oldTableRowData.invoiceStatus : 'Pending',
                invoice_date: "",
                invoice_number: "",
            });
        });

        // Merge New Rows Of Schedule Table To Invoiced Rows Of Table
        const aFinalMilestoneTable = aInvoicedMilestoneTable.concat(aNewNonInvoiceMilestoneTable);

        // Get Sum Of Amount From Final Milestone Table
        let totalMilestoneAmountSum = 0;
        aFinalMilestoneTable.forEach(({ amount }) => { totalMilestoneAmountSum += Number(amount) });

        if (((GrossValue) - Math.round(totalMilestoneAmountSum)) === 0) {
            // If Input Gross === Sum Of Milestone Amout 
            // -> Assign New Table
            await this.deleteLastItemTblRowBackend(sRowPath);

            aFinalMilestoneTable.map((obj) => obj.rowID = ''); // Clear the row Id Of All Old Data
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aFinalMilestoneTable);

            // Set Input Backup For Generated Table Parameter
            oPageDataModel.setProperty(sRowPath + '/Quantity_BACKUP', Quantity);
            oPageDataModel.setProperty(sRowPath + '/Rate_BACKUP', Rate);
            oPageDataModel.setProperty(sRowPath + '/GrossValue_BACKUP', GrossValue);
            oPageDataModel.setProperty(sRowPath + '/EndDate_BACKUP', EndDate);
        } else {
            // Else
            // -> Retore Old User Input Box From Backup
            oPageDataModel.setProperty(sRowPath + '/Quantity', Quantity_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/Rate', Rate_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/GrossValue', GrossValue_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/EndDate', EndDate_BACKUP);

            // -> Show Warning to user.
            if (aInvoicedMilestoneTable.length === aFinalMilestoneTable.length) {
                this.fnShowErrorPopup('There Are No Pending Invoice, Amount Distribution Is Not Possible');
            } else {
                this.fnShowErrorPopup('Balance Mismatched. Try Again');
            }
        }
    }

    public async fnVolumeTblRecalculateAmount(sRowPath: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // Get Required Necessary Values From Line Item_2
        const { StartDate, EndDate, Quantity, Rate, GrossValue, ddSelectedInvoiceCycle, ddSelectedItemCategory, MinimumBillingRate, aLastLineItemTable, Quantity_BACKUP, Rate_BACKUP, GrossValue_BACKUP, EndDate_BACKUP } = oPageDataModel.getProperty(sRowPath);

        // Find The Last Row Of Milestone Table whose [Invoice / Payment] has been done.
        // Subtract PAID Milestone Amount From Input-Gross & Find New Gross.
        let lastInvoicedIndex = -1;
        let scheduleTotalGrossValue = GrossValue;

        for (let i = 0; i < aLastLineItemTable.length; i++) {
            const oMilestoneTableRow = aLastLineItemTable[i];
            if (oMilestoneTableRow['invoiceStatus'] === 'Invoiced' || oMilestoneTableRow['invoiceStatus'] === 'Paid') {
                lastInvoicedIndex = i;
                scheduleTotalGrossValue -= oMilestoneTableRow['amount'];
            }
        }

        // Split Table Into 
        // [1]->Invoiced
        // [2]->Non-Invoiced
        const aInvoicedMilestoneTable = aLastLineItemTable.slice(0, lastInvoicedIndex + 1);
        const aNonInvoicedMilestoneTable = aLastLineItemTable.slice(lastInvoicedIndex + 1);

        let newDateForNonInvoiced = '';

        if (aInvoicedMilestoneTable.length > 0) {
            const dateIncrement = new Date(aInvoicedMilestoneTable[lastInvoicedIndex].endDate);
            dateIncrement.setDate(dateIncrement.getDate() + 1);

            newDateForNonInvoiced = this.fnConvertJsToUi5Date(dateIncrement);
        } else {
            newDateForNonInvoiced = aNonInvoicedMilestoneTable[0].startDate;
        }

        // Distribute Amount For New Non Invoiced Rows
        const aVolumeBasedAmountDistribution = this.fnGetVolumeBasedAmountDistribution(newDateForNonInvoiced, EndDate, ddSelectedInvoiceCycle, scheduleTotalGrossValue, Quantity, ddSelectedItemCategory, MinimumBillingRate);

        // After Amount Distribution 
        // Create New Rows Of Schedule based table
        const aNewNonInvoiceMilestoneTable = [];

        aVolumeBasedAmountDistribution.forEach((el) => {
            const oldTableRowData = aNonInvoicedMilestoneTable.find(({ startDate, endDate }) => (startDate === el.startDate && endDate === el.endDate));

            aNewNonInvoiceMilestoneTable.push({
                isPoRowEditable: true,
                rowID: "",
                description: oldTableRowData ? oldTableRowData.description : el.description,
                Quantity: Number(el.Quantity).toFixed(2),
                amount: el.amount,
                startDate: el.startDate,
                endDate: el.endDate,
                milestoneDate: el.milestoneDate,
                invoiceStatus: oldTableRowData ? oldTableRowData.invoiceStatus : 'Pending',
                invoice_date: "",
                invoice_number: "",
                remark: ""
            });
        });

        // Merge New Rows Of Schedule Table To Invoiced Rows Of Table
        const aFinalMilestoneTable = aInvoicedMilestoneTable.concat(aNewNonInvoiceMilestoneTable);

        // Get Sum Of Amount From Final Milestone Table
        let totalMilestoneAmountSum = 0;
        aFinalMilestoneTable.forEach(({ amount }) => { totalMilestoneAmountSum += Number(amount) });

        if (((GrossValue) - Math.round(totalMilestoneAmountSum)) === 0) {
            // If Input Gross === Sum Of Milestone Amout 
            // -> Assign New Table
            await this.deleteLastItemTblRowBackend(sRowPath);

            aFinalMilestoneTable.map((obj) => obj.rowID = ''); // Clear the row Id Of All Old Data
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aFinalMilestoneTable);

            // Set Input Backup For Generated Table Parameter
            oPageDataModel.setProperty(sRowPath + '/Quantity_BACKUP', Quantity);
            oPageDataModel.setProperty(sRowPath + '/Rate_BACKUP', Rate);
            oPageDataModel.setProperty(sRowPath + '/GrossValue_BACKUP', GrossValue);
            oPageDataModel.setProperty(sRowPath + '/EndDate_BACKUP', EndDate);
        } else {
            // Else
            // -> Retore Old User Input Box From Backup
            oPageDataModel.setProperty(sRowPath + '/Quantity', Quantity_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/Rate', Rate_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/GrossValue', GrossValue_BACKUP);
            oPageDataModel.setProperty(sRowPath + '/EndDate', EndDate_BACKUP);

            // -> Show Warning to user.
            if (aInvoicedMilestoneTable.length === aFinalMilestoneTable.length) {
                this.fnShowErrorPopup('There Are No Pending Invoice, Amount Distribution Is Not Possible');
            } else {
                this.fnShowErrorPopup('Balance Mismatched. Try Again');
            }
        }
    }

    public async onQtyRateChange(event: Event) {
        const sRowPath = event.getSource().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // Set Gross
        const Quantity = oPageDataModel.getProperty(sRowPath + "/Quantity");
        const Rate = oPageDataModel.getProperty(sRowPath + "/Rate");
        oPageDataModel.setProperty(sRowPath + "/GrossValue", Quantity * Rate);

        // : Exclusive Code : Calculate Balance Amount
        if (oPageDataModel.getProperty(sRowPath + "/BalanceAmountEditable") === false) {
            this.fnCalculateBalanceAmount(sRowPath);
        }

        const aLastLineItemTableIdentity = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTableIdentity");
        // If Table is Already Schedule Based -- ReCalculate Amount
        if (aLastLineItemTableIdentity === "TABLE_SCHEDULE_BASED") {
            this.scheduleTableAmountReCalculate(sRowPath);
        }

        // If Table is Already Milestone Based -- Recalculate % Amount
        if (aLastLineItemTableIdentity === "TABLE_MILESTONE_BASED") {
            this.fnMilestoneTblRecalculateAmount(sRowPath);
        }

        // If Table is Already Milestone Based & Not AMC -- Recalculate Qty Amount
        const ddSelectedItemCategory = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");
        if (aLastLineItemTableIdentity === "TABLE_VOLUME_BASED" && ddSelectedItemCategory !== "AMC") {
            this.fnVolumeTblRecalculateAmount(sRowPath);
        }

        // Calculate Budgeted PDs
        const aRowPathParent = sRowPath.match(/(\/poHeaderTable\/\d+)/);
        if (aRowPathParent) {
            this.fnAutoCalculateBudgetedPD(aRowPathParent[1]);
            this.fnReCalculateFunctionalAreaPDs();
            this.fnReCalculateProfitCenterPDs();
        }
    }

    /**
     * enableDisbaleEndDateFieldLineItem
     */
    public enableDisbaleEndDateFieldLineItem(sPoLineItRowPath: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const aScheduleBasedTable = oPageDataModel.getProperty(sPoLineItRowPath + "/aLastLineItemTable");
        const aMilestoneInvoice = aScheduleBasedTable.find(({ invoiceStatus }) => (invoiceStatus === 'Paid' || invoiceStatus === 'Invoiced'));

        if (aMilestoneInvoice) {
            oPageDataModel.setProperty(sPoLineItRowPath + "/isStartDateEditable", false);
        } else {
            oPageDataModel.setProperty(sPoLineItRowPath + "/isStartDateEditable", true);
        }
    }

    public onScheduleInvChange(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();

        // Get Path Of Parent Line Item Row.
        const regex = /\/poHeaderTable\/\d+\/aPoLineItemTable\/\d+/;
        const match = sRowPath.match(regex);
        if (match) {
            const sParentTableRowPath = match[0];
            this.enableDisbaleEndDateFieldLineItem(sParentTableRowPath);
        }
    }

    public fnMilestoneTblRecalculateAmount(aRowPath: string) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const Quantity = oPageDataModel.getProperty(aRowPath + "/Quantity");
        const Rate = oPageDataModel.getProperty(aRowPath + "/Rate");

        const grossParent = Number(Quantity) * Number(Rate);
        const aLastLineItemTable = oPageDataModel.getProperty(aRowPath + "/aLastLineItemTable");

        for (let index = 0; index < aLastLineItemTable.length; index++) {
            aLastLineItemTable[index].amount = ((grossParent * Number(aLastLineItemTable[index].percentage)) / 100).toFixed(2);
        }

        oPageDataModel.setProperty(aRowPath + "/aLastLineItemTable", aLastLineItemTable);
    }

    public onMileStoneTablePercentChange(oEvent: Event, isAmountInput = false) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // If User Input Percentage
        // Set Percentage = input Percent = display Percent
        const inputPercentage = oPageDataModel.getProperty(sRowPath + "/percentageDisplay");
        if (!isAmountInput) { oPageDataModel.setProperty(sRowPath + "/percentage", inputPercentage); }

        const sPathLineItemTbl = sRowPath.replace(/\/[^\/]+\/[^\/]+$/, "");
        const aLastLineItemTable = oPageDataModel.getProperty(sPathLineItemTbl + "/aLastLineItemTable");

        // Validate Total <= 100 % 
        let TotalPercent = 0;
        aLastLineItemTable.forEach((element) => { TotalPercent += Number(element.percentage); });

        if (TotalPercent > 100) {
            const currPercentage = oPageDataModel.getProperty(sRowPath + "/percentage");
            const remainingPercentage = (100 - (TotalPercent - currPercentage)).toFixed(2)
            oPageDataModel.setProperty(sRowPath + "/percentage", "");
            oPageDataModel.setProperty(sRowPath + "/percentageDisplay", "");
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/percentage", true, "Please Enter Value Less Than " + (100 - (TotalPercent - currPercentage)).toFixed(2) + "%");
            oPageDataModel.setProperty(sRowPath + "/amount", "");
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/amount", true, "Please Enter Amount Which Should Less Than " + (100 - (TotalPercent - currPercentage)).toFixed(2) + "%");
            return;
        } else {
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/percentage", false);
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/amount", false);
        }

        // If User Input Percentage -> Find Amount
        if (!isAmountInput) {
            //this.fnMilestoneTblRecalculateAmount(sPathLineItemTbl);
            const Quantity = oPageDataModel.getProperty(sPathLineItemTbl + "/Quantity");
            const Rate = oPageDataModel.getProperty(sPathLineItemTbl + "/Rate");
            const grossParent = Number(Quantity) * Number(Rate);

            const newAmount = ((grossParent * Number(inputPercentage)) / 100).toFixed(2);
            oPageDataModel.setProperty(sRowPath + "/amount", newAmount);
        }
    }

    public onMileStoneTableAmountChange(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();

        const sPathLineItemTbl = sRowPath.replace(/\/[^\/]+\/[^\/]+$/, "");
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        const amount = oEvent.getSource().getValue();

        // Find And Set Percentage
        const Quantity = oPageDataModel.getProperty(sPathLineItemTbl + "/Quantity");
        const Rate = oPageDataModel.getProperty(sPathLineItemTbl + "/Rate");
        const grossParent = Number(Quantity) * Number(Rate);
        const percentage = (Number(amount) * 100) / grossParent;
        let storePercentage = '';

        const percentagePart = percentage.toString().split('.');
        if (percentagePart.length === 2 && percentagePart[1].length > 12) {
            storePercentage = parseFloat(percentage.toFixed(12)).toString();
        } else {
            storePercentage = (percentage).toString();
        }

        oPageDataModel.setProperty(sRowPath + "/percentage", storePercentage);
        oPageDataModel.setProperty(sRowPath + "/percentageDisplay", percentage.toFixed(2));

        // Validate New Assigned Percentage
        this.onMileStoneTablePercentChange(oEvent, true);
    }

    public async onStartDateChangeTableLItem_2(oEvent: Event) {
        this.fnDateInputResetValueState(oEvent);

        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");

        // If Table is Already Schedule Based -- ReGenerate Table
        const aLastLineItemTableIdentity = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTableIdentity");
        if (aLastLineItemTableIdentity === "TABLE_SCHEDULE_BASED") {
            await this.deleteLastItemTblRowBackend(sRowPath); // Delete all from backend
            const aLastLineItemTable = this.fnGetGeneratedScheduleBasedTable(sRowPath, oPageDataModel);
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
        }

        // If Table is Already Volume Based && Not AMC -- ReGenerate Table
        const ddSelectedItemCategory = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");
        if (aLastLineItemTableIdentity === "TABLE_VOLUME_BASED" && ddSelectedItemCategory !== "AMC") {
            await this.deleteLastItemTblRowBackend(sRowPath); // Delete all from backend
            const aLastLineItemTable = this.fnGetGenerateVolumeTable(sRowPath, oPageDataModel);
            oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
        }
    }

    public fnFindAndAssignLastDate() {
        const oModel = sap.ui.getCore().getModel("mPageData");
        const poHeaderTable = oModel.getProperty("/poHeaderTable");
        const allDates = [];

        for (let i = 0; i < poHeaderTable.length; i++) {
            const sPathL_1 = "/poHeaderTable/" + i;

            const aPoLineItemTable = oModel.getProperty(sPathL_1 + "/aPoLineItemTable");
            for (let j = 0; j < aPoLineItemTable.length; j++) {
                allDates.push((new Date(aPoLineItemTable[j].EndDate)));
            }
        }

        allDates.sort((a, b) => a - b); // Ascending order

        if (allDates.length > 0) {
            const lastDate = allDates[allDates.length - 1];
            oModel.setProperty("/project_end_date", this.fnConvertJsToUi5Date(lastDate));
            this.fnEstimateProjDate(null, 'END_DATE')
        }
    }

    public async onEndDateChangeTableLItem_2(oEvent: Event) {
        this.fnDateInputResetValueState(oEvent);

        // Loop And Find Last Data
        this.fnFindAndAssignLastDate();

        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();

        const aLastLineItemTableIdentity = oPageDataModel.getProperty(sRowPath + "/aLastLineItemTableIdentity");

        // If Table is Already Volume Based 
        if (aLastLineItemTableIdentity === "TABLE_VOLUME_BASED") {
            const { EndDate, aLastLineItemTable } = oPageDataModel.getProperty(sRowPath);

            if (aLastLineItemTable.length === 0) {
                const aLastLineItemTable = this.fnGetGenerateVolumeTable(sRowPath, oPageDataModel);
                oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
                return;
            }

            // Find Index Of Last Row For Invoiced/Paid Milestone
            let lastInvoicedIndex = -1;

            for (let i = 0; i < aLastLineItemTable.length; i++) {
                const oMilestoneTableRow = aLastLineItemTable[i];
                if (oMilestoneTableRow['invoiceStatus'] === 'Invoiced' || oMilestoneTableRow['invoiceStatus'] === 'Paid') {
                    lastInvoicedIndex = i;
                }
            }

            // If User-Input-Date is lesser than Paid-Milestone-Date 
            // Reset Input Date From Backup -> Show Warning -> Stop Execution
            if (lastInvoicedIndex >= 0 && (new Date(EndDate) < new Date(aLastLineItemTable[lastInvoicedIndex].endDate))) {
                // Set Backup Date.
                const EndDate_BACKUP = oPageDataModel.getProperty(sRowPath + "/EndDate_BACKUP");
                oPageDataModel.setProperty(sRowPath + "/EndDate", EndDate_BACKUP);
                this.fnShowErrorPopup('You Can Not Enter Date For Which Invoice Has been Already Done.');
                return;
            }

            // After Validation : Re Create Schedule Based Table
            this.fnVolumeTblRecalculateAmount(sRowPath);
        }

        // If Table is Already Schedule Based 
        if (aLastLineItemTableIdentity === "TABLE_SCHEDULE_BASED") {
            const { EndDate, aLastLineItemTable } = oPageDataModel.getProperty(sRowPath);

            if (aLastLineItemTable.length === 0) {
                const aLastLineItemTable = this.fnGetGeneratedScheduleBasedTable(sRowPath, oPageDataModel);
                oPageDataModel.setProperty(sRowPath + "/aLastLineItemTable", aLastLineItemTable);
                return;
            }

            // Find Index Of Last Row For Invoiced/Paid Milestone
            let lastInvoicedIndex = -1;

            for (let i = 0; i < aLastLineItemTable.length; i++) {
                const oMilestoneTableRow = aLastLineItemTable[i];
                if (oMilestoneTableRow['invoiceStatus'] === 'Invoiced' || oMilestoneTableRow['invoiceStatus'] === 'Paid') {
                    lastInvoicedIndex = i;
                }
            }

            // If User-Input-Date is lesser than Paid-Milestone-Date 
            // Reset Input Date From Backup -> Show Warning -> Stop Execution
            if (lastInvoicedIndex >= 0 && (new Date(EndDate) < new Date(aLastLineItemTable[lastInvoicedIndex].endDate))) {
                // Set Backup Date.
                const EndDate_BACKUP = oPageDataModel.getProperty(sRowPath + "/EndDate_BACKUP");
                oPageDataModel.setProperty(sRowPath + "/EndDate", EndDate_BACKUP);
                this.fnShowErrorPopup('You Can Not Enter Date For Which Invoice Has been Already Done.');
                return;
            }

            // After Validation : Re Create Schedule Based Table
            this.scheduleTableAmountReCalculate(sRowPath);
        }
    }

    public onVolTableAmountChange(event: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sRowPath = event.getSource().getParent().getBindingContextPath();

        const regex = /\/poHeaderTable\/\d+\/aPoLineItemTable\/\d+/;
        const match = sRowPath.match(regex);
        if (match) {
            const sParentTableRowPath = match[0]; // Get Path of parent table Row Model
            if (
                oPageDataModel.getProperty(
                    sParentTableRowPath + "/BalanceAmountEditable"
                ) === false
            ) {
                this.fnCalculateBalanceAmount(sParentTableRowPath);
            }
        }
    }

    public getMonthNamesBetweenDates(startDate: any, endDate: any) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const options = { year: "numeric", month: "long" };
        const startFormatted = start.toLocaleDateString("en-US", options);
        const endFormatted = end.toLocaleDateString("en-US", options);

        if (startFormatted === endFormatted) {
            return startFormatted;
        } else {
            return `${startFormatted} - ${endFormatted}`;
        }
    }

    public fnGetScheduleBasedAmountDistribution(StartDate: string, EndDate: string, scheduleType: string, grossAmount: number, itemCategory: string) {
        let monthLimitInSlot = 0;

        switch (scheduleType) {
            case "MONTHLY":
                monthLimitInSlot = 1;
                break;
            case "QUTRLY":
                monthLimitInSlot = 3;
                break;
            case "HALFYEARLY":
                monthLimitInSlot = 6;
                break;
            case "YEARLY":
                monthLimitInSlot = 12;
                break;
        }

        if (monthLimitInSlot === 0) return [];

        // Find Total Days B.W Start-End Dates
        const totalDays = (new Date(EndDate).getTime() - new Date(StartDate).getTime()) / (1000 * 60 * 60 * 24) + 1;

        // Find Amount Per Day
        const amountPerDay = grossAmount / totalDays;

        // Calculate Slots B.W Start-End dates using date Pointer
        const datePointer = new Date(StartDate);
        const slotStartAndEndDateList = [];

        // Assume First Slot has all days eg. Monthly Has (30,31,28,29) Days , Quratly has (4 months) etc..
        let isSlotHasCompleteDays = true;

        let remainingDays = totalDays;

        while (remainingDays > 0) {
            let countMonthInCurrentSlot = 0;
            let countDaysInCurrentSlot = 0;

            const slotStartDate = new Date(datePointer); //  DatePointer is Movable
            let slotEndDate = null; // Each loop will find end date
            let isLastMonthHasIncompleteDays = false; // Assume Slots has compete months

            while (++countMonthInCurrentSlot <= monthLimitInSlot && remainingDays > 0) {
                let totalDaysInCurrMonth = new Date(datePointer.getFullYear(), datePointer.getMonth() + 1, 0).getDate();

                if (totalDaysInCurrMonth <= remainingDays) {
                    // PrevMonth + DaysInCurrMonth
                    datePointer.setDate(datePointer.getDate() + totalDaysInCurrMonth);
                    countDaysInCurrentSlot = countDaysInCurrentSlot + totalDaysInCurrMonth;

                    // Remaining Days
                    remainingDays -= totalDaysInCurrMonth;

                    // Slot End date Assign = (DatePointer - 1)
                    if (countMonthInCurrentSlot === monthLimitInSlot || remainingDays === 0) {
                        slotEndDate = new Date(datePointer);
                        slotEndDate.setDate(slotEndDate.getDate() - 1);
                    }
                } else {
                    // PrevMonth + RemainingDaysInLAST_MONTH
                    datePointer.setDate(datePointer.getDate() + remainingDays);
                    countDaysInCurrentSlot = countDaysInCurrentSlot + remainingDays;

                    // Remaining Days
                    remainingDays = 0;

                    // Slot End date Assign = (DatePointer - 1)
                    slotEndDate = new Date(datePointer);
                    slotEndDate.setDate(slotEndDate.getDate() - 1);

                    // [FLAG] Last Month is not having complete days
                    isLastMonthHasIncompleteDays = true;
                }
            }

            if (remainingDays == 0 && (isLastMonthHasIncompleteDays || countMonthInCurrentSlot - 1 !== monthLimitInSlot)) {
                isSlotHasCompleteDays = false;
            }

            slotStartAndEndDateList.push({
                description: this.getMonthNamesBetweenDates(slotStartDate, slotEndDate),
                startDate: this.fnConvertJsToUi5Date(slotStartDate),
                endDate: this.fnConvertJsToUi5Date(slotEndDate),
                daysCount: countDaysInCurrentSlot,
                isSlotHasCompleteDays,
                amount: (countDaysInCurrentSlot * amountPerDay).toFixed(2),
                milestoneDate: this.fnConvertJsToUi5Date(slotEndDate),
            });
        }

        // :: Exclusive Code :: If Invoice type selection is AMC 
        // :: Edit 2 - true for all
        if (itemCategory === "AMC" || true) {
            const totalSlots = slotStartAndEndDateList.length;
            const amountPerSlots = (grossAmount / totalSlots).toFixed(2);
            slotStartAndEndDateList.forEach((el) => (
                el.amount = amountPerSlots,
                el.description = el.isSlotHasCompleteDays ? el.description : 'Incomplete Days'
            ));
        }

        return slotStartAndEndDateList;
    }

    public fnGetVolumeBasedAmountDistribution(StartDate: string, EndDate: string, scheduleType: string, grossAmount: number, Quantity: number, itemCategory: string, minMonthRate: number) {
        let monthLimitInSlot = 1;

        switch (scheduleType) {
            case "MONTHLY":
                monthLimitInSlot = 1;
                break;
            case "QUTRLY":
                monthLimitInSlot = 3;
                break;
            case "HALFYEARLY":
                monthLimitInSlot = 6;
                break;
            case "YEARLY":
                monthLimitInSlot = 12;
                break;
        }

        const dateDistributionSlot = [];
        const dtStartDate = new Date(StartDate);
        const dtEndDate = new Date(EndDate);
        let dateStartPointer = new Date(StartDate);
        let dateEndPointer = new Date(dtStartDate.getFullYear(), dtStartDate.getMonth() + monthLimitInSlot, 0);

        // Loop
        while (dateEndPointer < dtEndDate) {
            dateDistributionSlot.push({
                description: this.getMonthNamesBetweenDates(dateStartPointer, dateEndPointer),
                startDate: this.fnConvertJsToUi5Date(dateStartPointer),
                endDate: this.fnConvertJsToUi5Date(dateEndPointer),
                milestoneDate: this.fnConvertJsToUi5Date(dateEndPointer),
                amount: 0,
                Quantity: 0,
            });

            dateStartPointer = new Date(dateEndPointer); dateStartPointer.setDate(dateStartPointer.getDate() + 1);
            dateEndPointer = new Date(dateEndPointer.getFullYear(), dateEndPointer.getMonth() + monthLimitInSlot + 1, 0);
        }

        dateDistributionSlot.push({
            description: this.getMonthNamesBetweenDates(dateStartPointer, dtEndDate),
            startDate: this.fnConvertJsToUi5Date(dateStartPointer),
            endDate: this.fnConvertJsToUi5Date(dtEndDate),
            milestoneDate: this.fnConvertJsToUi5Date(dtEndDate),
            amount: 0,
            Quantity: 0,
        });

        const totalSlots = dateDistributionSlot.length;
        let amountPerSlots = Number((grossAmount / totalSlots).toFixed(2));
        let remainingAmount = grossAmount;

        if (minMonthRate > 0 && amountPerSlots < minMonthRate) {
            amountPerSlots = Number(minMonthRate);
        }

        const qtyPerAmount = Quantity / grossAmount;

        for (let i = 0; i < totalSlots; i++) {
            if (remainingAmount > amountPerSlots) {
                dateDistributionSlot[i].amount = amountPerSlots;
                dateDistributionSlot[i].Quantity = amountPerSlots * (qtyPerAmount);
                remainingAmount -= amountPerSlots;
            } else {
                dateDistributionSlot[i].amount = remainingAmount;
                dateDistributionSlot[i].Quantity = amountPerSlots * (qtyPerAmount);
                remainingAmount = 0;
                break;
            }
        }

        if (remainingAmount > 1) {
            dateDistributionSlot[totalSlots - 1].amount = remainingAmount;
        }

        return dateDistributionSlot;
    }

    public isInvalidInputBoxEntry(
        sPath: string,
        inputType: string,
        isRequired: boolean,
        oModel: any = null
    ) {
        const VAL_TYPES = this.VALID_TYPES;
        let inputValue: any;
        if (oModel) {
            inputValue = oModel.getProperty(sPath);
        } else {
            inputValue = sap.ui.getCore().getModel("mPageData").getProperty(sPath);
        }

        let isInputValidFlag = true;
        let sErrMessage = "";

        if (
            isRequired &&
            (inputValue === undefined || inputValue === null || inputValue === "")
        ) {
            isInputValidFlag = false;
            sErrMessage = "This Field Should Not Be Empty";
        }
        if (
            !(inputValue === undefined || inputValue === null || inputValue === "")
        ) {
            if (inputType === VAL_TYPES.NUM) {
                if (isNaN(inputValue)) {
                    sErrMessage = "Input Is Not A Valid Number";
                    isInputValidFlag = false;
                }
            } else if (inputType === VAL_TYPES.EMAIL) {
                if (!/\S+@\S+\.\S+/.test(inputValue)) {
                    sErrMessage = "Input Is Not A Valid Email";
                    isInputValidFlag = false;
                }
            } else if (inputType === VAL_TYPES.LINKEDIN) {
                if (
                    !/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9_-]+\/?$/.test(
                        inputValue
                    )
                ) {
                    sErrMessage = "Example : https://www.linkedin.com/in/username/";
                    isInputValidFlag = false;
                }
            }
        }

        // This Is Valid
        if (isInputValidFlag) {
            return false;
        }
        // Is Is Not Valid
        else {
            this.fnResetSetValueStateErrorNoActPath(
                sPath,
                true,
                sErrMessage,
                oModel ? oModel : null
            );
            return true;
        }
    }

    public fnValidateDataBeforeSubmit() {
        const VAL_TYPES = this.VALID_TYPES;
        const oModel = sap.ui.getCore().getModel("mPageData");
        const orderTypeSelected = sap.ui.getCore().getModel("mPageData").getProperty("/orderTypeSelected");

        let totalInvalidInputCount = 0;
        let aErrorMessages = [];

        const countInvalidInput = (
            sPath: string,
            inputType: string,
            isRequired: boolean
        ) => {
            if (this.isInvalidInputBoxEntry(sPath, inputType, isRequired)) {
                totalInvalidInputCount++;
            }
        };

        let aValidInputs = [];

        // * Header Details
        aValidInputs = [
            this.isInvalidInputBoxEntry("/businessAreaSelected", VAL_TYPES.ANY, true),
        ];

        if (aValidInputs.find((error) => error)) {
            // if error === true
            aErrorMessages.push(
                "Header details has some issue. Actual error can be seen at field. Please correct and retry."
            );
            totalInvalidInputCount++;
        }

        // * Project Details
        aValidInputs = [
            this.isInvalidInputBoxEntry("/project_name", VAL_TYPES.ANY, true),
            this.isInvalidInputBoxEntry("/office_calendar", VAL_TYPES.ANY, true),
            this.isInvalidInputBoxEntry("/durationInWeeks", VAL_TYPES.ANY, true),
            this.isInvalidInputBoxEntry("/project_start_date", VAL_TYPES.ANY, true),
            this.isInvalidInputBoxEntry("/project_end_date", VAL_TYPES.ANY, true),
            this.isInvalidInputBoxEntry("/productType", VAL_TYPES.ANY, false),
        ];

        if (aValidInputs.find((error) => error)) {
            // if error === true
            aErrorMessages.push(
                "Project details has some issue. Actual error can be seen at field. Please correct and retry."
            );
            totalInvalidInputCount++;
        }

        // * Customer Details
        if (orderTypeSelected === "SO" || orderTypeSelected === "PS") {
            aValidInputs = [
                this.isInvalidInputBoxEntry("/bill_to_customer", VAL_TYPES.ANY, true),
                this.isInvalidInputBoxEntry("/bill_to_address", VAL_TYPES.ANY, true),
                this.isInvalidInputBoxEntry("/currency", VAL_TYPES.ANY, true),
                this.isInvalidInputBoxEntry("/parent_po", VAL_TYPES.ANY, false),
                this.isInvalidInputBoxEntry("/external_number", VAL_TYPES.ANY, false),
            ];

            if (aValidInputs.find((error) => error)) {
                // if error === true
                aErrorMessages.push(
                    "Customer details has some issue. Actual error can be seen at field. Please correct and retry."
                );
                totalInvalidInputCount++;
            }

            // * Customer Details / Contact Information
            const customerContactTable = oModel.getProperty("/customerContactTable");

            // Check If Any Contact is Billing Responsible
            let itHasUncheckedBillingRes = false;
            if (customerContactTable.length <= 0 || (
                customerContactTable.length > 0 &&
                !customerContactTable.find((oContact) => oContact.billingResponsible))
            ) {
                itHasUncheckedBillingRes = true;
                aErrorMessages.push(
                    "AtLest on billing responsible check should be there in customer contact tab."
                );
                totalInvalidInputCount++;
            }

            // Check Contact Input Fields Are Ok
            for (let index = 0; index < customerContactTable.length; index++) {
                const sRowPath = "/customerContactTable/" + index;

                const { contact_name, contact_id } = oModel.getProperty(sRowPath);
                // Skip If Legacy Portal Contact Or New
                if (contact_name !== "" && contact_id === null) {
                    aValidInputs = [
                        this.isInvalidInputBoxEntry(
                            sRowPath + "/contact_role",
                            VAL_TYPES.ANY,
                            true
                        ),
                    ];
                } else {
                    aValidInputs = [
                        this.isInvalidInputBoxEntry(
                            sRowPath + "/contact_id",
                            VAL_TYPES.ANY,
                            true
                        ),
                        this.isInvalidInputBoxEntry(
                            sRowPath + "/contact_role",
                            VAL_TYPES.ANY,
                            true
                        ),
                    ];
                }

                if (aValidInputs.find((error) => error)) {
                    // if error === true
                    aErrorMessages.push(
                        " Customer Contact has some issue. Actual error can be seen at field. Please correct and retry."
                    );
                    totalInvalidInputCount++;
                }

                if (itHasUncheckedBillingRes) {
                    this.fnResetSetValueStateErrorNoActPath(
                        sRowPath + "/billingResponsible",
                        true,
                        ""
                    );
                }
            }

            // * Sales Team
            aValidInputs = [
                this.isInvalidInputBoxEntry("/preSalesBySelected", VAL_TYPES.ANY, true),
                this.isInvalidInputBoxEntry(
                    "/salesResponsibleSelected",
                    VAL_TYPES.ANY,
                    true
                ),
            ];

            if (aValidInputs.find((error) => error)) {
                // if error === true
                aErrorMessages.push(
                    "Sales Team has some issue. Actual error can be seen at field. Please correct and retry."
                );
                totalInvalidInputCount++;
            }

            // * Onsite Rules
            if (oModel.getProperty("/onSiteRadioButton/yes")) {
                aValidInputs = [
                    this.isInvalidInputBoxEntry("/reimbursement_rules", VAL_TYPES.ANY, true),
                    this.isInvalidInputBoxEntry("/reimbursement_remark", VAL_TYPES.TEXT, true)
                ];

                if (aValidInputs.find((error) => error)) {
                    // if error === true
                    aErrorMessages.push(
                        "Onsite rules has some issue. Actual error can be seen at field. Please correct and retry."
                    );
                    totalInvalidInputCount++;
                }

                const tableTravel = oModel.getProperty("/tableTravel");

                if (tableTravel.length <= 0) {
                    this.fnShowWarnPopup("Travel Table is empty");
                }

                const loginUserRole = sap.ui.getCore().getModel("mPageData").getProperty("/loginUserRole");
                const reimbursement_rules = sap.ui.getCore().getModel("mPageData").getProperty("/reimbursement_rules");
                for (let i = 0; i < tableTravel.length; i++) {
                    const sRowPath = "/tableTravel/" + i;

                    const aErrorsInTravelTable = [
                        this.isInvalidInputBoxEntry(sRowPath + "/travelTypeSelected", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sRowPath + "/toCitySelected", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sRowPath + "/applicableReimburse", VAL_TYPES.ANY, true)
                    ];


                    let hasInvalidEntry = false;

                    this.fnResetSetValueStateErrorNoActPath(sRowPath + "/applicableReimburse", false);
                    if (reimbursement_rules !== "CIP") {
                        if (Number(tableTravel[i].applicableReimburse) > Number(tableTravel[i].standardReimburse) && (loginUserRole !== "FINANCE" || !this.secondRole)) {
                            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/applicableReimburse", true, "Value Should be smaller than standard reimbursement");
                            hasInvalidEntry = true;
                        }
                    }

                    if (aErrorsInTravelTable.find((error) => error) || hasInvalidEntry) {
                        // if error === true
                        aErrorMessages.push(`Travel Table row no ${i + 1} has some issue. Actual error can be seen at field. Please correct and retry.`);
                        totalInvalidInputCount++;
                    }
                }
            }

            // --- [ PO Table Line Item - 1 ] ---
            const poHeaderTable = oModel.getProperty("/poHeaderTable");
            const orderTypeSelected = oModel.getProperty("/orderTypeSelected");
            for (let i = 0; i < poHeaderTable.length; i++) {
                const sPathL_1 = "/poHeaderTable/" + i;

                const isPoRowEditable = oModel.getProperty(sPathL_1 + "/isPoRowEditable");
                const isPoRowProvisionalEditable = oModel.getProperty(sPathL_1 + "/isPoRowProvisionalEditable");
                if (isPoRowEditable === false && isPoRowProvisionalEditable === false) { continue; }

                const DocType = oModel.getProperty(sPathL_1 + "/DocType");

                const aErrorsInPO_L1 = [
                    this.isInvalidInputBoxEntry(sPathL_1 + "/AttachCopyName", VAL_TYPES.ANY, false),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/ProposalCopyName", VAL_TYPES.ANY, false),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/PONumber", VAL_TYPES.TEXT, DocType !== "AM" && orderTypeSelected !== "PS"),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/CRNumber", VAL_TYPES.TEXT, false),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/PODate", VAL_TYPES.ANY, DocType !== "AM" && orderTypeSelected !== "PS"),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/GrossValue", VAL_TYPES.NUM, true),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/BudgetedPD", VAL_TYPES.NUM, true),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/projectPD", VAL_TYPES.NUM, true),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/CRRate", VAL_TYPES.NUM, true),
                    this.isInvalidInputBoxEntry(sPathL_1 + "/Remark", VAL_TYPES.TEXT, true),
                ];

                if (aErrorsInPO_L1.find((error) => error)) {
                    // if error === true
                    aErrorMessages.push(
                        `PO Details row no ${i + 1
                        } has some issue. Actual error can be seen at field. Please correct and retry.`
                    );
                    totalInvalidInputCount++;
                }

                // Tax Check if Indian Customer
                const currency = oModel.getProperty("/currency");
                const TaxChecked = oModel.getProperty(sPathL_1 + "/TaxChecked");

                if (currency === "INR" && !TaxChecked) {
                    this.fnResetSetValueStateErrorNoActPath(
                        sPathL_1 + "/TaxChecked",
                        true
                    );
                    aErrorMessages.push(
                        `Tax check is not confirmed in PO Details row no Row ${i + 1
                        }. Please check the tax in PO and confirm by cheking this.`
                    );
                    totalInvalidInputCount++;
                }

                const aPoLineItemTable = oModel.getProperty(
                    sPathL_1 + "/aPoLineItemTable"
                );
                if (aPoLineItemTable.length <= 0) {
                    aErrorMessages.push(
                        `PO Details row no ${i + 1
                        } should have at least one line item specified to nature of the PO like [Project Fee, AMC, Expense etc]`
                    );
                    totalInvalidInputCount++;
                }

                // --- [ PO Table Line Item - 2 ] ---
                let sumOfGrossLineItem1 = 0; // Sum Validation
                for (let j = 0; j < aPoLineItemTable.length; j++) {
                    const sPathL_2 = sPathL_1 + "/aPoLineItemTable/" + j;

                    const aErrorsInPO_L2 = [
                        this.isInvalidInputBoxEntry(sPathL_2 + "/ddSelectedItemCategory", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/Quantity", VAL_TYPES.NUM, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/Rate", VAL_TYPES.NUM, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/GrossValue", VAL_TYPES.NUM, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/ddSelectedInvoiceType", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/ddSelectedInvoiceCycle", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/StartDate", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/EndDate", VAL_TYPES.ANY, true),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/MinimumBillingRate", VAL_TYPES.NUM, false),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/PerAPIPrice", VAL_TYPES.NUM, false),
                        this.isInvalidInputBoxEntry(sPathL_2 + "/BalanceAmount", VAL_TYPES.NUM, false),
                    ];

                    let isPoSubscriptionSelected = true;
                    if (aPoLineItemTable[j].ddSelectedItemCategory === "API" || aPoLineItemTable[j].ddSelectedItemCategory === "AMC") {
                        if (aPoLineItemTable[j].ddSelectedPOSubscription.length <= 0) {
                            this.fnResetSetValueStateErrorNoActPath(sPathL_2 + "/ddSelectedPOSubscription", true);
                            isPoSubscriptionSelected = false;
                        }
                    }

                    if (aErrorsInPO_L2.find((error) => error) || !isPoSubscriptionSelected) {
                        // if error === true
                        aErrorMessages.push(
                            `PO Details row no ${i + 1}, item No ${j + 1
                            } has some issue. Actual error can be seen at field. Please correct and retry.`
                        );
                        totalInvalidInputCount++;
                    }

                    sumOfGrossLineItem1 += Number(aPoLineItemTable[j].GrossValue);
                    const aLastLineItemTableIdentity = oModel.getProperty(
                        sPathL_2 + "/aLastLineItemTableIdentity"
                    );

                    const ddSelectedItemCategory = oModel.getProperty(
                        sPathL_2 + "/ddSelectedItemCategory"
                    );
                    const aLastLineItemTable = oModel.getProperty(
                        sPathL_2 + "/aLastLineItemTable"
                    );
                    if (
                        aLastLineItemTable.length <= 0 &&
                        ddSelectedItemCategory !== "EXPENSE"
                    ) {
                        aErrorMessages.push(
                            `PO Details row no ${i + 1}, item No ${j + 1
                            } must have Milestones , Volume or Payment Schedule.`
                        );
                        totalInvalidInputCount++;
                    }

                    // --- [ PO Table Line Item - 3 ] ---
                    for (let k = 0; k < aLastLineItemTable.length; k++) {
                        const sPathL_3 = sPathL_2 + "/aLastLineItemTable/" + k;

                        let aErrorsInPO_L3 = [];
                        let tableName = "";

                        switch (aLastLineItemTableIdentity) {
                            case "TABLE_MILESTONE_BASED":
                                tableName = "Milestone";
                                aErrorsInPO_L3 = [
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/description",
                                        VAL_TYPES.TEXT,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/amount",
                                        VAL_TYPES.NUM,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/percentage",
                                        VAL_TYPES.NUM,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/date",
                                        VAL_TYPES.ANY,
                                        true
                                    ),
                                ];
                                break;
                            case "TABLE_VOLUME_BASED":
                                tableName = "Volume";
                                aErrorsInPO_L3 = [
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/description", VAL_TYPES.TEXT, true),
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/Quantity", VAL_TYPES.NUM, true),
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/amount", VAL_TYPES.NUM, true),
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/startDate", VAL_TYPES.ANY, true),
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/endDate", VAL_TYPES.ANY, true),
                                    this.isInvalidInputBoxEntry(sPathL_3 + "/milestoneDate", VAL_TYPES.ANY, true),
                                ];
                                break;
                            case "TABLE_SCHEDULE_BASED":
                                tableName = "Payment Schedule";
                                aErrorsInPO_L3 = [
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/description",
                                        VAL_TYPES.TEXT,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/startDate",
                                        VAL_TYPES.ANY,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/endDate",
                                        VAL_TYPES.ANY,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/amount",
                                        VAL_TYPES.NUM,
                                        true
                                    ),
                                    this.isInvalidInputBoxEntry(
                                        sPathL_3 + "/billdate",
                                        VAL_TYPES.ANY,
                                        true
                                    ),
                                ];
                                break;
                        }

                        if (aErrorsInPO_L3.find((error) => error)) {
                            // if error === true
                            aErrorMessages.push(
                                `PO Details row no ${i + 1}, item No ${j + 1
                                } , ${tableName} has some issue. Actual error can be seen at field. Please correct and retry.`
                            );
                            totalInvalidInputCount++;
                        }
                    }
                }

                // Check Sum(GrossLineItem2) === GrossLineItem1
                if (Number(poHeaderTable[i].GrossValue) !== sumOfGrossLineItem1) {
                    aErrorMessages.push(
                        `PO Details row no ${i + 1
                        }, the gross value and Sum of line items are not matching. Actual error can be seen at field. Please correct and retry.`
                    );
                    totalInvalidInputCount++;
                }
            }
        }

        // * Profit Centre Table
        const profitCenterTable = oModel.getProperty("/profitCenterTable");
        const poSumOfpDs = oModel.getProperty("/poSumOfpDs");

        // Check If Total Profit Centre % === 100
        let totalPCPercent = 0;
        let totalPds = 0
        profitCenterTable.forEach((element) => {
            totalPCPercent = Math.round((totalPCPercent + Number(element.percentage)) * 100) / 100;
            totalPds = Math.round((totalPds + Number(element.pDs)) * 100) / 100;
        });

        if (Number(poSumOfpDs) === Number(totalPds)) {
            // Do Nothing
        } else if (Number(totalPCPercent) === 100) {
            // Do Nothing
        } else {
            aErrorMessages.push("Profit Center distribution can not be more or less than 100%. Please correct and retry.");
            totalInvalidInputCount++;
        }

        for (let index = 0; index < profitCenterTable.length; index++) {
            const sRowPath = "/profitCenterTable/" + index;

            aValidInputs = [
                this.isInvalidInputBoxEntry(
                    sRowPath + "/profitCentre",
                    VAL_TYPES.ANY,
                    true
                ),
                this.isInvalidInputBoxEntry(
                    sRowPath + "/percentage",
                    VAL_TYPES.NUM,
                    true
                ),
                this.isInvalidInputBoxEntry(sRowPath + "/pDs", VAL_TYPES.NUM, true),
                this.isInvalidInputBoxEntry(
                    sRowPath + "/projectLead",
                    VAL_TYPES.ANY,
                    true
                ),
                this.isInvalidInputBoxEntry(sRowPath + "/manager", VAL_TYPES.ANY, true),
                this.isInvalidInputBoxEntry(
                    sRowPath + "/teamHeadSelected",
                    VAL_TYPES.ANY,
                    true
                ),
            ];

            if (aValidInputs.find((error) => error)) {
                // if error === true
                aErrorMessages.push(
                    "Profit Center has some issue. Actual error can be seen at field. Please correct and retry."
                );
                totalInvalidInputCount++;
            }
        }

        // * Functional Area
        const functionalAreaTable = oModel.getProperty("/functionalAreaTable");

        // Check If Total Functional Area % === 100
        let totalFAPercent = 0;
        let totalFaPds = 0;
        functionalAreaTable.forEach((element) => {
            totalFAPercent = Math.round((totalFAPercent + Number(element.percentage)) * 100) / 100;
            totalFaPds = Math.round((totalFaPds + Number(element.pDs)) * 100) / 100;
        });

        if (Number(poSumOfpDs) === Number(totalFaPds)) {
            // Do Nothing
        } else if (Number(totalFAPercent) === 100) {
            // Do Nothing
        } else {
            aErrorMessages.push("Functional area distribution can not be more or less than 100%. Please correct and retry.");
            totalInvalidInputCount++;
        }

        for (let index = 0; index < functionalAreaTable.length; index++) {
            const sPath = "/functionalAreaTable/" + index;

            aValidInputs = [
                this.isInvalidInputBoxEntry(
                    sPath + "/functionalAreaSelected",
                    VAL_TYPES.ANY,
                    true
                ),
                this.isInvalidInputBoxEntry(sPath + "/percentage", VAL_TYPES.NUM, true),
                this.isInvalidInputBoxEntry(sPath + "/pDs", VAL_TYPES.NUM, true),
            ];

            if (aValidInputs.find((error) => error)) {
                // if error === true
                aErrorMessages.push(
                    "Functional area has some issue. Actual error can be seen at field. Please correct and retry."
                );
                totalInvalidInputCount++;
            }
        }

        // * Comment And Flow
        countInvalidInput("/commentText", VAL_TYPES.TEXT, false);

        // Append All Error Message Into String
        let sErrorMsgDisplay = "";
        const aErrorMessageNoDuplicates = aErrorMessages.filter(
            (item, index) => aErrorMessages.indexOf(item) === index
        );
        aErrorMessageNoDuplicates.forEach((msg) => {
            sErrorMsgDisplay += msg + "\n";
        });
        if (sErrorMsgDisplay !== "") this.fnShowErrorPopup(sErrorMsgDisplay);

        return totalInvalidInputCount === 0; // Return TRUE or FALSE
    }

    // ------------ [Start]  ValueState Set /  Reset--------------

    public fnComboBoxResetValueState(oEvent: Event) {
        let isInputInvalid = false;

        if (oEvent) {
            // Check And Reset Invalid Entry
            const sValue = oEvent.getSource().getSelectedItem("mPageData");

            if (sValue === "") {
                oEvent.getSource().setValue(null);
                isInputInvalid = true;
            }
            if (sValue === null) {
                oEvent.getSource().setValue("");
                isInputInvalid = true;
            }

            // Reset Error ValueState to Default
            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        }

        return isInputInvalid;
    }

    public fnMultiComboBoxResetValueState(oEvent: Event) {
        let isInputInvalid = false;

        if (oEvent) {
            // Reset Error ValueState to Default
            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        }

        return isInputInvalid;
    }

    public fnInputBoxResetValueState(oEvent: Event) {
        if (oEvent) {
            this.fnInputBoxResetValueStateUsingSource(oEvent.getSource());
        }
    }

    public fnInputBoxResetValueStateUsingSource(oSource: any) {
        if (oSource) {
            if (oSource.mProperties.type === "Number") {
                // This code will prevent mouse scroll because Input Type == number get changed on mouse scroll
                oSource.attachBrowserEvent("mousewheel", function (oEvent) {
                    oEvent.preventDefault();
                });
            }

            oSource.setValueState(sap.ui.core.ValueState.None);
        }
    }

    public fnDateInputResetValueState(oEvent: Event) {
        if (oEvent) {
            const inputDate = oEvent.getSource().getValue();

            const regex = /^\d+\/\d+\/\d+$/; // regex check int/int/int
            if (!regex.test(inputDate)) {
                oEvent.getSource().setValue(null);
            } else {
                const date = new Date(inputDate);
                if (date.toString() === "Invalid Date") {
                    oEvent.getSource().setValue(null);
                }
            }

            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        }
    }

    public fnResetSetValueStateErrorNoActPath(
        sPath: string,
        isError: boolean = false,
        sErrMsg: string = "",
        oModel: any = null
    ) {
        if (sPath.charAt(0) !== "/") {
            sPath = "/" + sPath;
        }

        // Split : /table2/0/table2/4/inputBox
        // sPathToUpdate = /table2/0/table2/4  ||  sTargetToUpdate = inputBox
        const sPathToUpdate = sPath.replace(/\/[^/]+$/, "");
        const sTargetToUpdate = sPath.match(/([^/]+)$/);
        if (sTargetToUpdate === null) {
            return;
        }

        const vStatePath = sPathToUpdate + "/VS_" + sTargetToUpdate[1]; // value_state {VS_inputBox}
        const vTextPath = sPathToUpdate + "/VST_" + sTargetToUpdate[1]; // value_state_text {VST_inputBox}

        if (oModel === null) {
            oModel = sap.ui.getCore().getModel("mPageData");
        }

        oModel.setProperty(
            vStatePath,
            isError ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.None
        );
        oModel.setProperty(vTextPath, sErrMsg);
    }

    // ------------ [End] ValueState Set /  Reset --------------

    public fnPerformSumOfTotalPDs() {
        const poHeaderTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poHeaderTable");
        let totalPDs = 0;

        for (let i = 0; i < poHeaderTable.length; i++) {
            totalPDs += Number(poHeaderTable[i].BudgetedPD);
        }
        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/poSumOfpDs", totalPDs.toFixed(1));
    }

    public fnPerformSumOfTotalProjectPDs() {
        const poHeaderTable = sap.ui.getCore().getModel("mPageData").getProperty("/poHeaderTable");
        let totalprojectPD = 0;

        for (let i = 0; i < poHeaderTable.length; i++) {
            totalprojectPD += Number(poHeaderTable[i].projectPD);
        }
        sap.ui.getCore().getModel("mPageData").setProperty("/poSumOfProjectPDs", totalprojectPD.toFixed(1));
    }

    public fnPerformSumOfTotalGrossWithoutTax() {
        const totalGrossWithoutTax = this.getSumOfPoGrossWithoutTax();
        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/poSumOfGross", totalGrossWithoutTax);
    }

    public onPoHeaderGrossValueChanged(oEvent: Event) {
        const sCurrentRowPath = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();

        this.fnPerformSumOfTotalGrossWithoutTax();
    }

    public onPoHeaderCRRateValueChanged(oEvent: Event) {
        const sCurrentRowPath = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        this.fnAutoCalculateBudgetedPD(sCurrentRowPath);

        this.fnReCalculateFunctionalAreaPDs();
        this.fnReCalculateProfitCenterPDs();
    }

    public onPoHeaderPDsValueChanged(oEvent: Event) {
        this.assignProjectPdsInitialValue(oEvent.getSource().getParent().getBindingContextPath());
        this.fnPerformSumOfTotalPDs();
        this.fnReCalculateFunctionalAreaPDs();
        this.fnReCalculateProfitCenterPDs();
    }

    public onPoHeaderProjectPDsChanged(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        this.fnPoHeaderProjectPDsChanged(sRowPath);
    }

    public fnPoHeaderProjectPDsChanged(sRowPath) {
        // Show error if BudgtPD is bigger than ProjPD
        const oPageModel = sap.ui.getCore().getModel("mPageData");
        const projectPD = oPageModel.getProperty(sRowPath + "/projectPD");
        const BudgetedPD = oPageModel.getProperty(sRowPath + "/BudgetedPD");
        if (Number(projectPD) > Number(BudgetedPD)) {
            oPageModel.setProperty(sRowPath + "/projectPD", "");
            this.fnResetSetValueStateErrorNoActPath(sRowPath + "/projectPD", true, "Value should not be greater than budgeted PD.");
        }

        this.fnPerformSumOfTotalProjectPDs();
        this.fnReCalculateProfitCenterProjectPDs();
    }

    public assignProjectPdsInitialValue(sRowPath: String, pdValues: any = "") {
        const oPageModel = sap.ui.getCore().getModel("mPageData");
        // Clear Project PD
        oPageModel.setProperty(sRowPath + "/projectPD", pdValues);
        this.fnResetSetValueStateErrorNoActPath(sRowPath + "/projectPD", false);
        this.fnPoHeaderProjectPDsChanged(sRowPath);
    }

    public onNonBillablePDValueChange() {
        this.fnReCalculateFunctionalAreaPDs();
        this.fnReCalculateProfitCenterPDs();
    }

    public fnAutoCalculateBudgetedPD(sRowPath: string) {
        // FORMULA = SUM OF CHILD GROSS [PROJ , AMC ] / CR RATE
        const CRRate = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + "/CRRate");
        const aPoLineItemTable = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + "/aPoLineItemTable");
        const projectPD = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + "/projectPD");

        let sumOfGrossLineItem1 = 0;

        for (let j = 0; j < aPoLineItemTable.length; j++) {
            if (aPoLineItemTable[j].ddSelectedItemCategory === "PROJFEE" || aPoLineItemTable[j].ddSelectedItemCategory === "TNM" || aPoLineItemTable[j].ddSelectedItemCategory === "AMC") {
                sumOfGrossLineItem1 += Number(aPoLineItemTable[j].GrossValue);
            }
        }

        let calculatedBudgetedPD: any = "";
        if (CRRate !== "" && CRRate !== 0 && sumOfGrossLineItem1 !== 0) {
            calculatedBudgetedPD = (sumOfGrossLineItem1 / CRRate).toFixed(1);
        }

        // Set Budgeted PD = Gross of row /  CR Rate of row
        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + "/BudgetedPD", calculatedBudgetedPD);
        this.fnResetSetValueStateErrorNoActPath(sRowPath + "/BudgetedPD", false);

        // Set Project PD 
        if (projectPD === "" || Number(projectPD === "") <= 0) {
            this.assignProjectPdsInitialValue(sRowPath, calculatedBudgetedPD)
        } else if (Number(calculatedBudgetedPD) < Number(projectPD)) {
            this.assignProjectPdsInitialValue(sRowPath)
        }

        // Calculate : SUM Total PDs
        this.fnPerformSumOfTotalPDs();
    }

    public getSumOfPoGrossWithoutTax() {
        const poHeaderTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poHeaderTable");
        let totalGross = 0;

        for (let i = 0; i < poHeaderTable.length; i++) {
            totalGross += Number(poHeaderTable[i].GrossValue);
        }

        return totalGross;
    }

    // == Profit Centre [Start] ==
    public validateProfitCentrePercentage(sCurrentRowPath: string) {
        // check If Total Percentage sum is 100 %
        const profitCenterTable = sap.ui.getCore().getModel("mPageData").getProperty("/profitCenterTable");

        let totalPercent = 0;
        profitCenterTable.forEach((element) => {
            totalPercent += Number(element.percentage);
        });

        // If more than 100% // Reset Current Line (pd and Percent) Values
        const sCurrentRowPathPercent = sCurrentRowPath + "/percentage";
        const sCurrentRowPathPds = sCurrentRowPath + "/pDs";
        const sCurrentRowPathProjectPds = sCurrentRowPath + "/projectPDs";

        if (totalPercent > 100) {
            sap.ui.getCore().getModel("mPageData").setProperty(sCurrentRowPathPercent, "");
            sap.ui.getCore().getModel("mPageData").setProperty(sCurrentRowPathPds, "");
            sap.ui.getCore().getModel("mPageData").setProperty(sCurrentRowPathProjectPds, "");

            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPercent, true, "Input Value Exceeds 100%");
            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPds, true, "Input Value Exceeds 100%");

            return false;
        } else {
            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPercent, false);
            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPds, false);

            return true;
        }
    }

    public fnReCalculateProfitCenterProjectPDs() {
        const profitCenterTable = sap.ui.getCore().getModel("mPageData").getProperty("/profitCenterTable");
        const poSumOfProjectPDs = sap.ui.getCore().getModel("mPageData").getProperty("/poSumOfProjectPDs");

        if (poSumOfProjectPDs === "") {
            return;
        }

        for (let i = 0; i < profitCenterTable.length; i++) {
            if (profitCenterTable[i].percentage === "") {
                profitCenterTable[i].projectPDs = "";
            }
            else {
                profitCenterTable[i].projectPDs = ((Number(profitCenterTable[i].percentage) * poSumOfProjectPDs) / 100).toFixed(2);
            }
        }

        sap.ui.getCore().getModel("mPageData").setProperty("/profitCenterTable", [...profitCenterTable]);
    }

    public fnReCalculateProfitCenterPDs() {
        const profitCenterTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/profitCenterTable");
        const totalPDs = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poSumOfpDs");

        if (totalPDs === "") {
            return;
        }

        for (let i = 0; i < profitCenterTable.length; i++) {
            if (profitCenterTable[i].percentage === "") {
                profitCenterTable[i].pDs = "";
            } else {
                profitCenterTable[i].pDs = (
                    (Number(profitCenterTable[i].percentage) * totalPDs) /
                    100
                ).toFixed(2);
            }
        }

        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/profitCenterTable", [...profitCenterTable]);
    }

    public onChangeProfitCenterPercent(oEvent: Event) {
        // Recalculate Percentage For All Rows
        this.fnReCalculateProfitCenterPDs();
        this.fnReCalculateProfitCenterProjectPDs()

        // Check Percentage exceeds 100 or not For current row
        const sCurrentRowPath = oEvent.getSource().getParent().getBindingContextPath();
        this.validateProfitCentrePercentage(sCurrentRowPath);
    }

    public onChangeProfitCenterPD(oEvent: Event) {
        // Recalculate Percentage For All Rows
        const profitCenterTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/profitCenterTable");
        const totalPDs = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poSumOfpDs");
        for (let i = 0; i < profitCenterTable.length; i++) {
            profitCenterTable[i].percentage = (
                (Number(profitCenterTable[i].pDs) * 100) /
                totalPDs
            ).toFixed(2);
        }

        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/profitCenterTable", [...profitCenterTable]);

        // Check Percentage exceeds 100 or not For current row
        const sCurrentRowPath = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        this.validateProfitCentrePercentage(sCurrentRowPath);
    }
    // == Profit Centre [End] ==

    // == Functional Area Calculation [Start] ==
    public validateFunctionalAreaPercentage(sCurrentRowPath: string) {
        // check If Total Percentage sum is 100 %
        const functionalAreaTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/functionalAreaTable");

        let totalPercent = 0;
        functionalAreaTable.forEach((element) => {
            totalPercent += Number(element.percentage);
        });

        // If more than 100% // Reset Current Line (pd and Percent) Values
        const sCurrentRowPathPercent = sCurrentRowPath + "/percentage";
        const sCurrentRowPathPds = sCurrentRowPath + "/pDs";

        if (totalPercent > 100) {
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty(sCurrentRowPathPercent, "");
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty(sCurrentRowPathPds, "");

            this.fnResetSetValueStateErrorNoActPath(
                sCurrentRowPathPercent,
                true,
                "Input Value Exceeds 100%"
            );
            this.fnResetSetValueStateErrorNoActPath(
                sCurrentRowPathPds,
                true,
                "Input Value Exceeds 100%"
            );

            return false;
        } else {
            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPercent, false);
            this.fnResetSetValueStateErrorNoActPath(sCurrentRowPathPds, false);

            return true;
        }
    }

    public fnReCalculateFunctionalAreaPDs() {
        const functionalAreaTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/functionalAreaTable");
        const totalPDs = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poSumOfpDs");

        if (totalPDs === "") {
            return;
        }

        for (let i = 0; i < functionalAreaTable.length; i++) {
            if (functionalAreaTable[i].percentage === "") {
                functionalAreaTable[i].pDs = "";
            } else {
                functionalAreaTable[i].pDs = (
                    (Number(functionalAreaTable[i].percentage) * totalPDs) /
                    100
                ).toFixed(2);
            }
        }

        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/functionalAreaTable", [...functionalAreaTable]);
    }

    public onChangeFuncAreaPercent(oEvent: Event) {
        // Recalculate PDs For All Rows
        this.fnReCalculateFunctionalAreaPDs();

        // Check Percentage exceeds 100 or not For current row
        const sCurrentRowPath = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        this.validateFunctionalAreaPercentage(sCurrentRowPath);
    }

    public onChangeFuncAreaPD(oEvent: Event) {
        // Recalculate Percentage For All Rows
        const functionalAreaTable = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/functionalAreaTable");
        const totalPDs = sap.ui
            .getCore()
            .getModel("mPageData")
            .getProperty("/poSumOfpDs");
        for (let i = 0; i < functionalAreaTable.length; i++) {
            functionalAreaTable[i].percentage = (
                (Number(functionalAreaTable[i].pDs) * 100) /
                totalPDs
            ).toFixed(2);
        }

        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/functionalAreaTable", [...functionalAreaTable]);

        // Check Percentage exceeds 100 or not For current row
        const sCurrentRowPath = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath();
        this.validateFunctionalAreaPercentage(sCurrentRowPath);
    }
    // == Functional Area Calculation [End] ==

    public onCommentTextChange(oEvent: Event) {
        this.fnInputBoxResetValueState(oEvent);

        let commentTextLength = oEvent.getSource().getValue().length;

        if (commentTextLength > 200) {
            const lastComment = oEvent.getSource().getLastValue();
            oEvent.getSource().setValue(lastComment);
            commentTextLength = lastComment.length;
        }

        sap.ui
            .getCore()
            .getModel("mPageData")
            .setProperty("/commentTextLength", commentTextLength);
    }

    public showTopButtons(buttonIdentities: Array<string>) {
        const oModel = sap.ui.getCore().getModel("mPageData");

        const aTopButtons = [
            {
                key: "SUBMIT",
                value: "/submitButtonEnabled",
            },
            {
                key: "SAVE",
                value: "/saveDraftButtonEnabled",
            },
            {
                key: "CANCEL",
                value: "/CancelButtonEnabled",
            },
            {
                key: "APPROVE",
                value: "/ApproveButtonEnabled",
            },
            {
                key: "BACK2EDIT",
                value: "/Back2EditButtonEnabled",
            },
            {
                key: 'CALLBACK',
                value: '/CallBackButtonEnabled'
            },
            {
                key: "EDIT",
                value: "/editButtonEnabled",
            }
        ];

        aTopButtons.forEach((el) => {
            const isEnabled = buttonIdentities.find((bId) => bId === el.key)
                ? true
                : false;
            oModel.setProperty(el.value, isEnabled);
        });
    }

    public enableEditInputFields(editableItems: Array<int>) {
        const editableFields = [
            "/isEditBasicDetails", // 1
            "/isEditInvoiceStatus", // 2
            "/isNewPoAddRow", // 3
            "/isEditComment", // 4
            "/isEditOrderType", //5
            "/isEditTravelTable", //6
            "/isEditPerDiemRate" //7
        ];

        for (let i = 0; i < editableFields.length; i++) {
            const fieldProperty = editableFields[i];
            const isEditable = editableItems.find((el) => el === i + 1) ? true : false;
            sap.ui.getCore().getModel("mPageData").setProperty(fieldProperty, isEditable);
        }
    }

    public async onPressNoEditBtn() {
        this.enableEditInputFields([]);
    }

    public async onPressEditBtn() {
        const oModel = sap.ui.getCore().getModel("mPageData");

        // Reusable func
        const restrictPsSoFromChanging = () => {
            // if Order Type == Provisional SO
            // Covert that to SO, Permanent
            const orderTypeSelected = oModel.getProperty("/orderTypeSelected");
            if (orderTypeSelected == "PS") {
                oModel.setProperty("/orderTypesList", [
                    { key: "SO", text: "SO" },
                    { key: "PS", text: "Provisional SO" },
                ]);
                oModel.setProperty("/orderTypeSelected", "PS");
            } else if (orderTypeSelected == "SO") {
                oModel.setProperty("/orderTypesList", [
                    { key: "SO", text: "SO" }
                ]);

                oModel.setProperty("/orderTypeSelected", "SO");
            }
        }

        // Get Conditional Variables
        const createdById = oModel.getProperty("/createdById");
        const salesResponsible = oModel.getProperty("/salesResponsibleSelected");
        const loginUserId = oModel.getProperty("/loginUserId");
        const soStatus = oModel.getProperty("/soStatus");
        const loginUserRole = oModel.getProperty("/loginUserRole");
        const isApprovalRole = oModel.getProperty("/ApproveButtonEnabled");

        // Enable SAVE Buttons
        this.showTopButtons(["SUBMIT", "SAVE", "CANCEL"]);

        switch (soStatus) {
            case "New":
            case "Call Back":
                this.enableEditInputFields([1, 2, 3, 4, 5, 6, 7]);
                break;

            case "Save As Draft":
                if (createdById === loginUserId || loginUserId.toLowerCase() === salesResponsible.toLowerCase()) {
                    this.enableEditInputFields([1, 2, 3, 4, 5, 6, 7]);
                }
                break;

            case "Back To Edit":
                if (createdById === loginUserId || loginUserId.toLowerCase() === salesResponsible.toLowerCase()) {
                    this.enableEditInputFields([1, 2, 3, 4, 5, 6, 7]);
                }
                break;

            case "Approved":
                restrictPsSoFromChanging();

                if (loginUserRole === "FINANCE") {
                    this.enableEditInputFields([1, 5, 2, 3, 4, 6, 7]);
                } else if (this.secondRole) {
                    this.enableEditInputFields([1, 5, 2, 3, 4, 6]);
                } else if (loginUserRole === "TEAM_HEAD") {
                    this.enableEditInputFields([1, 5, 3, 4, 6, 7]);
                } else {
                    // Get All Project Managers From Model Of Profit Centre Table
                    const profitCenterTable = sap.ui.getCore().getModel("mPageData").getProperty("/profitCenterTable");
                    const loginManagerRowExist = profitCenterTable.find(
                        ({ manager }) => loginUserId.toUpperCase() === manager.toUpperCase()
                    );

                    if (loginManagerRowExist || createdById === loginUserId || loginUserId.toLowerCase() === salesResponsible.toLowerCase()) {
                        this.enableEditInputFields([5, 3, 4, 6]);
                    }
                }
                break;

            case "Closed":
                restrictPsSoFromChanging();

                if (loginUserRole === "FINANCE") {
                    this.enableEditInputFields([1, 5, 2, 3, 4, 6]);
                } else {
                    this.enableEditInputFields([6]);
                }

            case "Pending":
                this.showTopButtons(["SUBMIT", "CANCEL"]);

                if (loginUserRole === "FINANCE" || this.secondRole) {
                    this.enableEditInputFields([1, 5, 2, 3, 4, 6]);
                } else if (loginUserRole === "TEAM_HEAD") {
                    this.enableEditInputFields([1, 5, 3, 4, 6]);
                } else {
                    this.enableEditInputFields([6]);
                }

                // Exclusive Edit Input Code
                if (isApprovalRole) {
                    oModel.setProperty("/isEditPerDiemRate", true);
                }

                break;
        }
    }

    public async onPressCancelBtn() {
        //this.navTo({ S: "p_sales_order_list" });
        await this.onNavBack({ S: "p_sales_order_list" });
    }

    public onSubscriptionSelectionFinish(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getParent().getBindingContextPath();

        const multiComboBox = oEvent.getSource();
        const selectedKeys = multiComboBox.getSelectedKeys();   // Get all selected keys
        const enabledKeys = multiComboBox.getItems().filter(function (oItem) { // Get Enabled/visisible Keys
            return oItem.getEnabled();
        }).map(function (oItem) {
            return oItem.getKey()
        });

        // Find Real Selected key displayed screen, selected by user
        const actualSelectedSubsKey = selectedKeys.filter(function (selectedKey) {
            return enabledKeys.find((enabledKey) => enabledKey === selectedKey) ? true : false;
        })

        // Delete subscription from backend , if user has unselected 
        const aSavedPoSubscriptionIdMap = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + "/aSavedPoSubscriptionIdMap");
        const aRevisedPoSubscriptionIdMap = [];

        aSavedPoSubscriptionIdMap.map(async (oSavedSubs) => {
            const isDeleteFromBackend = actualSelectedSubsKey.find(selectedItem => selectedItem === oSavedSubs.subscriptionKey) ? false : true;
            if (isDeleteFromBackend) {
                // todo albia
                // this is loop
                // oSavedSubs.subscriptionId , -> this is subscription Id
                // You can use that id to delete subscription
                //Backend Delete code START
                if (oSavedSubs.subscriptionId) {
                    let deleteApiData = await this.transaction.getExecutedQuery(
                        "d_o2c_so_api_type",
                        { loadAll: true, table_id: oSavedSubs.subscriptionId }
                    );
                    deleteApiData[0].deleteP();
                }
                //Backend Delete code END
            } else {
                aRevisedPoSubscriptionIdMap.push(oSavedSubs)
            }
        });

        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + "/ddSelectedPOSubscription", actualSelectedSubsKey);
        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + "/aSavedPoSubscriptionIdMap", aRevisedPoSubscriptionIdMap);
    }

    public async fnFetchAndAutoFillSOData(guid) {
        const oModel = sap.ui.getCore().getModel("mPageData");

        //Header Detail,Project Detail,Customer Detail,Sales Team,Onsite Rules
        const so_info = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, so_guid: guid });
        const customerSalesResponsible = await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, customer_id: so_info[0].bill_to_customer });
        this.header_detail = so_info[0];
        oModel.setProperty("/orderTypeSelected", so_info[0].type);
        oModel.setProperty("/soNumber", so_info[0].so);

        oModel.setProperty("/project_name", so_info[0].project_name);
        oModel.setProperty("/office_calendar", so_info[0].office_calendar);
        oModel.setProperty("/durationInWeeks", so_info[0].duration_week);
        oModel.setProperty("/project_start_date", this.fnConvertJsToUi5Date(so_info[0].project_start_date));
        oModel.setProperty("/project_end_date", this.fnConvertJsToUi5Date(so_info[0].project_end_date));
        oModel.setProperty("/poSumOfpDs", so_info[0].total_pds);

        oModel.setProperty("/bill_to_customer", so_info[0].bill_to_customer);
        oModel.setProperty("/currExchangeRate", so_info[0].currency_exc_rate);
        this.onCustomerChange(null, so_info[0].bill_to_address, so_info[0].parent_po);

        oModel.setProperty("/external_number", so_info[0].external_number);
        oModel.setProperty("/productType", so_info[0].product_type);
        oModel.setProperty("/currency", so_info[0].currency);
        oModel.setProperty("/preSalesBySelected", so_info[0].pre_sales);
        oModel.setProperty("/salesResponsibleSelected", so_info[0].sales_responsible);
        oModel.setProperty("/permanentSalesResponsible", customerSalesResponsible[0].sales_responsible);

        oModel.setProperty("/onSiteRadioButton/yes", so_info[0].onsite_required);
        oModel.setProperty("/onSiteRadioButton/no", !so_info[0].onsite_required);

        oModel.setProperty("/reimbursement_rules", so_info[0].reimbursement_rules);
        oModel.setProperty("/reimbursement_remark", so_info[0].reimbursement_remark);

        //Expense Table
        let expense_project = await so_info[0].r_so_expense_project.fetch();
        const tableExpense = [];
        for (let i = 0; i < expense_project.length; i++) {
            let expense_header = await expense_project[i].r_expense_project_header.fetch();
            // this.expense_list.push(...expense_header);
            tableExpense.push(...expense_header);
        }

        oModel.setProperty("/tableExpense", tableExpense);

        //Expense table ends..

        //Customer Contact
        this.contact_detail = await so_info[0].r_contact_details.fetch();

        //Customer Contact - all
        const aAllContacts = await this.transaction.getExecutedQuery("d_o2c_customers_contact", { loadAll: true, k_id: so_info[0].bill_to_customer });

        const customerContactTable: Array<any> = [];

        for (let i = 0; i < this.contact_detail.length; i++) {
            const savedContact = this.contact_detail[i];

            // Get Contact Details from Manager
            const oCurrContactLine = aAllContacts.find((oAllCon) => oAllCon.contact_id === savedContact.contact_identifer);

            if (oCurrContactLine) {
                customerContactTable.push({
                    contact_id: oCurrContactLine.contact_id,
                    contact_name: oCurrContactLine.contact_name,
                    contact_role: savedContact.contact_role,
                    contact_number: oCurrContactLine.contact_number,
                    email_id: oCurrContactLine.email_id,
                    billingResponsible: savedContact.sales_responsible === "true",
                    rowID: savedContact.contact_id_new,
                });
            } else {
                customerContactTable.push({
                    contact_id: null,
                    contact_name: savedContact.contact_name,
                    contact_role: savedContact.contact_role,
                    contact_number: savedContact.contact_details_for_followup,
                    email_id: savedContact.email,
                    billingResponsible: savedContact.sales_responsible === "true",
                    rowID: savedContact.contact_id_new,
                });
            }
        }
        oModel.setProperty("/customerContactTable", customerContactTable);

        //PO Details Table 1
        this.poTableLineItem1 = await so_info[0].r_so_attachment.fetch();
        let approvalRole = [];
        let approvalRoles = [];
        let loginRole = (await this.transaction.get$Role()).role_id;
        if (this.secondRole) {
            loginRole = this.secondRole;
        }
        if (this.header_detail.cr_status == "Open" || this.header_detail.cr_status == "Return Back") {
            await this.currentApprovalCycle("CR");
            approvalRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { so_no: this.header_detail.so, approval_cycle: this.maxApprovalCycle, pending_with_role: loginRole, approved_type: "CR" });
        } else {
            approvalRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { so_no: this.header_detail.so, pending_with_role: loginRole });
            await this.currentApprovalCycle("New");
            approvalRoles = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { so_no: this.header_detail.so, approval_cycle: this.maxApprovalCycle, pending_with_role: loginRole });
        }
        const finalTable = [];

        let isReturnBackExist = false;
        let isPendingPoExistForSameUser = false;

        //PO Details Table 1
        for (let i = 0; i < this.poTableLineItem1.length; i++) {
            const poHeaderRow = this.poTableLineItem1[i];
            const login_id = sap.ui.getCore().getModel("mPageData").getProperty("/loginUserId");
            const loginUserRole = sap.ui.getCore().getModel("mPageData").getProperty("/loginUserRole");
            let isPoRowEditable = true;

            if (poHeaderRow.approval_status === "Save As Draft") {
                if (login_id === poHeaderRow.s_created_by || login_id.toLowerCase() === (so_info[0].sales_responsible).toLowerCase()) {
                    // Display Row
                } else {
                    continue;
                }
            } else if (poHeaderRow.approval_status === "Pending" || poHeaderRow.approval_status === "New") {
                if (poHeaderRow.approval_status === "New") {
                    approvalRole = approvalRoles;
                }
                if (approvalRole.length) {
                    // Display Row
                } else if (login_id === poHeaderRow.s_created_by || loginUserRole === "MANAGER" || login_id.toLowerCase() === (so_info[0].sales_responsible).toLowerCase()) {
                    // Display Row
                    if (this.header_detail.s_status != "Pending" && this.header_detail.s_status != "Approved")
                        isPendingPoExistForSameUser = true;
                } else {
                    continue;
                }
            } else if (poHeaderRow.approval_status === "Approved") {
                // Display Row

                // Po Edit Restrict for manager and sales
                if (loginUserRole === "MANAGER" || loginUserRole === "SALES") {
                    isPoRowEditable = false;
                }
            } else if (this.header_detail.s_status == "Back To Edit" && poHeaderRow.approval_status != "Save As Draft") {
                // Display Row
            } else if (poHeaderRow.approval_status === "Return Back") {
                let currapprovalRole = approvalRole.filter((item) => item.approved_type == "CR");
                if (login_id === poHeaderRow.s_created_by || login_id.toLowerCase() === (so_info[0].sales_responsible).toLowerCase()) {
                    //Display Row
                    isReturnBackExist = true;
                } else if (currapprovalRole.length) {
                    //Display Row
                } else {
                    continue;
                }
            }

            // Top Button Conditions
            let approvedApprovalRole = [];
            let approvalMaster = await this.transaction.getExecutedQuery("d_o2c_so_approval_master", { so_type: this.header_detail.type, role: (await this.transaction.get$Role()).role_id, business_area: this.header_detail.business_area, });
            if (approvalMaster.length && approvalMaster[0].consensus_approval == true) {
                let type = "";
                let soApprovalFlowLoginRole = [];
                if (this.header_detail.s_status == "Approved") {
                    type = "CR";
                    await this.currentApprovalCycle(type);
                    approvedApprovalRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { so_no: this.header_detail.so, approval_cycle: this.maxApprovalCycle, pending_with_role: (await this.transaction.get$Role()).role_id, approval_status: "Approved", approved_type: type, });
                } else {
                    type = "New";
                    approvedApprovalRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { so_no: this.header_detail.so, approval_cycle: this.header_detail.approval_cycle, pending_with_role: (await this.transaction.get$Role()).role_id, approval_status: "Approved", approved_type: type, });
                }
            }

            if (this.header_detail.cr_status === "Open" && approvalRole.length) {
                let user_id = approvedApprovalRole.filter((item) => item.action_by == login_id);
                if (user_id.length == 0) {
                    this.tm.getTN("user_role").setData({ role: true });
                    this.showTopButtons(["APPROVE", "BACK2EDIT", "EDIT"]);
                    // Enable Comment Box
                    this.enableEditInputFields([4]);
                }
            } else {
                // Display Top Buttons as it is
            }

            let isPoRowProvisionalEditable = poHeaderRow.attachment_type === "AM" ? true : isPoRowEditable;

            const l1 = {
                isPoRowEditable,
                isPoRowProvisionalEditable,
                approval_status: poHeaderRow.approval_status,
                rowID: poHeaderRow.attachment_id,
                isThisTableExpanded: false,
                DocType: poHeaderRow.attachment_type,
                AttachedCopyDownloaded: poHeaderRow.attach_copy,
                AttachedCopy: "",
                AttachCopyName: poHeaderRow.attach_copy.name,
                ProposalCopyDownloaded: poHeaderRow.personal_copy,
                ProposalCopy: "",
                ProposalCopyName: poHeaderRow.personal_copy.name,
                PONumber: poHeaderRow.po_no,
                CRNumber: poHeaderRow.cr_no,
                PODate: this.fnConvertJsToUi5Date(poHeaderRow.po_date),
                GrossValue: poHeaderRow.gross_value,
                BudgetedPD: poHeaderRow.budgeted_pd,
                projectPD: poHeaderRow.project_pds,
                CRRate: poHeaderRow.cr_rate,
                TaxChecked: poHeaderRow.tax_checked,
                Remark: poHeaderRow.so_remark,
                aPoLineItemTable: [],
            };

            this.poTableLineItem2 = await this.poTableLineItem1[i].r_attachmnt_itm.fetch();

            //PO Details Table 2
            for (let j = 0; j < this.poTableLineItem2.length; j++) {

                const poLineItemRow = this.poTableLineItem2[j];
                this.selectedPoSubscription = await poLineItemRow.r_item_api_type.fetch();
                let poTableLineItem3 = [];

                //Fetch the api type data 


                // fetch Next Dependent DropDown
                const { ddInvoiceTypes, ddInvoiceCycle } = this.fnGetPoLineItemDropDownMapping(poLineItemRow.item_category, poLineItemRow.invoice_type);
                const sTableIdentifier = this.fnGetTableNameFromMapping(poLineItemRow.item_category, poLineItemRow.invoice_type, poLineItemRow.invoice_cycle);

                const l2 = {
                    isPoRowEditable,
                    rowID: poLineItemRow.soitem,
                    isThisTableExpanded: false,
                    ddInvoiceTypes,
                    ddInvoiceCycle,
                    ddSelectedItemCategory: poLineItemRow.item_category,
                    ddSelectedItemCategory_BACKUP: poLineItemRow.item_category,
                    Quantity: poLineItemRow.item_pd_or_qty,
                    Quantity_BACKUP: poLineItemRow.item_pd_or_qty,
                    Rate: poLineItemRow.rate,
                    Rate_BACKUP: poLineItemRow.rate,
                    Unit: poLineItemRow.unit,
                    GrossValue: poLineItemRow.item_value,
                    GrossValue_BACKUP: poLineItemRow.item_value,
                    ddSelectedInvoiceType: poLineItemRow.invoice_type,
                    ddSelectedInvoiceType_BACKUP: poLineItemRow.invoice_type,
                    ddSelectedInvoiceCycle: poLineItemRow.invoice_cycle,
                    ddSelectedInvoiceCycle_BACKUP: poLineItemRow.invoice_cycle,
                    StartDate: this.fnConvertJsToUi5Date(poLineItemRow.start_date),
                    isStartDateEditable: true,
                    EndDate: this.fnConvertJsToUi5Date(poLineItemRow.end_date),
                    EndDate_BACKUP: this.fnConvertJsToUi5Date(poLineItemRow.end_date),
                    MinimumBillingRate: poLineItemRow.minimum_monthy_rate,
                    MinimumBillingRateEnabled: poLineItemRow.item_category === "API",
                    ddSelectedPOSubscription: this.selectedPoSubscription.length ? this.selectedPoSubscription.map((item) => item.api_type) : [],
                    aSavedPoSubscriptionIdMap: this.selectedPoSubscription.length ? this.selectedPoSubscription.map((item) => ({ subscriptionKey: item.api_type, subscriptionId: item.table_id })) : [],
                    unitSubscriptionEnabled: poLineItemRow.item_category === "API" || poLineItemRow.item_category === "USRSUBSCR",
                    PerAPIPrice: poLineItemRow.per_api_price,
                    BalanceAmountEditable: isPoRowEditable,
                    BalanceAmount: poLineItemRow.balance_amount,
                    aLastLineItemTable: [],
                    aLastLineItemTableIdentity: sTableIdentifier
                };

                //PO Details Table 3
                if ((await poLineItemRow.r_billing_new.fetch()).length) {
                    const poTableLineItem3 = await poLineItemRow.r_billing_new.fetch();

                    const l3 = [];
                    for (let k = 0; k < poTableLineItem3.length; k++) {
                        const element = poTableLineItem3[k];
                        l3.push({
                            isPoRowEditable,
                            rowID: element.billing_milestone,
                            amount: element.amount,
                            date: this.fnConvertJsToUi5Date(element.actual_date),
                            description: element.billing_milestone_name,
                            percentage: element.percentage,
                            percentageDisplay: Number(element.percentage).toFixed(2),
                            status: element.status,
                            invoice_date: this.fnConvertJsToUi5Date(element.invoice_date),
                            invoice_number: element.invoice_no,
                            attachSignUpDocFileName: element.signupdoc.name,
                            signupDocDownloaded: element.signupdoc,
                            remark: element.remark
                        });
                    }

                    l2.aLastLineItemTable = l3;
                } else if ((await poLineItemRow.r_schedule_new.fetch()).length) {
                    const poTableLineItem3 = await poLineItemRow.r_schedule_new.fetch();

                    const l3 = [];
                    for (let k = 0; k < poTableLineItem3.length; k++) {
                        const element = poTableLineItem3[k];
                        l3.push({
                            isPoRowEditable,
                            rowID: element.schedule_no,
                            description: element.description,
                            startDate: this.fnConvertJsToUi5Date(element.start__date),
                            endDate: this.fnConvertJsToUi5Date(element.end_date),
                            amount: element.expected_amount,
                            billdate: this.fnConvertJsToUi5Date(element.actual_date),
                            invoiceStatus: element.status,
                            invoice_date: this.fnConvertJsToUi5Date(element.invoice_date),
                            invoice_number: element.invoice_no,
                            attachSignUpDocFileName: element.signupdoc.name,
                            signupDocDownloaded: element.signupdoc,
                            remark: element.remark
                        });
                    }

                    l2.aLastLineItemTable = l3;

                    // Disable Start Date from being Edited for paid invoices
                    const paidInvoiceRow = l3.find(({ invoiceStatus }) => (invoiceStatus === 'Paid' || invoiceStatus === 'Invoiced'));
                    l2.isStartDateEditable = paidInvoiceRow ? false : true;
                } else if ((await poLineItemRow.r_vol_based_new.fetch()).length) {
                    const poTableLineItem3 = await poLineItemRow.r_vol_based_new.fetch();

                    const l3 = [];
                    for (let k = 0; k < poTableLineItem3.length; k++) {
                        const element = poTableLineItem3[k];
                        l3.push({
                            isPoRowEditable,
                            rowID: element.billing_milestone,
                            description: element.milestone_description,
                            Quantity: element.quantity,
                            amount: element.amount,
                            startDate: this.fnConvertJsToUi5Date(element.start_date),
                            endDate: this.fnConvertJsToUi5Date(element.end_date),
                            milestoneDate: this.fnConvertJsToUi5Date(element.milestone_date),
                            invoiceStatus: element.invoice_status,
                            invoice_date: this.fnConvertJsToUi5Date(element.invoice_date),
                            invoice_number: element.invoice_no,
                            attachSignUpDocFileName: element.signupdoc.name,
                            signupDocDownloaded: element.signupdoc,
                            remark: element.remark
                        });
                    }
                    l2.aLastLineItemTable = l3;
                }

                l1.aPoLineItemTable.push(l2);
            }

            finalTable.push(l1);
        }

        if (so_info[0].s_status === "Archived") {
            // No Button Show
        }
        else if (isReturnBackExist || isPendingPoExistForSameUser) {
            this.showTopButtons(["EDIT"]);
        }

        oModel.setProperty("/poHeaderTable", finalTable);

        this.checkAndSetPoItemCategoryDropDown();

        if (finalTable.length > 0) {
            this.fnPerformSumOfTotalPDs();
            this.fnPerformSumOfTotalGrossWithoutTax();
        }

        //Profit Center
        this.profit_center = await so_info[0].r_profit_center.fetch();
        // projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, 'so_id': so_info[0].so, partialSelected: ['profit_center', 'project_id'] });

        // TBL
        const profitCenterTable: Array<any> = [];
        const loginUserRole = sap.ui.getCore().getModel("mPageData").getProperty("/loginUserRole");
        const loginProfitCenters = sap.ui.getCore().getModel("mPageData").getProperty("/loginProfitCenters");

        for (let i = 0; i < this.profit_center.length; i++) {
            const oProfitCentre = this.profit_center[i];
            // let projectIdData = projectData.filter((item) => item.profit_center == oProfitCentre.profit_center);

            // Decide Who will click on Project Id Link Visible In Table
            let projectIdClickable = false;
            if (loginUserRole === 'MANAGER' || loginUserRole === 'TEAM_HEAD') {
                // if (loginProfitCenters.includes(oProfitCentre.profit_center)) {
                if (oProfitCentre.project_manager.toLowerCase() == sap.ui.getCore().getModel("mPageData").getProperty("/loginUserId") || oProfitCentre.team_head.toLowerCase() == sap.ui.getCore().getModel("mPageData").getProperty("/loginUserId")) {
                    projectIdClickable = true;
                }
            }

            profitCenterTable.push({
                rowID: oProfitCentre.pc_number,
                profitCentre: oProfitCentre.profit_center,
                percentage: oProfitCentre.percentage,
                pDs: oProfitCentre.pds,
                projectPDs: oProfitCentre.project_pds,
                projectLead: oProfitCentre.project_lead,
                manager: oProfitCentre.project_manager,
                teamHeadSelected: oProfitCentre.team_head,
                primaryPc: oProfitCentre.primary_profit_center,
                projectID: oProfitCentre.project_id,//projectIdData.length > 0 ? projectIdData[0].project_id : '',
                projectIdClickable
            });
        }

        oModel.setProperty("/profitCenterTable", profitCenterTable);

        //Functional Area
        this.functional_area = await so_info[0].r_functional_area.fetch();
        // TBL
        const functionalAreaTable: Array<any> = [];
        for (let i = 0; i < this.functional_area.length; i++) {
            const oFunctionalArea = this.functional_area[i];

            functionalAreaTable.push({
                rowID: oFunctionalArea.fa_number,
                functionalAreaSelected: oFunctionalArea.functional_area,
                percentage: oFunctionalArea.percentage,
                pDs: oFunctionalArea.amount,
            });
        }

        oModel.setProperty("/functionalAreaTable", functionalAreaTable);

        //Travel Data Start
        this.travel_table_data = await so_info[0].r_so_travel_reimb.fetch();
        // TBL
        const travelTable: Array<any> = [];
        for (let i = 0; i < this.travel_table_data.length; i++) {
            const oTravel = this.travel_table_data[i];

            let currency_code = oTravel.currency_code;

            if (!(oTravel.currency_code)) {
                currency_code = this.getReimburseCurrencyCode(oTravel.travel_type, oTravel.city)
            }

            travelTable.push({
                rowID: oTravel.reimb_id,
                travelTypeSelected: oTravel.travel_type,
                toCityDropdown: this.getTavelCityDropDown(oTravel.travel_type),
                toCitySelected: oTravel.city,
                standardReimburse: oTravel.standard_reimb,
                applicableReimburse: oTravel.applicable_reimb,
                currency: currency_code
            });
        }

        oModel.setProperty("/tableTravel", travelTable);
        //Travel Data End

        // Comments And Flow
        this.fnFetchAndRefillComments(oModel, so_info[0], true);

        this.fnShowBusyDialog(false);
    }

    public async fnFetchAndRefillComments(oModel: any, header_detail: any, isFirstAutoCreate = false) {
        let comment = await header_detail.r_comment.fetch();

        // Comments And Flow
        const aCommentsAndFlow = [];
        comment.forEach((element) => {
            aCommentsAndFlow.push({
                action: element.status,
                date: element.mime_type,
                time: element.curr_time,
                actionBy: element.s_created_by + " | " + element.user_name,
                Comment: element.comment,
            });
        });

        // Custom function to compare dates and times
        function compareDateTime(a: any, b: any) {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB.getTime() - dateA.getTime();
        }

        // Sort the array
        aCommentsAndFlow.sort(compareDateTime);

        // Set Arr Value Into Table
        oModel.setProperty("/commentsAndFlowTable", aCommentsAndFlow);
        if (isFirstAutoCreate) this.dataFillOnCommLine1();
    }

    public async onDownloadSignupDoc(oEvent: Event) {
        const path = oEvent.getSource().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/signupDocDownloaded");
        await qq.downloadAttachP();
    }

    // ============================== [ Server Logic ] =====================================

    public async fnSubmitData() {
        if (!this.fnValidateDataBeforeSubmit()) {
            return;
        }

        this.fnShowBusyDialog(true, "Submitting");

        this.saveFlag = "true";
        if (this.header_detail == undefined) {
            let so = await this.transaction.getQueryP("d_o2c_so_hdr");
            so.setLoadAll(true);
            let so_hdr = await so.executeP();
            this.header_detail = await so_hdr.newEntityP(0, { s_object_type: -1 });
        }
        //PS TO SO
        else {
            const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
            const order_type = this.header_detail.type;
            if (
                (data.orderTypeSelected == "SO" &&
                    order_type == "PS" &&
                    this.header_detail.s_status == "Approved") ||
                this.header_detail.pstoso == 1
            ) {
                this.header_detail.s_status = "New";
                this.header_detail.pstoso = 1;
                //PS to SO change Date
                this.header_detail.order_type_change = new Date();
            }
        }

        if (
            this.header_detail.s_status == "Save As Draft" ||
            this.header_detail.s_status == undefined
        ) {
            this.header_detail.s_status = "New";
        }
        await this.dataFillInTable();
        await this.validationSO();
        await this.onSave();
    }

    public async dataFillInTable() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");

        //Header Details
        this.header_detail.company = data.companyCode;
        this.header_detail.business_area = data.businessAreaSelected;
        this.header_detail.type = data.orderTypeSelected;
        this.header_detail.duration_week = data.durationInWeeks;
        this.header_detail.s_created_on = data.createdOn;
        this.header_detail.s_created_by = data.createdById;
        this.header_detail.total_pds = data.poSumOfpDs;

        //Project Details
        this.header_detail.project_name = data.project_name;
        this.header_detail.office_calendar = data.office_calendar;
        this.header_detail.project_start_date = new Date(data.project_start_date);
        this.header_detail.project_end_date = new Date(data.project_end_date);
        this.header_detail.product_type = data.productType;

        //Customer Details
        this.header_detail.bill_to_customer = data.bill_to_customer;
        this.header_detail.bill_to_address = data.bill_to_address;
        this.header_detail.currency = data.currency;
        this.header_detail.currency_exc_rate = data.currExchangeRate;
        this.header_detail.parent_po = data.parent_po;
        this.header_detail.external_number = data.external_number;

        //Sales Team
        this.header_detail.pre_sales = data.preSalesBySelected;
        this.header_detail.sales_responsible = data.salesResponsibleSelected;

        //Onsite Rules
        const onsite_value = data.onSiteRadioButton.yes;
        this.header_detail.onsite_required = onsite_value;
        this.header_detail.reimbursement_remark = data.reimbursement_remark;
        this.header_detail.reimbursement_rules = data.reimbursement_rules;

        //code for travel ---24 Jan 25
        const travelData = this.travel_table_data;
        for (let i = 0; i < data.tableTravel.length; i++) {
            //const { travelTypeSelected, toCitySelected, standardReimburse, applicableReimburse } = tableTravel[i];

            // TODO : ALBIA use variable travelTypeSelected, toCitySelected, standardReimburse, applicableReimburse
            if (i >= travelData.length) {
                const travel = await this.transaction.getQueryP("d_o2c_so_travel_reimb");
                travel.setLoadAll(true);
                const so_travel = await travel.executeP();
                travelData[i] = await so_travel.newEntityP(0, { s_object_type: -1 });
            }
            travelData[i].so_guid = this.header_detail.so_guid;
            travelData[i].travel_type = data.tableTravel[i].travelTypeSelected;
            travelData[i].city = data.tableTravel[i].toCitySelected;
            travelData[i].standard_reimb = data.tableTravel[i].standardReimburse;
            travelData[i].applicable_reimb = data.tableTravel[i].applicableReimburse;
            travelData[i].currency_code = data.tableTravel[i].currency;

        }

        const so_guid_data = this.header_detail.so_guid;

        //Profit Center
        let profitData = this.profit_center;
        for (let i = 0; i < data.profitCenterTable.length; i++) {
            if (i >= profitData.length) {
                const profit = await this.transaction.getQueryP("d_o2c_so_profit");
                profit.setLoadAll(true);
                const so_profit = await profit.executeP();
                profitData[i] = await so_profit.newEntityP(0, { s_object_type: -1 });
            }
            profitData[i].so_guid = so_guid_data;
            profitData[i].profit_center = data.profitCenterTable[i].profitCentre;
            profitData[i].percentage = data.profitCenterTable[i].percentage;
            profitData[i].pds = data.profitCenterTable[i].pDs;
            profitData[i].project_pds = data.profitCenterTable[i].projectPDs
            profitData[i].project_manager = data.profitCenterTable[i].manager;
            profitData[i].project_lead = data.profitCenterTable[i].projectLead;
            profitData[i].team_head = data.profitCenterTable[i].teamHeadSelected;
            profitData[i].primary_profit_center = data.profitCenterTable[i].primaryPc;
        }

        //Functional Area
        let funcData = this.functional_area;
        for (let i = 0; i < data.functionalAreaTable.length; i++) {
            if (i >= funcData.length) {
                const fun_area = await this.transaction.getQueryP("d_o2c_so_func_area");
                fun_area.setLoadAll(true);
                const so_fun_area = await fun_area.executeP();
                funcData[i] = await so_fun_area.newEntityP(0, { s_object_type: -1 });
            }
            funcData[i].so_guid = so_guid_data;
            funcData[i].functional_area =
                data.functionalAreaTable[i].functionalAreaSelected;
            funcData[i].amount = data.functionalAreaTable[i].pDs;
            funcData[i].percentage = data.functionalAreaTable[i].percentage;
        }

        //Customer Contact
        let contactData = this.contact_detail;
        for (let i = 0; i < data.customerContactTable.length; i++) {
            if (i >= contactData.length) {
                const contact = await this.transaction.getQueryP("d_o2c_so_contact");
                contact.setLoadAll(true);
                const so_contact = await contact.executeP();
                contactData[i] = await so_contact.newEntityP(0, { s_object_type: -1 });
            }
            contactData[i].so_guid = so_guid_data;
            contactData[i].contact_identifer =
                data.customerContactTable[i].contact_id;
            contactData[i].contact_name = data.customerContactTable[i].contact_id;
            contactData[i].contact_role = data.customerContactTable[i].contact_role;
            contactData[i].contact_details_for_followup =
                data.customerContactTable[i].contact_number;
            contactData[i].email = data.customerContactTable[i].email_id;
            contactData[i].sales_responsible =
                data.customerContactTable[i].billingResponsible;
        }
        //PO Details
        // let poTableLineItem1 = this.poTableLineItem1;
        for (let i = 0; i < data.poHeaderTable.length; i++) {
            const element = data.poHeaderTable[i];

            let POTableData = this.poTableLineItem1.filter((item) => item.attachment_id == element.rowID);
            if (!POTableData.length) {
                const attachment = await this.transaction.getQueryP("d_o2c_so_attachment");
                attachment.setLoadAll(true);
                const so_attachment = await attachment.executeP();
                POTableData[0] = await so_attachment.newEntityP(0, { s_object_type: -1, approval_status: "New" });
                // PO ID ASSIGN ; Line Item 1
                element.rowID = POTableData[0].attachment_id;
                this.poTableLineItem1.push(POTableData[0]);
                // sap.ui.getCore().getModel("mPageData").setProperty("/poHeaderTable/" + i + "/rowID",poTableLineItem1[i].attachment_id);
            }

            POTableData[0].so_guid = so_guid_data;
            if (POTableData[0].approval_status == "Save As Draft" || POTableData[0].approval_status == "Return Back") {
                POTableData[0].approval_status = "New";
            }
            // if (POTableData[0].approval_status == "Return Back") {
            //     POTableData[0].approval_status = "New";
            // }
            POTableData[0].attachment_type = element.DocType;
            // File - Start
            if (element.AttachedCopy != "")
                await POTableData[0].attach_copy.setAttachmentP(element.AttachedCopy, element.AttachedCopy.name);
            if (element.ProposalCopy != "")
                await POTableData[0].personal_copy.setAttachmentP(element.ProposalCopy, element.ProposalCopy.name);
            // File - End
            POTableData[0].po_no = element.PONumber;
            POTableData[0].cr_no = element.CRNumber;
            POTableData[0].po_date = new Date(element.PODate);
            POTableData[0].gross_value = element.GrossValue;
            POTableData[0].budgeted_pd = element.BudgetedPD;
            POTableData[0].project_pds = element.projectPD;
            POTableData[0].cr_rate = element.CRRate;
            POTableData[0].tax_checked = element.TaxChecked;
            POTableData[0].so_remark = element.Remark;

            //addPOChilds
            const po_line_item = element.aPoLineItemTable;
            let poTableLineItem2 = [];
            poTableLineItem2 = await this.transaction.getExecutedQuery("d_o2c_so_item", { loadAll: true, attachment_id: element.rowID, expandAll: 'r_item_api_type' });
            // let item_count = poTableLineItem2.length;
            for (let j = 0; j < po_line_item.length; j++) {

                const item_element = po_line_item[j];
                let itemTableData = poTableLineItem2.filter((item) => item.soitem == item_element.rowID);
                if (!itemTableData.length) {
                    const item = await this.transaction.getQueryP("d_o2c_so_item");
                    item.setLoadAll(true);
                    const so_item = await item.executeP();
                    itemTableData[0] = await so_item.newEntityP(0, { s_object_type: -1 });
                    // PO ID ASSIGN ; Line Item 2
                    // sap.ui.getCore().getModel("mPageData").setProperty("/poHeaderTable/" + i + "/aPoLineItemTable/" + j + "/rowID",poTableLineItem2[j].soitem);
                    item_element.rowID = itemTableData[0].soitem;
                    poTableLineItem2.push(itemTableData[0]);
                }
                itemTableData[0].so_guid = so_guid_data;
                itemTableData[0].attachment_id = element.rowID;
                itemTableData[0].po_no = element.PONumber;
                itemTableData[0].item_category = item_element.ddSelectedItemCategory;
                itemTableData[0].item_pd_or_qty = item_element.Quantity;
                itemTableData[0].rate = item_element.Rate;
                itemTableData[0].unit = item_element.Unit;
                itemTableData[0].item_value = itemTableData[0].rate * itemTableData[0].item_pd_or_qty;
                itemTableData[0].invoice_type = item_element.ddSelectedInvoiceType;
                itemTableData[0].invoice_cycle = item_element.ddSelectedInvoiceCycle;
                itemTableData[0].start_date = new Date(item_element.StartDate);
                itemTableData[0].end_date = new Date(item_element.EndDate);
                itemTableData[0].minimum_monthy_rate = item_element.MinimumBillingRate;
                for (let i = 0; i < item_element.ddSelectedPOSubscription.length; i++) {
                    //apiTypeData = item_element.ddSelectedPOSubscription[i] + "," + apiTypeData;
                    let rowTableID = item_element.aSavedPoSubscriptionIdMap?.filter((item) => item.subscriptionKey == item_element.ddSelectedPOSubscription[i]);
                    let apiTypeData = rowTableID.length ? (itemTableData[0].r_item_api_type?.filter((item) => item.table_id == rowTableID[0].subscriptionId)) : [];
                    if (!apiTypeData.length) {
                        const apitype = await this.transaction.getQueryP("d_o2c_so_api_type");
                        apitype.setLoadAll(true);
                        const api_type = await apitype.executeP();
                        apiTypeData[0] = await api_type.newEntityP(0, { s_object_type: -1 });
                        item_element.apiTypeRowID = apiTypeData[0].table_id;
                        this.selectedPoSubscription.push(apiTypeData[0]);
                    }
                    apiTypeData[0].so_guid = so_guid_data;
                    apiTypeData[0].soitem = item_element.rowID;
                    apiTypeData[0].api_type = item_element.ddSelectedPOSubscription[i];

                }
                //itemTableData[0].api_type = apiTypeData.substring(0, apiTypeData.length - 1);
                itemTableData[0].per_api_price = item_element.PerAPIPrice;
                itemTableData[0].balance_amount = item_element.BalanceAmount;

                //For hara patti
                const sTableIdentifier = item_element.aLastLineItemTableIdentity;

                if (sTableIdentifier != "") {
                    const o2cTableMapping = {
                        TABLE_MILESTONE_BASED: "d_o2c_so_milestone",
                        TABLE_VOLUME_BASED: "d_o2c_volume_based",
                        TABLE_SCHEDULE_BASED: "d_o2c_so_schedule",
                    }[sTableIdentifier];

                    const propertyMapping = {
                        d_o2c_so_milestone: "billing_milestone",
                        d_o2c_volume_based: "billing_milestone", // Replace with the actual property if needed
                        d_o2c_so_schedule: "schedule_no",
                    };

                    let targetProperty = propertyMapping[o2cTableMapping];

                    const aLastLineItemTable = item_element.aLastLineItemTable;
                    let billing_element;
                    //checks
                    let poTableLineItem3 = [];
                    poTableLineItem3 = await this.transaction.getExecutedQuery(o2cTableMapping, { loadAll: true, soitem: item_element.rowID });


                    for (let k = 0; k < aLastLineItemTable.length; k++) {
                        billing_element = aLastLineItemTable[k];
                        let billingTableData = poTableLineItem3.filter((item) => item[targetProperty] == billing_element.rowID);
                        if (!billingTableData.length) {
                            //  o2cTableMapping - > use this variable;
                            const lastTable = await this.transaction.getQueryP(o2cTableMapping);
                            lastTable.setLoadAll(true);
                            const soLastTable = await lastTable.executeP();
                            billingTableData[0] = <d_o2c_so_milestone>(await soLastTable.newEntityP(0, { s_object_type: -1 }));
                            billing_element.rowID = billingTableData[0][targetProperty];
                            poTableLineItem2.push(billingTableData[0]);
                        }
                        if (o2cTableMapping == "d_o2c_so_milestone") {
                            billingTableData[0].soitem = item_element.rowID;
                            billingTableData[0].amount = billing_element.amount;
                            billingTableData[0].actual_date = new Date(billing_element.date);
                            billingTableData[0].billing_milestone_name = billing_element.description;
                            billingTableData[0].percentage = billing_element.percentage;
                            billingTableData[0].status = billing_element.status;
                            billingTableData[0].invoice_date = new Date(billing_element.invoice_date);
                            billingTableData[0].invoice_no = billing_element.invoice_number;
                            billingTableData[0].invoice_remark = billing_element.remark;
                        }
                        if (o2cTableMapping == "d_o2c_volume_based") {
                            billingTableData[0].soitem = item_element.rowID;
                            billingTableData[0].milestone_description = billing_element.description;
                            billingTableData[0].quantity = billing_element.Quantity;
                            billingTableData[0].amount = billing_element.amount;
                            billingTableData[0].milestone_date = new Date(billing_element.milestoneDate);
                            billingTableData[0].invoice_status = billing_element.invoiceStatus;
                            billingTableData[0].invoice_date = new Date(billing_element.invoice_date);
                            billingTableData[0].invoice_no = billing_element.invoice_number;
                            billingTableData[0].invoice_remark = billing_element.remark;
                            billingTableData[0].start_date = new Date(billing_element.startDate);
                            billingTableData[0].end_date = new Date(billing_element.endDate);
                        }
                        if (o2cTableMapping == "d_o2c_so_schedule") {
                            billingTableData[0].soitem = item_element.rowID;
                            billingTableData[0].description = billing_element.description;
                            billingTableData[0].end_date = new Date(billing_element.endDate);
                            billingTableData[0].start__date = new Date(billing_element.startDate);
                            billingTableData[0].expected_amount = billing_element.amount;
                            billingTableData[0].actual_date = new Date(billing_element.billdate);
                            billingTableData[0].status = billing_element.invoiceStatus;
                            billingTableData[0].invoice_date = new Date(billing_element.invoice_date);
                            billingTableData[0].invoice_no = billing_element.invoice_number;
                            billingTableData[0].invoice_remark = billing_element.remark;
                        }
                        /*if (k == aLastLineItemTable.length - 1)
                                                    this.count = this.count + k + 1;*/
                    }
                }
            }

        }
        // //addPOChilds
        // for (let i = 0; i < data.poHeaderTable.length; i++) {
        //     const po_line_item = data.poHeaderTable[i].aPoLineItemTable;
        //     let poTableLineItem2 = [];
        //     poTableLineItem2 = await this.transaction.getExecutedQuery("d_o2c_so_item",{ loadAll: true, attachment_id: data.poHeaderTable[i].rowID });
        //     let item_count = poTableLineItem2.length;

        //     for (let j = 0; j < po_line_item.length; j++) {
        //         if (j >= item_count) {
        //             const item = await this.transaction.getQueryP("d_o2c_so_item");
        //             item.setLoadAll(true);
        //             const so_item = await item.executeP();
        //             poTableLineItem2[j] = await so_item.newEntityP(0, {
        //                 s_object_type: -1,
        //             });
        //             // PO ID ASSIGN ; Line Item 2
        //             sap.ui.getCore().getModel("mPageData").setProperty("/poHeaderTable/" + i + "/aPoLineItemTable/" + j + "/rowID",poTableLineItem2[j].soitem);
        //         }
        //         poTableLineItem2[j].so_guid = so_guid_data;
        //         poTableLineItem2[j].attachment_id = data.poHeaderTable[i].rowID;
        //         poTableLineItem2[j].po_no = data.poHeaderTable[i].PONumber;
        //         poTableLineItem2[j].item_category = po_line_item[j].ddSelectedItemCategory;
        //         poTableLineItem2[j].item_pd_or_qty = po_line_item[j].Quantity;
        //         poTableLineItem2[j].rate = po_line_item[j].Rate;
        //         poTableLineItem2[j].unit = po_line_item[j].Unit;
        //         poTableLineItem2[j].item_value = poTableLineItem2[j].rate * poTableLineItem2[j].item_pd_or_qty;
        //         poTableLineItem2[j].invoice_type = po_line_item[j].ddSelectedInvoiceType;
        //         poTableLineItem2[j].invoice_cycle = po_line_item[j].ddSelectedInvoiceCycle;
        //         poTableLineItem2[j].start_date = new Date(po_line_item[j].StartDate);
        //         poTableLineItem2[j].end_date = new Date(po_line_item[j].EndDate);
        //         poTableLineItem2[j].minimum_monthy_rate = po_line_item[j].MinimumBillingRate;
        //         poTableLineItem2[j].per_api_price = po_line_item[j].PerAPIPrice;
        //         poTableLineItem2[j].balance_amount = po_line_item[j].BalanceAmount;
        //     }
        // }

        // for (let i = 0; i < data.poHeaderTable.length; i++) {
        //     const aPoLineItemTable = data.poHeaderTable[i].aPoLineItemTable;
        //     for (let j = 0; j < aPoLineItemTable.length; j++) {
        //         const sTableIdentifier = aPoLineItemTable[j].aLastLineItemTableIdentity;

        //         if (sTableIdentifier != "") {
        //             const o2cTableMapping = {
        //                 TABLE_MILESTONE_BASED: "d_o2c_so_milestone",
        //                 TABLE_VOLUME_BASED: "d_o2c_volume_based",
        //                 TABLE_SCHEDULE_BASED: "d_o2c_so_schedule",
        //             }[sTableIdentifier];

        //             const aLastLineItemTable = data.poHeaderTable[i].aPoLineItemTable[j].aLastLineItemTable;
        //             let element;
        //             //checks
        //             let poTableLineItem3 = [];
        //             poTableLineItem3 = await this.transaction.getExecutedQuery(o2cTableMapping, { loadAll: true, soitem: aPoLineItemTable[j].rowID });
        //             for (let k = 0; k < aLastLineItemTable.length; k++) {
        //                 element = aLastLineItemTable[k];
        //                 if (k >= poTableLineItem3.length) {
        //                     //  o2cTableMapping - > use this variable;
        //                     const lastTable = await this.transaction.getQueryP(
        //                         o2cTableMapping
        //                     );
        //                     lastTable.setLoadAll(true);
        //                     const soLastTable = await lastTable.executeP();
        //                     poTableLineItem3[k] = <d_o2c_so_milestone>(await soLastTable.newEntityP(0, { s_object_type: -1 }));
        //                 }
        //                 if (o2cTableMapping == "d_o2c_so_milestone") {
        //                     poTableLineItem3[k].soitem = aPoLineItemTable[j].rowID;
        //                     poTableLineItem3[k].amount = element.amount;
        //                     poTableLineItem3[k].actual_date = new Date(element.date);
        //                     poTableLineItem3[k].billing_milestone_name = element.description;
        //                     poTableLineItem3[k].percentage = element.percentage;
        //                     poTableLineItem3[k].status = element.status;
        //                     poTableLineItem3[k].invoice_date = new Date(element.invoice_date);
        //                     poTableLineItem3[k].invoice_no = element.invoice_number;
        //                 }
        //                 if (o2cTableMapping == "d_o2c_volume_based") {
        //                     poTableLineItem3[k].soitem = aPoLineItemTable[j].rowID;
        //                     poTableLineItem3[k].milestone_description = element.description;
        //                     poTableLineItem3[k].quantity = element.Quantity;
        //                     poTableLineItem3[k].amount = element.amount;
        //                     poTableLineItem3[k].milestone_date = new Date(element.Date);
        //                     poTableLineItem3[k].invoice_status = element.invoiceStatus;
        //                     poTableLineItem3[k].invoice_date = new Date(element.invoice_date);
        //                     poTableLineItem3[k].invoice_no = element.invoice_number;
        //                 }
        //                 if (o2cTableMapping == "d_o2c_so_schedule") {
        //                     poTableLineItem3[k].soitem = aPoLineItemTable[j].rowID;
        //                     poTableLineItem3[k].description = element.description;
        //                     poTableLineItem3[k].end_date = new Date(element.endDate);
        //                     poTableLineItem3[k].start__date = new Date(element.startDate);
        //                     poTableLineItem3[k].expected_amount = element.amount;
        //                     poTableLineItem3[k].actual_date = new Date(element.billdate);
        //                     poTableLineItem3[k].status = element.invoiceStatus;
        //                     poTableLineItem3[k].invoice_date = new Date(element.invoice_date);
        //                     poTableLineItem3[k].invoice_no = element.invoice_number;
        //                 }
        //                 /*if (k == aLastLineItemTable.length - 1)
        //                                             this.count = this.count + k + 1;*/
        //             }
        //         }
        //     }
        // }
        // Variable
        if (this.header_detail.s_status != "Save As Draft" && this.saveFlag == "true") {
            let comment_status = this.header_detail.s_status;
            if (comment_status == "New")
                await this.dataFillOnComment("Submitted");
            else if (comment_status == "Pending" || comment_status == "Approved")
                await this.dataFillOnComment("Changed");
            else await this.dataFillOnComment("Re-Submitted");
        }
    }

    public async fnSaveAsDraftData() {
        this.fnShowBusyDialog(true, "Drafting");
        this.saveFlag = "false";
        if (this.header_detail == undefined) {
            let so = await this.transaction.getQueryP("d_o2c_so_hdr");
            so.setLoadAll(true);
            let so_hdr = await so.executeP();
            this.header_detail = await so_hdr.newEntityP(0, { s_object_type: -1 });
        }
        //PS TO SO
        else {
            const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
            const order_type = this.header_detail.type;
            if (
                data.orderTypeSelected == "SO" &&
                order_type == "PS" &&
                this.header_detail.s_status == "Approved"
            ) {
                //this.header_detail.s_status = "New";
                this.header_detail.pstoso = 1;
            }
        }
        if (
            this.header_detail.s_status != "Back To Edit" &&
            this.header_detail.s_status != "Approved"
        )
            this.header_detail.s_status = "Save As Draft";
        await this.dataFillInTable();
        await this.onSave();
    }

    public async validationSO() {
        const oModel = sap.ui.getCore().getModel("mPageData");

        let temp_header_detail: ValidationError[] =
            await this.header_detail.validateP();
        let temp = temp_header_detail;

        temp_header_detail.forEach((el) => {
            this.fnResetSetValueStateErrorNoActPath(el.propertyID, true, el.message);
        });

        for (let i = 0; i < this.profit_center.length; i++) {
            let temp_profit_center: ValidationError[] = await this.profit_center[
                i
            ].validateP();
            temp = temp.concat(temp_profit_center);
        }
        for (let i = 0; i < this.functional_area.length; i++) {
            let temp_functional_area: ValidationError[] = await this.functional_area[
                i
            ].validateP();
            temp = temp.concat(temp_functional_area);
        }
        for (let i = 0; i < this.contact_detail.length; i++) {
            let temp_contact_detail: ValidationError[] = await this.contact_detail[
                i
            ].validateP();
            temp = temp.concat(temp_contact_detail);
        }

        for (let i = 0; i < this.poTableLineItem1.length; i++) {
            let temp_poTableLineItem1: ValidationError[] =
                await this.poTableLineItem1[i].validateP();
            temp = temp.concat(temp_poTableLineItem1);
        }
        for (let i = 0; i < this.poTableLineItem2.length; i++) {
            let temp_poTableLineItem2: ValidationError[] =
                await this.poTableLineItem2[i].validateP();
            temp = temp.concat(temp_poTableLineItem2);
        }
        for (let i = 0; i < this.poTableLineItem3.length; i++) {
            let temp_poTableLineItem3: ValidationError[] =
                await this.poTableLineItem3[i].validateP();
            temp = temp.concat(temp_poTableLineItem3);
        }

        if (temp.length > 0) {
            let oBusyDailog = new sap.m.BusyDialog().open();
            await this.openDialog("pa_dialog");
            this.tm.getTN("error_id").setData(temp);
            oBusyDailog.close();
        }
        //Parent PO Gross value must be equal to that of there sum of child's gross value
        // const data = sap.ui.getCore().getModel("mPageData").getProperty('/');
        // for (let i = 0; i < data.poHeaderTable.length; i++) {
        //     const po_line_item = data.poHeaderTable[i].aPoLineItemTable
        //     let totalIteamGrossValue = 0;
        //     for (let j = 0; j < po_line_item.length; j++) {
        //         totalIteamGrossValue = totalIteamGrossValue + po_line_item[j].GrossValue;
        //         if (data.poHeaderTable[i].GrossValue != totalIteamGrossValue) {
        //             sap.m.MessageBox.error("PO Gross value is not equal to Item Gross value.", {
        //                 title: "Error",                                      // default
        //                 onClose: null,                                       // default
        //                 styleClass: "",                                      // default
        //                 actions: sap.m.MessageBox.Action.CLOSE,              // default
        //                 emphasizedAction: null,                              // default
        //                 initialFocus: null,                                  // default
        //                 textDirection: sap.ui.core.TextDirection.Inherit
        //             });
        //         }
        //     }
        // }
    }

    public async onSave() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        if (this.saveFlag == "true") {
            this.fnShowBusyDialog(false);
            //Update the data in Project
            if (this.header_detail.s_status == "Approved" || this.header_detail.s_status == "Closed") {
                await this.alreadyCreatedProject();
            }
            await this.tm.commitP("Save successfull", "Save Failed", true, true);
            const newPO = await this.transaction.getExecutedQuery(
                "d_o2c_so_attachment",
                { so_guid: this.header_detail.so_guid }
            );
            if (this.header_detail.s_status == "New" || this.header_detail.s_status == "Back To Edit" || this.header_detail.s_status == "Call Back") {
                for (let i = 0; i < newPO.length; i++) {
                    if (this.header_detail.s_status != "Back To Edit" || this.header_detail.s_status == "Call Back")
                        newPO[i].approval_status = "Pending";
                    else {
                        if (newPO[i].approval_status != "Approved" && newPO[i].approval_status != "New")
                            newPO[i].approval_status = "Pending";
                    }
                }
                //Auto-approved for the NBS, ISP, PSL, Emp Training
                if (this.header_detail.type != "SO" && this.header_detail.type != "PS") {
                    let approvalCycle = this.maxApprovalCycle + 1;
                    this.header_detail.approval_cycle = approvalCycle;
                    this.header_detail.s_status = "Approved";
                    await this.dataFillOnComment("Auto Approved as order type is " + this.header_detail.type);
                    //Create the data in the approval Flow Table for Team Head & Finance as auto-approved status---START
                    for (let i = 0; i < this.profit_center.length; i++) {
                        await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: this.header_detail.company, approval_cycle: approvalCycle, profit_center_name: this.profit_center[i].profit_center, pending_with_role: "TEAM_HEAD", insert_datetime: new Date(), approval_status: "Auto-Approved", approved_type: "New" }, true);
                    }
                    await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: this.header_detail.company, approval_cycle: approvalCycle, pending_with_role: "FINANCE", insert_datetime: new Date(), approval_status: "Auto-Approved", approved_type: "New" }, true);
                    await this.tm.commitP("This is Auto-Approved", "Auto-Approved Failed", true, true);
                    //PROJECT MANAGEMENT CREATION ----START
                    //Update and create the data in Project
                    await this.alreadyCreatedProject();
                    //PROJECT MANAGEMENT CREATION ----END

                }
                //Auto-approved for the NBS, ISP, PSL, Emp Training---END

                //For other order type except this NBS, ISP, PSL, Emp Training
                else {
                    await this.onSendForApproval();
                }
                await this.onSubmitMail();
            }

            let crnewPO = newPO.filter((item) => item.approval_status == "New");
            if (
                this.header_detail.s_status == "Approved" &&
                crnewPO.length != 0 &&
                this.header_detail.cr_status != "Open"
            ) {
                await this.onNewPoSendForApproval();
                //await this.tm.getTN("current_pending").setData({ 'action': this.header_detail.current_pending });
            }
            await this.postatusChanged();

            let userloginid = (await this.transaction.get$User()).login_id;
            if (this.header_detail.s_created_by == userloginid) {
                await this.navTo({ S: "p_sales_order_list" });
            } else {
                const login_status = await this.transaction.getExecutedQuery(
                    "d_o2c_so_approvall_flow",
                    {
                        so_no: this.header_detail.so,
                        approval_cycle: this.header_detail.approval_cycle,
                        pending_with_role: (await this.transaction.get$Role()).role_id,
                        approval_status: "Pending",
                    }
                );
                const login = this.tm.getTN("user_role").getData().role;
                if (login) {
                    // enable comment box
                    this.enableEditInputFields([4]);
                    // Top Buttons Reset
                    this.showTopButtons(["APPROVE", "BACK2EDIT", "EDIT"]);

                    this.fnFetchAndRefillComments(
                        sap.ui.getCore().getModel("mPageData"),
                        this.header_detail,
                        true
                    );
                } else {
                    await this.navTo({ S: "p_sales_order_list" });
                }
            }
        } else {
            this.fnShowBusyDialog(false);
            for (let i = 0; i < this.poTableLineItem1.length; i++) {
                if (this.poTableLineItem1[i].approval_status == "New")
                    this.poTableLineItem1[i].approval_status = "Save As Draft";
            }
            if (this.header_detail.s_status == "Approved")
                this.header_detail.cr_status = "Save As Draft";
            await this.tm.commitP(
                "Save As Draft",
                "Save As Draft Failed",
                true,
                false
            );
            sap.m.MessageBox.confirm(
                "Do you want to go back to the list or stay on the same page.",
                {
                    title: "Confirm",
                    actions: ["Stay", "Back"],
                    emphasizedAction: "Stay",
                    onClose: (oAction) => {
                        if (oAction == "Back") {
                            this.navTo({ S: "p_sales_order_list" });
                        }
                    },
                }
            );
        }

        if (this.header_detail.so != undefined)
            sap.ui
                .getCore()
                .getModel("mPageData")
                .setProperty("/soNumber", this.header_detail.so);
    }

    // Get Active Name
    public get_name(): string {
        let full_name: string;
        let activeUser = UserInfo.getActiveUser();
        if (activeUser) {
            let first_name = activeUser.r_first_name;
            let last_name = activeUser.r_last_name;

            if (last_name == null || last_name === "") {
                full_name = first_name;
            } else {
                full_name = first_name + " " + last_name;
            }
        } else {
            full_name = "";
        }
        return full_name;
    }

    public async onPressBackToEditBtn() {

        const currentSO = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, so: this.header_detail.so, partialSelected: "s_status", skipMap: true });
        let currStatus = currentSO[0].s_status;

        if (currStatus === "Call Back") {
            sap.m.MessageToast.show(this.header_detail.so + " is called back by the Creator.", { duration: 100000, width: "20em" });
            this.navTo({ S: "p_sales_order_list" });
        } else {
            // check comment before proceeding further
            const sPath = "/commentText";
            if (this.isInvalidInputBoxEntry(sPath, this.VALID_TYPES.TEXT, true)) {
                this.fnShowErrorPopup("Please enter a comment for the creator");
                return;
            }

            const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
            let login_id = (await this.transaction.get$User()).login_id;
            let role_id = (await this.transaction.get$Role()).role_id;

            let type = "";
            let soApprovalFlowLoginRole = [];
            if (this.header_detail.s_status == "Approved") {
                type = "CR";
                await this.currentApprovalCycle(type);
                soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: data.soNumber, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: type });
            } else {
                type = "New";
                await this.currentApprovalCycle(type);
                soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: data.soNumber, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: type });
            }
            let loginOrg = await this.transaction.getExecutedQuery("q_current_profit_center", { loadAll: true, employee_id: login_id, active_till: new Date(), });
            for (let i = 0; i < loginOrg.length; i++) {
                soApprovalFlowLoginRole = soApprovalFlowLoginRole.filter((item) => (item.pending_with_role == "TEAM_HEAD" && item.profit_center_name == loginOrg[i].profit_centre) || item.pending_with_role != "TEAM_HEAD");
                if (soApprovalFlowLoginRole.length > 0) break;
            }
            soApprovalFlowLoginRole[0].approval_status = "Return Back";
            soApprovalFlowLoginRole[0].action_by = login_id;
            const empName = this.employee_name_info.filter((item) => item.employee_id.toUpperCase() == login_id.toUpperCase());
            soApprovalFlowLoginRole[0].action_by_name = empName[0].full_name;

            if (this.header_detail.s_status != "Approved")
                this.header_detail.s_status = "Back To Edit";
            else {
                this.header_detail.cr_status = "Return Back";
                let poData = await this.transaction.getExecutedQuery("d_o2c_so_attachment", { loadAll: true, so_guid: this.header_detail.so_guid, approval_status: "Pending", });
                for (let i = 0; i < poData.length; i++) {
                    poData[i].approval_status = "Return Back";
                }
            }
            /*let comment_status = soApprovalFlowLoginRole[0].approval_status;
                    await this.dataFillOnComment(comment_status);
                    */
            sap.m.MessageBox.confirm(
                "This will be returned back to the creator for editing. Are you sure ?",
                {
                    title: "Confirm",
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: async (oAction) => {
                        if (oAction == "YES") {
                            let comment_status = soApprovalFlowLoginRole[0].approval_status;
                            await this.dataFillOnComment(comment_status);
                            this.dataFillOnCommLine1();
                            this.tm.commitP(
                                "Back To Edit Successfull",
                                "Back To Edit Failed",
                                true,
                                true
                            );

                            //on each reject flow mail noitfication to creator
                            await this.onRejectNotif();

                            this.showTopButtons([]);
                            this.navTo({ S: "p_sales_order_list" });
                        }
                        if (oAction == "NO") {
                        }
                    },
                }
            );
        }
    }

    public async onPressApproveBtn() {

        const currentSO = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, so: this.header_detail.so, partialSelected: "s_status", skipMap: true });
        let currStatus = currentSO[0].s_status;

        if (currStatus === "Call Back") {
            sap.m.MessageToast.show(this.header_detail.so + " is called back by the Creator.", { duration: 100000, width: "20em" });
            this.navTo({ S: "p_sales_order_list" });
        } else {
            // Todo
            let level;
            let allPOApprovalCount = 0;
            let loginProfitCenter = [];
            const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
            let login_id = (await this.transaction.get$User()).login_id;
            let loginOrg = await this.transaction.getExecutedQuery("q_current_profit_center", { loadAll: true, employee_id: login_id, active_till: new Date(), });
            let role_id = (await this.transaction.get$Role()).role_id;
            let type = "";
            let soApprovalFlowLoginRole = [];
            if (this.header_detail.s_status == "Approved") {
                type = "CR";
                await this.currentApprovalCycle(type);
                soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: data.soNumber, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: "CR", });
            } else {
                type = "New";
                await this.currentApprovalCycle(type);
                soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: data.soNumber, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: "New", });
            }
            let soApprovalFlowPending = soApprovalFlowLoginRole.filter((item) => item.approval_status == "Pending");
            let soApprovalFlowth = [];
            for (let i = 0; i < loginOrg.length; i++) {
                soApprovalFlowth = soApprovalFlowPending.filter((item) => (item.pending_with_role == "TEAM_HEAD" && item.profit_center_name == loginOrg[i].profit_centre) || item.pending_with_role != "TEAM_HEAD");
                if (soApprovalFlowth.length > 0) break;
            }
            for (let i = 0; i < soApprovalFlowth.length; i++) {
                soApprovalFlowth[i].approval_status = "Approved";
                soApprovalFlowth[i].action_by = login_id;
                const empName = this.employee_name_info.filter((item) => item.employee_id.toUpperCase() == login_id.toUpperCase());
                soApprovalFlowth[i].action_by_name = empName[0].full_name;
            }

            const soApprovalMaster = await this.transaction.getExecutedQuery("d_o2c_so_approval_master", { loadAll: true, so_type: data.orderTypeSelected, company_code: data.companyCode, business_area: data.businessAreaSelected, is_active: true });
            let currSoApprovalMaster = soApprovalMaster.filter((item) => item.role == soApprovalFlowPending[0].pending_with_role);

            let soAppFlowApprovedStatus = soApprovalFlowLoginRole.filter((item) => item.approval_status == "Approved");

            let empCountForRole = 0;
            if (currSoApprovalMaster[0].role != "TEAM_HEAD") {
                let currentRoleDes = await this.transaction.getExecutedQuery("q_design_count", { loadAll: true, name: currSoApprovalMaster[0].role, active_from: new Date().getTime(), active: new Date().getTime(), company_code: data.companyCode, business_area: data.businessAreaSelected, });
                empCountForRole = currentRoleDes.length;
            }
            //Need to add other role based condition
            if ((currSoApprovalMaster[0].consensus_approval == false && soAppFlowApprovedStatus.length >= 1) || (currSoApprovalMaster[0].consensus_approval == true && currSoApprovalMaster[0].role == "TEAM_HEAD" && this.profit_center.length <= soAppFlowApprovedStatus.length) || empCountForRole == soAppFlowApprovedStatus.length) {
                level = soApprovalMaster.filter((item) => item.level == currSoApprovalMaster[0].level + 1);
                if ((level.length && this.header_detail.s_status != "Approved") || (level.length && this.header_detail.s_status == "Approved" && currSoApprovalMaster[0].cr_approval == false)) {
                    if (level[0].role != "TEAM_HEAD")
                        await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: data.soNumber, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: level[0].role, insert_datetime: new Date(), approval_status: "Pending", approved_type: type }, true);
                    else {
                        for (let i = 0; i < this.profit_center.length; i++) {
                            let approvalFlow = await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: level[0].role, insert_datetime: new Date(), approval_status: "Pending", profit_center_name: this.profit_center[i].profit_center, approved_type: type }, true);
                        }
                    }
                } else {
                    for (let i = 0; i < this.poTableLineItem1.length; i++) {
                        this.poTableLineItem1[i].approval_status = "Approved";
                    }
                    if (this.header_detail.s_status == "Approved")
                        this.header_detail.cr_status = "Closed";
                    if (data.orderTypeSelected != "SO") {
                        let soApprovalFlowFinanceFilter = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, 'so_no': this.header_detail.so, 'approval_cycle': this.maxApprovalCycle, 'pending_with_role': "Finance" });
                        if (soApprovalFlowFinanceFilter.length == 0) {
                            await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: "Finance", insert_datetime: new Date(), approval_status: "Approved", approved_type: type }, true);
                        }
                    }
                    this.header_detail.s_status = "Approved";

                    //PROJECT MANAGEMENT CREATION ----START
                    //Update and create the data in Project
                    await this.alreadyCreatedProject();
                    //PROJECT MANAGEMENT CREATION ----END

                    //function call at last approval
                    await this.onFinalApproval();
                }
            } else {
                if (currSoApprovalMaster[0].role != "TEAM_HEAD")
                    await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: currSoApprovalMaster[0].role, insert_datetime: new Date(), approval_status: "Pending", approved_type: type }, true);
            }
            let comment_status = soApprovalFlowth[0].approval_status;
            await this.dataFillOnComment(comment_status);
            this.dataFillOnCommLine1();
            await this.tm.commitP("Approved Successfull", "Approved Failed", true, true);

            // Mail Notification
            await this.onApprovalMail();
            this.showTopButtons([]);
            await this.navTo({ S: "p_sales_order_list" });
        }
    }

    public async currentApprovalCycle(type) {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let soApprovalFlowData = await this.transaction.getExecutedQuery(
            "d_o2c_so_approvall_flow",
            { loadAll: true, so_no: data.soNumber, approved_type: type }
        );
        let approvalCycleData = [];
        for (let i = 0; i < soApprovalFlowData.length; i++) {
            approvalCycleData[i] = soApprovalFlowData[i].approval_cycle;
        }
        if (approvalCycleData.length)
            this.maxApprovalCycle = Math.max(...approvalCycleData);
        else this.maxApprovalCycle = 0;
    }

    public async onSendForApproval() {
        let approvalCycle = 1;
        // In Back To Edit, Call Back and convert to PS To SO...This approval Cycle will increase
        if (this.header_detail.s_status == "Back To Edit" || this.header_detail.pstoso == 1 || this.header_detail.s_status == "Call Back") {
            await this.currentApprovalCycle("New");
            approvalCycle = this.maxApprovalCycle + 1;
        }
        if (this.header_detail.s_status == "Approved") {
            await this.currentApprovalCycle("CR");
            if (this.maxApprovalCycle != 0) approvalCycle = this.maxApprovalCycle + 1;
            else {
                await this.currentApprovalCycle("New");
                approvalCycle = this.maxApprovalCycle;
            }
            await this.onCRCreationMail();
        }

        if (this.header_detail.s_status != "Approved") {
            this.header_detail.s_status = "Pending";
        }
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        const soApprovalMaster = await this.transaction.getExecutedQuery(
            "d_o2c_so_approval_master",
            {
                loadAll: true,
                so_type: data.orderTypeSelected,
                company_code: data.companyCode,
                business_area: data.businessAreaSelected,
                is_active: true,
                level: 1,
            }
        );
        if (soApprovalMaster.length) {
            //Approval Type in Approval Flow
            let type = "";
            if (this.header_detail.s_status == "Approved") {
                type = "CR";
            } else type = "New";

            if (soApprovalMaster[0].role == "TEAM_HEAD") {
                for (let i = 0; i < this.profit_center.length; i++) {
                    let approvalFlow = await this.transaction.createEntityP(
                        "d_o2c_so_approvall_flow",
                        {
                            s_object_type: -1,
                            so_no: this.header_detail.so,
                            company_code: data.companyCode,
                            approval_cycle: approvalCycle,
                            pending_with_role: soApprovalMaster[0].role,
                            insert_datetime: new Date(),
                            approval_status: "Pending",
                            profit_center_name: this.profit_center[i].profit_center,
                            approved_type: type,
                        },
                        true
                    );
                }
            } else {
                let approvalFlow = await this.transaction.createEntityP(
                    "d_o2c_so_approvall_flow",
                    {
                        s_object_type: -1,
                        so_no: this.header_detail.so,
                        company_code: data.companyCode,
                        approval_cycle: approvalCycle,
                        pending_with_role: soApprovalMaster[0].role,
                        insert_datetime: new Date(),
                        approval_status: "Pending",
                        approved_type: type,
                    },
                    true
                );
            }
            this.header_detail.approval_cycle = approvalCycle;

            //PS TO SO (Value)
            if (this.header_detail.pstoso == 1) {
                this.header_detail.pstoso = 0;
                this.header_detail.cr_status = "";
            }

            await this.tm.commitP("Send For Approval", "Send Failed", true, true);
            sap.m.MessageToast.show(this.header_detail.so + " SO has been send for approval", { duration: 10000, width: "20em", });
        }
    }
    public async onNewPoSendForApproval() {
        const poApprovalStatus = await this.transaction.getExecutedQuery(
            "d_o2c_so_attachment",
            {
                loadAll: true,
                so_guid: this.header_detail.so_guid,
                approval_status: "New",
            }
        );
        for (let i = 0; i < poApprovalStatus.length; i++) {
            poApprovalStatus[i].approval_status = "Pending";
            this.header_detail.cr_status = "Open";
        }
        await this.onSendForApproval();
    }
    public async onPoL1TableDelete(rowID) {
        if (rowID) {
            let deletePoData = await this.transaction.getExecutedQuery(
                "d_o2c_so_attachment",
                { loadAll: true, attachment_id: rowID }
            );
            if (deletePoData[0].r_attachmnt_itm.length) {
                let deleteItemData = await deletePoData[0].r_attachmnt_itm.fetch();
                for (let i = 0; i < deleteItemData.length; i++) {
                    let deleteItemChildData = [];
                    if (deleteItemData[i].r_billing_new.length) {
                        deleteItemChildData = await deleteItemData[i].r_billing_new.fetch();
                        for (let j = 0; j < deleteItemChildData.length; j++) {
                            deleteItemChildData[j].deleteP();
                        }
                    }
                    if (deleteItemData[i].r_schedule_new.length) {
                        deleteItemChildData = await deleteItemData[i].r_schedule_new.fetch();
                        for (let j = 0; j < deleteItemChildData.length; j++) {
                            deleteItemChildData[j].deleteP();
                        }
                    }
                    if (deleteItemData[i].r_vol_based_new.length) {
                        deleteItemChildData = await deleteItemData[i].r_vol_based_new.fetch();
                        for (let j = 0; j < deleteItemChildData.length; j++) {
                            deleteItemChildData[j].deleteP();
                        }
                    }
                    deleteItemData[i].deleteP();
                }
            }
            deletePoData[0].deleteP();
            //Update the data in Project
            if (this.header_detail.s_status == "Approved" || this.header_detail.s_status == "Closed") {
                await this.alreadyCreatedProject();
            }
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }

    public async onPoL2TableDelete(rowID) {
        if (rowID) {
            let deleteItemData = await this.transaction.getExecutedQuery(
                "d_o2c_so_item",
                { loadAll: true, soitem: rowID }
            );
            for (let i = 0; i < deleteItemData.length; i++) {
                let deleteItemChildData = [];
                if (deleteItemData[i].r_billing_new.length) {
                    deleteItemChildData = await deleteItemData[i].r_billing_new.fetch();
                    for (let j = 0; j < deleteItemChildData.length; j++) {
                        deleteItemChildData[j].deleteP();
                    }
                }
                if (deleteItemData[i].r_schedule_new.length) {
                    deleteItemChildData = await deleteItemData[i].r_schedule_new.fetch();
                    for (let j = 0; j < deleteItemChildData.length; j++) {
                        deleteItemChildData[j].deleteP();
                    }
                }
                if (deleteItemData[i].r_vol_based_new.length) {
                    deleteItemChildData = await deleteItemData[i].r_vol_based_new.fetch();
                    for (let j = 0; j < deleteItemChildData.length; j++) {
                        deleteItemChildData[j].deleteP();
                    }
                }
                deleteItemData[i].deleteP();
            }

            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }

    public async onPoL3TableDelete(rowID, tableName: string) {
        let deleteItemChildData = [];
        if (rowID) {
            if (tableName == "d_o2c_so_schedule") {
                deleteItemChildData = await this.transaction.getExecutedQuery(
                    tableName,
                    { loadAll: true, schedule_no: rowID }
                );
            } else {
                deleteItemChildData = await this.transaction.getExecutedQuery(
                    tableName,
                    { loadAll: true, billing_milestone: rowID }
                );
            }
            deleteItemChildData[0].deleteP();
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }
    public async onProfitCenterDelete(rowID) {
        if (rowID) {
            let deleteProfitData = <KloEntitySet<d_o2c_so_profit>>await this.transaction.getExecutedQuery(
                "d_o2c_so_profit",
                { loadAll: true, pc_number: rowID }
            );
            //Archive Project..
            if (deleteProfitData[0].project_id) {
                let project = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { loadAll: true, project_id: deleteProfitData[0].project_id });
                project[0].s_status = "Archived";
            }

            deleteProfitData[0].deleteP();
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }
    public async onFuncAreaDelete(rowID) {
        if (rowID) {
            let deleteFuncData = await this.transaction.getExecutedQuery(
                "d_o2c_so_func_area",
                { loadAll: true, fa_number: rowID }
            );
            deleteFuncData[0].deleteP();
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }

    public async dataFillOnComment(comment_status) {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let commentText = data.commentText; // TODO Use this variable For comment Input
        if (!commentText) commentText = "No Comment!!";
        let comment = await this.transaction.getQueryP("d_o2c_so_comment");
        comment.setLoadAll(true);
        let so_comment = await comment.executeP();
        let new_comment = await so_comment.newEntityP(0, { s_object_type: -1 });
        new_comment.so_guid = this.header_detail.so_guid;
        new_comment.comment = commentText;
        new_comment.user_name = this.get_name();
        new_comment.mime_type = new Date().toLocaleDateString();
        new_comment.curr_time = new Date().toLocaleTimeString();
        new_comment.status = comment_status;
    }

    public async dataFillOnCommLine1() {
        let pendingSoFlow;
        let approverPendingWith;
        let pendingText;
        if (this.header_detail.s_status == "Approved" && this.header_detail.cr_status === "Open") {
            pendingSoFlow = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: this.header_detail.so, approval_cycle: this.header_detail.approval_cycle, approval_status: "Pending", approved_type: "CR" });
            approverPendingWith = pendingSoFlow[0].pending_with_role;
            pendingText = "Approval Pending With";
            await this.tm.getTN("current_pending").setData({ action: approverPendingWith });
            let setRow1 = await this.tm.getTN("current_pending").getData().action;
            this.insertChangeCommentInFirstLine(setRow1, "No Comment", pendingText);
        } else if (this.header_detail.s_status == "Back To Edit") {
            pendingSoFlow = this.header_detail.s_created_by;
            approverPendingWith = pendingSoFlow;
            pendingText = "Pending With";
            await this.tm.getTN("current_pending").setData({ action: approverPendingWith });
            let setRow1 = await this.tm.getTN("current_pending").getData().action;
            this.insertChangeCommentInFirstLine(setRow1, "No Comment", pendingText);
        }
        //For Call Back
        else if (this.header_detail.s_status == "Call Back") {
            pendingSoFlow = this.header_detail.s_created_by;
            approverPendingWith = pendingSoFlow;
            pendingText = "Pending With";
            await this.tm.getTN("current_pending").setData({ action: approverPendingWith });
            let setRow1 = await this.tm.getTN("current_pending").getData().action;
            this.insertChangeCommentInFirstLine(setRow1, "No Comment", pendingText);
        }
        else if (this.header_detail.s_status == "Pending") {
            let pendingSoFlowFinance = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: this.header_detail.so, approval_cycle: this.header_detail.approval_cycle, approval_status: "Pending", pending_with_role: "FINANCE" });
            if (pendingSoFlowFinance.length == 0) {
                pendingSoFlow = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: this.header_detail.so, approval_cycle: this.header_detail.approval_cycle, approval_status: "Pending" });
                approverPendingWith = pendingSoFlow[0].pending_with_role;
            }
            else {
                approverPendingWith = pendingSoFlowFinance[0].pending_with_role;
            }
            pendingText = "Approval Pending With";
            await this.tm.getTN("current_pending").setData({ action: approverPendingWith });
            let setRow1 = await this.tm.getTN("current_pending").getData().action;
            this.insertChangeCommentInFirstLine(setRow1, "No Comment", pendingText);
        }

    }

    public insertChangeCommentInFirstLine(action: string, comment: string, status) {
        const oModel = sap.ui.getCore().getModel("mPageData");

        let aCommentsAndFlow = oModel.getProperty("/commentsAndFlowTable");

        if (aCommentsAndFlow.length > 0 && aCommentsAndFlow[0].isManualUpdate) {
            aCommentsAndFlow[0].action = status;
            aCommentsAndFlow[0].date = new Date().toLocaleDateString();
            aCommentsAndFlow[0].time = new Date().toLocaleTimeString();
            aCommentsAndFlow[0].actionBy = action;
            aCommentsAndFlow[0].Comment = comment;
        } else {
            aCommentsAndFlow = [
                {
                    action: status,
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString(),
                    actionBy: action,
                    Comment: comment,
                    isManualUpdate: true,
                },
            ].concat(aCommentsAndFlow);
        }

        oModel.setProperty("/commentsAndFlowTable", [...aCommentsAndFlow]);
    }
    public async setDataInSOApproval() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", {
            loadAll: true,
            so_no: data.soNumber,
            approval_cycle: this.header_detail.approval_cycle,
        });
    }
    public async duplicatesSO(inputIdentifier = undefined, sRowPath = null) {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");

        if (inputIdentifier === "PO_CHANGE") {
            const { PONumber, PODate } = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath);

            //Hi, ALBIA : USE PONumber, PODate from this var
        }

        // current PO No
        let arrayPO = [],
            arrayDate = [];
        for (let i = 0; i < data.poHeaderTable.length; i++) {
            if (data.poHeaderTable[i].PONumber != "" && data.poHeaderTable[i].PONumber != undefined && data.poHeaderTable[i].PODate != "" && data.poHeaderTable[i].PODate != undefined) {
                arrayPO[i] = data.poHeaderTable[i].PONumber;
                arrayDate[i] = data.poHeaderTable[i].PODate;
            }
        }

        if (data.bill_to_customer != undefined && data.bill_to_customer != "" && arrayPO.length && arrayDate.length) {
            debugger;
            let allcustList = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, bill_to_customer: data.bill_to_customer, s_status: ["Approved", "Call Back", "Back To Edit", "Pending", "Save As Draft"] });
            // let allcustList = 
            let custList = [];
            if (this.header_detail != undefined)
                custList = allcustList.filter((item) => item.so_guid != this.header_detail.so_guid);
            else custList = allcustList;
            if (custList.length) {
                let poLists = [];
                for (let i = 0; i < custList.length; i++) {
                    poLists = await custList[i].r_so_attachment.fetch();
                    let check = [];
                    for (let j = 0; j < arrayPO.length; j++) {
                        let x = poLists.filter((item) => item.po_no === arrayPO[j]);
                        if (x.length) check.push(x[0]);
                    }

                    for (let k = 0; k < check.length; k++) {
                        if (this.isInCurrentFinancialYear(check[k].po_date)) {
                            sap.m.MessageBox.error(
                                "One SO [SO No] is already present for the PO [PO no]. Please correct or avoid using this SO.",
                                {
                                    title: "Error",
                                }
                            );

                            // Reset Customer Selection
                            sap.ui.getCore().getModel("mPageData").setProperty("/bill_to_customer", "");
                            this.fnResetCustomerDependentInputs();

                            // Reset PO Date and PO Num
                            sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + "/PODate", "");
                            sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + "/PONumber", "");

                            break;
                        }
                    }
                }
            }
        }
    }
    public isInCurrentFinancialYear(inputDate): boolean {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        //current PO Date
        for (let i = 0; i < data.poHeaderTable.length; i++) {
            const currentDate = new Date(data.poHeaderTable[i].PODate);
            let currentFinancialYearStart, currentFinancialYearEnd;

            if (currentDate.getMonth() >= 3) {
                currentFinancialYearStart = new Date(currentDate.getFullYear(), 3, 1);
                currentFinancialYearEnd = new Date(
                    currentDate.getFullYear() + 1,
                    2,
                    31
                );
            } else {
                currentFinancialYearStart = new Date(
                    currentDate.getFullYear() - 1,
                    3,
                    1
                );
                currentFinancialYearEnd = new Date(currentDate.getFullYear(), 2, 31);
            }

            return (
                inputDate >= currentFinancialYearStart &&
                inputDate <= currentFinancialYearEnd
            );
        }
    }

    public async postatusChanged() {
        const isApprovalRole = this.tm.getTN("user_role").getData().role;
        let appMaster = await this.transaction.getExecutedQuery(
            "d_o2c_so_approval_master",
            {
                loadAll: true,
                so_type: this.header_detail.type,
                company_code: this.header_detail.company_code,
                business_area: this.header_detail.business_area,
            }
        );
        let levelData = [];
        for (let i = 0; i < appMaster.length; i++) {
            levelData[i] = appMaster[i].level;
        }
        let maxlevel = Math.max(...levelData);
        let maxLevelRole = appMaster.filter((item) => item.level == maxlevel);
        //Line item created visibilty
        for (let i = 0; i < this.poTableLineItem1.length; i++) {
            const poHeaderRowCreator = this.poTableLineItem1[i].s_created_by;
            if (
                (this.header_detail.s_status == "Approved" ||
                    this.header_detail.s_status == "Pending") &&
                (await this.transaction.get$User()).login_id == poHeaderRowCreator &&
                isApprovalRole
            ) {
                if (this.poTableLineItem1[i].approval_status == "New") {
                    if (
                        maxLevelRole[0].role == (await this.transaction.get$Role()).role_id
                    )
                        this.poTableLineItem1[i].approval_status = "Approved";
                    else this.poTableLineItem1[i].approval_status = "Pending";
                }
                if (
                    this.poTableLineItem1[i].approval_status == "Pending" &&
                    maxLevelRole[0].role == (await this.transaction.get$Role()).role_id
                ) {
                    this.poTableLineItem1[i].approval_status = "Approved";
                }
            }
        }
        this.transaction.commitP();
    }

    public async onSubmitMail() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let order_amount = 0;
        let po_header = data.poHeaderTable;
        debugger;
        for (let i = 0; i < po_header.length; i++) {
            order_amount = order_amount + parseInt(po_header[0].GrossValue);
        }

        let profitCenterTable = data.profitCenterTable;
        let approver = [];
        let date = new Date(data.createdOnMMddYYYY);
        date.setDate(date.getDate() + 3);
        for (let i = 0; i < profitCenterTable.length; i++) {
            let approver = [];
            approver.push(profitCenterTable[i].teamHeadSelected.toLowerCase());

            await this.tm.getTN("so_notification").setProperty("type", "soSubmitMail");
            await this.tm.getTN("so_notification").setProperty("order_date", data.createdOnMMddYYYY);
            await this.tm.getTN("so_notification").setProperty("created_name", data.createdByName);
            await this.tm.getTN("so_notification").setProperty("order_number", this.header_detail.so);
            // await this.tm.getTN("so_notification").setProperty("next_date", date.toDateString());
            // await this.tm.getTN("so_notification").setProperty("order_amount", order_amount);
            await this.tm.getTN("so_notification").setProperty("approver", profitCenterTable[i].teamHeadSelected.toLowerCase());
            await this.tm.getTN("so_notification").executeP();
        }

        sap.m.MessageToast.show(
            "Reminder Mail for Customer Approve is sent successfully!"
        );
    }
    public async onApprovalMail() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        // debugger;
        await this.tm
            .getTN("so_notification")
            .setProperty("type", "soApprovalMail");
        await this.tm
            .getTN("so_notification")
            .setProperty("creator_id", data.createdById);
        await this.tm
            .getTN("so_notification")
            .setProperty("creator_name", data.createdByName);
        await this.tm
            .getTN("so_notification")
            .setProperty("order_number", this.header_detail.so);
        await this.tm.getTN("so_notification").executeP();
        sap.m.MessageToast.show(
            "Reminder Mail for Customer Approve is sent successfully!"
        );
    }

    public async onFinalApproval() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let order_amount = 0;
        let po_header = data.poHeaderTable;
        for (let i = 0; i < po_header.length; i++) {
            order_amount = order_amount + po_header[i].GrossValue;
        }
        debugger;
        let profitCenterTable = data.profitCenterTable;
        for (let i = 0; i < profitCenterTable.length; i++) {
            let approver = [];
            approver.push(profitCenterTable[i].manager.toLowerCase());
            await this.tm
                .getTN("so_notification")
                .setProperty("type", "soFinalApprove");
            await this.tm
                .getTN("so_notification")
                .setProperty("order_amount", order_amount);
            await this.tm
                .getTN("so_notification")
                .setProperty("order_date", data.createdOnMMddYYYY);
            await this.tm
                .getTN("so_notification")
                .setProperty("order_number", this.header_detail.so);
            await this.tm.getTN("so_notification").setProperty("approver", approver);
            await this.tm.getTN("so_notification").executeP();
        }
        sap.m.MessageToast.show("SO Approved");
    }

    // At each Reject flow mail notification to creator......
    public async onRejectNotif() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        await this.tm.getTN("so_notification").setProperty("type", "soReject");
        await this.tm
            .getTN("so_notification")
            .setProperty("order_number", this.header_detail.so);
        await this.tm
            .getTN("so_notification")
            .setProperty("creator", data.createdById);
        await this.tm
            .getTN("so_notification")
            .setProperty("creator_name", data.createdByName);
        await this.tm
            .getTN("so_notification")
            .setProperty("comment", data.commentText);
        await this.tm
            .getTN("so_notification")
            .setProperty("appropriate_person", data.loginUserId);
        await this.tm.getTN("so_notification").executeP();
        sap.m.MessageToast.show("SO Rejected");
    }

    public async onCRCreationMail() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let order_amount = 0;
        let po_header = data.poHeaderTable;
        for (let i = 0; i < po_header.length; i++) {
            order_amount = order_amount + parseInt(po_header[0].GrossValue);
        }

        let profitCenterTable = data.profitCenterTable;
        let approver = [];
        let date = new Date(data.createdOnMMddYYYY);
        date.setDate(date.getDate() + 3);
        for (let i = 0; i < profitCenterTable.length; i++) {
            let approver = [];
            approver.push(profitCenterTable[i].teamHeadSelected.toLowerCase());
            await this.tm.getTN("so_notification").setProperty("type", "crCreationMail");
            await this.tm.getTN("so_notification").setProperty("order_date", data.createdOnMMddYYYY);
            await this.tm.getTN("so_notification").setProperty("created_name", data.createdByName);
            await this.tm.getTN("so_notification").setProperty("order_number", this.header_detail.so);
            await this.tm.getTN("so_notification").setProperty("next_date", date.toDateString());
            await this.tm.getTN("so_notification").setProperty("order_amount", order_amount);
            await this.tm.getTN("so_notification").setProperty("approver", profitCenterTable[i].teamHeadSelected.toLowerCase());
            await this.tm.getTN("so_notification").executeP();
        }
    }

    public async onPressCallBackBtn() {
        this.showTopButtons(['EDIT']);
        //This is only access by the creator only when the status is Pending
        this.header_detail.s_status = "Call Back";
        let comment_status = this.header_detail.s_status
        sap.ui.getCore().getModel("mPageData").setProperty('/soStatus', 'Call Back');
        await this.dataFillOnComment(comment_status);
        await this.tm.commitP("Call Back Successfull", "Call Back Failed", true, true);
    }

    // Discarding the SO when the status is Pending......
    public async discardSO() {
        this.header_detail.s_status = "Archived";
        let prj_obj = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { loadAll: true, so_id: this.header_detail.so, partialSelect: ["s_status"] });
        if (prj_obj.length > 0) {
            for (let prj of prj_obj) {
                prj.s_status = "Archived";
            }
        }
        await this.tm.commitP("Discarded Successfully", "Discard Failed", true, true);
        this.navTo({ S: "p_sales_order_list" });
    }

    public async fndiscardSO() {
        sap.m.MessageBox.confirm("Do you really want to Discard this SO? This action cannot be reverted.", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.OK,
            sap.m.MessageBox.Action.CANCEL],
            onClose: (oAction) => {
                if (oAction == "OK") {
                    this.discardSO();
                }
            }
        })
    }

    //Auto Delete from db for last item delete from UI....
    public async deleteLastItemTblRowBackend(sRowPath: string) {
        const { aLastLineItemTable, aLastLineItemTableIdentity } = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath);
        const tableName = {
            TABLE_SCHEDULE_BASED: "d_o2c_so_schedule",
            TABLE_MILESTONE_BASED: "d_o2c_so_milestone",
            TABLE_VOLUME_BASED: "d_o2c_volume_based"
        }[aLastLineItemTableIdentity];

        let childItemsToBeDeleted: Array<any>;

        this.fnShowBusyDialog(true, 'Updating ...')
        for (let index = 0; index < aLastLineItemTable.length; index++) {
            const { rowID } = aLastLineItemTable[index];
            if (rowID) {
                switch (tableName) {
                    case 'd_o2c_so_schedule':
                        childItemsToBeDeleted = await this.transaction.getExecutedQuery(tableName, { loadAll: true, 'schedule_no': rowID });
                        break;
                    default:
                        childItemsToBeDeleted = await this.transaction.getExecutedQuery(tableName, { loadAll: true, 'billing_milestone': rowID });
                        break;
                }
                childItemsToBeDeleted[0].deleteP();
            }
        }
        this.fnShowBusyDialog(false);
    }
    public async alreadyCreatedProject() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        //PROJECT MANAGEMENT CREATION ----START
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', {
            loadAll: true, 'so_id': this.header_detail.so
        });
        let consumeData = [];
        //Consumption START
        if (projectData.length) {
            let projectID = projectData.map((item) => item.project_id);
            consumeData = await this.transaction.getExecutedQuery('d_o2c_reserve_consumption', {
                loadAll: true, 'project_id': projectID, 's_status': "Approved"
            });
        }
        //Consumption END
        for (let i = 0; i < data.profitCenterTable.length; i++) {
            //Before creating the project need to check in the project Table already created then know need to create it.(check so and Profit center)
            //Aman..
            // let projectPresent = projectData?.filter((item) => item.profit_center == data.profitCenterTable[i].profitCentre);
            let projectPresent = projectData?.filter((item) => item.project_id == data.profitCenterTable[i].projectID);

            let consumedPresent = consumeData?.filter((item) => item.project_id == projectPresent[0].project_id);
            let sumManagement = 0;
            let sumContigency = 0;
            for (let i = 0; i < consumedPresent.length; i++) {
                sumManagement += parseFloat(consumedPresent[i].managment_reserve);
                sumContigency += parseFloat(consumedPresent[i].contigency_reserve);
            }
            // let repeatPC = data.profitCenterTable.filter((item) => item.profitCentre == data.profitCenterTable[i].profitCentre);
            // let totalPDS = 0;
            // for (let repeat = 0; repeat < repeatPC.length; repeat++) {
            //     totalPDS += (parseFloat(repeatPC[repeat].pDs));
            // }
            // totalPDS = totalPDS.toFixed(2);
            let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
                loadAll: true, 'profit_center': data.profitCenterTable[i].profitCentre, 'profit_center_pds': Math.round(parseFloat(data.profitCenterTable[i].pDs))
            });
            let managementReservePerc = 0, contigencyReservePerc = 0;
            if (rsrvMatrixData.length) {
                managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(data.profitCenterTable[i].pDs)) / 100));
                contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(data.profitCenterTable[i].pDs)) / 100));
            }

            if (projectPresent.length > 0) {
                //Need to do Albia
                // projectPresent[0].total_project_pds = totalPDS;
                projectPresent[0].total_project_pds = data.profitCenterTable[i].pDs;

                projectPresent[0].mreserve_new = (parseFloat(managementReservePerc - sumManagement).toFixed(2));
                projectPresent[0].mcontig_new = (parseFloat(contigencyReservePerc - sumContigency).toFixed(2));
                projectPresent[0].available_pds_new = (parseFloat(projectPresent[0].total_project_pds - projectPresent[0].mreserve_new - projectPresent[0].mcontig_new).toFixed(2));
            }

            else {
                //Creating in the Project table
                let new_prj = await this.transaction.createEntityP('d_o2c_project_header', {
                    s_object_type: -1,
                    so_id: this.header_detail.so,
                    total_project_pds: data.profitCenterTable[i].pDs,//totalPDS,
                    mreserve_new: managementReservePerc.toFixed(2),
                    mcontig_new: contigencyReservePerc.toFixed(2),
                    available_pds_new: (parseFloat(parseFloat(data.profitCenterTable[i].pDs) - managementReservePerc - contigencyReservePerc).toFixed(2)),
                    booked_pds_new: 0,
                    profit_center: data.profitCenterTable[i].profitCentre,
                    s_status: "Created"
                });

                //how to update project id to so pc table?
                data.profitCenterTable[i].projectID = new_prj.project_id;
                let so_pc = this.profit_center.filter((pc) => pc.profit_center == data.profitCenterTable[i].profitCentre && pc.project_manager == data.profitCenterTable[i].manager)
                so_pc[0].project_id = new_prj.project_id;
            }
        }
        //PROJECT MANAGEMENT CREATION ----ENDSS......
    }
    public async onCustomerContactDelete(rowID) {
        if (rowID) {
            let deleteContactData = await this.transaction.getExecutedQuery(
                "d_o2c_so_contact",
                { loadAll: true, contact_id_new: rowID }
            );
            deleteContactData[0].deleteP();
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }
    /* public async onNextApprove(role_id) {
         let level;
         const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
         let type = "";
         let soApprovalFlowLoginRole = [];
         if (this.header_detail.s_status == "Approved") {
             type = "CR";
             await this.currentApprovalCycle(type);
             soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: this.header_detail.so, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: "CR", });
         } else {
             type = "New";
             await this.currentApprovalCycle(type);
             soApprovalFlowLoginRole = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, so_no: this.header_detail.so, pending_with_role: role_id, approval_cycle: this.maxApprovalCycle, approved_type: "New", });
         }
 
 
         const soApprovalMaster = await this.transaction.getExecutedQuery("d_o2c_so_approval_master", { loadAll: true, so_type: data.orderTypeSelected, company_code: data.companyCode, business_area: data.businessAreaSelected, is_active: true });
         let currSoApprovalMaster = soApprovalMaster.filter((item) => item.role == role_id);
 
         let soAppFlowApprovedStatus = soApprovalFlowLoginRole.filter((item) => item.approval_status == "Approved");
 
         let empCountForRole = 0;
         if (currSoApprovalMaster[0].role != "TEAM_HEAD") {
             let currentRoleDes = await this.transaction.getExecutedQuery("q_design_count", { loadAll: true, name: currSoApprovalMaster[0].role, active_from: new Date().getTime(), active: new Date().getTime(), company_code: data.companyCode, business_area: data.businessAreaSelected, });
             empCountForRole = currentRoleDes.length;
         }
         //Need to add other role based condition
         if ((currSoApprovalMaster[0].consensus_approval == false && soAppFlowApprovedStatus.length >= 1) || (currSoApprovalMaster[0].consensus_approval == true && currSoApprovalMaster[0].role == "TEAM_HEAD" && this.profit_center.length <= soAppFlowApprovedStatus.length) || empCountForRole == soAppFlowApprovedStatus.length) {
             level = soApprovalMaster.filter((item) => item.level == currSoApprovalMaster[0].level + 1);
             if ((level.length && this.header_detail.s_status != "Approved") || (level.length && this.header_detail.s_status == "Approved" && currSoApprovalMaster[0].cr_approval == false)) {
                 if (level[0].role != "TEAM_HEAD")
                     await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: level[0].role, insert_datetime: new Date(), approval_status: "Pending", approved_type: type }, true);
                 else {
                     for (let i = 0; i < this.profit_center.length; i++) {
                         let approvalFlow = await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: level[0].role, insert_datetime: new Date(), approval_status: "Pending", profit_center_name: this.profit_center[i].profit_center, approved_type: type }, true);
                     }
                 }
             } else {
                 for (let i = 0; i < this.poTableLineItem1.length; i++) {
                     this.poTableLineItem1[i].approval_status = "Approved";
                 }
                 if (this.header_detail.s_status == "Approved")
                     this.header_detail.cr_status = "Closed";
                 if (data.orderTypeSelected != "SO") {
                     let soApprovalFlowFinanceFilter = await this.transaction.getExecutedQuery("d_o2c_so_approvall_flow", { loadAll: true, 'approval_cycle': this.maxApprovalCycle, 'pending_with_role': "Finance" });
                     if (soApprovalFlowFinanceFilter.length == 0) {
                         await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: "Finance", insert_datetime: new Date(), approval_status: "Approved", approved_type: type }, true);
                     }
                 }
                 this.header_detail.s_status = "Approved";
 
                 //PROJECT MANAGEMENT CREATION ----START
                 //Update and create the data in Project
                 await this.alreadyCreatedProject();
                 //PROJECT MANAGEMENT CREATION ----END
 
                 //function call at last approval
                 await this.onFinalApproval();
             }
         } else {
             if (currSoApprovalMaster[0].role != "TEAM_HEAD")
                 await this.transaction.createEntityP("d_o2c_so_approvall_flow", { s_object_type: -1, so_no: this.header_detail.so, company_code: data.companyCode, approval_cycle: this.maxApprovalCycle, pending_with_role: currSoApprovalMaster[0].role, insert_datetime: new Date(), approval_status: "Pending", approved_type: type }, true);
         }
         let comment_status = "Approved";
         await this.dataFillOnComment(comment_status);
         this.dataFillOnCommLine1();
         await this.tm.commitP("Approved Successfull", "Approved Failed", true, true);
 
         // Mail Notification
         await this.onApprovalMail();
         this.showTopButtons([]);
         await this.navTo({ S: "p_sales_order_list" });
     }*/
    //Travel Delete
    public async onTravelDelete(rowID) {
        if (rowID) {
            let deleteTravelData = await this.transaction.getExecutedQuery(
                "d_o2c_so_travel_reimb",
                { loadAll: true, reimb_id: rowID }
            );
            deleteTravelData[0].deleteP();
            await this.tm.commitP("Delete successfull", "Delete Failed", true, true);
        }
    }
    public async onViewDetailsButtonPress(oEvent: Event) {
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const rowID = oPageDataModel.getProperty(sRowPath + "/rowID");
        const productType = oPageDataModel.getProperty("/productType");
        const soNumber = oPageDataModel.getProperty("/soNumber");
        const bill_to_customer = oPageDataModel.getProperty("/bill_to_customer");

        const ddSelectedItemCategory = oPageDataModel.getProperty(sRowPath + "/ddSelectedItemCategory");

        if (ddSelectedItemCategory === "API") {
            await this.navTo({ S: 'p_o2c_api_screen', AD: { soNumber: soNumber, billToCustomer: bill_to_customer, rowID, productType } })
        } else if (ddSelectedItemCategory === "USRSUBSCR") {
            // TODO -user subscription
        }
    }
}
//gk 5:23pm 26 May 2025

