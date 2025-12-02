import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_asset_purchase_approval } from 'o2c_v2/entity_gen/d_asset_purchase_approval';
import { d_asset_purchase_master } from 'o2c_v2/entity_gen/d_asset_purchase_master';
import { d_leave_approval_master } from 'o2c_v2/entity_gen/d_leave_approval_master';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_pur_approval")

export default class p_asset_pur_approval extends KloController {
    public roleid;
    public userid;
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }

    public async onPageEnter(oEvent) {
        
        this.userid = (await this.transaction.get$User()).login_id;
        this.roleid = (await this.transaction.get$Role()).role_id;
        
        if(this.roleid == undefined){
            this.roleid = "x"
        }
        this.tm.getTN("search_approval").setProperty('role', this.roleid);
		await this.tm.getTN("search_approval").executeP();
    }

    public async navToDetails(oEvent) {

        await this.navTo(({ SS: 's_asset_detail' }), oEvent)

    }

    public async approvalflowMaster() {

        let listData = this.tm.getTN('list_asset_purchase').getActiveData();        
        let currentAprData = <KloEntitySet<d_asset_purchase_approval>>await this.transaction.getExecutedQuery('d_asset_purchase_approval', { 'purchase_request': listData.purchase_request, 'role': this.roleid, 'approval_status': 'Pending', loadAll: true })

        let main_master_table = <KloEntitySet<d_asset_purchase_master>>await this.transaction.getExecutedQuery('d_asset_purchase_master', { 'company_code': listData.company_code, 'business_area': listData.business_area, 'profit_centre': listData.profit_centre, 'asset_type': listData.asset_type, 'request_type': listData.request_type, loadAll: true })
        let masterTable = main_master_table.filter(item => (item.role == this.roleid));

        let level = masterTable[0].level + 1;

        // let nextLevel = main_master_table.filter(item => (parseFloat(item.level) == parseFloat(level)));

        let nextRole = main_master_table.filter(item => (parseFloat(item.level) == parseFloat(level)));

        if(nextRole.length){
            currentAprData[0].approval_status = "Approved";

            // currentAprData[0].approved_on = new Date();
            currentAprData[0].action_required_by = this.userid;
            currentAprData[0].action_required_by_name = "Name";
            await this.transaction.createEntityP('d_asset_purchase_approval', { s_object_type: -1, company_code: listData.company_code, business_area: listData.business_area, role: nextRole[0].role, approval_status: 'Pending', approval_sequence: 1, purchase_request: listData.purchase_request });

        }else{

            currentAprData[0].approval_status = "Approved";

            // currentAprData[0].approved_on = new Date();
            currentAprData[0].action_required_by = this.userid;
            currentAprData[0].action_required_by_name = "Name";
            listData.status = "Approved";

        }

        await this.tm.commitP("Approved", "Failed", true, true);
        await this.tm.getTN('list_asset_purchase').resetP(true)
    
    }

  


}