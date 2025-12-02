import { EventContext } from "kloBo/EventContext"
import { authDoneForUser } from "o2c_v2/util/authDoneForUser";
export class g2fclass {
	public async handleEvent(event: EventContext) {
		// //add code 
		// let txn = event.getTxn();
		// let userId = event.getTxn().getUserID();
		// let is2FADone = await authDoneForUser.totpCodeVerification(txn, userId,txn.$SYSTEM.appVars.totp /*event.object.totp*/);
		// if (!is2FADone)
		// 	throw Error("Unauthorized");
	}
}