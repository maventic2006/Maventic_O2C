import { AccessTokenHelper, EntityAccessTokenCallbackReturnType } from "kloBo/KloEntity";
import { KloTransaction } from "kloBo/KloTransaction";
import { EventContext } from "kloBo/EventContext";
import { d_o2c_emp_pa_cycle as d_o2c_emp_pa_cycle_gen } from "o2c_v2/entity_gen/d_o2c_emp_pa_cycle"
export class d_o2c_emp_pa_cycle extends d_o2c_emp_pa_cycle_gen {
  static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
    txn.$SYSTEM.tenantID = 1;
    let accessTokenMap: EntityAccessTokenCallbackReturnType = {};

    // txn.recalculateUserAccessToken()

    debugger

    let employee_org = await txn.getExecutedQuery("d_o2c_employee_org", { employee_id: Object.keys(userAppRoleMap), loadAll: true });


    for (let user_id of Object.keys(userAppRoleMap)) {
      accessTokenMap[user_id] = { access_tokens: [] }
      if (userAppRoleMap[user_id] == "TEAM_HEAD" || userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "HR" || userAppRoleMap[user_id] == "TOP MANAGEMENT") {

        let userDesignationcheck = employee_org.filter((item) => item.employee_id.toLowerCase() == user_id.toLowerCase());
        for (let a of userDesignationcheck) {
          accessTokenMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("emp_pa", { company_code: a.company_code,/* business_area: a.business_area,*/ profit_center: a.profit_centre }))
        }
      }
      if (userAppRoleMap[user_id] == "FINANCE") {
        accessTokenMap[user_id] = { access_tokens: ["*"] }
      }
    }
    return accessTokenMap;
  }
  public async paCycleCreation(oEvent: EventContext) {
    const createData = <d_o2c_emp_pa_cycle>oEvent.getObject();
    const currentUser = await this.txn.get$User();
    const currentRole = await this.txn.get$Role();

    const employee_org = await this.txn.getExecutedQuery("q_current_profit_center", {
      employee_id: currentUser.login_id,
      active_till: new Date(),
      loadAll: true
    });

    const matchedOrg = employee_org.find(org =>
      org.company_code === createData.company_code &&
      org.profit_centre === createData.profit_center
    );

    if (!(currentRole.role_id === "TEAM_HEAD" && matchedOrg)) {
      this.info("Don't have access to create");
      throw new Error("You do not have access to create this record.");
    }
  }

}