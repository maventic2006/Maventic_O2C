import { q_so_list as q_so_list_gen } from "o2c_v2/query_gen/q_so_list"
export class q_so_list extends q_so_list_gen {
    public async soListSearch(Parameters) {
        this.setLoadAll(true);
        //let role = (await this.txn.$SYSTEM.roleID);
        let role = (await this.txn.get$Role()).role_id;
        let user = (await this.txn.get$User()).login_id;
        let role_list = await this.txn.getExecutedQuery('d_second_role_assyn', { employee_id: user, page_name: "SO", loadAll: true });
        if (role_list.length) {
            role = role_list[0].assyned_role;
        }

        let loginProfitCenter = [];
        let loginCompanyCode = [];
        let loginBusinessArea = [];

        let loginOrg = await this.txn.getExecutedQuery('q_current_profit_center', {
            loadAll: true, 'employee_id': user, 'active_till': new Date()
        });
        //let primaryOrg = loginOrg.filter(item => item.is_primary);

        if (role === "TEAM_HEAD") {
            // Initialize arrays and a Set for unique business areas
            const businessAreaSet = new Set();
            const companySet = new Set();

            for (let i = 0; i < loginOrg.length; i++) {
                loginProfitCenter.push(loginOrg[i].profit_centre);
                companySet.add(loginOrg[i].company_code);
                businessAreaSet.add(loginOrg[i].business_area);
            }

            // Convert the Set to an array
            loginCompanyCode = Array.from(companySet);
            loginBusinessArea = Array.from(businessAreaSet);
        }
        else {
            const BASet = new Set();
            const CompSet = new Set();

            for (let i = 0; i < loginOrg.length; i++) {
                CompSet.add(loginOrg[i].company_code);
                BASet.add(loginOrg[i].business_area);
            }

            // Convert the Set to an array
            loginCompanyCode = Array.from(CompSet);
            loginBusinessArea = Array.from(BASet);
        }

        const currentDate = new Date();
        const threeMonthsBefore = new Date();
        threeMonthsBefore.setMonth(currentDate.getMonth() - 3);
        Parameters.object.role_id = role;
        Parameters.object.profit_center_name = loginProfitCenter;
        Parameters.object.company_code = loginCompanyCode;
        Parameters.object.business = loginBusinessArea;
        if (Parameters.object.s_status === undefined || Parameters.object.s_status === null || Parameters.object.s_status === "") {
            Parameters.object.s_status = ["Approved", "Call Back", "Back To Edit", "Pending", "Save As Draft"];
        }
        //new code by Mayank
        if ((Parameters.object.so || Parameters.object.bill_to_customer || Parameters.object.type || Parameters.object.profit_center || Parameters.object.project_name
            || Parameters.object.pre_sales || Parameters.object.project_manager || Parameters.object.sales_responsible || Parameters.object.po_no
        ) &&
            (Parameters.object.s_status === undefined || Parameters.object.s_status === null || Parameters.object.s_status === "")
        ) {
            Parameters.object.s_status = ["Approved", "Call Back", "Back To Edit", "Pending", "Save As Draft", "Closed"];
        }
        //end
        // Parameters.object.current_date_check = currentDate;
        // Parameters.object.three_months_before = threeMonthsBefore;
    }
    public async transPriopertySet() {

        // let entity = this.getEntitySet();
        // for (let i = 0; i < entity.length; i++) {
        //     let totalAmount = 0; // Initialize total amount variable

        //     for (let j = 0; j < entity[i].r_so_attachment.length; j++) {
        //         // Add the item_pd_or_qty to totalAmount
        //         totalAmount += entity[i].r_so_attachment[j].budgeted_pd;
        //     }
        //     // Return the total amount
        //     entity[i].item_pds = totalAmount.toString();

        //     let project_manager = ''
        //     for (let j = 0; j < entity[i].r_profit_center.length; j++) {
        //         if (j > 0) {
        //             project_manager += ",";
        //         }
        //         let profit_pm = entity[i].r_profit_center[j].project_manager;
        //         project_manager += profit_pm;
        //     }
        //     entity[i].transient_pro_manager = project_manager
        // }
    }

}