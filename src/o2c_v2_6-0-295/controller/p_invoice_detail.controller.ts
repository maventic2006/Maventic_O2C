import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_so_migration } from 'o2c_v2/entity_gen/d_o2c_so_migration';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_invoice_detail")
let data = [];
export default class p_invoice_detail extends KloController {

    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onPageEnter(oEvent) {
        await this.tm.getTN("list").setData({});
        let initialData = [], detailData = [];
        const monthPC = oEvent.navToParams.monthPC;
        // const milestoneID = oEvent.navToParams.MilestoneData;
        // const soNo = oEvent.navToParams.soData;
        // const profitCenter =  oEvent.navToParams.profitCenter;
        // const percentage =  oEvent.navToParams.percentage;
        // const milestoneAmt =  oEvent.navToParams.milestoneAmt;
        // const milestoneWithoutExcRate =  oEvent.navToParams.milestoneWithoutExcRate;
        // const exchRate =  oEvent.navToParams.exchRate;
        // const milestoneWithExcRate =  oEvent.navToParams.milestoneWithExcRate;

        for (let i = 0; i < monthPC.length; i++) {

            for (let json = 0; json < monthPC[i].soData.length; json++) {
                initialData.push({
                    'Month': monthPC[i].month,
                    'customer_name': "",
                    'project_name': "",
                    'so_no': monthPC[i].soData[json],
                    's_created_by': "",
                    'sales_resp': "",
                    'profit_cntr': monthPC[i].profitCenter,
                    'percentage': monthPC[i].percentage[json],
                    'milestoneAmt': monthPC[i].milestoneAmt[json],
                    'milestoneWithoutExcRate': monthPC[i].milestoneWithoutExcRate[json],
                    'exchRate': monthPC[i].exchRate[json],
                    'milestoneWithExcRate': monthPC[i].milestoneWithExcRate[json],
                    'po_no': "",
                    'billing_des': "",
                    'milestone_date': "",
                    'invoice_status': "",
                    'invoice_date': "",
                    'invoice_no': ""

                })


                detailData = [...detailData, ...initialData];
                initialData = [];
            }
        }

        // const attachmentNo = oEvent.navToParams.attachmentData;
        // const tableName = oEvent.navToParams.tableName;

        let milestoneData = await this.transaction.getExecutedQuery('d_o2c_so_milestone', { loadAll: true, partialSelected: ['billing_milestone_name', 'actual_date', 'invoice_date', 'invoice_no', 'status'] });
        let scheduleData = await this.transaction.getExecutedQuery('d_o2c_so_schedule', { loadAll: true, partialSelected: ['description', 'actual_date', 'invoice_date', 'invoice_no', 'status'] });
        let volumeData = await this.transaction.getExecutedQuery('d_o2c_volume_based', { loadAll: true, partialSelected: ['milestone_description', 'milestone_date', 'invoice_date', 'invoice_no', 'invoice_status'] });

        let soData = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, partialSelected: ['bill_to_customer', 'project_name', 'so', 's_created_by', 'sales_responsible'], expandAll: 'r_profit_center' });

        let customerData = await this.transaction.getExecutedQuery("d_o2c_customers", { loadAll: true, partialSelected: ['customer_id', 'customer_name'] });

        let login_id = (await this.transaction.get$User()).login_id;
        let UserOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: login_id, is_primary: true, loadAll: true, partialSelected: 'company_code' });
        let companyProfitCenter = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {
            loadAll: true, 'company_code': UserOrg[0]?.company_code, partialSelected: ['profit_center', 'name']
        });
        let poDetails = await this.transaction.getExecutedQuery("d_o2c_so_attachment", { loadAll: true, partialSelected: ['attachment_id', 'po_no'] });


        let billingData = [
            ...milestoneData,
            ...scheduleData,
            ...volumeData
        ];
        let so, t = 0;
        try {
            for (let j = 0; j < monthPC.length; j++) {

                for (let i = 0; i < monthPC[j].MilestoneData.length; i++, t++) {
                    let filterMilestone = billingData.filter((item) => (item.billing_milestone === monthPC[j].MilestoneData[i] || item.schedule_no === monthPC[j].MilestoneData[i]));
                    console.log(filterMilestone);
                    if (monthPC[j].tableName[i] == "d_o2c_so_milestone") {
                        detailData[t].billing_des = filterMilestone[0].billing_milestone_name;
                        detailData[t].milestone_date = filterMilestone[0].actual_date;
                        detailData[t].invoice_status = filterMilestone[0].status;
                        detailData[t].invoice_date = filterMilestone[0].invoice_date;
                        detailData[t].invoice_no = filterMilestone[0].invoice_no;

                    }
                    else if (monthPC[j].tableName[i] == "d_o2c_so_schedule") {
                        detailData[t].billing_des = filterMilestone[0].description;
                        detailData[t].milestone_date = filterMilestone[0].actual_date;
                        detailData[t].invoice_status = filterMilestone[0].status;
                        detailData[t].invoice_date = filterMilestone[0].invoice_date;
                        detailData[t].invoice_no = filterMilestone[0].invoice_no;

                    }
                    else {
                        detailData[t].billing_des = filterMilestone[0].milestone_description;
                        detailData[t].milestone_date = filterMilestone[0].milestone_date;
                        detailData[t].invoice_status = filterMilestone[0].invoice_status;
                        detailData[t].invoice_date = filterMilestone[0].invoice_date;
                        detailData[t].invoice_no = filterMilestone[0].invoice_no;


                    }
                    let filterSOData = soData.filter((item) => (item.so === monthPC[j].soData[i]));
                    so = filterSOData[0].so;
                    let filterCustomerName = customerData.filter((item) => (item.customer_id === filterSOData[0].bill_to_customer));
                    detailData[t].customer_name = filterCustomerName[0].customer_name;
                    detailData[t].project_name = filterSOData[0].project_name;
                    detailData[t].s_created_by = filterSOData[0].s_created_by;
                    detailData[t].sales_resp = filterSOData[0].sales_responsible;
                    // for (let profitCenter = 0; profitCenter < filterSOData[0].r_profit_center.length; profitCenter++) {
                    //     let profitCenterID = filterSOData[0].r_profit_center[profitCenter].profit_center;
                    //     let filterPCName = companyProfitCenter.filter((item) => (item.profit_center === profitCenterID));
                    //     detailData[i].profit_cntr = filterPCName[0].name;
                    // }
                    let filterPOData = poDetails.filter((item) => (item.attachment_id === monthPC[j].attachmentData[i]));
                    detailData[t].po_no = filterPOData[0].po_no;

                }
            }
        } catch (e) {
            console.log(so);
        }



        await this.tm.getTN("list").setData(detailData);
        data = detailData;

    }

    public async onExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        // let businessArea = await this.transaction.getExecutedQuery('d_o2c_business_area', {
        //     loadAll: true
        // })

        let jsonData = [];

        // Build the jsonData array using the fetched data
        for (let index = 0; index < data.length; index++) {
            let date = data[index]?.Month
            const month = date.toLocaleString('en-US', { month: 'long' }); // Full month name
            const year = date.getFullYear();
            const monthYear = `${month} ${year}`;

            jsonData.push({
                'Month': monthYear,
                'Profit Center': data[index]?.profit_cntr,
                'Customer Name': data[index]?.customer_name,
                'Project Name': data[index]?.project_name,
                'SO NO': data[index]?.so_no,
                'Created By': data[index]?.s_created_by,
                'Sales Person': data[index]?.sales_resp,
                'Percentage %': data[index]?.percentage,
                'PO NO': data[index]?.po_no,
                'Description': data[index]?.billing_des,
                'Total Amount': data[index]?.milestoneAmt,
                'Amount Based On Profit Center (In Lakh)': data[index]?.milestoneWithoutExcRate,
                'Currency Exchange Rate': data[index]?.exchRate,
                'Amount After Conversion (In Lakh)': data[index]?.milestoneWithExcRate,
                'Milestone Date': data[index]?.milestone_date,
                'Invoice Status': data[index]?.invoice_status,
                'Invoice Date': data[index]?.invoice_date,
                'Invoice No': data[index]?.invoice_no,


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
            { width: 30 },
            { width: 30 },
            { width: 30 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 30 },
            { width: 30 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1", "M1", "N1", "O1", "P1", "Q1", "R1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Detail Data");

        // Write workbook to a file
        const filePath = 'invoice_detail.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();

    }
}
//2 OCT 2024 4:38PM
// AH