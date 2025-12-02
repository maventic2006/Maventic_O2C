import { AccessTokenHelper, EntityAccessTokenCallbackReturnType } from "kloBo/KloEntity";
import { KloTransaction } from "kloBo/KloTransaction";
import { d_pa_ind_emp_planning_hdr as d_pa_ind_emp_planning_hdr_gen } from "o2c_v2/entity_gen/d_pa_ind_emp_planning_hdr"
import { employeeHierarchy } from "o2c_v2/util/employeeHierarchy";
export class d_pa_ind_emp_planning_hdr extends d_pa_ind_emp_planning_hdr_gen {


    // static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
    //     txn.$SYSTEM.tenantID = 1;
    //     let accessTokenMap: EntityAccessTokenCallbackReturnType = {};

    //     debugger
    //     let empArray = await employeeHierarchy.lineManagerEmployeeHierarchy(txn);

    //     for (let user_id of Object.keys(userAppRoleMap)) {
    //         accessTokenMap[user_id] = { access_tokens: [] }
    //         if (userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TOP_MANAGEMENT" || userAppRoleMap[user_id] == "FINANCE") {

    //             //util file for where we will get the employee direct reported to the user

    //             // const userIdStr = String(user_id); // ensure it's a string key for fullHierarchyMap
    //             // const allEmployeeUnderHierarchy = empArray[userIdStr] || [];

    //             const userIdStr = String(user_id); // ensure it's a string key
    //             const normalizedUserId = userIdStr.toLowerCase();

    //             // Find a matching key in empArray ignoring case
    //             const matchingKey = Object.keys(empArray).find(
    //                 key => key.toLowerCase() === normalizedUserId
    //             );

    //             const allEmployeeUnderHierarchy = matchingKey ? empArray[matchingKey] : [];
    //             for (let a of allEmployeeUnderHierarchy) {
    //                 accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("hiearchy_emp", { employee_id: a}))
    //             }
    //         }
    //         if (userAppRoleMap[user_id] == "FINANCE") {
    //             accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("hiearchy_emp_status", { s_status: "Accepted" }));
    //         }
    //     }
    //     return accessTokenMap;
    // }
    static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
        txn.$SYSTEM.tenantID = 1;
        let accessTokenMap: EntityAccessTokenCallbackReturnType = {};

        debugger
        let empArray = await employeeHierarchy.lineManagerEmployeeHierarchy(txn);

        for (let user_id of Object.keys(userAppRoleMap)) {
            const userIdStr = String(user_id); // ensure it's a string key
            const normalizedUserId = userIdStr.toLowerCase();

            // Find a matching key in empArray ignoring case
            const matchingKey = Object.keys(empArray).find(
                key => key.toLowerCase() === normalizedUserId
            );

            const allEmployeeUnderHierarchy = matchingKey ? empArray[matchingKey] : [];
            accessTokenMap[user_id] = { access_tokens: [] }
            if (userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TOP_MANAGEMENT" || userAppRoleMap[user_id] == "FINANCE") {
                for (let a of allEmployeeUnderHierarchy) {
                    accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("hiearchy_emp", { employee_id: a }))
                }
            }
            if (userAppRoleMap[user_id] == "FINANCE") {

                accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("hiearchy_emp_status", { s_status: "Accepted" }));

            }
        }
        return accessTokenMap;
    }
    //customize sorting based on status
    public get sorting_status_key(): number {
        let key
        if (this.s_status == "Pending")
            key = 1;
        if (this.s_status == "Save As Draft")
            key = 2;
        if (this.s_status == "Rework")
            key = 3;
        if (this.s_status == "Hold")
            key = 4;
        if (this.s_status == "Submitted")
            key = 5;
        if (this.s_status == "Approved")
            key = 6;
        if (this.s_status == "Accepted")
            key = 7;
        if (this.s_status == "Review")
            key = 8;
        if (this.s_status == "Confirmed")
            key = 9;
        if (this.s_status == "Review declined")
            key = 10;
        return key;
    }
    public set sorting_status_key(new_value: number) { this.s("sorting_status_key", new_value, "number", false, false) }

}
