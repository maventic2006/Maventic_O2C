import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloEntitySet } from "kloBo_7-2-136";
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_general_confg } from "o2c_v2/entity_gen/d_general_confg";
import { calendarworkingdays } from 'o2c_v2/util/calendarworkingdays';
import { taskassignment } from "o2c_v2/util/taskassignment";
declare let KloUI5: any;

const fnConvertJsToUi5Date = (date: any) => {
    if (date === null || date === undefined || date === '')
        return '';
    return new Date(date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

const isEndDateBiggerThanStartDate = (startDate: string, endDate: string) => {
    return (new Date(startDate)) <= (new Date(endDate));
}

@KloUI5("o2c_v2.controller.p_project")
let project_info, project_so_info, billing_data = [], project_milestone = [], resource_planning = [], project_stakeholder = [], project_document = [], project_monthly = [], project_consume = [], flag = false, org, e;
export default class p_project extends KloController {

    public VALID_TYPES = {
        ANY: "ANY",
        NUM: "NUM",
        TEXT: "TEXT",
        PHONE: "PHONE",
        EMAIL: "EMAIL",
        LINKEDIN: "LINKEDIN",
    };

    private popupDialogBox: sap.ui.core.Control | sap.ui.core.Control[];
    private multiProcessingDialog: sap.ui.core.Control | sap.ui.core.Control[];

    public onInit() {
        const oLocalModel = new sap.ui.model.json.JSONModel({
            // Header Details
            company: '',
            companyCode: '',
            businessAreaId: '',
            businessAreaSelected: '',
            orderTypeSelected: '',
            // Editable Field
            isRemarkEditable: false,
            isPageEditable: false,
            // Login User Info
            loginUserId: null,
            soStatus: '',
            loginUserRole: '',
            // Project Details
            projectStatus: '',
            projectName: '',
            officeCalender: '',
            durationInWeeks: '',
            projectStartDate: '',
            projectEndDate: '',
            projectId: '',
            soIds: '',
            // Customer Details
            billToCustomer: '',
            billToAddress: '',
            gstin: '',
            currency: '',
            crRateWOTax: '',
            parentPO: '',
            // Project PDs
            totProjPDs: '',
            managementReserve: '',
            contingencyReserve: '',
            availablePDs1: '',
            availablePDs: '',
            plannedPDs: '',
            bookedPDs: '',
            // Visibility
            isRequestInvoiceButtonShow: false,
            // Table: Billing Milestone
            tableBillingMilestone: [],
            // Table: Project Milestone
            tableProjectMilestone: [],
            // Table : Resource Planning
            tableResourcePlanning: [],
            // Table: Monthly Planning
            tableMonthlyPlanning: [],
            // Table : Project Stakeholders
            tableProjectStakeholders: [],
            // Table : Project Document
            tableProjectDocument: [],
            // List : EmployeeList
            aEmployeeList: [],
            // List : PoNumbers
            listPoInformation: [],
            // List : Signatory
            listSignatory: [],
            // List : Milestone Name
            listMilestoneNames: [],
            // Skill
            listOfSkills: [],
            // Management Reserve and Contingency Reserve Consumption
            PopupReason: "",
            PopupPds: "",
            mrAndCrTable: []
        });

        oLocalModel.setSizeLimit(300000); // for combo-box dropdown limit

        sap.ui.getCore().setModel(oLocalModel, "mPageData");
    }

    busyMessageQueue = []
    oBusyDialog = new sap.m.BusyDialog({ text: '' });

    public fnShowBusyDialog(openNewDialog: boolean, busyMessageText: string = 'Loading...') {
        if (openNewDialog) {
            this.busyMessageQueue.push(busyMessageText);
        } else {
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

    ////////// Multi Processing Dialog - Start ////////
    public async initializeMultiProcessingDialog(aProcessMessages: Array<string>) {
        // Initialize
        const oView = this.getView();
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.multi_processing_dialog";

        this.multiProcessingDialog = await sap.ui.core.Fragment.load({ name: sViewName, controller: this });

        // Set Model
        const aProcessingDetails: Array<any> = [];

        aProcessMessages.forEach((sMessage) => {
            aProcessingDetails.push({ isProcessing: true, processingMessage: sMessage })
        });

        this.multiProcessingDialog.setModel(new sap.ui.model.json.JSONModel({
            processingEmotionIndex: 0, // 0,1,2,3 
            aProcessingDetails: aProcessingDetails
        }));

        oView.addDependent(this.multiProcessingDialog);

        // Display Dialog
        this.multiProcessingDialog.open();
    }

    public setCompletedMultiProcessingDialog() {
        if (this.multiProcessingDialog) {
            const oMultiProcessDialogData = this.multiProcessingDialog.getModel().getProperty('/');

            const aProcessingDetails = oMultiProcessDialogData.aProcessingDetails;
            const iProcessingDetailsLength = aProcessingDetails.length;

            let totalCompletedProcesses = 0;
            for (let i = 0; i < iProcessingDetailsLength; i++) {
                totalCompletedProcesses++;

                if (aProcessingDetails[i].isProcessing === true) {
                    aProcessingDetails[i].isProcessing = false;
                    break;
                }
            }

            const iCompletedProcessPercentage = (100 * totalCompletedProcesses) / iProcessingDetailsLength;

            oMultiProcessDialogData.processingEmotionIndex =
                (iCompletedProcessPercentage > 0 && iCompletedProcessPercentage <= 20) ? 0 :
                    (iCompletedProcessPercentage > 20 && iCompletedProcessPercentage <= 25) ? 1 :
                        (iCompletedProcessPercentage > 25 && iCompletedProcessPercentage <= 80) ? 2 : 3;

            oMultiProcessDialogData.aProcessingDetails = aProcessingDetails;
            this.multiProcessingDialog.getModel().setProperty('/', oMultiProcessDialogData);

            if (totalCompletedProcesses === iProcessingDetailsLength) {
                this.multiProcessingDialog.destroy();
            }
        }
    }

    ////////// Multi Processing Dialog - End ////////

    /**
     * setEditableMonthEfforts
     */
    public setEditableMonthEfforts(aMonthAndEfforts: Array<any>) {
        // Function To Give Month Difference
        const [CurrentMonth, CurrentYear] = ((new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })).split(" ");
        const calcMonthDifferenceFormCurrMonth = (month: string, year: string) => {
            const selectedMonthYear = new Date(month + '-1-' + year); // 1st DaY of Month
            const currentMonthYear = new Date(CurrentMonth + '-1-' + CurrentYear); // 1st Day Of Current Month
            let monthDifference: number;

            monthDifference = (currentMonthYear.getFullYear() - selectedMonthYear.getFullYear()) * 12;
            monthDifference -= selectedMonthYear.getMonth();
            monthDifference += currentMonthYear.getMonth();

            return monthDifference;
        }

        aMonthAndEfforts.map((obj) => {
            const [extractMonth, extractYear] = obj.month.split(" ");
            obj.isRowEditable = calcMonthDifferenceFormCurrMonth(extractMonth, extractYear) <= 1;
            obj.isEditInProgress = false;
        });

        return aMonthAndEfforts;
    }

    /**
     * generateMonthAndEfforts
     */
    public generateMonthAndEfforts(startDate: Date, endDate: Date) {
        const aMonthAndPlanning = [];

        // Function to format month with Planned Efforts
        const formatMonthAndPlannedEfforts = (date: Date) => {
            const sMonthAndYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            return {
                rowID: '',
                month: sMonthAndYear,
                plannedEfforts: 0,
                consumedEfforts: 0,
            }
        }

        // PUSH First Month
        aMonthAndPlanning.push(formatMonthAndPlannedEfforts(startDate));

        // PUSH Second Month --to--> Second Lat Month
        // Set Next Start Date = 1st Day Of (Second Month) 
        // Set End Day = last Day Of (Second Lat Month)
        const dateSecondMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
        const dateSecLatMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        for (let date = dateSecondMonth; date <= dateSecLatMonth; date.setMonth(date.getMonth() + 1)) {
            aMonthAndPlanning.push(formatMonthAndPlannedEfforts(date));
        }

        // PUSH Last Month : If Start_Date And End_Date is Different
        if (!(startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear())) {
            aMonthAndPlanning.push(formatMonthAndPlannedEfforts(endDate));
        }

        return aMonthAndPlanning;
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

    public async onPageEnter(oEvent) {
        // --- To Load XML ---
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_project";
        const view = await sap.ui.core.Fragment.load({
            name: sViewName,
            controller: this
        });
        this.getActiveControlById(null, 'pl_project', 'p_project').addContent(view);

        // --- To Load CSS ---
        FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "p_project_page_style");
        // --- END ---

        const oPageModel = sap.ui.getCore().getModel("mPageData");
        const project_guid = oEvent.navToParams.AD;

        await this.initializeMultiProcessingDialog([
            "Initial Data",
            "Header Details",
            "Customer Details",
            "Employees List",
            "Billing Milestone Data",
            "Project Milestone Data",
            "Resource Planning Information",
            "Monthly Planning Information",
            "Stake Holder Information",
            "Project Document Information",
        ]);


        //Project PDs
        project_info = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, 'project_guid': project_guid, expandAll: 'r_project_milestone,r_resource_planning,r_monthly_planning,r_project_stakeholder,r_project_documents' });
        //Header Details,Project Details,Customer Details-----> project_so_info
        project_so_info = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true, 'so': project_info[0].so_id, expandAll: 'r_so_attachment,r_profit_center' });
        this.setCompletedMultiProcessingDialog();
        //SO status
        sap.ui.getCore().getModel("mPageData").setProperty('/soStatus', project_so_info[0].s_status);
        //login user role 
        const roleId = (await this.transaction.get$Role()).role_id;
        oPageModel.setProperty('/loginUserRole', roleId);
        //Company Name
        const CompanyNameOrg = await this.transaction.getExecutedQuery('d_o2c_company_info', { loadAll: true, 'company_code': project_so_info[0].company });
        //Business Area Name
        const businessAreaOrg = await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'business_area': project_so_info[0].business_area });
        //Office Calendar Name
        const officeCalendarName = await this.transaction.getExecutedQuery('d_o2c_office_calendar_hdr', { loadAll: true, 'office_calendar_id': project_so_info[0].office_calendar });
        this.setCompletedMultiProcessingDialog();

        if (project_so_info[0].bill_to_customer && project_so_info[0].bill_to_customer !== '') {
            //Customer Name
            const customerName = await this.transaction.getExecutedQuery('d_o2c_customers', { loadAll: true, 'customer_id': project_so_info[0].bill_to_customer });
            //Customer GSTIN
            const gst_info = await this.transaction.getExecutedQuery('d_o2c_customers_map', { 'address_id_test': project_so_info[0].bill_to_address, partialSelected: 'gstin_vat', expandAll: 'r_o2c_address', loadAll: true });
            //Customer Address
            const customerAddress = gst_info[0].r_o2c_address[0].address_1;

            // Customer Detail
            oPageModel.setProperty('/billToCustomer', customerName[0].customer_name);
            oPageModel.setProperty('/customer_id', project_so_info[0].bill_to_customer);
            oPageModel.setProperty('/billToAddress', customerAddress);
            oPageModel.setProperty('/gstin', gst_info[0].gstin_vat);
        }
        this.setCompletedMultiProcessingDialog();

        //All Employee ID For Resource Planning MMID Field As a drop-down
        const employee_info = await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true, 's_status': "Approved", partialSelected: ['employee_id', 'first_name', 'last_name', 'full_name', 'line_manager'] })
        const aEmployeeList: Array<Object> = [];
        for (let i = 0; i < employee_info.length; i++) {
            const filterlmiData = employee_info.filter((item) => item.employee_id == employee_info[i].line_manager)
            aEmployeeList.push(
                {
                    emp_id: employee_info[i].employee_id,
                    emp_name: employee_info[i].full_name,
                    lmi_id: employee_info[i].line_manager,
                    emp_lmi: filterlmiData[0]?.full_name

                    //Use emp_lmi for the employee line Manager field
                }
            )
        }
        //All Skill MAster data based on the SO company code and business Area
        const listOfSkills = [];
        const skill_info = await this.transaction.getExecutedQuery('d_o2c_employee_skill_master', { loadAll: true, 'company_code': project_so_info[0].company, 'business_area': project_so_info[0].business_area, partialSelected: ['skill_Name', 'skill_id'] })
        for (let i = 0; i < skill_info.length; i++) {
            listOfSkills.push(
                {
                    skill_id: skill_info[i].skill_id,
                    skill_Name: skill_info[i].skill_Name,
                }
            )

        }
        oPageModel.setProperty('/listOfSkills', listOfSkills);
        this.setCompletedMultiProcessingDialog();

        // Billing Milestone Table Fetch
        let sumCRRate = 0;  //CR Rate Sum In Loop
        let avgCRRate = 0; //CR Rate Average
        const milestoneArray = [];
        const aPoInformation = [];

        //Primary PC and Project Profit Center
        const PrimaryProfitCenter = project_so_info[0].r_profit_center.filter((item) => item.primary_profit_center == true);
        if (project_info[0].profit_center == PrimaryProfitCenter[0].profit_center) {
            //Use primaryPC for condition check of invoice request button
            oPageModel.setProperty('/isRequestInvoiceButtonShow', true);
        }

        // Po Line Item - 1
        //let attachData = await project_so_info[0].r_so_attachment.fetch();
        let attachData = await project_so_info[0].r_so_attachment;
        for (let i = 0; i < attachData.length; i++) {
            sumCRRate = sumCRRate + attachData[i].cr_rate;
            avgCRRate = parseFloat((sumCRRate / attachData.length).toFixed(2));

            aPoInformation.push(
                {
                    poNumber: attachData[i].po_no,
                    poDate: fnConvertJsToUi5Date(attachData[i].po_date)
                }
            )

            // Po Line Item - 2
            let itemData = await attachData[i].r_attachmnt_itm.fetch();
            for (let j = 0; j < itemData.length; j++) {

                // Po Line Item - 3
                const milestoneData = await itemData[j].r_billing_new.fetch();
                billing_data = [...billing_data, ...milestoneData];
                milestoneData.forEach(({ billing_milestone, billing_milestone_name, actual_date, status, invoice_date, invoice_no, signupdoc, timesheet_upload, inv_requested_date, amount, remark }) => {
                    milestoneArray.push({
                        rowID: billing_milestone,
                        poNumber: attachData[i].po_no,
                        poDate: fnConvertJsToUi5Date(attachData[i].po_date),
                        milestoneName: billing_milestone_name,
                        startDate: '',
                        endDate: '',
                        actualEndDate: fnConvertJsToUi5Date(actual_date),
                        invoiceStatus: status,
                        invoiceDate: fnConvertJsToUi5Date(invoice_date),
                        invoiceNo: invoice_no,
                        VS_attachSignUpDoc: 'None',
                        attachSignUpDocFileName: signupdoc.name,
                        attachSignUpDoc: '',
                        signupDocDownloaded: signupdoc,
                        VS_attachTimesheetUpload: 'None',
                        attachTimesheetUpload: '',
                        attachTimesheetUploadFileName: timesheet_upload.name,
                        timesheetUploadDownloaded: timesheet_upload,
                        invoiceRequestedDate: fnConvertJsToUi5Date(inv_requested_date),
                        //crRate: attachData[i].cr_rate,
                        attachCopyDownloaded: '',
                        attachCopyFileName: '',
                        proposalCopyDownloaded: '',
                        proposalCopyFileName: '',
                        Amount: amount,
                        budgetedPDs: attachData[i].budgeted_pd,
                        remark: remark,
                        billing_type: itemData[j].item_category,
                        unit: itemData[j].unit,
                    })
                });

                const scheduleData = await itemData[j].r_schedule_new.fetch();
                billing_data = [...billing_data, ...scheduleData];
                scheduleData.forEach(({ schedule_no, description, start__date, end_date, actual_date, status, invoice_date, invoice_no, signupdoc, timesheet_upload, inv_requested_date, expected_amount, remark }) => {
                    milestoneArray.push({
                        rowID: schedule_no,
                        poNumber: attachData[i].po_no,
                        poDate: fnConvertJsToUi5Date(attachData[i].po_date),
                        milestoneName: description,
                        startDate: fnConvertJsToUi5Date(start__date),
                        endDate: fnConvertJsToUi5Date(end_date),
                        actualEndDate: fnConvertJsToUi5Date(actual_date),
                        invoiceStatus: status,
                        invoiceDate: fnConvertJsToUi5Date(invoice_date),
                        invoiceNo: invoice_no,
                        VS_attachSignUpDoc: 'None',
                        attachSignUpDocFileName: signupdoc.name,
                        attachSignUpDoc: '',
                        signupDocDownloaded: signupdoc,
                        VS_attachTimesheetUpload: 'None',
                        attachTimesheetUpload: '',
                        attachTimesheetUploadFileName: timesheet_upload.name,
                        timesheetUploadDownloaded: timesheet_upload,
                        invoiceRequestedDate: fnConvertJsToUi5Date(inv_requested_date),
                        //crRate: attachData[i].cr_rate,
                        attachCopyDownloaded: '',
                        attachCopyFileName: '',
                        proposalCopyDownloaded: '',
                        proposalCopyFileName: '',
                        Amount: expected_amount,
                        budgetedPDs: attachData[i].budgeted_pd,
                        remark: remark,
                        billing_type: itemData[j].item_category,
                        unit: itemData[j].unit,
                    })
                });

                const volumeData = await itemData[j].r_vol_based_new.fetch();
                billing_data = [...billing_data, ...volumeData];
                volumeData.forEach(({ billing_milestone, milestone_description, milestone_date, invoice_status, invoice_date, invoice_no, signupdoc, timesheet_upload, inv_requested_date, amount, remark }) => {
                    milestoneArray.push({
                        rowID: billing_milestone,
                        poNumber: attachData[i].po_no,
                        poDate: fnConvertJsToUi5Date(attachData[i].po_date),
                        milestoneName: milestone_description,
                        startDate: '',
                        endDate: '',
                        actualEndDate: fnConvertJsToUi5Date(milestone_date),
                        invoiceStatus: invoice_status,
                        invoiceDate: fnConvertJsToUi5Date(invoice_date),
                        invoiceNo: invoice_no,
                        VS_attachSignUpDoc: 'None',
                        attachSignUpDocFileName: signupdoc.name,
                        attachSignUpDoc: '',
                        signupDocDownloaded: signupdoc,
                        VS_attachTimesheetUpload: 'None',
                        attachTimesheetUpload: '',
                        attachTimesheetUploadFileName: timesheet_upload.name,
                        timesheetUploadDownloaded: timesheet_upload,
                        invoiceRequestedDate: fnConvertJsToUi5Date(inv_requested_date),
                        //crRate: attachData[i].cr_rate,
                        attachCopyDownloaded: '',
                        attachCopyFileName: '',
                        proposalCopyDownloaded: '',
                        proposalCopyFileName: '',
                        Amount: amount,
                        budgetedPDs: attachData[i].budgeted_pd,
                        remark: remark,
                        billing_type: itemData[j].item_category,
                        unit: itemData[j].unit,
                    })
                });
            }
        }

        // Sort Date Old To New
        milestoneArray.sort((a, b) => {
            return (new Date(a.actualEndDate) - new Date(b.actualEndDate));
        });

        // Assign Start And End Date Using User Logic
        const getDatePlusOne = (date: string) => {
            const today = new Date(date);
            today.setDate(today.getDate() + 1);
            return fnConvertJsToUi5Date(today.toString());
        }

        for (let i = 0; i < milestoneArray.length; i++) {
            const { startDate, endDate, actualEndDate, invoiceDate, invoiceRequestedDate } = milestoneArray[i];

            if (startDate == "") {
                milestoneArray[i].startDate = i === 0 ? 'No Date' : getDatePlusOne(milestoneArray[i - 1].actualEndDate);
            }
            if (endDate == "") {
                milestoneArray[i].endDate = actualEndDate
            }

            if (invoiceDate !== '') {
                milestoneArray[i]['actualEndDateVisible'] = invoiceDate;
            } else {
                milestoneArray[i]['actualEndDateVisible'] = invoiceRequestedDate;
            }
        }

        this.setCompletedMultiProcessingDialog();

        //Project Milestone Data
        project_milestone = await project_info[0].r_project_milestone.fetch();
        const projectMilestoneArray = [];
        for (let i = 0; i < project_milestone.length; i++) {
            const element = project_milestone[i];
            projectMilestoneArray.push({
                rowID: element.project_milestone_id,
                poNumber: element.po_no,
                poDate: fnConvertJsToUi5Date(element.po_date),
                milestoneName: element.milestone_name,
                startDate: fnConvertJsToUi5Date(element.start_date),
                endDate: fnConvertJsToUi5Date(element.end_date),
                actualEndDate: fnConvertJsToUi5Date(element.actual_date),
                status: element.s_status
            })
        }
        this.setCompletedMultiProcessingDialog();

        //Resource Planning Data
        resource_planning = await project_info[0].r_resource_planning.fetch();
        const resourcePlanningArray = [];
        for (let i = 0; i < resource_planning.length; i++) {
            const element = resource_planning[i];
            resourcePlanningArray.push({
                rowID: element.resource_guid,
                mmid: element.employee_id,
                skill: element.skill_id,
                role: element.customer_role,
                lineManagerMmid: element.line_manager_id,
                lineManagerName: element.line_manager_name,
                startDate: fnConvertJsToUi5Date(element.start_date),
                endDate: fnConvertJsToUi5Date(element.end_date),
                startDateBackup: fnConvertJsToUi5Date(element.start_date),
                endDateBackup: fnConvertJsToUi5Date(element.end_date),
                isDateChanged: false,
                occupationPercentage: element.percentage,
                plannedPds: element.plannedpds,
                consumedPDs: 0,
                approvalStatus: element.s_status,
                shadowOf: element.shadow_of,
                remark: element.remark,
                isOnsite: element.onsite,
                taskID: element.task_id,
            })
        }

        //  //Project Monthly Planning
        project_monthly = await project_info[0].r_monthly_planning.fetch();
        const projectMonthlyPlanningArray = [];
        for (let i = 0; i < project_monthly.length; i++) {
            const element = project_monthly[i];
            const [CurrentMonth, CurrentYear] = ((new Date(element.start_date)).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })).split(" ");
            projectMonthlyPlanningArray.push({
                rowID: element.plan_id,
                month: CurrentMonth + ' ' + CurrentYear,
                plannedEfforts: element.planned_hours,
                consumedEfforts: 0, // TODO
            });
        }
        this.setCompletedMultiProcessingDialog();

        //Project Stakeholders Data
        project_stakeholder = await project_info[0].r_project_stakeholder.fetch();
        const projectStakeholderArray = [];
        for (let i = 0; i < project_stakeholder.length; i++) {
            const element = project_stakeholder[i];
            projectStakeholderArray.push({
                rowID: element.stakeholder_guid,
                name: element.name,
                role: element.role_in_project,
                statusMail: element.status_mail_required == 'true',
                StatusCall: element.status_call_required == 'true',
                signatory: (element.signatory).split(',')
            })
        }
        this.setCompletedMultiProcessingDialog();

        //Project Document Data
        project_document = await project_info[0].r_project_documents.fetch();
        const projectDocumentArray = [];
        for (let i = 0; i < project_document.length; i++) {
            const element = project_document[i];
            projectDocumentArray.push({
                rowID: element.document_guid,
                attachmentName: element.document_name,
                isMandatory: element.is_manadatory,
                attachmentDownloaded: element.attached,
                attachment: "",
                attachmentFileName: element.attached.name,
                milestone: element.shared_on_mail_attch,
                milestoneOther: element.other_description

            })
        }
        this.setCompletedMultiProcessingDialog();

        //Project MR CR Consumption
        project_consume = await project_info[0].r_project_res_consume.fetch();
        const projectReserveConsume = [];
        for (let i = 0; i < project_consume.length; i++) {
            const element = project_consume[i];

            const rowDate = new Date(element.s_created_on);
            let time = '', date = '';
            if (rowDate.toString() != "Invalid Date") {
                time = rowDate.toLocaleTimeString();
                date = rowDate.toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
            }

            projectReserveConsume.push({
                rowID: element.consume_id,
                managementReserve: element.managment_reserve,
                contingencyReserve: element.contigency_reserve,
                remark: element.remark,
                reason: element.reason,
                date: date,
                time: time,
                actionBy: element.s_created_by,
                status: element.s_status
            })
        }
        this.setCompletedMultiProcessingDialog();

        oPageModel.setProperty('/mrAndCrTable', projectReserveConsume);

        oPageModel.setProperty('/aEmployeeList', aEmployeeList);
        oPageModel.setProperty('/tableProjectDocument', projectDocumentArray);
        oPageModel.setProperty('/tableProjectStakeholders', projectStakeholderArray);
        oPageModel.setProperty('/tableResourcePlanning', resourcePlanningArray);
        oPageModel.setProperty('/tableProjectMilestone', projectMilestoneArray);
        oPageModel.setProperty('/tableBillingMilestone', milestoneArray);
        oPageModel.setProperty('/listPoInformation', aPoInformation);

        // Prepare List-Milestone Names
        const aMilestoneNames = [];
        // Prepare Signatory Data 
        const signatory = [];
        milestoneArray.forEach(({ poNumber, milestoneName }) => {
            signatory.push({ signatoryValue: poNumber + '-' + milestoneName });
            aMilestoneNames.push({ name: milestoneName });
        });

        aMilestoneNames.push({ name: 'Other' });
        oPageModel.setProperty('/listMilestoneNames', aMilestoneNames);
        oPageModel.setProperty('/listSignatory', signatory);

        // Header Detail
        oPageModel.setProperty('/company', CompanyNameOrg[0].name);
        oPageModel.setProperty('/companyCode', project_so_info[0].company);
        oPageModel.setProperty('/businessAreaId', businessAreaOrg[0].business_area);
        oPageModel.setProperty('/businessAreaSelected', businessAreaOrg[0].name);
        oPageModel.setProperty('/orderTypeSelected', project_so_info[0].type);
        oPageModel.setProperty('/projectStatus', project_info[0].trans_status);
        oPageModel.setProperty('/soIds', project_info[0].so_id);
        oPageModel.setProperty('/projectId', project_info[0].project_id);

        if (project_info[0].trans_status !== 'Completed') {
            oPageModel.setProperty('/isPageEditable', true);
        }

        // Project Detail
        oPageModel.setProperty('/projectName', project_so_info[0].project_name);
        oPageModel.setProperty('/officeCalender', officeCalendarName[0]?.description);
        oPageModel.setProperty('/durationInWeeks', project_so_info[0].duration_week);
        oPageModel.setProperty('/projectStartDate', fnConvertJsToUi5Date(project_so_info[0].project_start_date));
        oPageModel.setProperty('/projectEndDate', fnConvertJsToUi5Date(project_so_info[0].project_end_date));

        //-- Auto-Populate Month Table using start End Date --//
        if (projectMonthlyPlanningArray.length > 0) {
            const dtLastMonth = new Date((projectMonthlyPlanningArray[projectMonthlyPlanningArray.length - 1]).month);
            const dtEndDate = new Date(project_so_info[0].project_end_date);

            let tableMonthlyPlanning = [];
            if (dtEndDate.getMonth() === dtLastMonth.getMonth() && dtEndDate.getFullYear() === dtLastMonth.getFullYear()) {
                // Everything is fine
                tableMonthlyPlanning = projectMonthlyPlanningArray;
            } else {
                // Date has been extended 
                // Create New entry for Month plan table & Concat in previous table
                const additionMonthEfforts = this.generateMonthAndEfforts(dtLastMonth, dtEndDate);

                // delete first index , because it already exist in previous table
                additionMonthEfforts.shift();
                tableMonthlyPlanning = projectMonthlyPlanningArray.concat(additionMonthEfforts);
            }

            const aTableMonthlyPlanning = this.setEditableMonthEfforts(tableMonthlyPlanning);
            await this.addConsumedEffort(aTableMonthlyPlanning);   //Assign Consumed Efforts
            oPageModel.setProperty('/tableMonthlyPlanning', aTableMonthlyPlanning);
        } else {
            const monthlyPlanning = this.generateMonthAndEfforts(project_so_info[0].project_start_date, project_so_info[0].project_end_date);
            const aTableMonthlyPlanning = this.setEditableMonthEfforts(monthlyPlanning);
            await this.addConsumedEffort(aTableMonthlyPlanning);  //Assign Consumed Efforts
            oPageModel.setProperty('/tableMonthlyPlanning', aTableMonthlyPlanning);
        }

        oPageModel.setProperty('/currency', project_so_info[0].currency);
        oPageModel.setProperty('/crRateWOTax', avgCRRate);
        oPageModel.setProperty('/parentPO', project_so_info[0].parent_po ? project_so_info[0].parent_po : '');

        // Project PDs
        oPageModel.setProperty('/totProjPDs', project_info[0].total_project_pds);
        oPageModel.setProperty('/managementReserve', project_info[0].mreserve_new);
        oPageModel.setProperty('/contingencyReserve', project_info[0].mcontig_new);
        oPageModel.setProperty('/availablePDs', project_info[0].available_pds_new);
        oPageModel.setProperty('/plannedPDs', project_info[0].planned_pds ? project_info[0].planned_pds : 0); // assign 0 in case of null
        //oPageModel.setProperty('/bookedPDs', project_info[0].booked_pds);

    }

    public fnDeleteRowFromTable(oEvent: Event, sRowPath = null) {
        if (sRowPath == null)
            sRowPath = oEvent.getSource().getParent().getBindingContextPath();

        const aRegexIndex = sRowPath.match(/([^/]+)$/); // Get Last Index To Delete
        if (aRegexIndex === null) return;
        const indexToDelete = parseInt(aRegexIndex[1]);
        const sPathToUpdate = sRowPath.replace(/\/[^/]+$/, ''); // Get Model Path To Update
        if (sPathToUpdate === null) return;

        // -- Get Data 
        const aTableRows: Array<any> = sap.ui.getCore().getModel("mPageData").getProperty(sPathToUpdate);

        // -- Delete Data 
        aTableRows.splice(indexToDelete, 1);

        // -- Update Data
        sap.ui.getCore().getModel("mPageData").setProperty(sPathToUpdate + '/', [...aTableRows]);
    }


    /**
     * onProjectMilestonePOChange
     */
    public onProjectMilestonePOChange(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        oPageModel.setProperty(sPath + '/poDate', '');

        const { poNumber } = oPageModel.getProperty(sPath);
        const listPoInformation = oPageModel.getProperty('/listPoInformation');

        const oSelectedPoData = listPoInformation.find(poInfo => poInfo.poNumber === poNumber);

        if (oSelectedPoData) {
            oPageModel.setProperty(sPath + '/poDate', oSelectedPoData.poDate);
        }
    }

    /**
     * Upload
     */
    public onAttachmentUpload(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const attach_data = oPageDataModel.getProperty(path);
        oPageDataModel.setProperty(path + "/attachment", oEvent.mParameters.files[0]);

        this.onCreateProjectDocument(attach_data, true);

    }

    public onUploadSignupDoc(oEvent: Event) {
        // Rest Value-state Error
        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);

        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const attach_data = oPageDataModel.getProperty(path);
        oPageDataModel.setProperty(path + "/attachSignUpDoc", oEvent.mParameters.files[0]);

        this.onCreateAttachment(attach_data, true);
    }

    public onUploadTimeSheet(oEvent: Event) {
        // Rest Value-state Error
        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);

        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const attach_data = oPageDataModel.getProperty(path);
        oPageDataModel.setProperty(path + "/attachTimesheetUpload", oEvent.mParameters.files[0]);

        this.onCreateAttachment(attach_data, true);
    }

    /**
     * Download
     */
    public async onDownloadAttachment(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/attachmentDownloaded");
        await qq.downloadAttachP();
    }

    public async onDownloadSignupDoc(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/signupDocDownloaded");
        await qq.downloadAttachP();
    }

    public async onDownloadTimesheetUpload(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const oPageDataModel = sap.ui.getCore().getModel("mPageData");
        const qq = oPageDataModel.getProperty(path + "/timesheetUploadDownloaded");
        await qq.downloadAttachP();
    }

    public onViewProposalCopy(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const file = sap.ui.getCore().getModel("mPageData").getProperty(path + "/proposalCopyDownloaded");
        this.fnOpenFileNewTab(file);
    }

    public onViewAttachCopy(oEvent: Event) {
        const path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        const file = sap.ui.getCore().getModel("mPageData").getProperty(path + "/attachCopyDownloaded");
        this.fnOpenFileNewTab(file);
    }

    public async fnOpenFileNewTab(file: any) {
        await file.getAttachmentBlobP();
        window.open(window.location.origin + file.attachment_path, "_blank");
    }

    /**
     * onResourcePlanStartDateChange
     */
    public onResourcePlanStartDateChange(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        // Validate StartDate With EndDate
        const projectStartDate = oPageModel.getProperty('/projectStartDate');
        const { startDate, endDate } = oPageModel.getProperty(sPath);
        if (endDate !== '' && !isEndDateBiggerThanStartDate(startDate, endDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('Start Date Is Bigger Than End Date')
        }
        else if (!isEndDateBiggerThanStartDate(projectStartDate, startDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('Start Date Cannot Be Smaller Than Project Start Date')
        }

        this.fnAddResourcePlanDateChangeFlag(sPath);

        // Calculate Planned PDs
        this.plannedPDs(sPath);
    }

    /**
     * onResourcePlandEndDateChange
     */
    public onResourcePlandEndDateChange(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        // Validate StartDate With EndDate
        const projectEndDate = oPageModel.getProperty('/projectEndDate');
        const { startDate, endDate } = oPageModel.getProperty(sPath);
        if (startDate === '') {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('Please Fill Start Date First');
        }
        else if (!isEndDateBiggerThanStartDate(startDate, endDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('End Date Is Smaller Than Start Date');
        }
        else if (!isEndDateBiggerThanStartDate(endDate, projectEndDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('End Date Should Smaller Than Project End Date');
        }

        this.fnAddResourcePlanDateChangeFlag(sPath);

        // Calculate Planned PDs
        this.plannedPDs(sPath);

        // If End Date is Smaller Than Current Date , Disable Row Form Editing
        // const date1 = new Date(endDate);
        // const date2 = new Date();
        // const diffTime = date2 - date1;
        // const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // if (diffDays > 0) {
        //     oPageModel.setProperty(sPath + '/isRowEditable', false);
        // }
    }

    /**
     * fnResourcePlanDateChangeFlag
     */
    public fnAddResourcePlanDateChangeFlag(sPath: string) {
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        const startDate = oPageModel.getProperty(sPath + '/startDate');
        const endDate = oPageModel.getProperty(sPath + '/endDate');
        const startDateBackup = oPageModel.getProperty(sPath + '/startDateBackup');
        const endDateBackup = oPageModel.getProperty(sPath + '/endDateBackup');

        if ((new Date(startDate).getTime() === new Date(startDateBackup).getTime()) && (new Date(endDate).getTime() === new Date(endDateBackup).getTime())) {
            oPageModel.setProperty(sPath + '/isDateChanged', false);
        } else {
            oPageModel.setProperty(sPath + '/isDateChanged', true);
        }
    }

    /**
     * onResourcePlandOccupationPerc
     */
    public onResourcePlandOccupationPerc(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");


        // Calculate Planned PDs
        this.plannedPDs(sPath);
    }
    /**
     * fnDeleteRowFromProjMilestoneTable
     */
    public fnDeleteRowFromProjMilestoneTable(oEvent: Event) {
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const rowID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/rowID');
        this.onPressDeleteProjectMilestone(rowID);
        this.fnDeleteRowFromTable(oEvent);
    }

    /**
     * fnDeleteRowFromResPlainningTable
     */
    public async fnDeleteRowFromResPlainningTable(oEvent: Event) {
        const data = sap.ui.getCore().getModel("mPageData").getProperty('/')
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const rowID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/rowID');
        const resourceTaskID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/taskID');

        //Task delete
        let taskid = (resourceTaskID.split(','));
        let deleteFlag;
        if (taskid != '' && taskid != null && taskid != undefined) {
            deleteFlag = await this.deleteTask(taskid)
        }
        if (deleteFlag != true) {
            this.fnDeleteRowFromTable(null, sRowPath);
            this.plannedPDs(sRowPath);
            await this.onPressDeleteResourcePlanning(sRowPath, rowID);
        }
    }

    /**
     * fnDeleteRowFromProjStakeholderTable
     */
    public fnDeleteRowFromProjStakeholderTable(oEvent: Event) {
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const rowID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/rowID');
        this.onPressDeleteProjectStakeholder(rowID);
        this.fnDeleteRowFromTable(oEvent);
    }

    /**
     * fnDeleteRowFromProjDocTable
     */
    public fnDeleteRowFromProjDocTable(oEvent: Event) {
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const rowID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/rowID');
        this.onPressDeleteProjectDocument(rowID);
        this.fnDeleteRowFromTable(oEvent);
    }

    /**
     * onPressRequestInvoice
     */
    public async onPressRequestInvoice(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();

        const oPageModel = sap.ui.getCore().getModel("mPageData");
        const sRowMilestoneName = oPageModel.getProperty(sPath + '/milestoneName');
        const remark = oPageModel.getProperty(sPath + '/remark');
        if (remark === null || remark === '') {
            this.fnShowErrorPopup('Please Enter Remark.');
            oPageModel.setProperty(sPath + '/VS_remark', 'Error');
            return;
        }

        // Check If current row has Sign Up Document in attachment
        const attachSignUpDocFileName = oPageModel.getProperty(sPath + '/attachSignUpDocFileName');

        if (attachSignUpDocFileName === '' || attachSignUpDocFileName === null) {
            this.fnShowErrorPopup('Billing Milestone Has No Sign Up Document.');
            oPageModel.setProperty(sPath + '/VS_attachSignUpDoc', 'Error');
            return;
        }

        const attachTimesheetUploadFileName = oPageModel.getProperty(sPath + '/attachTimesheetUploadFileName');
        const billing_type = oPageModel.getProperty(sPath + "/billing_type");

        if ((attachTimesheetUploadFileName === '' || attachTimesheetUploadFileName === null) && billing_type === "TNM") {
            this.fnShowErrorPopup('Billing Milestone Has No Timesheet Document for T&M project.');
            oPageModel.setProperty(sPath + '/VS_attachTimesheetUpload', 'Error');
            return;
        }

        // Check If current row has Project Document in  Project Document Table 
        const tableProjectDocument = oPageModel.getProperty('/tableProjectDocument');
        const oProjectDocument = tableProjectDocument.find(({ milestone }) => sRowMilestoneName === milestone);
        if (oProjectDocument && oProjectDocument.isMandatory) {
            if (oProjectDocument.attachment || oProjectDocument.attachmentDownloaded !== '') {
            } else {
                this.fnShowErrorPopup('Project Document Is Mandatory');
                return;
            }
        }

        // => Invoice Request //
        let sRowInvoiceStatus = oPageModel.setProperty(sPath + '/invoiceStatus', "InvReq");

        const sMilestoneRowId = oPageModel.getProperty(sPath + '/rowID');
        let soBillingMilestoneData = await this.transaction.getExecutedQuery("d_o2c_so_milestone", { loadAll: true, billing_milestone: sMilestoneRowId });
        let soScheduleMilestoneData = await this.transaction.getExecutedQuery("d_o2c_so_schedule", { loadAll: true, schedule_no: sMilestoneRowId });
        let soVolumeMilestoneData = await this.transaction.getExecutedQuery("d_o2c_volume_based", { loadAll: true, billing_milestone: sMilestoneRowId });
        if (soBillingMilestoneData.length)
            soBillingMilestoneData[0].status = "InvReq";
        if (soScheduleMilestoneData.length)
            soScheduleMilestoneData[0].status = "InvReq";
        if (soVolumeMilestoneData.length)
            soVolumeMilestoneData[0].invoice_status = "InvReq";
        //Project Document
        await this.documentFill();

        // Set Current Date In Row
        oPageModel.setProperty(sPath + '/actualEndDateVisible', fnConvertJsToUi5Date(new Date()));

        await this.onDataFillInTable();

        // Create a new invoice entry
        await this.onMakingInvoiceEntry(oEvent);

        await this.tm.commitP("Invoice Requested", "Invoice Requested Failed", true, true);

        // // Set Current Date In Row
        // oPageModel.setProperty(sPath + '/actualEndDateVisible', fnConvertJsToUi5Date(new Date()));

        //Mail Trigger for Invoice
        await this.empidFunction();
        if (org.length == 0) {

            console.log("Not")
            sap.m.MessageToast.show("In this business area there is no Finance assigned yet", {
                duration: 3000,
                width: "20em",
            })
        }
        else {
            let projectManager;
            const data = sap.ui.getCore().getModel("mPageData").getProperty('/')
            let projectData = project_info.filter((item) => item.so_id == data.soIds);
            let soData = await projectData[0].r_project_so.fetch();
            let profitCenter = await soData[0].r_profit_center.fetch();
            for (let i = 0; i < profitCenter.length; i++) {
                if (profitCenter[i].profit_center == projectData[0].profit_center)
                    projectManager = profitCenter[i].project_manager;
            }
            for (let i = 0; i < org.length; i++) {
                //Mail Trigger
                await this.tm.getTN("project_mail").setProperty("type", "invoiceRequest");
                await this.tm.getTN("project_mail").setProperty("finance", org[i].employee_id);
                await this.tm.getTN("project_mail").setProperty("soNo", data.soIds);
                await this.tm.getTN("project_mail").setProperty("projectName", data.projectName);
                await this.tm.getTN("project_mail").setProperty("milestoneName", oPageModel.getProperty(sPath + '/milestoneName'));
                await this.tm.getTN("project_mail").setProperty("currentDate", new Date());
                await this.tm.getTN("project_mail").setProperty("projectManager", projectManager);
                await this.tm.getTN("project_mail").executeP();
            }
        }
    }

    /**
 * Creates a new entry in the invoice header table with default values.
 */
    public async onMakingInvoiceEntry(oEvent: Event) {
        try {
            // --- Get invoice table ---
            const invoiceTable = await this.transaction.getQueryP("d_invoice_request_hdr_table");
            invoiceTable.setLoadAll(true);
            const invoiceAllData = await invoiceTable.executeP();

            // --- Get model ---
            const oModel = sap.ui.getCore().getModel("mPageData");
            if (!oModel) throw new Error("Model 'mPageData' not found");

            // --- Get selected row data ---
            const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext("mPageData")?.getPath();
            if (!sRowPath) throw new Error("Unable to resolve binding context path");

            const rowData = oModel.getProperty(sRowPath);
            if (!rowData) throw new Error(`Row data not found for path: ${sRowPath}`);

            // --- Preloaded master data ---
            const customerGST = oModel.getProperty("/gstin") || "";
            const companyCode = oModel.getProperty("/companyCode");
            const businessArea = oModel.getProperty("/businessAreaId");
            const projectId = oModel.getProperty("/projectId");
            const soId = oModel.getProperty("/soIds");
            const currency = oModel.getProperty("/currency") || "INR";
            const customerId = oModel.getProperty("/customer_id");

            if (!companyCode || !businessArea) {
                throw new Error("Missing mandatory Company Code or Business Area in model data");
            }

            // --- Business Area ---
            const businessAreaDetailsList = await this.transaction.getExecutedQuery("d_o2c_business_area", {
                loadAll: true,
                business_area: businessArea,
                partialSelect: ["company_code", "business_area", "tax_rule"]
            });
            const businessAreaDetails = businessAreaDetailsList?.[0];
            if (!businessAreaDetails) throw new Error("Business area details not found");

            // --- GST Master ---
            const gstTaxMasterList = await this.transaction.getExecutedQuery("d_o2c_ind_gst_tax_master", {
                loadAll: true,
                billing_type: rowData.billing_type
            });
            const gstTax = gstTaxMasterList?.[0];
            const taxPercentage = +(gstTax?.tax_percentage || 0);
            const sacCode = gstTax?.hsc_sac_code || null;

            // --- LUT Details ---
            const lutDetails = await this.transaction.getExecutedQuery("d_o2c_ind_gst_general_config", { loadAll: true });
            const lutNumber = lutDetails?.[0]?.lut_code || null;

            // --- Company Details ---
            const companyDetailsList = await this.transaction.getExecutedQuery("d_o2c_invoice_irn_table", {
                loadAll: true,
                company_code: companyCode,
                business_area: businessArea
            });
            if (!companyDetailsList?.length) {
                throw new Error(`Company details not found for ${companyCode} / ${businessArea}`);
            }
            const companyStateCode = companyDetailsList[0].state_code || "";

            // --- Customer Address ---
            let customerCountryCode: string | null = null;
            if (customerId) {
                const customerAddress = await this.transaction.getExecutedQuery("d_o2c_customers_map", {
                    loadAll: true,
                    customer_id: customerId,
                    partialSelect: ["customer_id", "country_code"],
                });
                const customerAddressDetail = customerAddress?.[0];
                customerCountryCode = customerAddressDetail.country_code || 'IND';
            }

            // --- Amount & Taxes ---
            const amount = parseFloat(String(rowData.Amount || "0").replace(/,/g, ""));
            const isInternationalCustomer = currency !== "INR";
            const buyerStateCode = customerGST?.substring(0, 2) || "";

            let cgst = 0, sgst = 0, igst = 0;
            if (!isInternationalCustomer && businessAreaDetails.tax_rule === "gst" && taxPercentage > 0) {
                if (buyerStateCode === companyStateCode) {
                    cgst = +(amount * taxPercentage / 200).toFixed(2); // Half each
                    sgst = +(amount * taxPercentage / 200).toFixed(2);
                } else {
                    igst = +(amount * taxPercentage / 100).toFixed(2);
                }
            }

            const totalTax = +(cgst + sgst + igst).toFixed(2);
            const totalInvoice = +(amount + totalTax).toFixed(2);
            const finalLutNumber = isInternationalCustomer ? lutNumber : null;
            const soGuid = project_so_info
                ?.filter((item) => item.so === soId)
                ?.map((item) => item.so_guid) || null;

            // --- Create Invoice ---
            await invoiceAllData.newEntityP(0, {
                s_object_type: -1,
                milestone_number: rowData.rowID,
                company_code: companyCode,
                business_area: businessArea,
                status: "New",
                so: soId,
                project_id: projectId,
                po_number: rowData.poNumber || "",
                invoice_date: new Date(),
                billing_type: rowData.billing_type,
                cgst,
                sgst,
                igst,
                total_tax: totalTax,
                total_invoice: totalInvoice,
                gstin_lut: finalLutNumber,
                sac_code: sacCode,
                invoice_origin_country: customerCountryCode,
                unit: rowData.unit,
                so_guid: soGuid[0],
                currently_pending_with: "finance_team"
            });

            console.log(`Invoice entry created for milestone: ${rowData.rowID}`);
        } catch (error) {
            const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext("mPageData")?.getPath();
            console.error(`Error creating invoice entry for milestone [${sRowPath ?? "unknown"}]:`, error);
        }
    }


    /**
     * onPressAddBillMilestoneBtn
     */
    public onPressAddBillMilestoneBtn() {
        const aTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableBillingMilestone');

        aTableData.push(
            {
                poNumber: '',
                poDate: '',
                milestoneName: '',
                startDate: '',
                endDate: '',
                actualEndDate: '',
                invoiceStatus: '',
                VS_attachSignUpDoc: 'None',
                attachSignUpDocFileName: '',
                attachSignUpDoc: '',
                signupDocDownloaded: '',
                VS_attachTimesheetUpload: 'None',
                attachTimesheetUploadFileName: '',
                attachTimesheetUpload: '',
                timesheetUploadDownloaded: '',
                attachCopyDownloaded: '',
                attachCopyFileName: '',
                proposalCopyDownloaded: '',
                proposalCopyFileName: '',
                invoiceDate: '',
                invoiceNo: ''
            }
        );

        sap.ui.getCore().getModel("mPageData").setProperty('/tableBillingMilestone/', aTableData);
    }

    /**
     * onPressBtnStartProject
     */
    public async onPressBtnStartProject() {
        project_info[0].s_status = 'Active';
        // project_info[0].trans_status = project_info[0].s_status;
        sap.ui.getCore().getModel("mPageData").setProperty('/projectStatus', project_info[0].trans_status);
        await this.tm.commitP("Project Started", "Save Failed", true, true);

    }
    /**
     * onPressBtnHold
     */
    public async onPressBtnHold() {
        project_info[0].s_status = 'Hold';
        // project_info[0].trans_status = project_info[0].s_status;
        sap.ui.getCore().getModel("mPageData").setProperty('/projectStatus', project_info[0].trans_status);
        await this.tm.commitP("On Hold", "Save Failed", true, true);

    }
    /**
     * onPressBtnResume
     */
    public async onPressBtnResume() {
        await this.setProjectStatus();
        sap.ui.getCore().getModel("mPageData").setProperty('/projectStatus', project_info[0].trans_status);
        await this.tm.commitP("Project Resumed", "Save Failed", true, true);

    }

    /**
     * onPressAdProjMilestoneBtn
     */
    public onPressAdProjMilestoneBtn() {
        const aTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableProjectMilestone');

        aTableData.push(
            {
                rowID: '',
                poNumber: '',
                poDate: '',
                milestoneName: '',
                startDate: '',
                endDate: '',
                actualEndDate: '',
                status: ''
            }
        );

        sap.ui.getCore().getModel("mPageData").setProperty('/tableProjectMilestone/', aTableData);
    }

    /**
     * onPressResourceBtn
     */
    public onPressResourceBtn() {
        const aTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableResourcePlanning');

        aTableData.push(
            {
                rowID: '',
                isRowEditable: true,
                mmid: '',
                name: '',
                role: '',
                skill: '',
                lineManagerMmid: '',
                lineManagerName: '',
                startDate: '',
                endDate: '',
                startDateBackup: '',
                endDateBackup: '',
                isDateChanged: false,
                occupationPercentage: '',
                plannedPds: '',
                consumedPDs: '',
                approvalStatus: 'Pending',
                shadowOf: '',
                remark: '',
                isOnsite: false,
                taskID: '',
            }
        );

        sap.ui.getCore().getModel("mPageData").setProperty('/tableResourcePlanning/', aTableData);
    }

    /**
     * onChangeProjMilestoneStartDate
     */
    public onChangeProjMilestoneStartDate(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        // Validate StartDate With EndDate
        const { startDate, endDate } = oPageModel.getProperty(sPath);
        if (endDate !== '' && !isEndDateBiggerThanStartDate(startDate, endDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('Start Date Is Bigger Than End Date')
        }
    }

    /**
     * onChangeProjMilestoneEndDate
     */
    public onChangeProjMilestoneEndDate(oEvent: Event) {
        const sPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oPageModel = sap.ui.getCore().getModel("mPageData");

        // Validate StartDate With EndDate
        const { startDate, endDate } = oPageModel.getProperty(sPath);
        if (startDate === '') {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('Please Fill Start Date First');
        }
        else if (!isEndDateBiggerThanStartDate(startDate, endDate)) {
            oEvent.getSource().setValue('');
            this.fnShowErrorPopup('End Date Is Smaller Than Start Date');
        }
    }

    /*
    * onChangeResourceMMMID
    */
    public async onChangeResourceMMMID(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const rowMMID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/mmid');

        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/approvalStatus', 'Pending');

        // Get Employee List
        const aEmployeeList = sap.ui.getCore().getModel("mPageData").getProperty('/aEmployeeList');
        const { lmi_id, emp_lmi } = aEmployeeList.find(({ emp_id }) => emp_id === rowMMID);

        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/lineManagerMmid', lmi_id);
        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/lineManagerName', emp_lmi);


        //Project Manager and line manager is same then status should be approved otherwise Pending
        //--START--//
        const projectManager = [];
        for (let i = 0; i < project_so_info[0].r_profit_center.length; i++) {
            projectManager[i] = project_so_info[0].r_profit_center[i].project_manager;
        }
        if ((projectManager.includes(lmi_id)) && (lmi_id == ((await this.transaction.get$User()).login_id).toUpperCase()) || rowMMID == ((await this.transaction.get$User()).login_id).toUpperCase())) {
            sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/approvalStatus', 'Approved');
        }
        //--END--//
    }

    /**
     * onChangeResourceSkill
     */
    public onChangeResourceSkill(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const rowMMID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/mmid');
        // Albia -- todo ..
    }

    public async onPressMonthlyPanRowEdit(oEvent: Event) {
        const sRowPath = oEvent.getSource().getParent().getBindingContextPath();
        const sMonthYear = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/month');

        const [SelectedMonth, SelectedYear] = sMonthYear.split(" ");
        const [CurrentMonth, CurrentYear] = ((new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })).split(" ");

        const calcMonthDifferenceFormCurrMonth = (month: string, year: number) => {
            // Find Difference in Months
            const selectedMonthYear = new Date(month + '-1-' + year);
            const currentMonthYear = new Date(CurrentMonth + '-1-' + CurrentYear);
            let monthDifference: number;

            monthDifference = (currentMonthYear.getFullYear() - selectedMonthYear.getFullYear()) * 12;
            monthDifference -= selectedMonthYear.getMonth();
            monthDifference += currentMonthYear.getMonth();

            return monthDifference;
        }

        const monthDifference = calcMonthDifferenceFormCurrMonth(SelectedMonth, SelectedYear);

        // If Month is 2 Month Or Older Show Not Editable Warning
        if (monthDifference >= 2) {
            this.fnShowErrorPopup('You do not have permission to edit data that is older than two months from your working days.');
        }
        // If Month Is 1 Month Older - Then , Check Working Day From Backend
        else if (monthDifference === 1) {
            this.fnShowBusyDialog(true, "Checking , If Today\'s date belong to your first 7 working day of this month or not");
            const monthNumber = new Date(SelectedMonth + '-1-01').getMonth();
            const nextMonthData = new Date(SelectedYear, monthNumber + 1, 1);
            // const noOfWorkingDays = 7;
            const workingDaysConfig = <KloEntitySet<d_general_confg>>await this.transaction.getExecutedQuery("d_general_confg", { loadAll: true, key: "noOfWorkingDays" });
            const lastExclusiveWorkingDate = await calendarworkingdays.fnGetDateByWorkingDays(this.transaction, nextMonthData.getFullYear(), nextMonthData.getMonth(), workingDaysConfig[0].high_value);
            this.fnShowBusyDialog(false);

            // - is today is in 7 working day -> Allow Edit

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastDate = new Date(lastExclusiveWorkingDate);
            lastDate.setHours(0, 0, 0, 0);

            if (today <= lastDate) {
                sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/isEditInProgress', true);
            }

            // - If not working day -> Show Warning
            else {
                this.fnShowErrorPopup("Effort planning is allowed only in first 7 working days.");
            }
        }
        // If Month is Current or Next Month -> Allow Edit
        else {
            sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/isEditInProgress', true);
        }
    }

    /**
     * onPressStakeholderButton
     */
    public onPressStakeholderButton() {
        const aTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableProjectStakeholders');

        aTableData.push(
            {
                rowID: '',
                name: '',
                role: '',
                statusMail: true,
                StatusCall: true,
                signatory: []
            }
        );

        sap.ui.getCore().getModel("mPageData").setProperty('/tableProjectStakeholders/', aTableData);
    }

    /**
     * onPressAddDocumentBtn
     */
    public onPressAddDocumentBtn() {
        const aTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableProjectDocument');

        aTableData.push(
            {
                rowID: '',
                attachmentName: '',
                isMandatory: false,
                attachmentDownloaded: '',
                attachment: '',
                attachmentFileName: '',
                milestone: '',
            }
        );

        sap.ui.getCore().getModel("mPageData").setProperty('/tableProjectDocument/', aTableData);
    }

    public async fnSubmitData() {
        if (!this.fnValidateDataBeforeSubmit()) {
            return;
        }

        //task Assignment
        let saveFlagReturn = await this.ontaskAssignment();
        if (saveFlagReturn != true) {
            this.fnShowBusyDialog(true, 'Saving');
            await this.onDataFillInTable();
            await this.setProjectStatus();
            const projectStatus = sap.ui.getCore().getModel("mPageData").getProperty('/projectStatus');
            if (projectStatus == "Completed") {
                this.fnShowBusyDialog(false);
                sap.m.MessageBox.confirm(
                    "Do you want to complete this project, after completion you will not be able to edit this project .",
                    {
                        title: "Confirm",
                        actions: ["OK", "Cancel"],
                        emphasizedAction: "OK",
                        onClose: async (oAction) => {
                            if (oAction == "OK") {
                                await this.tm.commitP("Save Successfully", "Save Failed", true, true);
                                await this.tm.getTN("project_mail").executeP();
                            }
                            else {
                                this.navTo({ S: "p_project_list" });
                                this.fnShowBusyDialog(false);
                            }
                        },
                    }
                );
            }
            else {
                await this.tm.commitP("Save Successfully", "Save Failed", true, true);
                this.fnShowBusyDialog(false);
                await this.tm.getTN("project_mail").executeP();
            }
        }

    }

    public async setProjectStatus() {
        const ProjectMilestoneTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableProjectMilestone');
        const ProjectMilestoneStatus = Array.from(new Set(ProjectMilestoneTableData.map(item => item.status)));

        const BillingMilestoneTableData = sap.ui.getCore().getModel("mPageData").getProperty('/tableBillingMilestone');
        const billingMilestoneStatus = Array.from(new Set(BillingMilestoneTableData.map(item => item.invoiceStatus)));


        if (ProjectMilestoneStatus.length == 1 && ProjectMilestoneStatus[0] == "Closed") {
            project_info[0].s_status = "Delivery Closed";
            // project_info[0].trans_status = project_info[0].s_status;
            flag = true;
        }
        if (billingMilestoneStatus.length == 1 && billingMilestoneStatus[0] == "Invoiced") {
            project_info[0].s_status = "Billing Closed";
            //project_info[0].trans_status = project_info[0].s_status;
            flag = true;
        }
        if ((billingMilestoneStatus.length == 1 && billingMilestoneStatus[0] == "Invoiced") && (ProjectMilestoneStatus.length == 1 && ProjectMilestoneStatus[0] == "Closed")) {
            project_info[0].s_status = "Completed";
            //project_info[0].trans_status = project_info[0].s_status;
            //project_so_info[0].s_status = "Closed";
            flag = true;
        }
        else {
            if (project_info[0].s_status != "Created" && flag == false)
                project_info[0].s_status = "Active";
            // project_info[0].trans_status = project_info[0].s_status;
        }
        sap.ui.getCore().getModel("mPageData").setProperty('/projectStatus', project_info[0].trans_status);
    }

    public fnInputBoxResetValueState(oEvent: Event) {
        if (oEvent) {
            if (oEvent.getSource().mProperties.type === "Number") {
                // This code will prevent mouse scroll because Input Type == number get changed on mouse scroll
                oEvent.getSource().attachBrowserEvent("mousewheel", function (oEvent) {
                    oEvent.preventDefault();
                });
            }

            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        }
    }

    public fnResetSetValueStateErrorNoActPath(sPath: string, isError: boolean = false, sErrMsg: string = "", oModel: any = null) {
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

        oModel.setProperty(vStatePath, isError ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.None);
        oModel.setProperty(vTextPath, sErrMsg);
    }

    public isInvalidInputBoxEntry(sPath: string, inputType: string, isRequired: boolean, oModel: any = null) {
        const VAL_TYPES = this.VALID_TYPES;

        let inputValue: any;
        if (oModel) {
            inputValue = oModel.getProperty(sPath);
        } else {
            inputValue = sap.ui.getCore().getModel("mPageData").getProperty(sPath);
        }

        let isInputValidFlag = true;
        let sErrMessage = "";

        if (isRequired && (inputValue === undefined || inputValue === null || inputValue === "")) {
            isInputValidFlag = false;
            sErrMessage = "This Field Should Not Be Empty";
        }
        if (!(inputValue === undefined || inputValue === null || inputValue === "")) {
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
                if (!/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9_-]+\/?$/.test(inputValue)) {
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
            this.fnResetSetValueStateErrorNoActPath(sPath, true, sErrMessage, oModel ? oModel : null);
            return true;
        }
    }

    public fnValidateDataBeforeSubmit() {
        const VAL_TYPES = this.VALID_TYPES;

        const oModel = sap.ui.getCore().getModel("mPageData");
        const orderTypeSelected = sap.ui.getCore().getModel("mPageData").getProperty("/orderTypeSelected");

        let totalInvalidInputCount = 0;
        let aErrorMessages = [];

        let aValidInputs = [];

        // * MR CR Details
        // aValidInputs = [
        //     this.isInvalidInputBoxEntry("/remark", VAL_TYPES.TEXT, true),
        // ];

        // if (aValidInputs.find((error) => error)) {
        //     // if error === true
        //     aErrorMessages.push("MR and CR Consumption has some issue. Actual error can be seen at field. Please correct and retry.");
        //     totalInvalidInputCount++;
        // }

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

    public async onDataFillInTable() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");

        //Planned PDS
        project_info[0].planned_pds = data.plannedPDs;
        //Booked PDS
        project_info[0].booked_pds_new = data.bookedPDs;
        //Billing Milestone
        for (let i = 0; i < data.tableBillingMilestone.length; i++) {
            const element = data.tableBillingMilestone[i];

            this.onCreateAttachment(element, false);

            // let billingTable;
            // billingTable = billing_data.filter((item) => item.billing_milestone === element.rowID || item.schedule_no === element.rowID);

            // if (element.attachSignUpDoc != "")
            //     await billingTable[0].signupdoc.setAttachmentP(
            //         element.attachSignUpDoc,
            //         element.attachSignUpDoc.name
            //     );
            // if (element.attachTimesheetUpload != "")
            //     await billingTable[0].timesheet_upload.setAttachmentP(
            //         element.attachTimesheetUpload,
            //         element.attachTimesheetUpload.name
            //     );
            // billingTable[0].inv_requested_date = new Date(element.actualEndDateVisible);
            // billingTable[0].remark = element.remark;
        }
        //Project Milestone
        for (let i = 0; i < data.tableProjectMilestone.length; i++) {
            const element = data.tableProjectMilestone[i];

            let projectMilestoneTable;
            projectMilestoneTable = project_milestone.filter((item) => item.project_milestone_id == element.rowID);
            //if (projectMilestoneTable == undefined || (projectMilestoneTable != undefined && projectMilestoneTable.length == 0)) {
            if (!(projectMilestoneTable.length)) {
                const projectMilestone = await this.transaction.getQueryP("d_o2c_project_milestone");
                projectMilestone.setLoadAll(true);
                const newProjectMilestone = await projectMilestone.executeP();
                projectMilestoneTable[0] = await newProjectMilestone.newEntityP(0, { s_object_type: -1 });
                element.rowID = projectMilestoneTable[0].project_milestone_id;
                project_milestone.push(projectMilestoneTable[0]);
            }
            projectMilestoneTable[0].project_guid = project_info[0].project_guid;
            projectMilestoneTable[0].project_id = project_info[0].project_id;
            projectMilestoneTable[0].po_no = element.poNumber;
            projectMilestoneTable[0].po_date = new Date(element.poDate);
            projectMilestoneTable[0].milestone_name = element.milestoneName;
            projectMilestoneTable[0].start_date = new Date(element.startDate);
            projectMilestoneTable[0].end_date = new Date(element.endDate);
            projectMilestoneTable[0].actual_date = new Date(element.actualEndDate);
            projectMilestoneTable[0].s_status = element.status;

        }
        //Resource Planning
        await this.resourceFill();
        //Monthly Planning
        await this.monthlyPlanFill();
        //Project Stakeholders
        for (let i = 0; i < data.tableProjectStakeholders.length; i++) {
            const element = data.tableProjectStakeholders[i];

            let ProjectStakeholderTable, signatoryData = "";
            ProjectStakeholderTable = project_stakeholder.filter((item) => item.stakeholder_guid == element.rowID);
            if (!(ProjectStakeholderTable.length)) {
                //if (ProjectStakeholderTable == undefined || (ProjectStakeholderTable != undefined && ProjectStakeholderTable.length == 0)) {
                const ProjectStakeholders = await this.transaction.getQueryP("d_o2c_project_stakeholders");
                ProjectStakeholders.setLoadAll(true);
                const newProjectStakeholders = await ProjectStakeholders.executeP();
                ProjectStakeholderTable[0] = await newProjectStakeholders.newEntityP(0, { s_object_type: -1 });
                element.rowID = ProjectStakeholderTable[0].stakeholder_guid;
                project_stakeholder.push(ProjectStakeholderTable[0]);
            }
            ProjectStakeholderTable[0].project_guid = project_info[0].project_guid;
            ProjectStakeholderTable[0].project_id = project_info[0].project_id;
            ProjectStakeholderTable[0].name = element.name;
            ProjectStakeholderTable[0].role_in_project = element.role;
            ProjectStakeholderTable[0].status_mail_required = element.statusMail;
            ProjectStakeholderTable[0].status_call_required = element.StatusCall;
            for (let i = 0; i < element.signatory.length; i++) {
                signatoryData = element.signatory[i] + "," + signatoryData
            }
            ProjectStakeholderTable[0].signatory = signatoryData.substring(0, signatoryData.length - 1);

        }
        //Project Document
        await this.documentFill();

    }
    public async documentFill() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        for (let i = 0; i < data.tableProjectDocument.length; i++) {
            const element = data.tableProjectDocument[i];

            this.onCreateProjectDocument(element, false);

            // let ProjectDocumentTable;
            // ProjectDocumentTable = project_document.filter((item) => item.document_guid == element.rowID);
            // if (!(ProjectDocumentTable.length)) {
            //     //if (ProjectDocumentTable == undefined || (ProjectDocumentTable != undefined && ProjectDocumentTable.length == 0)) {
            //     const ProjectDocument = await this.transaction.getQueryP("d_o2c_project_document");
            //     ProjectDocument.setLoadAll(true);
            //     const newProjectDocument = await ProjectDocument.executeP();
            //     ProjectDocumentTable[0] = await newProjectDocument.newEntityP(0, { s_object_type: -1 });
            //     element.rowID = ProjectDocumentTable[0].document_guid;
            //     project_document.push(ProjectDocumentTable[0]);
            // }
            // ProjectDocumentTable[0].project_guid = project_info[0].project_guid;
            // ProjectDocumentTable[0].project_id = project_info[0].project_id;
            // if (element.attachment != "")
            //     await ProjectDocumentTable[0].attached.setAttachmentP(
            //         element.attachment,
            //         element.attachment.name
            //     );
            // ProjectDocumentTable[0].document_name = element.attachmentName;
            // ProjectDocumentTable[0].is_manadatory = element.isMandatory;
            // //ProjectDocumentTable[0].document_attachment = element.attachment;
            // ProjectDocumentTable[0].shared_on_mail_attch = element.milestone;
            // ProjectDocumentTable[0].other_description = element.milestoneOther;
        }
    }
    public async plannedPDs(sRowPath) {
        const tableResourcePlanning = sap.ui.getCore().getModel("mPageData").getProperty("/tableResourcePlanning");
        let calculatePlannedPDs = 0;
        for (let i = 0; i < tableResourcePlanning.length; i++) {
            let workingDays = await calendarworkingdays.fnGetWorkingDayByRange(this, project_so_info[0].business_area, new Date(tableResourcePlanning[i].startDate), new Date(tableResourcePlanning[i].endDate));
            const noOfWorkingDays = workingDays.length;
            const noOfWorkingHours = noOfWorkingDays;
            const noOfWorkingBasedPercentage = parseFloat((parseFloat(tableResourcePlanning[i].occupationPercentage * noOfWorkingHours) / 100).toFixed(2));
            const oPageModel = sap.ui.getCore().getModel("mPageData");
            if ((oPageModel.getProperty(sRowPath + "/startDate")) != '' && (oPageModel.getProperty(sRowPath + "/endDate")) != '' && (oPageModel.getProperty(sRowPath + "/occupationPercentage")) != '' && (i == parseInt(sRowPath.replace("/tableResourcePlanning/", "")))) {
                oPageModel.setProperty(sRowPath + '/plannedPds', noOfWorkingBasedPercentage);
            }
            calculatePlannedPDs += noOfWorkingBasedPercentage;
        }
        calculatePlannedPDs = parseFloat(calculatePlannedPDs.toFixed(2));
        sap.ui.getCore().getModel("mPageData").setProperty('/plannedPDs', (calculatePlannedPDs));


    }

    public async monthlyPlanFill() {
        // Monthly Planning
        const tableMonthlyPlanning = sap.ui.getCore().getModel("mPageData").getProperty("/tableMonthlyPlanning");
        for (let i = 0; i < tableMonthlyPlanning.length; i++) {
            const rowMonthlyPlanning = tableMonthlyPlanning[i];

            let MonthlyPlanningTable;
            MonthlyPlanningTable = project_monthly.filter((item) => item.plan_id == rowMonthlyPlanning.rowID);
            if (!(MonthlyPlanningTable.length)) {
                const monthlyPlanning = await this.transaction.getQueryP("d_o2c_project_month_plan");
                monthlyPlanning.setLoadAll(true);
                const newMonthlyPlanning = await monthlyPlanning.executeP();
                MonthlyPlanningTable[0] = await newMonthlyPlanning.newEntityP(0, { s_object_type: -1 });
                rowMonthlyPlanning.rowID = MonthlyPlanningTable[0].plan_id;
                project_monthly.push(MonthlyPlanningTable[0]);
            }

            const [month, year] = rowMonthlyPlanning.month.split(" ");
            const monthFirstDate = new Date(month + '-1-' + year);
            const monthLastDate = new Date(monthFirstDate.getFullYear(), monthFirstDate.getMonth() + 1, 0);

            MonthlyPlanningTable[0].project_guid = project_info[0].project_guid;
            MonthlyPlanningTable[0].project_id = project_info[0].project_id;
            MonthlyPlanningTable[0].start_date = monthFirstDate;
            MonthlyPlanningTable[0].end_date = monthLastDate;
            MonthlyPlanningTable[0].planned_hours = rowMonthlyPlanning.plannedEfforts;
            // MonthlyPlanningTable[0].consume_hours = rowMonthlyPlanning.consumedEfforts; -- TODO
        }
    }
    public async resourceFill() {
        let resourceArray = [];
        //Resource Planning
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        for (let i = 0; i < data.tableResourcePlanning.length; i++) {
            const element = data.tableResourcePlanning[i];

            let ResourcePlanningTable;
            ResourcePlanningTable = resource_planning.filter((item) => item.resource_guid == element.rowID);
            if (!(ResourcePlanningTable.length)) {
                //if (ResourcePlanningTable == undefined || (ResourcePlanningTable != undefined && ResourcePlanningTable.length == 0)) {
                const resourcePlanning = await this.transaction.getQueryP("d_o2c_project_resource");
                resourcePlanning.setLoadAll(true);
                const newResourcePlanning = await resourcePlanning.executeP();
                ResourcePlanningTable[0] = await newResourcePlanning.newEntityP(0, { s_object_type: -1 });
                element.rowID = ResourcePlanningTable[0].resource_guid;
                resource_planning.push(ResourcePlanningTable[0]);
                // await this.tm.getTN("project_mail").setProperty("LineManagerName", element.lineManagerName);
                // await this.tm.getTN("project_mail").setProperty("LineManagerID", element.lineManagerMmid);
                // await this.tm.getTN("project_mail").setProperty("StartDate", element.startDate);
                // await this.tm.getTN("project_mail").setProperty("EndDate", element.endDate);
                // await this.tm.getTN("project_mail").setProperty("ProjectName", data.projectName);
                // await this.tm.getTN("project_mail").setProperty("Percentage", element.occupationPercentage);
                // await this.tm.getTN("project_mail").setProperty("SONo", data.soIds);
                resourceArray.push(element.rowID);
                await this.tm.getTN("project_mail").setProperty("type", "resourceAdd");
                await this.tm.getTN("project_mail").setProperty("ResourceArray", resourceArray);
                await this.tm.getTN("project_mail").setProperty("ProjectName", data.projectName)
                await this.tm.getTN("project_mail").setProperty("SONo", data.soIds);

            }

            ResourcePlanningTable[0].project_guid = project_info[0].project_guid;
            ResourcePlanningTable[0].project_id = project_info[0].project_id;
            ResourcePlanningTable[0].employee_id = element.mmid;
            ResourcePlanningTable[0].skill_id = element.skill;
            ResourcePlanningTable[0].customer_role = element.role;
            ResourcePlanningTable[0].line_manager_id = element.lineManagerMmid
            ResourcePlanningTable[0].line_manager_name = element.lineManagerName
            ResourcePlanningTable[0].start_date = new Date(element.startDate);
            ResourcePlanningTable[0].end_date = new Date(element.endDate);
            ResourcePlanningTable[0].percentage = element.occupationPercentage;
            ResourcePlanningTable[0].plannedpds = element.plannedPds;
            // ResourcePlanningTable[0].TODO_ALBIA = element.consumedPDs;
            ResourcePlanningTable[0].s_status = element.approvalStatus;
            ResourcePlanningTable[0].shadow_of = element.shadowOf;
            ResourcePlanningTable[0].remark = element.remark;
            ResourcePlanningTable[0].onsite = element.isOnsite;
            ResourcePlanningTable[0].task_id = element.taskID;
        }
    }
    public async onPressMonthlyPlanSaveBtn() {
        this.fnShowBusyDialog(true, 'Saving');
        //Monthly Planning
        await this.monthlyPlanFill();
        await this.tm.commitP("Monthly Planning Save Successfully", "Save Failed", true, true);
        this.fnShowBusyDialog(false);

    }
    public async onPressResourceSaveBtn() {
        this.fnShowBusyDialog(true, 'Saving');
        //Task Assig.
        let saveFlagReturn = await this.ontaskAssignment();
        if (saveFlagReturn != true) {
            //Resource Planning
            await this.resourceFill();
            await this.tm.commitP("Resource Planning Save Successfully", "Save Failed", true, true);
        }
        this.fnShowBusyDialog(false);

    }
    public async onPressDeleteProjectMilestone(rowID) {
        if (rowID) {
            let deleteProjectMilestone = await this.transaction.getExecutedQuery("d_o2c_project_milestone", { loadAll: true, project_milestone_id: rowID });
            await deleteProjectMilestone[0].deleteP();
            await this.tm.commitP("Project Milestone Deleted Successfully", "Delete Failed", true, true);
        }
    }
    public async onPressDeleteResourcePlanning(sRowPath, rowID) {
        if (rowID) {
            const data = sap.ui.getCore().getModel("mPageData").getProperty('/')
            const lineManagerId = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/lineManagerMmid');
            const lineManager = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/lineManagerName');
            const resourceId = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/mmid');
            const resourceRole = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/role');
            const resourceTaskID = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath + '/taskID');

            const resourceName = data.aEmployeeList.filter((item) => item.emp_id == resourceId);

            let deleteResource = await this.transaction.getExecutedQuery("d_o2c_project_resource", { loadAll: true, resource_guid: rowID });
            await deleteResource[0].deleteP();

            await this.tm.getTN("project_mail").setProperty("type", "resourceDeboarding");
            await this.tm.getTN("project_mail").setProperty("resourceGuid", rowID);
            await this.tm.getTN("project_mail").setProperty("resourceId", resourceId);
            await this.tm.getTN("project_mail").setProperty("lineManager", lineManager);
            await this.tm.getTN("project_mail").setProperty("resourceName", resourceName);
            await this.tm.getTN("project_mail").setProperty("projectName", data.projectName);
            await this.tm.getTN("project_mail").setProperty("currentDate", new Date());
            await this.tm.getTN("project_mail").setProperty("resourceRole", resourceRole);
            await this.tm.getTN("project_mail").executeP();
            await this.tm.commitP("Resource Deleted Successfully", "Delete Failed", true, true);

        }
    }
    public async onPressDeleteProjectStakeholder(rowID) {
        if (rowID) {
            let deleteProjectStakeholders = await this.transaction.getExecutedQuery("d_o2c_project_stakeholders", { loadAll: true, stakeholder_guid: rowID });
            await deleteProjectStakeholders[0].deleteP();
            await this.tm.commitP("Project Stakeholder Deleted Successfully", "Delete Failed", true, true);
        }
    }
    public async onPressDeleteProjectDocument(rowID) {
        if (rowID) {
            let deleteProjectDocument = await this.transaction.getExecutedQuery("d_o2c_project_document", { loadAll: true, document_guid: rowID });
            await deleteProjectDocument[0].deleteP();
            await this.tm.commitP("Project Document Deleted Successfully", "Delete Failed", true, true);
        }
    }
    public async empidFunction() {

        let desig;
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        //checking by removing the query inside loopss
        let desig_master = await this.transaction.getExecutedQuery('d_o2c_designation_master', { loadAll: true, 'company_code': data.companyCode, 'name': "FINANCE" })
        if (desig_master.length) {
            desig = await this.transaction.getExecutedQuery('q_so_desig_fch', { loadAll: true, designation: desig_master[0].designation_id, from_date: new Date(), to_date: new Date() });

        }
        let Array = [];
        for (let i = 0; i < desig.length; i++) {
            Array[i] = desig[i].employee_id;
        }
        if (Array.length)
            org = await this.transaction.getExecutedQuery('q_empid_acc_design', { loadAll: true, employee_id: Array, business_area: data.businessAreaId, company_code: data.companyCode, active_till: new Date(), active_from: new Date() });

    }
    public async reserveConsumption(manRes, conRes, reason) {
        let reserveConsumeTable;
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        const reserveConsume = await this.transaction.getQueryP("d_o2c_reserve_consumption");
        reserveConsume.setLoadAll(true);
        const newReserveConsume = await reserveConsume.executeP();
        reserveConsumeTable = await newReserveConsume.newEntityP(0, { s_object_type: -1 })
        reserveConsumeTable.project_guid = project_info[0].project_guid;
        reserveConsumeTable.project_id = project_info[0].project_id;
        reserveConsumeTable.managment_reserve = manRes;
        reserveConsumeTable.contigency_reserve = conRes;
        reserveConsumeTable.reason = reason;
        reserveConsumeTable.s_status = "Pending";

    }

    public async onPressAddConsumptionBtn() {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', { loadAll: true, 'project_id': data.projectId, skipMap: true });
        sap.ui.getCore().getModel("mPageData").setProperty('/managementReserve', projectData[0].mreserve_new);
        sap.ui.getCore().getModel("mPageData").setProperty('/contingencyReserve', projectData[0].mcontig_new);
        sap.ui.getCore().getModel("mPageData").setProperty('/availablePDs', projectData[0].available_pds_new);
        const oView = this.getView();
        const sViewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_project_mr_cr_add_popup";

        this.popupDialogBox = await sap.ui.core.Fragment.load({ name: sViewName, controller: this });
        this.popupDialogBox.setModel(new sap.ui.model.json.JSONModel({
            reason: '',
            pDs: ''
        }))
        oView.addDependent(this.popupDialogBox);
        this.popupDialogBox.open();
    }

    public async onMrCRPopupSaveBtnPress() {
        const oModelPopup = this.popupDialogBox.getModel();

        const aAllInputErrors = [
            this.isInvalidInputBoxEntry("/reason", this.VALID_TYPES.TEXT, true, oModelPopup),
            this.isInvalidInputBoxEntry("/pDs", this.VALID_TYPES.NUM, true, oModelPopup)
        ];

        if (aAllInputErrors.find((error) => error)) return; // if error === true

        const { ...oData } = oModelPopup.getProperty("/");


        const { reason, pDs } = oData;
        const oPageModel = sap.ui.getCore().getModel("mPageData");
        oPageModel.setProperty('/PopupReason', reason);
        oPageModel.setProperty('/PopupPds', pDs);

        const projectReserveConsume = oPageModel.getProperty('/mrAndCrTable');

        const consume = await this.onMrCrCalculation();
        const rowDate = new Date();
        if (consume[2] == true) {
            projectReserveConsume.push({
                rowID: '',
                managementReserve: consume[0],
                contingencyReserve: consume[1],
                reason: reason,
                date: rowDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                time: rowDate.toLocaleTimeString(),
                actionBy: ((await this.transaction.get$User()).login_id).toUpperCase(),
                status: "Pending",
                remark: ''
            });

            oPageModel.setProperty('/mrAndCrTable', projectReserveConsume);
            await this.reserveConsumption(consume[0], consume[1], reason);
        }
        await this.tm.commitP("Submit Successfully", "Submit Failed", true, true);
        this.popupDialogBox.destroy();
    }

    public async onMrCRPopupCloseBtnPress() {
        this.popupDialogBox.destroy();
    }

    public async onPressMrCrApprove(oEvent: Event) {
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const obTableRow: Array<any> = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath);

        let approveCheck = await this.onMrCrApproveCalculation(obTableRow.managementReserve, obTableRow.contingencyReserve);
        if (approveCheck == true) {
            project_info[0].mreserve_new = data.managementReserve;
            project_info[0].mcontig_new = data.contingencyReserve;
            project_info[0].available_pds_new = data.availablePDs;
            const filterApprovingData = project_consume.filter((item) => item.consume_id == obTableRow.rowID)
            filterApprovingData[0].s_status = "Approved";
            await this.tm.commitP("Approved Successfully", "Approved Failed", true, true);
            sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/status', "Approved");
        }

    }

    public async onPressMrCrReject(oEvent: Event) {
        const sRowPath: string = oEvent.getSource().getParent().getBindingContextPath();
        const oTableRow: Array<any> = sap.ui.getCore().getModel("mPageData").getProperty(sRowPath);
        sap.ui.getCore().getModel("mPageData").setProperty(sRowPath + '/status', "Rejected");
        const filterRejectingData = project_consume.filter((item) => item.consume_id == oTableRow.rowID)
        filterRejectingData[0].s_status = "Rejected";
        filterRejectingData[0].remark = oTableRow.remark;
        await this.tm.commitP("Rejected Successfully", "Rejected Failed", true, true);
    }
    //MR CR consumption Calculation
    public async onMrCrCalculation() {
        let tableMR = 0, tableCR = 0, createConsume = true;
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");

        if ((parseFloat(data.managementReserve + data.contingencyReserve).toFixed(2)) < (parseFloat(data.PopupPds))) {
            this.fnShowErrorPopup("Please check requested Pds consumption as it  is more than present management and contigency reserve");
            createConsume = false;
        }
        else {
            if ((parseFloat(data.managementReserve)) <= (parseFloat(data.PopupPds))) {
                tableMR = data.managementReserve;
                if (data.contingencyReserve > 0) {
                    if (data.contingencyReserve > parseFloat((data.PopupPds - data.managementReserve).toFixed(2))) {
                        tableCR = data.PopupPds - data.managementReserve;
                    }
                    else {
                        tableCR = sap.ui.getCore().getModel("mPageData").getProperty("/contingencyReserve");

                    }
                }
            }
            else {
                tableMR = data.PopupPds;
            }
        }
        return [tableMR, tableCR, createConsume];
    }

    //MR CR consumption Approve Calculation
    public async onMrCrApproveCalculation(management, contigency) {
        let approveCheck = true;
        const data = sap.ui.getCore().getModel("mPageData").getProperty("/");

        if (((parseFloat(data.managementReserve + data.contingencyReserve).toFixed(2)) < (parseFloat(management + contigency).toFixed(2))) || ((parseFloat(data.managementReserve)) < (parseFloat(management))) || ((parseFloat(data.contingencyReserve)) < (parseFloat(contigency)))) {
            this.fnShowErrorPopup("Please check assign Pds consumption as it  is more than present management and contigency reserve");
            approveCheck = false;
        }
        else {
            sap.ui.getCore().getModel("mPageData").setProperty('/managementReserve', parseFloat((data.managementReserve - management).toFixed(2)));
            sap.ui.getCore().getModel("mPageData").setProperty('/contingencyReserve', parseFloat((data.contingencyReserve - contigency).toFixed(2)));
            sap.ui.getCore().getModel("mPageData").setProperty('/availablePDs', parseFloat(data.availablePDs + management + contigency).toFixed(2));
        }

        return approveCheck;
    }



    public async onSoIdLinkPress(oEvent: Event) {
        const soID = oEvent.getSource().getText();
        let soGuid = project_so_info.filter((item) => item.so == soID);
        await this.navTo(({ TS: true, H: true, S: 'p_so', AD: soGuid[0].so_guid }));
    }
    public async addConsumedEffort(monthlyPlanning) {
        let taskIDs = [];
        let approvedSubmitIDs = [];
        let approvedTaskIDs = [];
        let approvedTimesheets;
        let totalConsumedPDs = 0;

        // Get project-based tasks
        const projectBasedTasks = await this.transaction.getExecutedQuery('d_o2c_task_assignment', {
            loadAll: true,
            'actual_project_id': project_info[0].project_id
        });

        taskIDs = projectBasedTasks.map(task => task.task_id);

        // Get approved tasks
        if (taskIDs.length) {
            const approvedTasks = await this.transaction.getExecutedQuery('d_o2c_timesheet_task', {
                loadAll: true,
                'task_id': taskIDs,
                status: "Approved"
            });

            approvedSubmitIDs = approvedTasks.map(task => task.submit_id);

            // If there are approved submit IDs, get approved timesheets
            if (approvedSubmitIDs.length > 0) {
                approvedTimesheets = await this.transaction.getExecutedQuery('d_o2c_timesheet_header', {
                    loadAll: true,
                    'submit_id': approvedSubmitIDs,
                    'over_all_status': "Approved"
                });

                const timesheetApprovedSubmitIDs = approvedTimesheets.map(sheet => sheet.submit_id);
                const headerApprovedTask = approvedTasks.filter(item => timesheetApprovedSubmitIDs.includes(item.submit_id));
                approvedTaskIDs = Array.from(new Set(headerApprovedTask.map(task => task.task_id)));
            }

            // If there are approved task IDs, process monthly planning
            if (approvedTaskIDs.length > 0) {
                const timesheetBookedBasedTasks = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', {
                    loadAll: true,
                    'task_id': approvedTaskIDs
                });

                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                for (let i = 0; i < monthlyPlanning.length; i++) {
                    let consumedEffort = 0;
                    const [monthName, year] = monthlyPlanning[i].month.split(" ");
                    const index = months.indexOf(monthName);
                    const startDate = new Date(year, index, 1);
                    const endDate = new Date(year, index + 1, 0);
                    //Change the date
                    let sDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    let eDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                    //End
                    const timeSheetHeaderBasedDate = approvedTimesheets.filter(item => item.from_date >= sDate && item.to_date <= eDate);
                    if (timeSheetHeaderBasedDate.length > 0) {
                        const timeSheetBasedDate = timesheetBookedBasedTasks.filter(item => item.booking_date >= startDate && item.booking_date <= endDate);
                        for (const task of timeSheetBasedDate) {
                            consumedEffort += parseFloat(task.hours_worked ? task.hours_worked : 0);
                        }
                        monthlyPlanning[i].consumedEfforts = (consumedEffort / 8);
                    }
                    totalConsumedPDs += parseFloat(monthlyPlanning[i].consumedEfforts);
                }
                //Resource Consumed Pds
                for (let i = 0; i < resource_planning.length; i++) {
                    let consumedPds = 0, totalconsumedPds = 0;
                    const startDate = new Date(resource_planning[i].start_date);
                    const endDate = new Date(resource_planning[i].end_date);
                    //Change the date
                    let sDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    let eDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                    //End
                    const timeSheetHeaderBasedDate = approvedTimesheets.filter(item => item.from_date >= sDate && item.to_date <= eDate && item.employee_id == resource_planning[i].employee_id);

                    //Only the particular employee that data of timesheet time booking shold come====>START
                    const employeeSubmitID = timeSheetHeaderBasedDate.map(s => s.submit_id);
                    let employeeTaskIDs = [];
                    for (let i = 0; i < employeeSubmitID.length; i++) {
                        let filterTask = approvedTasks.filter(item => item.submit_id == employeeSubmitID[i]);
                        employeeTaskIDs.push(...filterTask);
                    }
                    const employeeTaskIDArray = Array.from(new Set(employeeTaskIDs.map(t => t.task_id)));
                    //END

                    if (timeSheetHeaderBasedDate.length > 0) {
                        let timeSheetBasedDate = [];
                        for (let i = 0; i < employeeTaskIDArray.length; i++) {
                            let filterBookDate = timesheetBookedBasedTasks.filter(item => item.booking_date >= startDate && item.booking_date <= endDate && item.task_id == employeeTaskIDArray[i]);
                            timeSheetBasedDate.push(...filterBookDate);
                        }
                        for (const task of timeSheetBasedDate) {
                            consumedPds += parseFloat(task.hours_worked ? task.hours_worked : 0);
                        }
                        totalconsumedPds = (consumedPds / 8);
                    }
                    const data = sap.ui.getCore().getModel("mPageData").getProperty("/tableResourcePlanning");
                    for (let j = 0; j < data.length; j++) {
                        if (resource_planning[i].resource_guid == data[j].rowID) {
                            const path = data[j];
                            sap.ui.getCore().getModel("mPageData").setProperty('/tableResourcePlanning/' + j + '/consumedPDs', totalconsumedPds);
                        }
                    }

                }
            }
            sap.ui.getCore().getModel("mPageData").setProperty('/bookedPDs', totalConsumedPDs.toFixed(2));

        }
        let newAvailablePds = project_info[0].available_pds_new - totalConsumedPDs;
        sap.ui.getCore().getModel("mPageData").setProperty('/availablePDs1', newAvailablePds.toFixed(2));
    }
    public async manageProjectStakeholder() {
        let customerContactData = await this.transaction.getExecutedQuery('d_o2c_customers_contact', {
            loadAll: true, 'k_id': project_so_info[0].bill_to_customer
        });
        let customerArray = [];
        for (let i = 0; i < customerContactData.length; i++) {
            customerArray.push({
                contact_name: customerContactData[i].contact_name,
                contact_number: customerContactData[i].contact_number,
                contact_role: customerContactData[i].contact_role

            })
        }
    }
    ////Required
    public async ontaskAssignment() {
        const resourceData = sap.ui.getCore().getModel("mPageData").getProperty('/tableResourcePlanning');
        const approvedResourceData = resourceData.filter((item) => item.approvalStatus == "Approved" && item.isDateChanged == true);
        if (approvedResourceData.length > 0) {
            let saveFlag = await taskassignment.createUpdateTask(this.transaction, (await this.transaction.get$User()).login_id, project_info[0].project_id, project_info[0].so_id, project_so_info[0].project_name, approvedResourceData, 'Project', this);
            //await this.createUpdateTask((await this.transaction.get$User()).login_id,project_info[0].project_id, project_info[0].so_id, project_so_info[0].project_name, approvedResourceData);
            return saveFlag;
        }
    }

    // //Required
    public async deleteTask(task_id) {
        let timesheetTaskData = await this.transaction.getExecutedQuery('d_o2c_timesheet_task', { 'task_id': task_id, loadAll: true });
        if (timesheetTaskData.length) {
            sap.m.MessageBox.error("Can't be deleted. Already submitted.", {
                title: "Error", actions: [sap.m.MessageBox.Action.CANCEL],
            });
            return true;
        }
        else {
            let taskassignmentData = await this.transaction.getExecutedQuery('d_o2c_task_assignment', { 'task_id': task_id, loadAll: true });
            for (let task = 0; task < taskassignmentData.length; task++) {
                await taskassignmentData[task].deleteP();
            }
            let timesheetBooking = await this.transaction.getExecutedQuery('d_o2c_timesheet_time_booking', { 'task_id': task_id, loadAll: true });
            for (let i = timesheetBooking.length - 1; i >= 0; i--) {
                //await timesheetBooking[i].deleteP();
                timesheetBooking[i].s_status = "Archived";
            }
            return false;
        }
    }
    public async onPressMarkedAsClose() {
        project_so_info[0].s_status = "Closed";
        await this.tm.commitP("SO Closed", "SO Closed Failed", true, true);
        sap.ui.getCore().getModel("mPageData").setProperty('/soStatus', project_so_info[0].s_status);
    }

    // updating the attachment at on change event instead of on save.
    public async onCreateAttachment(element, file_uploaded: boolean) {
        let billingTable;
        billingTable = billing_data.filter((item) => item.billing_milestone === element.rowID || item.schedule_no === element.rowID);

        if (file_uploaded && element.attachSignUpDoc != "")
            await billingTable[0].signupdoc.setAttachmentP(
                element.attachSignUpDoc,
                element.attachSignUpDoc.name
            );
        if (file_uploaded && element.attachTimesheetUpload != "")
            await billingTable[0].timesheet_upload.setAttachmentP(
                element.attachTimesheetUpload,
                element.attachTimesheetUpload.name
            );
        billingTable[0].inv_requested_date = new Date(element.actualEndDateVisible);
        billingTable[0].remark = element.remark;
    }

    // updating the project document attachment.
    public async onCreateProjectDocument(element, file_uploaded: boolean) {
        let ProjectDocumentTable;
        ProjectDocumentTable = project_document.filter((item) => item.document_guid == element.rowID);
        if (!(ProjectDocumentTable.length)) {
            //if (ProjectDocumentTable == undefined || (ProjectDocumentTable != undefined && ProjectDocumentTable.length == 0)) {
            // const ProjectDocument = await this.transaction.getQueryP("d_o2c_project_document");
            // ProjectDocument.setLoadAll(true);
            // const newProjectDocument = await ProjectDocument.executeP();
            ProjectDocumentTable[0] = await this.transaction.createEntityP("d_o2c_project_document", { s_object_type: -1 });
            element.rowID = ProjectDocumentTable[0].document_guid;
            project_document.push(ProjectDocumentTable[0]);
        }
        ProjectDocumentTable[0].project_guid = project_info[0].project_guid;
        ProjectDocumentTable[0].project_id = project_info[0].project_id;
        if (file_uploaded && element.attachment != "")
            await ProjectDocumentTable[0].attached.setAttachmentP(
                element.attachment,
                element.attachment.name
            );
        ProjectDocumentTable[0].document_name = element.attachmentName;
        ProjectDocumentTable[0].is_manadatory = element.isMandatory;
        //ProjectDocumentTable[0].document_attachment = element.attachment;
        ProjectDocumentTable[0].shared_on_mail_attch = element.milestone;
        ProjectDocumentTable[0].other_description = element.milestoneOther;
    }

}

//GK 26/5/25 - 12:57 pm