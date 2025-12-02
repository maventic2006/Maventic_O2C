import { KloAppService } from "kloBo/KloAppService";
import { LogManager } from "kloBo/Logger/LogManager";
import { ModuleType } from "kloBo/KloEnums";

const Logger = LogManager.getLogger(ModuleType.APP); //--khameer

export class getServerResponse extends KloAppService {
	public async onExecute() {
		debugger;
		Logger.__info("SHEDULER IN APP SERVICES ON EXECUTE :", JSON.stringify(this?.data));
		let token = this.data.token;
		let email = this.data.email;
		let env = this.data.env;
		let start_date = this.data.start_date;
		let end_date = this.data.end_date;
		let api_id = this.data.api_id;
		let url = this.data.url;
		Logger.__info("SHEDULER IN APP SERVICES ON EXECUTE :", email, env, token);
		// let apiId = await this.getUserDetail(token, email, env);
		// if (apiId == null) {
		//     return null
		// }
		let apiCount = await this.getApiCount(api_id, email, start_date, end_date, env, token, url);
		return apiCount;
	}
	// public async getUserDetail(token, email, env) {
	//     const authUrl = `https://api.maventic.in/mFleet/api/getUser?email=${email}&env=${env}`;
	//     try {
	//         const response = await fetch(authUrl, {
	//             method: 'GET',
	//             headers: {
	//                 Authorization: token,
	//             },
	//         });
	//         let data = await response.json();
	//         const allowedApis = data.allowedApis;
	//         let apiId;
	//         for (let api of allowedApis) {
	//             if (api.groupId == null) {
	//                 apiId = api.apiId;
	//                 break;
	//             }
	//         }
	//         return apiId;
	//     } catch (error) {
	//         console.error('Authentication failed:', error);
	//         return null;
	//     }

	// }

	public async getApiCount(apiId, email, start_date, end_date, env, token, url) {
		debugger;
		Logger.__info("SHEDULER IN APP SERVICES :", email, env, token); //--khameer
		const authUrl = `${url}?user=${email}&startingDate=${start_date}&env=${env}&endingDate=${end_date}&apiId=${apiId}`;
		try {
			const response = await fetch(authUrl, {
				method: "GET",
				headers: {
					Authorization: token,
				},
			});
			let data = await response.json();
			Logger.__info("SHEDULER IN APP SERVICES :", authUrl); //--khameer
			return data;
		} catch (error) {
			Logger.__info("SHEDULER API Count failed:", error);
			console.error("API Count failed:", error); //should use logger --khameer
			return null;
		}
	}
}
