import { KloEntity, KloEntitySet } from "kloBo";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_performance_he")
export default class p_pms_performance_he extends KloController {
	public newGoalItem = [];
	public async onPageEnter() {
		await this.tm.getTN("manager_list").setData([
			{ key: "PR0015", text: "Piyush Patil" },
			{ key: "PR0020", text: "Aslam Dilawar" },
			{ key: "pmgr001", text: "Dummy Manager" },
		]);
	}

	public async onClickRefresh() {
		await this.tm.getTN("pms_performance_header_list").getData().refreshP();
	}
	public async onAddPerformance() {
		await this.tm.getTN("pms_performance_header_list").createEntityP({ status: 2, creation_date: new Date() }, null, null, "s_pms_per_detail", "First", true, true, false);
	}
	public async onAddChild() {
		this.setMode("CREATE");
		this.newGoalItem.push(await this.tm.getTN("pms_performance_header_detail").getData().r_header_item.newEntityP());
	}
	public async onDeleteChild() {
		let messageBox = await this.getMessageBox();
		let indices = this.tm.getTN("r_header_item_list").getSelectedIndices();
		if (indices.length <= 0) return (await this.getMessageBox()).information("No Item Selected!!");
		let bDialog = new sap.m.BusyDialog({ text: "Deleting... Please wait" });
		await messageBox.confirm("Are you sure you want to delete?", {
			actions: [messageBox.Action.OK, messageBox.Action.CANCEL],
			emphasizedAction: messageBox.Action.OK,
			onClose: async (oAction) => {
				bDialog.open();
				try {
					if (oAction == "OK") {
						for (let i = indices.length - 1; i >= 0; i--) {
							await this.tm.getTN("r_header_item_list").getData()[indices[i]].deleteP();
						}
						await this.tm.commitP("Deleted Successfully", "Deletion Failed", true, true);
					}
				} catch (e) {
					throw new Error(e);
				} finally {
					bDialog.close();
				}
			},
		});
	}
	public async onCopyTemplate(oEvent, param) {
		let event = oEvent;
		let busyDialog = new sap.m.BusyDialog({ text: "Template is being copied. Please wait..." });
		busyDialog.open();
		let oData = <sap.ui.table.Table>this.getActiveControlById(null, "s_pms_per_list");
		let copyData;
		if (param.param == "list") {
			copyData = oData.getSelectedIndices().length <= 0 ? oData.getContextByIndex(0).getObject() : oData.getContextByIndex(oData.getSelectedIndex()).getObject();
		} else {
			copyData = this.tm.getTN("job_desc_detail").getData();
		}
		try {
			let pData = await this.tm.getTN("pms_performance_header_list").createEntityP({ header_desc: copyData.header_desc, manager_id: copyData.manager_id, status: "2", start_date: copyData.start_date, end_date: copyData.end_date, manager_name: copyData.manager_name, creation_date: new Date().getTime() }, null, null, null, "First", true, true, false);
			let childData = await copyData.r_header_item.fetch();
			if (childData.length > 0) {
				let oRelData = [];
				for (let header_item of childData) {
					oRelData.push(await pData.r_header_item.newEntityP(0, { pg_group: header_item.pg_group, pg_group_ext: header_item.pg_group_ext, pge_description: header_item.pge_description, item_scope: header_item.item_scope, weightage: header_item.weightage, review: header_item.review }));
				}
				await this.tm.getTN("r_header_item_list").setData(oRelData);
			}
		} catch (e) {
			throw new Error(e);
		}
		await this.navTo({ SS: "s_pms_per_detail" });
		busyDialog.close();
		sap.m["MessageToast"].show("Template copied successfully.");
	}
	public async onRelease(oEvent, param) {
		let busyDialog = new sap.m.BusyDialog({ text: "Template is being released. Please wait..." });
		if (param.ss == "list") {
			let selectedIndices = this.tm.getTN("pms_performance_header_list").getSelectedIndices();
			if (selectedIndices.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a template to proceed.");
			for (let index of selectedIndices) {
				if (this.tm.getTN("pms_performance_header_list").getData()[index].status == "1") return (await this.getMessageBox()).information("The selected template has already been released.");
				let kpiData = this.tm.getTN("pms_performance_header_list").getData()[index].r_header_item;
				if (kpiData.length <= 0) return sap.m["MessageToast"].show("Template cannot be released. No KPIs found.");
				this.tm.getTN("pms_performance_header_list").getData()[index].status = "1";
				this.tm.getTN("pms_performance_header_list").getData()[index].manager_staus = "In-progress";
				this.tm.getTN("pms_performance_header_list").getData()[index].released_on = new Date();
				this.tm.getTN("pms_performance_header_list").getData()[index].released_by = this.transaction.getUserID();
			}
		}
		busyDialog.open();
		if (param.ss == "detail") {
			let kpiData = this.tm.getTN("pms_performance_header_detail").getData().r_header_item;
			if (kpiData.length <= 0) {
				busyDialog.close();
				return sap.m["MessageToast"].show("Template cannot be released. No KPIs found.");
			}
			this.tm.getTN("pms_performance_header_detail").getData().status = "1";
			this.tm.getTN("pms_performance_header_detail").getData().manager_staus = "In-progress";
			this.tm.getTN("pms_performance_header_detail").getData().released_on = new Date();
			this.tm.getTN("pms_performance_header_detail").getData().released_by = this.transaction.getUserID();
		}
		try {
			await this.tm.commitP("Template released successfully", "Release got failed", true, true);
		} catch (e) {
			throw new Error(e);
		} finally {
			busyDialog.close();
		}
	}
	public getLastSequenceNumber(entitySet) {
		let greatest = 0;
		for (let i = 0; i < entitySet.length; i++) {
			if (entitySet[i].sequence_no > greatest) {
				greatest = entitySet[i].sequence_no;
			}
		}
		return greatest;
	}
	public async onSelectGoalGroup(oEvent) {
		let ItemIndex = this.getPathFromEvent(oEvent).split("/")[2];
		let newPerformanceItem = this.newGoalItem.length > 0 ? this.newGoalItem : Array(this.tm.getTN("r_header_item_list").getData()[ItemIndex]);
		let existingPerformanceItem = this.tm.getTN("r_header_item_list").getData();
		let lastSequenceNo = this.getLastSequenceNumber([...existingPerformanceItem.slice(0, ItemIndex), ...existingPerformanceItem.slice(ItemIndex + 1)]);
		for (let item of newPerformanceItem) {
			let isPresent = false;
			let currentSequence;
			for (let index = newPerformanceItem.length; index < existingPerformanceItem.length; index++) {
				if (existingPerformanceItem[index].pg_group == item.pg_group) {
					isPresent = true;
					currentSequence = existingPerformanceItem[index].sequence_no;
					break;
				}
			}
			if (!isPresent) {
				item.sequence_no = lastSequenceNo + 1;
			} else {
				item.sequence_no = currentSequence;
			}
			this.newGoalItem = [];
		}
	}
	public async onPressPreview() {
		// await this.tm.getTN("r_header_item_list").applysortP("sequence_no", "ASC");
		let performanceData = this.tm.getTN("r_header_item_list").getData();
		// let deepCopy = [...performanceData].map((i) => {
		// 	return { ...i };
		// });
		const deepCopy = (<KloEntitySet<KloEntity>>performanceData).map((i) => i._mystub._d);
		let performanceGoalData = await this.transaction.getExecutedQuery("d_pms_goal_group", { loadAll: true });
		await this.tm.getTN("performance_items").setData(await this.createParentChildHierarchy(deepCopy, performanceGoalData));
		this.openDialog("pa_preview");
	}
	public async createParentChildHierarchy(data, performanceGoalData) {
		let childKey = "items";
		// Initialize an empty array to store the hierarchy
		let hierarchy = [];

		// Loop through the array and build the hierarchy

		for (let item of data) {
			item = { ...item };
			let goalItem = performanceGoalData.filter((data) => data.pg_group_id == item.pg_group);
			const parent = goalItem[0].pg_group_description;
			// Check if the parent already exists in the hierarchy array
			let parentObj = hierarchy.find((obj) => obj.parent === parent);

			if (!parentObj) {
				// If the parent doesn't exist, create a new object for it and add it to the hierarchy array
				parentObj = { parent, [childKey]: [] };
				hierarchy.push(parentObj);
			}

			// Push the child item (name, age) under the children key of the parent
			const goalExt = await goalItem[0].r_goal_extension.fetch();
			let extensionData = goalExt.filter((data) => data.pg_grop_ext_id == item.pg_group_ext);
			item.pg_group_ext = extensionData[0]?.pg_grp_ext_desc;
			parentObj[childKey].push(item);
		}

		return hierarchy;
	}
	public async onSubmitSelectedManager() {
		try {
			let selectedManagerIndex = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getSelectedIndices();
			let selectedManagerData = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getData()[selectedManagerIndex];
			this.tm.getTN("pms_performance_header_detail").setProperty("manage_name", selectedManagerData.full_name);
			this.tm.getTN("pms_performance_header_detail").setProperty("manager_id", selectedManagerData.employee_id);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_manager_list");
		}
	}
	public async onSubmitSelectedManagerInSearch() {
		try {
			let selectedManagerIndex = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getSelectedIndices();
			let selectedManagerData = this.tm.getTNFromEmbedded("o2c_employee_list", "s_manager_list").getData()[selectedManagerIndex];
			this.tm.getTN("pms_performance_header_search").setProperty("manage_name", selectedManagerData.full_name);
			this.tm.getTN("pms_performance_header_search").setProperty("manager_id", selectedManagerData.employee_id);
		} catch (e) {
			throw new Error(e);
		} finally {
			this.closeDialog("pa_mgr_list_search");
		}
	}
	public async onSelectExtension(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let selectedExtension = this.tm.getTN("r_header_item_list").getData()[oPath.split("/")[2]].pg_group_ext;
		let goalExtensionData = await this.transaction.getExecutedQuery("d_pms_goal_extension", { loadAll: true, pg_grop_ext_id: selectedExtension });
		this.tm.getTN("r_header_item_list").getData()[oPath.split("/")[2]].review = goalExtensionData[0].goal_review;
	}
	public async getGoalRemarks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_group", { loadAll: true, pg_group_id: this.tm.getTN("r_header_item_list").getData()[oPath.split("/")[2]].pg_group });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0].goal_remarks ? GoalData[0].goal_remarks : "No Information.");
	}
	public async getGoalExtensionRemarks(oEvent) {
		let oPath = this.getPathFromEvent(oEvent);
		let GoalData = await this.transaction.getExecutedQuery("d_pms_goal_extension", { loadAll: true, pg_grop_ext_id: this.tm.getTN("r_header_item_list").getData()[oPath.split("/")[2]].pg_group_ext });
		let mBox = await this.getMessageBox();
		mBox.information(GoalData[0]?.remarks ? GoalData[0].remarks : "No Information.");
	}
	public async onSaveKPIs() {
		try {
			let allKpis = this.tm.getTN("r_header_item_list").getData();
			let kpiSum = 0;
			for (let kpiData of allKpis) {
				kpiSum += kpiData.weightage;
			}
			if (kpiSum > 100) return (await this.getMessageBox()).information("Please ensure that the total weightage is 100 or less.");
			await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true);
		} catch (e) {
			throw new Error(e);
		}
	}
}
