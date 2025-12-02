import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_send_so")
export default class p_o2c_send_so extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onEdit()
	{
		this.setMode("EDIT");
	}
	public async onSave()
	{
		await this.tm.commitP("Save Successfully", "Save Failed", true, true);
		
	}
	public async onDelete(oEvent: sap.ui.base.Event)
	{
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_so_hdr_list/", ''))
		let so_id = this.tm.getTN("o2c_so_hdr_list").getData()[index].so;
		this.tm.getTN("o2c_so_hdr_list").getData()[index].s_status = "New"
		await this.tm.getTN("o2c_so_hdr_list").refresh()
		let status_hdr = await this.transaction.getExecutedQuery('d_o2c_so_status_hrd', {loadAll: true,'so':so_id });
		let status_itm = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', {loadAll: true,'so':so_id });

		for(let i=0;i<status_hdr.length;i++)
		{
			status_hdr[i].deleteP();
		}

		for(let i=0;i<status_itm.length;i++)
		{
			status_itm[i].deleteP();
		}
		await this.tm.commitP("Status Changed", "Failed", true, true);
	}
//End..
}
//loadAll true