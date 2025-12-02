import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_proj_merge_rprt")

export default class p_proj_merge_rprt extends KloController{
	
	public async onPageEnter() {

		let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
		busyDialog.open();


		await this.tm.getTN("table_data_oth").setData({});

		let user_id = (await this.transaction.get$User()).login_id;


		// q_so_by_mngr_tmhd d_o2c_so_hdr q_so_by_tmhd_n_mngr
	    let so_hdr = await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true });
		let so_profit = await this.transaction.getExecutedQuery("q_so_by_tmhd_n_mngr", {login_id:user_id, loadAll: true });
		let project_entity = await this.transaction.getExecutedQuery("d_o2c_project_header", {  loadAll: true });
		// let filter_project_entity = project_entity.filter(item => item.s_status === "Archived");
		let filter_project_entity = project_entity.filter(item => item.s_status !== "Archived");

		let table_data = await this.getDuplicateProjectss( so_hdr,so_profit, filter_project_entity);
		let finalResult = await this.addStatusToProjects(so_hdr,so_profit, table_data);

		await this.tm.getTN("table_data_oth").setData(finalResult);

	
		busyDialog.close();

	}
	public async getDuplicateProjects(so_hdr, so_profit, project) {
		// Step 1: Create a lookup for so_id to profit_centers from so_profit
		let soProfitMap = {};
		so_profit.forEach(sp => {
			if (!soProfitMap[sp.so]) {
				soProfitMap[sp.so] = new Set();
			}
			soProfitMap[sp.so].add(sp.profit_center);
		});
	
		// Step 2: Group projects by so_id and profit_center
		let projectGroups = {};
		project.forEach(p => {
			let key = `${p.so_id}_${p.profit_center}`;
			if (!projectGroups[key]) {
				projectGroups[key] = [];
			}
			projectGroups[key].push(p);
		});
	
		// Step 3: Filter groups where there are multiple projects in the same profit center for the same so_id
		let result = [];
		Object.values(projectGroups).forEach(projList => {
			if (projList.length > 1) {
				result.push(...projList);
			}
		});
	
		return result;
	}
	public async getDuplicateProjectss(so_hdr, so_profit, project) {
		// Step 1: Create a mapping from so_id to so_guid using so_hdr
		let soIdToGuidMap = {};
		so_hdr.forEach(sh => {
			soIdToGuidMap[sh.so] = sh.so_guid;
		});
	
		console.log("soIdToGuidMap:", soIdToGuidMap); // Debugging step
	
		// Step 2: Create a lookup for so_guid + profit_center pairs from so_profit
		let soProfitSet = new Set();
		so_profit.forEach(sp => {
			let key = `${sp.so_guid}_${sp.profit_center}`;
			soProfitSet.add(key);
		});
	
		console.log("soProfitSet contains:", [...soProfitSet]); // Debugging step
	
		// Step 3: Group projects by (so_guid, profit_center), but only if they exist in so_profit
		let projectGroups = {};
		project.forEach(p => {
			let so_guid = soIdToGuidMap[p.so_id]; // Convert so_id to so_guid
			if (!so_guid) {
				console.log(`Skipping project ${p.project_name} (no so_guid found for so_id ${p.so_id})`);
				return;
			}
	
			let key = `${so_guid}_${p.profit_center}`;
	
			// Check if this (so_guid, profit_center) exists in so_profit
			if (soProfitSet.has(key)) {
				if (!projectGroups[key]) {
					projectGroups[key] = [];
				}
				projectGroups[key].push(p);
			} else {
				console.log(`Skipping project ${p.project_name} (not in so_profit)`);
			}
		});
	
		// Step 4: Filter groups where there are multiple projects for the same so_guid & profit_center
		let result = [];
		Object.values(projectGroups).forEach(projList => {
			if (projList.length > 1) {
				result.push(...projList);
			}
		});
	
		console.log("Final duplicate projects:", result); // Debugging step
		return result;
	}
	
	
	
	
	public async addStatusToProjects(so_hdr, so_profit, filteredProjects) {
		// Step 1: Create a mapping of so_id → so_guid from so_hdr
		let soIdToGuidMap = {};
		so_hdr.forEach(so => {
			soIdToGuidMap[so.so] = so.so_guid;
		});
	
		// Step 2: Create a mapping of (so_guid, profit_center) → total project_pds from so_profit
		let soProfitSumMap = {};
		so_profit.forEach(sp => {
			let key = `${sp.so_guid}_${sp.profit_center}`;
			if (!soProfitSumMap[key]) {
				soProfitSumMap[key] = 0;
			}
			soProfitSumMap[key] += parseInt(sp.pds); // Sum up project_pds for this (so_guid, profit_center)
		});
	
		// Step 3: Create a mapping of (so_guid, profit_center) → total pd from project
		let projectPdSumMap = {};
		filteredProjects.forEach(proj => {
			let so_guid = soIdToGuidMap[proj.so_id]; // Get so_guid using so_id
			if (!so_guid) return; // Skip if no matching so_guid
	
			let key = `${so_guid}_${proj.profit_center}`;
			if (!projectPdSumMap[key]) {
				projectPdSumMap[key] = 0;
			}
			projectPdSumMap[key] += proj.pd; // Sum up pd for this (so_guid, profit_center)
		});
	
		// Step 4: Compare sums and add status
		let resultWithStatus = filteredProjects.map(proj => {
			let so_guid = soIdToGuidMap[proj.so_id]; // Get so_guid
			let key = `${so_guid}_${proj.profit_center}`;
	
			let totalProjectPds = soProfitSumMap[key] || 0; // Get total project_pds from so_profit
			// let totalPd = projectPdSumMap[key] || 0; // Get total pd from project
			let totalPd = parseInt(proj.total_project_pds); // Get total pd from project
	
			return {
				so: proj.so_id,
				project_id: proj.project_id,
				project_guid: proj.project_guid,
				profit_center: proj.profit_center,
				status: totalPd === totalProjectPds ? "yes" : "no", // Compare sums
				check: false
			};
		});
	
		return resultWithStatus;
	}

	public async onMerge(){

		let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
		busyDialog.open();



		let  tableData = await this.tm.getTN("table_data_oth").getData();
		let filteredData = tableData.filter(item => item.check === true);

		let so_ids = [];

		for(let i=0; i<filteredData.length; i++){

			// getting the row item
			let mainRow = filteredData[i];

			// store so_ids
			so_ids.push(mainRow.so);

			let archivedRow = tableData.filter(item => 
				( item.so === mainRow.so) &&
				( item.profit_center === mainRow.profit_center) &&
				( item.status === "no")
			);
			let archivedProject = archivedRow.map(item => item.project_id);
			let allResource = [];
			let allTaskIds = [];


			// ---------------      getting resource details  -----------------------

			let mainResource = await this.transaction.getExecutedQuery("d_o2c_project_resource", { project_id:mainRow.project_id,  loadAll: true });
			for(let i=0; i<archivedRow.length; i++){
				// allTaskIds.push(archivedRow[i].task_id)
				let archivedResource = await this.transaction.getExecutedQuery("d_o2c_project_resource", { project_id:archivedRow[i].project_id,  loadAll: true });
				for(let j=0; j<archivedResource.length; j++){
					if(archivedResource[j].task_id){
						allTaskIds.push(archivedResource[j].task_id)
					}
				}
				allResource = [...allResource, ...archivedResource];
			}
			let newResource = allResource.filter(item2 =>
				!mainResource.some(item1 =>
					item1.employee_id === item2.employee_id &&
					new Date(item1.start_date).getTime() === new Date(item2.start_date).getTime() &&
            		new Date(item1.end_date).getTime() === new Date(item2.end_date).getTime()
				)
			);
			
			// ----------------- add new entry in resouce table with main project id
			for(let i=0;i<newResource.length; i++){
				let newEntry = await this.transaction.createEntityP("d_o2c_project_resource", {
					task_id: newResource[i].task_id,
					onsite: newResource[i].onsite,
					plannedpds: newResource[i].plannedpds,
					remark: newResource[i].remark,
					shadow_of: newResource[i].shadow_of,
					percentage: newResource[i].percentage ? newResource[i].percentage : 0,
					line_manager_name: newResource[i].line_manager_name,
					line_manager_id: newResource[i].line_manager_id ? newResource[i].line_manager_id : null,
					project_id: mainRow.project_id,
					project_guid: mainRow.project_guid,
					employee_id: newResource[i].employee_id,
					billable_cost: newResource[i].billable_cost,
					standard_cost: newResource[i].standard_cost,
					unit: newResource[i].unit,
					end_date: newResource[i].end_date,
					start_date: newResource[i].start_date,
					location: newResource[i].location,
					engagement_type: newResource[i].engagement_type,
					experience_range_id: newResource[i].experience_range_id,
					skill_id: newResource[i].skill_id,
					customer_role: newResource[i].customer_role,
					s_status: newResource[i].s_status
	
				});
			}

			// ------------------------ update project ids on task_assignment table for archived project id
			// if(allTaskIds.length > 0){
			// 	let taskEntity = await this.transaction.getExecutedQuery("d_o2c_task_assignment", { task_id:allTaskIds,  loadAll: true });
			// 	for(let i=0;i< taskEntity.length; i++){
			// 		taskEntity[i].project_id = mainRow.project_id
			// 	}
			// }
			let taskEntity = await this.transaction.getExecutedQuery("d_o2c_task_assignment", { actual_project_id:archivedProject,  loadAll: true });
			for(let i=0;i< taskEntity.length; i++){
				taskEntity[i].actual_project_id = mainRow.project_id
			}

			let filter_project = await this.transaction.getExecutedQuery("d_o2c_project_header", { project_id: archivedProject,  loadAll: true });
			for(let i=0; i<filter_project.length; i++){
				filter_project[i].s_status = "Archived";
			}
			

			this.transaction.commitP();

		}
		let newTableData = tableData.filter(item => !so_ids.includes(item.so));
		await this.tm.getTN("table_data_oth").setData(newTableData);
		busyDialog.close();
	}
	
	
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	
}