import { KloEntitySet } from 'kloBo_6-0';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';
import { d_o2c_company_info } from 'o2c_v2/entity/d_o2c_company_info';
import { d_o2c_business_area } from 'o2c_v2/entity/d_o2c_business_area';
import { d_o2c_profit_centre } from 'o2c_v2/entity_gen/d_o2c_profit_centre';
import { d_o2c_employee_skill_master } from 'o2c_v2/entity_gen/d_o2c_employee_skill_master';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
declare let KloUI5: any;
let oController;
let skillSet = [];
let skillMaster;
var dFilters = [];
@KloUI5("o2c_v2.controller.p_ui5_employee")
export default class p_ui5_employee extends KloController {
	public onInit() {
		let oLocalModel = new sap.ui.model.json.JSONModel();
		oLocalModel.setSizeLimit(300000); // for setting the list size to more than 100
		sap.ui.getCore().setModel(oLocalModel, "mDataModel");
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}

	public async onPageEnter() {
		oController = this;

		let viewName = this.getFlavor() + "_" + this.getFlavorVersion() + "_" + this.transaction.$SYSTEM.landscape + ".view.p_ui5_employee";
		let view = await sap.ui.core.Fragment.load({
			name: viewName,
			controller: this
		});
		this.getActiveControlById(null, 'pa_emp_list', 'p_ui5_employee').addContent(view);

		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "p_ui5_employee");

		const loginID = (await this.transaction.get$User()).login_id;
		const roleID = (await this.transaction.get$Role()).role_id;
		sap.ui.getCore().getModel("mDataModel").setProperty('/user_role', roleID);
		let empEntity = [];
		let oBusyIndicator = new sap.m.BusyDialog();
		oBusyIndicator.setText("Loading....");
		oBusyIndicator.open();

		if (roleID == "TOP_MANAGEMENT" || roleID == "LEGAL" || roleID == "HR" || roleID == "FINANCE" || roleID == "ADMIN") {
			empEntity = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { loadAll: true });
		} else {

			let vi = true;
			let tempsize = 0;
			let tempArray = [loginID]; // Ensure loginID is defined
			let mp = new Map();

			let loginData = await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: loginID, loadAll: true });
			let loginMemberData = await this.transaction.getExecutedQuery("d_o2c_employee", { line_manager: loginData[0].line_manager, loadAll: true });
			for (let employee of loginMemberData) {
				empEntity.push(employee);
			}

			while (vi) {
				// Await the result of the query and store it in managerList
				let managerList = await this.transaction.getExecutedQuery('d_o2c_employee', { line_manager: tempArray, loadAll: true });
				tempArray = [];

				// Iterate through the managerList
				for (let employee of managerList) {
					// Add employee ID to the map
					mp.set(employee.employee_id, employee.employee_id);

					// Check if the map size has increased
					if (mp.size > tempsize) {
						empEntity.push(employee);
						tempArray.push(employee.employee_id);
					}
					// Update the tempsize to the current map size
					tempsize = mp.size;
				}


				// If no more managers are found, exit the loop
				if (managerList.length == 0) {
					vi = false;
				}
			}

			let loginEmp = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery("d_o2c_employee", { employee_id: loginID });
			empEntity.push(loginEmp[0]);
		}
		let employeeOrg = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery("d_o2c_employee_org", { loadAll: true, is_primary: true, employee_id: loginID });
		const comp_info = <KloEntitySet<d_o2c_company_info>>await this.transaction.getExecutedQuery('d_o2c_company_info', { loadAll: true, 'company_code': employeeOrg[0]?.company_code });
		const business_info = <KloEntitySet<d_o2c_business_area>>await this.transaction.getExecutedQuery('d_o2c_business_area', { loadAll: true, 'company_code': employeeOrg[0]?.company_code });
		await this.tm.getTN("business_area").setData(business_info);
		const profit_cntr_info = <KloEntitySet<d_o2c_profit_centre>>await this.transaction.getExecutedQuery("d_o2c_profit_centre", { loadAll: true, company_code: employeeOrg[0]?.company_code });
		await this.tm.getTN("profit_cntr").setData(profit_cntr_info);
		skillMaster = <KloEntitySet<d_o2c_employee_skill_master>>await this.transaction.getExecutedQuery("d_o2c_employee_skill_master", { loadAll: true, business_are: employeeOrg[0]?.business_area });
		const company_name = comp_info[0]?.name;
		let desigMaster = <KloEntitySet<d_o2c_designation_master>> await this.transaction.getExecutedQuery("d_o2c_designation_master",{loadAll: true, company_code : employeeOrg[0]?.company_code, partialSelect : ["designation_id","name"]});
		// let desigMasterMap = new Map();
		// desigMaster.map((desig) => desigMasterMap.set(desig.designation_id,desig.name));
		//for line manager filtration 
		let lineManagerSet = new Set();
		empEntity.map((emp) => lineManagerSet.add(emp.line_manager));

		const allEmp = await Promise.all(empEntity.map(async (emp) => {
			let empOrg = await emp.r_employee_org.fetch();
			let empDesig = await emp.r_o2c_emp_designation.fetch();
			let curr_designation = desigMaster.find((desig) => (desig.designation_id === empDesig[0]?.designation))
			let empPrimaryOrg = empOrg.find(item => item.is_primary === true);
			let lineManager = empEntity.find(item => item.employee_id === emp.line_manager);
			let lineManagerName = lineManager?.full_name;
			let activeBusinessArea = business_info.find(item => item.business_area === empPrimaryOrg?.business_area);
			let activeProfitCntr = profit_cntr_info.find(item => item.profit_center === empPrimaryOrg?.profit_centre);
			let profilePic = await emp.profile_pic.getAttachmentP();
			let pic = profilePic ? profilePic : emp.full_name.charAt(0);
			let experience = this.dateDifference(emp.joining_date, new Date());
			return {
				name: emp.full_name,
				emp_id: emp.employee_id,
				gender: (emp.gender == "gen1") ? "Male" : "Female",
				pic,
				last_working_day : emp.last_working_day,
				is_active : emp.is_active,
				mail: emp.official_mail,
				joining_date: emp.joining_date,
				confirmation_date: emp.confirmation_date,
				phone_no: emp.phone_number,
				line_manager: emp.line_manager,
				line_mgr_name: lineManagerName,
				status: emp.s_status,
				company_code: company_name,
				business_area: activeBusinessArea?.name,
				profit_centre: activeProfitCntr?.name,
				visible: false,
				experience: `${experience.years} Years ${experience.months} Months`,
				skills: skillSet,
				is_line_manager : lineManagerSet.has(emp.employee_id) ? true : false,
				designation : curr_designation?.name
			};
		}));

		sap.ui.getCore().getModel("mDataModel").setProperty('/allEmployee', allEmp);
		oBusyIndicator.close();
	}


	//Difference between two dates in months and years..
	public dateDifference(date1, date2) {

		// Extract year, month, and day from both dates
		let year1 = date1.getFullYear();
		let month1 = date1.getMonth();
		let day1 = date1.getDate();

		let year2 = date2.getFullYear();
		let month2 = date2.getMonth();
		let day2 = date2.getDate();

		// Calculate the difference in years and months
		let years = year2 - year1;
		let months = month2 - month1;

		// Adjust if the last month isn't completed
		if (day2 < day1) {
			months--;
		}

		// If months are negative, adjust the years and months
		if (months < 0) {
			years--;
			months += 12;
		}

		return { years, months };
	}

	//Fuzzy Search
	public async onFuzzyEmpSearch(oEvent) {
		let term = oEvent.getSource().getValue();
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		if (term) {
			var aFilters = [
				new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, term),
				new sap.ui.model.Filter("emp_id", sap.ui.model.FilterOperator.Contains, term),
				new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.Contains, term)
			];
			var oFilter = new sap.ui.model.Filter({
				filters: aFilters,
				and: false
			});
			oBinding.filter([oFilter]);
		}
		else {
			oBinding.filter([])
		}
	}

	// For displaying the skill set on click of expand skill button
	public async skillDetail(oEvent) {
		let oContext = oEvent.getSource().getBindingContext("mDataModel");
		let employee_id = oContext.getProperty("emp_id");
		let visibility = oContext.getProperty("visible");
		let sPath = oContext.sPath;
		let index = parseInt((sPath.split("/"))[2]);
		// let visible = oContext.getProperty("visible");
		// oContext.setProperty({visible : true});
		// oContext.setProperty("/visible",true);

		for (var i = 0; i < sap.ui.getCore().getModel("mDataModel").getProperty("/" + (sPath.split("/"))[1]).length; i++) {
			if (i === index && visibility === false) {
				sap.ui.getCore().getModel("mDataModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/visible", true);
			} else {
				sap.ui.getCore().getModel("mDataModel").setProperty("/" + (sPath.split("/"))[1] + "/" + i + "/visible", false);
			}
		}

		let skill_info = await this.transaction.getExecutedQuery("d_o2c_employee_learning", { loadAll: true, employee_id: employee_id });
		skillSet = skill_info.map((skill) => {
			let skill_id = skillMaster.find((item) => item.skill_id === skill.skill_type);
			return {
				skill_type: skill_id.skill_Name,
				skill_level: skill.skill_level,
				special_mention: skill.special_mentions
			};
		})

		// let allEmp = sap.ui.getCore().getModel("mDataModel").getProperty("/allEmployee");
		// allEmp[index].skills.push(skillSet);
		sap.ui.getCore().getModel("mDataModel").setProperty("/" + (sPath.split("/"))[1] + "/" + index + "/skills", skillSet);
	}

	//Search filter calling based upon the selected data
	public async onEmpSearch() {
		let emp_search = await this.tm.getTN("all_emp_search").getData();
		this.onLineManagerChange(emp_search.line_manager);
		this.onOfficialMailChange(emp_search.official_mail);
		this.onPhoneNoChange(emp_search.phone_number);
		this.onEmpIDChange(emp_search.employee_id);
		this.onBusinessAreaChange(emp_search.name);
		this.onProfitCentreChange(emp_search.prft_name);
		this.onStatusChange(emp_search.s_status);
	}

	public async onLineManagerChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/lineManagerFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/lineManagerFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("line_manager", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/lineManagerFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onOfficialMailChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/officialMailFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/officialMailFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("mail", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/officialMailFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onPhoneNoChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/phoneNoFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/phoneNoFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("phone_no", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/phoneNoFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onEmpIDChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/empIDFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/empIDFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("emp_id", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/empIDFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onBusinessAreaChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/businessAreaFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/businessAreaFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("business_area", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/businessAreaFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onProfitCentreChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/profitCentreFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/profitCentreFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("profit_centre", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/profitCentreFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onStatusChange(sQuery) {

		// var sQuery = oEvent.getSource().getSelectedKey();

		if (sap.ui.getCore().getModel("mDataModel").getProperty("/statusFilter")) {
			dFilters = dFilters.filter(item => item !== sap.ui.getCore().getModel("mDataModel").getProperty("/statusFilter"));
		}


		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.Contains, sQuery);
			sap.ui.getCore().getModel("mDataModel").setProperty("/statusFilter", filter)
			dFilters.push(filter);
		}

		// aFilters=this.onFilter(sQuery)

		// update list binding
		var oList = sap.ui.getCore().byId("flist");
		var oBinding = oList.getBinding("items");
		oBinding.filter(dFilters);

	}

	public async onExcelDownload() {
		let busyDialog = new sap.m.BusyDialog({
			text: "Please Wait..."
		});
		busyDialog.open();

		if (!window.XLSX) {
			let path = "kloExternal/xlsx.bundle";
			await import(path);
		}
		// let data = sap.ui.getCore().getModel("mDataModel").getProperty("/allEmployee");
		// Get the list control
		var oList = sap.ui.getCore().byId("flist");

		// Get the binding of the items
		var oBinding = oList.getBinding("items");

		// Get the contexts of the currently visible items
		var aFilteredContexts = oBinding.getCurrentContexts();

		// Map contexts to data objects
		var aFilteredData = aFilteredContexts.map(function (oContext) {
			return oContext.getObject();
		});
		let jsonData = [];

		// Build the jsonData array using the fetched data
		for (let index = 0; index < aFilteredData.length; index++) {

			jsonData.push({
				'Employee Name': aFilteredData[index]?.name,
				'Employee Id': aFilteredData[index]?.emp_id,
				'Joining Date': aFilteredData[index]?.joining_date,
				'Confirmation Date': aFilteredData[index]?.confirmation_date,
				'Is Active': aFilteredData[index]?.is_active,
				'Last Working Date': aFilteredData[index]?.last_working_day,
				'Status': aFilteredData[index]?.status,
				'Company': aFilteredData[index]?.company_code,
				'Location': aFilteredData[index]?.business_area,
				'Team': aFilteredData[index]?.profit_centre,
				'Line Manager Name': aFilteredData[index]?.line_mgr_name,
				'Designation' : aFilteredData[index]?.designation,
				'Is Line Manager' : aFilteredData[index]?.is_line_manager
			});
		}

		const worksheet = XLSX.utils.json_to_sheet(jsonData);
		const workbook = XLSX.utils.book_new();

		// Set column widths
		worksheet['!cols'] = [
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 30 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 },
			{ width: 20 }
		];

		// Set header styles
		const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1", "L1", "M1"];
		headerCells.forEach(cell => {
			worksheet[cell].s = {
				fill: {
					fgColor: { rgb: "FFFF00" }
				}
			};
		});

		XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Data");

		// Write workbook to a file
		const filePath = 'employee_data.xlsx';
		XLSX.writeFile(workbook, filePath, { bookSST: true });
		busyDialog.close();

	}
}