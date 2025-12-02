import { EventContext } from "kloBo/EventContext";
import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { ErrorType } from "kloBo/KloEnums";
import { d_pms_performance_emp_item as d_pms_performance_emp_item_gen } from "o2c_v2/entity_gen/d_pms_performance_emp_item";
import { Status } from "o2c_v2/util/enum";
import { KloError } from "kloBo/MessageFormat/KloError";
export class d_pms_performance_emp_item extends d_pms_performance_emp_item_gen {
	//Getting the change values as an object => changedKey : {old: value, new: value}
	public getChangedValues(oldObj, newObj) {
		const changed = {};

		for (const key in oldObj) {
			if (oldObj[key] != newObj[key]) {
				changed[key] = { old: oldObj[key], new: newObj[key] };
			}
		}

		return changed;
	}
	//server side call, Currently its not validating
	public async onUpdate(oEvent: EventContext) {
		let dirtyObjects = oEvent.getObject().txn.getDirtyBOs();
		if (dirtyObjects.length > 0) {
			for (let dirtyObjectItem of dirtyObjects) {
				let changeObjectValue = this.getChangedValues(await this.fromP(), dirtyObjectItem.entityImpl._d);
				if (changeObjectValue.final_value) {
					if (this.emp_id.toLocaleLowerCase() == this.txn.getUserID().toLocaleLowerCase()) {
						throw new Error("This value can not be changed by an employee.");
					}
					// else if (this.final_val_status == Status.submitted && this.emp_id.toLocaleLowerCase() !== this.txn.getUserID().toLocaleLowerCase()) {
					// 	throw new Error("This value can not be changed because the goal is released.");
					// }
				}
				if (changeObjectValue.final_planned_value) {
					if (this.emp_id.toLocaleLowerCase() == this.txn.getUserID().toLocaleLowerCase()) {
						throw new Error("This value can not be changed by an employee.");
					}
				}
			}
		}
	}
}
