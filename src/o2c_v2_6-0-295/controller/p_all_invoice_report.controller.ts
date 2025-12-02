import { KloEntity, KloEntitySet } from 'kloBo_6-0-27';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee_org } from 'o2c_v2/entity/d_o2c_employee_org';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_all_invoice_report")
let po_no;
let isValid;
export default class p_all_invoice_report extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public originalData;

    public async onPageEnter() {
        const busyDialog = new sap.m.BusyDialog({ text: "Please Wait, Data is fetching..." });
        busyDialog.open();

        this.tm.getTN("invoice_list").setData({});
        this.tm.getTN("search_list").setData({});
        this.tm.getTN("status_vh").setData({});
        this.tm.getTN("item_category").setData({});

        const [milestoneList, scheduleList, volumeList, customerNameList] = await Promise.all([
            this.transaction.getExecutedQuery('d_o2c_so_milestone', {
                loadAll: true,
                partialSelect: ['billing_milestone_name', 'invoice_no', 'invoice_date', 'actual_date', 'amount', 'status', 'percentage'],
                expandAll: "r_milestone_item,r_milestone_item/r_item_header,r_milestone_item/r_item_attachment,r_milestone_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_so_schedule', {
                loadAll: true,
                partialSelect: ['description', 'invoice_no', 'invoice_date', 'actual_date', 'expected_amount', 'status'],
                expandAll: "r_schedule_item,r_schedule_item/r_item_header,r_schedule_item/r_item_attachment,r_schedule_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_volume_based', {
                loadAll: true,
                partialSelect: ['milestone_description', 'invoice_no', 'invoice_date', 'milestone_date', 'amount', 'invoice_status'],
                expandAll: "r_volume_item,r_volume_item/r_item_header,r_volume_item/r_item_attachment,r_volume_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_customers', {
                loadAll: true,
                partialSelect: ['customer_id', 'customer_name']
            })
        ]);

        const customerMap = new Map(customerNameList.map(customer => [customer.customer_id, customer.customer_name]));

        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
        const loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
            loadAll: true, 'employee_id': userID, 'active_till': new Date()
        });
        const PCset = new Set(loginOrg.map(org => org.profit_centre));

        const invoiceData = [];

        const getProfitCenterData = async (rItemHeader) => {
            try {
                return await rItemHeader.r_profit_center;
            } catch (error) {
                console.error("Failed to fetch r_profit_center:", error);
                return [];
            }
        };

        const shouldIncludeInvoice = async (rItemHeader, rItemAttachment) => {
            const profitCenter = await getProfitCenterData(rItemHeader);

            if (!(rItemAttachment &&
                ((rItemAttachment.approval_status === "Approved" && rItemHeader.s_status === "Approved") || rItemHeader.s_status === "Closed"))) {
                return { include: false };
            }

            if (userRole === "TEAM_HEAD") {
                const pc = profitCenter?.filter(p => p.primary_profit_center === true && PCset.has(p.profit_center));
                return { include: pc.length > 0, profitCenter };
            }

            if (userRole === "MANAGER") {
                const isManager = profitCenter?.some(p => p.project_manager?.toUpperCase() === userID.toUpperCase());
                return { include: isManager, profitCenter };
            }

            return { include: true, profitCenter };
        };

        const formatServiceMonth = (date) =>
            date ? new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' }) : '';

        // ---- Milestone Loop ----
        for (const item of milestoneList) {
            const rMilestoneItem = item.r_milestone_item?.[0];
            const rItemHeader = rMilestoneItem?.r_item_header?.[0];
            const rItemAttachment = rMilestoneItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "Milestone",
                invoice_desc: item.billing_milestone_name,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.actual_date,
                amount: item.amount,
                status: item.status,
                unique_key: item.billing_milestone,
                gross_value: rMilestoneItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                percentage: item.percentage,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rMilestoneItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.actual_date)
            });
        }

        // ---- Schedule Loop ----
        for (const item of scheduleList) {
            const rScheduleItem = item.r_schedule_item?.[0];
            const rItemHeader = rScheduleItem?.r_item_header?.[0];
            const rItemAttachment = rScheduleItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "T&M,Monthly Fixed",
                invoice_desc: item.description,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.actual_date,
                amount: item.expected_amount,
                status: item.status,
                unique_key: item.schedule_no,
                gross_value: rScheduleItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rScheduleItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.actual_date)
            });
        }

        // ---- Volume Loop ----
        for (const item of volumeList) {
            const rVolumeItem = item.r_volume_item?.[0];
            const rItemHeader = rVolumeItem?.r_item_header?.[0];
            const rItemAttachment = rVolumeItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "Volume",
                invoice_desc: item.milestone_description,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.milestone_date,
                amount: item.amount,
                status: item.invoice_status,
                unique_key: item.billing_milestone,
                gross_value: rVolumeItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rVolumeItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.milestone_date)
            });
        }

        await this.tm.getTN("invoice_list").setData(invoiceData);

        await this.tm.getTN("status_vh").setData([
            { key: "InvCan", description: "Invoice Cancelled" },
            { key: "Invoiced", description: "Invoiced" },
            { key: "OnHold", description: "On Hold" },
            { key: "Pending", description: "Pending" },
            { key: "Paid", description: "Payment Received" },
            { key: "InvReq", description: "Ready" },
            { key: "NotRequired", description: "Invoice Not Reqired" }
        ]);

        await this.tm.getTN("item_category").setData([
            { key: "PROJFEE", description: "Project Fee" },
            { key: "EXPENSE", description: "Expense" },
            { key: "LISC", description: "License" },
            { key: "USRLISC", description: "User License" },
            { key: "API", description: "API" },
            { key: "AMC", description: "AMC" }
        ]);

        await this.tm.getTN("po_number").setData({ dirty: false });

        busyDialog.close();
    }

    public async onReset() {

        if (this.getMode() === 'EDIT') {
            sap.m.MessageBox.warning('Please save your changes before resetting the screen to avoid losing any progress.', {
                title: 'Warning',
            });
            return;
        }
        const busyDialog = new sap.m.BusyDialog({ text: "Please Wait, Data is fetching..." });
        busyDialog.open();

        this.tm.getTN("invoice_list").setData({});
        this.tm.getTN("search_list").setData({});
        this.tm.getTN("status_vh").setData({});
        this.tm.getTN("item_category").setData({});

        const [milestoneList, scheduleList, volumeList, customerNameList] = await Promise.all([
            this.transaction.getExecutedQuery('d_o2c_so_milestone', {
                loadAll: true,
                partialSelect: ['billing_milestone_name', 'invoice_no', 'invoice_date', 'actual_date', 'amount', 'status', 'percentage'],
                expandAll: "r_milestone_item,r_milestone_item/r_item_header,r_milestone_item/r_item_attachment,r_milestone_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_so_schedule', {
                loadAll: true,
                partialSelect: ['description', 'invoice_no', 'invoice_date', 'actual_date', 'expected_amount', 'status'],
                expandAll: "r_schedule_item,r_schedule_item/r_item_header,r_schedule_item/r_item_attachment,r_schedule_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_volume_based', {
                loadAll: true,
                partialSelect: ['milestone_description', 'invoice_no', 'invoice_date', 'milestone_date', 'amount', 'invoice_status'],
                expandAll: "r_volume_item,r_volume_item/r_item_header,r_volume_item/r_item_attachment,r_volume_item/r_item_header/r_profit_center"
            }),
            this.transaction.getExecutedQuery('d_o2c_customers', {
                loadAll: true,
                partialSelect: ['customer_id', 'customer_name']
            })
        ]);

        const customerMap = new Map(customerNameList.map(customer => [customer.customer_id, customer.customer_name]));

        const userID = (await this.transaction.get$User()).login_id;
        const userRole = (await this.transaction.get$Role()).role_id;
        const loginOrg = await this.transaction.getExecutedQuery('q_current_profit_center', {
            loadAll: true, 'employee_id': userID, 'active_till': new Date()
        });
        const PCset = new Set(loginOrg.map(org => org.profit_centre));

        const invoiceData = [];

        const getProfitCenterData = async (rItemHeader) => {
            try {
                return await rItemHeader.r_profit_center;
            } catch (error) {
                console.error("Failed to fetch r_profit_center:", error);
                return [];
            }
        };

        const shouldIncludeInvoice = async (rItemHeader, rItemAttachment) => {
            const profitCenter = await getProfitCenterData(rItemHeader);

            if (!(rItemAttachment &&
                ((rItemAttachment.approval_status === "Approved" && rItemHeader.s_status === "Approved") || rItemHeader.s_status === "Closed"))) {
                return { include: false };
            }

            if (userRole === "TEAM_HEAD") {
                const pc = profitCenter?.filter(p => p.primary_profit_center === true && PCset.has(p.profit_center));
                return { include: pc.length > 0, profitCenter };
            }

            if (userRole === "MANAGER") {
                const isManager = profitCenter?.some(p => p.project_manager?.toUpperCase() === userID.toUpperCase());
                return { include: isManager, profitCenter };
            }

            return { include: true, profitCenter };
        };

        const formatServiceMonth = (date) =>
            date ? new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' }) : '';

        // ---- Milestone Loop ----
        for (const item of milestoneList) {
            const rMilestoneItem = item.r_milestone_item?.[0];
            const rItemHeader = rMilestoneItem?.r_item_header?.[0];
            const rItemAttachment = rMilestoneItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "Milestone",
                invoice_desc: item.billing_milestone_name,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.actual_date,
                amount: item.amount,
                status: item.status,
                unique_key: item.billing_milestone,
                gross_value: rMilestoneItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                percentage: item.percentage,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rMilestoneItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.actual_date)
            });
        }

        // ---- Schedule Loop ----
        for (const item of scheduleList) {
            const rScheduleItem = item.r_schedule_item?.[0];
            const rItemHeader = rScheduleItem?.r_item_header?.[0];
            const rItemAttachment = rScheduleItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "T&M,Monthly Fixed",
                invoice_desc: item.description,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.actual_date,
                amount: item.expected_amount,
                status: item.status,
                unique_key: item.schedule_no,
                gross_value: rScheduleItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rScheduleItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.actual_date)
            });
        }

        // ---- Volume Loop ----
        for (const item of volumeList) {
            const rVolumeItem = item.r_volume_item?.[0];
            const rItemHeader = rVolumeItem?.r_item_header?.[0];
            const rItemAttachment = rVolumeItem?.r_item_attachment?.[0];
            if (!rItemHeader || !rItemAttachment) continue;

            const { include, profitCenter } = await shouldIncludeInvoice(rItemHeader, rItemAttachment);
            if (!include) continue;

            const customer_name = customerMap.get(rItemHeader.bill_to_customer) || 'Unknown Customer';
            const primaryPC = profitCenter?.find(p => p.primary_profit_center);
            invoiceData.push({
                type: "Volume",
                invoice_desc: item.milestone_description,
                invoice_no: item.invoice_no,
                invoice_date: item.invoice_date,
                actual_date: item.milestone_date,
                amount: item.amount,
                status: item.invoice_status,
                unique_key: item.billing_milestone,
                gross_value: rVolumeItem.item_value,
                is_object_dirty: false,
                so: rItemHeader.so,
                so_guid: rItemHeader.so_guid,
                po_no: rItemAttachment.po_no,
                customer_name,
                created_by: rItemHeader.s_created_by,
                currency: rItemHeader.currency,
                item_category: rVolumeItem.item_category,
                project_name: rItemHeader.project_name,
                profit_center: primaryPC?.profit_center || '',
                project_manager: primaryPC?.project_manager || '',
                service_month: formatServiceMonth(item.milestone_date)
            });
        }

        await this.tm.getTN("invoice_list").setData(invoiceData);

        await this.tm.getTN("status_vh").setData([
            { key: "InvCan", description: "Invoice Cancelled" },
            { key: "Invoiced", description: "Invoiced" },
            { key: "OnHold", description: "On Hold" },
            { key: "Pending", description: "Pending" },
            { key: "Paid", description: "Payment Received" },
            { key: "InvReq", description: "Ready" },
            { key: "NotRequired", description: "Invoice Not Reqired" }
        ]);

        await this.tm.getTN("item_category").setData([
            { key: "PROJFEE", description: "Project Fee" },
            { key: "EXPENSE", description: "Expense" },
            { key: "LISC", description: "License" },
            { key: "USRLISC", description: "User License" },
            { key: "API", description: "API" },
            { key: "AMC", description: "AMC" }
        ]);

        await this.tm.getTN("po_number").setData({ dirty: false });

        busyDialog.close();
    }

    public async milestoneDateSearch() {
        let milestone_start_date = await this.tm.getTN("search_list").getData().milestone_date_range_from;
        let milestone_end_date = await this.tm.getTN("search_list").getData().milestone_date_range_to;
        let listData = await this.tm.getTN("invoice_list").getData();
        let filteredData = listData.filter(item => {
            if (!item.actual_date) return false;
            const d = new Date(item.actual_date);
            return d >= milestone_start_date && d <= milestone_end_date;
        });
        await this.tm.getTN("invoice_list").setData(filteredData);

    }
    public async invoiceDateSearch() {
        let invoice_start_date = await this.tm.getTN("search_list").getData().invoice_date_range_from;
        let invoice_end_date = await this.tm.getTN("search_list").getData().invoice_date_range_to;
        let listData = await this.tm.getTN("invoice_list").getData();
        let filteredData = listData.filter(item => {
            if (!item.invoice_date) return false;
            const d = new Date(item.invoice_date);
            return d >= invoice_start_date && d <= invoice_end_date;
        });
        await this.tm.getTN("invoice_list").setData(filteredData);

    }
    public async onPoNoSearch() {
        let po_no = await this.tm.getTN("search_list").getData().po_no;
        let listData = await this.tm.getTN("invoice_list").getData();
        let filteredData = listData.filter(item => item.po_no === po_no);
        await this.tm.getTN("invoice_list").setData(filteredData);
    }
    public async onStatusSearch() {
        let status = await this.tm.getTN("search_list").getData().status;
        let listData = await this.tm.getTN("invoice_list").getData();
        let filteredData = listData.filter(item => item.status === status);
        await this.tm.getTN("invoice_list").setData(filteredData);
    }
    public async customerNameSearch() {
        let searchTerm = (await this.tm.getTN("search_list").getData().customer_name || "").toLowerCase();
        let listData = await this.tm.getTN("invoice_list").getData();
        let filteredData = listData.filter(item => item.customer_name.toLowerCase().includes(searchTerm));
        await this.tm.getTN("invoice_list").setData(filteredData);
    }

    public async onTypeSearch() {
        let typeInput = await this.tm.getTN("search_list").getData().type.toLowerCase().replace(/\s+/g, '');
        let listData = await this.tm.getTN("invoice_list").getData();

        const validTypes = [
            { type: "Milestone", normalized: "milestone" },
            { type: "T&M,Monthly Fixed", normalized: "t&m,monthlyfixed" },
            { type: "Volume", normalized: "volume" }
        ];

        let filteredData = listData.filter(item => {
            let itemType = item.type.toLowerCase().replace(/\s+/g, '');

            // If the input matches or is a substring of any valid type
            return validTypes.some(validType => validType.normalized.includes(typeInput) && itemType === validType.normalized);
        });

        await this.tm.getTN("invoice_list").setData(filteredData);
    }

    public async onInvoiceSearch() {
        let invoice_number = await this.tm.getTN("search_list").getData().invoice_number;
        let listData = await this.tm.getTN("invoice_list").getData();

        let filteredData = listData.filter(item =>
            item.invoice_no &&
            item.invoice_no.toLowerCase().includes(invoice_number.toLowerCase())
        );

        await this.tm.getTN("invoice_list").setData(filteredData);
    }


    public async onSoSearch() {
        let so = await this.tm.getTN("search_list").getData().so
        let listData = await this.tm.getTN("invoice_list").getData()
        let filteredData = listData.filter(item => item.so === so);
        await this.tm.getTN("invoice_list").setData(filteredData);
    }

    //Old code
    // public async onSave() {
    //     let invoice_list = this.tm.getTN('invoice_list').getData();
    //     let updatedRecords = invoice_list.filter(x => x.is_object_dirty === true);

    //     let milestone_unique_keys = [];
    //     let schedule_unique_keys = [];
    //     let volume_unique_keys = [];

    //     updatedRecords.forEach(record => {
    //         if (record.type === "Milestone") {
    //             milestone_unique_keys.push(record.unique_key);
    //         } else if (record.type === "T&M,Monthly Fixed") {
    //             schedule_unique_keys.push(record.unique_key);
    //         } else if (record.type === "Volume") {
    //             volume_unique_keys.push(record.unique_key);
    //         }
    //     });

    //     let milestoneData = [];
    //     let scheduleData = [];
    //     let volumeData = [];

    //     if (milestone_unique_keys.length > 0) {
    //         milestoneData = await this.transaction.getExecutedQuery('d_o2c_so_milestone', {
    //             loadAll: true,
    //             billing_milestone: milestone_unique_keys,
    //             partialSelect: ['billing_milestone_name', 'invoice_no', 'invoice_date', 'actual_date', 'amount', 'status']
    //         });

    //         milestoneData.forEach(milestone => {
    //             let updatedRecord = updatedRecords.find(record => record.unique_key === milestone.billing_milestone);
    //             if (updatedRecord) {
    //                 milestone.billing_milestone_name = updatedRecord.invoice_desc;
    //                 milestone.invoice_no = updatedRecord.invoice_no;
    //                 milestone.invoice_date = updatedRecord.invoice_date;
    //                 milestone.actual_date = updatedRecord.actual_date;
    //                 milestone.amount = updatedRecord.amount;
    //                 milestone.status = updatedRecord.status;
    //             }
    //         });
    //     }

    //     if (schedule_unique_keys.length > 0) {
    //         scheduleData = await this.transaction.getExecutedQuery('d_o2c_so_schedule', {
    //             loadAll: true,
    //             schedule_no: schedule_unique_keys,
    //             partialSelect: ['description', 'invoice_no', 'invoice_date', 'actual_date', 'expected_amount', 'status']
    //         });

    //         scheduleData.forEach(schedule => {
    //             let updatedRecord = updatedRecords.find(record => record.unique_key === schedule.schedule_no);
    //             if (updatedRecord) {
    //                 schedule.description = updatedRecord.invoice_desc;
    //                 schedule.invoice_no = updatedRecord.invoice_no;
    //                 schedule.invoice_date = updatedRecord.invoice_date;
    //                 schedule.actual_date = updatedRecord.actual_date;
    //                 schedule.expected_amount = updatedRecord.amount;
    //                 schedule.status = updatedRecord.status;
    //             }
    //         });
    //     }

    //     if (volume_unique_keys.length > 0) {
    //         volumeData = await this.transaction.getExecutedQuery('d_o2c_volume_based', {
    //             loadAll: true,
    //             billing_milestone: volume_unique_keys,
    //             partialSelect: ['milestone_description', 'invoice_no', 'invoice_date', 'milestone_date', 'amount', 'invoice_status']
    //         });

    //         volumeData.forEach(volume => {
    //             let updatedRecord = updatedRecords.find(record => record.unique_key === volume.billing_milestone);
    //             if (updatedRecord) {
    //                 volume.milestone_description = updatedRecord.invoice_desc;
    //                 volume.invoice_no = updatedRecord.invoice_no;
    //                 volume.invoice_date = updatedRecord.invoice_date;
    //                 volume.milestone_date = updatedRecord.actual_date;
    //                 volume.amount = updatedRecord.amount;
    //                 volume.invoice_status = updatedRecord.status;
    //             }
    //         });
    //     }

    //     await this.tm.commitP("Save Successfully", "Save Failed", true, true);
    // }


    public async onSave() {
        let invoice_list = this.tm.getTN('invoice_list').getData();
        let updatedRecords = invoice_list.filter(x => x.is_object_dirty === true);

        let milestone_unique_keys = [];
        let schedule_unique_keys = [];
        let volume_unique_keys = [];

        updatedRecords.forEach(record => {
            if (record.type === "Milestone") {
                milestone_unique_keys.push(record.unique_key);
            } else if (record.type === "T&M,Monthly Fixed") {
                schedule_unique_keys.push(record.unique_key);
            } else if (record.type === "Volume") {
                volume_unique_keys.push(record.unique_key);
            }
        });

        if (!isValid) {
            sap.m.MessageBox.error(`The amount of all the highlighted line items should be equal to Gross Value for PO Number: ${po_no}`);
            return;
        }

        let milestoneData = [];
        let scheduleData = [];
        let volumeData = [];

        if (milestone_unique_keys.length > 0) {
            milestoneData = await this.transaction.getExecutedQuery('d_o2c_so_milestone', {
                loadAll: true,
                billing_milestone: milestone_unique_keys,
                partialSelect: ['billing_milestone_name', 'invoice_no', 'invoice_date', 'actual_date', 'amount', 'status']
            });

            milestoneData.forEach(milestone => {
                let updatedRecord = updatedRecords.find(record => record.unique_key === milestone.billing_milestone);
                if (updatedRecord) {
                    milestone.billing_milestone_name = updatedRecord.invoice_desc;
                    milestone.invoice_no = updatedRecord.invoice_no;
                    milestone.invoice_date = updatedRecord.invoice_date;
                    milestone.actual_date = updatedRecord.actual_date;
                    milestone.amount = updatedRecord.amount;
                    milestone.status = updatedRecord.status;
                }
            });
        }

        if (schedule_unique_keys.length > 0) {
            scheduleData = await this.transaction.getExecutedQuery('d_o2c_so_schedule', {
                loadAll: true,
                schedule_no: schedule_unique_keys,
                partialSelect: ['description', 'invoice_no', 'invoice_date', 'actual_date', 'expected_amount', 'status']
            });

            scheduleData.forEach(schedule => {
                let updatedRecord = updatedRecords.find(record => record.unique_key === schedule.schedule_no);
                if (updatedRecord) {
                    schedule.description = updatedRecord.invoice_desc;
                    schedule.invoice_no = updatedRecord.invoice_no;
                    schedule.invoice_date = updatedRecord.invoice_date;
                    schedule.actual_date = updatedRecord.actual_date;
                    schedule.expected_amount = updatedRecord.amount;
                    schedule.status = updatedRecord.status;
                }
            });
        }

        if (volume_unique_keys.length > 0) {
            volumeData = await this.transaction.getExecutedQuery('d_o2c_volume_based', {
                loadAll: true,
                billing_milestone: volume_unique_keys,
                partialSelect: ['milestone_description', 'invoice_no', 'invoice_date', 'milestone_date', 'amount', 'invoice_status']
            });

            volumeData.forEach(volume => {
                let updatedRecord = updatedRecords.find(record => record.unique_key === volume.billing_milestone);
                if (updatedRecord) {
                    volume.milestone_description = updatedRecord.invoice_desc;
                    volume.invoice_no = updatedRecord.invoice_no;
                    volume.invoice_date = updatedRecord.invoice_date;
                    volume.milestone_date = updatedRecord.actual_date;
                    volume.amount = updatedRecord.amount;
                    volume.invoice_status = updatedRecord.status;
                }
            });
        }

        await this.tm.commitP("Save Successfully", "Save Failed", true, true);
        await this.tm.getTN("po_number").setData({ "dirty": false });


    }

    public async download_excel_file() {
        try {
            if (!window.XLSX) {
                const path = "kloExternal/xlsx.bundle";
                await import(path);
            }

            const fileName = `InvoiceReport.xlsx`;
            let listData = this.tm.getTN("invoice_list").getData();
            listData = listData.map(({ unique_key, is_object_dirty, ...rest }) => rest);

            // Fetch reference data
            const [profitCenters, employees] = await Promise.all([
                this.transaction.getExecutedQuery('d_o2c_profit_centre', {
                    loadAll: true,
                    partialSelect: ['profit_center', 'name']
                }),
                this.transaction.getExecutedQuery('d_o2c_employee', {
                    loadAll: true,
                    partialSelect: ['employee_id', 'full_name']
                })
            ]);

            // Create maps
            const profitCenterMap = {};
            profitCenters.forEach(pc => {
                profitCenterMap[pc.profit_center] = pc.name;
            });

            const employeeMap = {};
            employees.forEach(emp => {
                employeeMap[emp.employee_id] = emp.full_name;
            });

            const categoryMap = {
                "PROJFEE": "Project Fee",
                "EXPENSE": "Expense",
                "LISC": "License",
                "USRLISC": "User License",
                "API": "API",
                "AMC": "AMC"
            };

            const columnOrder = [
                'SO',
                'PO Number',
                'Gross Value',
                'Project Name',
                'Type',
                'Item Category',
                'Customer Name',
                'Currency',
                'Created By',
                'Invoice Description',
                'Milestone Date',
                'Service Month',
                'Invoice Number',
                'Invoice Date',
                'Amount',
                'Profit Center',
                'Project Manager',
                'Status'
            ];

            listData = listData.map(row => {
                const createdByName = employeeMap[(row.created_by).toUpperCase()];
                const projectManagerName = employeeMap[row.project_manager];

                return {
                    'SO': row.so,
                    'PO Number': row.po_no,
                    'Gross Value': row.gross_value,
                    'Project Name': row.project_name,
                    'Type': row.type,
                    'Item Category': categoryMap[row.item_category] || row.item_category,
                    'Customer Name': row.customer_name,
                    'Currency': row.currency,
                    'Created By': createdByName ? createdByName : row.created_by.toUpperCase(),
                    'Invoice Description': row.invoice_desc,
                    'Milestone Date': row.actual_date,
                    'Service Month': row.service_month,
                    'Invoice Number': row.invoice_no,
                    'Invoice Date': row.invoice_date,
                    'Amount': row.amount,
                    'Profit Center': profitCenterMap[row.profit_center] || row.profit_center,
                    'Project Manager': projectManagerName || row.project_manager,
                    'Status': row.status
                };
            });

            const ws = XLSX.utils.json_to_sheet(listData, { header: columnOrder });
            ws['!cols'] = new Array(columnOrder.length).fill({ wch: 20 });

            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ c: C, r: 0 });
                if (!ws[cell_address]) continue;
                ws[cell_address].s = {
                    fill: {
                        fgColor: { rgb: "FFFF00" }
                    }
                };
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "InvoiceReport");

            XLSX.writeFile(wb, fileName, { compression: true });
        } catch (error) {
            console.error("Error downloading the Excel file:", error);
        }
    }

    public onEdit() {
        this.setMode("EDIT");
    }
    public async onChangingList(oEvent: sap.ui.base.Event) {
        let path = this.getPathFromEvent(oEvent);
        let list = await this.tm.getTN("invoice_list").getData();
        let index = parseInt(path.replace("/invoice_list/", ''));
        po_no = list[index].po_no;
        let dirtyPO = list.filter(x => x.is_object_dirty === true);
        if (dirtyPO.length) {
            await this.tm.getTN("po_number").setData({ "dirty": false });
        }
        let poNoGroups = new Map<string, { gross_value: number, total_amount: number }>();
        let updatedRecords = list.filter(x => x.po_no === po_no);
        updatedRecords.forEach(record => {
            if (!poNoGroups.has(record.po_no)) {
                poNoGroups.set(record.po_no, {
                    gross_value: record.gross_value,
                    total_amount: 0
                });
            }

            let group = poNoGroups.get(record.po_no);
            if (record.type === "Milestone") {
                group.total_amount += parseFloat(record.amount);
            }
        })

        // Validation step
        isValid = true;
        poNoGroups.forEach((group) => {
            if (group.total_amount !== parseFloat(group.gross_value) && list[index].type === "Milestone") {
                isValid = false;
            }
        });

        list[index].is_object_dirty = true;
        if (list[index].type === "Milestone") {
            await this.onAmountChange(index);
        }

    };
    public async onAmountChange(index: number) {
        let list = await this.tm.getTN("invoice_list").getData();
        await this.tm.getTN("po_number").setData(list[index].po_no)
        // if (index >= 0 && index < list.length) {
        //     let item = list[index];
        //     let maxAmount = (item.gross_value * item.percentage) / 100;

        //     if (item.amount > maxAmount) {
        //         sap.m.MessageBox.error(`The amount exceeds the allowed maximum of ${maxAmount}. Please enter a value less than or equal to ${maxAmount}.`);
        //         item.amount = maxAmount;
        //     }
        // }
    }

    public async teamHeadCheck(itemHeader) {
        let userRole = (await this.transaction.get$Role()).role_id;
        let userID = (await this.transaction.get$User()).login_id;
        if (userRole === "TEAM_HEAD") {
            let loginOrg = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('q_current_profit_center', {
                loadAll: true, 'employee_id': userID, 'active_till': new Date()
            });
            const PCset = new Set(loginOrg.map(org => org.profit_centre));
            let profitCenter = itemHeader[0].r_profit_center.fetch();
            profitCenter.filter(item => item.primaryPc === true && PCset.has(item.profit_center));
            if (profitCenter.length > 0) {
                return true;
            } else {
                return false;
            }
        }
        else if (userRole === "FINANCE") {
            return true;
        }

    }

    public async sortBySO(oEvent) {
        // Extract relevant properties from oEvent
        const { sortOrder, column } = oEvent.mParameters;
        const sortProperty = column.mProperties.sortProperty;
        let invoice_data = await this.tm.getTN("invoice_list").getData();

        // Sorting function with localeCompare
        const compareValues = (a, b) =>
            a[sortProperty].localeCompare(b[sortProperty], undefined, { numeric: true, sensitivity: 'base' });

        if (sortOrder == "Ascending" && sortProperty == "so") {
            await this.tm.getTN("invoice_list").setData(invoice_data.sort((a, b) => a.so - b.so));
        } else if (sortOrder == "Descending" && sortProperty == "so") {
            await this.tm.getTN("invoice_list").setData(invoice_data.sort((a, b) => compareValues(b, a)));
        } else if (sortOrder == "Ascending" && sortProperty == "po_no") {
            await this.tm.getTN("invoice_list").setData(invoice_data.sort(compareValues));
        } else if (sortOrder == "Descending" && sortProperty == "po_no") {
            await this.tm.getTN("invoice_list").setData(invoice_data.sort((a, b) => compareValues(b, a)));
        }
    }
    public async onNavigate(oEvent: sap.ui.base.Event) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/invoice_list/", ''))
        let so_guid = this.tm.getTN("invoice_list").getData()[index].so_guid
        await this.navTo(({ S: 'p_so', AD: so_guid }));
    }



}
