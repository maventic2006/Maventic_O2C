import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_project_list")
let list = [];
export default class p_project_list extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {

	}
	public onExit() {
	}
	public async onPageEnter() {
		// this.tm.getTN("search_node").setProperty('status', ['Created','Active','Billing Closed','Delivery Closed','Hold']);
		// await this.tm.getTN("search_node").executeP();
		let querySearch = this.tm.getTN("search_node");
		querySearch.getData().setLoadAll(true);
		await querySearch.executeP();
		//if(this.filter.s_status === null){
		list = await this.tm.getTN("o2c_project_header_list").getData();
		// list.forEach(async (item) => {
		// 	await item.r_project_so[0]?.fetch();
		// 	item.trans_prj_name = item.r_project_so[0]?.project_name;
		// 	console.log(item.trans_prj_name);
		// })
	}
	public async onNavigateProject(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_project_header_list/", ''))
		let project_guid = this.tm.getTN("o2c_project_header_list").getData()[index].project_guid
		let project_id = this.tm.getTN("o2c_project_header_list").getData()[index].project_id
		await this.navTo(({ TS: true, H: true, S: 'p_project', AD: project_guid }));
	}
	public async onNavigateSOId(oEvent: sap.ui.base.Event) {
		let path = this.getPathFromEvent(oEvent);
		let index = parseInt(path.replace("/o2c_project_header_list/", ''));
		let soTableData = await this.tm.getTN("o2c_project_header_list").getData()[index].r_project_so.fetch();
		let soGuid = soTableData[0].so_guid;
		await this.navTo(({ TS: true, H: true, S: 'p_so', AD: soGuid }));
	}
	public async filterCompleted() {

		let completedProject = await this.transaction.getExecutedQuery('d_o2c_project_header', {
			loadAll: true, s_status: "Completed"
		});
		await this.tm.getTN("o2c_project_header_list").setData(completedProject);

	}
	// public async filterPending() {
	// 	await this.navTo(({ S: "p_project_list", SS: 'pageArea01' }));
	// 	await this.tm.getTN("search_node").setProperty('status', ['Created','Active','Billing Closed','Delivery Closed','Hold']);
	// 	await this.tm.getTN("search_node").executeP();
	// }

	public async selectedStatus(oEvent) {
		const selectedItems = oEvent.getSource().getSelectedItems();
		const selectedKeys = selectedItems.map(item => item.getKey());
		if(selectedKeys.length > 0){
			this.tm.getTN("search_node").setProperty("s_status", selectedKeys);
		}else{
			this.tm.getTN("search_node").setProperty("s_status", ["Created", "Active", "Delivery Closed", "Billing Closed"]);
		}
		await this.tm.getTN("search_node").executeP();
	
		let filteredProjects = await this.tm.getTN("search_node").getData().entityset;

		if(selectedKeys.length > 0 ){
			// Filter the projects whose status is in selectedKeys
			filteredProjects = filteredProjects.filter(project =>
				selectedKeys.includes(project.trans_status)
			);
		}

		// display or process filteredProjects
		await this.tm.getTN("o2c_project_header_list").setData(filteredProjects);
	}
}
//28Nov 6:18PM