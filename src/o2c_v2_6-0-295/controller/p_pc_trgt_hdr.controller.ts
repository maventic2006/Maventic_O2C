import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_pc_trgt_hdr } from 'o2c_v2/entity_gen/d_pc_trgt_hdr';
import { d_pc_trgt_mnthly_itm } from 'o2c_v2/entity_gen/d_pc_trgt_mnthly_itm';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pc_trgt_hdr")
export default class p_pc_trgt_hdr extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public is_present = false;
    public months = [
        "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
    ]
    public async onPageEnter() {
        this.tm.getTN("page_name_bind").setData({});
        this.tm.getTN("fiscal_year_store").setData({});
        this.tm.getTN("page_name_bind").setProperty('name', "Profit Center and Function Area Target Screen");
        let login_id = (await this.transaction.get$User()).login_id;
        let emp_org = await this.transaction.getExecutedQuery('d_o2c_employee_org', { 'employee_id': login_id, 'is_primary': true, loadAll: true });
        await this.tm.getTN("pc_trgt_hdr_search").setProperty('company_code', emp_org[0].company_code);
    }
    public async onSearchingFA() {
        this.tm.getTN("fa_search").setData({});
        this.tm.getTN("page_name_bind").setData({});
        let fiscal_year = new Date(this.tm.getTN("pc_trgt_hdr_search").getProperty('start_date'));
        let start_date = new Date(fiscal_year.getFullYear(), 3, 1);
        this.tm.getTN("pc_trgt_hdr_search").setProperty('start_date', start_date);
        let identifier = this.tm.getTN("pc_trgt_hdr_search").getProperty('identifier');
        await this.tm.getTN("pc_trgt_hdr_search").executeP();
        this.tm.getTN("ffiscal_year_search").setProperty('fs_year', null);
        this.tm.getTN("fa_search").setProperty('fa', identifier);
        if (identifier == "PC")
            this.tm.getTN("page_name_bind").setProperty('name', "Profit Center Target Screen");
        else if (identifier == "FA")
            this.tm.getTN("page_name_bind").setProperty('name', "Function Area Target Screen");
        else
            this.tm.getTN("page_name_bind").setProperty('name', "Profit Center and Function Area Target Screen");
    }
    public async onNavigatiingtoDetail(oEvent) {
        let sPath: string = this.getPathFromEvent(oEvent);
        let index = parseInt(sPath.replace("/pc_trgt_hdr_list/", ''));
        this.tm.getTN("table_detail").setData({});
        let list;
        let array_list = new Set();
        let header = this.tm.getTN("pc_trgt_hdr_list").getData()[index];
        await this.tm.getTN("pc_trgt_hdr_list").setActive(index);
        if (header.identifier == "PC") {
            let entity = <KloEntitySet<d_pc_trgt_mnthly_itm>>await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': header.header_id, loadAll: true });
            if (entity.length) {
                this.is_present = true;
                for (let i = 0; i <= 11; i++) {
                    let item = entity.filter(item => (item.month === this.months[i]));
                    let sal = header.overall_target * item[1].target / 10000000
                    let del = header.overall_target * item[0].target / 10000000
                    let employee_table = { month: this.months[i], sales_target: item[1].target, sales_cal: sal, del_cal: del, delivery_target: item[0].target };
                    array_list.add(employee_table);
                }
                list = Array.from(array_list);
                await this.tm.getTN("table_detail").setData(list);
                this.tm.getTN("table_detail").refresh();
            }
            else {
                for (let i = 0; i <= 11; i++) {
                    let employee_table = { month: this.months[i], sales_target: undefined, delivery_target: undefined };
                    array_list.add(employee_table);
                }
                list = Array.from(array_list);
                await this.tm.getTN("table_detail").setData(list);
                this.tm.getTN("table_detail").refresh();
            }
            await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_r_month_list" }))
        }
        else if (header.identifier == "FA") {
            await this.tm.getTN("only_manager_search").setProperty('profit_c', header.profit_center);
            await this.tm.getTN("only_manager_search").executeP();
            await this.navTo(({ S: "p_pc_trgt_hdr", SS: "pa_fa_detail" }))
        }
    }
    public async onHdrCreste() {
        await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_pc_trgt_list" }))
        let identifier = this.tm.getTN("pc_trgt_hdr_search").getProperty('identifier');
        await this.tm.getTN('pc_trgt_hdr_list').createEntityP({ identifier: identifier }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
        await this.openDialog("pa_hdr_create");
    }
    public async onCancel() {
        await this.transaction.rollback();
        await this.tm.getTN("pc_trgt_hdr_list").refresh();
        await this.setMode("DISPLAY");
        await this.closeDialog("pa_hdr_create");
    }
    public async onCreateNav() {
        let oBusyDailog = new sap.m.BusyDialog().open();
        let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
        let fiscal_year = new Date(this.tm.getTN("fiscal_year_store").getProperty('fs_year'));
        head.start_date = new Date(fiscal_year.getFullYear(), 3, 1);
        head.end_date = new Date(fiscal_year.getFullYear() + 1, 3, 0);
        head.target_fy = head.start_date.getFullYear().toString().concat("-", head.end_date.getFullYear().toString());
        let ent = false;
        let fa = false;
        let otherentity;
        let pcentity;
        let errors = await this.tm.getTN("pc_trgt_hdr_detail").getData().validateP();
        this.tm.getTN("fiscal_year_store").setProperty('fs_year', null);
        if (head.profit_center && head.target_fy && head.identifier) {
            otherentity = await this.transaction.getExecutedQuery('d_pc_trgt_hdr', { profit_center: head.profit_center, target_fy: head.target_fy, identifier: head.identifier, loadAll: true });
            let similar_entity = await otherentity.filter(item => (item.functional_area === head.functional_area));
            if (similar_entity.length > 0) {
                ent = true;
            }
            else if (otherentity.length > 0 && head.identifier == "PC") {
                ent = true;
            }
        }
        if (head.identifier == "FA" && !head.functional_area) {
            fa = true
        }
        if (errors.length == 0 && ent == false && fa == false) {
            if (head.identifier == "PC") {
                let list;
                let array_list = new Set();
                this.tm.getTN("table_detail").setData({});
                for (let i = 0; i <= 11; i++) {
                    let employee_table = { month: this.months[i], sales_target: undefined, sales_cal: undefined, del_cal: undefined, delivery_target: undefined };
                    array_list.add(employee_table);
                }
                list = Array.from(array_list);
                await this.tm.getTN("table_detail").setData(list);
                this.tm.getTN("table_detail").refresh();
                await this.closeDialog("pa_hdr_create");
                await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_pc_trgt_list" }))
                await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_r_month_list" }))
            }
            else if (head.identifier == "FA") {
                await this.tm.getTN("only_manager_search").setProperty('profit_c', head.profit_center);
                await this.tm.getTN("only_manager_search").executeP();
                let counter = 0;
                for (let i = 0; i < otherentity.length; i++) {
                    counter = counter + parseFloat(otherentity[i].overall_target_in_cr)
                }
                counter = counter + parseFloat(head.overall_target_in_cr)
                pcentity = await this.transaction.getExecutedQuery('d_pc_trgt_hdr', { profit_center: head.profit_center, target_fy: head.target_fy, identifier: "PC", loadAll: true });
                if (pcentity[0] && counter <= parseFloat(pcentity[0].overall_target_in_cr)) {
                    await this.closeDialog("pa_hdr_create");
                    await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_pc_trgt_list" }))
                    await this.navTo(({ S: "p_pc_trgt_hdr", SS: "pa_fa_detail" }))
                    if (counter < parseFloat(pcentity[0].overall_target_in_cr)) {
                        let difference = parseFloat(pcentity[0].overall_target_in_cr) - counter;
                        sap.m.MessageBox.information("Target Remaining from Profit Center by " + difference + " Lakhs", { title: "Info", });
                    }
                }
                else if (!pcentity[0]) {
                    sap.m.MessageBox.error("Target not set in Profit Center", { title: "Error", });
                }
                else {
                    let difference = counter - parseFloat(pcentity[0].overall_target_in_cr);
                    sap.m.MessageBox.warning("Target Exceeded from Profit Center by " + difference + " Lakhs", { title: "WARNING!", });
                }
            }
        }
        else if (ent == true) {
            sap.m.MessageBox.error("Target Already Created", { title: "Error", });
        }
        else if (fa == true) {
            sap.m.MessageBox.error("Functional Area Mandatory", { title: "Error", });
        }
        else {
            let oBusyDailog = new sap.m.BusyDialog().open();
            await this.openDialog("pa_dialog");
            this.tm.getTN("error_transnode").setData(errors);
            oBusyDailog.close();
        }
        oBusyDailog.close();
    }
    onediting() {
        this.setMode("EDIT");
    }
    // public async onSaving() {
    //     let oBusyDailog = new sap.m.BusyDialog().open();
    //     let mode = this.getMode()
    //     let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
    //     if (head.identifier == "PC") {
    //         let salestotal = 0.0;
    //         let deliverytotal = 0.0;
    //         let table_detail = this.tm.getTN('table_detail').getData();
    //         for (let i = 0; i <= 11; i++) {
    //             let checklist = await table_detail.filter(item => (item.month === this.months[i]));
    //             deliverytotal = deliverytotal + parseFloat(checklist[0].delivery_target);
    //             salestotal = salestotal + parseFloat(checklist[0].sales_target);
    //         }
    //         if (salestotal == 100 && deliverytotal == 100) {
    //             if (mode == "CREATE") {
    //                 for (let i = 0; i <= 11; i++) {
    //                     await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', { target_type: "Sales", header_id: head.header_id, month: this.months[i], target: table_detail[i].sales_target }, true);
    //                     await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', { target_type: "Delivery", header_id: head.header_id, month: this.months[i], target: table_detail[i].delivery_target }, true);
    //                 }
    //             }
    //             else if (mode == "EDIT") {
    //                  let entity = <KloEntitySet<d_pc_trgt_mnthly_itm>>await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': head.header_id, loadAll: true });
    //                 for (let i = 0; i <= 11; i++) {
    //                     let item = await entity.filter(item => (item.month === this.months[i]));
    //                     item[0].target = table_detail[i].delivery_target;
    //                     item[1].target = table_detail[i].sales_target;
    //                 }
    //             }
    //             await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    //         }
    //         else if (salestotal != 100 && deliverytotal == 100) {
    //             sap.m.MessageBox.error("Sales Total not 100%", { title: "Error", });
    //         }
    //         else if (salestotal == 100 && deliverytotal != 100) {
    //             sap.m.MessageBox.error("Delivery Total not 100%", { title: "Error", });
    //         }
    //         else if (salestotal != 100 && deliverytotal != 100) {
    //             sap.m.MessageBox.error("Sales and Delivery Total not 100%", { title: "Error", });
    //         }
    //     }
    //     else if (head.identifier == "FA") {
    //         let salesitem = head.r_sales_target;
    //         let sales_total = 0.0;
    //         for (let i = 0; i < salesitem.length; i++) {
    //             sales_total = sales_total + parseFloat(salesitem[i].target_amount);
    //         }
    //         let delitem = head.r_delivery_target;
    //         let del_total = 0.0;
    //         for (let i = 0; i < delitem.length; i++) {
    //             del_total = del_total + parseFloat(delitem[i].delivery_target);
    //         }
    //         if (sales_total == head.overall_target && del_total == head.overall_target) {
    //             await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    //         }
    //         else if (sales_total != head.overall_target && del_total == head.overall_target) {
    //             sap.m.MessageBox.error("Sales Total not matching with Total Target", { title: "Error", });
    //         }
    //         else if (sales_total == head.overall_target && del_total != head.overall_target) {
    //             sap.m.MessageBox.error("Delivery Total not matching with Total Target", { title: "Error", });
    //         }
    //         else if (sales_total != head.overall_target && del_total != head.overall_target) {
    //             sap.m.MessageBox.error("Sales and Delivery Total not matching with Total Target", { title: "Error", });
    //         }
    //     }
    //     oBusyDailog.close();
    // }
    public async onSaving() {
        let oBusyDailog = new sap.m.BusyDialog().open();
        let mode = this.getMode();
        let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
        if (head.identifier === "PC") {
            let salestotal = 0.0;
            let deliverytotal = 0.0;
            let table_detail = this.tm.getTN('table_detail').getData();
        
            // Helper function to create entities
            const createEntities = async (table_detail) => {
                for (let i = 0; i <= 11; i++) {
                    await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', { target_type: "Sales", header_id: head.header_id, month: this.months[i], target: table_detail[i].sales_target }, true);
                    await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', { target_type: "Delivery", header_id: head.header_id, month: this.months[i], target: table_detail[i].delivery_target }, true);
                }
            };
        
            // Helper function to update entities
            const updateEntities = async (table_detail, entity) => {
                for (let i = 0; i <= 11; i++) {
                    let item = await entity.filter(item => (item.month === this.months[i]));
                    if (item.length > 0) {
                        item[0].target = table_detail[i].delivery_target;
                        item[1].target = table_detail[i].sales_target;
                    }
                }
            };
        
            // Calculate totals
            for (let i = 0; i <= 11; i++) {
                let checklist = table_detail.filter(item => item.month === this.months[i]);
                if (checklist.length > 0) {
                    deliverytotal += parseFloat(checklist[0].delivery_target);
                    salestotal += parseFloat(checklist[0].sales_target);
                }
            }
        
            // Check totals and perform actions
            if (salestotal === 100 && deliverytotal === 100) {
                if (mode === "CREATE") {
                    await createEntities(table_detail);
                } else if (mode === "EDIT") {
                    let entity = await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': head.header_id, loadAll: true });
                    await updateEntities(table_detail, entity);
                }
                await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            } else {
                if (mode === "CREATE") {
                    await createEntities(table_detail);
                } else if (mode === "EDIT") {
                    let entity = await this.transaction.getExecutedQuery('d_pc_trgt_mnthly_itm', { 'header_id': head.header_id, loadAll: true });
                    await updateEntities(table_detail, entity);
                }
                // Display appropriate warnings
                if (salestotal !== 100 && deliverytotal === 100) {
                    sap.m.MessageBox.warning("Sales Total not 100%", { title: "Warning" });
                } else if (salestotal === 100 && deliverytotal !== 100) {
                    sap.m.MessageBox.warning("Delivery Total not 100%", { title: "Warning" });
                } else if (salestotal !== 100 && deliverytotal !== 100) {
                    sap.m.MessageBox.warning("Sales and Delivery Total not 100%", { title: "Warning" });
                }
                await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            }
        }
         else if (head.identifier == "FA") {
            let salesitem = head.r_sales_target;
            let sales_total = 0.0;
            for (let i = 0; i < salesitem.length; i++) {
                sales_total = sales_total + parseFloat(salesitem[i].target_amount);
            }
            let delitem = head.r_delivery_target;
            let del_total = 0.0;
            for (let i = 0; i < delitem.length; i++) {
                del_total = del_total + parseFloat(delitem[i].delivery_target);
            }
            if (sales_total == head.overall_target && del_total == head.overall_target) {
                await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            } else {
                if (sales_total != head.overall_target && del_total == head.overall_target) {
                    sap.m.MessageBox.warning("Sales Total not matching with Total Target", { title: "Warning" });
                } else if (sales_total == head.overall_target && del_total != head.overall_target) {
                    sap.m.MessageBox.warning("Delivery Total not matching with Total Target", { title: "Warning" });
                } else if (sales_total != head.overall_target && del_total != head.overall_target) {
                    sap.m.MessageBox.warning("Sales and Delivery Total not matching with Total Target", { title: "Warning" });
                }
                await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
            }
        }
        oBusyDailog.close();
    }    
    public async onDetailCancel() {
        await this.transaction.rollback();
        this.setMode("DISPLAY");
        await this.tm.getTN("pc_trgt_hdr_list").refresh();
        await this.navTo(({ S: "p_pc_trgt_hdr", SS: "s_pc_trgt_list" }))
    }
    public async ontargetchange() {
        let header_list
        let target_fy
        let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
        if (head.target_fy == undefined) {
            head.overall_target = head.overall_target_in_cr * 100000;
        }
        else {
            header_list = await this.transaction.getExecutedQuery('d_pc_trgt_hdr', { profit_center: head.profit_center, target_fy: head.target_fy, loadAll: true });
            if (head.identifier == "PC") {
                let counter = 0;
                let functional_area_entity = await header_list.filter(item => (item.identifier === "FA"));
                for (let i = 0; i < functional_area_entity.length; i++) {
                    counter = counter + parseFloat(functional_area_entity[i].overall_target_in_cr);
                }
                let table_detail = await this.tm.getTN("table_detail").getData()
                if (head.overall_target_in_cr >= counter) {
                    head.overall_target = parseFloat(head.overall_target_in_cr) * 100000;
                }
                else {
                    sap.m.MessageBox.error("Total Functional Area Target is Already Set to" + counter + " Lakhs", { title: "WARNING", });
                    head.overall_target = parseFloat(head.overall_target_in_cr) * 100000;
                }
                for (let i = 0; i <= 11; i++) {
                    table_detail[i].sales_cal = parseFloat(head.overall_target) * parseFloat(table_detail[i].delivery_target) / 10000000;
                    table_detail[i].del_cal = parseFloat(head.overall_target) * parseFloat(table_detail[i].delivery_target) / 10000000;
                }
            }
            else if (head.identifier == "FA") {
                let counter = 0;
                let functional_area_entity = await header_list.filter(item => (item.identifier === "FA"));
                let profit_center_entity = await header_list.filter(item => (item.identifier === "PC"));
                head.overall_target = parseFloat(head.overall_target_in_cr) * 100000;
                for (let i = 0; i < functional_area_entity.length; i++) {
                    if (functional_area_entity[i].header_id != head.header_id)
                        counter = counter + parseFloat(functional_area_entity[i].overall_target_in_cr);
                }
                counter = counter + parseFloat(head.overall_target_in_cr);
                if (parseFloat(profit_center_entity[0].overall_target_in_cr) >= counter) {
                }
                else {
                    let difference = counter - parseFloat(profit_center_entity[0].overall_target_in_cr);
                    sap.m.MessageBox.warning("Profit Center Target is Already Exceeded by" + difference + " Lakhs", { title: "WARNING", });
                }
            }
        }
    }
    public async onsaleschange(oEvent) {
        let total = 0;
        let sPath: string = this.getPathFromEvent(oEvent);
        let list = this.tm.getTN("r_sales_target_list").getData();
        let index = parseInt(sPath.replace("/r_sales_target_list/", ''));
        let sales = this.tm.getTN("r_sales_target_list").getData()[index];
        await this.tm.getTN("r_delivery_target_list").setActive(index);
        sales.target_amount = parseFloat(sales.target_amount_cr) * 100000;
        for (let i = 0; i < list.length; i++) {
            total += parseFloat(list[i].target_amount_cr);
        }

        list[0].sales_list_four = total;
    }
    public async ondeliverychange(oEvent) {
        let total = 0;
        let sPath: string = this.getPathFromEvent(oEvent);
        let list = this.tm.getTN("r_delivery_target_list").getData();
        let index = parseInt(sPath.replace("/r_delivery_target_list/", ''));
        let delivery = this.tm.getTN("r_delivery_target_list").getData()[index];
        await this.tm.getTN("r_delivery_target_list").setActive(index);
        delivery.delivery_target = parseFloat(delivery.delivery_target_cr) * 100000;
        for (let i = 0; i < list.length; i++) {
            total += parseFloat(list[i].delivery_target_cr);
        }

        list[0].deliv_list_three = total;
    }
    public async onSalesTargetChange() {
        let total = 0;
        let list = this.tm.getTN("table_detail").getData();
        for (let i = 0; i < list.length; i++) {
            let target = parseFloat(list[i].sales_cal)
            total += isNaN(target) ? 0 : target;
        }
        list[0].month_list_three = total
    }
    public async onsalespercentchange(oEvent) {
        let total = 0;
        let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
        let sPath: string = this.getPathFromEvent(oEvent);
        let list = await this.tm.getTN("table_detail").getData()
        let index = parseInt(sPath.replace("/table_detail/", ''));
        let sales = this.tm.getTN("table_detail").getData()[index];
        await this.tm.getTN("table_detail").setActive(index);
        sales.sales_cal = parseFloat(head.overall_target) * parseFloat(sales.sales_target) / 10000000;
        await this.onSalesTargetChange();
        for (let i = 0; i < list.length; i++) {
            let target = parseFloat(list[i].sales_target);
            total += isNaN(target) ? 0 : target;
        }
        list[0].month_list_two = total;
        await this.tm.getTN('table_detail').refresh();
    }
    public async onDeliveryTargetChange() {
        let total = 0;
        let list = this.tm.getTN("table_detail").getData();
        for (let i = 0; i < list.length; i++) {
            let target = parseFloat(list[i].del_cal);
            total += isNaN(target) ? 0 : target;
        }
        list[0].month_list_five = total
    }
    public async ondelpercentchange(oEvent) {
        let total = 0;
        let head = this.tm.getTN("pc_trgt_hdr_detail").getData();
        let sPath: string = this.getPathFromEvent(oEvent);
        let list = await this.tm.getTN("table_detail").getData();
        let index = parseInt(sPath.replace("/table_detail/", ''));
        let delivery = this.tm.getTN("table_detail").getData()[index];
        await this.tm.getTN("table_detail").setActive(index);
        delivery.del_cal = parseFloat(head.overall_target) * parseFloat(delivery.delivery_target) / 10000000;
        await this.onDeliveryTargetChange();
        for (let i = 0; i < list.length; i++) {
            let target = parseFloat(list[i].delivery_target);
            total += isNaN(target) ? 0 : target;
        }
        list[0].month_list_four = total;
        await this.tm.getTN('table_detail').refresh()
    }
}