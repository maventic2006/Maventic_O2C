import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
let oController;
@KloUI5("o2c_v2.controller.p_training")
export default class p_training extends KloController{
	public onInit() {

		var oTreeData = {
			treeData: [
				{
					name: "Node 1", icon: "sap-icon://folder", children: [
						{ name: "Subnode 1.1", icon: "sap-icon://document" },
						{ name: "Subnode 1.2", icon: "sap-icon://document" }
					]
				},
				{
					name: "Node 2", icon: "sap-icon://folder", children: [
						{ name: "Subnode 2.1", icon: "sap-icon://document" }
					]
				}
			]
		};

		

		var oLocalModel = new sap.ui.model.json.JSONModel();
		sap.ui.getCore().setModel(oLocalModel,"mDataModel");

		
		
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
    public async onPageEnter() {
		oController = this;

		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_training";
		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		})
		this.getActiveControlById(null, 'pa_desktop', 'p_training').addContent(view);


		var oComboBoxData = {
			comboBoxData: [
				{ key: "1", text: "Node 1" },
				{ key: "2", text: "Subnode 1.1" },
				{ key: "3", text: "Subnode 1.2" },
				{ key: "4", text: "Node 2" },
				{ key: "5", text: "Subnode 2.1" }
			]
		};

		var oComboBoxModel = new sap.ui.model.json.JSONModel(oComboBoxData);
		sap.ui.getCore().byId("comboBox").setModel(oComboBoxModel);

		var oTree = sap.ui.getCore().byId("tree");
		oTree.attachSelectionChange(this.onTreeSelectionChange, this);


		let userId = "MM0053"
		let thisUserDesig = await oController.transaction.getExecutedQuery('d_o2c_employee_designation', { 'employee_id': userId, loadAll: true });
		let desig = (await oController.transaction.getExecutedQuery('d_o2c_designation_master', { 'designation_id': thisUserDesig[0].designation, loadAll: true }))[0].name;
		let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': userId, loadAll: true });

		if(desig === "Team_Head"){

			let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
			sap.ui.getCore().getModel("mDataModel").setProperty('/first', allEmployee);
			// let hierarchyIds = [];
			// let hierarchyEmployee = [];
			// for(let i=0; i<allEmployee.length; i++){
			// 	hierarchyIds.push(allEmployee[i].employee_id);
			// 	hierarchyEmployee.push(allEmployee[i]);
			// }
			// hierarchyEmployee.push(thisUser[0]);
			// while(hierarchyIds.length){
			// 	allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });
				
			// 	hierarchyIds = [];
			// 	for(let i=0; i<allEmployee.length; i++){
			// 		hierarchyIds.push(allEmployee[i].employee_id);
			// 		hierarchyEmployee.push(allEmployee[i]);
			// 	}
			// }
			// sap.ui.getCore().getModel("mDataModel").setProperty('/allEmployee', hierarchyEmployee);

		}else if(desig === "MANAGER"){
			
			// sap.ui.getCore().getModel("mDataModel").setProperty('/first', thisUser[0]);
			// let nameAndId = thisUser[0].full_name + "(" + thisUser[0].employee_id + ")";
			sap.ui.getCore().byId("empComboBox").setValue(thisUser[0].full_name);
			sap.ui.getCore().byId("empComboBox").setEditable(false);
			let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': userId, loadAll: true });
		// 	let hierarchyIds = [];
		// 	let hierarchyEmployee = [];
		// 	for(let i=0; i<allEmployee.length; i++){
		// 		hierarchyIds.push(allEmployee[i].employee_id);
		// 		hierarchyEmployee.push(allEmployee[i]);
		// 	}
		
		// while(hierarchyIds.length){
		// 	allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });
			
		// 	hierarchyIds = [];
		// 	for(let i=0; i<allEmployee.length; i++){
		// 		hierarchyIds.push(allEmployee[i].employee_id);
		// 		hierarchyEmployee.push(allEmployee[i]);
		// 	}
		// }
		// hierarchyEmployee.push(thisUser[0]);
		sap.ui.getCore().getModel("mDataModel").setProperty('/second', hierarchyEmployee);

		}else{
			sap.ui.getCore().byId("comboBoxSec").setVisible(false);
		sap.ui.getCore().byId("comboBoxThird").setVisiblee(false);
		}

		

	}
	public onTreeSelectionChange(oEvent) {
		var oSelectedItem = oEvent.getParameter('listItem');
		var sSelectedItemText = oSelectedItem.getTitle();
		sap.ui.getCore().byId("comboBox").setValue(sSelectedItemText);
		this.onCollapseAllPress();
	}
	public onCollapseAllPress() {
		var oTree = sap.ui.getCore().byId("tree");
		oTree.collapseAll();
	}
	public async firstChange(oEvent){

		// sap.ui.getCore().byId("comboBox").setValue("");
		sap.ui.getCore().byId("empComboBoxSec").setValue("");
		sap.ui.getCore().byId("empComboBoxThird").setValue("");

		let oComboBox = oEvent.getSource();
		let oSelectedItem = oComboBox.getSelectedItem();
		if (oSelectedItem) {
			var selectedKey = oSelectedItem.getKey();

			let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': selectedKey, loadAll: true });
		// 	let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': selectedKey, loadAll: true });
		// let hierarchyIds = [];
		// let hierarchyEmployee = [];
		// for(let i=0; i<allEmployee.length; i++){
		// 	hierarchyIds.push(allEmployee[i].employee_id);
		// 	hierarchyEmployee.push(allEmployee[i]);
		// }
		
		// while(hierarchyIds.length){
		// 	allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });
			
		// 	hierarchyIds = [];
		// 	for(let i=0; i<allEmployee.length; i++){
		// 		hierarchyIds.push(allEmployee[i].employee_id);
		// 		hierarchyEmployee.push(allEmployee[i]);
		// 	}
		// }
		// hierarchyEmployee.push(thisUser[0]);
		sap.ui.getCore().getModel("mDataModel").setProperty('/second', allEmployee);
		}
	}

	public async secondChange(oEvent){
		let oComboBox = oEvent.getSource();
		let oSelectedItem = oComboBox.getSelectedItem();
		if (oSelectedItem) {
			var selectedKey = oSelectedItem.getKey();

			let allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': selectedKey, loadAll: true });
			// let thisUser = await oController.transaction.getExecutedQuery('d_o2c_employee', { 'employee_id': selectedKey, loadAll: true });
		// }
		// let hierarchyIds = [];
		// let hierarchyEmployee = [];
		// for(let i=0; i<allEmployee.length; i++){
		// 	hierarchyIds.push(allEmployee[i].employee_id);
		// 	hierarchyEmployee.push(allEmployee[i]);
		// }
		
		// while(hierarchyIds.length){
		// 	allEmployee = await this.transaction.getExecutedQuery('d_o2c_employee', { 'line_manager': hierarchyIds, loadAll: true });
			
		// 	hierarchyIds = [];
		// 	for(let i=0; i<allEmployee.length; i++){
		// 		hierarchyIds.push(allEmployee[i].employee_id);
		// 		hierarchyEmployee.push(allEmployee[i]);
		// 	}
		// }
		// hierarchyEmployee.push(thisUser[0]);
		// sap.ui.getCore().getModel("mDataModel").setProperty('/second', allEmployee);
		sap.ui.getCore().getModel("mDataModel").setProperty('/third', allEmployee);
		}
	}
}