import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_po_list")
export default class p_o2c_po_list extends KloController {

    public async onPageEnter() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is loading..."
        });
        busyDialog.open();
    
        const search = await this.tm.getTN("po_search").getData();
        search.setLoadAll(true);
        await search.executeP();
    
        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const currentDay = currentDate.getDate();
        const currentYear = currentDate.getFullYear();
    
        const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const targetMonth = currentDay <= 10
            ? monthShortNames[(currentMonthIndex - 2 + 12) % 12]
            : monthShortNames[(currentMonthIndex - 1 + 12) % 12];
    
        const targetMonthIndex = monthShortNames.indexOf(targetMonth);
        const targetYear = (targetMonth === "Dec" && currentMonthIndex === 0) ? currentYear - 1 : currentYear;
    
        const po_list = await this.tm.getTN("po_list").getData();
        const resultItems = [];
    
        await Promise.all(po_list.map(async (po) => {
            const poData = await po.r_so_attachment?.fetch();
            if (!poData || poData.length === 0) return;
    
            let finalGrossValue = 0;
            let finalPoNumbers = [];
    
            poData.forEach(line => {
                const poCreatedDate = new Date(line.s_created_on);
                const poMonthIndex = poCreatedDate.getMonth();
                const poYear = poCreatedDate.getFullYear();
    
                if (poMonthIndex === targetMonthIndex && poYear === targetYear) {
                    finalGrossValue += Number(line.gross_value || 0);
                    if (line.po_no) {
                        finalPoNumbers.push(line.po_no);
                    }
                }
            });
    
            if (finalGrossValue === 0) return;
    
            let projectManagers = [];
            let projectNumbers = [];
    
            if (po.r_profit_center) {
                const profitCenters = await po.r_profit_center.fetch();
                profitCenters.forEach(pc => {
                    if (pc.project_manager) {
                        projectManagers.push(pc.project_manager.toUpperCase());
                    }
                    if (pc.project_id) {
                        projectNumbers.push(pc.project_id);
                    }
                });
            }
    
            resultItems.push({
                bill_to_customer: po.bill_to_customer,
                project_name: po.project_name,
                final_gross_value: finalGrossValue,
                sales_responsible: po.sales_responsible,
                s_created_on: po.s_created_on,
                project_managers: projectManagers,
                project_number: projectNumbers.join(','),
                so: po.so,
                final_po_numbers: finalPoNumbers.join(',')
            });
        }));
    
        await this.tm.getTN("po_other_list").setData(resultItems);
    
        const monthsData = monthShortNames.map((month, index) => ({
            month,
            month_name: new Date(0, index).toLocaleString('default', { month: 'long' })
        }));
    
        await this.tm.getTN("month_list").setData(monthsData);
        search.months = targetMonth;
    
        busyDialog.close();
    }
    

    public async onAfterSearch() {
        const search = await this.tm.getTN("po_search").getData();
        const selectedMonth = search.months;
    
        const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const targetMonthIndex = monthShortNames.indexOf(selectedMonth);
    
        if (targetMonthIndex === -1) {
            console.error("Invalid month provided in search");
            return;
        }
    
        const po_list = await this.tm.getTN("po_list").getData();
        const resultItems = [];
    
        await Promise.all(po_list.map(async (po) => {
            const poData = await po.r_so_attachment?.fetch();
            if (!poData || poData.length === 0) return;
    
            let finalGrossValue = 0;
            let finalPoNumbers = [];
    
            poData.forEach(line => {
                const poCreatedDate = new Date(line.s_created_on);
                const poMonthIndex = poCreatedDate.getMonth();
    
                if (poMonthIndex === targetMonthIndex) {
                    finalGrossValue += Number(line.gross_value || 0);
                    if (line.po_number) {
                        finalPoNumbers.push(line.po_number);
                    }
                }
            });
    
            if (finalGrossValue === 0) return;
    
            let projectManagers = [];
            if (po.r_profit_center) {
                const profitCenters = await po.r_profit_center.fetch();
                profitCenters.forEach(pc => {
                    if (pc.project_manager) {
                        projectManagers.push(pc.project_manager.toUpperCase());
                    }
                });
            }
    
            const uniqueManagers = [...new Set(projectManagers)].join(',');
    
            resultItems.push({
                bill_to_customer: po.bill_to_customer,
                project_name: po.project_name,
                final_gross_value: finalGrossValue,
                sales_responsible: po.sales_responsible,
                s_created_on: po.s_created_on,
                project_managers: uniqueManagers,
                final_po_numbers: finalPoNumbers.join(',')
            });
        }));
    
        await this.tm.getTN("po_other_list").setData(resultItems);
    }
    

    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_o2c_action_items" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_ending_page" }))
    }
}