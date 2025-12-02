import { d_o2c_pa_cycle_id_lm_budget as d_o2c_pa_cycle_id_lm_budget_gen } from "o2c_v2/entity_gen/d_o2c_pa_cycle_id_lm_budget"
import { employeeHierarchy } from "o2c_v2/util/employeeHierarchy";
import { KloTransaction } from "kloBo/KloTransaction";
import { EntityAccessTokenCallbackReturnType } from "kloBo/KloEntity";
import { EventContext } from "kloBo_7-2-228/EventContext";
export class d_o2c_pa_cycle_id_lm_budget extends d_o2c_pa_cycle_id_lm_budget_gen {

    static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
        txn.$SYSTEM.tenantID = 1;
        let accessTokenMap: EntityAccessTokenCallbackReturnType = {};

        // debugger
        // let empArray = await employeeHierarchy.lineManagerEmployeeHierarchy(txn);
        // for (let user_id of Object.keys(userAppRoleMap)) {
        //     const userIdStr = String(user_id); // ensure it's a string key
        //     const normalizedUserId = userIdStr.toLowerCase();

        //     // Find a matching key in empArray ignoring case
        //     const matchingKey = Object.keys(empArray).find(
        //         key => key.toLowerCase() === normalizedUserId
        //     );

        //     const allEmployeeUnderHierarchy = matchingKey ? empArray[matchingKey] : [];
        //     accessTokenMap[user_id] = { access_tokens: [] }
        //     if (userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TOP_MANAGEMENT") {
        //         for (let a of allEmployeeUnderHierarchy) {
        //             accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("line_manager", { employee_id: a }))
        //         }
        //     }

        // }
        for (let user_id of Object.keys(userAppRoleMap)) {
            const userIdStr = String(user_id); // ensure it's a string key
            const normalizedUserId = userIdStr;
            let qSavedData = await txn.getQueryP('q_o2c_lmi_directreported');//this way you can get instance of any query
            qSavedData.setProperty('login_id', normalizedUserId);
            await qSavedData.setLoadAll(true);
            let savedData = await qSavedData.executeP();//execute here
            // Extract employee IDs and include the user themselves
            let employeeArray = (savedData || []).map(item => item.employee_id);
            employeeArray.push(normalizedUserId); // Add self

            accessTokenMap[user_id] = { access_tokens: [] }
            if (userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TOP_MANAGEMENT") {
                for (let a of employeeArray) {
                    accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("line_manager", { line_manager_id: a }))
                }
            }

        }
        return accessTokenMap;
    }
    public async budgetCreation(oEvent: EventContext) {
        let createData = <d_o2c_pa_cycle_id_lm_budget>oEvent.getObject();
        let employee_data = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: createData.line_manager_id, loadAll: true });
        if (!(employee_data[0].line_manager.toLowerCase() == (await this.txn.get$User()).login_id.toLowerCase())) {
            this.info("Dont have access to create");
            // Block the insert by throwing an error
            throw new Error("You do not have access to create this record.");
        }


    }

}
//Done