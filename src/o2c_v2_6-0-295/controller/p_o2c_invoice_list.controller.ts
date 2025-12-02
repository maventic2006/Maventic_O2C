import { KloController } from 'kloTouch/jspublic/KloController'
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_invoice_list")
export default class p_o2c_invoice_list extends KloController {
    public async onPageEnter() {
        this.tm.getTN("credit_note_other").setData({});
    }

    public async onIndividualInvoicesOpen(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/invoice_list_hdr_table_list/", ''))
        await this.tm.getTN("invoice_list_hdr_table_list").setActive(index);
        await this.openDialog("pa_indv_inv_list");
    }

    private async resetList() {
        await this.tm.getTN("invoice_list_hdr_table_list").resetP();
    }

    public async zohoInvoiceGeneration() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, generating Zoho invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                return;
            }

            const validStatuses = ["Approved", "Error in Zoho Invoice Generation"];
            const filteredIndices = selectedIndices.filter(index =>
                validStatuses.includes(listData[index].status)
            );

            if (filteredIndices.length === 0) {
                busyDialog.close();
                return;
            }

            const zohoCredentials = await this.transaction.getExecutedQuery("d_o2c_invoice_zoho_config", { loadAll: true });
            const {
                zoho_grant_type,
                zoho_redirect_uri,
                zoho_client_secrets: zoho_client_secret,
                zoho_client_ids: zoho_client_id,
                zoho_r_token: zoho_refresh_token,
                zoho_organization_id: organizationId
            } = zohoCredentials[0];

            let processedCount = 0;

            for (const index of filteredIndices) {
                processedCount++;
                const selectedInvoice = listData[index];
                const requestId = selectedInvoice.inv_request_id;

                busyDialog.setText(`Processing invoice ${processedCount} of ${filteredIndices.length}...`);

                const invoiceGroup = selectedInvoice.r_invoice_list_request;
                if (!invoiceGroup || invoiceGroup.length === 0) continue;

                const zohoExternalID = await this.transaction.getExecutedQuery("d_o2c_customers", {
                    customer_id: selectedInvoice.client_name,
                    loadAll: true
                });

                if (!zohoExternalID || !zohoExternalID[0]?.external_customer_id) continue;

                const invoice_number = selectedInvoice.inv_request_id;
                const lineItems = [];

                for (const invoice of invoiceGroup) {
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
                                invoice_number: invoice_number
                            },
                            method: "POST"
                        }
                    );

                    if (response.status === "Failed") {
                        for (const inv of invoiceGroup) {
                            inv.status = "Error in Zoho Invoice Generation";
                            inv.remark = response.message;
                        }
                        selectedInvoice.status = "Error in Zoho Invoice Generation";
                        continue;
                    }

                    busyDialog.setText(`Updating invoice records for ${requestId}...`);

                    for (const inv of invoiceGroup) {
                        inv.status = "Zoho Invoice Created";
                        inv.zoho_invoice_id = response.invoice.invoice_id;
                        inv.remark = null;

                        if (inv.r_invoice_milestone?.length === 1) {
                            inv.r_invoice_milestone[0].invoice_no = invoice_number;
                            inv.r_invoice_milestone[0].status = "Invoiced";
                            inv.r_invoice_milestone[0].invoice_date = new Date();
                        }

                        if (inv.r_invoice_schedule?.length === 1) {
                            inv.r_invoice_schedule[0].invoice_no = invoice_number;
                            inv.r_invoice_schedule[0].status = "Invoiced";
                            inv.r_invoice_schedule[0].invoice_date = new Date();
                        }

                        if (inv.r_invoice_volume?.length === 1) {
                            inv.r_invoice_volume[0].invoice_no = invoice_number;
                            inv.r_invoice_volume[0].invoice_status = "Invoiced";
                            inv.r_invoice_volume[0].invoice_date = new Date();
                        }
                    }

                    selectedInvoice.status = "Zoho Invoice Created";
                } catch { }
            }

            busyDialog.setText("Saving changes...");
            await this.resetList();
            await this.tm.commitP();
            busyDialog.close();
            return;

        } catch {
            busyDialog.close();
            return;
        }
    }

    public async onDoingEInvoicing() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, processing e-invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices.length) {
                busyDialog.close();
                sap.m.MessageToast.show("Please select at least one invoice");
                return;
            }

            const selectedInvoices = selectedIndices
                .map(index => listData[index])
                .filter(invoice =>
                    invoice.status === "Zoho Invoice Created" ||
                    invoice.status === "Error in E-Invoicing"
                );

            if (!selectedInvoices.length) {
                busyDialog.close();
                sap.m.MessageToast.show("No eligible invoices to process for E-Invoicing");
                return;
            }

            // master data
            const [
                businessAreaDetails,
                sellerCompanyDetails,
                gstTaxMaster,
                gstUomMapping
            ] = await Promise.all([
                this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true }),
                this.transaction.getExecutedQuery('d_o2c_invoice_irn_table', { loadAll: true }),
                this.transaction.getExecutedQuery('d_o2c_ind_gst_tax_master', { loadAll: true }),
                this.transaction.getExecutedQuery('d_ind_gst_uom_mapping', { loadAll: true })
            ]);

            const businessAreaMap = Object.fromEntries(businessAreaDetails.map(e => [e.business_area, e]));
            const sellerCompanyMap = Object.fromEntries(sellerCompanyDetails.map(e => [e.business_area, e]));
            const gstTaxMasterMap = Object.fromEntries(gstTaxMaster.map(e => [e.billing_type, e]));
            const gstUomMap = Object.fromEntries(gstUomMapping.map(e => [e.system_unit, e]));

            let processedCount = 0;

            for (const invoice of selectedInvoices) {
                try {
                    processedCount++;

                    // fetch related list of invoices
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request || [];

                    const firstGroupInvoice = invoicesInGroup[0];
                    const businessArea = firstGroupInvoice.business_area;

                    // seller details
                    const sellerDetails = sellerCompanyMap[businessArea];
                    const {
                        user_id,
                        gstin_password,
                        gst_number,
                        location,
                        e_invoice_client_id,
                        e_invoice_client_secret,
                        company_name,
                        pincode,
                        state_code,
                        comp_addr
                    } = sellerDetails;

                    //-----------------------------------------
                    //  CUSTOMER ADDRESS EXTRACTION
                    //-----------------------------------------
                    let customerAddress = "";
                    let customerLocation = "";
                    let customerPincode = 0;
                    let billToAddressId = "";

                    const relations = [
                        { key: "r_invoice_milestone", itemKey: "r_milestone_item" },
                        { key: "r_invoice_schedule", itemKey: "r_schedule_item" },
                        { key: "r_invoice_volume", itemKey: "r_volume_item" }
                    ];

                    for (const rel of relations) {
                        await firstGroupInvoice[rel.key]?.fetch();
                        const relData = firstGroupInvoice[rel.key]?.[0];
                        if (!relData) continue;

                        await relData[rel.itemKey]?.fetch();
                        const itemData = relData[rel.itemKey]?.[0];
                        if (!itemData) continue;

                        await itemData.r_item_header?.fetch();
                        const header = itemData.r_item_header?.[0];
                        if (!header) continue;

                        await header.r_so_header_address?.fetch();
                        const addr = header.r_so_header_address?.[0];
                        if (!addr) continue;

                        customerAddress = `${addr.address_1 || ""} ${addr.address_2 || ""}`.trim();
                        customerLocation = addr.city || "";
                        customerPincode = parseInt(addr.pincode) || 0;
                        billToAddressId = header.bill_to_address || "";
                        break;
                    }

                    const customerMap = await this.transaction.getExecutedQuery("d_o2c_customers_map", {
                        loadAll: true,
                        address_map_id: billToAddressId
                    });

                    const customerGst = customerMap[0]?.gstin_vat || "";
                    const customerState = customerGst.substring(0, 2);
                    const customerName = invoice.client_name_vh?.additional_desc || "Unknown Customer";
                    const taxpayerType = customerMap[0]?.taxpayer_type;

                    //---------------------------------------------
                    //  ITEM LIST IMPLEMENTATION USING r_invoice_list
                    //---------------------------------------------
                    const itemList = [];
                    let totalAssAmount = 0;
                    let totalIgstAmount = 0;
                    let totalCgstAmount = 0;
                    let totalSgstAmount = 0;
                    let totalValueWithTax = 0;
                    let slNo = 1;

                    for (const inv of invoicesInGroup) {

                        // fetch invoice list rows
                        const invoiceList = inv.r_invoice_list?.fetch
                            ? await inv.r_invoice_list.fetch()
                            : [];

                        const taxMasterInfo = gstTaxMasterMap[inv.reg_billing_type] || {};
                        const uomInfo = gstUomMap[inv.unit] || { uom_unit: inv.unit || "" };

                        // -------------------------
                        // CASE 1: invoice has list rows
                        // -------------------------
                        if (invoiceList && invoiceList.length > 0) {

                            for (const row of invoiceList) {
                                const qty = parseFloat(row.quantity || 1);
                                const unitPrice = parseFloat(row.rate || 0);
                                const totAmt = +(unitPrice * qty).toFixed(2);

                                const igst = +(row.igst || 0);
                                const cgst = +(row.cgst || 0);
                                const sgst = +(row.sgst || 0);
                                const totWithTax = totAmt + igst + cgst + sgst;

                                itemList.push({
                                    SlNo: slNo.toString(),
                                    IsServc: taxMasterInfo.is_service,
                                    HsnCd: row.sac_code,
                                    Qty: qty,
                                    Unit: uomInfo.uom_unit,
                                    UnitPrice: unitPrice,
                                    TotAmt: totAmt,
                                    Discount: 0,
                                    AssAmt: totAmt,
                                    GstRt: taxMasterInfo.tax_percentage || 0,
                                    IGSTAmt: igst,
                                    cgstAmt: cgst,
                                    sgstAmt: sgst,
                                    TotItemVal: totWithTax
                                });

                                totalAssAmount += totAmt;
                                totalIgstAmount += igst;
                                totalCgstAmount += cgst;
                                totalSgstAmount += sgst;
                                totalValueWithTax += totWithTax;

                                slNo++;
                            }
                        }

                        // -----------------------------
                        // CASE 2: fallback – no list rows
                        // -----------------------------
                        else {
                            const qty = 1;
                            const unitPrice = +(inv.reg_milestone_amount || 0);
                            const totAmt = +(unitPrice * qty).toFixed(2);

                            const igst = +(inv.igst || 0);
                            const cgst = +(inv.cgst || 0);
                            const sgst = +(inv.sgst || 0);
                            const totWithTax = totAmt + igst + cgst + sgst;

                            itemList.push({
                                SlNo: slNo.toString(),
                                IsServc: taxMasterInfo.is_service,
                                HsnCd: taxMasterInfo.hsc_sac_code,
                                Qty: qty,
                                Unit: uomInfo.uom_unit,
                                UnitPrice: unitPrice,
                                TotAmt: totAmt,
                                Discount: 0,
                                AssAmt: totAmt,
                                GstRt: taxMasterInfo.tax_percentage || 0,
                                IGSTAmt: igst,
                                cgstAmt: cgst,
                                sgstAmt: sgst,
                                TotItemVal: totWithTax
                            });

                            totalAssAmount += totAmt;
                            totalIgstAmount += igst;
                            totalCgstAmount += cgst;
                            totalSgstAmount += sgst;
                            totalValueWithTax += totWithTax;

                            slNo++;
                        }
                    }

                    //---------------------------------------------
                    //  API CALL + DATABASE UPDATE
                    //---------------------------------------------

                    const now = new Date();
                    const formattedDate =
                        `${now.getDate().toString().padStart(2, "0")}/` +
                        `${(now.getMonth() + 1).toString().padStart(2, "0")}/` +
                        now.getFullYear();

                    const requestBody = {
                        Version: "1.1",
                        TranDtls: {
                            TaxSch: businessAreaMap[businessArea].tax_rule === "gst" ? "GST" : null,
                            SupTyp: taxpayerType === "SEZ Unit/Developer"
                                ? "SEZWOP"
                                : (firstGroupInvoice.invoice_origin_country === "IND" ? "B2B" : "EXPWOP")
                        },
                        DocDtls: {
                            Typ: "INV",
                            No: firstGroupInvoice.inv_request_id,
                            dt: formattedDate
                        },
                        SellerDtls: {
                            Gstin: gst_number,
                            LglNm: company_name,
                            Addr1: comp_addr,
                            Loc: location,
                            Pin: pincode,
                            Stcd: state_code
                        },
                        BuyerDtls: {
                            Gstin: firstGroupInvoice.invoice_origin_country === "IND" ? customerGst : "URP",
                            LglNm: customerName,
                            Pos: firstGroupInvoice.invoice_origin_country === "IND" ? customerState : "96",
                            Addr1: customerAddress,
                            Loc: customerLocation,
                            Pin: firstGroupInvoice.invoice_origin_country === "IND" ? customerPincode : 999999,
                            Stcd: firstGroupInvoice.invoice_origin_country === "IND" ? customerState : "96"
                        },
                        ...(firstGroupInvoice.invoice_origin_country !== "IND" && {
                            expDtls: {
                                forCur: firstGroupInvoice.reg_currency || "INR",
                                cntCode: "NP"
                            }
                        }),
                        ItemList: itemList,
                        ValDtls: {
                            AssVal: totalAssAmount,
                            IGSTVal: totalIgstAmount,
                            cgstVal: totalCgstAmount,
                            sgstVal: totalSgstAmount,
                            TotInvVal: totalValueWithTax
                        }
                    };

                    // call IRN API
                    busyDialog.setText(`Processing invoice ${firstGroupInvoice.inv_request_id}...`);

                    const response = await KloAjax.getInstance().perFormAction(
                        AUTHORIZATION_TYPE.RUNTIME,
                        {
                            url: System.gi_URI().getAppServiceUrl(
                                this.getFlavor(),
                                this.getFlavorVersion(),
                                "getIRNNumbers",
                                true
                            ),
                            method: "POST",
                            data: {
                                appId: e_invoice_client_id,
                                appSecret: e_invoice_client_secret,
                                gstNumber: gst_number,
                                user_name: user_id,
                                password: gstin_password,
                                requestBody
                            }
                        }
                    );

                    if (!response?.success) {
                        for (const inv of invoicesInGroup) {
                            inv.status = "Error in E-Invoicing";
                            inv.remark = response.message;
                        }
                        continue;
                    }

                    // SUCCESS
                    const {
                        AckDt,
                        AckNo,
                        Irn,
                        SignedInvoice,
                        SignedQRCode
                    } = response.result;

                    for (const inv of invoicesInGroup) {
                        inv.status = "E Invoicing Successful";
                        inv.remark = null;
                        inv.act_date = new Date(AckDt.replace(" ", "T"));
                        inv.act_number = AckNo;
                        inv.irn = Irn;
                        inv.signed_invoices = SignedInvoice;
                        inv.signed_qr_codee = SignedQRCode;
                    }

                    invoice.status = "E Invoicing Successful";
                    invoice.remark = null;

                } catch (err) {
                    console.error("Group error:", err);

                    await invoice.r_invoice_list_request?.fetch();
                    for (const inv of invoice.r_invoice_list_request || []) {
                        inv.status = "Error in E-Invoicing";
                        inv.remark = err.message;
                    }
                    continue;
                }
            }

            await this.resetList();
            await this.tm.commitP();
            this.setMode("DISPLAY");
            sap.m.MessageToast.show("E-invoicing process completed");

        } catch (err) {
            console.error("Error in e-invoicing:", err);
            sap.m.MessageBox.error(err.message || "An error occurred");
        } finally {
            busyDialog.close();
        }
    }

    public async getIRNDetails() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, processing e-invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                busyDialog.close();
                sap.m.MessageToast.show("Please select at least one invoice");
                return;
            }

            const selectedInvoices = selectedIndices.map(index => listData[index]);

            // Load master/reference data
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

            const businessAreaMap = businessAreaDetails.reduce((map, item) => { map[item.business_area] = item; return map; }, {});
            const sellerCompanyMap = sellerCompanyDetails.reduce((map, item) => { map[item.business_area] = item; return map; }, {});
            const gstTaxMasterMap = gstTaxMaster.reduce((map, item) => { map[item.billing_type] = item; return map; }, {});
            const gstUomMap = gstUomMapping.reduce((map, item) => { map[item.system_unit] = item; return map; }, {});

            for (const invoice of selectedInvoices) {
                try {
                    // Ensure we have the related group
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request || [];
                    if (!invoicesInGroup || invoicesInGroup.length === 0) {
                        // nothing to do for this header
                        continue;
                    }

                    const firstGroupInvoice = invoicesInGroup[0];
                    const businessArea = firstGroupInvoice.business_area;

                    const sellerDetails = sellerCompanyMap[businessArea];
                    if (!sellerDetails) {
                        throw new Error(`Seller details not found for business area ${businessArea}`);
                    }

                    // destructure seller details
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

                    // Extract customer address (walk relations)
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
                        await firstGroupInvoice[relation.key]?.fetch();
                        const relationData = firstGroupInvoice[relation.key]?.[0];
                        if (!relationData) continue;

                        await relationData[relation.itemKey]?.fetch();
                        const itemData = relationData[relation.itemKey]?.[0];
                        if (!itemData) continue;

                        await itemData.r_item_header?.fetch();
                        const headerData = itemData.r_item_header?.[0];
                        if (!headerData) continue;

                        await headerData.r_so_header_address?.fetch();
                        const addressData = headerData.r_so_header_address?.[0];
                        if (!addressData) continue;

                        customerAddress = `${addressData.address_1 || ""} ${addressData.address_2 || ""}`.trim();
                        customerLocation = addressData.city || "";
                        customerPincode = parseInt(addressData.pincode) || 0;
                        billToAddressId = headerData.bill_to_address || "";
                        break;
                    }

                    // Get mapped customer address / GST info
                    const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
                        loadAll: true,
                        address_map_id: billToAddressId
                    });

                    if (!customerAddressData || customerAddressData.length === 0) {
                        throw new Error("Customer address data not found");
                    }

                    const customerGstNumber = customerAddressData[0]?.gstin_vat || "";
                    const customerStateCode = (customerGstNumber || "").substring(0, 2);
                    const customerName = firstGroupInvoice.client_name_vh?.additional_desc || "Unknown Customer";
                    const taxpayer_type = customerAddressData[0]?.taxpayer_type || "";

                    // Build item list using r_invoice_list if present; fallback to header
                    const itemList = [];
                    let totalAssAmount = 0;
                    let totalIgstAmount = 0;
                    let totalCgstAmount = 0;
                    let totalSgstAmount = 0;
                    let totalValueWithTax = 0;
                    let slNo = 1;

                    for (const inv of invoicesInGroup) {
                        // fetch the invoice-level child list rows if fetch() exists
                        const invoiceList = inv.r_invoice_list?.fetch ? await inv.r_invoice_list.fetch() : [];

                        // pull tax master and uom info (use invoice's billing type / unit)
                        const taxMasterInfo = gstTaxMasterMap[inv.reg_billing_type] || {};
                        const uomInfo = gstUomMap[inv.unit] || { uom_unit: inv.unit || "" };

                        if (invoiceList && invoiceList.length > 0) {
                            // Use each child row as an item
                            for (const row of invoiceList) {
                                const qty = parseFloat(row.quantity || 1);
                                const unitPrice = parseFloat(row.rate || 0);
                                const totAmt = parseFloat((unitPrice * qty).toFixed(2));

                                const invoiceIgst = parseFloat(row.igst || 0) || 0;
                                const invoiceCgst = parseFloat(row.cgst || 0) || 0;
                                const invoiceSgst = parseFloat(row.sgst || 0) || 0;
                                const invoiceTotalWithTax = +(totAmt + invoiceIgst + invoiceCgst + invoiceSgst).toFixed(2);

                                itemList.push({
                                    "SlNo": slNo.toString(),
                                    "IsServc": taxMasterInfo.is_service,
                                    "HsnCd": row.sac_code,
                                    "Qty": qty,
                                    "Unit": uomInfo.uom_unit,
                                    "UnitPrice": unitPrice,
                                    "TotAmt": totAmt,
                                    "Discount": 0,
                                    "AssAmt": totAmt,
                                    "GstRt": taxMasterInfo.tax_percentage || 0,
                                    "IGSTAmt": invoiceIgst,
                                    "cgstAmt": invoiceCgst,
                                    "sgstAmt": invoiceSgst,
                                    "TotItemVal": invoiceTotalWithTax
                                });

                                totalAssAmount = parseFloat((totalAssAmount + totAmt).toFixed(2));
                                totalIgstAmount = parseFloat((totalIgstAmount + invoiceIgst).toFixed(2));
                                totalCgstAmount = parseFloat((totalCgstAmount + invoiceCgst).toFixed(2));
                                totalSgstAmount = parseFloat((totalSgstAmount + invoiceSgst).toFixed(2));
                                totalValueWithTax = parseFloat((totalValueWithTax + invoiceTotalWithTax).toFixed(2));

                                slNo++;
                            }
                        } else {
                            // Fallback: use invoice header fields
                            const qty = 1;
                            const unitPrice = parseFloat(inv.reg_milestone_amount || 0);
                            const totAmt = parseFloat((unitPrice * qty).toFixed(2));
                            const headerIgst = parseFloat(inv.igst || 0) || 0;
                            const headerCgst = parseFloat(inv.cgst || 0) || 0;
                            const headerSgst = parseFloat(inv.sgst || 0) || 0;
                            const itemTotalWithTax = +(totAmt + headerIgst + headerCgst + headerSgst).toFixed(2);

                            itemList.push({
                                "SlNo": slNo.toString(),
                                "IsServc": taxMasterInfo.is_service,
                                "HsnCd": taxMasterInfo.hsc_sac_code,
                                "Qty": qty,
                                "Unit": uomInfo.uom_unit,
                                "UnitPrice": unitPrice,
                                "TotAmt": totAmt,
                                "Discount": 0,
                                "AssAmt": totAmt,
                                "GstRt": taxMasterInfo.tax_percentage || 0,
                                "IGSTAmt": headerIgst,
                                "cgstAmt": headerCgst,
                                "sgstAmt": headerSgst,
                                "TotItemVal": itemTotalWithTax
                            });

                            totalAssAmount = parseFloat((totalAssAmount + totAmt).toFixed(2));
                            totalIgstAmount = parseFloat((totalIgstAmount + headerIgst).toFixed(2));
                            totalCgstAmount = parseFloat((totalCgstAmount + headerCgst).toFixed(2));
                            totalSgstAmount = parseFloat((totalSgstAmount + headerSgst).toFixed(2));
                            totalValueWithTax = parseFloat((totalValueWithTax + itemTotalWithTax).toFixed(2));

                            slNo++;
                        }
                    }

                    // Compose IRN request body
                    const now = new Date();
                    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

                    const requestBody = {
                        "Version": "1.1",
                        "TranDtls": {
                            "TaxSch": businessAreaMap[firstGroupInvoice.business_area] && businessAreaMap[firstGroupInvoice.business_area].tax_rule === 'gst' ? "GST" : null,
                            "SupTyp": taxpayer_type === 'SEZ Unit/Developer' ? "SEZWOP" :
                                (firstGroupInvoice.invoice_origin_country === 'IND' ? "B2B" : "EXPWOP")
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
                                "forCur": invoice.currency,
                                "cntCode": "NP"
                            }
                        })
                    };

                    busyDialog.setText(`Processing invoice ${firstGroupInvoice.inv_request_id}...`);

                    // 1) Call getIRNNumbers to generate IRN
                    const irnGenerateResponse = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
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

                    if (!irnGenerateResponse || irnGenerateResponse.success === false) {
                        const msg = (irnGenerateResponse && irnGenerateResponse.message) ? irnGenerateResponse.message : "E-Invoicing IRN generation failed";
                        for (const inv of invoicesInGroup) {
                            inv.status = 'Error in E-Invoicing';
                            inv.remark = inv.remark ? inv.remark + ', ' + msg : msg;
                        }
                        // continue to next invoice header
                        continue;
                    }

                    // Sometimes getIRNNumbers returns an array with result in [0].Desc.Irn - handle both patterns
                    let generatedIrn = null;
                    try {
                        if (irnGenerateResponse.result && irnGenerateResponse.result.Irn) {
                            generatedIrn = irnGenerateResponse.result.Irn;
                        } else if (Array.isArray(irnGenerateResponse.result) && irnGenerateResponse.result[0]?.Desc?.Irn) {
                            generatedIrn = irnGenerateResponse.result[0].Desc.Irn;
                        }
                    } catch (e) {
                        generatedIrn = null;
                    }

                    if (!generatedIrn) {
                        // if IRN not present, mark error
                        for (const inv of invoicesInGroup) {
                            inv.status = 'Error in E-Invoicing';
                            inv.remark = 'IRN generation returned no IRN';
                        }
                        continue;
                    }

                    // 2) Call getIRNFetching to fetch details (Ack, SignedInvoice, QR)
                    busyDialog.setText(`Fetching IRN details for ${firstGroupInvoice.inv_request_id}...`);

                    let irnFetchResponse = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                        url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getIRNFetching", true),
                        data: {
                            appId: seller_client_id,
                            appSecret: seller_client_secret,
                            gstNumber: seller_gst_number,
                            user_name: seller_user_name,
                            password: seller_password,
                            irn: generatedIrn
                        },
                        method: "POST"
                    });

                    // if response is stringified JSON, try parse
                    if (typeof irnFetchResponse === 'string') {
                        try {
                            irnFetchResponse = JSON.parse(irnFetchResponse);
                        } catch (e) {
                            // keep as-is if parsing fails
                        }
                    }

                    const fetchResult = irnFetchResponse?.result || irnFetchResponse;
                    const ackDate = fetchResult?.AckDt || fetchResult?.AckDate || null;
                    const ackNo = fetchResult?.AckNo || null;
                    const irn = fetchResult?.Irn || generatedIrn;
                    const signedInvoice = fetchResult?.SignedInvoice || null;
                    const signedQRCode = fetchResult?.SignedQRCode || null;

                    if (!ackDate || !ackNo || !irn || !signedInvoice || !signedQRCode) {
                        // if incomplete, mark error but still write some info
                        for (const inv of invoicesInGroup) {
                            inv.status = 'Error in E-Invoicing';
                            inv.remark = 'Incomplete IRN fetch response';
                        }
                        continue;
                    }

                    // Update each invoice in the group with IRN details
                    for (const inv of invoicesInGroup) {
                        inv.status = "E Invoicing Successful";
                        inv.remark = null;
                        // convert AckDt to Date: AckDt sometimes 'yyyy-mm-dd hh:mm:ss' or 'dd/mm/yyyy hh:mm:ss' - try replace space to T
                        try {
                            inv.act_date = new Date(ackDate.replace(" ", "T"));
                        } catch (e) {
                            inv.act_date = new Date();
                        }
                        inv.act_number = ackNo;
                        inv.irn = irn;
                        inv.signed_invoices = signedInvoice;
                        inv.signed_qr_codee = signedQRCode;
                    }

                    // Also update header invoice object
                    invoice.status = "E Invoicing Successful";
                    invoice.remark = null;
                    invoice.act_date = new Date(ackDate.replace(" ", "T"));
                    invoice.act_number = ackNo;
                    invoice.irn = irn;
                    invoice.signed_invoicess = signedInvoice;
                    invoice.signed_qr_codees = signedQRCode;

                } catch (error) {
                    // Ensure group rows exist and mark them as failed
                    try { await invoice.r_invoice_list_request?.fetch(); } catch (e) { /* ignore */ }
                    for (const inv of invoice.r_invoice_list_request || []) {
                        inv.status = 'Error in E-Invoicing';
                        inv.remark = error.message || String(error);
                    }
                    invoice.status = 'Error in E-Invoicing';
                    invoice.remark = error.message || String(error);
                    console.error(`Error processing invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            busyDialog.close();
            sap.m.MessageToast.show("E-invoicing process completed");
        } catch (error) {
            console.error("Error in e-invoicing process:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during e-invoicing");
        } finally {
            busyDialog.close();
        }
    }

    public async onCancelInvoice() {
        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices.length) {
                sap.m.MessageBox.error("Please select at least one invoice", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            for (const index of selectedIndices) {
                const status = listData[index].status;
                if (status === "Cancelled") {
                    sap.m.MessageBox.error("One or more selected invoices are already cancelled.", {
                        title: "Error",
                        actions: [sap.m.MessageBox.Action.OK],
                    });
                    return;
                }
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedInvoices = selectedIndices.map(i => listData[i]);

            for (const invoice of selectedInvoices) {
                try {
                    // Fetch group invoices
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    const firstGroupInvoice = invoicesInGroup[0];

                    // ---------------- IRN DATE VALIDATION ----------------
                    if (firstGroupInvoice.irn && firstGroupInvoice.act_date) {
                        const actDate = new Date(firstGroupInvoice.act_date);
                        actDate.setHours(0, 0, 0, 0);

                        const diffInDays = Math.floor((today.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (diffInDays > 2) {
                            sap.m.MessageBox.error(
                                "This invoice IRN is old, please raise a Credit Note for this invoice",
                                { title: "IRN Cancellation Not Allowed" }
                            );
                            continue;
                        }
                    }

                    // ---------------- FETCH IRN CONFIG ----------------
                    const irnNumberDetails = await this.transaction.getExecutedQuery(
                        'd_o2c_invoice_irn_table',
                        {
                            company_code: firstGroupInvoice.company_code,
                            business_area: firstGroupInvoice.business_area,
                            loadAll: true
                        }
                    );

                    if (!irnNumberDetails.length) continue;

                    const {
                        user_id,
                        gstin_password,
                        gst_number,
                        e_invoice_client_id,
                        e_invoice_client_secret
                    } = irnNumberDetails[0];

                    // ---------------- CALL IRN CANCEL API ----------------
                    const response = await KloAjax.getInstance().perFormAction(
                        AUTHORIZATION_TYPE.RUNTIME,
                        {
                            url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getInvoiceCancellation", true),
                            data: {
                                appId: e_invoice_client_id,
                                appSecret: e_invoice_client_secret,
                                gstNumber: gst_number,
                                user_name: user_id,
                                password: gstin_password,
                                irn: firstGroupInvoice.irn
                            },
                            method: "POST"
                        }
                    );

                    const parsedResponse = JSON.parse(response);

                    // ---------------- ERROR RESPONSE ----------------
                    if (!parsedResponse.success) {
                        await invoice.r_invoice_list_request?.fetch();

                        for (const inv of invoicesInGroup) {

                            // ---- FETCH & UPDATE r_invoice_list ----
                            await inv.r_invoice_list?.fetch();

                            if (inv.r_invoice_list?.length > 0) {
                                for (const row of inv.r_invoice_list) {
                                    row.status = "Error";
                                    row.remark = parsedResponse.message;
                                }
                            }

                            inv.status = inv.status === 'Cancelled' ? 'Cancelled' : 'Error';
                            inv.remark = parsedResponse.message;
                        }

                        invoice.status = "Error";
                        invoice.remark = parsedResponse.message;
                        continue;
                    }

                    // ---------------- SUCCESS: CANCEL INVOICES ----------------
                    for (const inv of invoicesInGroup) {

                        // ---- FETCH & UPDATE r_invoice_list ----
                        await inv.r_invoice_list?.fetch();

                        if (inv.r_invoice_list?.length > 0) {
                            for (const row of inv.r_invoice_list) {
                                row.status = "Cancelled";
                                row.cancelled_date_time = new Date(parsedResponse.result.CancelDate.replace(" ", "T"));
                            }
                        }

                        inv.status = "Cancelled";
                        inv.currently_pending_with = null;
                        inv.cancelled_irn_date_time = new Date(parsedResponse.result.CancelDate.replace(" ", "T"));

                        // ---------- CREATE CANCELLATION LINE ITEM RECORD ----------
                        await this.transaction.createEntityP("d_o2c_invoice_canc_line_item", {
                            profit_center: inv.reg_primary_profit_center,
                            client_name: inv.reg_client_name,
                            project_name: inv.reg_project_name,
                            milestone_name: inv.reg_milestone_name,
                            milestone_date: inv.reg_milestone_date ? new Date(inv.reg_milestone_date) : null,
                            milestone_amount: inv.reg_milestone_amount,
                            currency: inv.reg_currency,
                            rate: inv.reg_rate,
                            quantity: inv.reg_quantity,
                            customer_gstin: inv.reg_customer_gstin,

                            cancelled_irn_date: inv.cancelled_irn_date_time,
                            irn: inv.irn,
                            act_date: inv.act_date ? new Date(inv.act_date) : null,

                            total_invoice: inv.total_invoice,
                            total_tax: inv.total_tax,
                            igst: inv.igst,
                            sgst: inv.sgst,
                            cgst: inv.cgst,

                            milestone_number: inv.milestone_number,
                            so: inv.so,
                            inv_request_id: inv.inv_request_id,
                            business_area: inv.business_area,
                            company_code: inv.company_code,
                            invoice_guid: inv.invoice_guid
                        });


                        // ---- MILESTONE ----
                        await inv.r_invoice_milestone?.fetch();
                        if (inv.r_invoice_milestone?.length === 1) {
                            inv.r_invoice_milestone[0].status = "InvCan";
                        }

                        // ---- SCHEDULE ----
                        await inv.r_invoice_schedule?.fetch();
                        if (inv.r_invoice_schedule?.length === 1) {
                            inv.r_invoice_schedule[0].status = "InvCan";
                        }

                        // ---- VOLUME ----
                        await inv.r_invoice_volume?.fetch();
                        if (inv.r_invoice_volume?.length === 1) {
                            inv.r_invoice_volume[0].invoice_status = "InvCan";
                        }
                    }

                    invoice.status = "Cancelled";
                    invoice.remark = parsedResponse.message;
                    invoice.currently_pending_with = null;
                    invoice.cancelled_irn_date_time = new Date(parsedResponse.result.CancelDate.replace(" ", "T"));

                } catch (error) {

                    // ---------------- FETCH GROUP TO APPLY ERROR FLAG ----------------
                    await invoice.r_invoice_list_request?.fetch();

                    for (const inv of invoice.r_invoice_list_request || []) {

                        await inv.r_invoice_list?.fetch();

                        if (inv.r_invoice_list?.length > 0) {
                            for (const row of inv.r_invoice_list) {
                                row.status = "Error";
                                row.remark = error.message;
                            }
                        }

                        inv.status = inv.status === 'Cancelled' ? 'Cancelled' : 'Error';
                        inv.remark = error.message;
                    }

                    invoice.status = "Error";
                    invoice.remark = error.message;

                    console.error(`Error processing invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("Invoice cancellation process completed");

        } catch (error) {
            console.error("Error in onCancelInvoice:", error);

            sap.m.MessageBox.error(error.message || "An error occurred during invoice cancellation", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
        }
    }

    public async onDoingESigning(oEvent) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Processing e-signing, please wait..."
        });

        try {
            await this.triggerInvoicePdf(oEvent, { fromBrowser: false });

            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                sap.m.MessageBox.error("No invoices selected for e-signing", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            const password = await this.showPasswordDialog();
            if (!password) {
                return;
            }

            busyDialog.open();

            const selectedInvoices = selectedIndices.map(index => listData[index]);
            const validStatuses = ["E Invoicing Successful", "Error in E Signing", "Batch PDF Generated", "PDF Generated"];

            for (const invoice of selectedInvoices) {
                try {
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    const firstGroupInvoice = invoicesInGroup[0];

                    if (!validStatuses.includes(firstGroupInvoice.status)) {
                        console.warn(`Invoice ${firstGroupInvoice.inv_request_id} has invalid status: ${firstGroupInvoice.status}`);
                        continue;
                    }

                    await this.transaction.createEntityP("d_invoice_e_signing_helper", {
                        s_object_type: -1,
                        password: password,
                        invoice_pdf: firstGroupInvoice.invoice_pdf,
                        invoice_number: firstGroupInvoice.inv_request_id,
                    });

                    for (const inv of invoicesInGroup) {
                        inv.status = "E Signing Successful";
                        inv.remark = null;
                    }
                    invoice.status = "E Signing Successful";
                    invoice.remark = null;
                } catch (error) {
                    await invoice.r_invoice_list_request?.fetch();
                    for (const inv of invoice.r_invoice_list_request || []) {
                        inv.status = "Error in E Signing";
                        inv.remark = error.message;
                    }
                    invoice.status = "Error in E Signing";
                    invoice.remark = error.message;
                    console.error(`Error processing e-signing for invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
            sap.m.MessageToast.show("E-signing process completed");
        } catch (error) {
            console.error("Error during e-signing process:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during the e-signing process", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
        } finally {
            busyDialog.close();
        }
    }

    public async triggerInvoicePdf(oEvent, params) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Generating invoice PDF, please wait..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error("No invoices selected", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            const selectedInvoices = selectedIndices.map(index => listData[index]);

            for (const invoice of selectedInvoices) {
                try {
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    busyDialog.setText(`Generating PDF for invoice group ${invoicesInGroup[0].inv_request_id}...`);
                    await this.processMultipleInvoices(invoice, invoicesInGroup, params.fromBrowser);
                } catch (error) {
                    console.error(`Error generating PDF for invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("Invoice PDF generation completed");
        } catch (error) {
            console.error("Error generating invoice PDF:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during invoice PDF generation", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
        } finally {
            busyDialog.close();
        }
    }

    private async processMultipleInvoices(invoice, selectedInvoices, fromBrowser) {
        const firstInvoice = selectedInvoices[0];
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

        // ===== Fetch Address From Nested Relations =====
        for (const relation of invoiceRelations) {
            await firstInvoice[relation.key]?.fetch();
            const relationData = firstInvoice[relation.key]?.[0];

            await relationData?.[relation.itemKey]?.fetch();
            const itemData = relationData?.[relation.itemKey]?.[0];

            await itemData?.r_item_header?.fetch();
            const headerData = itemData?.r_item_header?.[0];

            await headerData?.r_so_header_address?.fetch();
            const addressData = headerData?.r_so_header_address?.[0];

            if (addressData) {
                customerAddressOne = addressData.address_1 || "";
                customerAddressTwo = addressData.address_2 || "";
                customerState = addressData.state || "";
                customerPincode = parseInt(addressData.pincode) || 0;
                billToAddressId = headerData.bill_to_address || "";
                break;
            }
        }

        // ===== Customer Details =====
        const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
            loadAll: true,
            address_map_id: billToAddressId
        });

        const customerMailId = await this.transaction.getExecutedQuery('d_o2c_customers_contact', {
            loadAll: true,
            k_id: invoice.client_name
        });

        const customerGstNumber = customerAddressData?.[0]?.gstin_vat || "";
        const customerName = invoice?.client_name_vh?.additional_desc || "";

        // ===== Build Items (NOW WITH r_invoice_list SUPPORT) =====
        const items = [];
        let globalIndex = 1;

        let subTotal = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        let totalAmount = 0;

        for (const inv of selectedInvoices) {

            // ---- NEW: Fetch r_invoice_list for each invoice ----
            await inv.r_invoice_list?.fetch();
            const invoiceList = inv.r_invoice_list;

            if (invoiceList && invoiceList.length > 0) {
                // Multi-line invoice
                for (const row of invoiceList) {
                    const qty = row.quantity ? parseFloat(row.quantity) : 1;
                    const rate = row.rate ? parseFloat(row.rate) : 0;
                    const amount = row.amount ? parseFloat(row.amount) : qty * rate;

                    items.push({
                        description: row.inv_primary_desc || inv.reg_milestone_name || "",
                        sac: row.sac_code,
                        quantity: qty,
                        rate: rate,
                        amount: amount,
                        invoiceDescription: row.invoice_sec_desc || inv.trans_invoice_description || "",
                        _source_inv_request_id: inv.inv_request_id,
                        _slno: globalIndex++
                    });

                    subTotal += amount;
                }
            } else {
                // Single line fallback
                const amount = parseFloat(inv.reg_milestone_amount || 0);

                items.push({
                    description: inv.reg_milestone_name,
                    sac: inv.sac_code,
                    quantity: 1,
                    rate: amount,
                    amount: amount,
                    invoiceDescription: inv.trans_invoice_description || "",
                    _source_inv_request_id: inv.inv_request_id,
                    _slno: globalIndex++
                });

                subTotal += amount;
            }

            // ===== TAX TOTALS =====
            cgstAmount += parseFloat(inv.cgst) || 0;
            sgstAmount += parseFloat(inv.sgst) || 0;
            igstAmount += parseFloat(inv.igst) || 0;
            totalAmount += parseFloat(inv.total_invoice) || 0;
        }

        // ===== Prepare Final Batch PDF Data =====
        const batchInvoiceData = {
            invoiceNumber: firstInvoice.inv_request_id,
            date: new Date().toISOString().split("T")[0],
            companyName: customerName,
            streetAddress: `${customerAddressOne || ""} ${customerAddressTwo || ""}`.trim(),
            cityStateZip: `${customerState} ${customerPincode}`.trim(),
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
            isBatchInvoice: true,
            invoiceCount: selectedInvoices.length
        };

        await this.onGenerateInvoicePDF(batchInvoiceData, fromBrowser);
    }

    public async onGenerateInvoicePDF(invoiceData: any, fromBrowser): Promise<void> {
        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                console.error("No invoice selected");
                throw new Error("Please select an invoice to generate PDF");
            }

            const formatDateToDDMMYYYY = (dateValue: any): string => {
                if (!dateValue) return '';

                let date: Date;
                if (dateValue instanceof Date) {
                    date = dateValue;
                } else if (typeof dateValue === 'string') {
                    date = new Date(dateValue);
                } else {
                    return '';
                }

                if (isNaN(date.getTime())) {
                    return '';
                }

                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear().toString();

                return `${day}-${month}-${year}`;
            };

            let jsPDFModule = await import("kloExternal/jspdf.min");
            const jsPDF = jsPDFModule.default;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const leftMargin = 15;
            const rightMargin = pageWidth - 15;
            const middlePoint = (pageWidth / 2) - 15;
            const blueColor = '#0070C0';
            const grayColor = '#7F7F7F';
            const blackColor = '#000000';

            try {
                const logoWidth = 50;
                const logoHeight = 7;
                const c = await this.transaction.getExecutedQuery("d_asset_logo", {
                    loadAll: true,
                    file_name: "maventic_logo_2"
                });

                if (c && c.length > 0 && c[0]?.logo_attachment) {
                    const attachment = await c[0].logo_attachment.getAttachmentBlobP();

                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(attachment);
                    });

                    const base64Image = base64Data.split(",")[1];

                    doc.addImage({
                        imageData: base64Image,
                        format: 'PNG',
                        x: 15,
                        y: 10,
                        width: logoWidth,
                        height: logoHeight,
                        alias: 'companyLogo',
                        compression: 'NONE'
                    });
                }
            } catch (error) {
                console.error("Logo loading error:", error);
            }

            doc.setFontSize(10);
            doc.setTextColor(grayColor);
            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('Maventic Innovative Solutions Pvt Ltd.', leftMargin, 20);

            doc.setTextColor(blackColor);
            doc.setFont('Century Gothic (Body)', 'normal');
            doc.setFontSize(9);

            doc.text('No.593, 60 Feet Road, AECS Layout, Brookfields', leftMargin, 25);
            doc.text('Bangalore, Karnataka - 560037, India', leftMargin, 29);
            doc.text('GSTIN: 29AAECM7803N1ZY', leftMargin, 35);
            doc.text('Phone: +91 8296969824', leftMargin, 39);
            doc.text('Email: finance@maventic.com', leftMargin, 43);
            doc.text('Website: https://maventic.com', leftMargin, 47);

            doc.setTextColor(blueColor);
            doc.setFont('Century Gothic (Body)', 'bold');
            doc.setFontSize(14);
            doc.text('TAX INVOICE', rightMargin, 20, { align: 'right' });
            doc.setFontSize(10);

            if (invoiceData.lutNumber) {
                doc.text(`INVOICE # ${invoiceData.invoiceNumber || ''}`, rightMargin, 32, { align: 'right' });
                doc.text(`DATE ${formatDateToDDMMYYYY(invoiceData.date)}`, rightMargin, 38, { align: 'right' });
                doc.text(`LUT Number # ${invoiceData.lutNumber}`, rightMargin, 44, { align: 'right' });
            } else {
                doc.text(`INVOICE # ${invoiceData.invoiceNumber || ''}`, rightMargin, 38, { align: 'right' });
                doc.text(`DATE ${formatDateToDDMMYYYY(invoiceData.date)}`, rightMargin, 44, { align: 'right' });
            }

            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, 53, rightMargin, 53);

            doc.setTextColor(blackColor);
            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('TO', leftMargin, 61);
            doc.setFont('Century Gothic (Body)', 'normal');
            doc.text(invoiceData.companyName || '', leftMargin, 67);

            const addressLines = [];
            if (invoiceData.streetAddress && invoiceData.streetAddress.includes(',')) {
                const parts = invoiceData.streetAddress.split(/,(.+)/);
                addressLines.push(parts[0].trim());
                if (parts[1]) addressLines.push(parts[1].trim());
            } else {
                if (invoiceData.streetAddress) {
                    addressLines.push(invoiceData.streetAddress);
                }
            }

            if (invoiceData.cityStateZip) {
                addressLines.push(invoiceData.cityStateZip);
            }

            let currentAddressY = 73;
            addressLines.forEach(line => {
                if (line) {
                    doc.text(line, leftMargin, currentAddressY);
                    currentAddressY += 6;
                }
            });

            let nextY = currentAddressY;

            if (invoiceData.gstin) {
                doc.text(`GSTIN ${invoiceData.gstin}`, leftMargin, nextY);
                nextY += 6;
            }

            if (invoiceData.email) {
                doc.text(invoiceData.email, leftMargin, nextY);
                nextY += 6;
            }

            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, nextY + 6, rightMargin, nextY + 6);
            nextY += 12;

            if (invoiceData.placeOfSupply) {
                let stateText = invoiceData.placeOfSupply;
                if (invoiceData.gstin) {
                    const stateCode = invoiceData.gstin.substring(0, 2);
                    stateText += ` (${stateCode})`;
                }
                doc.text(`Place of Supply: ${stateText}`, leftMargin, nextY);
            }


            if (invoiceData.poNumber) {
                const poText = "P.O. #  ";
                const poNumber = invoiceData.poNumber;

                const poTextWidth = doc.getTextWidth(poText);
                const poNumberWidth = doc.getTextWidth(poNumber);
                const poTotalWidth = poTextWidth + poNumberWidth;
                const poStartPosition = rightMargin - poTotalWidth;

                doc.setTextColor(blueColor);
                doc.setFont('Century Gothic (Body)', 'bold');
                doc.text(poText, poStartPosition, nextY);

                doc.setTextColor(blackColor);
                doc.setFont('Century Gothic (Body)', 'normal');
                doc.text(poNumber, poStartPosition + poTextWidth, nextY);
            }

            nextY += 6;
            doc.line(leftMargin, nextY, rightMargin, nextY);

            const tableStartY = nextY + 8;
            doc.setTextColor(blueColor);
            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('#', leftMargin, tableStartY);
            doc.text('Description', 25, tableStartY);
            doc.text('SAC', 110, tableStartY);
            doc.text('Qty', 130, tableStartY);
            doc.text('Rate', 150, tableStartY);
            doc.text('Amount', rightMargin, tableStartY, { align: 'right' });

            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, tableStartY + 2, rightMargin, tableStartY + 2);

            doc.setTextColor(blackColor);
            doc.setFont('Century Gothic (Body)', 'normal');
            let currentY = tableStartY + 8;
            const rowHeight = 7;

            const items = invoiceData.items || [];
            items.forEach((item: any, index: number) => {
                doc.text((index + 1).toString(), leftMargin, currentY);
                doc.text(item.description || '', 25, currentY);
                doc.text(item.sac || '', 110, currentY);
                doc.text(item.quantity?.toString() || '0', 130, currentY);
                doc.text((item.rate || 0).toFixed(2), 150, currentY);
                doc.text((item.amount || 0).toFixed(2), rightMargin, currentY, { align: 'right' });

                if (index < items.length - 1) {
                    doc.setDrawColor(230, 230, 230);
                    doc.line(leftMargin, currentY + 1, rightMargin, currentY + 1);
                }

                currentY += rowHeight;
            });

            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, currentY - 3, rightMargin, currentY - 3);

            const subtotal = invoiceData.subTotal || 0;
            const cgst = invoiceData.cgstAmount || 0;
            const sgst = invoiceData.sgstAmount || 0;
            const igst = invoiceData.igstAmount || 0;
            const total = invoiceData.totalAmount || 0;

            const totalsLabelX = rightMargin - 40;
            let totalsSectionY = currentY + 5;
            const totalLineHeight = 7;

            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('Sub Total', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(subtotal.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            totalsSectionY += totalLineHeight;
            doc.text('CGST (9%)', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(cgst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            totalsSectionY += totalLineHeight;
            doc.text('SGST (9%)', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(sgst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            totalsSectionY += totalLineHeight;
            doc.text('IGST (18%)', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(igst.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });

            doc.setDrawColor(100, 100, 100);
            doc.line(totalsLabelX - 30, totalsSectionY + 4, rightMargin, totalsSectionY + 4);

            totalsSectionY += totalLineHeight + 3;
            doc.setFontSize(11);
            doc.text('Total', totalsLabelX, totalsSectionY, { align: 'right' });
            doc.text(total.toFixed(2), rightMargin, totalsSectionY, { align: 'right' });
            doc.setFontSize(10);

            let amountInWordsY = totalsSectionY + 12;
            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, amountInWordsY, rightMargin, amountInWordsY);

            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('Amount in Words:', leftMargin, amountInWordsY + 8);
            doc.setFont('Century Gothic (Body)', 'normal');

            let amountInWords = "N/A";
            try {
                amountInWords = `${this.numberToWords(total)} only`;
            } catch (error) {
                console.error("Error converting number to words:", error);
            }

            doc.text(amountInWords, leftMargin + 40, amountInWordsY + 8);
            doc.line(leftMargin, amountInWordsY + 15, rightMargin, amountInWordsY + 15);

            const footerHeight = 20;
            const finalLineY = pageHeight - footerHeight;
            const lineSpacing = 6;

            let qrCodeY = finalLineY - 40;
            if (invoiceData.signedQR) {
                try {
                    let qrGenerator = await import("kloExternal/bwip-js-min");
                    let qrCanvas = document.createElement("canvas");

                    qrGenerator.toCanvas(qrCanvas, {
                        bcid: "qrcode",
                        includetext: true,
                        textxalign: "center",
                        height: 20,
                        scale: 2,
                        text: invoiceData.signedQR
                    });

                    const qrDataURL = qrCanvas.toDataURL("image/png");

                    const irnFontSize = 7;
                    doc.setFontSize(irnFontSize);

                    const qrCodeHeight = 30;
                    const eInvoiceY = qrCodeY - 3;
                    const irnY = finalLineY - 5;

                    doc.setFont('Century Gothic (Body)', 'italic');
                    doc.setFontSize(11);
                    doc.text('E-Invoice', middlePoint + 35, eInvoiceY, { align: 'center' });

                    doc.addImage(qrDataURL, 'PNG', middlePoint + 20, qrCodeY, qrCodeHeight, qrCodeHeight);

                    if (invoiceData.irnNumber) {
                        doc.setFont('Century Gothic (Body)', 'normal');
                        doc.setFontSize(irnFontSize);
                        const splitIRN = doc.splitTextToSize(invoiceData.irnNumber, 60);
                        doc.text(splitIRN, middlePoint + 35, irnY, { align: 'center' });
                    }
                } catch (qrError) {
                    console.error("QR code generation failed:", qrError);
                }
            }

            doc.setTextColor(blackColor);
            doc.setFontSize(10);
            doc.setFont('Century Gothic (Body)', 'bold');
            doc.text('Payable to - Maventic Innovative Solutions Pvt Ltd', leftMargin, finalLineY - 42);

            doc.setFont('Century Gothic (Body)', 'normal');
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
                doc.text('Swift Code: HDFCINBBBNG.', leftMargin, finalLineY - 12);
            }

            doc.text('Payment is due within 30 days.', leftMargin, finalLineY - 6);

            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, finalLineY, rightMargin, finalLineY);

            doc.setTextColor(blackColor);
            doc.setFont('Century Gothic (Body)', 'normal');

            let contactText = "If you have any questions concerning this invoice, contact";
            if (invoiceData.contactName) contactText += ` ${invoiceData.contactName}`;
            if (invoiceData.contactPhone) contactText += ` | ${invoiceData.contactPhone}`;
            if (invoiceData.contactEmail) contactText += ` | ${invoiceData.contactEmail}`;

            doc.text(contactText, pageWidth / 2, finalLineY + 8, { align: 'center' });

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

    private numberToWords(num: number): string {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';

        let words = '';
        const numStr = Math.floor(num).toString();

        if (numStr.length > 7) {
            const crore = parseInt(numStr.substring(0, numStr.length - 7));
            words += this.convertThreeDigits(crore) + ' Crore ';
        }

        if (numStr.length > 5) {
            const lakh = parseInt(numStr.substring(Math.max(numStr.length - 7, 0), numStr.length - 5));
            words += this.convertThreeDigits(lakh) + ' Lakh ';
        }

        const thousand = parseInt(numStr.substring(Math.max(numStr.length - 5, 0), numStr.length - 3));
        if (thousand > 0) {
            words += this.convertThreeDigits(thousand) + ' Thousand ';
        }

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

    public async onSendingInvoiceMail() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Sending invoice mails, please wait..."
        });

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                sap.m.MessageBox.error("No invoices selected for mailing", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            busyDialog.open();

            const selectedInvoices = selectedIndices.map(index => listData[index]);
            const validStatuses = ["E Signing Successful", "Error In Sending Mail"];

            for (const invoice of selectedInvoices) {
                try {
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    const firstGroupInvoice = invoicesInGroup[0];

                    if (!validStatuses.includes(firstGroupInvoice.status)) {
                        console.warn(`Invoice ${firstGroupInvoice.inv_request_id} has invalid status: ${firstGroupInvoice.status}`);
                        continue;
                    }

                    await this.transaction.createEntityP("d_email_helper_entity", {
                        s_object_type: -1,
                        invoice_number: firstGroupInvoice.inv_request_id,
                        milestone_number: firstGroupInvoice.milestone_number,
                        email_type: 'Invoice Mail'
                    });

                    invoice.status = "Email Sent to Customer";
                    invoice.remark = null;
                } catch (error) {
                    await invoice.r_invoice_list_request?.fetch();

                    invoice.status = "Error In Sending Mail";
                    invoice.remark = error.message;
                    console.error(`Error sending mail for invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("Invoice mailing process completed");
        } catch (error) {
            console.error("Error while sending invoice mails:", error);
            sap.m.MessageBox.error(error.message || "An error occurred while sending invoices", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
        } finally {
            busyDialog.close();
            await this.tm.getTN("invoice_list_hdr_table_search").getData().refreshP();
        }
    }

    public async onSendPaymentReminderEmails() {
        const busyDialog = new sap.m.BusyDialog({
            text: "Sending invoice reminder mails, please wait..."
        });

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                sap.m.MessageBox.error("No invoices selected for mailing", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            busyDialog.open();

            const selectedInvoices = selectedIndices.map(index => listData[index]);

            for (const invoice of selectedInvoices) {
                try {
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    const firstGroupInvoice = invoicesInGroup[0];

                    await this.transaction.createEntityP("d_email_helper_entity", {
                        s_object_type: -1,
                        invoice_number: firstGroupInvoice.inv_request_id,
                        milestone_number: firstGroupInvoice.milestone_number,
                        email_type: 'Reminder Mail'
                    });
                } catch (error) {
                    console.error(`Error sending reminder mail for invoice ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("Reminder mail sent successfully");
        } catch (error) {
            console.error("Error while sending invoice reminder mails:", error);
            sap.m.MessageBox.error(error.message || "An error occurred while sending reminder mails", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
        } finally {
            busyDialog.close();
        }
    }

    public async downloadSignedInvoice() {
        const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

        const invoiceHeaderTable = await listData[selectedIndices[0]].r_invoice_list_request.fetch();

        if (invoiceHeaderTable[0].signed_invoice_pdf.hasAttachment === true) {
            await invoiceHeaderTable[0].signed_invoice_pdf.downloadAttachP();
        } else if (invoiceHeaderTable.length > 1) {
            let attachmentFound = false;
            for (let i = 1; i < invoiceHeaderTable.length; i++) {
                if (invoiceHeaderTable[i].signed_invoice_pdf.hasAttachment === true) {
                    await invoiceHeaderTable[i].signed_invoice_pdf.downloadAttachP();
                    attachmentFound = true;
                    break;
                }
            }
            if (!attachmentFound) {
                new sap.m.Dialog({
                    title: "No Attachment",
                    type: "Message",
                    content: new sap.m.Text({ text: "No signed invoice attachment is available for this invoice." }),
                    beginButton: new sap.m.Button({
                        text: "OK",
                        press: function () {
                            this.getParent().close();
                        }
                    }),
                    afterClose: function () {
                        this.destroy();
                    }
                }).open();
            }
        } else {
            new sap.m.Dialog({
                title: "No Attachment",
                type: "Message",
                content: new sap.m.Text({ text: "No signed invoice attachment is available for this invoice." }),
                beginButton: new sap.m.Button({
                    text: "OK",
                    press: function () {
                        this.getParent().close();
                    }
                }),
                afterClose: function () {
                    this.destroy();
                }
            }).open();
        }
    }

    // Credit Note Coading

    public async openCreditNoteDialog() {
        const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

        // ---------------- VALIDATIONS ----------------
        if (selectedIndices.length === 0) {
            sap.m.MessageBox.error("Please select at least one line item to proceed.", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
            return;
        }

        if (selectedIndices.length > 1) {
            sap.m.MessageBox.error("You can only select one line item when you are raising the credit note", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK],
            });
            return;
        }

        const selectedIndex = selectedIndices[0];

        // Fetch invoice group
        await listData[selectedIndex].r_invoice_list_request?.fetch();
        const groupedInvoices = listData[selectedIndex].r_invoice_list_request;

        const selectedCreditNotes = [];

        // ------------------------------------------------
        // PROCESS EACH INVOICE IN THE GROUP
        // ------------------------------------------------
        for (const invoice of groupedInvoices) {

            // Fetch line items
            await invoice.r_invoice_list?.fetch();

            // ------------------------------------------------
            // CASE 1: Multiple r_invoice_list rows
            // ------------------------------------------------
            if (invoice.r_invoice_list && invoice.r_invoice_list.length > 0) {

                for (const row of invoice.r_invoice_list) {

                    const qty = Number(row.quantity || 1);
                    const rate = Number(row.rate || row.amount || invoice.reg_milestone_amount || 0);

                    const cgst = Number(row.cgst || 0);
                    const sgst = Number(row.sgst || 0);
                    const igst = Number(row.igst || 0);

                    const totalLineAmount = qty * rate;
                    const totalInvoice = totalLineAmount + cgst + sgst + igst;

                    selectedCreditNotes.push({
                        project_name: invoice.reg_project_name || "",
                        milestone_name: row.inv_primary_desc || invoice.reg_milestone_name || "",
                        inv_request_id: invoice.inv_request_id,
                        milestone_date: invoice.reg_milestone_date,
                        milestone_amount: totalLineAmount,
                        header_id: invoice.invoice_guid,
                        line_item_guid: row.my_key,

                        cgst,
                        sgst,
                        igst,

                        total_tax: cgst + sgst + igst,
                        total_invoice: totalInvoice,

                        sac: row.sac_code || invoice.sac_code || "",
                        quantity: qty,
                        rate: rate,

                        credit_note_date: new Date(),
                        credit_note_amount: ""
                    });
                }

                continue;
            }

            // ------------------------------------------------
            // CASE 2: No line items → fallback to header
            // ------------------------------------------------
            const qty = 1;
            const rate = Number(invoice.reg_milestone_amount || 0);

            const cgst = Number(invoice.cgst || 0);
            const sgst = Number(invoice.sgst || 0);
            const igst = Number(invoice.igst || 0);

            const totalLineAmount = qty * rate;
            const totalInvoice = totalLineAmount + cgst + sgst + igst;

            selectedCreditNotes.push({
                project_name: invoice.reg_project_name || "",
                milestone_name: invoice.reg_milestone_name || "",
                inv_request_id: invoice.inv_request_id,
                milestone_date: invoice.reg_milestone_date,
                milestone_amount: totalLineAmount,
                header_id: invoice.invoice_guid,
                line_item_guid: null,

                cgst,
                sgst,
                igst,

                total_tax: cgst + sgst + igst,
                total_invoice: totalInvoice,

                sac: invoice.sac_code || "",
                quantity: qty,
                rate: rate,

                credit_note_date: new Date(),
                credit_note_amount: ""
            });

        } // end loop

        // Set model and open dialog
        await this.tm.getTN("credit_note_other").setData(selectedCreditNotes);
        await this.openDialog("pa_credit_note_gnr");
    }

    public async onRaiseCreditNote(oEvent) {
        const loginId = (await this.transaction.get$User()).login_id;
        const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();
        const creditNoteList = await this.tm.getTN("credit_note_other").getData();

        if (selectedIndices.length === 0) {
            sap.m.MessageBox.error("Please select at least one invoice to raise a credit note");
            return;
        }

        const busyDialog = new sap.m.BusyDialog({ text: "Raising credit note, please wait..." });
        busyDialog.open();

        try {
            const employeeOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', {
                loadAll: true,
                employee_id: loginId,
                partialSelect: ['employee_id', 'company_code'],
            });

            const objectTypeConfig = await this.transaction.getExecutedQuery('d_o2c_id_confg', {
                loadAll: true,
                company_code: employeeOrg[0].company_code,
                type: 'credit_note',
                partialSelect: ['company_code', 'object_name', 'type']
            });

            const entity_credit_number = await this.transaction.createEntityP("d_idseries", {
                s_object_type: objectTypeConfig[0].object_name
            });

            let invoiceNumber = "";
            const eCreditNoteEInvoicingData = await this.onDoingCreditNoteEInvoicing(entity_credit_number.a_id);

            const listItem = listData[selectedIndices[0]];
            await listItem.r_invoice_list_request?.fetch();
            const invoicesInGroup = listItem.r_invoice_list_request;

            let header = await this.transaction.createEntityP("d_o2c_invoice_credit_note", {
                credit_note_number: entity_credit_number.a_id,
                credit_note_total_amount: 0,
                ack_date: new Date(eCreditNoteEInvoicingData.AckDt.replace(' ', 'T')),
                ack_number: eCreditNoteEInvoicingData.AckNo,
                credit_note_irnn: eCreditNoteEInvoicingData.Irn,
                credit_note_signed_invoice: eCreditNoteEInvoicingData.SignedInvoice,
                credit_note_qr: eCreditNoteEInvoicingData.SignedQRCode,
                credit_note_date: new Date()
            });

            let totalBase = 0;
            let totalIGST = 0;
            let totalCGST = 0;
            let totalSGST = 0;

            // ... [rest of the processing code remains the same] ...

            for (const invoice of invoicesInGroup) {
                await invoice.r_invoice_list?.fetch();

                if (invoice.r_invoice_list && invoice.r_invoice_list.length > 0) {
                    for (const lineItem of invoice.r_invoice_list) {
                        const matchingCreditNote = creditNoteList.find(cn =>
                            cn.header_id === invoice.invoice_guid &&
                            cn.milestone_name === (lineItem.inv_primary_desc || invoice.reg_milestone_name)
                        );

                        if (matchingCreditNote) {
                            const baseAmount = parseFloat(matchingCreditNote.credit_note_amount || "0") || 0;
                            const igstValue = parseFloat(matchingCreditNote.igst || "0") || 0;

                            let credit_note_igst = 0;
                            let credit_note_cgst = 0;
                            let credit_note_sgst = 0;

                            if (igstValue > 0) {
                                credit_note_igst = parseFloat((baseAmount * 0.18).toFixed(2));
                                totalIGST += credit_note_igst;
                            } else {
                                credit_note_cgst = parseFloat((baseAmount * 0.09).toFixed(2));
                                credit_note_sgst = parseFloat((baseAmount * 0.09).toFixed(2));
                                totalCGST += credit_note_cgst;
                                totalSGST += credit_note_sgst;
                            }

                            totalBase += baseAmount;

                            await header.r_credit_note_hdr_item.newEntityP(0, {
                                credit_note_amount: baseAmount,
                                invoice_line_item_guid: invoice.invoice_guid,
                                invoice_split_line_item_guid: lineItem.my_key,
                                credit_note_number: entity_credit_number.a_id,
                                inv_number: matchingCreditNote.inv_request_id
                            });

                            invoiceNumber = matchingCreditNote.inv_request_id;
                        }
                    }
                } else {
                    const matchingCreditNote = creditNoteList.find(cn => cn.header_id === invoice.invoice_guid);

                    if (matchingCreditNote) {
                        const baseAmount = parseFloat(matchingCreditNote.credit_note_amount || "0") || 0;
                        const igstValue = parseFloat(matchingCreditNote.igst || "0") || 0;

                        let credit_note_igst = 0;
                        let credit_note_cgst = 0;
                        let credit_note_sgst = 0;

                        if (igstValue > 0) {
                            credit_note_igst = parseFloat((baseAmount * 0.18).toFixed(2));
                            totalIGST += credit_note_igst;
                        } else {
                            credit_note_cgst = parseFloat((baseAmount * 0.09).toFixed(2));
                            credit_note_sgst = parseFloat((baseAmount * 0.09).toFixed(2));
                            totalCGST += credit_note_cgst;
                            totalSGST += credit_note_sgst;
                        }

                        totalBase += baseAmount;

                        await header.r_credit_note_hdr_item.newEntityP(0, {
                            credit_note_amount: baseAmount,
                            invoice_line_item_guid: invoice.invoice_guid,
                            invoice_split_line_item_guid: null,
                            credit_note_number: entity_credit_number.a_id,
                            inv_number: matchingCreditNote.inv_request_id
                        });

                        invoiceNumber = matchingCreditNote.inv_request_id;
                    }
                }
            }

            const grandTotal = parseFloat((totalBase + totalIGST + totalCGST + totalSGST).toFixed(2));
            header.credit_note_total_amount = grandTotal;
            header.invoice_number = invoiceNumber;
            header.credit_note_igst = totalIGST;
            header.credit_note_cgst = totalCGST;
            header.credit_note_sgst = totalSGST;

            await this.tm.commitP();

            const pdfResponse = await this.triggerCreditNotePdf(oEvent, false, entity_credit_number.a_id, eCreditNoteEInvoicingData);

            if (pdfResponse && pdfResponse.blob && pdfResponse.filename) {
                await header.credit_note_pdf.setAttachmentP(pdfResponse.blob, pdfResponse.filename);

                let retryCount = 0;
                const maxRetries = 5;
                let commitSuccess = false;

                while (retryCount < maxRetries && !commitSuccess) {
                    try {
                        await this.tm.commitP("Uploaded successfully", "Processing", true, true);
                        commitSuccess = true;
                    } catch (error) {
                        retryCount++;
                        console.error(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);
                        if (retryCount >= maxRetries) {
                            sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
                            throw error;
                        }
                        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
                    }
                }
            }

            // ✅ CLOSE THE DIALOG AFTER SUCCESS
            await this.closeDialog("pa_credit_note_gnr");

            const creditNoteNumber = entity_credit_number.a_id;
            const message = `Credit Note ${creditNoteNumber} for Invoice Number ${invoiceNumber} has been successfully raised.`;

            sap.m.MessageBox.show(message, {
                icon: sap.m.MessageBox.Icon.SUCCESS,
                title: "Credit Note Raised",
                actions: ["OK", "Download Credit Note PDF", "Raise Credit note in ZOHO"],
                onClose: async (sAction) => {
                    if (sAction === "Download Credit Note PDF") {
                        await this.downloadCreditNotePDF(creditNoteNumber);
                    }
                    if (sAction === "Raise Credit note in ZOHO") {
                        await this.zohoCreditNoteGeneration(creditNoteNumber);
                    }
                }
            });

        } catch (error) {
            console.error("Error raising credit note:", error);

            // ✅ ALSO CLOSE THE DIALOG ON ERROR
            await this.closeDialog("pa_credit_note_gnr");

            sap.m.MessageBox.error(error.message || "An error occurred while raising the credit note", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK]
            });
        } finally {
            busyDialog.close();
        }
    }

    public async onDoingCreditNoteEInvoicing(creditNoteNumber) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, processing credit note e-invoices..."
        });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices.length) {
                sap.m.MessageBox.error("Please select at least one invoice", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK],
                });
                return;
            }

            const selectedInvoices = selectedIndices.map(index => listData[index]);
            let finalResult = null;

            for (const invoice of selectedInvoices) {
                try {
                    await invoice.r_invoice_list_request?.fetch();
                    const invoicesInGroup = invoice.r_invoice_list_request;
                    const firstGroupInvoice = invoicesInGroup[0];

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
                        await firstGroupInvoice[relation.key]?.fetch();
                        const relationData = firstGroupInvoice[relation.key]?.[0];
                        await relationData?.[relation.itemKey]?.fetch();
                        const itemData = relationData?.[relation.itemKey]?.[0];
                        await itemData?.r_item_header?.fetch();
                        const headerData = itemData?.r_item_header?.[0];
                        await headerData?.r_so_header_address?.fetch();
                        const addressData = headerData?.r_so_header_address?.[0];

                        if (addressData) {
                            customerAddress = `${(addressData.address_1 || "")} ${(addressData.address_2 || "")}`.trim();
                            customerLocation = addressData.city || "";
                            customerPincode = parseInt(addressData.pincode) || 0;
                            billToAddressId = headerData.bill_to_address || "";
                            break;
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
                    const customerName = listData[selectedIndices[0]].client_name_vh?.additional_desc || "Unknown Customer";
                    const taxpayer_type = customerAddressData[0]?.taxpayer_type;

                    const itemList = [];
                    let totalAssAmount = 0;
                    let totalIgstAmount = 0;
                    let totalCgstAmount = 0;
                    let totalSgstAmount = 0;
                    let totalValueWithTax = 0;

                    const creditNoteList = await this.tm.getTN("credit_note_other").getData();

                    // ------------------------------------------------
                    // PROCESS EACH INVOICE IN GROUP FOR E-INVOICING
                    // ------------------------------------------------
                    let itemSlNo = 1;

                    for (const invoiceItem of invoicesInGroup) {

                        // Fetch line items
                        await invoiceItem.r_invoice_list?.fetch();

                        const businessAreaDetails = businessAreaMap[invoiceItem.business_area] || {};

                        // ------------------------------------------------
                        // CASE 1: Has r_invoice_list (multiple line items)
                        // ------------------------------------------------
                        if (invoiceItem.r_invoice_list && invoiceItem.r_invoice_list.length > 0) {

                            for (const lineItem of invoiceItem.r_invoice_list) {
                                const matchingCreditNote = creditNoteList.find(cn =>
                                    cn.header_id === invoiceItem.invoice_guid &&
                                    cn.milestone_name === (lineItem.inv_primary_desc || invoiceItem.reg_milestone_name)
                                );

                                if (!matchingCreditNote) continue;

                                const baseAmount = parseFloat(matchingCreditNote.credit_note_amount || 0);

                                let tax_percentage = 0;
                                if (businessAreaDetails.tax_rule === 'gst') {
                                    const taxInfo = gstTaxMasterMap[invoiceItem.reg_billing_type];
                                    if (!taxInfo) {
                                        throw new Error(`Tax information not found for billing type ${invoiceItem.billing_type}`);
                                    }
                                    tax_percentage = taxInfo.tax_percentage;
                                }

                                const quantity = parseFloat(lineItem.quantity || 1);
                                const rate = baseAmount / quantity;
                                const totalAmount = parseFloat((rate * quantity).toFixed(2));
                                const discount = 0;
                                const assAmount = totalAmount - discount;
                                const gstRate = tax_percentage;

                                let igstAmount = 0;
                                let cgstAmount = 0;
                                let sgstAmount = 0;

                                if (parseFloat(matchingCreditNote.igst) > 0) {
                                    igstAmount = parseFloat((baseAmount * 0.18).toFixed(2));
                                } else if (
                                    parseFloat(matchingCreditNote.cgst) > 0 &&
                                    parseFloat(matchingCreditNote.sgst) > 0
                                ) {
                                    cgstAmount = parseFloat((baseAmount * 0.09).toFixed(2));
                                    sgstAmount = parseFloat((baseAmount * 0.09).toFixed(2));
                                }

                                const itemTotalWithTax = parseFloat((baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2));

                                const uomInfo = gstUomMap[lineItem.unit || invoiceItem.unit];
                                if (!uomInfo) {
                                    throw new Error(`UOM mapping not found for unit ${lineItem.unit || invoiceItem.unit}`);
                                }

                                const taxMasterInfo = gstTaxMasterMap[invoiceItem?.reg_billing_type];
                                if (!taxMasterInfo) {
                                    throw new Error(`Tax master info not found for billing type ${invoiceItem.billing_type}`);
                                }

                                itemList.push({
                                    "SlNo": (itemSlNo++).toString(),
                                    "IsServc": taxMasterInfo.is_service,
                                    "HsnCd": lineItem.sac_code || taxMasterInfo.hsc_sac_code,
                                    "Qty": quantity,
                                    "Unit": uomInfo.uom_unit,
                                    "UnitPrice": rate,
                                    "TotAmt": totalAmount,
                                    "Discount": discount,
                                    "AssAmt": assAmount,
                                    "GstRt": gstRate,
                                    "IgstAmt": igstAmount,
                                    "CgstAmt": cgstAmount,
                                    "SgstAmt": sgstAmount,
                                    "TotItemVal": itemTotalWithTax
                                });

                                totalAssAmount += assAmount;
                                totalIgstAmount += igstAmount;
                                totalCgstAmount += cgstAmount;
                                totalSgstAmount += sgstAmount;
                                totalValueWithTax += itemTotalWithTax;
                            }

                        } else {
                            // ------------------------------------------------
                            // CASE 2: No r_invoice_list (single header-level item)
                            // ------------------------------------------------
                            const matchingCreditNote = creditNoteList.find(cn => cn.header_id === invoiceItem.invoice_guid);

                            if (!matchingCreditNote) continue;

                            const baseAmount = parseFloat(matchingCreditNote.credit_note_amount || 0);

                            let tax_percentage = 0;
                            if (businessAreaDetails.tax_rule === 'gst') {
                                const taxInfo = gstTaxMasterMap[invoiceItem.reg_billing_type];
                                if (!taxInfo) {
                                    throw new Error(`Tax information not found for billing type ${invoiceItem.billing_type}`);
                                }
                                tax_percentage = taxInfo.tax_percentage;
                            }

                            const quantity = 1;
                            const rate = baseAmount;
                            const totalAmount = parseFloat((rate * quantity).toFixed(2));
                            const discount = 0;
                            const assAmount = totalAmount - discount;
                            const gstRate = tax_percentage;

                            let igstAmount = 0;
                            let cgstAmount = 0;
                            let sgstAmount = 0;

                            if (parseFloat(matchingCreditNote.igst) > 0) {
                                igstAmount = parseFloat((baseAmount * 0.18).toFixed(2));
                            } else if (
                                parseFloat(matchingCreditNote.cgst) > 0 &&
                                parseFloat(matchingCreditNote.sgst) > 0
                            ) {
                                cgstAmount = parseFloat((baseAmount * 0.09).toFixed(2));
                                sgstAmount = parseFloat((baseAmount * 0.09).toFixed(2));
                            }

                            const itemTotalWithTax = parseFloat((baseAmount + igstAmount + cgstAmount + sgstAmount).toFixed(2));

                            const uomInfo = gstUomMap[invoiceItem.unit];
                            if (!uomInfo) {
                                throw new Error(`UOM mapping not found for unit ${invoiceItem.unit}`);
                            }

                            const taxMasterInfo = gstTaxMasterMap[invoiceItem?.reg_billing_type];
                            if (!taxMasterInfo) {
                                throw new Error(`Tax master info not found for billing type ${invoiceItem.billing_type}`);
                            }

                            itemList.push({
                                "SlNo": (itemSlNo++).toString(),
                                "IsServc": taxMasterInfo.is_service,
                                "HsnCd": taxMasterInfo.hsc_sac_code,
                                "Qty": quantity,
                                "Unit": uomInfo.uom_unit,
                                "UnitPrice": rate,
                                "TotAmt": totalAmount,
                                "Discount": discount,
                                "AssAmt": assAmount,
                                "GstRt": gstRate,
                                "IgstAmt": igstAmount,
                                "CgstAmt": cgstAmount,
                                "SgstAmt": sgstAmount,
                                "TotItemVal": itemTotalWithTax
                            });

                            totalAssAmount += assAmount;
                            totalIgstAmount += igstAmount;
                            totalCgstAmount += cgstAmount;
                            totalSgstAmount += sgstAmount;
                            totalValueWithTax += itemTotalWithTax;
                        }
                    }

                    const currentDate = new Date();
                    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

                    const requestBody = {
                        "Version": "1.1",
                        "TranDtls": {
                            "TaxSch": businessAreaMap[firstGroupInvoice.business_area].tax_rule === 'gst' ? "GST" : null,
                            "SupTyp": taxpayer_type === 'SEZ Unit/Developer' ? "SEZWOP" :
                                (firstGroupInvoice.invoice_origin_country === 'IND' ? "B2B" : "EXPWOP")
                        },
                        "DocDtls": {
                            "Typ": "CRN",
                            "No": creditNoteNumber,
                            "Dt": formattedDate
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
                        "RefDtls": {
                            "PrecDocDtls": [
                                {
                                    "InvNo": firstGroupInvoice.inv_request_id || "",
                                    "InvDt": `${new Date(firstGroupInvoice.act_date).getDate().toString().padStart(2, '0')}/${(new Date(firstGroupInvoice.act_date).getMonth() + 1).toString().padStart(2, '0')}/${new Date(firstGroupInvoice.act_date).getFullYear()}`,
                                    "OthRefNo": creditNoteNumber || ""
                                }
                            ]
                        },
                        "ItemList": itemList,
                        "ValDtls": {
                            "AssVal": totalAssAmount,
                            "IgstVal": totalIgstAmount,
                            "CgstVal": totalCgstAmount,
                            "SgstVal": totalSgstAmount,
                            "TotInvVal": totalValueWithTax.toFixed(2)
                        },
                        ...(firstGroupInvoice.invoice_origin_country !== 'IND' && {
                            "ExpDtls": {
                                "ForCur": listData[selectedIndices[0]].currency,
                                "CntCode": "NP"
                            }
                        })
                    };

                    busyDialog.setText(`Processing credit note ${firstGroupInvoice.inv_request_id}...`);

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

                    if (response.success === false) {
                        console.error('Error in Credit Note E-Invoicing:', response.error);
                        continue;
                    }

                    finalResult = response.result;

                    await this.tm.commitP();
                    sap.m.MessageToast.show("Credit note e-invoicing completed");
                    break;

                } catch (error) {
                    console.error(`Error processing e-invoicing for credit note ${invoice.inv_request_id}:`, error);
                    continue;
                }
            }

            return finalResult;

        } finally {
            busyDialog.close();
        }
    }

    public async processMultipleCreditNotes(selectedCreditNotes, fromBrowser, creditNoteNumber, eCreditNoteEInvoicingData): Promise<{ blob: Blob, filename: string } | null> {
        const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
        const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();
        const firstCreditNote = selectedCreditNotes[0];

        let billToAddressId = "";
        let customerState = "";
        let customerAddressOne = "";
        let customerAddressTwo = "";
        let customerPincode = 0;

        const creditNoteListData = await this.tm.getTN("credit_note_other").getData();

        const creditNoteRelations = [
            { key: "r_invoice_milestone", itemKey: "r_milestone_item" },
            { key: "r_invoice_schedule", itemKey: "r_schedule_item" },
            { key: "r_invoice_volume", itemKey: "r_volume_item" }
        ];

        for (const relation of creditNoteRelations) {
            await firstCreditNote[relation.key]?.fetch();
            const relationData = firstCreditNote[relation.key]?.[0];
            await relationData?.[relation.itemKey]?.fetch();
            const itemData = relationData?.[relation.itemKey]?.[0];
            await itemData?.r_item_header?.fetch();
            const headerData = itemData?.r_item_header?.[0];
            await headerData?.r_so_header_address?.fetch();
            const addressData = headerData?.r_so_header_address?.[0];

            if (addressData) {
                customerAddressOne = addressData.address_1 || "";
                customerAddressTwo = addressData.address_2 || "";
                customerState = addressData.state || "";
                customerPincode = parseInt(addressData.pincode) || 0;
                billToAddressId = headerData.bill_to_address || "";
                break;
            }
        }

        const customerAddressData = await this.transaction.getExecutedQuery('d_o2c_customers_map', {
            loadAll: true,
            address_map_id: billToAddressId
        });

        const customerGstNumber = customerAddressData?.[0]?.gstin_vat || "";
        const customerName = listData[selectedIndices[0]]?.client_name_vh?.additional_desc || "";

        const items = [];
        let subTotal = 0;
        let totalIgstAmount = 0;
        let totalCgstAmount = 0;
        let totalSgstAmount = 0;

        // ------------------------------------------------
        // PROCESS EACH CREDIT NOTE FOR PDF
        // ------------------------------------------------
        for (const creditNote of selectedCreditNotes) {

            // Fetch line items
            await creditNote.r_invoice_list?.fetch();

            // ------------------------------------------------
            // CASE 1: Has r_invoice_list (multiple line items)
            // ------------------------------------------------
            if (creditNote.r_invoice_list && creditNote.r_invoice_list.length > 0) {

                for (const lineItem of creditNote.r_invoice_list) {
                    const matchingCreditNote = creditNoteListData.find(item =>
                        item.header_id === creditNote.invoice_guid &&
                        item.milestone_name === (lineItem.inv_primary_desc || creditNote.reg_milestone_name)
                    );

                    if (!matchingCreditNote) continue;

                    const creditNoteAmount = parseFloat(matchingCreditNote?.credit_note_amount || 0);

                    items.push({
                        description: lineItem.inv_primary_desc || creditNote?.reg_milestone_name || "",
                        hsnSac: lineItem.sac_code || creditNote.sac_code || "",
                        quantity: parseFloat(lineItem.quantity || 1),
                        rate: creditNoteAmount / parseFloat(lineItem.quantity || 1),
                        amount: creditNoteAmount
                    });

                    subTotal += creditNoteAmount;

                    // Calculate tax amounts
                    if (parseFloat(matchingCreditNote.igst || 0) > 0) {
                        totalIgstAmount += (creditNoteAmount * 18) / 100;
                    } else if (parseFloat(matchingCreditNote.cgst || 0) > 0 || parseFloat(matchingCreditNote.sgst || 0) > 0) {
                        totalCgstAmount += (creditNoteAmount * 9) / 100;
                        totalSgstAmount += (creditNoteAmount * 9) / 100;
                    }
                }

            } else {
                // ------------------------------------------------
                // CASE 2: No r_invoice_list (single header-level item)
                // ------------------------------------------------
                const matchingCreditNote = creditNoteListData.find(item => item.header_id === creditNote.invoice_guid);

                if (!matchingCreditNote) continue;

                const creditNoteAmount = parseFloat(matchingCreditNote?.credit_note_amount || 0);

                items.push({
                    description: creditNote?.reg_milestone_name || "",
                    hsnSac: creditNote.sac_code || "",
                    quantity: 1,
                    rate: creditNoteAmount,
                    amount: creditNoteAmount
                });

                subTotal += creditNoteAmount;

                // Calculate tax amounts
                if (parseFloat(matchingCreditNote.igst || 0) > 0) {
                    totalIgstAmount += (creditNoteAmount * 18) / 100;
                } else if (parseFloat(matchingCreditNote.cgst || 0) > 0 || parseFloat(matchingCreditNote.sgst || 0) > 0) {
                    totalCgstAmount += (creditNoteAmount * 9) / 100;
                    totalSgstAmount += (creditNoteAmount * 9) / 100;
                }
            }
        }

        const totalTaxAmount = totalIgstAmount + totalCgstAmount + totalSgstAmount;
        const totalAmount = subTotal + totalTaxAmount;

        const batchCreditNoteData = {
            creditNoteNumber: creditNoteNumber,
            creditDate: new Date().toISOString().split("T")[0],
            companyName: customerName,
            streetAddress: `${customerAddressOne || ""} ${customerAddressTwo || ""}`.trim(),
            cityStateZip: `${customerState} ${customerPincode}`.trim(),
            gstin: customerGstNumber,
            placeOfSupply: customerState,
            originalInvoiceNumber: firstCreditNote.inv_request_id,
            originalInvoiceDate: firstCreditNote.act_date,
            items: items,
            subTotal: subTotal,
            igstAmount: totalIgstAmount,
            cgstAmount: totalCgstAmount,
            sgstAmount: totalSgstAmount,
            totalAmount: totalAmount,
            creditsUsed: totalAmount,
            creditsRemaining: 0,
            irnNumber: eCreditNoteEInvoicingData?.Irn,
            ackNo: eCreditNoteEInvoicingData?.AckNo,
            ackDate: eCreditNoteEInvoicingData?.AckDt,
            signedQR: eCreditNoteEInvoicingData?.SignedQRCode,
            isBatchCreditNote: true,
            creditNoteCount: selectedCreditNotes.length
        };

        return await this.onGenerateCreditNotePDF(batchCreditNoteData, fromBrowser);
    }

    public async onGenerateCreditNotePDF(creditNoteData: any, fromBrowser): Promise<{ blob: Blob, filename: string }> {
        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (!selectedIndices || selectedIndices.length === 0) {
                console.error("No credit note selected");
                throw new Error("Please select a credit note to generate PDF");
            }

            const formatDateToDDMMYYYY = (dateValue: any): string => {
                if (!dateValue) return '';
                let date: Date;
                if (dateValue instanceof Date) {
                    date = dateValue;
                } else if (typeof dateValue === 'string') {
                    date = new Date(dateValue);
                } else {
                    return '';
                }
                if (isNaN(date.getTime())) {
                    return '';
                }
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear().toString();
                return `${day}/${month}/${year}`;
            };

            let jsPDFModule = await import("kloExternal/jspdf.min");
            const jsPDF = jsPDFModule.default;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const leftMargin = 15;
            const rightMargin = pageWidth - 15;
            const contentWidth = rightMargin - leftMargin;

            // Colors matching the screenshot
            const blackColor = '#000000';
            const darkBlue = '#1a365d';
            const lightGray = '#f8f9fa';
            const borderGray = '#e2e8f0';

            // Logo section - exact positioning as screenshot
            try {
                const logoWidth = 45;
                const logoHeight = 8;
                const c = await this.transaction.getExecutedQuery("d_asset_logo", {
                    loadAll: true,
                    file_name: "maventic_logo_2"
                });

                if (c && c.length > 0 && c[0]?.logo_attachment) {
                    const attachment = await c[0].logo_attachment.getAttachmentBlobP();
                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(attachment);
                    });

                    const base64Image = base64Data.split(",")[1];
                    doc.addImage({
                        imageData: base64Image,
                        format: 'PNG',
                        x: leftMargin,
                        y: 12,
                        width: logoWidth,
                        height: logoHeight,
                        alias: 'companyLogo',
                        compression: 'NONE'
                    });
                }
            } catch (error) {
                console.error("Logo loading error:", error);
            }

            let currentY = 25;

            // Company details - left side, exact text and formatting
            doc.setFontSize(10);
            doc.setTextColor(blackColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Maventic Innovative Solutions Pvt Ltd', leftMargin, currentY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            currentY += 4;
            doc.text('No.593, 60 Feet road, AECS Layout,', leftMargin, currentY);
            currentY += 3.5;
            doc.text('Brookfield,', leftMargin, currentY);
            currentY += 3.5;
            doc.text('Bangalore Karnataka 560037', leftMargin, currentY);
            currentY += 3.5;
            doc.text('India', leftMargin, currentY);
            currentY += 4;
            doc.setFont('helvetica', 'bold');
            doc.text('GSTIN: 29AAECM7803N1ZY', leftMargin, currentY);

            // Credit Note header - right side, exact positioning
            doc.setTextColor(blackColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text('Credit Note', rightMargin, 20, { align: 'right' });

            doc.setFontSize(10);
            const creditNoteNumber = creditNoteData.creditNoteNumber || '';
            doc.text(`# ${creditNoteNumber}`, rightMargin, 25, { align: 'right' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('Credits Remaining', rightMargin, 32.5, { align: 'right' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            const creditsRemaining = creditNoteData.creditsRemaining || 0;
            doc.text(creditsRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin, 36.5, { align: 'right' });

            // Bill To section - exact positioning and text
            currentY = 58;
            doc.setTextColor(blackColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('BILL TO', leftMargin, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(creditNoteData.companyName || '', leftMargin, currentY);

            // Handle address lines dynamically
            const addressLines = [];
            if (creditNoteData.streetAddress) {
                if (creditNoteData.streetAddress.includes(',')) {
                    const parts = creditNoteData.streetAddress.split(',');
                    parts.forEach(part => {
                        if (part.trim()) addressLines.push(part.trim());
                    });
                } else {
                    addressLines.push(creditNoteData.streetAddress);
                }
            }

            currentY += 3.5;
            addressLines.forEach(line => {
                if (line) {
                    doc.text(line, leftMargin, currentY);
                    currentY += 3.5;
                }
            });

            doc.setFont('helvetica', 'bold');
            doc.text(`GSTIN: ${creditNoteData.gstin || ''}`, leftMargin, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(`Place Of Supply: ${creditNoteData.placeOfSupply || ''}`, leftMargin, currentY);

            // Credit details - right side, exact positioning
            const rightDetailsX = pageWidth - 80;
            let creditDetailsY = 64;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            // Credit Date - use current date if not provided
            const creditDate = formatDateToDDMMYYYY(creditNoteData.creditDate || new Date());
            doc.text('Credit Date:', rightDetailsX, creditDetailsY);
            doc.text(creditDate, rightDetailsX + 35, creditDetailsY);

            creditDetailsY += 5;
            doc.text('Invoice#:', rightDetailsX, creditDetailsY);
            doc.text(creditNoteData.originalInvoiceNumber || '', rightDetailsX + 35, creditDetailsY);

            creditDetailsY += 5;
            doc.text('Invoice Date:', rightDetailsX, creditDetailsY);
            const invoiceDate = creditNoteData.originalInvoiceDate ? formatDateToDDMMYYYY(creditNoteData.originalInvoiceDate) : '';
            doc.text(invoiceDate, rightDetailsX + 35, creditDetailsY);

            // Table section - exact styling as screenshot
            currentY = 110;

            // Table header with gray background
            doc.setFillColor(240, 240, 240);
            doc.rect(leftMargin, currentY, contentWidth, 8, 'F');

            // Table border
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(leftMargin, currentY, contentWidth, 8, 'S');

            // Table header text - exact column positioning
            currentY += 5.5;
            doc.setTextColor(blackColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);

            doc.text('#', leftMargin + 3, currentY);
            doc.text('Item & Description', leftMargin + 12, currentY);
            doc.text('HSN/SAC', leftMargin + 100, currentY);
            doc.text('Qty', leftMargin + 125, currentY);
            doc.text('Rate', leftMargin + 140, currentY);
            doc.text('Amount', rightMargin - 3, currentY, { align: 'right' });

            // Table rows - use dynamic data
            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            // Get items from creditNoteData
            const items = creditNoteData.items || [];

            // Display all items
            items.forEach((item, index) => {
                doc.text((index + 1).toString(), leftMargin + 3, currentY);
                doc.text(`Project: ${item.description || ''}`, leftMargin + 12, currentY);
                doc.text(item.hsnSac || '', leftMargin + 100, currentY);
                doc.text((item.quantity || 0).toFixed(2), leftMargin + 125, currentY);
                doc.text((item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), leftMargin + 140, currentY);
                doc.text((item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });
                currentY += 6;
            });

            // Table bottom border
            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, currentY, rightMargin, currentY);

            // Totals section - use dynamic data with conditional tax display
            currentY += 10;
            const totalsX = pageWidth - 70;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            const subTotal = creditNoteData.subTotal || 0;
            const igstAmount = creditNoteData.igstAmount || 0;
            const cgstAmount = creditNoteData.cgstAmount || 0;
            const sgstAmount = creditNoteData.sgstAmount || 0;
            const totalAmount = creditNoteData.totalAmount || 0;
            const creditsUsed = creditNoteData.creditsUsed || totalAmount;
            const finalCreditsRemaining = creditNoteData.creditsRemaining || (totalAmount - creditsUsed);

            // Sub Total
            doc.text('Sub Total', totalsX, currentY);
            doc.text(subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });

            // Tax section - conditional display based on tax type
            if (igstAmount > 0) {
                // Display IGST only
                currentY += 5;
                doc.text('IGST (18%)', totalsX, currentY);
                doc.text(igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });
            } else if (cgstAmount > 0 || sgstAmount > 0) {
                // Display CGST and SGST
                if (cgstAmount > 0) {
                    currentY += 5;
                    doc.text('CGST (9%)', totalsX, currentY);
                    doc.text(cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });
                }
                if (sgstAmount > 0) {
                    currentY += 5;
                    doc.text('SGST (9%)', totalsX, currentY);
                    doc.text(sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });
                }
            }

            // Total line
            currentY += 3;
            doc.setDrawColor(200, 200, 200);
            doc.line(totalsX - 5, currentY, rightMargin, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Total', totalsX, currentY);
            doc.text(totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });

            currentY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text('Credits Used', totalsX, currentY);
            doc.text(`(-) ${creditsUsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightMargin - 3, currentY, { align: 'right' });

            // Credits Remaining line
            currentY += 3;
            doc.line(totalsX - 5, currentY, rightMargin, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Credits Remaining', totalsX, currentY);
            doc.text(finalCreditsRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightMargin - 3, currentY, { align: 'right' });

            // Amount in words section
            currentY += 15;
            let amountInWords = creditNoteData.amountInWords || "";
            try {
                if (this.numberToWords) {
                    amountInWords = `Indian Rupee ${this.numberToWords(totalAmount)} only`;
                }
            } catch (error) {
                console.error("Error converting number to words:", error);
            }

            const fullAmountText = `Total In Words: ${amountInWords}`;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(fullAmountText, leftMargin, currentY);

            // Authorized Signature
            currentY += 20;
            doc.setFont('helvetica', 'normal');
            doc.text('Authorized Signature', leftMargin, currentY);

            // Signature line
            doc.setDrawColor(0, 0, 0);
            doc.line(leftMargin + 50, currentY + 2, leftMargin + 120, currentY + 2);

            // QR Code and E-invoice details section
            if (creditNoteData.signedQR) {
                try {
                    let qrGenerator = await import("kloExternal/bwip-js-min");
                    let qrCanvas = document.createElement("canvas");

                    qrGenerator.toCanvas(qrCanvas, {
                        bcid: "qrcode",
                        includetext: false,
                        height: 15,
                        scale: 2,
                        text: creditNoteData.signedQR
                    });

                    const qrDataURL = qrCanvas.toDataURL("image/png");
                    const qrCodeSize = 25;
                    const qrY = pageHeight - 60;

                    doc.addImage(qrDataURL, 'PNG', leftMargin, qrY, qrCodeSize, qrCodeSize);

                    // E-invoice details - use dynamic data
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    const detailsX = leftMargin + 30;

                    doc.text('IRN:', detailsX, qrY + 5);
                    doc.text(creditNoteData.irnNumber || '', detailsX + 15, qrY + 5);

                    doc.text('Ack No.:', detailsX, qrY + 10);
                    doc.text(String(creditNoteData.ackNo) || '', detailsX + 15, qrY + 10);

                    doc.text('Ack Date:', detailsX, qrY + 15);
                    let ackDateStr = '';
                    if (creditNoteData.ackDate) {
                        const ackDate = new Date(creditNoteData.ackDate);
                        const yyyy = ackDate.getFullYear();
                        const mm = String(ackDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(ackDate.getDate()).padStart(2, '0');
                        const hh = String(ackDate.getHours()).padStart(2, '0');
                        const min = String(ackDate.getMinutes()).padStart(2, '0');
                        const ss = String(ackDate.getSeconds()).padStart(2, '0');
                        ackDateStr = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
                    }
                    doc.text(ackDateStr, detailsX + 15, qrY + 15);

                    doc.setTextColor(150, 150, 150);
                    doc.text('e-Invoicing detail(s) generated from the Government\'s e-Invoicing system.', detailsX, qrY + 22);
                    doc.setTextColor(0, 0, 0);

                } catch (qrError) {
                    console.error("QR code generation failed:", qrError);
                }
            }

            const filename = `${creditNoteNumber}.pdf`;
            const blob = doc.output("blob");

            if (fromBrowser) {
                this.showPDFPreviewDialog(blob, filename, doc);
            }

            sap.m.MessageToast.show("Credit note PDF generated successfully");
            return { blob, filename };

        } catch (error) {
            sap.m.MessageBox.error(error.message || "An error occurred while generating credit note PDF", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK]
            });
            throw error;
        }
    }

    public async triggerCreditNotePdf(oEvent, params, creditNoteNumber, eCreditNoteEInvoicingData) {
        const busyDialog = new sap.m.BusyDialog({ text: "Generating credit note PDF, please wait..." });
        busyDialog.open();

        try {
            const listData = await this.tm.getTN("invoice_list_hdr_table_list").getData();
            const selectedIndices = await this.tm.getTN("invoice_list_hdr_table_list").getSelectedIndices();

            if (selectedIndices.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error("No credit notes selected", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return null;
            }

            const selectedCreditNotes = selectedIndices.map(index => listData[index]);
            const fromBrowser = params === false ? false : params.fromBrowser;
            let lastPdfResponse = null;

            for (const creditNote of selectedCreditNotes) {
                try {
                    await creditNote.r_invoice_list_request?.fetch();
                    const creditNotesInGroup = creditNote.r_invoice_list_request;

                    busyDialog.setText(`Generating PDF for credit note ${creditNotesInGroup[0].inv_request_id}...`);

                    lastPdfResponse = await this.processMultipleCreditNotes(
                        creditNotesInGroup,
                        fromBrowser,
                        creditNoteNumber,
                        eCreditNoteEInvoicingData
                    );

                } catch (error) {
                    console.error(`Error generating PDF for credit note ${creditNote.inv_request_id}:`, error);
                    continue;
                }
            }

            await this.tm.commitP();
            sap.m.MessageToast.show("Credit note PDF generation completed");
            return lastPdfResponse;

        } catch (error) {
            console.error("Error generating credit note PDF:", error);
            sap.m.MessageBox.error(error.message || "An error occurred during credit note PDF generation", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK]
            });
            return null;

        } finally {
            busyDialog.close();
        }
    }

    public async onClickingOnCreditNoteAmount(oEvent: sap.ui.base.Event) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/invoice_screen_list/", ''));
        let listData = await this.tm.getTN("invoice_screen_list").getData()[index];

        let amountData: { amount_type: string, amount: number }[] = [];
        let totalInvoiceAmount = parseFloat(listData.total_invoice) || 0;

        amountData.push({
            amount_type: "Total Amount",
            amount: totalInvoiceAmount
        });

        let totalCreditNoteAmount = 0;

        if (listData.r_invoice_credit_note && listData.r_invoice_credit_note.length > 0) {
            let relationLength = listData.r_invoice_credit_note.length;

            listData.r_invoice_credit_note.forEach((item: any, i: number) => {
                let creditNoteAmount = parseFloat(item.credit_note_amount) || 0;
                totalCreditNoteAmount += creditNoteAmount;

                let date = new Date(item.credit_note_date);
                let formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                let creditNoteNumber = relationLength - i;

                amountData.push({
                    amount_type: `Credit Note ${creditNoteNumber} (${formattedDate})`,
                    amount: creditNoteAmount
                });
            });
        }

        let balanceAmount = totalInvoiceAmount - totalCreditNoteAmount;

        amountData.push({
            amount_type: "Balance Amount",
            amount: balanceAmount
        });

        await this.tm.getTN("credit_note_other").setData(amountData);
        await this.openDialog("pa_cnote_details");
    }

    public async downloadCreditNotePDF(creditNoteNumber) {
        try {
            const creditNoteData = await this.transaction.getExecutedQuery('d_o2c_invoice_credit_note', {
                loadAll: true,
                credit_note_number: creditNoteNumber
            });

            if (creditNoteData && creditNoteData.length > 0) {
                await creditNoteData[0].credit_note_pdf.downloadAttachP();
            } else {
                sap.m.MessageBox.error("Credit note not found", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
            }
        } catch (error) {
            console.error("Error downloading credit note PDF:", error);
            sap.m.MessageBox.error(error.message || "An error occurred while downloading the credit note PDF", {
                title: "Error",
                actions: [sap.m.MessageBox.Action.OK]
            });
        }
    }

    public async zohoCreditNoteGeneration(creditNoteNumber) {
        const busyDialog = new sap.m.BusyDialog({
            text: "Please wait, generating Zoho credit notes..."
        });
        busyDialog.open();

        try {
            const creditNoteHeader = await this.transaction.getExecutedQuery('d_o2c_invoice_credit_note', {
                credit_note_number: creditNoteNumber,
                loadAll: true
            });

            if (!creditNoteHeader || creditNoteHeader.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error(`Credit note ${creditNoteNumber} not found`, {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            const creditNoteData = creditNoteHeader[0];

            // Fetch Zoho credentials
            const zohoCredentials = await this.transaction.getExecutedQuery('d_o2c_invoice_zoho_config', {
                loadAll: true
            });

            if (!zohoCredentials || zohoCredentials.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error("Zoho configuration not found", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            const zoho_grant_type = zohoCredentials[0].zoho_grant_type;
            const zoho_redirect_uri = zohoCredentials[0].zoho_redirect_uri;
            const zoho_client_secret = zohoCredentials[0].zoho_client_secrets;
            const zoho_client_id = zohoCredentials[0].zoho_client_ids;
            const zoho_refresh_token = zohoCredentials[0].zoho_r_token;
            const organizationId = zohoCredentials[0].zoho_organization_id;

            // Fetch credit note line items
            await creditNoteData.r_credit_note_hdr_item?.fetch();
            const creditNoteLineItems = creditNoteData.r_credit_note_hdr_item || [];

            if (!creditNoteLineItems || creditNoteLineItems.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error("No line items found for this credit note", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            // Get invoice number from credit note header
            const invoiceNumber = creditNoteData.invoice_number;

            if (!invoiceNumber) {
                busyDialog.close();
                sap.m.MessageBox.error("Invoice number not found in credit note", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            // Fetch the original invoice to get customer details
            const invoiceData = await this.transaction.getExecutedQuery('d_invoice_request_hdr_table', {
                inv_request_id: invoiceNumber,
                loadAll: true
            });

            if (!invoiceData || invoiceData.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error(`Original invoice ${invoiceNumber} not found`, {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            const originalInvoice = invoiceData[0];

            // Fetch customer's Zoho external ID using the customer from invoice
            const zohoExternalID = await this.transaction.getExecutedQuery('d_o2c_customers', {
                customer_id: originalInvoice.reg_client_name,
                loadAll: true
            });

            if (!zohoExternalID || !zohoExternalID[0]?.external_customer_id) {
                busyDialog.close();
                sap.m.MessageBox.error("Customer not mapped in Zoho. Please map the customer first.", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            // ================================================
            // BUILD LINE ITEMS FROM CREDIT NOTE LINE ITEMS
            // ================================================
            const lineItems = [];

            for (const creditLineItem of creditNoteLineItems) {
                let description = "";
                let sacCode = "";
                let quantity = 1;
                let projectName = "";
                const itemInvoiceNumber = creditLineItem.inv_number;

                // ✅ Check if this is a split line item credit note
                if (creditLineItem.invoice_split_line_item_guid) {
                    // ================================================
                    // CASE 1: Credit note for a SPECIFIC line item
                    // ================================================
                    const lineItemData = await this.transaction.getExecutedQuery('d_o2c_invoice_list_item', {
                        my_key: creditLineItem.invoice_split_line_item_guid,
                        loadAll: true
                    });

                    if (lineItemData && lineItemData.length > 0) {
                        const lineItem = lineItemData[0];

                        // Get line item details
                        description = lineItem.inv_primary_desc || "";
                        sacCode = lineItem.sac_code || "";
                        quantity = parseFloat(lineItem.quantity || 1);

                        // Fetch parent invoice header for project name
                        await lineItem.r_list_header?.fetch();
                        const invoice = lineItem.r_invoice_list_hdr?.[0];
                        projectName = invoice?.reg_project_name || "";

                        const creditAmount = parseFloat(creditLineItem.credit_note_amount || 0);
                        const rate = quantity > 0 ? creditAmount / quantity : creditAmount;

                        lineItems.push({
                            name: description,
                            description: `Credit note for ${projectName}`,
                            rate: rate,
                            quantity: quantity,
                            hsn_or_sac: parseInt(sacCode || "0"),
                        });
                    } else {
                        console.error(`Line item not found for GUID: ${creditLineItem.invoice_split_line_item_guid}`);
                    }

                } else {
                    // ================================================
                    // CASE 2: Credit note for header-level (no split line items)
                    // ================================================
                    const invoiceHeaderData = await this.transaction.getExecutedQuery('d_invoice_request_hdr_table', {
                        invoice_guid: creditLineItem.invoice_line_item_guid,
                        loadAll: true
                    });

                    if (invoiceHeaderData && invoiceHeaderData.length > 0) {
                        const invoice = invoiceHeaderData[0];

                        // Get header-level details
                        description = invoice.reg_milestone_name || "";
                        sacCode = invoice.sac_code || "";
                        quantity = 1;
                        projectName = invoice.reg_project_name || "";

                        const creditAmount = parseFloat(creditLineItem.credit_note_amount || 0);

                        lineItems.push({
                            name: description,
                            description: `Credit note for ${projectName}`,
                            rate: creditAmount,
                            quantity: quantity,
                            hsn_or_sac: parseInt(sacCode || "0"),
                        });
                    } else {
                        console.error(`Invoice header not found for GUID: ${creditLineItem.invoice_line_item_guid}`);
                    }
                }
            }

            if (lineItems.length === 0) {
                busyDialog.close();
                sap.m.MessageBox.error("No valid line items found for Zoho credit note", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            // Get customer GST details from original invoice

            const gstNumber = originalInvoice.reg_customer_gstin
            const gstTreatment = originalInvoice.invoice_origin_country !== 'IND' ? "overseas" : "business_gst";

            busyDialog.setText(`Sending credit note ${creditNoteNumber} to Zoho...`);

            // Call backend service with correct parameters
            const response = await KloAjax.getInstance().perFormAction(
                AUTHORIZATION_TYPE.RUNTIME,
                {
                    url: System.gi_URI().getAppServiceUrl(
                        this.getFlavor(),
                        this.getFlavorVersion(),
                        "zohoCreditNoteGeneration",
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
                        creditnote_number: creditNoteNumber,
                        creditnote_date: creditNoteData.credit_note_date || new Date(),
                        reference_invoice_number: invoiceNumber,
                        invoice_id: originalInvoice.zoho_invoice_id,
                        notes: `Credit note for invoice ${invoiceNumber}`,
                    },
                    method: "POST"
                }
            );

            busyDialog.close();

            // Handle response
            if (response.status === 'Failed') {
                sap.m.MessageBox.error(
                    response.message || response.error || "Failed to create credit note in Zoho",
                    {
                        title: "Error",
                        actions: [sap.m.MessageBox.Action.OK]
                    }
                );
            } else {
                sap.m.MessageBox.success(
                    `Credit note ${creditNoteNumber} has been successfully sent to Zoho!`,
                    {
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK]
                    }
                );
            }

        } catch (error) {
            busyDialog.close();
            console.error("Error in Zoho credit note generation:", error);
            sap.m.MessageBox.error(
                error.message || "An unexpected error occurred during Zoho credit note generation",
                {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                }
            );
        }
    }
}