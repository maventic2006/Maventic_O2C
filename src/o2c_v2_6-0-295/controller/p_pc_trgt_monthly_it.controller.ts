import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_pc_trgt_mnthly_itm } from 'o2c_v2/entity_gen/d_pc_trgt_mnthly_itm';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pc_trgt_monthly_it")
export default class p_pc_trgt_monthly_it extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public entity;
    public is_present = false;
    public async onSearch() {
        let list;
        let array_list = new Set();
        let tf = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('target_fy');
            let pc = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('profit_centre');
            let ot = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('overall_target');
            if(ot&&pc&&tf){
        this.entity = <KloEntitySet<d_pc_trgt_mnthly_itm>>await this.transaction.getExecutedQuery('q_pc_trgt_monthly_itm', { loadAll: true, overall_target: ot, profit_center: pc, target_fy: tf });
            }
            else{
                sap.m.MessageBox.error("Please Fill All Criteria before Searching", { title: "Error", });
            }
        if (this.entity.length) {
            this.is_present = true;
            console.log("entity found");
            this.tm.getTN("table_detail").setData({});
            let item = await this.entity.filter(item => (item.month === "Apr"));
            let employee_table = { month: "Apr", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "May"));
            employee_table = { month: "May", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Jun"));
            employee_table = { month: "Jun", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Jul"));
            employee_table = { month: "Jul", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Aug"));
            employee_table = { month: "Aug", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Sep"));
            employee_table = { month: "Sep", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Oct"));
            employee_table = { month: "Oct", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Nov"));
            employee_table = { month: "Nov", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Dec"));
            employee_table = { month: "Dec", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Jan"));
            employee_table = { month: "Jan", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Feb"));
            employee_table = { month: "Feb", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            item = await this.entity.filter(item => (item.month === "Mar"));
            employee_table = { month: "Mar", sales_target: item[1].target, delivery_target: item[0].target };
            array_list.add(employee_table);
            list = Array.from(array_list);
            await this.tm.getTN("table_detail").setData(list);
            this.tm.getTN("table_detail").refresh()
        }
        else {
            this.tm.getTN("table_detail").setData({});
            let employee_table = { month: "Apr", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "May", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Jun", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Jul", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Aug", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Sep", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Oct", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Nov", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Dec", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Jan", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Feb", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            employee_table = { month: "Mar", sales_target: undefined, delivery_target: undefined };
            array_list.add(employee_table);
            list = Array.from(array_list);
            await this.tm.getTN("table_detail").setData(list);
            this.tm.getTN("table_detail").refresh()
        }
    }
    public onEditing() {
        this.setMode('EDIT');
    }
    public async onSaving() {
        if (this.is_present == true) {
            let table_detail = this.tm.getTN('table_detail').getData();
            console.log(table_detail)
            let item = await this.entity.filter(item => (item.month === "Apr"));
            item[0].target = table_detail[0].delivery_target;
            item[1].target = table_detail[0].sales_target;
            item = await this.entity.filter(item => (item.month === "May"));
            item[0].target = table_detail[1].delivery_target;
            item[1].target = table_detail[1].sales_target;
            item = await this.entity.filter(item => (item.month === "Jun"));
            item[0].target = table_detail[2].delivery_target;
            item[1].target = table_detail[2].sales_target;
            item = await this.entity.filter(item => (item.month === "Jul"));
            item[0].target = table_detail[3].delivery_target;
            item[1].target = table_detail[3].sales_target;
            item = await this.entity.filter(item => (item.month === "Aug"));
            item[0].target = table_detail[4].delivery_target;
            item[1].target = table_detail[4].sales_target;
            item = await this.entity.filter(item => (item.month === "Sep"));
            item[0].target = table_detail[5].delivery_target;
            item[1].target = table_detail[5].sales_target;
            item = await this.entity.filter(item => (item.month === "Oct"));
            item[0].target = table_detail[6].delivery_target;
            item[1].target = table_detail[6].sales_target;
            item = await this.entity.filter(item => (item.month === "Nov"));
            item[0].target = table_detail[7].delivery_target;
            item[1].target = table_detail[7].sales_target;
            item = await this.entity.filter(item => (item.month === "Dec"));
            item[0].target = table_detail[8].delivery_target;
            item[1].target = table_detail[8].sales_target;
            item = await this.entity.filter(item => (item.month === "Jan"));
            item[0].target = table_detail[9].delivery_target;
            item[1].target = table_detail[9].sales_target;
            item = await this.entity.filter(item => (item.month === "Feb"));
            item[0].target = table_detail[10].delivery_target;
            item[1].target = table_detail[10].sales_target;
            item = await this.entity.filter(item => (item.month === "Mar"));
            item[0].target = table_detail[11].delivery_target;
            item[1].target = table_detail[11].sales_target;
        }
        else {
            let table_detail = this.tm.getTN('table_detail').getData();
            let tf = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('target_fy');
            let pc = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('profit_centre');
            let ot = this.tm.getTN("pc_trgt_mnthly_itm_search").getProperty('overall_target');
            let head=await this.transaction.createEntityP('d_pc_trgt_hdr', {overall_target: ot, profit_center: pc, target_fy: tf}, true);
            let months = [
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
                "Jan",
                "Feb",
                "Mar"
            ]
            for(let i=0;i<=11;i++){
                await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', {target_type: "Sales", header_id: head[0].header_id, month: months[i],target:table_detail[i].sales_target}, true);
                await this.transaction.createEntityP('d_pc_trgt_mnthly_itm', {target_type: "Delivery", header_id: head[0].header_id, month: months[i],target:table_detail[i].delivery_target}, true);
            }
        }
        await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
    }
}