import { d_pms_feedback as d_pms_feedback_gen } from "o2c_v2/entity_gen/d_pms_feedback";
import { AccessTokenHelper, EntityAccessTokenCallbackReturnType } from "kloBo/KloEntity";
import { KloTransaction } from "kloBo/KloTransaction";

export class d_pms_feedback extends d_pms_feedback_gen {
	static async getAccessTokensForUsers(txn: KloTransaction, flavor: string, version: string, userAppRoleMap: { [user_id: string]: string }, accessTokenHelper: AccessTokenHelper): Promise<EntityAccessTokenCallbackReturnType> {
		let userIdList = Object.keys(userAppRoleMap);

		let accessTokensMap: EntityAccessTokenCallbackReturnType = {}; //
		debugger;
		for (let user_id of userIdList) {
			if (!accessTokensMap[user_id]) accessTokensMap[user_id] = { access_tokens: [] };
			if (user_id == "pr0030") {
				// Admin can see all data.
				accessTokensMap[user_id].access_tokens.push("*");
			}
			if (userAppRoleMap[user_id] == "EMPLOYEE") {
				let employeeListUnderMgr = await txn.getExecutedQuery("d_pms_feedback", { assessor: user_id });
				if (employeeListUnderMgr.length > 0) {
					accessTokensMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("given_feedback", { assessor: user_id }));
				}
				accessTokensMap[user_id].access_tokens.push(
					await accessTokenHelper.getAccessToken(
						"my_feedback" /** ID from access token screen - not the property*/,
						{
							assessee: user_id,
						} /** Object with property : value for properties used in access token.*/
					)
				);
			} else if (userAppRoleMap[user_id] == "MANAGER" || userAppRoleMap[user_id] == "TEAM HEAD" || userAppRoleMap[user_id] == "TOP MANAGEMENT" || userAppRoleMap[user_id] == "HR") {
				let employeeListUnderMgr = await txn.getExecutedQuery("d_pms_feedback", { assessor: user_id });
				// for (let empData of employeeListUnderMgr) accessTokensMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("my_feedback", { assessee: empData.assessee }));
				//Manager can also be a peer
				accessTokensMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("given_feedback", { assessor: user_id }));
				accessTokensMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("my_feedback", { assessee: user_id }));
			}
			// accessTokensMap[user_id].access_tokens.push(await accessTokenHelper.getAccessToken("given_feedback", { assessor: user_id }));
		}

		return accessTokensMap;
	}
	public get overall_fd_rating_text() {
		if (this.overall_feedback == 1) return "Poor";
		if (this.overall_feedback == 2) return "Fair";
		if (this.overall_feedback == 3) return "Good";
		if (this.overall_feedback == 4) return "Very Good";
		if (this.overall_feedback == 5) return "Excellent";
	}
}
