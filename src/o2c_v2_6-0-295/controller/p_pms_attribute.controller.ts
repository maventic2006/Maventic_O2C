import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_attribute")
export default class p_pms_attribute extends KloController {
	public async onCancel() {
		await this.transaction.rollback();
		await this.tm.getTN("pms_attribute_list").setActive(0);
		await this.navTo({ SS: "s_pms_att_list" });
	}
	public async onCreate() {
		try {
			await this.tm.getTN("pms_attribute_list").createEntityP({ active_flag: true }, null, null, "s_attribute_detail", "First", false, true);
		} catch (e) {
			throw new Error(e);
		}
	}
	public async isVisible(param) {
		let data = await this.transaction.getExecutedQuery("d_pms_attribute_type", { loadAll: true });
		let flag = false;
		for (let item of data) {
			if ((<any>item).attribute_type_id == param && (<any>item).rating_type_id == "scale") {
				flag = true;
			}
			if (flag) break;
		}
		return flag;
	}
	public async onChangeLowerUpper() {
		try {
			await this.transaction.validateP();
		} catch (e) {
			throw new Error(e);
		}
	}
	public async onSelectAttributeType() {
		let data = await this.transaction.getExecutedQuery("d_pms_attribute_type", { loadAll: true });
		for (let item of data) {
			if ((<any>item).attribute_type_id == this.tm.getTN("pms_attribute_detail").getData().attribute_type && (<any>item).rating_type_id !== "scale") {
				this.tm.getTN("pms_attribute_detail").setProperty("lower_base", null);
				this.tm.getTN("pms_attribute_detail").setProperty("higher_base", null);
			}
		}
	}
}
