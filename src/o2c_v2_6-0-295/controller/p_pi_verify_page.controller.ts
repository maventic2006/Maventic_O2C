import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pi_verify_page")
export default class p_pi_verify_page extends KloController {
  /*public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	}*/

  public async onPending() {
    await this.tm.getTN("pi_list").applyfilterP("status", "Pending");
    await this.tm.getTN("pi_list").refresh()
  }

  public async onCompleted()
  {
    await this.tm.getTN("pi_list").applyfilterP("status", "Approved");
    await this.tm.getTN("pi_list").refresh()
  }
  public async onAll()
  {
    await this.tm.getTN("pi_list").resetP();
  }
  public async onNavigate(oEvent: sap.ui.base.Event)
  {
    await this.navTo(({ H: true, S: "p_pi_verify_page", SS: "pa_details" }));
  }
}
