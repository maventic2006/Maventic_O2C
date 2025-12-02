import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_overdue_invoic")
export default class p_o2c_overdue_invoic extends KloController {

    /*public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }*/

    public async onUploadingExcelDialog() {
        try {
            let dbTable;
    
            while (true) {
                dbTable = await this.tm.getTN("overdue_invoice_list").getData();
    
                if (dbTable.length === 0) break;
    
                const deletePromises = dbTable.map(record => record.deleteP());
    
                await Promise.all(deletePromises);
    
                await this.tm.commitP();
            }
        } catch (error) {
            console.error("Error deleting data:", error);
            throw new Error("Failed to delete data from the table.");
        }
    }
    
    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_o2c_key_project" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_o2c_action_items" }))
    }



}