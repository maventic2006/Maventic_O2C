import { KloEntity } from "kloBo/KloEntity";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_pms_temp_review")
export default class p_pms_temp_review extends KloController {
	public newGoalItem = [];

	public async onApprove() {
		// change the status to approve.
		let selectedIndex = this.tm.getTN("pms_performance_header_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a template to proceed.");
		for (let index of selectedIndex) {
			if (this.tm.getTN("pms_performance_header_list").getData()[index].manager_staus == "Approved") {
				return sap.m["MessageToast"].show(this.tm.getTN("pms_performance_header_list").getData()[index].header_desc + " is already approved!!!");
			}
			this.tm.getTN("pms_performance_header_list").getData()[index].manager_staus = "Approved";
		}
		if (this.tm.getTN("pms_performance_header_list").getData().isDirty) {
			await this.tm.commitP("Template approved successfully", "Error while approving", true, true);
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
			item.pg_group_ext = extensionData[0].pg_grp_ext_desc;
			parentObj[childKey].push(item);
		}

		return hierarchy;
	}
	public async onReject() {
		let selectedIndex = this.tm.getTN("pms_performance_header_list").getSelectedIndices();
		if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No record selected. Please select a template to proceed.");
		await this.tm.getTN("remarks").setData(null);
		this.openDialog("pa_remark_dialog");
	}
	public async onSubmitRemarks() {
		let selectedIndex = this.tm.getTN("pms_performance_header_list").getSelectedIndices();
		for (let index of selectedIndex) {
			this.tm.getTN("pms_performance_header_list").getData()[index].status = "2";
			this.tm.getTN("pms_performance_header_list").getData()[index].manager_staus = "Rejected";
			this.tm.getTN("pms_performance_header_list").getData()[index].mgr_remarks = this.tm.getTN("remarks").getData();
		}
		this.closeDialog("pa_remark_dialog");
		await this.tm.commitP("The template has been rejected.", "Error while rejecting", true, true);
	}
	public async onAddChild() {
		this.setMode("CREATE");
		this.newGoalItem.push(await this.tm.getTN("pms_performance_header_detail").getData().r_header_item.newEntityP());
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
	public getLastSequenceNumber(entitySet) {
		let greatest = 0;
		for (let i = 0; i < entitySet.length; i++) {
			if (entitySet[i].sequence_no > greatest) {
				greatest = entitySet[i].sequence_no;
			}
		}
		return greatest;
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
	public async onDetailApprove() {
		// let selectedIndex = this.tm.getTN("pms_performance_header_list").getSelectedIndices();
		// if (selectedIndex.length <= 0) return sap.m["MessageToast"].show("No item selected!!");
		this.tm.getTN("pms_performance_header_detail").getData().manager_staus = "Approved";
		await this.tm.commitP("Template approved successfully.", "Error while approving", true, true);
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
