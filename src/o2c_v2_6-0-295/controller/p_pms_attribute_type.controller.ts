import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_attribute_type")
export default class p_pms_attribute_type extends KloController {
	public async onCancel() {
		await this.tm.getTN("pms_attribute_type_list").getData().refreshP();
		this.setMode("display");
	}
	public async onCreate() {
		try {
			await this.tm.getTN("pms_attribute_type_list").createEntityP({ active_flag: true }, "Successfully created", "Failed", null, "First", false, true);
		} catch (e) {
			throw new Error(e);
		}
	}
}
