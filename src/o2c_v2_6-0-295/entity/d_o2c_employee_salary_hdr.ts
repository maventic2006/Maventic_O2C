import { AccessTokenHelper, EntityAccessTokenCallbackReturnType } from "kloBo/KloEntity";
import { KloTransaction } from "kloBo/KloTransaction";
import { d_o2c_employee_salary_hdr as d_o2c_employee_salary_hdr_gen } from "o2c_v2/entity_gen/d_o2c_employee_salary_hdr"
import { employeeHierarchy } from "o2c_v2/util/employeeHierarchy";
export class d_o2c_employee_salary_hdr extends d_o2c_employee_salary_hdr_gen {
  static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
    txn.$SYSTEM.tenantID = 1;
    let accessTokenMap: EntityAccessTokenCallbackReturnType = {};
    let emp_designation = await txn.getExecutedQuery(
      "q_travel_expense_all_emp",
      {
        loadAll: true,
        name: "FINANCE"
      }
    );
    // for (let user_id of Object.keys(userAppRoleMap)) {
    //   let userDesignationFinance = emp_designation.filter((item) => item.employee_id.toLowerCase() == user_id.toLowerCase());
    //   if (userAppRoleMap[user_id] == "FINANCE" || userDesignationFinance.length > 0) {
    //     accessTokenMap[user_id] = { access_tokens: ["*"] }
    //   }
    // }

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

      if (userAppRoleMap[user_id] == "FINANCE") {
        accessTokenMap[user_id] = { access_tokens: ["*"] }
      }

      if (userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "TOP_MANAGEMENT") {        
        for (let a of allEmployeeUnderHierarchy) {
          accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("emp_mentee", { employee_id: a }))
        }
      } 
      accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("emp_mentee", { employee_id:user_id}))
    }
    return accessTokenMap;
  }


}