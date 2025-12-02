import {KloController} from 'kloTouch/jspublic/KloController';
import {FileLoaderUtils} from "kloBo/Utils/FileLoaderUtils";
import { d_o2c_task_assignment } from 'o2c_v2/entity/d_o2c_task_assignment';
import { KloEntitySet } from 'kloBo/KloEntitySet';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_timesheet_table")
export default class p_timesheet_table extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		debugger;
		let viewName = this.getFlavor()+"_"+this.getFlavorVersion()+"_"+this.transaction.$SYSTEM.landscape + ".view.p_timesheet_table";
		// let view: sap.ui.core.mvc.XMLView = await sap.ui.core.mvc.View.create({ id: "view2", viewName: viewName, type: sap.ui.core.mvc.ViewType.XML })
		

		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		});
		this.getActiveControlById(null,'pageLayout01','p_timesheet_table').addContent(view);
	}
	public onPress(){
		debugger;
	}
}