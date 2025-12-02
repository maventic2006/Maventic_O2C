import { Console } from 'console';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_mis_report")
let role, emp_org = [], emp_id, employee_id, selectedObject, misData = [], soID, empSelectedObject;
export default class p_mis_report extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onPageEnter() {
        await this.tm.getTN("fiscal_year").setData({});
        await this.tm.getTN("list").setData({});
        // await this.tm.getTN("fiscal_year").setData({'dataNotPresent':false});
        role = (await this.transaction.get$Role()).role_id;
        let userid = await (await this.transaction.get$User()).login_id;
        // let emp_org;
        if (role == "TEAM_HEAD") {
            emp_org = await this.transaction.getExecutedQuery("d_o2c_employee_org", { employee_id: userid, is_primary: true, partialSelected: "profit_centre", loadAll: true });
            // await this.tm.getTN("fiscal_year").setData({"profit": emp_org[0].profit_centre});
        }
        await this.tm.getTN("fiscal_year").setData({ "role": role, 'dataNotPresent': false, "profit_center": emp_org[0]?.profit_centre, "month_srch": '' });

    }

    public async onSearch() {
        let listData = [], jsonData = [], milestoneData = [], attachmentData = [], so_guid;
        let fiscalYear = await this.tm.getTN("fiscal_year").getData();
        if (fiscalYear.year) {
            let fy = await this.tm.getTN("fiscal_year").getData();
            fy.dataNotPresent = false;
            let busyDialog = new sap.m.BusyDialog({
                text: "Please Wait, Data is loading..."
            });
            busyDialog.open();
            try {
                let login_id = (await this.transaction.get$User()).login_id;
                let UserOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: login_id, is_primary: true, loadAll: true });
                let profitCenter = [];
                if (login_id == "o2cadmin") {
                    profitCenter = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {
                        loadAll: true, 'company_code': ["MVPL", "PIPL"]
                    })
                }
                else {
                    profitCenter = await this.transaction.getExecutedQuery('d_o2c_profit_centre', {
                        loadAll: true, 'company_code': UserOrg[0].company_code
                    })
                }
                if (role == "TEAM_HEAD") {
                    profitCenter = await this.transaction.getExecutedQuery('q_pc_teamhead', {
                        loadAll: true, 'company_code': UserOrg[0].company_code
                    })
                }
                //Total Active Employee
                let allActiveEmp = await this.transaction.getExecutedQuery('d_o2c_employee', {
                    loadAll: true, partialSelected: 'employee_id', expandAll: 'r_employee_org'
                });
                let traineeEmp = allActiveEmp.filter(item => (item.is_fresher == true && item.type == "T01"));
                let contractEmp = allActiveEmp.filter(item => (item.type == "T03"));
                let thc = 0;
                let trhc = 0;
                let tchc = 0;
                let profitCenters = new Set();
                let profitCenterTrainee = new Set();
                let profitCenterContract = new Set();
                for (let i = 0; i < 12; i++) {
                    const fiscalYearStart = new Date(fiscalYear.year.getFullYear(), i + 3, 1);
                    for (let j = 0; j < profitCenter.length; j++) {
                        thc = 0;
                        trhc = 0;
                        tchc = 0;
                        profitCenters.clear();
                        profitCenterTrainee.clear();
                        //Filter Employee based on Profit center for this months
                        for (let i = 0; i < allActiveEmp.length; i++) {
                            let filterEmpData = allActiveEmp[i].r_employee_org.filter(item => (item.profit_centre == profitCenter[j].profit_center && item.is_primary == true
                                && (fiscalYearStart.getFullYear() > item.active_from.getFullYear() || (fiscalYearStart.getFullYear() === item.active_from.getFullYear() && fiscalYearStart.getMonth() >= item.active_from.getMonth()))
                                && (fiscalYearStart.getFullYear() < item.active_till.getFullYear() || (fiscalYearStart.getFullYear() === item.active_till.getFullYear() && fiscalYearStart.getMonth() <= item.active_till.getMonth()))));
                            for (let pc of filterEmpData) {
                                //emp_id = allActiveEmp[i].employee_id;
                                employee_id = allActiveEmp[i].employee_id;
                                if (allActiveEmp[i].is_active == false && (fiscalYearStart.getFullYear() < allActiveEmp[i].last_working_day.getFullYear() || (fiscalYearStart.getFullYear() === allActiveEmp[i].last_working_day.getFullYear() && fiscalYearStart.getMonth() <= allActiveEmp[i].last_working_day.getMonth()))) {
                                    profitCenters.add(pc.profit_centre);
                                } else if (allActiveEmp[i].is_active == true) {
                                    profitCenters.add(pc.profit_centre);
                                }
                            }
                            if (!filterEmpData.length) {
                                profitCenters.clear();
                            }
                            // Trainee Employee..
                            let filterTraineeEmpData = traineeEmp[i]?.r_employee_org.filter(item => (item.profit_centre == profitCenter[j].profit_center
                                && (fiscalYearStart.getFullYear() > item.active_from.getFullYear() || (fiscalYearStart.getFullYear() === item.active_from.getFullYear() && fiscalYearStart.getMonth() >= item.active_from.getMonth()))
                                && (fiscalYearStart.getFullYear() < item.active_till.getFullYear() || (fiscalYearStart.getFullYear() === item.active_till.getFullYear() && fiscalYearStart.getMonth() <= item.active_till.getMonth()))));
                            for (let pc = 0; pc < filterTraineeEmpData?.length; pc++) {
                                //emp_id = allActiveEmp[i].employee_id;
                                employee_id = allActiveEmp[i].employee_id;
                                if (allActiveEmp[i].is_active == false && (fiscalYearStart.getFullYear() < allActiveEmp[i].last_working_day.getFullYear() || (fiscalYearStart.getFullYear() === allActiveEmp[i].last_working_day.getFullYear() && fiscalYearStart.getMonth() <= allActiveEmp[i].last_working_day.getMonth()))) {
                                    profitCenterTrainee.add(filterTraineeEmpData[pc].profit_centre);
                                } else if (allActiveEmp[i].is_active == true) {
                                    profitCenterTrainee.add(filterTraineeEmpData[pc].profit_centre);
                                }
                            }
                            if (!filterTraineeEmpData?.length) {
                                profitCenterTrainee.clear();
                            }
                            //Contract Employee..
                            let filterContractEmpData = contractEmp[i]?.r_employee_org.filter(item => (item.profit_centre == profitCenter[j].profit_center
                                && (fiscalYearStart.getFullYear() > item.active_from.getFullYear() || (fiscalYearStart.getFullYear() === item.active_from.getFullYear() && fiscalYearStart.getMonth() >= item.active_from.getMonth()))
                                && (fiscalYearStart.getFullYear() < item.active_till.getFullYear() || (fiscalYearStart.getFullYear() === item.active_till.getFullYear() && fiscalYearStart.getMonth() <= item.active_till.getMonth()))));
                            for (let pc = 0; pc < filterContractEmpData?.length; pc++) {
                                // emp_id = allActiveEmp[i].employee_id;
                                employee_id = allActiveEmp[i].employee_id;
                                if (allActiveEmp[i].is_active == false && (fiscalYearStart.getFullYear() < allActiveEmp[i].last_working_day.getFullYear() || (fiscalYearStart.getFullYear() === allActiveEmp[i].last_working_day.getFullYear() && fiscalYearStart.getMonth() <= allActiveEmp[i].last_working_day.getMonth()))) {
                                    profitCenterContract.add(filterContractEmpData[pc].profit_centre);
                                } else if (allActiveEmp[i].is_active == true) {
                                    profitCenterContract.add(filterContractEmpData[pc].profit_centre);
                                }
                            }
                            if (!filterContractEmpData?.length) {
                                profitCenterContract.clear();
                            }
                            // console.log(filterEmpData[0]?.employee_id + "pc");
                            tchc += profitCenterContract.size;
                            trhc += profitCenterTrainee.size;
                            thc += profitCenters.size;
                        }
                        jsonData.push({
                            'Month': fiscalYearStart,
                            'ProfitCenter': profitCenter[j].name,
                            'BillableAmount': 0,
                            'PC': profitCenter[j].profit_center,
                            'Invoiced': 0,
                            'Bal_Amt': 0,
                            'InvoicedBooks': 0,
                            'TotalHC': thc,
                            'TrHC': trhc,
                            'ContractHC': tchc,
                            'EmpHC': thc - trhc - tchc,
                            'Milestone_id': [],
                            'So_id': [],
                            'Attachment_id': [],
                            'table_name': [],
                            'percentagePC': [],
                            'milestone_amt': [],
                            'amtBasedPCWithoutExcRate': [],
                            'currencyRate': [],
                            'amtBasedPCWithExcRate': []

                        })

                    }
                    listData = [...listData, ...jsonData];
                    jsonData = [];
                }
                let pcList = [];
                for (let pc of profitCenter) {
                    pcList.push(pc.profit_center);
                }
                let allSOProfitCenter = await this.transaction.getExecutedQuery('d_o2c_so_profit', {
                    loadAll: true, profit_center: pcList
                });
                let allSO = await this.transaction.getExecutedQuery('d_o2c_so_hdr', {
                    loadAll: true, partialSelected: ['so_guid', 'currency_exc_rate']
                });
                let startFiscalYear = await this.isWithinFinancialYear(fiscalYear.year);

                //Currency Data
                let allCurrencyRate = await this.transaction.getExecutedQuery('d_o2c_exchange_rate', {
                    loadAll: true, partialSelected: ['currency', 'from_date', 'to_date', 'currency_rate']
                });

                //For Invoice as per book For milestone
                let invdataMilestone = await this.transaction.getExecutedQuery('q_invoice_as_per_book', {
                    loadAll: true, 'invoice_start_date': startFiscalYear[0], 'invoice_end_date': startFiscalYear[1], partialSelected: ['actual_date', 'amount', 'invoice_date', 'status']
                });
                //Milestone Table
                let data = await this.transaction.getExecutedQuery('q_mis_milestone', {
                    loadAll: true,
                    'milestone_start_date': startFiscalYear[0],
                    'milestone_end_date': startFiscalYear[1],
                    partialSelected: ['actual_date', 'amount', 'invoice_date', 'status'],
                });
                if (data.length) {
                    milestoneData = [...milestoneData, ...data];
                    for (let i = 0; i < data.length; i++) {
                        data[i].r_milestone_item?.q ?? await data[i].r_milestone_item.fetch();
                        let test = data[i].r_milestone_item[0];
                        let currentDataAttach = await test.r_item_attachment.fetch();
                        //let currentDataAttach=await data[i].r_milestone_item[0].r_item_attachment.fetch();
                        //attachmentData = [...attachmentData, ...await data[i].r_milestone_item[0].r_item_attachment.fetch()];
                        so_guid = currentDataAttach[0].so_guid;
                        emp_id = so_guid;
                        let SOData = allSO.filter(item => (item.so_guid == so_guid));
                        soID = SOData[0].so;
                        // let currRateData = await this.transaction.getExecutedQuery('q_exchange_rate', {
                        //     loadAll: true, 'project_currency': SOData[0].currency, 'project_created_date': SOData[0].s_created_on, partialSelected: ['currency_rate']
                        // });
                        let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                            && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                            && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                        let currRate = currRateData[0].currency_rate;
                        let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                        for (let j = 0; j < soProfitCenter.length; j++) {
                            let filterData = listData.filter(item => (item.Month.getMonth() == data[i].actual_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].actual_date.getFullYear()));
                            if (filterData.length) {
                                filterData[0].BillableAmount = (parseFloat(filterData[0].BillableAmount) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);

                                //Invoice Detail Data Start
                                let milestoneAmtValue = (parseFloat(data[i].amount));
                                let amtBasedPCWithoutExcRateValue = (parseFloat(data[i].amount) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                let amtBasedPCWithExcRateValue = ((parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                filterData[0].Milestone_id.push(data[i].billing_milestone);
                                filterData[0].So_id.push(SOData[0].so);
                                filterData[0].percentagePC.push(soProfitCenter[j].percentage);
                                filterData[0].Attachment_id.push(currentDataAttach[0].attachment_id);
                                filterData[0].table_name.push("d_o2c_so_milestone");
                                filterData[0].milestone_amt.push(milestoneAmtValue);
                                filterData[0].amtBasedPCWithoutExcRate.push(amtBasedPCWithoutExcRateValue);
                                filterData[0].currencyRate.push(currRate);
                                filterData[0].amtBasedPCWithExcRate.push(amtBasedPCWithExcRateValue);
                                //Invoice Detail Data End

                                if (data[i].status == "Invoiced") {
                                    filterData[0].Invoiced = (parseFloat(filterData[0].Invoiced) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                }

                                filterData[0].Bal_Amt = parseFloat(filterData[0].BillableAmount - filterData[0].Invoiced).toFixed(2);
                            }

                            // if (data[i].invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == data[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].invoice_date.getFullYear()));
                            //     if (data[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                            // if (invdataMilestone.length && invdataMilestone[i] && invdataMilestone[i]?.invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataMilestone[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataMilestone[i].invoice_date.getFullYear()));
                            //     if (invdataMilestone[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataMilestone[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                        }
                    }

                }

                // Calculating Invoice as per book for Milestone...
                for (let i = 0; i < invdataMilestone.length; i++) {
                    invdataMilestone[i].r_milestone_item?.q ?? await invdataMilestone[i].r_milestone_item.fetch();
                    let test = invdataMilestone[i].r_milestone_item[0];
                    let currentDataAttach = await test.r_item_attachment.fetch();
                    so_guid = currentDataAttach[0].so_guid;
                    let SOData = allSO.filter(item => (item.so_guid == so_guid));
                    let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                        && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                        && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                    let currRate = currRateData[0].currency_rate;
                    let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                    for (let j = 0; j < soProfitCenter.length; j++) {
                        if (invdataMilestone.length && invdataMilestone[i] && invdataMilestone[i]?.invoice_date) {
                            let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataMilestone[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataMilestone[i].invoice_date.getFullYear()));
                            if (invdataMilestone[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                                filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataMilestone[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            }
                        }
                    }
                }

                //For Invoice as per book For schedule
                let invdataSchedule = await this.transaction.getExecutedQuery('q_schd_invoice_as_per_book', {
                    loadAll: true, 'invoice_start_date': startFiscalYear[0], 'invoice_end_date': startFiscalYear[1],
                    partialSelected: ['actual_date', 'amount', 'invoice_date', 'status']
                });
                //Schedule Table//
                data = await this.transaction.getExecutedQuery('q_mis_schedule', {
                    loadAll: true, 'schedule_start_date': startFiscalYear[0], 'schedule_end_date': startFiscalYear[1],
                    partialSelected: ['actual_date', 'expected_amount', 'invoice_date', 'status']
                });
                if (data.length) {
                    milestoneData = [...milestoneData, ...data];
                    for (let i = 0; i < data.length; i++) {
                        data[i].r_schedule_item?.q ?? await data[i].r_schedule_item.fetch();
                        let test = data[i].r_schedule_item[0];
                        let currentDataAttach = await test.r_item_attachment.fetch();
                        //attachmentData = [...attachmentData, ...await data[i].r_schedule_item[0].r_item_attachment.fetch()];
                        so_guid = currentDataAttach[0].so_guid;
                        emp_id = so_guid;
                        let SOData = allSO.filter(item => (item.so_guid == so_guid));
                        soID = SOData[0].so;
                        let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                            && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                            && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                        let currRate = currRateData[0].currency_rate;
                        let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                        for (let j = 0; j < soProfitCenter.length; j++) {
                            let filterData = listData.filter(item => (item.Month.getMonth() == data[i].actual_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].actual_date.getFullYear()));
                            if (filterData.length) {
                                filterData[0].BillableAmount = (parseFloat(filterData[0].BillableAmount) + (parseFloat(data[i].expected_amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);

                                //Invoice Detail Data Start
                                let milestoneAmtValue = (parseFloat(data[i].expected_amount));
                                let amtBasedPCWithoutExcRateValue = (parseFloat(data[i].expected_amount) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                let amtBasedPCWithExcRateValue = ((parseFloat(data[i].expected_amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                filterData[0].Milestone_id.push(data[i].schedule_no);
                                filterData[0].So_id.push(SOData[0].so);
                                filterData[0].percentagePC.push(soProfitCenter[j].percentage);
                                filterData[0].Attachment_id.push(currentDataAttach[0].attachment_id);
                                filterData[0].table_name.push("d_o2c_so_schedule");
                                filterData[0].milestone_amt.push(milestoneAmtValue);
                                filterData[0].amtBasedPCWithoutExcRate.push(amtBasedPCWithoutExcRateValue);
                                filterData[0].currencyRate.push(currRate);
                                filterData[0].amtBasedPCWithExcRate.push(amtBasedPCWithExcRateValue);
                                //Invoice Detail Data End

                                if (data[i].status == "Invoiced") {
                                    filterData[0].Invoiced = (parseFloat(filterData[0].Invoiced) + (parseFloat(data[i].expected_amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                }

                                filterData[0].Bal_Amt = parseFloat(filterData[0].BillableAmount - filterData[0].Invoiced).toFixed(2);
                            }

                            // if (data[i].invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == data[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].invoice_date.getFullYear()));
                            //     if (data[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(data[i].expected_amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                            // if (invdataSchedule.length && invdataSchedule[i] && invdataSchedule[i]?.invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataSchedule[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataSchedule[i].invoice_date.getFullYear()));
                            //     if (invdataSchedule[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataSchedule[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                        }
                    }
                }

                // Calculating the Invoice as per book for Schedule.. 
                for (let i = 0; i < invdataSchedule.length; i++) {
                    invdataSchedule[i].r_schedule_item?.q ?? await invdataSchedule[i].r_schedule_item.fetch();
                    let test = await invdataSchedule[i].r_schedule_item[0];
                    let currentDataAttach = await test.r_item_attachment.fetch();
                    so_guid = currentDataAttach[0].so_guid;
                    let SOData = allSO.filter(item => (item.so_guid == so_guid));
                    let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                        && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                        && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                    let currRate = currRateData[0].currency_rate;
                    let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                    for (let j = 0; j < soProfitCenter.length; j++) {
                        if (invdataSchedule.length && invdataSchedule[i] && invdataSchedule[i]?.invoice_date) {
                            let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataSchedule[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataSchedule[i].invoice_date.getFullYear()));
                            if (invdataSchedule[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                                filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataSchedule[i].expected_amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            }
                        }
                    }
                }

                //For Invoice as per book For Volume
                let invdataVolume = await this.transaction.getExecutedQuery('q_vol_invoice_as_per_book', {
                    loadAll: true, 'invoice_start_date': startFiscalYear[0], 'invoice_end_date': startFiscalYear[1],
                    partialSelected: ['actual_date', 'amount', 'invoice_date', 'status']
                });
                //Volume Table//
                data = await this.transaction.getExecutedQuery('q_mis_volume', {
                    loadAll: true, 'volume_start_date': startFiscalYear[0], 'volume_end_date': startFiscalYear[1], 
                    partialSelected: ['milestone_date', 'amount', 'invoice_status', 'invoice_date']
                });
                if (data.length) {
                    milestoneData = [...milestoneData, ...data];
                    for (let i = 0; i < data.length; i++) {
                        data[i].r_volume_item?.q ?? await data[i].r_volume_item.fetch();
                        let test = data[i].r_volume_item[0];
                        let currentDataAttach = await test.r_item_attachment.fetch();
                        //attachmentData = [...attachmentData, ...await data[i].r_volume_item[0].r_item_attachment.fetch()];
                        so_guid = currentDataAttach[0].so_guid;
                        emp_id = so_guid;
                        let SOData = allSO.filter(item => (item.so_guid == so_guid));
                        soID = SOData[0].so;
                        let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                            && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                            && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                        let currRate = currRateData[0].currency_rate;
                        let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                        for (let j = 0; j < soProfitCenter.length; j++) {
                            let filterData = listData.filter(item => (item.Month.getMonth() == data[i].milestone_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].milestone_date.getFullYear()));

                            if (filterData.length) {
                                filterData[0].BillableAmount = (parseFloat(filterData[0].BillableAmount) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);

                                //Invoice Detail Data Start
                                let milestoneAmtValue = (parseFloat(data[i].amount));
                                let amtBasedPCWithoutExcRateValue = (parseFloat(data[i].amount) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                let amtBasedPCWithExcRateValue = ((parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                filterData[0].Milestone_id.push(data[i].billing_milestone);
                                filterData[0].So_id.push(SOData[0].so);
                                filterData[0].percentagePC.push(soProfitCenter[j].percentage);
                                filterData[0].Attachment_id.push(currentDataAttach[0].attachment_id);
                                filterData[0].table_name.push("d_o2c_volume_based");
                                filterData[0].milestone_amt.push(milestoneAmtValue);
                                filterData[0].amtBasedPCWithoutExcRate.push(amtBasedPCWithoutExcRateValue);
                                filterData[0].currencyRate.push(currRate);
                                filterData[0].amtBasedPCWithExcRate.push(amtBasedPCWithExcRateValue);
                                //Invoice Detail Data End

                                if (data[i].invoice_status == "Invoiced") {
                                    filterData[0].Invoiced = (parseFloat(filterData[0].Invoiced) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                                }

                                filterData[0].Bal_Amt = parseFloat(filterData[0].BillableAmount - filterData[0].Invoiced).toFixed(2);
                            }

                            // if (data[i].invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == data[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == data[i].invoice_date.getFullYear()));
                            //     if (data[i].invoice_status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(data[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                            // if (invdataVolume.length && invdataVolume[i] && invdataVolume[i]?.invoice_date) {
                            //     let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataVolume[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataVolume[i].invoice_date.getFullYear()));
                            //     if (invdataVolume[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                            //         filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataVolume[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            //     }
                            // }
                        }
                    }
                }

                // Calculating Invoice as per book for Volume...
                for (let i = 0; i < invdataVolume.length; i++) {
                    invdataVolume[i].r_volume_item?.q ?? await invdataVolume[i].r_volume_item.fetch();
                    let test = invdataVolume[i].r_volume_item[0];
                    let currentDataAttach = await test.r_item_attachment.fetch();
                    so_guid = currentDataAttach[0].so_guid;
                    let SOData = allSO.filter(item => (item.so_guid == so_guid));
                    let currRateData = allCurrencyRate.filter(item => (item.currency_code == SOData[0].currency
                        && (SOData[0].s_created_on.getFullYear() > item.from_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.from_date.getFullYear() && SOData[0].s_created_on.getMonth() >= item.from_date.getMonth()))
                        && (SOData[0].s_created_on.getFullYear() < item.to_date.getFullYear() || (SOData[0].s_created_on.getFullYear() === item.to_date.getFullYear() && SOData[0].s_created_on.getMonth() <= item.to_date.getMonth()))));
                    let currRate = currRateData[0].currency_rate;
                    let soProfitCenter = allSOProfitCenter.filter(item => (item.so_guid == so_guid));
                    for (let j = 0; j < soProfitCenter.length; j++) {
                        if (invdataVolume.length && invdataVolume[i] && invdataVolume[i]?.invoice_date) {
                            let filterInvoiceDate = listData.filter(item => (item.Month.getMonth() == invdataVolume[i].invoice_date.getMonth() && soProfitCenter[j].profit_center == item.PC && item.Month.getFullYear() == invdataVolume[i].invoice_date.getFullYear()));
                            if (invdataVolume[i].status == "Invoiced" && filterInvoiceDate.length > 0) {
                                filterInvoiceDate[0].InvoicedBooks = (parseFloat(filterInvoiceDate[0].InvoicedBooks) + (parseFloat(invdataVolume[i].amount) * parseFloat(currRate)) * parseFloat(soProfitCenter[j].percentage) / 10000000).toFixed(2);
                            }
                        }
                    }
                }

                if (fiscalYear.profit_center) {
                    let filterData = await this.profitCntSearch(fiscalYear.profit_center, listData);
                    await this.tm.getTN("list").setData(filterData);
                    misData = filterData;
                }
                else {
                    await this.tm.getTN("list").setData(listData);
                    misData = listData;
                }


            }
            catch (error) {
                console.log(emp_id, soID);
                console.error('Error occurred during search:', error);
                sap.m.MessageBox.error(`An error occurred while processing your request. Please try again later.${emp_id} employee: ${employee_id}`, {
                    title: emp_id + "," + soID,
                    actions: sap.m.MessageBox.Action.CLOSE
                });
            } finally {
                busyDialog.close();
            }
        }
        else {
            await this.tm.getTN("fiscal_year").setData({ 'dataNotPresent': true, "profit_center": emp_org[0]?.profit_centre, "role": role });
            sap.m.MessageBox.error("Fiscal Year is Manadatory", {
                title: "Error",                                      // default
                onClose: null,                                       // default
                styleClass: "",                                      // default
                actions: sap.m.MessageBox.Action.CLOSE,              // default
                emphasizedAction: null,                              // default
                initialFocus: null,                                  // default
                textDirection: sap.ui.core.TextDirection.Inherit     // default
            });
        }
    }


    public isWithinFinancialYear(fiscalYear) {
        const fiscalYearStart = new Date(fiscalYear.getFullYear(), 3, 1);
        const fiscalYearEnd = new Date(fiscalYear.getFullYear() + 1, 2, 31);

        return [fiscalYearStart, fiscalYearEnd];
    }
    public async profitCntSearch(profit_center, listData) {
        let filter = listData.filter(item => (item.PC == profit_center));
        return filter;


    }
    public async onPcClick() {
        // let path = this.getPathFromEvent(oEvent);
        // let index = parseInt(path.replace("/list/", ''));
        // empSelectedObject = await this.getActiveControlById(null,'s_report_list').getSelectedIndices();
        // console.log(selectedObject);
        selectedObject = await this.getActiveControlById(null, 's_report_list').getSelectedIndices();
        if (selectedObject.length == 0) {
            sap.m.MessageBox.error("Kindly ensure that the checkbox for the selected line item is marked. This will confirm its selection for further processing.", {
                title: "Error",                                      // default
                onClose: null,                                       // default
                styleClass: "",                                      // default
                actions: sap.m.MessageBox.Action.CLOSE,              // default
                emphasizedAction: null,                              // default
                initialFocus: null,                                  // default
                textDirection: sap.ui.core.TextDirection.Inherit
            });
        } else {
            await this.navTo(({ SS: 'pa_pop_up' }));
        }
    }
    public async onInvoiceDetailButton() {
        // For multiple download functionality improvise
        let monthPC = [];
        // let selectedLineData = selectedObject;
        // let MilestoneData = selectedLineData.Milestone_id;
        // let soData = selectedLineData.So_id;
        // let profitCenter= selectedLineData.ProfitCenter;
        // let attachmentData = selectedLineData.Attachment_id;
        // let tableName = selectedLineData.table_name;
        // let percentage= selectedLineData.percentagePC;
        // let milestoneAmt= selectedLineData.milestone_amt;
        // let milestoneWithoutExcRate= selectedLineData.amtBasedPCWithoutExcRate;
        // let exchRate= selectedLineData.currencyRate;
        // let milestoneWithExcRate= selectedLineData.amtBasedPCWithExcRate;
        for (let i = 0; i < selectedObject.length; i++) {
            let item = await this.tm.getTN("list").getData()[selectedObject[i]];
            monthPC.push({
                month: item.Month,
                profitCenter: item.ProfitCenter,
                MilestoneData: item.Milestone_id,
                soData: item.So_id,
                attachmentData: item.Attachment_id,
                tableName: item.table_name,
                percentage: item.percentagePC,
                milestoneAmt: item.milestone_amt,
                milestoneWithoutExcRate: item.amtBasedPCWithoutExcRate,
                exchRate: item.currencyRate,
                milestoneWithExcRate: item.amtBasedPCWithExcRate
            })
        }

        // await this.navTo(({ S: 'p_invoice_detail', MilestoneData, soData, profitCenter, attachmentData, tableName, percentage, milestoneAmt, milestoneWithoutExcRate, exchRate, milestoneWithExcRate }));
        await this.navTo({ S: 'p_invoice_detail', monthPC });
    }

    public async onEmpDetailButton() {
        let monthPC = [];
        for (let i = 0; i < selectedObject.length; i++) {
            let item = await this.tm.getTN("list").getData()[selectedObject[i]];
            monthPC.push({
                month: item.Month,
                profitCenter: item.ProfitCenter,
                PC: item.PC
            })
        }
        await this.navTo(({ S: 'p_mis_emp_detail_rep', monthPC }));
    }

    public async onMISExcelDownload() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }


        let jsonData = [];

        // Build the jsonData array using the fetched data
        for (let index = 0; index < misData.length; index++) {

            jsonData.push({
                'Month': misData[index]?.Month,
                'Profit Center': misData[index]?.ProfitCenter,
                'Billable Amount': misData[index]?.BillableAmount,
                'Invoiced': misData[index]?.Invoiced,
                'Balanced Amount': misData[index]?.Bal_Amt,
                'Invoiced as per books': misData[index]?.InvoicedBooks,
                'Total HC': misData[index]?.TotalHC,
                'Tr HC': misData[index]?.TrHC,
                'Employee HC': misData[index]?.EmpHC,
                'Contract HC': misData[index]?.ContractHC,

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

        XLSX.utils.book_append_sheet(workbook, worksheet, "MIS Data");

        // Write workbook to a file
        const filePath = 'mis_data.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();

    }

}
//13 March 2025 2025 3PM
// AF