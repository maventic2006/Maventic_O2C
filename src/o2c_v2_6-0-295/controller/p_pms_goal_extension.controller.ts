import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_goal_extension")
export default class p_pms_goal_extension extends KloController {
	public async OnUploadRowData(oEvent) {
		let rowData = oEvent.getParameters().value;
		console.log(rowData);
	}
}
