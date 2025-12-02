import kloScheduler from "kloBo/kloScheduler/KloScheduler";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { KloTransaction } from "kloBo/KloTransaction";
import { d_o2c_so_item } from "o2c_v2/entity_gen/d_o2c_so_item";
import { d_o2c_so_api_type } from "o2c_v2/entity_gen/d_o2c_so_api_type";
import { AUTHORIZATION_TYPE, KloAjax } from "kloBo/kloCommon/KloAjaxHandler";
import { salesorder } from "o2c_v2/util/salesorder";
import { ModuleType } from "kloBo/KloEnums";
import { LogManager } from "kloBo/Logger/LogManager";
import { getServerResponses } from "o2c_v2/util/getServerResponses";

const Logger = LogManager.getLogger(ModuleType.APP);
export class daily_server_response extends kloScheduler {
	public async onExecute() {
		return new Promise((res) => {
			setTimeout(async () => {
				// let empIdSet = new Set();
				let error = "NO Error";
				let error2 = "NO Error";
				const today = new Date();
				let txn: KloTransaction = this.eventContext.getTxn();
				let System = await import("kloBo/kloCommon/System/System");
				let soItem = <KloEntitySet<d_o2c_so_item>>await txn.getExecutedQuery("d_o2c_so_item", { loadAll: true, item_category: ["API", "USRSUBSCR"], expandAll: "r_billing_new,r_schedule_new,r_vol_based_new,r_item_api_type/r_api_client_map,r_item_api_type,r_item_api_type/r_api_gsp_map,r_item_api_type/r_api_gsp_map/r_gsp_provider_prprty_map,r_item_attachment,r_item_attachment/r_attachment_header" });
				try {
					for (let i = 0; i < soItem.length; i++) {
						const { dateKey, startDateKey } = this.resolveDateKey(soItem[i]);
						const billingData = this.resolveBillingData(soItem[i]);

						if (!billingData || billingData.length === 0) {
							continue; // 🛑 Skip this item if no billing/schedule/vol_based data
						}

						for (let bill of billingData) {
							if (this.isSameDate(bill[dateKey], today)) {
								// Dates match, time is ignored
								let apiType = soItem[i].r_item_api_type || [];
								//looping the provider
								for (let api of apiType) {
									let api_gsp_map = api.r_api_gsp_map;
									if (api_gsp_map.length === 0) continue; // 🛑 Skip if no API GSP Map
									let api_gsp = api_gsp_map.filter((gsp) => gsp.billing_method == "API");
									let provider_master = api_gsp[0].r_gsp_provider_prprty_map || []; //Getting only that gsp which has billing method API so it will always be unique.
									let client_master = api.r_api_client_map || [];
									let providerFieldMapping = this.extractFieldMapping(provider_master);
									let clientFieldMapping = this.extractFieldMapping(client_master);

									let token_value = api_gsp_map[0][providerFieldMapping["token"]];
									let monthly_consumption_url = api_gsp_map[0][providerFieldMapping["monthly consumption url"]];
									let mail_value = api_gsp_map[0][providerFieldMapping["mail"]];
									let env_value = api_gsp_map[0][providerFieldMapping["env"]];
									let apiId = api[clientFieldMapping["api id"]];
									let auth_url = api_gsp_map[0][providerFieldMapping["auth url"]];
									let handle_value = api_gsp_map[0][providerFieldMapping["handle"]];
									let handle_type_value = api_gsp_map[0][providerFieldMapping["handle type"]];
									let task_url = api_gsp_map[0][providerFieldMapping["task url"]];
									let org_id = api[clientFieldMapping["org id"]];
									let password_value = api[clientFieldMapping["password"]];
									let status_url = api_gsp_map[0][providerFieldMapping["status url"]];
									let token_duration_value = api_gsp_map[0][providerFieldMapping["token duration in mins"]];
									let vayana_report_url = api_gsp_map[0][providerFieldMapping["report download url"]];

									const dateFormat = api.provider === "Vayana" ? "YYYYMMDD" : "YYYY-MM-DD";
									const start_date_value = this.formatDate(bill[startDateKey], dateFormat);
									const end_date_value = this.formatDate(bill.end_date, dateFormat);
									// const oUrl = System.System.gi_URI().getAppServiceUrl(this.operatingFlavor, this.operatingFlavorVersion, "getServerResponses", true); //--khameer
									// Logger.__info("SHEDULER EXECUTING khameer_DOB_33:", oUrl, mail_value, System.System.gi().isNode());
									switch (api.provider) {
										case "mAPI":
											try {
												// let mAPIres = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
												// 	url: "app_service/OTC/o2c_v2_6-0-183/getServerResponses",
												// 	data: {
												// 		api_id: "672b4288697601cce68b2f3e", //apiId,
												// 		email: mail_value, //mail_value,
												// 		start_date: "2024-11-01", //start_date_value,
												// 		end_date: "2024-11-31", //end_date_value,
												// 		// env must be configurable based on the landscape to know that it is dev or prd
												// 		env: "sandbox",
												// 		// The token should be configurable and is valid till 6 months after the date of creation.
												// 		token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImludGVybmFsLm1hdmVudGljLTFAbWF2ZW50aWMuY29tIiwicm9sZSI6InVzZXIiLCJhcGlJYXQiOjE3NDQyNzI2MzksImFwaXRva2VuIjp7ImlzQXBpVG9rZW4iOnRydWV9LCJjcmVhdGVkQnkiOiJhZG1pbkBtYXZlbnRpYy5jb20iLCJlbnYiOiJzYW5kYm94IiwiaWF0IjoxNzQ0MjcyNjM5LCJleHAiOjE3NTk4MjQ2Mzl9.UeSPi8aDjQBTi4GH5Ff-uEWKm_i2d_hQeWprcPPIM-c",
												// 		url: "https://api.maventic.in/mFleet/api/getTotalMonthlyConsumption", //monthly_consumption_url
												// 	},
												// 	// headers: {
												// 	// 	Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImludGVybmFsLm1hdmVudGljLTFAbWF2ZW50aWMuY29tIiwicm9sZSI6InVzZXIiLCJhcGlJYXQiOjE3NDQyNzI2MzksImFwaXRva2VuIjp7ImlzQXBpVG9rZW4iOnRydWV9LCJjcmVhdGVkQnkiOiJhZG1pbkBtYXZlbnRpYy5jb20iLCJlbnYiOiJzYW5kYm94IiwiaWF0IjoxNzQ0MjcyNjM5LCJleHAiOjE3NTk4MjQ2Mzl9.UeSPi8aDjQBTi4GH5Ff-uEWKm_i2d_hQeWprcPPIM-c",
												// 	// 	"Content-Type": "application/json",
												// 	// },
												// 	method: "POST",
												// });
												// Logger.__info("SHEDULER EXECUTING : ghffjj"); //--khameer

												// logger.__info(JSON.stringify(mAPIres),"mAPI Response");

												let mAPIres = await getServerResponses.getmApiCount(apiId,mail_value,start_date_value,end_date_value,env_value,token_value,monthly_consumption_url);
												let po_details = soItem[i].r_item_attachment[0];
												let so_hdr_detail = po_details.r_attachment_header[0];
												let final_value = 0;
												// error2 = error2 + mAPIres?.data?.totalApiCount;
												if (mAPIres) {
													let calculatedvalue = (soItem[i].per_api_price || 0) * mAPIres.data.totalApiCount;
													let min_monthly_rate = parseFloat(soItem[i].minimum_monthy_rate || "0");
													final_value = calculatedvalue > parseFloat(soItem[i].minimum_monthy_rate) ? calculatedvalue : min_monthly_rate;
												} else {
													error = "Did not receive response from mAPI";
												}

												await salesorder.addApiAmtinSO(txn, so_hdr_detail.so, po_details.po_no, final_value, "mAPI Call Update", bill[dateKey], soItem[i].soitem);
											} catch (e) {
												error2 = error2 + e;
												//throw new Error(error2);
											}
											break;
										case "Vayana":
											try {
												let Vayana_res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
													url: System.System.gi_URI().getAppServiceUrl(this.operatingFlavor, this.operatingFlavorVersion, "getVayanaAPICount", true),
													data: {
														auth_url: auth_url,
														handle: handle_value,
														handle_type: handle_type_value,
														password: password_value,
														token_duration: token_duration_value,
														task_url: task_url,
														from_date: start_date_value,
														to_date: end_date_value,
														org_id: org_id,
													},
													method: "POST",
												});
												await txn.createEntityP("d_vayana_api_helper_table", { task_id: Vayana_res.task_data, token: Vayana_res.token, org_id: org_id, status_url: status_url, soitem: soItem[i].soitem, milestone_date: bill[dateKey], report_url: vayana_report_url });
											} catch (e) {
												error = e;
												console.error(e);
												throw new Error(error);
											}
											break;
										default:
											break;
									}
								}
							}
						}
					}
				} catch (e) {
					error = e;
					console.log(e);
				}
				res("API call completed." + new Date().toLocaleString() + " " + error + " " + error2);
			}, 30000);
		});
	}

	//Changing the date format based on the provider as the same format is used in the provider's api
	public formatDate(date, format = "YYYY-MM-DD") {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		if (format === "YYYYMMDD") {
			return `${year}${month}${day}`;
		}

		return `${year}-${month}-${day}`;
	}

	//Checking if the two dates are same and ignoring time.
	public isSameDate(d1, d2) {
		return d1?.getFullYear() === d2?.getFullYear() && d1?.getMonth() === d2?.getMonth() && d1?.getDate() === d2?.getDate();
	}

	//Mapping the extra 10 fields with ui name to use it.
	private extractFieldMapping(mappingArray: any[]): Record<string, string> {
		const mapping: Record<string, string> = {};
		for (const item of mappingArray) {
			if (item.ui_name && item.sys_field_name) {
				mapping[item.ui_name.toLowerCase()] = item.sys_field_name;
			}
		}
		return mapping;
	}

	//Mapping the date key based on the billing table because in db it has different property name for same use.
	private resolveDateKey(item: d_o2c_so_item): { dateKey: string; startDateKey: string } {
		if (item.r_billing_new.length) {
			return { dateKey: "actual_date", startDateKey: "start_date" };
		} else if (item.r_schedule_new.length) {
			return { dateKey: "actual_date", startDateKey: "start__date" };
		} else {
			return { dateKey: "milestone_date", startDateKey: "start_date" };
		}
	}

	//Finding which billing method is involved schedule, milestone or volume.
	private resolveBillingData(item: d_o2c_so_item): any[] | null {
		if (item.r_billing_new.length) return item.r_billing_new;
		if (item.r_schedule_new.length) return item.r_schedule_new;
		if (item.r_vol_based_new.length) return item.r_vol_based_new;
		return null;
	}
}
