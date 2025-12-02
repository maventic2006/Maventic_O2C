import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import { KloController } from 'kloTouch/jspublic/KloController'
import { salesorder } from 'o2c_v2/util/salesorder';
// import * as pdfConversion from "../externalJS/bundle";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_invoice_screen")
export default class p_o2c_invoice_screen extends KloController {
    public role
    public async onPageEnter() {
        this.role = (await this.transaction.get$Role()).role_id;
        let login_id = (await this.transaction.get$User()).login_id;
        const today = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(today.getDate() + 10);
        this.tm.getTN("boolean_expression").setData({});
        this.tm.getTN("credit_note_other").setData({});
        this.tm.getTN("role").setData(this.role);

        if (!window['XLSX']) {
            // await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
            let path = "kloExternal/xlsx.bundle"
            let data = await import(path)
        }

        const mainMasterTable = await this.transaction.getExecutedQuery("d_o2c_invoice_master", {
            loadAll: true,
        });

        const secondaryRole = await this.transaction.getExecutedQuery("d_second_role_assyn", {
            loadAll: true,
            employee_id: login_id,
            page_name: "Invoice"
        });

        await this.tm.getTN("query_invoice_search").setProperty('login_role', secondaryRole[0].assyned_role);
        await this.tm.getTN("query_invoice_search").executeP();
    }

    public async onCreate() {
        let role = (await this.transaction.get$Role()).role_id;
        let login_id = (await this.transaction.get$User()).login_id;

        const today = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(today.getDate() + 10);

        this.tm.getTN("boolean_expression").setData({});
        this.tm.getTN("role").setData(role);

        if (!window['XLSX']) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        try {
            // Get all previously created invoice milestone numbers
            const invoiceList = await this.transaction.getExecutedQuery('d_invoice_request_hdr_table', {
                loadAll: true,
                partialSelect: ['milestone_number'],
            });

            await this.tm.getTN("query_invoice_search").setProperty('login_role', role);
            await this.tm.getTN("query_invoice_search").executeP();

            const existingMilestones = new Set(invoiceList.map(item => item.milestone_number));

            // Fetch all required data up front
            // 1. Fetch all project data
            const allProjectData = await this.transaction.getExecutedQuery('d_o2c_project_header', {
                loadAll: true,
                partialSelect: ['project_id', 'so_id', 'profit_center'],
            });
            const projectDataMap = {};
            allProjectData.forEach(project => {
                if (!projectDataMap[project.so_id]) {
                    projectDataMap[project.so_id] = {};
                }
                projectDataMap[project.so_id][project.profit_center] = project;
            });

            // 2. Fetch all customer billing addresses
            const allCustomerAddresses = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
                loadAll: true,
            });
            const customerAddressMap = {};
            allCustomerAddresses.forEach(address => {
                customerAddressMap[address.address_map_id] = address;
            });

            // 3. Fetch all business area details
            const allBusinessAreas = await this.transaction.getExecutedQuery('d_o2c_business_area', {
                loadAll: true,
                partialSelect: ['company_code', 'business_area', 'tax_rule']
            });
            const businessAreaMap = {};
            allBusinessAreas.forEach(area => {
                const key = `${area.company_code}_${area.business_area}`;
                businessAreaMap[key] = area;
            });

            // 4. Fetch all GST tax master data
            const allGstTaxMaster = await this.transaction.getExecutedQuery('d_o2c_ind_gst_tax_master', {
                loadAll: true,
            });
            const gstTaxMasterMap = {};
            allGstTaxMaster.forEach(tax => {
                gstTaxMasterMap[tax.billing_type] = tax;
            });

            // 5. Fetch all company details
            const allCompanyDetails = await this.transaction.getExecutedQuery('d_o2c_invoice_irn_table', {
                loadAll: true,
            });
            const companyDetailsMap = {};
            allCompanyDetails.forEach(company => {
                const key = `${company.company_code}_${company.business_area}`;
                companyDetailsMap[key] = company;
            });

            // 6. Fetch LUT details once
            const lutDetails = await this.transaction.getExecutedQuery('d_o2c_ind_gst_general_config', {
                loadAll: true,
            });
            const lutNumber = lutDetails[0]?.lut_code || null;

            // Get invoice table reference for creating new records
            const invoiceTable = await this.transaction.getQueryP("d_invoice_request_hdr_table");
            invoiceTable.setLoadAll(true);
            const invoiceAllData = await invoiceTable.executeP();

            const processAndCreateInvoice = async (item, type) => {
                const milestoneNumber = item.billing_milestone || item.schedule_no;
                const actualDate = new Date(item.actual_date || item.milestone_date);

                // Skip if milestone exists or if the date is beyond 10 days
                if (existingMilestones.has(milestoneNumber) || actualDate > tenDaysLater) return;

                const itemPath = `r_${type}_item`;
                const itemData = item[itemPath]?.[0];
                if (!itemData) return;

                const itemHeader = itemData.r_item_header?.[0];
                const itemAttachment = itemData.r_item_attachment;

                // Proceed only if header status is Approved
                if (!itemHeader || itemHeader.s_status !== "Approved") {
                    return;
                }
                if (itemAttachment?.[0]?.approval_status && itemAttachment[0].approval_status !== "Approved") {
                    return;
                }

                const profitCenterList = itemHeader.r_profit_center;
                const primaryProfitCenter = profitCenterList?.find(pc => pc.primary_profit_center === true);
                const selectedProfitCenter = primaryProfitCenter || profitCenterList?.[0];
                const itemCategory = itemData.item_category;

                if (!selectedProfitCenter) {
                    console.warn(`No profit center found for milestone: ${milestoneNumber}`);
                    return;
                }

                // Use the pre-fetched data from maps
                const projectData = projectDataMap[itemHeader.so]?.[selectedProfitCenter.profit_center];
                const customerAddressData = customerAddressMap[itemHeader.bill_to_address];

                const businessAreaKey = `${itemHeader.company}_${itemHeader.business_area}`;
                const customerBusinessArea = businessAreaMap[businessAreaKey];
                const companyDetails = companyDetailsMap[businessAreaKey];

                if (!projectData || !customerAddressData || !customerBusinessArea || !companyDetails) {
                    console.warn(`Missing required data for milestone: ${milestoneNumber}`);
                    return;
                }

                let taxPercentage = 0;
                let gstTaxMaster = null;
                let sacCode = null;

                if (customerBusinessArea.tax_rule === 'gst') {
                    gstTaxMaster = gstTaxMasterMap[itemCategory];
                    taxPercentage = gstTaxMaster?.tax_percentage || 0;
                    sacCode = gstTaxMaster?.hsc_sac_code;
                }

                const buyerGstNumber = customerAddressData.gstin_vat || "";
                const buyerStateCode = buyerGstNumber.substring(0, 2);
                const companyStateCode = companyDetails.state_code;

                const amount = parseFloat(item.amount || item.expected_amount || "0");

                // Check if customer is international
                const isInternationalCustomer = customerAddressData.country_code !== 'IND';

                // Calculate GST based on customer type and state codes
                let cgst = 0, sgst = 0, igst = 0;

                if (!isInternationalCustomer) {
                    // Only calculate GST for domestic customers
                    if (buyerStateCode === companyStateCode) {
                        cgst = parseFloat(((amount * taxPercentage) / 200).toFixed(2)); // 50% of taxPercentage
                        sgst = parseFloat(((amount * taxPercentage) / 200).toFixed(2));
                    } else {
                        igst = parseFloat(((amount * taxPercentage) / 100).toFixed(2)); // 100% of taxPercentage
                    }
                }
                // For international customers, all GST values remain 0

                const totalTax = parseFloat((cgst + sgst + igst).toFixed(2));
                const totalInvoice = parseFloat((amount + totalTax).toFixed(2));

                let finalLutNumber = null;
                if (isInternationalCustomer) {
                    finalLutNumber = lutNumber;
                }

                // Create the invoice record
                await invoiceAllData.newEntityP(0, {
                    s_object_type: -1,
                    company_code: itemHeader.company,
                    business_area: itemHeader.business_area,
                    project_manager: selectedProfitCenter.project_manager,
                    so: itemHeader.so,
                    so_guid: itemHeader.so_guid,
                    po_number: itemAttachment?.[0]?.po_no,
                    po_line_item_number: itemData.soitem,
                    milestone_number: milestoneNumber,
                    status: "New",
                    remark: item.remark,
                    project_id: projectData.project_id,
                    cgst: cgst.toFixed(2),
                    sgst: sgst.toFixed(2),
                    igst: igst.toFixed(2),
                    unit: itemData.unit,
                    invoice_origin_country: customerAddressData.country_code,
                    total_tax: totalTax.toFixed(2),
                    total_invoice: totalInvoice.toFixed(2),
                    gstin_lut: finalLutNumber,
                    sac_code: sacCode
                });

                existingMilestones.add(milestoneNumber); // Avoid future duplication
            };

            // Process billing milestones
            const milestoneList = await this.transaction.getExecutedQuery('d_o2c_so_milestone', {
                loadAll: true,
                status: 'Pending',
                partialSelect: ['billing_milestone_name', 'invoice_no', 'invoice_date', 'actual_date', 'amount', 'status', 'percentage'],
                expandAll: "r_milestone_item,r_milestone_item/r_item_header,r_milestone_item/r_item_attachment,r_milestone_item/r_item_header/r_profit_center"
            });
            for (const milestone of milestoneList) {
                await processAndCreateInvoice(milestone, 'milestone');
            }

            // Process schedule-based billing
            const scheduleList = await this.transaction.getExecutedQuery('d_o2c_so_schedule', {
                loadAll: true,
                status: 'Pending',
                partialSelect: ['description', 'invoice_no', 'invoice_date', 'actual_date', 'expected_amount', 'status'],
                expandAll: "r_schedule_item,r_schedule_item/r_item_header,r_schedule_item/r_item_attachment,r_schedule_item/r_item_header/r_profit_center"
            });
            for (const schedule of scheduleList) {
                await processAndCreateInvoice(schedule, 'schedule');
            }

            // Process volume-based billing
            const volumeList = await this.transaction.getExecutedQuery('d_o2c_volume_based', {
                loadAll: true,
                invoice_status: 'Pending',
                partialSelect: ['milestone_description', 'invoice_no', 'invoice_date', 'milestone_date', 'amount', 'invoice_status'],
                expandAll: "r_volume_item,r_volume_item/r_item_header,r_volume_item/r_item_attachment,r_volume_item/r_item_header/r_profit_center"
            });
            for (const volume of volumeList) {
                await processAndCreateInvoice(volume, 'volume');
            }

            await this.tm.commitP(); // Final commit after all records
        } catch (error) {
            console.error("Error in onCreate:", error);
        }
    }

    public async onGenerateInvoice() {
        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedListData = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedListData || selectedListData.length === 0) {
                sap.m.MessageBox.warning("No invoice selected for generating Invoice.");
                return;
            }

            // Collect unique error messages
            const errorMessages = new Set<string>();

            for (const index of selectedListData) {
                const invoice = listData[index];
                if (!invoice) continue;

                switch (invoice.status) {
                    case "Cancelled":
                        errorMessages.add("Some selected invoices are already cancelled.");
                        break;
                    case "Approved":
                        errorMessages.add("Some selected invoices are already approved.");
                        break;
                    case "Pending":
                        errorMessages.add("Some selected invoices are still pending.");
                        break;
                    case "Rejected":
                        errorMessages.add("Some selected invoices are already rejected.");
                        break;
                    case "E Invoicing Successful":
                        errorMessages.add("Some selected invoices are already e-invoiced.");
                        break;
                    case "Zoho Invoice Created":
                        errorMessages.add("Some selected invoices are already created in Zoho.");
                        break;
                    default:
                        // Allowed statuses – do nothing
                        break;
                }
            }

            if (errorMessages.size > 0) {
                sap.m.MessageBox.error(
                    Array.from(errorMessages).join("\n"),  // multiple lines
                    {
                        title: "Error",
                        actions: [sap.m.MessageBox.Action.OK]
                    }
                );
                return;
            }

            // Process only valid invoices
            for (const index of selectedListData) {
                const invoice = listData[index];
                if (!invoice) continue;

                invoice.manager_submission_date = new Date();
                await this.flowMaster(1, invoice);
            }

            sap.m.MessageBox.success(
                "The selected invoice(s) have been marked as ready and forwarded for invoicing.",
                {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: async (action) => {
                        if (action === sap.m.MessageBox.Action.OK) {
                            const gridControl = this.getActiveControlById(null, "s_invoice_list");
                            if (gridControl) {
                                gridControl.clearSelection();
                            }
                            await this.resetList();
                        }
                    }
                }
            );

        } catch (error) {
            console.error("Error in onGenerateInvoice:", error);
            sap.m.MessageToast.show("Invoice generation failed due to an error");
        }
    }


    public async flowMaster(level, listData) {
        try {
            const selectedItem = listData;

            const invoiceMasterTable = await this.transaction.getExecutedQuery(
                "d_o2c_invoice_master",
                {
                    company_code: selectedItem.company_code,
                    invoice_level: level,
                    loadAll: true,
                }
            );

            const masterTable = invoiceMasterTable.filter(
                (item) => parseInt(item.invoice_level) === parseInt(level)
            );

            if (masterTable.length === 0) {
                throw new Error("No matching invoice role found for the given level");
            }

            const currentUserId = (await this.transaction.get$User()).login_id;
            const currentUserName = await this.getEmployeeName(currentUserId);

            // Fetch the current approval_cycle from the existing flow (if any)
            const existingFlow = await this.transaction.getExecutedQuery("d_o2c_invoice_approval_flow", {
                milestone_number: selectedItem.milestone_number,
                so: selectedItem.so,
                loadAll: true,
            });

            let approvalCycle = "1";
            if (existingFlow.length > 0) {
                const currentCycle = existingFlow[0].approval_cycle || "0";
                approvalCycle = (parseInt(currentCycle) + 1).toString();
            }

            if (existingFlow.length > 0) {

                await this.transaction.createEntityP("d_o2c_invoice_approval_flow", {
                    s_object_type: -1,
                    milestone_number: selectedItem.milestone_number,
                    so: selectedItem.so,
                    insert_datetime: new Date(),
                    action_datetime: new Date(),
                    action_by: currentUserId,
                    action_by_name: currentUserName,
                    action_by_role: this.role,
                    approval_status: "Pending",
                    pending_with_role: masterTable[0].invoice_role,
                    approval_cycle: approvalCycle,
                    company_code: selectedItem.company_code,
                });
                selectedItem.approval_cycle = approvalCycle
            }
            else {
                await this.transaction.createEntityP("d_o2c_invoice_approval_flow", {
                    s_object_type: -1,
                    milestone_number: selectedItem.milestone_number,
                    so: selectedItem.so,
                    insert_datetime: new Date(),
                    action_datetime: new Date(),
                    action_by: currentUserId,
                    action_by_name: currentUserName,
                    action_by_role: this.role,
                    approval_status: "Pending",
                    pending_with_role: masterTable[0].invoice_role,
                    approval_cycle: '1',
                    company_code: selectedItem.company_code,
                },);
                selectedItem.approval_cycle = '1'
            }


            selectedItem.currently_pending_with = masterTable[0].invoice_role;
            selectedItem.status = "Pending";
            let selectedInvoice = selectedItem

            if (
                (selectedInvoice.r_invoice_milestone && selectedInvoice.r_invoice_milestone.length === 1) ||
                (selectedInvoice.r_invoice_schedule && selectedInvoice.r_invoice_schedule.length === 1) ||
                (selectedInvoice.r_invoice_volume && selectedInvoice.r_invoice_volume.length === 1)
            ) {
                if (selectedInvoice.r_invoice_milestone && selectedInvoice.r_invoice_milestone.length === 1) {
                    selectedInvoice.r_invoice_milestone[0].status = "InvReq";
                }
                if (selectedInvoice.r_invoice_schedule && selectedInvoice.r_invoice_schedule.length === 1) {
                    selectedInvoice.r_invoice_schedule[0].status = "InvReq";
                }
                if (selectedInvoice.r_invoice_volume && selectedInvoice.r_invoice_volume.length === 1) {
                    selectedInvoice.r_invoice_volume[0].invoice_status = "InvReq";
                }
            }


            await this.tm.commitP("Send For Approval", "Send Failed", false, true);
        } catch (error) {
            console.error("Flow Master failed:", error);
            sap.m.MessageToast.show("Flow Master failed due to an error");
        }
    }

    public async onSaving() {
        const hdrData = await this.tm.getTN("invoice_screen_detail").getData();
        const milestoneNumber = hdrData.milestone_number;

        const milestoneData = await this.transaction.getExecutedQuery(
            "d_o2c_so_milestone",
            { loadAll: true, billing_milestone: milestoneNumber }
        );

        const scheduleData = await this.transaction.getExecutedQuery(
            "d_o2c_so_schedule",
            { loadAll: true, schedule_no: milestoneNumber }
        );

        const volumeData = await this.transaction.getExecutedQuery(
            "d_o2c_volume_based",
            { loadAll: true, billing_milestone: milestoneNumber }
        );

        // get values from header TN
        const milestoneName = hdrData.milestone_name;
        const invoiceDescription = hdrData.trans_invoice_description;

        // update which dataset has line item
        if (milestoneData.length > 0) {
            // milestone table
            milestoneData[0].invoice_description = invoiceDescription;
            milestoneData[0].billing_milestone_name = milestoneName;
        } else if (scheduleData.length > 0) {
            // schedule table
            scheduleData[0].invoice_description = invoiceDescription;
            scheduleData[0].description = milestoneName;
        } else if (volumeData.length > 0) {
            // volume table
            volumeData[0].invoice_description = invoiceDescription;
            volumeData[0].milestone_description = milestoneName;
        }

        await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
    }


    public async getEmployeeName(mm_id) {
        try {
            const empData = await this.transaction.getExecutedQuery(
                "d_o2c_employee",
                { loadAll: true, employee_id: mm_id }
            );
            if (empData && empData.length > 0) {
                return empData[0].full_name;
            } else {
                throw new Error("Employee not found");
            }
        } catch (error) {
            throw new Error("Error retrieving employee name: " + error.message);
        }
    }

    public async onProcessInvoices(oEvent) {
        await this.onApprove(oEvent);
        if (this.role === "FINANCE") {
            await this.zohoInvoiceGeneration();
            await this.onDoingEInvoicing();
            // await this.onDoingESigning(oEvent);
            // await this.onSendingInvoiceMail();
            await this.onGeneratingDataInInvoiceList();
        }
        await this.resetList();

    }

    public async onApprove(oEvent) {
        const role = (await this.transaction.get$Role()).role_id;
        const loginId = (await this.transaction.get$User()).login_id;
        const currentUserName = await this.getEmployeeName(loginId);

        const listData = await this.tm.getTN("invoice_screen_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

        const secondaryRole = await this.transaction.getExecutedQuery("d_second_role_assyn", {
            loadAll: true,
            employee_id: loginId,
            page_name: "Invoice"
        });

        if (selectedIndices.length === 0) return;

        const validStatuses = ["Pending", "Error in Invoice Approval"];
        const validIndices = selectedIndices.filter(index =>
            validStatuses.includes(listData[index].status)
        );

        if (validIndices.length === 0) return;

        const employeeOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', {
            loadAll: true,
            employee_id: loginId,
            partialSelect: ['employee_id', 'company_code'],
        });

        const objectTypeConfig = await this.transaction.getExecutedQuery('d_o2c_id_confg', {
            loadAll: true,
            company_code: employeeOrg[0].company_code,
            type: 'inv',
            partialSelect: ['company_code', 'object_name', 'type']
        });

        const groupedByClubbed = {};
        for (const index of validIndices) {
            const clubbedId = listData[index].clubbed_id || `NOCLUB_${index}`;
            if (!groupedByClubbed[clubbedId]) groupedByClubbed[clubbedId] = [];
            groupedByClubbed[clubbedId].push(index);
        }

        const currentYearShort = new Date().getFullYear().toString().slice(-2);
        let needFinalApproval = false;
        let allInvoicesApproved = true;
        const promises = [];

        for (const clubbedId in groupedByClubbed) {
            const indicesInGroup = groupedByClubbed[clubbedId];
            let generatedInvoiceNumber = null;

            for (const index of indicesInGroup) {
                const selectedItem = listData[index];

                // --------- Map transient fields to regular properties ---------
                selectedItem.reg_customer_gstin = selectedItem.trans_customer_gstin;
                selectedItem.reg_credit_note_amt = selectedItem.transient_credit_note_amt
                selectedItem.reg_bill_to_location = selectedItem.bill_to_location;
                selectedItem.reg_quantity = selectedItem.quantity;
                selectedItem.reg_rate = selectedItem.rate;
                selectedItem.reg_currency = selectedItem.currency;
                selectedItem.reg_milestone_amount = selectedItem.milestone_amount;
                selectedItem.reg_milestone_date = selectedItem.milestone_date;
                selectedItem.reg_milestone_name = selectedItem.milestone_name;
                selectedItem.reg_billing_type = selectedItem.billing_type;
                selectedItem.reg_project_name = selectedItem.project_name;
                selectedItem.reg_client_name = selectedItem.client_name;
                selectedItem.reg_primary_profit_center = selectedItem.primary_profit_center;
                selectedItem.invoice_description = selectedItem.trans_invoice_description;
                selectedItem.billing_mode = selectedItem.trans_billing_mode;
                // ----------------------------------------------------------------

                const invoiceApprovalFlow = await this.transaction.getExecutedQuery("d_o2c_invoice_approval_flow", {
                    milestone_number: selectedItem.milestone_number,
                    so: selectedItem.so,
                    pending_with_role: secondaryRole[0].assyned_role,
                    loadAll: true
                });

                if (invoiceApprovalFlow.length === 0) {
                    listData[index].status = "Error in Invoice Approval";
                    continue;
                }

                const mainMasterTable = await this.transaction.getExecutedQuery("d_o2c_invoice_master", {
                    company_code: selectedItem.company_code,
                    loadAll: true,
                });

                const masterTable = mainMasterTable.filter(item => item.invoice_role === secondaryRole[0].assyned_role);
                if (masterTable.length === 0) {
                    listData[index].status = "Error in Invoice Approval";
                    continue;
                }

                const level = parseInt(masterTable[0].invoice_level) + 1;
                const nextLevel = mainMasterTable.filter(item => parseFloat(item.invoice_level) === level);

                invoiceApprovalFlow[0].approval_status = "Approved";
                invoiceApprovalFlow[0].action_datetime = new Date();
                invoiceApprovalFlow[0].action_by = loginId;
                invoiceApprovalFlow[0].action_by_name = currentUserName;
                invoiceApprovalFlow[0].action_by_role = secondaryRole[0].assyned_role;
                invoiceApprovalFlow[0].pending_with_role = null;

                const existingFlow = await this.transaction.getExecutedQuery("d_o2c_invoice_approval_flow", {
                    milestone_number: selectedItem.milestone_number,
                    so: selectedItem.so,
                    approval_status: 'Pending',
                    loadAll: true,
                });

                let approvalCycle = "1";
                if (existingFlow.length) {
                    approvalCycle = (parseInt(existingFlow[0].approval_cycle || "0")).toString();
                }

                if (nextLevel.length > 0) {
                    const promise = this.transaction.createEntityP("d_o2c_invoice_approval_flow", {
                        s_object_type: -1,
                        milestone_number: selectedItem.milestone_number,
                        so: selectedItem.so,
                        insert_datetime: new Date(),
                        action_datetime: new Date(),
                        action_by: loginId,
                        action_by_name: currentUserName,
                        action_by_role: secondaryRole[0].assyned_role,
                        approval_status: "Pending",
                        pending_with_role: nextLevel[0].invoice_role,
                        approval_cycle: approvalCycle,
                        company_code: selectedItem.company_code,
                    }).then(() => {
                        listData[index].currently_pending_with = nextLevel[0].invoice_role;
                    });

                    allInvoicesApproved = false;
                    promises.push(promise);
                } else {
                    if (!generatedInvoiceNumber) {
                        const entity_invoice_number = await this.transaction.createEntityP("d_idseries", {
                            s_object_type: objectTypeConfig[0].object_name
                        });

                        const prefix = entity_invoice_number.a_id.startsWith("MAV") ? "MAV" : "PRO";
                        const idWithoutPrefix = entity_invoice_number.a_id.slice(3);
                        generatedInvoiceNumber = `${prefix}/${currentYearShort}/${idWithoutPrefix}`;
                    }

                    needFinalApproval = true;
                    // listData[index].currently_pending_with = null;
                    listData[index].status = "Approved";
                    listData[index].invoice_date = new Date();
                    selectedItem.inv_request_id = generatedInvoiceNumber;
                }
            }
        }

        await Promise.all(promises);
        await this.tm.commitP();
    }


    private async resetList() {
        await this.tm.getTN("invoice_screen_list").resetP(true);
    }

    public async onReject() {
        try {
            const role = (await this.transaction.get$Role()).role_id;
            const loginUser = await this.transaction.get$User();
            const loginId = loginUser.login_id;
            const currentUserName = await this.getEmployeeName(loginId);

            const invoiceList = this.tm.getTN("invoice_screen_list");
            const listData = await invoiceList.getData();
            const selectedIndices = await invoiceList.getSelectedIndices();

            if (selectedIndices.length === 0) {
                sap.m.MessageBox.warning("No invoice selected for rejection.");
                return;
            }

            for (const index of selectedIndices) {
                const status = listData[index].status;
                let errorMessage = "";

                if (status === "Cancelled") {
                    errorMessage = "One or more selected invoices are already cancelled and cannot be approved.";
                } else if (status === "Approved") {
                    errorMessage = "One or more selected invoices are already approved.";
                } else if (status === "Return Back") {
                    errorMessage = "One or more selected invoices are already Returned Back.";
                } else if (status === "Rejected") {
                    errorMessage = "One or more selected invoices are already rejected.";
                } else if (status === "E Invoicing Successful") {
                    errorMessage = "One or more selected invoices are already E Invoicing Successful.";
                } else if (status === "Zoho Invoice Created") {
                    errorMessage = "One or more selected invoices are already Zoho Invoice Created.";
                }

                if (errorMessage) {
                    sap.m.MessageBox.error(errorMessage, {
                        title: "Error",
                        actions: [sap.m.MessageBox.Action.OK],
                    });
                    return;
                }
            }




            for (const index of selectedIndices) {
                const invoice = listData[index];
                const invoiceApprovalFlow = await this.transaction.getExecutedQuery("d_o2c_invoice_approval_flow", {
                    milestone_number: invoice.milestone_number,
                    so: invoice.so,
                    pending_with_role: role,
                    loadAll: true
                });

                if (invoiceApprovalFlow.length > 0) {
                    Object.assign(invoiceApprovalFlow[0], {
                        approval_status: "Rejected",
                        action_datetime: new Date(),
                        action_by: loginId,
                        action_by_name: currentUserName,
                        action_by_role: this.role,
                        pending_with_role: null
                    });
                }

                Object.assign(invoice, {
                    currently_pending_with: null,
                    status: "Rejected"
                });
            }

            await this.tm.commitP("Rejected", "Failed", true, true);
            await invoiceList.resetP(true);

            sap.m.MessageBox.success("The Invoice(s) have been successfully rejected.", {
                title: "Success",
                actions: [sap.m.MessageBox.Action.OK]
            });
        } catch (error) {
            console.error("Error in onReject:", error);
            sap.m.MessageBox.error("An error occurred while rejecting the invoices. Please try again.");
        }
    }

    public async onReturnBack() {
        try {
            const roleData = await this.transaction.get$Role();
            const role = roleData.role_id;

            // patch here
            const effectiveQueryRole = role === "FINANCE" ? "finance_manager" : role;

            const loginUser = await this.transaction.get$User();
            const loginId = loginUser.login_id;
            const currentUserName = await this.getEmployeeName(loginId);

            const invoiceList = this.tm.getTN("invoice_screen_list");
            const listData = await invoiceList.getData();
            const selectedIndices = await invoiceList.getSelectedIndices();

            if (selectedIndices.length === 0) {
                sap.m.MessageBox.warning("No invoice selected for return.");
                return;
            }

            // ... same validation loop as yours

            for (const index of selectedIndices) {
                const invoice = listData[index];
                const invoiceApprovalFlow = await this.transaction.getExecutedQuery("d_o2c_invoice_approval_flow", {
                    milestone_number: invoice.milestone_number,
                    so: invoice.so,
                    pending_with_role: effectiveQueryRole,   // changed here
                    loadAll: true
                });

                if (invoiceApprovalFlow.length > 0) {
                    Object.assign(invoiceApprovalFlow[0], {
                        approval_status: "Return Back",
                        action_datetime: new Date(),
                        action_by: loginId,
                        action_by_name: currentUserName,
                        action_by_role: this.role,
                        pending_with_role: invoiceApprovalFlow[0].s_created_by
                    });
                }

                Object.assign(invoice, {
                    currently_pending_with: invoiceApprovalFlow[0].s_created_by,
                    status: "Return Back"
                });
            }

            await this.tm.commitP("Return Back", "Failed", true, true);
            await invoiceList.resetP(true);

            sap.m.MessageBox.success("The Invoice(s) have been successfully returned.", {
                title: "Success",
                actions: [sap.m.MessageBox.Action.OK]
            });
        } catch (error) {
            console.error("Error in onReturnBack:", error);
            sap.m.MessageBox.error("An error occurred while returning the invoices. Please try again.");
        }
    }

    public async onDoingEInvoicing() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, processing e-invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                sap.m.MessageToast.show("Please select at least one invoice");
                return;
            }

            const selectedInvoices = selectedIndices
                .map(idx => listData[idx])
                .filter(invoice =>
                    invoice.status === "Zoho Invoice Created" ||
                    invoice.status === "Error in E-Invoicing"
                );

            if (selectedInvoices.length === 0) {
                busyDialog.close();
                sap.m.MessageToast.show("No eligible invoices to process for E-Invoicing");
                return;
            }

            const groupedInvoices = selectedInvoices.reduce((acc, invoice) => {
                const key = invoice.inv_request_id;
                if (!acc[key]) acc[key] = [];
                acc[key].push(invoice);
                return acc;
            }, {});

            const invRequestIds = Object.keys(groupedInvoices).sort();

            const [
                businessAreaDetails,
                sellerCompanyDetails,
                gstTaxMaster,
                gstUomMapping
            ] = await Promise.all([
                this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, partialSelect: ['business_area', 'tax_rule'] }),
                this.transaction.getExecutedQuery('d_o2c_invoice_irn_table', { loadAll: true }),
                this.transaction.getExecutedQuery('d_o2c_ind_gst_tax_master', { loadAll: true }),
                this.transaction.getExecutedQuery('d_ind_gst_uom_mapping', { loadAll: true })
            ]);

            const businessAreaMap = businessAreaDetails.reduce((m, it) => { m[it.business_area] = it; return m; }, {});
            const sellerCompanyMap = sellerCompanyDetails.reduce((m, it) => { m[it.business_area] = it; return m; }, {});
            const gstTaxMasterMap = gstTaxMaster.reduce((m, it) => { m[it.billing_type] = it; return m; }, {});
            const gstUomMap = gstUomMapping.reduce((m, it) => { m[it.system_unit] = it; return m; }, {});

            for (const invRequestId of invRequestIds) {
                try {
                    busyDialog.setText(`Processing E-Invoice ${invRequestId} (${invRequestIds.indexOf(invRequestId) + 1}/${invRequestIds.length})...`);

                    const invoicesInGroup = groupedInvoices[invRequestId];
                    const firstInvoice = invoicesInGroup[0];
                    const businessArea = firstInvoice.business_area;

                    const sellerDetails = sellerCompanyMap[businessArea];
                    if (!sellerDetails) {
                        throw new Error(`Seller details not found for business area ${businessArea}`);
                    }

                    const {
                        user_id: seller_user_name,
                        gstin_password: seller_password,
                        gst_number: seller_gst_number,
                        location: seller_location,
                        e_invoice_client_id: seller_client_id,
                        e_invoice_client_secret: seller_client_secret,
                        company_name: seller_company_name,
                        pincode: seller_pincode,
                        state_code: seller_state_code,
                        comp_addr: seller_company_address
                    } = sellerDetails;

                    let customerAddress = "";
                    let customerLocation = "";
                    let customerPincode = 0;
                    let billToAddressId = "";

                    const invoiceRelations = [
                        { key: "r_invoice_milestone", itemKey: "r_milestone_item" },
                        { key: "r_invoice_schedule", itemKey: "r_schedule_item" },
                        { key: "r_invoice_volume", itemKey: "r_volume_item" }
                    ];

                    for (const relation of invoiceRelations) {
                        const r = firstInvoice[relation.key]?.[0]?.[relation.itemKey]?.[0]?.r_item_header?.[0];
                        if (r) {
                            const addr = r.r_so_header_address?.[0];
                            if (addr) {
                                customerAddress = `${addr.address_1 || ""} ${addr.address_2 || ""}`.trim();
                                customerLocation = addr.city || "";
                                customerPincode = parseInt(addr.pincode) || 0;
                                billToAddressId = r.bill_to_address || "";
                                break;
                            }
                        }
                    }

                    const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
                        loadAll: true,
                        address_map_id: billToAddressId
                    });

                    if (!customerAddressData || customerAddressData.length === 0) {
                        throw new Error("Customer address data not found");
                    }

                    const customerGstNumber = customerAddressData[0]?.gstin_vat || "";
                    const customerStateCode = (customerGstNumber || "").substring(0, 2);
                    const customerName = firstInvoice.client_name_vh?.additional_desc || "Unknown Customer";
                    const taxpayer_type = customerAddressData[0]?.taxpayer_type || "";

                    const itemList = [];
                    let totalAssAmount = 0.0;
                    let totalIgstAmount = 0.0;
                    let totalCgstAmount = 0.0;
                    let totalSgstAmount = 0.0;
                    let totalValueWithTax = 0.0;
                    let slNo = 1;

                    for (const invoice of invoicesInGroup) {
                        const taxMasterInfo = gstTaxMasterMap[invoice.reg_billing_type] || {};
                        const uomInfo = gstUomMap[invoice.unit] || { uom_unit: invoice.unit || "" };

                        const invoiceList = (invoice.r_invoice_list?.fetch)
                            ? await invoice.r_invoice_list.fetch()
                            : [];

                        if (invoiceList && invoiceList.length > 0) {
                            for (const row of invoiceList) {
                                const qty = parseFloat(row.quantity || 1);
                                const unitPrice = parseFloat(row.rate || 0);
                                const totAmt = parseFloat((unitPrice * qty).toFixed(2));
                                const assAmt = totAmt;

                                const invoiceIgst = parseFloat(row.igst) || 0.0;
                                const invoiceCgst = parseFloat(row.cgst) || 0.0;
                                const invoiceSgst = parseFloat(row.sgst) || 0.0;
                                const invoiceTotalWithTax = totAmt + invoiceIgst + invoiceCgst + invoiceSgst;

                                itemList.push({
                                    "SlNo": slNo.toString(),
                                    "IsServc": taxMasterInfo.is_service,
                                    "HsnCd": row.sac_code,
                                    "Qty": qty,
                                    "Unit": uomInfo.uom_unit,
                                    "UnitPrice": unitPrice,
                                    "TotAmt": totAmt,
                                    "Discount": 0,
                                    "AssAmt": assAmt,
                                    "GstRt": taxMasterInfo.tax_percentage || 0,
                                    "IGSTAmt": invoiceIgst,
                                    "cgstAmt": invoiceCgst,
                                    "sgstAmt": invoiceSgst,
                                    "TotItemVal": invoiceTotalWithTax
                                });

                                totalAssAmount += assAmt;
                                totalIgstAmount += invoiceIgst;
                                totalCgstAmount += invoiceCgst;
                                totalSgstAmount += invoiceSgst;
                                totalValueWithTax += invoiceTotalWithTax;

                                slNo++;
                            }
                        }

                        // -----------------------------------------
                        // ✅ FALLBACK CASE — take taxes from INVOICE HEADER
                        // -----------------------------------------
                        else {
                            const qty = 1;
                            const unitPrice = parseFloat(invoice.reg_milestone_amount || 0);
                            const totAmt = parseFloat((unitPrice * qty).toFixed(2));
                            const assAmt = totAmt;

                            const taxInfo = taxMasterInfo;

                            const headerIgst = parseFloat(invoice.igst || 0);
                            const headerCgst = parseFloat(invoice.cgst || 0);
                            const headerSgst = parseFloat(invoice.sgst || 0);

                            const itemTotalWithTax = totAmt + headerIgst + headerCgst + headerSgst;

                            itemList.push({
                                "SlNo": slNo.toString(),
                                "IsServc": taxInfo.is_service,
                                "HsnCd": taxInfo.hsc_sac_code,
                                "Qty": qty,
                                "Unit": uomInfo.uom_unit,
                                "UnitPrice": unitPrice,
                                "TotAmt": totAmt,
                                "Discount": 0,
                                "AssAmt": assAmt,
                                "GstRt": taxInfo.tax_percentage || 0,
                                "IGSTAmt": headerIgst,
                                "cgstAmt": headerCgst,
                                "sgstAmt": headerSgst,
                                "TotItemVal": itemTotalWithTax
                            });

                            totalAssAmount += assAmt;
                            totalIgstAmount += headerIgst;
                            totalCgstAmount += headerCgst;
                            totalSgstAmount += headerSgst;
                            totalValueWithTax += itemTotalWithTax;

                            slNo++;
                        }
                    }

                    const now = new Date();
                    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

                    const requestBody = {
                        "Version": "1.1",
                        "TranDtls": {
                            "TaxSch": (businessAreaMap[firstInvoice.business_area] &&
                                businessAreaMap[firstInvoice.business_area].tax_rule === 'gst') ? "GST" : null,
                            "SupTyp": taxpayer_type === 'SEZ Unit/Developer' ? "SEZWOP" :
                                (firstInvoice.invoice_origin_country === 'IND' ? "B2B" : "EXPWOP")
                        },
                        "DocDtls": {
                            "Typ": "INV",
                            "No": firstInvoice.inv_request_id,
                            "dt": formattedDate
                        },
                        "SellerDtls": {
                            "Gstin": seller_gst_number,
                            "LglNm": seller_company_name,
                            "Addr1": seller_company_address,
                            "Loc": seller_location,
                            "Pin": seller_pincode,
                            "Stcd": seller_state_code
                        },
                        "BuyerDtls": {
                            "Gstin": firstInvoice.invoice_origin_country === 'IND' ? customerGstNumber : "URP",
                            "LglNm": customerName,
                            "Pos": firstInvoice.invoice_origin_country === 'IND' ? customerStateCode : "96",
                            "Addr1": customerAddress,
                            "Loc": customerLocation,
                            "Pin": firstInvoice.invoice_origin_country === 'IND' ? customerPincode : 999999,
                            "Stcd": firstInvoice.invoice_origin_country === 'IND' ? customerStateCode : "96"
                        },
                        "ItemList": itemList,
                        "ValDtls": {
                            "AssVal": totalAssAmount,
                            "IGSTVal": totalIgstAmount,
                            "cgstVal": totalCgstAmount,
                            "sgstVal": totalSgstAmount,
                            "TotInvVal": totalValueWithTax
                        },
                        ...(firstInvoice.invoice_origin_country !== 'IND' && {
                            "expDtls": {
                                "forCur": firstInvoice.reg_currency,
                                "cntCode": "NP"
                            }
                        })
                    };

                    busyDialog.setText(`Calling IRN API for ${invRequestId}...`);

                    const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                        url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getIRNNumbers", true),
                        data: {
                            appId: seller_client_id,
                            appSecret: seller_client_secret,
                            gstNumber: seller_gst_number,
                            user_name: seller_user_name,
                            password: seller_password,
                            requestBody: requestBody
                        },
                        method: "POST"
                    });

                    if (!response || response.success === false) {
                        const msg = (response && response.message) ? response.message : "E-Invoicing API call failed";
                        for (const inv of invoicesInGroup) {
                            inv.status = 'Error in E-Invoicing';
                            inv.remark = inv.remark ? inv.remark + ', ' + msg : msg;
                        }
                        continue;
                    }

                    const result = response.result;
                    if (!result) {
                        throw new Error("Invalid response format from e-invoicing API");
                    }

                    const ackDate = result.AckDt;
                    const ackNo = result.AckNo;
                    const irn = result.Irn;
                    const signedInvoice = result.SignedInvoice;
                    const signedQRCode = result.SignedQRCode;

                    if (!ackDate || !ackNo || !irn || !signedInvoice || !signedQRCode) {
                        throw new Error("Incomplete response from e-invoicing API");
                    }

                    for (const inv of invoicesInGroup) {
                        inv.status = "E Invoicing Successful";
                        inv.remark = null;
                        inv.act_date = new Date(ackDate.replace(" ", "T"));
                        inv.act_number = ackNo;
                        inv.irn = irn;
                        inv.signed_invoices = signedInvoice;
                        inv.signed_qr_codee = signedQRCode;
                    }

                } catch (groupErr) {
                    console.error(`Error processing invoice group ${invRequestId}:`, groupErr);
                    for (const inv of groupedInvoices[invRequestId]) {
                        inv.status = 'Error in E-Invoicing';
                        inv.remark = groupErr.message || String(groupErr);
                    }
                }
            }

            await this.tm.commitP();
            this.setMode("DISPLAY");
            sap.m.MessageToast.show("E-invoicing process completed");

        } catch (err) {
            console.error("Error in e-invoicing process:", err);
            sap.m.MessageBox.error(err.message || "An error occurred during e-invoicing");
        } finally {
            busyDialog.close();
        }
    }

    public async getIRNDetails() {

        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, processing e-invoices..."
        });

        busyDialog.open();
        const listData = await this.tm.getTN("invoice_screen_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

        if (!selectedIndices.length) {
            busyDialog.close();
            sap.m.MessageToast.show("Please select at least one invoice");
            return;
        }

        const selectedInvoices = selectedIndices.map(index => listData[index]);
        const groupedInvoices = selectedInvoices.reduce((acc, invoice) => {
            const groupKey = invoice.inv_request_id;
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(invoice);
            return acc;
        }, {});

        const invRequestIds = Object.keys(groupedInvoices).sort();
        let allResults = [];

        const [businessAreaDetails, sellerCompanyDetails, gstTaxMaster, gstUomMapping] = await Promise.all([
            this.transaction.getExecutedQuery('d_o2c_business_area', {
                loadAll: true,
                partialSelect: ['business_area', 'tax_rule']
            }),
            this.transaction.getExecutedQuery('d_o2c_invoice_irn_table', {
                loadAll: true
            }),
            this.transaction.getExecutedQuery('d_o2c_ind_gst_tax_master', {
                loadAll: true
            }),
            this.transaction.getExecutedQuery('d_ind_gst_uom_mapping', {
                loadAll: true
            })
        ]);

        const businessAreaMap = businessAreaDetails.reduce((map, item) => {
            map[item.business_area] = item;
            return map;
        }, {});

        const sellerCompanyMap = sellerCompanyDetails.reduce((map, item) => {
            map[item.business_area] = item;
            return map;
        }, {});

        const gstTaxMasterMap = gstTaxMaster.reduce((map, item) => {
            map[item.billing_type] = item;
            return map;
        }, {});

        const gstUomMap = gstUomMapping.reduce((map, item) => {
            map[item.system_unit] = item;
            return map;
        }, {});

        for (const invRequestId of invRequestIds) {
            try {
                const invoicesInGroup = groupedInvoices[invRequestId];
                const firstGroupInvoice = invoicesInGroup[0];
                const businessArea = firstGroupInvoice.business_area;

                const sellerDetails = sellerCompanyMap[businessArea];
                if (!sellerDetails) {
                    throw new Error(`Seller details not found for business area ${businessArea}`);
                }

                const {
                    user_id: seller_user_name,
                    gstin_password: seller_password,
                    gst_number: seller_gst_number,
                    location: seller_location,
                    e_invoice_client_id: seller_client_id,
                    e_invoice_client_secret: seller_client_secret,
                    company_name: seller_company_name,
                    pincode: seller_pincode,
                    state_code: seller_state_code,
                    comp_addr: seller_company_address
                } = sellerDetails;

                let customerAddress = "";
                let customerLocation = "";
                let customerPincode = 0;
                let billToAddressId = "";

                const invoiceRelations = [
                    { key: "r_invoice_milestone", itemKey: "r_milestone_item" },
                    { key: "r_invoice_schedule", itemKey: "r_schedule_item" },
                    { key: "r_invoice_volume", itemKey: "r_volume_item" }
                ];

                for (const relation of invoiceRelations) {
                    const relationData = firstGroupInvoice[relation.key]?.[0]?.[relation.itemKey]?.[0]?.r_item_header?.[0];
                    if (relationData) {
                        const addressData = relationData.r_so_header_address?.[0];
                        if (addressData) {
                            customerAddress = `${addressData.address_1 || ""} ${addressData.address_2 || ""}`.trim();
                            customerLocation = addressData.city || "";
                            customerPincode = parseInt(addressData.pincode) || 0;
                            billToAddressId = relationData.bill_to_address || "";
                            break;
                        }
                    }
                }

                const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
                    loadAll: true,
                    address_map_id: billToAddressId
                });

                if (!customerAddressData.length) {
                    throw new Error("Customer address data not found");
                }

                const customerGstNumber = customerAddressData[0]?.gstin_vat || "";
                const customerStateCode = customerGstNumber.substring(0, 2);
                const customerName = firstGroupInvoice.client_name_vh?.additional_desc || "Unknown Customer";
                const taxpayer_type = customerAddressData[0]?.taxpayer_type;

                const itemList = [];
                let totalAssAmount = 0;
                let totalIgstAmount = 0;
                let totalCgstAmount = 0;
                let totalSgstAmount = 0;
                let totalValueWithTax = 0;

                for (let i = 0; i < invoicesInGroup.length; i++) {
                    const invoice = invoicesInGroup[i];
                    const businessAreaDetails = businessAreaMap[invoice.business_area] || {};

                    let tax_percentage = 0;
                    if (businessAreaDetails.tax_rule === 'gst') {
                        const taxInfo = gstTaxMasterMap[invoice.reg_billing_type];
                        if (!taxInfo) {
                            throw new Error(`Tax information not found for billing type ${invoice.reg_billing_type}`);
                        }
                        tax_percentage = taxInfo.tax_percentage;
                    }

                    const quantity = 1;
                    const rate = parseFloat(invoice.reg_milestone_amount || 0);
                    const totalAmount = parseFloat((rate * quantity).toFixed(2));
                    const discount = 0;
                    const assAmount = totalAmount - discount;
                    const gstRate = tax_percentage;
                    const igstAmount = parseFloat(invoice.igst) || 0;
                    const cgstAmount = parseFloat(invoice.cgst) || 0;
                    const sgstAmount = parseFloat(invoice.sgst) || 0;
                    const itemTotalWithTax = parseFloat(invoice.total_invoice) || 0;

                    const uomInfo = gstUomMap[invoice.unit];
                    if (!uomInfo) {
                        throw new Error(`UOM mapping not found for unit ${invoice.unit}`);
                    }

                    const taxMasterInfo = gstTaxMasterMap[invoice.reg_billing_type];
                    if (!taxMasterInfo) {
                        throw new Error(`Tax master info not found for billing type ${invoice.reg_billing_type}`);
                    }

                    itemList.push({
                        "SlNo": (i + 1).toString(),
                        "IsServc": taxMasterInfo.is_service,
                        "HsnCd": taxMasterInfo.hsc_sac_code,
                        "Qty": quantity,
                        "Unit": uomInfo.uom_unit,
                        "UnitPrice": rate,
                        "TotAmt": totalAmount,
                        "Discount": discount,
                        "AssAmt": assAmount,
                        "GstRt": gstRate,
                        "IGSTAmt": igstAmount,
                        "cgstAmt": cgstAmount,
                        "sgstAmt": sgstAmount,
                        "TotItemVal": itemTotalWithTax
                    });

                    totalAssAmount = parseFloat((totalAssAmount + assAmount).toFixed(2));
                    totalIgstAmount = parseFloat((totalIgstAmount + igstAmount).toFixed(2));
                    totalCgstAmount = parseFloat((totalCgstAmount + cgstAmount).toFixed(2));
                    totalSgstAmount = parseFloat((totalSgstAmount + sgstAmount).toFixed(2));
                    totalValueWithTax = parseFloat((totalValueWithTax + itemTotalWithTax).toFixed(2));
                }

                const currentDate = new Date();
                const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

                const requestBody = {
                    "Version": "1.1",
                    "TranDtls": {
                        "TaxSch": businessAreaMap[firstGroupInvoice.business_area].tax_rule === 'gst' ? "GST" : null,
                        "SupTyp": taxpayer_type === 'SEZ Unit/Developer' ? "SEZWOP" :
                            (firstGroupInvoice.invoice_origin_country === 'IND' ? "B2B" : "EXPWOP"),
                    },
                    "DocDtls": {
                        "Typ": "INV",
                        "No": firstGroupInvoice.inv_request_id,
                        "dt": formattedDate
                    },
                    "SellerDtls": {
                        "Gstin": seller_gst_number,
                        "LglNm": seller_company_name,
                        "Addr1": seller_company_address,
                        "Loc": seller_location,
                        "Pin": seller_pincode,
                        "Stcd": seller_state_code
                    },
                    "BuyerDtls": {
                        "Gstin": firstGroupInvoice.invoice_origin_country === 'IND' ? customerGstNumber : "URP",
                        "LglNm": customerName,
                        "Pos": firstGroupInvoice.invoice_origin_country === 'IND' ? customerStateCode : "96",
                        "Addr1": customerAddress,
                        "Loc": customerLocation,
                        "Pin": firstGroupInvoice.invoice_origin_country === 'IND' ? customerPincode : 999999,
                        "Stcd": firstGroupInvoice.invoice_origin_country === 'IND' ? customerStateCode : "96"
                    },
                    "ItemList": itemList,
                    "ValDtls": {
                        "AssVal": totalAssAmount,
                        "IGSTVal": totalIgstAmount,
                        "cgstVal": totalCgstAmount,
                        "sgstVal": totalSgstAmount,
                        "TotInvVal": totalValueWithTax
                    },
                    ...(firstGroupInvoice.invoice_origin_country !== 'IND' && {
                        "expDtls": {
                            "forCur": firstGroupInvoice.reg_currency,
                            "cntCode": "NP"
                        }
                    })
                };

                busyDialog.setText(`Processing invoice ${invRequestId}...`);

                const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                    url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getIRNNumbers", true),
                    data: {
                        appId: seller_client_id,
                        appSecret: seller_client_secret,
                        gstNumber: seller_gst_number,
                        user_name: seller_user_name,
                        password: seller_password,
                        requestBody: requestBody
                    },
                    method: "POST"
                });

                let irnResponse = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                    url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getIRNFetching", true),
                    data: {
                        appId: seller_client_id,
                        appSecret: seller_client_secret,
                        gstNumber: seller_gst_number,
                        user_name: seller_user_name,
                        password: seller_password,
                        irn: response.result[0].Desc.Irn
                    },
                    method: "POST"
                });

                irnResponse = JSON.parse(irnResponse);

                const result = irnResponse?.result;
                const ackDate = result?.AckDt;
                const ackNo = result?.AckNo;
                const irn = result?.Irn;
                const signedInvoice = result?.SignedInvoice;
                const signedQRCode = result?.SignedQRCode;

                if (ackDate && ackNo && irn && signedInvoice && signedQRCode) {
                    for (const invoice of invoicesInGroup) {
                        invoice.status = "E Invoicing Successful";
                        invoice.remark = null;
                        invoice.act_date = new Date(ackDate.replace(" ", "T"));
                        invoice.act_number = ackNo;
                        invoice.irn = irn;
                        invoice.signed_invoices = signedInvoice;
                        invoice.signed_qr_codee = signedQRCode;
                    }
                }
            } catch (error) {
                console.error(`Error processing invoice ${invRequestId}:`, error);
            }
        }

        await this.tm.commitP();
        busyDialog.close();
    }

    public async onMerge() {
        const listData = await this.tm.getTN("invoice_screen_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

        if (selectedIndices.length < 2) {
            sap.m.MessageBox.error("Please select more than one line item for merging");
            return;
        }

        const selectedSOs = new Set(selectedIndices.map(index => listData[index].so));

        if (selectedSOs.size > 1) {
            sap.m.MessageBox.error("All selected invoices must have the same SO Number.");
            return;
        }

        const clubbedId = await this.transaction.createEntityP("d_idseries", {
            s_object_type: "merge_invoice_id"
        });

        for (const index of selectedIndices) {
            listData[index].is_clubbed = true;
            listData[index].clubbed_id = clubbedId.a_id;
        }

        await this.tm.getTN("invoice_screen_list").refresh();
        await this.tm.commitP()
    }

    public async onDoingESigning(oEvent) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Processing e-signing, please wait..."
        });

        try {
            // First generate and attach PDFs (will attach when fromBrowser=false)
            await this.triggerInvoicePdf(oEvent, { fromBrowser: false });

            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                console.warn("No invoices selected for e-signing");
                return;
            }

            const password = await this.showPasswordDialog();
            if (!password) {
                return;
            }

            busyDialog.open();

            // Filter selected invoices based on allowed statuses
            const filteredInvoices = selectedIndices
                .map(index => listData[index])
                .filter(invoice =>
                    invoice.status === "E Invoicing Successful" ||
                    invoice.status === "Error in E Signing"
                );

            if (filteredInvoices.length === 0) {
                console.warn("No invoices with status 'E Invoicing Successful' or 'Error in E Signing' found.");
                busyDialog.close();
                return;
            }

            // Group filtered invoices by inv_request_id
            const groupedInvoices = filteredInvoices.reduce((acc, invoice) => {
                const groupKey = invoice.inv_request_id;
                if (!acc[groupKey]) acc[groupKey] = [];
                acc[groupKey].push(invoice);
                return acc;
            }, {});

            // For each group create a helper entity for e-signing (one per group)
            for (const invRequestId of Object.keys(groupedInvoices)) {
                const invoicesGroup = groupedInvoices[invRequestId];
                const mainInvoice = invoicesGroup[0];

                await this.transaction.createEntityP("d_invoice_e_signing_helper", {
                    s_object_type: -1,
                    password: password,
                    invoice_pdf: mainInvoice.invoice_pdf,
                    invoice_number: mainInvoice.inv_request_id,
                });
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("E-signing jobs queued");
        } catch (error) {
            console.error("Error during e-signing process:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during the e-signing process");
        } finally {
            busyDialog.close();
        }
    }

    private showPasswordDialog(): Promise<string> {
        return new Promise((resolve) => {
            const passwordInput = new sap.m.Input({
                type: "Password",
                placeholder: "Enter password for e-signing",
                width: "100%"
            });

            const infoText = new sap.m.Text({
                text: "Please enter your e-signing password:"
            });
            infoText.addStyleClass("sapUiSmallMarginBottom");

            const vBox = new sap.m.VBox();
            vBox.addItem(infoText);
            vBox.addItem(passwordInput);
            vBox.setJustifyContent("Center");
            vBox.setAlignItems("Stretch");
            vBox.addStyleClass("sapUiSmallMargin");

            const confirmButton = new sap.m.Button({
                text: "Confirm",
                type: "Emphasized",
                press: function () {
                    const password = passwordInput.getValue();
                    if (!password) {
                        sap.m.MessageToast.show("Password is required");
                        return;
                    }
                    dialog.close();
                    resolve(password);
                }
            });

            const cancelButton = new sap.m.Button({
                text: "Cancel",
                press: function () {
                    dialog.close();
                    resolve(null);
                }
            });

            const dialog = new sap.m.Dialog();
            dialog.setTitle("E-Signing Authentication");
            dialog.setType("Message");
            dialog.setState("Information");
            dialog.addContent(vBox);
            dialog.setBeginButton(confirmButton);
            dialog.setEndButton(cancelButton);
            dialog.attachAfterClose(function () {
                dialog.destroy();
            });
            dialog.addStyleClass("sapUiSizeCompact");
            dialog.open();
        });
    }

    public async uploadAPIData() {
        const currentDate = new Date();
        let defaultMonth = currentDate.getMonth() - 1;
        let defaultYear = currentDate.getFullYear();

        if (defaultMonth < 0) {
            defaultMonth = 11;
            defaultYear -= 1;
        }

        const dialogContainer = document.createElement('div');
        dialogContainer.style.position = 'fixed';
        dialogContainer.style.top = '0';
        dialogContainer.style.left = '0';
        dialogContainer.style.width = '100%';
        dialogContainer.style.height = '100%';
        dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        dialogContainer.style.display = 'flex';
        dialogContainer.style.justifyContent = 'center';
        dialogContainer.style.alignItems = 'center';
        dialogContainer.style.zIndex = '1000';

        const dialog = document.createElement('div');
        dialog.style.backgroundColor = 'white';
        dialog.style.borderRadius = '10px';
        dialog.style.padding = '20px';
        dialog.style.width = '400px';
        dialog.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        dialog.style.fontFamily = 'Arial, sans-serif';

        dialog.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 20px; color: #333;">Upload API Data</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Provider</label>
                <select id="providerDropdown" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Adaequare">Adaequare</option>
                    <option value="Vayana">Vayana</option>
                    <option value="Excellon">Excellon</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Month</label>
                <select id="monthDropdown" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    ${Array.from({ length: 12 }, (_, i) =>
            `<option value="${i + 1}" ${i === defaultMonth ? 'selected' : ''}>
                            ${new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Year</label>
                <select id="yearDropdown" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    ${Array.from({ length: 21 }, (_, i) =>
                `<option value="${2014 + i}" ${2014 + i === defaultYear ? 'selected' : ''}>
                            ${2014 + i}
                        </option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Attach Document</label>
                <div style="display: flex; align-items: center;">
                    <button id="browseButton" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Browse
                    </button>
                    <span id="fileNameDisplay" style="margin-left: 10px; color: #666;"></span>
                </div>
                <input type="file" id="fileInput" accept=".xlsx, .xls" style="display: none;" />
            </div>
            <button id="confirmButton" style="width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Confirm
            </button>
        `;

        dialogContainer.appendChild(dialog);
        document.body.appendChild(dialogContainer);

        const browseButton = dialog.querySelector('#browseButton') as HTMLButtonElement;
        const fileInput = dialog.querySelector('#fileInput') as HTMLInputElement;
        const fileNameDisplay = dialog.querySelector('#fileNameDisplay') as HTMLSpanElement;
        const confirmButton = dialog.querySelector('#confirmButton') as HTMLButtonElement;
        const providerDropdown = dialog.querySelector('#providerDropdown') as HTMLSelectElement;

        const closeDialog = () => {
            document.body.removeChild(dialogContainer);
            document.removeEventListener('keydown', escKeyHandler);
        };

        const escKeyHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeDialog();
            }
        };

        document.addEventListener('keydown', escKeyHandler);

        browseButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                fileNameDisplay.textContent = target.files[0].name;
            }
        });

        confirmButton.addEventListener('click', async () => {
            const provider = providerDropdown.value;
            const month = (dialog.querySelector('#monthDropdown') as HTMLSelectElement).value;
            const year = (dialog.querySelector('#yearDropdown') as HTMLSelectElement).value;
            const file = fileInput.files?.[0];

            if (!provider || !month || !year || !file) {
                alert('Please fill in all fields and select a file.');
                return;
            }

            const busyDialog = new sap.m.BusyDialog({
                text: "Uploading APIs... Please Wait"
            });
            busyDialog.open();

            const processFile = () => new Promise<void>(async (resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const data = e.target?.result;
                    if (!data) return;

                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);

                    // New Mapping Fetch
                    const allApiMappings = await this.transaction.getExecutedQuery('d_o2c_gsp_api_mapping', {
                        loadAll: true,
                        provider: provider,
                        billing_method: "excel_upload",
                        partialSelect: ['subscription', 'provider'],
                    });

                    const apiToSubscription: { [apiType: string]: string } = {};

                    for (const mapping of allApiMappings) {
                        await mapping.r_gsp_api_identifier.fetch();
                        if (mapping.r_gsp_api_identifier) {
                            for (const relatedApi of mapping.r_gsp_api_identifier) {
                                if (relatedApi.api_identifier) {
                                    apiToSubscription[relatedApi.api_identifier] = mapping.subscription;
                                }
                            }
                        }
                    }

                    const initialGroupedData: { [key: string]: { clientName: string, apiType: string, apiCount: number } } = {};

                    for (const row of jsonData) {
                        let clientName, apiType, apiCount;
                        if (provider === 'Vayana') {
                            clientName = row["Org_ID"]?.toString().trim() || "";
                            apiType = row["API Type"]?.toString().trim() || "";
                            apiCount = parseFloat(row["API_Count"]?.toString().trim() || "0");
                        } else if (provider === 'Adaequare') {
                            clientName = row["Client Name"]?.toString().trim() || "";
                            apiType = row["API Type"]?.toString().trim() || "";
                            apiCount = parseFloat(row["API Count"]?.toString().trim() || "0");
                        } else if (provider === 'Excellon') {
                            clientName = row["Client Name"]?.toString().trim() || "";
                            apiType = row["API TYPE"]?.toString().trim() || "";
                            apiCount = parseFloat(row["Sum of Success Count"]?.toString().trim() || "0");
                        }

                        if (!clientName || !apiType || isNaN(apiCount)) continue;

                        const key = `${clientName}|${apiType}`;
                        if (key in initialGroupedData) {
                            initialGroupedData[key].apiCount += apiCount;
                        } else {
                            initialGroupedData[key] = {
                                clientName,
                                apiType,
                                apiCount
                            };
                        }
                    }

                    const consolidatedBySubscription: {
                        [key: string]: {
                            clientName: string,
                            subscription: string,
                            apiTypes: string[],
                            apiCount: number
                        }
                    } = {};

                    for (const key in initialGroupedData) {
                        const { clientName, apiType, apiCount } = initialGroupedData[key];
                        const subscription = apiToSubscription[apiType];
                        if (!subscription) continue;

                        const subscriptionKey = `${clientName}|${subscription}`;
                        if (subscriptionKey in consolidatedBySubscription) {
                            consolidatedBySubscription[subscriptionKey].apiCount += apiCount;
                            if (!consolidatedBySubscription[subscriptionKey].apiTypes.includes(apiType)) {
                                consolidatedBySubscription[subscriptionKey].apiTypes.push(apiType);
                            }
                        } else {
                            consolidatedBySubscription[subscriptionKey] = {
                                clientName,
                                subscription,
                                apiTypes: [apiType],
                                apiCount
                            };
                        }
                    }

                    for (const key in consolidatedBySubscription) {
                        const { clientName, subscription, apiCount } = consolidatedBySubscription[key];

                        const apiItemData = await this.transaction.getExecutedQuery('d_o2c_so_api_type', {
                            loadAll: true,
                            client_identifier: clientName,
                            provider: provider,
                            api_type: subscription,
                            expandAll: "r_api_item,r_api_item/r_item_header"
                        });

                        if (!apiItemData.length) continue;

                        for (const apiItem of apiItemData) {
                            const apiItems = apiItem.r_api_item || [];
                            for (const item of apiItems) {
                                if (item.item_category !== "API") continue;

                                const perApiPrice = parseFloat(item.per_api_price || "0");
                                const minMonthlyRate = parseFloat(item.minimum_monthy_rate || "0");

                                if (isNaN(perApiPrice) || isNaN(minMonthlyRate)) continue;

                                const calculatedValue = perApiPrice * apiCount;
                                const finalValue = (calculatedValue > minMonthlyRate ? calculatedValue : minMonthlyRate).toFixed(2);
                                console.log(finalValue)
                                const selectedMonth = parseInt(month);
                                const selectedYear = parseInt(year);
                                const currentDay = currentDate.getDate();
                                const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                                const dateToUse = new Date(selectedYear, selectedMonth - 1, Math.min(currentDay, lastDayOfMonth));

                                const description = `${provider} ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`;

                                await item.r_item_attachment.fetch();
                                await item.r_item_attachment[0].r_attachment_header.fetch();
                                await salesorder.addApiAmtinSO(this.transaction, item.r_item_attachment[0].r_attachment_header[0].so, item.r_item_attachment[0].po_no, finalValue, description, dateToUse, item.soitem);
                            }
                        }
                    }

                    resolve();
                };

                reader.onerror = (error) => reject(error);
                reader.readAsBinaryString(file);
            });

            try {
                await processFile();
            } catch (error) {
                console.error('Error processing file:', error);
            } finally {
                busyDialog.close();
                closeDialog();
                await this.tm.commitP("Save Successfully", "Save Failed", false, true);
            }
        });
    }

    public async onCancelInvoice() {
        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            for (const index of selectedIndices) {
                const status = listData[index].status;
                let errorMessage = "";

                if (status === "Cancelled") {
                    errorMessage = "One or more selected invoices are already cancelled.";
                }
                if (errorMessage) {
                    sap.m.MessageBox.error(errorMessage, {
                        title: "Error",
                        actions: [sap.m.MessageBox.Action.OK],
                    });
                    return;
                }
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!selectedIndices.length) return;

            const clientIdResult = await this.transaction.getExecutedQuery('d_general_confg', { key: "e_invoicing_client_id", loadAll: true });
            const clientSecretResult = await this.transaction.getExecutedQuery('d_general_confg', { key: "e_invoicing_client_secret", loadAll: true });

            if (!clientIdResult.length || !clientSecretResult.length) return;

            const clientId = clientIdResult[0].low_value;
            const clientSecret = clientSecretResult[0].low_value;

            const selectedInvoices = selectedIndices.map(index => listData[index]);
            const groupedInvoices = {};
            selectedInvoices.forEach(invoice => {
                const groupKey = invoice.inv_request_id;
                if (!groupedInvoices[groupKey]) {
                    groupedInvoices[groupKey] = [];
                }
                groupedInvoices[groupKey].push(invoice);
            });

            const invRequestIds = Object.keys(groupedInvoices).sort();

            for (const invRequestId of invRequestIds) {
                const invoicesInGroup = groupedInvoices[invRequestId];
                const firstGroupInvoice = invoicesInGroup[0];

                if (firstGroupInvoice.irn && firstGroupInvoice.act_date) {
                    const actDate = new Date(firstGroupInvoice.act_date);
                    actDate.setHours(0, 0, 0, 0);
                    const diffInDays = Math.floor((today.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffInDays > 2) continue;
                }

                const irnNumberDetails = await this.transaction.getExecutedQuery('d_o2c_invoice_irn_table', {
                    'company_code': firstGroupInvoice.company_code,
                    'business_area': firstGroupInvoice.business_area,
                    loadAll: true
                });

                if (!irnNumberDetails.length) continue;

                const { user_id, gstin_password, gst_number } = irnNumberDetails[0];

                try {
                    const response = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                        url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getInvoiceCancellation", true),
                        data: {
                            appId: clientId,
                            appSecret: clientSecret,
                            gstNumber: gst_number,
                            user_name: user_id,
                            password: gstin_password,
                            irn: firstGroupInvoice.irn
                        },
                        method: "POST"
                    });

                    const parsedResponse = JSON.parse(response);
                    if (parsedResponse.success === false) {
                        for (const invoice of invoicesInGroup) {
                            invoice.status = invoice.status === 'Cancelled' ? 'Cancelled' : 'Error';
                            invoice.remark = parsedResponse.message;
                        }
                        continue;
                    }


                    for (const invoice of invoicesInGroup) {
                        invoice.status = "Cancelled";
                        invoice.remark = parsedResponse.message;
                        invoice.currently_pending_with = null;
                        invoice.cancelled_irn_date_time = new Date(parsedResponse.result.CancelDate.replace(" ", "T"));

                        if (invoice.r_invoice_milestone?.length === 1) {
                            invoice.r_invoice_milestone[0].status = "InvCan";
                        }
                        if (invoice.r_invoice_schedule?.length === 1) {
                            invoice.r_invoice_schedule[0].status = "InvCan";
                        }
                        if (invoice.r_invoice_volume?.length === 1) {
                            invoice.r_invoice_volume[0].invoice_status = "InvCan";
                        }
                    }
                } catch (error) {
                    continue;
                }
            }

            await this.tm.commitP();
        } catch (error) {
            console.error("Error in onCancelInvoice:", error);
        }
    }

    public async zohoInvoiceGeneration() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, generating Zoho invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                return Promise.resolve();
            }

            const validStatuses = ["Approved", "Error in Zoho Invoice Generation"];
            const filteredIndices = selectedIndices.filter(index =>
                validStatuses.includes(listData[index].status)
            );

            if (filteredIndices.length === 0) {
                busyDialog.close();
                return Promise.resolve();
            }

            const zohoCredentials = await this.transaction.getExecutedQuery('d_o2c_invoice_zoho_config', { loadAll: true });
            const zoho_grant_type = zohoCredentials[0].zoho_grant_type;
            const zoho_redirect_uri = zohoCredentials[0].zoho_redirect_uri;
            const zoho_client_secret = zohoCredentials[0].zoho_client_secrets;
            const zoho_client_id = zohoCredentials[0].zoho_client_ids;
            const zoho_refresh_token = zohoCredentials[0].zoho_r_token;
            const organizationId = zohoCredentials[0].zoho_organization_id;

            const groupedByRequestId = {};
            for (const index of filteredIndices) {
                const invRequestId = listData[index].inv_request_id;
                if (!groupedByRequestId[invRequestId]) {
                    groupedByRequestId[invRequestId] = [];
                }
                groupedByRequestId[invRequestId].push(index);
            }

            const requestIds = Object.keys(groupedByRequestId);
            let processedCount = 0;

            for (const requestId in groupedByRequestId) {
                processedCount++;
                busyDialog.setText(`Processing invoice ${processedCount} of ${requestIds.length}...`);

                const indicesInGroup = groupedByRequestId[requestId];
                const firstInvoice = listData[indicesInGroup[0]];

                const zohoExternalID = await this.transaction.getExecutedQuery('d_o2c_customers', {
                    customer_id: firstInvoice.reg_client_name,
                    loadAll: true
                });

                if (!zohoExternalID || !zohoExternalID[0]?.external_customer_id) {
                    continue;
                }

                const lineItems = [];

                for (const index of indicesInGroup) {
                    const invoice = listData[index];
                    let invoiceList = [];

                    if (invoice.r_invoice_list?.fetch) {
                        invoiceList = await invoice.r_invoice_list.fetch();
                    }

                    if (invoiceList && invoiceList.length > 0) {
                        invoiceList.forEach(row => {
                            lineItems.push({
                                hsn_or_sac: parseInt(row.sac_code),
                                rate: parseFloat(row.rate),
                                name: row.inv_primary_desc,
                                quantity: parseFloat(row.quantity),
                            });
                        });
                    } else {
                        lineItems.push({
                            hsn_or_sac: parseInt(invoice.sac_code),
                            rate: parseFloat(invoice.reg_milestone_amount),
                            name: invoice.reg_milestone_name,
                            quantity: 1,
                        });
                    }
                }

                try {
                    busyDialog.setText(`Sending data to Zoho for invoice ${requestId}...`);

                    const response = await KloAjax.getInstance().perFormAction(
                        AUTHORIZATION_TYPE.RUNTIME,
                        {
                            url: System.gi_URI().getAppServiceUrl(
                                this.getFlavor(),
                                this.getFlavorVersion(),
                                "getZohoInvoiceGeneration",
                                true
                            ),
                            data: {
                                zohoRefreshToken: zoho_refresh_token,
                                zohoClientId: zoho_client_id,
                                zohoClientSecret: zoho_client_secret,
                                zohoRedirectURI: zoho_redirect_uri,
                                zohoGrantType: zoho_grant_type,
                                organizationId: organizationId,
                                zohoExternalID: zohoExternalID[0].external_customer_id,
                                lineItems: lineItems,
                                invoice_number: firstInvoice.inv_request_id
                            },
                            method: "POST"
                        }
                    );

                    if (response.status === 'Failed') {
                        for (const index of indicesInGroup) {
                            const invoice = listData[index];
                            invoice.status = "Error in Zoho Invoice Generation";
                            invoice.remark = response.message;
                        }
                        continue;
                    }

                    busyDialog.setText(`Updating invoice records for ${requestId}...`);

                    for (const index of indicesInGroup) {
                        const invoice = listData[index];
                        invoice.status = "Zoho Invoice Created";
                        invoice.zoho_invoice_id = response.invoice.invoice_id;
                        invoice.remark = null;

                        if (invoice.r_invoice_milestone?.length === 1) {
                            invoice.r_invoice_milestone[0].invoice_no = invoice.inv_request_id;
                            invoice.r_invoice_milestone[0].status = "Invoiced";
                            invoice.r_invoice_milestone[0].invoice_date = new Date();
                        }

                        if (invoice.r_invoice_schedule?.length === 1) {
                            invoice.r_invoice_schedule[0].invoice_no = invoice.inv_request_id;
                            invoice.r_invoice_schedule[0].status = "Invoiced";
                            invoice.r_invoice_schedule[0].invoice_date = new Date();
                        }

                        if (invoice.r_invoice_volume?.length === 1) {
                            invoice.r_invoice_volume[0].invoice_no = invoice.inv_request_id;
                            invoice.r_invoice_volume[0].invoice_status = "Invoiced";
                            invoice.r_invoice_volume[0].invoice_date = new Date();
                        }
                    }
                } catch { }
            }

            busyDialog.setText("Saving changes...");
            await this.tm.commitP();
            busyDialog.close();
            return Promise.resolve();

        } catch {
            busyDialog.close();
            return Promise.resolve();
        }
    }

    public async onGenerateInvoicePDF(invoiceData: any, fromBrowser): Promise<void> {
        try {
            // Validation: ensure we have invoiceData and items
            if (!invoiceData || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
                throw new Error("Invalid invoice data or no items to generate PDF");
            }

            // Utility functions
            const formatDateToDDMMYYYY = (dateValue) => {
                if (!dateValue) return '';
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return '';
                return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            };
            const getGSTStateCode = (gstin) => gstin?.substring(0, 2) || '';

            // Create PDF document
            const jsPDFModule = await import("kloExternal/jspdf.min");
            const jsPDF = jsPDFModule.default;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const leftMargin = 15;
            const rightMargin = pageWidth - 15;
            const blueColor = '#0070C0';
            const grayColor = '#7F7F7F';
            const blackColor = '#000000';

            // Company logo (if exists)
            try {
                const logoWidth = 50, logoHeight = 7;
                const c = await this.transaction.getExecutedQuery("d_asset_logo", { loadAll: true, file_name: "maventic_logo_2" });
                if (c?.[0]?.logo_attachment) {
                    const attachment = await c[0].logo_attachment.getAttachmentBlobP();
                    const base64Data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(attachment);
                    });
                    const base64Image = (base64Data || "").split(",")[1];
                    if (base64Image) {
                        doc.addImage({ imageData: base64Image, format: 'PNG', x: leftMargin, y: 10, width: logoWidth, height: logoHeight, alias: 'companyLogo', compression: 'NONE' });
                    }
                }
            } catch (error) { console.error("Logo loading error:", error); }

            // Company header
            doc.setFontSize(10).setTextColor(grayColor).setFont('Helvetica', 'bold');
            doc.text('Maventic Innovative Solutions Pvt Ltd.', leftMargin, 20);
            doc.setTextColor(blackColor).setFont('Helvetica', 'normal').setFontSize(9);
            doc.text('No.593, 60 Feet Road, AECS Layout, Brookfields', leftMargin, 25);
            doc.text('Bangalore, Karnataka - 560037, India', leftMargin, 29);
            doc.text('GSTIN: 29AAECM7803N1ZY', leftMargin, 35);
            doc.text('Phone: +91 8296969824', leftMargin, 39);
            doc.text('Email: finance@maventic.com', leftMargin, 43);
            doc.text('Website: https://maventic.com', leftMargin, 47);

            // Invoice header
            doc.setTextColor(blueColor).setFont('Helvetica', 'bold').setFontSize(14);
            doc.text('TAX INVOICE', rightMargin, 20, { align: 'right' });
            doc.setFontSize(10).setTextColor(blackColor);

            if (invoiceData.lutNumber) {
                doc.text(`INVOICE # ${invoiceData.invoiceNumber || ''}`, rightMargin, 32, { align: 'right' });
                doc.text(`DATE ${formatDateToDDMMYYYY(invoiceData.date)}`, rightMargin, 38, { align: 'right' });
                doc.text(`LUT Number # ${invoiceData.lutNumber}`, rightMargin, 44, { align: 'right' });
            } else {
                doc.text(`INVOICE # ${invoiceData.invoiceNumber || ''}`, rightMargin, 38, { align: 'right' });
                doc.text(`DATE ${formatDateToDDMMYYYY(invoiceData.date)}`, rightMargin, 44, { align: 'right' });
            }

            doc.setDrawColor(200, 200, 200).line(leftMargin, 53, rightMargin, 53);

            // TO section
            doc.setTextColor(blackColor).setFont('Helvetica', 'bold');
            doc.text('TO', leftMargin, 61);
            doc.setFont('Helvetica', 'normal');
            doc.text(invoiceData.companyName || '', leftMargin, 67);

            const addressLines = [];
            if (invoiceData.streetAddress) {
                if (invoiceData.streetAddress.includes(',')) {
                    const parts = invoiceData.streetAddress.split(/,(.+)/);
                    addressLines.push(parts[0].trim());
                    if (parts[1]) addressLines.push(parts[1].trim());
                } else addressLines.push(invoiceData.streetAddress);
            }
            if (invoiceData.cityStateZip) addressLines.push(invoiceData.cityStateZip);

            let currentAddressY = 73;
            addressLines.forEach(line => { doc.text(line, leftMargin, currentAddressY); currentAddressY += 6; });

            let nextY = currentAddressY;
            if (invoiceData.gstin) { doc.text(`GSTIN ${invoiceData.gstin}`, leftMargin, nextY); nextY += 6; }
            if (invoiceData.email) { doc.text(invoiceData.email, leftMargin, nextY); nextY += 6; }

            doc.setDrawColor(200, 200, 200).line(leftMargin, nextY + 6, rightMargin, nextY + 6);
            nextY += 12;

            // Place of Supply + PO
            if (invoiceData.placeOfSupply) {
                let stateText = invoiceData.placeOfSupply;
                if (invoiceData.gstin) {
                    const stateCode = getGSTStateCode(invoiceData.gstin);
                    if (stateCode) stateText += ` (${stateCode})`;
                }
                doc.text(`Place of Supply: ${stateText}`, leftMargin, nextY);
            }
            if (invoiceData.poNumber) {
                const poText = "P.O. # ", poNumber = invoiceData.poNumber;
                const poTextWidth = doc.getTextWidth(poText);
                const poTotalWidth = poTextWidth + doc.getTextWidth(poNumber);
                const poStartPosition = rightMargin - poTotalWidth;
                doc.setTextColor(blueColor).setFont('Helvetica', 'bold');
                doc.text(poText, poStartPosition, nextY);
                doc.setTextColor(blackColor).setFont('Helvetica', 'normal');
                doc.text(poNumber, poStartPosition + poTextWidth, nextY);
            }

            nextY += 6;
            doc.line(leftMargin, nextY, rightMargin, nextY);

            // Items table header
            const tableStartY = nextY + 8;
            doc.setTextColor(blueColor).setFont('Helvetica', 'bold');
            doc.text('#', leftMargin, tableStartY);
            doc.text('Description', 25, tableStartY);
            doc.text('SAC', 110, tableStartY);
            doc.text('Qty', 130, tableStartY);
            doc.text('Rate', 150, tableStartY);
            doc.text('Amount', rightMargin, tableStartY, { align: 'right' });
            doc.setDrawColor(200, 200, 200).line(leftMargin, tableStartY + 2, rightMargin, tableStartY + 2);

            // Items
            doc.setTextColor(blackColor).setFont('Helvetica', 'normal');
            let currentY = tableStartY + 8;
            const rowHeight = 7;
            (invoiceData.items || []).forEach((item, index) => {
                doc.text((index + 1).toString(), leftMargin, currentY);
                doc.text(item.description || '', 25, currentY);
                doc.text(item.sac || '', 110, currentY);
                doc.text((item.quantity?.toString() || '0'), 130, currentY);
                doc.text((item.rate || 0).toFixed(2), 150, currentY);
                doc.text((item.amount || 0).toFixed(2), rightMargin, currentY, { align: 'right' });

                // invoiceDescription (second line)
                if (item.invoiceDescription) {
                    const descY = currentY + 5;
                    doc.setFont('Helvetica', 'normal').setFontSize(8).setTextColor('#555555');
                    doc.text(item.invoiceDescription, 25, descY);
                    currentY = descY;
                    doc.setFontSize(9).setTextColor('#000000');
                }

                if (index < (invoiceData.items.length - 1)) {
                    doc.line(leftMargin, currentY + 3, rightMargin, currentY + 3);
                }

                currentY += rowHeight;
            });

            doc.line(leftMargin, currentY - 3, rightMargin, currentY - 3);

            // Totals
            const subtotal = invoiceData.subTotal || 0;
            const cgst = invoiceData.cgstAmount || 0;
            const sgst = invoiceData.sgstAmount || 0;
            const igst = invoiceData.igstAmount || 0;
            const totalBeforeRounding = subtotal + cgst + sgst + igst;
            const roundedTotal = Math.round(totalBeforeRounding);
            const roundOffAmount = roundedTotal - totalBeforeRounding;

            const totalsLabelX = rightMargin - 40;
            let totalsSectionY = currentY + 5;
            const totalLineHeight = 7;

            doc.setFont('Helvetica', 'bold');
            doc.text('Sub Total', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(subtotal.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            if (cgst > 0 && sgst > 0) {
                totalsSectionY += totalLineHeight;
                doc.text('CGST (9%)', totalsLabelX, totalsSectionY, { align: 'right' });
                doc.text(cgst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });
                totalsSectionY += totalLineHeight;
                doc.text('SGST (9%)', totalsLabelX, totalsSectionY, { align: 'right' });
                doc.text(sgst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });
            }
            if (igst > 0) {
                totalsSectionY += totalLineHeight;
                doc.text('IGST (18%)', totalsLabelX, totalsSectionY, { align: 'right' });
                doc.text(igst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });
            }

            totalsSectionY += totalLineHeight;
            doc.text('Round Off', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(roundOffAmount.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            doc.line(totalsLabelX - 30, totalsSectionY + 4, rightMargin, totalsSectionY + 4);
            totalsSectionY += totalLineHeight + 3;
            doc.setFontSize(11);
            doc.text('Total', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(roundedTotal.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });
            doc.setFontSize(10);

            // Amount in words
            const footerHeight = 20;
            const finalLineY = pageHeight - footerHeight;
            const payableToY = finalLineY - 42;
            const amountInWordsY = payableToY - 20;
            doc.line(leftMargin, amountInWordsY - 5, rightMargin, amountInWordsY - 5);
            doc.setFont('Helvetica', 'bold').text('Amount in Words:', leftMargin, amountInWordsY);
            doc.setFont('Helvetica', 'normal');
            let amountInWords = "N/A";
            try { amountInWords = `${this.numberToWords(roundedTotal)} only`; } catch { }
            doc.text(amountInWords, leftMargin + 40, amountInWordsY);
            doc.line(leftMargin, amountInWordsY + 7, rightMargin, amountInWordsY + 7);

            // E-Invoice block (QR + IRN) on right
            if (invoiceData.signedQR) {
                try {
                    const qrGenerator = await import("kloExternal/bwip-js-min");
                    const qrCanvas = document.createElement("canvas");
                    qrGenerator.toCanvas(qrCanvas, { bcid: "qrcode", scale: 3, text: invoiceData.signedQR, includetext: false });
                    const qrDataURL = qrCanvas.toDataURL("image/png");

                    const eInvoiceX = pageWidth / 2 + 5;
                    const eInvoiceY = 55;
                    const eInvoiceWidth = rightMargin - eInvoiceX;

                    doc.setFont('Helvetica', 'bold').setFontSize(10).setTextColor(blueColor);
                    doc.text('E-Invoice', eInvoiceX + (eInvoiceWidth / 2), eInvoiceY + 2, { align: 'center' });

                    const qrCodeSize = 25;
                    const qrCodeX = eInvoiceX + (eInvoiceWidth - qrCodeSize) / 2;
                    const qrCodeY = eInvoiceY + 6;
                    doc.addImage(qrDataURL, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

                    doc.setTextColor(blackColor).setFont('Helvetica', 'normal').setFontSize(8);
                    let currentTextY = qrCodeY + qrCodeSize + 4;

                    if (invoiceData.irnNumber) {
                        doc.setFont('Helvetica', 'bold').text('IRN:', eInvoiceX, currentTextY);
                        doc.setFont('Helvetica', 'normal');
                        const splitIRN = doc.splitTextToSize(invoiceData.irnNumber, eInvoiceWidth - 15);
                        doc.text(splitIRN, eInvoiceX + 15, currentTextY);
                        currentTextY += splitIRN.length * 3.5 + 1;
                    }
                    if (invoiceData.actNumber) {
                        doc.setFont('Helvetica', 'bold').text('ACK No:', eInvoiceX, currentTextY);
                        doc.setFont('Helvetica', 'normal').text(invoiceData.actNumber, eInvoiceX + 15, currentTextY);
                        currentTextY += 4;
                    }
                    if (invoiceData.actDate) {
                        doc.setFont('Helvetica', 'bold').text('ACK Date:', eInvoiceX, currentTextY);
                        doc.setFont('Helvetica', 'normal').text(formatDateToDDMMYYYY(invoiceData.actDate), eInvoiceX + 15, currentTextY);
                    }
                } catch (qrError) { console.error("QR code generation failed:", qrError); }
            }

            // Payment info
            doc.setTextColor(blackColor).setFontSize(10).setFont('Helvetica', 'bold');
            doc.text('Payable to - Maventic Innovative Solutions Pvt Ltd', leftMargin, payableToY);
            doc.setFont('Helvetica', 'normal');
            doc.text('Payment mode: Online Transfer / Cheque / DD', leftMargin, finalLineY - 36);

            if (invoiceData.invoiceCountryOrigin && invoiceData.invoiceCountryOrigin !== 'IND') {
                doc.text('Bank Name: Citibank NA India', leftMargin, finalLineY - 30);
                doc.text('Bank A/c No.: 0566386011', leftMargin, finalLineY - 24);
                doc.text('IFSC Code: CITI0000004', leftMargin, finalLineY - 18);
                doc.text('Swift Code: CITIINBXBLR', leftMargin, finalLineY - 12);
            } else {
                doc.text('Bank Name: HDFC Bank Ltd', leftMargin, finalLineY - 30);
                doc.text('Bank A/c No.: 50200064231891', leftMargin, finalLineY - 24);
                doc.text('IFSC Code: HDFC0001472', leftMargin, finalLineY - 18);
                doc.text('Swift Code: HDFCINBBBNG', leftMargin, finalLineY - 12);
            }
            doc.text('Payment is due within 30 days.', leftMargin, finalLineY - 6);
            doc.line(leftMargin, finalLineY, rightMargin, finalLineY);

            // Contact info
            let contactText = "If you have any questions concerning this invoice, contact";
            if (invoiceData.contactName) contactText += ` ${invoiceData.contactName}`;
            if (invoiceData.contactPhone) contactText += ` | ${invoiceData.contactPhone}`;
            if (invoiceData.contactEmail) contactText += ` | ${invoiceData.contactEmail}`;
            doc.text(contactText, pageWidth / 2, finalLineY + 8, { align: 'center' });

            // Save/attach PDF
            const filename = `Invoice_${invoiceData.invoiceNumber || 'unknown'}.pdf`;
            const blob = doc.output("blob");

            if (fromBrowser) {
                this.showPDFPreviewDialog(blob, filename, doc);
            } else {
                try {
                    const invoiceTable = await this.transaction.getExecutedQuery(
                        "d_invoice_request_hdr_table",
                        { loadAll: true, inv_request_id: invoiceData.invoiceNumber }
                    );

                    if (!invoiceTable || invoiceTable.length === 0) {
                        throw new Error("Could not attach PDF to any invoice record");
                    }

                    for (const invoice of invoiceTable) {
                        if (!invoice.invoice_pdf) {
                            console.error("invoice_pdf field missing for record:", invoice);
                            throw new Error("invoice_pdf field not found in record");
                        }

                        await invoice.invoice_pdf.setAttachmentP(blob, filename);
                    }

                    let retryCount = 0;
                    const maxRetries = 5;
                    let commitSuccess = false;

                    while (retryCount < maxRetries && !commitSuccess) {
                        try {
                            await this.tm.commitP("Uploaded successfully", "Processing", true, true);
                            commitSuccess = true;
                        } catch (error) {
                            retryCount++;

                            console.error(
                                `Commit attempt ${retryCount} failed:`,
                                error?.stack ?? error?.message ?? error
                            );

                            if (retryCount >= maxRetries) {
                                sap.m.MessageToast.show(
                                    `Failed to upload after ${maxRetries} attempts. Please try again.`
                                );
                                throw error;
                            }

                            const waitTime = 500 * Math.pow(2, retryCount - 1);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                    }
                } catch (err) {
                    console.error("Error inside ELSE block:", err);
                    throw err;
                }
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    private showPDFPreviewDialog(blob: Blob, filename: string, doc: any): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 900px;
            height: 90%;
            max-height: 700px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px 24px 16px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Invoice PDF Preview';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = filename;
        subtitle.style.cssText = `
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #6b7280;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const headerContent = document.createElement('div');
        headerContent.appendChild(title);
        headerContent.appendChild(subtitle);

        header.appendChild(headerContent);

        // Create PDF viewer container
        const viewerContainer = document.createElement('div');
        viewerContainer.style.cssText = `
            flex: 1;
            padding: 24px;
            overflow: auto;
            background: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        `;

        // Create PDF embed/iframe
        const pdfUrl = URL.createObjectURL(blob);
        const pdfViewer = document.createElement('iframe');
        pdfViewer.src = pdfUrl;
        pdfViewer.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;

        viewerContainer.appendChild(pdfViewer);

        // Create footer with buttons
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 20px 24px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        `;

        // Create Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.style.cssText = `
            background: #0070f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.2s ease;
        `;

        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.background = '#0051cc';
            downloadBtn.style.transform = 'translateY(-1px)';
        });

        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.background = '#0070f3';
            downloadBtn.style.transform = 'translateY(0)';
        });

        downloadBtn.addEventListener('click', () => {
            doc.save(filename);
        });

        // Create Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#4b5563';
            closeBtn.style.transform = 'translateY(-1px)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#6b7280';
            closeBtn.style.transform = 'translateY(0)';
        });

        const closeDialog = () => {
            URL.revokeObjectURL(pdfUrl);
            document.body.removeChild(overlay);
        };

        closeBtn.addEventListener('click', closeDialog);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });

        // Close on Escape key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Assemble dialog
        footer.appendChild(downloadBtn);
        footer.appendChild(closeBtn);

        dialog.appendChild(header);
        dialog.appendChild(viewerContainer);
        dialog.appendChild(footer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Animate in
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.95) translateY(20px)';

        requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.2s ease';
            dialog.style.transition = 'transform 0.2s ease';
            overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1) translateY(0)';
        });
    }

    private numberToWords(num: number): string {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';

        let words = '';
        const numStr = Math.floor(num).toString();

        // Crore part
        if (numStr.length > 7) {
            const crore = parseInt(numStr.substring(0, numStr.length - 7));
            words += this.convertThreeDigits(crore) + ' Crore ';
        }

        // Lakh part
        if (numStr.length > 5) {
            const lakh = parseInt(numStr.substring(Math.max(numStr.length - 7, 0), numStr.length - 5));
            words += this.convertThreeDigits(lakh) + ' Lakh ';
        }

        // Thousand part
        const thousand = parseInt(numStr.substring(Math.max(numStr.length - 5, 0), numStr.length - 3));
        if (thousand > 0) {
            words += this.convertThreeDigits(thousand) + ' Thousand ';
        }

        // Hundred part
        const hundred = parseInt(numStr.substring(Math.max(numStr.length - 3, 0)));
        words += this.convertThreeDigits(hundred);

        return words.trim();
    }

    private convertThreeDigits(n: number): string {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (n === 0) return '';
        let str = '';

        const hundred = Math.floor(n / 100);
        const remainder = n % 100;

        if (hundred > 0) {
            str += units[hundred] + ' Hundred ';
        }

        if (remainder > 0) {
            if (remainder < 10) {
                str += units[remainder];
            } else if (remainder < 20) {
                str += teens[remainder - 10];
            } else {
                const ten = Math.floor(remainder / 10);
                const unit = remainder % 10;
                str += tens[ten];
                if (unit > 0) {
                    str += ' ' + units[unit];
                }
            }
        }

        return str.trim();
    }

    public async triggerInvoicePdf(oEvent, params) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Generating invoice PDF, please wait..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                console.warn("No invoices selected");
                return;
            }

            const selectedInvoices = selectedIndices.map(index => listData[index]);

            // Multiple selected -> group by inv_request_id and produce one PDF per group
            const grouped = selectedInvoices.reduce((acc, invoice) => {
                const key = invoice.inv_request_id;
                if (!acc[key]) acc[key] = [];
                acc[key].push(invoice);
                return acc;
            }, {});

            const groups = Object.keys(grouped);
            for (let i = 0; i < groups.length; i++) {
                const invRequestId = groups[i];
                const invoicesGroup = grouped[invRequestId];
                busyDialog.setText(`Generating PDF for invoice group ${invRequestId}...`);
                await this.processMultipleInvoices(invoicesGroup, params.fromBrowser);
            }


            await this.tm.commitP();
        } catch (error) {
            console.error("Error generating invoice PDF:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during invoice PDF generation");
        } finally {
            busyDialog.close();
        }
    }

    private async processMultipleInvoices(selectedInvoices, fromBrowser) {
        // Combine invoices into a single batch invoice PDF (assume same buyer)
        const firstInvoice = selectedInvoices[0];

        // Extract address from relations of first invoice
        let billToAddressId = "";
        let customerState = "";
        let customerAddressOne = "";
        let customerAddressTwo = "";
        let customerPincode = 0;

        const invoiceRelations = [
            { key: "r_invoice_milestone", itemKey: "r_milestone_item" },
            { key: "r_invoice_schedule", itemKey: "r_schedule_item" },
            { key: "r_invoice_volume", itemKey: "r_volume_item" }
        ];

        for (const relation of invoiceRelations) {
            if (firstInvoice[relation.key]?.length > 0) {
                const invoiceItem = firstInvoice[relation.key]?.[0]?.[relation.itemKey]?.[0]?.r_item_header?.[0]?.r_so_header_address?.[0];
                if (invoiceItem) {
                    customerAddressOne = invoiceItem.address_1 || "";
                    customerAddressTwo = invoiceItem.address_2 || "";
                    customerState = invoiceItem.state || "";
                    customerPincode = parseInt(invoiceItem.pincode) || 0;
                    billToAddressId = firstInvoice[relation.key]?.[0]?.[relation.itemKey]?.[0]?.r_item_header?.[0]?.bill_to_address || "";
                    break;
                }
            }
        }

        const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
            loadAll: true,
            address_map_id: billToAddressId
        });

        const customerMailId = await this.transaction.getExecutedQuery('d_o2c_customers_contact', {
            loadAll: true,
            k_id: firstInvoice.reg_client_name
        });

        const customerGstNumber = customerAddressData?.[0]?.gstin_vat || "";
        const customerName = firstInvoice?.client_name_vh?.additional_desc || "";

        // Build items by iterating each invoice and using its r_invoice_list.fetch() if present
        const items = [];
        let globalIndex = 1;
        for (const invoice of selectedInvoices) {
            await invoice.r_invoice_list?.fetch();
            const invoiceList = invoice.r_invoice_list;
            if (invoiceList && invoiceList.length > 0) {
                for (const row of invoiceList) {
                    items.push({
                        description: row.inv_primary_desc || invoice.reg_milestone_name || "",
                        sac: row.sac_code,
                        quantity: row.quantity ? parseFloat(row.quantity) : 1,
                        rate: row.rate ? parseFloat(row.rate) : 0,
                        amount: row.amount ? parseFloat(row.amount) : (row.rate ? parseFloat(row.rate) * (row.quantity ? parseFloat(row.quantity) : 1) : 0),
                        invoiceDescription: row.invoice_sec_desc || invoice.trans_invoice_description || "",
                        _source_inv_request_id: invoice.inv_request_id, // internal reference (optional, won't be printed)
                        _slno: globalIndex++
                    });
                }
            } else {
                // fallback single line item from invoice
                items.push({
                    description: invoice.reg_milestone_name,
                    sac: invoice.sac_code,
                    quantity: 1,
                    rate: parseFloat(invoice.reg_milestone_amount || 0),
                    amount: parseFloat(invoice.reg_milestone_amount || 0),
                    invoiceDescription: invoice.trans_invoice_description || "",
                    _source_inv_request_id: invoice.inv_request_id,
                    _slno: globalIndex++
                });
            }
        }

        // Totals across all invoices/items
        const subTotal = items.reduce((s, it) => s + (parseFloat(it.amount || 0)), 0);
        const cgstAmount = selectedInvoices.reduce((s, inv) => s + (parseFloat(inv.cgst || 0)), 0);
        const sgstAmount = selectedInvoices.reduce((s, inv) => s + (parseFloat(inv.sgst || 0)), 0);
        const igstAmount = selectedInvoices.reduce((s, inv) => s + (parseFloat(inv.igst || 0)), 0);
        const totalAmount = selectedInvoices.reduce((s, inv) => s + (parseFloat(inv.total_invoice || 0)), 0);

        const batchInvoiceData = {
            invoiceNumber: firstInvoice.inv_request_id,
            date: new Date().toISOString().split("T")[0],
            companyName: customerName,
            streetAddress: `${customerAddressOne || ""} ${customerAddressTwo || ""}`.trim(),
            cityStateZip: `${customerState || ""} ${customerPincode || ""}`.trim(),
            gstin: customerGstNumber,
            email: customerMailId[0]?.email_id || "",
            placeOfSupply: customerState,
            poNumber: firstInvoice.po_number,
            items: items,
            subTotal: parseFloat(subTotal.toFixed(2)),
            cgstAmount: parseFloat(cgstAmount.toFixed(2)),
            sgstAmount: parseFloat(sgstAmount.toFixed(2)),
            igstAmount: parseFloat(igstAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            contactName: "Umesh Finance",
            contactPhone: "+91 9916350369",
            contactEmail: "umesh.m@maventic.com",
            lutNumber: firstInvoice.gstin_lut,
            invoiceCountryOrigin: firstInvoice.invoice_origin_country,
            irnNumber: firstInvoice.irn,
            signedQR: firstInvoice.signed_qr_codee,
            actNumber: firstInvoice.act_number,
            actDate: firstInvoice.act_date,
            isBatchInvoice: true,
            invoiceCount: selectedInvoices.length
        };

        await this.onGenerateInvoicePDF(batchInvoiceData, fromBrowser);
    }

    public async onNavigateToSoScreen(oEvent: sap.ui.base.Event) {
        let so_guid = this.tm.getTN("invoice_screen_detail").getData().so_guid
        await this.navTo(({ S: 'p_so', AD: so_guid }));
    }

    public async onSendingInvoiceMail() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Sending invoice mails, please wait..."
        });

        try {
            // await this.tm.getTN("query_invoice_search").getData().refreshP();
            // await this.tm.getTN("query_invoice_search").refresh();
            const listData = await this.tm.getTN("invoice_screen_list").getData();
            await listData.getQuery().refreshP();
            const q = listData.getQuery()
            q.setLoadAll(true)
            await q.refreshP()

            // const listData = await this.transaction.getExecutedQuery("q_invoice_request_hdr_table", {
            //     login_role: this.role,
            //     loadAll: true,
            //     skipMap: true
            // });
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                console.warn("No invoices selected for mailing");
                return;
            }

            busyDialog.open();

            const selectedInvoices = selectedIndices
                .map(index => listData[index])
                .filter(invoice =>
                    invoice.status === "E Signing Successful" &&
                    invoice.trans_billing_mode === "email"
                    ||
                    invoice.status === "Error In Sending Mail"
                );

            if (selectedInvoices.length === 0) {
                console.warn("No eligible invoices found with required status");
                return;
            }

            const groupedInvoices = selectedInvoices.reduce((acc, invoice) => {
                const groupKey = invoice.inv_request_id;
                if (!acc[groupKey]) {
                    acc[groupKey] = [];
                }
                acc[groupKey].push(invoice);
                return acc;
            }, {} as Record<string, any[]>);

            for (const invRequestId of Object.keys(groupedInvoices)) {
                const invoicesGroup = groupedInvoices[invRequestId];
                const mainInvoice = invoicesGroup[0];

                await this.transaction.createEntityP("d_email_helper_entity", {
                    s_object_type: -1,
                    invoice_number: mainInvoice.inv_request_id,
                    email_type: 'Invoice Mail',
                    milestone_number: mainInvoice.milestone_number,
                });
            }
        } catch (error) {
            console.error("Error while sending invoice mails:", error);
            sap.m.MessageBox.error(error.message || "An error occurred while sending invoices");
        } finally {
            busyDialog.close();
            await this.tm.commitP();
            // await this.tm.getTN("query_invoice_search").getData().refreshP();
        }
    }

    public async onSendPaymentReminderEmails() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Sending invoice reminder mails, please wait..."
        });

        try {
            const listData = await this.transaction.getExecutedQuery("q_invoice_request_hdr_table", {
                login_role: this.role,
                loadAll: true,
                skipMap: true
            });
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                console.warn("No invoices selected for mailing");
                return;
            }

            busyDialog.open();

            const selectedInvoices = selectedIndices.map(index => listData[index]);

            const groupedInvoices = selectedInvoices.reduce((acc, invoice) => {
                const groupKey = invoice.inv_request_id;
                if (!acc[groupKey]) {
                    acc[groupKey] = [];
                }
                acc[groupKey].push(invoice);
                return acc;
            }, {} as Record<string, any[]>);

            for (const invRequestId of Object.keys(groupedInvoices)) {
                const invoicesGroup = groupedInvoices[invRequestId];
                const mainInvoice = invoicesGroup[0];

                await this.transaction.createEntityP("d_email_helper_entity", {
                    s_object_type: -1,
                    invoice_number: mainInvoice.inv_request_id,
                    email_type: 'Reminder Mail'
                });
            }
        } catch (error) {
            console.error("Error while sending invoice mails:", error);
            sap.m.MessageBox.error(error.message || "An error occurred while sending invoices");
        } finally {
            busyDialog.close();
            await this.tm.commitP();
            await this.tm.getTN("query_invoice_search").getData().refreshP();
        }
    }

    // Code for generating data in the invoice list table

    public async onGeneratingDataInInvoiceList() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, sending data to Invoice List..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_screen_list").getData();

            await listData.getQuery().refreshP();
            const q = listData.getQuery()
            q.setLoadAll(true)
            await q.refreshP()
            const selectedIndices = await this.tm.getTN("invoice_screen_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                return Promise.resolve();
            }

            // Filter: exclude "Pending"
            const filteredIndices = selectedIndices.filter(index =>
                listData[index].status !== "Pending"
            );

            if (filteredIndices.length === 0) {
                busyDialog.close();
                return Promise.resolve();
            }

            // Group by inv_request_id
            const groupedByRequestId = {};
            for (const index of filteredIndices) {
                const invRequestId = listData[index].inv_request_id;
                if (!groupedByRequestId[invRequestId]) {
                    groupedByRequestId[invRequestId] = [];
                }
                groupedByRequestId[invRequestId].push(index);

                // Mark as created + clear pending_with
                listData[index].created_in_list = "Created";
                listData[index].currently_pending_with = null;
            }

            const requestIds = Object.keys(groupedByRequestId);
            let processedCount = 0;

            for (const requestId of requestIds) {
                processedCount++;
                busyDialog.setText(`Processing record ${processedCount} of ${requestIds.length}...`);

                // Check if header already exists for this inv_request_id
                const existingHeader = await this.transaction.getExecutedQuery("d_invoice_list_hdr_table", {
                    inv_request_id: requestId,
                    loadAll: true,
                    skipMap: true
                });

                if (existingHeader?.length > 0) {
                    console.log(`Skipping request ID ${requestId} - already exists.`);
                    continue; // skip to next
                }

                const indicesInGroup = groupedByRequestId[requestId];
                const invoices = indicesInGroup.map(index => listData[index]);
                const firstInvoice = invoices[0];

                const sumFloatField = (field) => invoices.reduce(
                    (acc, inv) => acc + (parseFloat(inv[field]) || 0), 0
                );

                const totalCGST = sumFloatField("cgst");
                const totalSGST = sumFloatField("sgst");
                const totalIGST = sumFloatField("igst");
                const totalTax = sumFloatField("total_tax");
                const totalInvoice = sumFloatField("total_invoice");

                try {
                    busyDialog.setText(`Sending data to Invoice List for request ID ${requestId}...`);

                    await this.transaction.createEntityP("d_invoice_list_hdr_table", {
                        s_object_type: -1,
                        company_code: firstInvoice.company_code,
                        business_area: firstInvoice.business_area,
                        inv_request_id: firstInvoice.inv_request_id,
                        status: firstInvoice.status,
                        currency: firstInvoice.reg_currency,
                        client_name: firstInvoice.reg_client_name,
                        cgst: totalCGST,
                        sgst: totalSGST,
                        igst: totalIGST,
                        total_tax: totalTax,
                        total_invoice: totalInvoice,
                        irn: firstInvoice.irn,
                        cancelled_irn_date_time: firstInvoice.cancelled_irn_date_time,
                        invoice_pdf: firstInvoice.invoice_pdf,
                        signed_invoicess: firstInvoice.signed_invoices,
                        signed_invoice_pdf: firstInvoice.signed_invoice_pdf,
                        signed_qr_codees: firstInvoice.signed_qr_codee,
                        act_number: firstInvoice.act_number,
                        act_date: firstInvoice.act_date,
                        invoice_date: firstInvoice.invoice_date
                    });

                    busyDialog.setText(`Data sent to Invoice List for ${requestId}`);
                } catch (error) {
                    console.error(`Failed to send data to Invoice List for inv_request_id ${requestId}: ${error.message || "Unknown error"}`);
                }
            }

            busyDialog.setText("Saving changes...");
            await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
        } catch (error) {
            console.error("Error while sending data to Invoice List:", error);
        } finally {
            busyDialog.close();
            await this.tm.getTN("query_invoice_search").getData().refreshP();
            return Promise.resolve();
        }
    }

    public async openDivideListDialog() {

        await this.openDialog("pa_divide_list_dig");
    }

    public async fillingAmount(oEvent) {
        const path = this.getPathFromEvent(oEvent);
        const index = parseInt(path.replace("/divide_lists/", ""));

        const divideListData = this.tm.getTN("divide_lists").getData();
        if (!divideListData[index]) return;

        const { quantity, rate } = divideListData[index];
        divideListData[index].amount = (quantity || 0) * (rate || 0);

        await divideListData[index].r_list_header.fetch();

        const header = divideListData[index].r_list_header[0];

        if (parseFloat(header.igst) > 0) {
            divideListData[index].igst = divideListData[index].amount * 0.18;
        }

        if (parseFloat(header.sgst) > 0 && parseFloat(header.cgst) > 0) {
            divideListData[index].sgst = divideListData[index].amount * 0.09;
            divideListData[index].cgst = divideListData[index].amount * 0.09;
        }
    }


}
