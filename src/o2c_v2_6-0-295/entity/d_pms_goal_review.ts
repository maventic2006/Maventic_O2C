import { EventContext } from "kloBo/EventContext";
import { d_pms_goal_review as d_pms_goal_review_gen } from "o2c_v2/entity_gen/d_pms_goal_review";
export class d_pms_goal_review extends d_pms_goal_review_gen {
	public async onUpdate(oEvent: EventContext) {
		let dirtyObjects = oEvent.getObject().txn.getDirtyBOs();
		if (dirtyObjects.length > 0) {
			for (let dirtyObjectItem of dirtyObjects) {
				let changeObjectValue = this.getChangedValues(await this.fromP(), dirtyObjectItem.entityImpl._d);
				if (changeObjectValue.manager_remarks) {
					if (this.employee_id.toLocaleLowerCase() == this.txn.getUserID().toLocaleLowerCase()) {
						throw new Error("This value can not be changed by an employee.");
					}
					//  else if (this.mgr_status && this.employee_id.toLocaleLowerCase() !== this.txn.getUserID().toLocaleLowerCase()) {
					// 	throw new Error("This value can not be changes because the goal is released.");
					// }
				}
			}
		}
		return this.errors;
	}
	//Getting the changed values as an object => changedKey : {old: value, new: value}
	public getChangedValues(oldObj, newObj) {
		const changed = {};

		for (const key in oldObj) {
			if (oldObj[key] != newObj[key]) {
				changed[key] = { old: oldObj[key], new: newObj[key] };
			}
		}

		return changed;
	}
}
