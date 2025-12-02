import { request } from 'http';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity/d_o2c_employee';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_travel_page")
export default class p_travel_page extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public role_id;
	public login_id;
	public full_name;
	public UserInfo;
	public UserOrg;
	public async onPageEnter(oEvent) {
		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "travel_page");
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		await this.tm.getTN("relation_screen_length").setData({});
		await this.tm.getTN("completion_date").setData({});
		await this.tm.getTN("no_enter_check").setData({});
		await this.tm.getTN("completion_date").setProperty('today', new Date().getTime());
		let onNavdetail = await this.tm.getTN("travel_detail").getData();
		const travel_id = oEvent.navToParams.travel;
		if (travel_id != undefined) {
			let travel_list = this.tm.getTN("travel_list").getData();
			for (let i = 0; i < travel_list.length; i++) {
				if (travel_list[i].request_id == travel_id) {
					await this.tm.getTN("travel_list").setActive(i);
					let journey = await travel_list[i].r_travel_journey.fetch()
					let expense = await travel_list[i].r_travel_expense.fetch()
					await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
					await this.tm.getTN("relation_screen_length").setProperty('expense', expense.length);
					await this.tm.getTN("completion_date").setProperty('end_date', travel_list[i].travel_end_date?.getTime());
					await this.tm.getTN("vacation_search").setProperty('starting_date', travel_list[i].travel_start_date);
					await this.tm.getTN("vacation_search").setProperty('ending_date', travel_list[i].travel_end_date);
					await this.tm.getTN("vacation_search").setProperty('employee_id', travel_list[i].employee_id_for);
					if(new Date().getTime()>travel_list[i].travel_start_date?.getTime())
						await this.tm.getTN("no_enter_check").setProperty('check_day',true);
						else
						await this.tm.getTN("no_enter_check").setProperty('check_day',false);
					await this.tm.getTN("vacation_search").executeP();
					break;
				}
			}
		}
		else if (onNavdetail) {
			let journey = await onNavdetail.r_travel_journey.fetch()
			let expense = await onNavdetail.r_travel_expense.fetch()
			await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
			await this.tm.getTN("relation_screen_length").setProperty('expense', expense.length);
			if(new Date().getTime()>onNavdetail.travel_start_date?.getTime())
			await this.tm.getTN("no_enter_check").setProperty('check_day',true);
			else
			await this.tm.getTN("no_enter_check").setProperty('check_day',false);
			await this.tm.getTN("completion_date").setProperty('end_date', onNavdetail.travel_end_date?.getTime());
		}
		this.role_id = (await this.transaction.get$Role()).role_id;
		this.login_id = (await this.transaction.get$User()).login_id;
		let role_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { employee_id: this.login_id, page_name: "Travel Page", loadAll: true });
		if (role_list.length) {
			this.role_id = role_list[0].assyned_role;
		}
		await this.tm.getTN("other_travel_comment").setData({});
		await this.tm.getTN("logged_employee").setData({});
		this.UserInfo = await this.transaction.getExecutedQuery('d_o2c_employee', { employee_id: this.login_id, loadAll: true });
		this.UserOrg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: this.login_id, is_primary: true, loadAll: true });
		this.full_name = this.UserInfo[0].first_name.concat(" ", this.UserInfo[0].last_name);
		await this.tm.getTN("other_travel_comment").setProperty('user_name', this.full_name);
		await this.tm.getTN("other_travel_comment").setProperty('user_id', this.login_id);
		await this.tm.getTN("logged_employee").setProperty('login_id', this.UserInfo[0].employee_id);
		await this.tm.getTN("logged_employee").setProperty('role_id', this.role_id);
		await this.tm.getTN("logged_employee").setProperty('profit_center', this.UserOrg[0].profit_centre);
		await this.tm.getTN("travel_search").executeP();
		await this.tm.getTN("travel_project_search").setProperty('employee', this.UserInfo[0].employee_id);
		await this.tm.getTN("travel_project_search").executeP();
		oBusyDailog.close();
	}
	// Navigation to Detail
	public async onnavtodetail(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_list/", ''));
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.tm.getTN("travel_list").setActive(index);
		let travel_request = await this.tm.getTN("travel_list").getData()[index];
		await this.tm.getTN("ticket_booked_by").setData({});
		await this.tm.getTN("hotel_booked_by").setData({});
		if(new Date().getTime()>travel_request.travel_start_date?.getTime())
			await this.tm.getTN("no_enter_check").setProperty('check_day',true);
			else
			await this.tm.getTN("no_enter_check").setProperty('check_day',false);
		await this.tm.getTN("completion_date").setProperty('end_date', travel_request.travel_end_date?.getTime());
		//await this.tm.getTN("relation_screen_length").setData({});
		await this.tm.getTN("travel_project_search").setProperty('employee', travel_request.employee_id_for);
		await this.tm.getTN("travel_project_search").executeP();
		await this.tm.getTN("vacation_search").setProperty('starting_date', travel_request.travel_start_date);
		await this.tm.getTN("vacation_search").setProperty('ending_date', travel_request.travel_end_date);
		await this.tm.getTN("vacation_search").setProperty('employee_id', travel_request.employee_id_for);
		await this.tm.getTN("vacation_search").executeP();
		let workflow_list = await travel_request.r_travel_workflow.fetch();
		await this.tm.getTN("logged_employee").setProperty('show_button', "true");
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		for (let i = 0; i < workflow_list.length; i++) {
			if (workflow_list[i].s_status == "In-Progress" && workflow_list[i].approver && workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase()) {
				await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "true");
				await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "true");
			}
			else if (workflow_list[i].s_status == "In-Progress" && workflow_list[i].role == "TD" && this.role_id == "TD") {
				await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "true");
				await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "true");
			}
			else if (workflow_list[i].s_status == "In-Progress" && workflow_list[i].role == "SM" && this.role_id == "SM") {
				await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "true");
				await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "true");
			}
		}
		if (travel_request.s_status == "New" || travel_request.s_status == "Saved as Draft" || travel_request.s_status == "Clarification Required") {
			if (this.UserInfo[0].employee_id.toUpperCase() == travel_request.created_by.toUpperCase())
				await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "true");
		}
		if (travel_request.ticket_booking_by == "Client")
			await this.tm.getTN("ticket_booked_by").setProperty('switch', true);
		else
			await this.tm.getTN("ticket_booked_by").setProperty('switch', false);
		await this.tm.getTN("ticket_booked_by").setProperty('name', travel_request.ticket_booking_by);
		if (travel_request.hotel_booking_by == "Client")
			await this.tm.getTN("hotel_booked_by").setProperty('switch', true);
		else
			await this.tm.getTN("hotel_booked_by").setProperty('switch', false);
		let userorg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: travel_request.employee_id_for, is_primary: true, loadAll: true });
		let business_area = userorg[0].business_area;
		await this.tm.getTN("hotel_booked_by").setProperty('name', travel_request.hotel_booking_by);
		if (travel_request.trip_type == "International")
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', ["International", "Domestic", "Local"]);
		else if (travel_request.trip_type == "Domestic")
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', ["Local", "Domestic"]);
		else
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', travel_request.trip_type);
		let journey = await travel_request.r_travel_journey.fetch()
		let expense = await travel_request.r_travel_expense.fetch()
		await this.tm.getTN('pd_travel_search').setProperty('business_area', business_area);
		await this.tm.getTN('pd_travel_search').executeP();
		await this.navTo(({ TS: true, H: true, S: "p_travel_page", SS: "pa_detail" }));
		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		await this.tm.getTN("relation_screen_length").setProperty('expense', expense.length);
	}
	public async navtoExpense(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_expense_list/", ''));
		let expense = this.tm.getTN("travel_expense_list").getData()[index].request_id;
		let mode_id = "EDIT"
		await this.navTo(({ TS: true, H: true, S: "p_expense_page", SS: "pa_detail", expense, mode_id }));
	}
	//CREATE FUNCTIONS
	public async newTravelCreation() {
		let role_type
		await this.navTo(({ TS: true, H: true, S: "p_travel_page", SS: "pa_detail" }));
		if(this.role_id=="SALES"||this.role_id=="SM"){
			role_type="SALES"
		}
		else{
			role_type="DELIVERY"
		}
		let new_travel=await this.tm.getTN("travel_list").createEntityP({ created_by: this.UserInfo[0].employee_id, employee_id_for: this.UserInfo[0].employee_id, employee_team: this.UserOrg[0].profit_centre, dob: this.UserInfo[0].date_of_birth, s_status: "New", ticket_booking_by: "Client", hotel_booking_by: "Client",employee_role_type: role_type }, "Creation Successful", "Creation Failed", null, "First", true, true, false);
		await this.tm.getTN("travel_workflow_list").createEntityP({ role: this.role_id, approver: this.UserInfo[0].employee_id, s_status: "In-Progress", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.tm.getTN("relation_screen_length").setProperty('journey', 0);
		await this.tm.getTN("relation_screen_length").setProperty('expense', 0);
		await this.tm.getTN("vacation_search").setProperty('employee_id', new_travel.employee_id_for);
		await this.tm.getTN("vacation_search").executeP();
	}
	public async newExpenseFiling() {
		let expense = this.tm.getTN("travel_detail").getData().request_id;
		let project = this.tm.getTN("travel_project_list").getData();
		let mode_id = "CREATE"
		let order_type;
		let selected_project = await this.transaction.getExecutedQuery(
			"q_travel_project_vh",
			{
			  project_id: project[0].project_id,
			  employee: this.UserInfo[0].employee_id,
			  loadAll: true,
			}
		  );
		  if (selected_project.length > 0) {
			let so = await selected_project[0].r_project_so.fetch();
			 order_type = so[0].type;
		}
		await this.navTo(({ H: true, S: "p_expense_page", SS: "pa_detail", expense, mode_id, order_type }));
	}
	public async newJourneyCreation() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let journey = this.tm.getTN("travel_journey_list").getData()
		if(journey.length==0)
		await this.tm.getTN("travel_journey_list").createEntityP({departure: detail.travel_start_date }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		else{
		let last_location = journey[journey.length - 1].to_location
		let travelled_location = journey[0].from_location
		if(last_location==travelled_location){
			travelled_location=undefined;
		}
		if(journey[0].from_location==journey[journey.length - 1].from_location){
			await this.tm.getTN("travel_journey_list").createEntityP({ from_location: last_location, to_location: travelled_location, departure: detail.travel_end_date,currency_code:"INR",perdiem_amount:0 }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		}
		else
		await this.tm.getTN("travel_journey_list").createEntityP({ from_location: last_location, to_location: travelled_location, departure: detail.travel_end_date }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		}
		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		// if (detail.journey_type == "round_trip_dom" || detail.journey_type == "round_trip_inter") {
		// 	if (journey.length == undefined || journey.length == 0) {
		// 		await this.tm.getTN("travel_journey_list").createEntityP({ departure: detail.travel_start_date }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		// 		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		// 	}
		// 	else if (journey.length >= 1) {
		// 		let last_location = journey[journey.length - 1].to_location
		// 		let travelled_location = journey[journey.length - 1].from_location
		// 		await this.tm.getTN("travel_journey_list").createEntityP({ from_location: last_location, to_location: travelled_location, departure: detail.travel_end_date }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		// 		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		// 	}
		// }
		// else {
		// 	if (journey.length == undefined || journey.length == 0) {
		// 		await this.tm.getTN("travel_journey_list").createEntityP({ departure: detail.travel_start_date }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		// 		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		// 	}
		// 	else if (journey.length >= 1) {
		// 		let last_location = journey[journey.length - 1].to_location
		// 		await this.tm.getTN("travel_journey_list").createEntityP({ from_location: last_location }, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
		// 		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		// 	}
		// }
	}
	public async newVacationCreation() {
		await this.tm.getTN("travel_vacation_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "Last", true, true, false);
	}
	public async newAdvanceCreation() {
		await this.tm.getTN("travel_advance_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async newTransactionCreation() {
		await this.tm.getTN("travel_transaction_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async newProjectCreation() {
		await this.tm.getTN("travel_project_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async newTicketCreation() {
		await this.tm.getTN("travel_ticket_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async newHotelCreation() {
		await this.tm.getTN("travel_hotel_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	public async newForexCreation() {
		await this.tm.getTN("travel_forex_list").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
	}
	//DELETE FUNCTIONS
	public async JourneyDeletion() {
		const selected = await this.getActiveControlById(null, "s_journey_list").getSelectedIndices();
		await this.tm.getTN("travel_journey_list").getData()[selected[0]].deleteP();
		let journey = this.tm.getTN("travel_journey_list").getData()
		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		await this.total_perdiem_calculation();
	}
	public async VacationDeletion() {
		const selected = await this.getActiveControlById(null, "s_vacation_list").getSelectedIndices();
		await this.tm.getTN("travel_vacation_list").getData()[selected[0]].deleteP();
		await this.total_perdiem_calculation();
	}
	public async AdvanceDeletion() {
		const selected = await this.getActiveControlById(null, "s_advance_amt_list").getSelectedIndices();
		await this.tm.getTN("travel_advance_list").getData()[selected[0]].deleteP();
		await this.total_perdiem_calculation();
	}
	public async ProjectDeletion() {
		const selected = await this.getActiveControlById(null, "s_project_list").getSelectedIndices();
		await this.tm.getTN("travel_project_list").getData()[selected[0]].deleteP();
	}
	public async TransactionDeletion() {
		const selected = await this.getActiveControlById(null, "s_transaction_list").getSelectedIndices();
		await this.tm.getTN("travel_transaction_list").getData()[selected[0]].deleteP();
		await this.onTransactionChange()
	}
	public async TicketDeletion() {
		const selected = await this.getActiveControlById(null, "s_ticket_list").getSelectedIndices();
		for(let i=selected.length;i>=0;i--){
			await this.tm.getTN("travel_ticket_list").getData()[selected[i]].deleteP();
		}
		await this.total_perdiem_calculation();
	}
	public async HotelDeletion() {
		const selected = await this.getActiveControlById(null, "s_hotel_list").getSelectedIndices();
		for(let i=selected.length;i>=0;i--){
			await this.tm.getTN("travel_hotel_list").getData()[selected[i]].deleteP();
		}
		await this.total_perdiem_calculation();
	}
	public async ForexDeletion() {
		const selected = await this.getActiveControlById(null, "s_forex_update").getSelectedIndices();
		await this.tm.getTN("travel_forex_list").getData()[selected[0]].deleteP();
	}
	public async deleteInternationalJourney() {
		let journey_list = await this.tm.getTN("travel_journey_list").getData();
		for (let i = journey_list.length - 1; i >= 0; i--) {
			if (journey_list[i].journey_type == "International") {
				await this.tm.getTN("travel_journey_list").getData()[i].deleteP();
			}
		}
		await this.total_perdiem_calculation();
		await this.saveTravel();
	}
	public async deleteAllTicket() {
		let ticket_list = await this.tm.getTN("travel_ticket_list").getData();
		for (let i = ticket_list.length - 1; i >= 0; i++) {
			await this.tm.getTN("travel_ticket_list").getData()[i].deleteP();
		}
		await this.saveTravel();
	}
	public async deleteAllHotel() {
		let hotel_list = await this.tm.getTN("travel_hotel_list").getData();
		for (let i = hotel_list.length - 1; i >= 0; i--) {
			await this.tm.getTN("travel_hotel_list").getData()[i].deleteP();
		}
		await this.saveTravel();
	}
	//TOOLBAR FUNCTIONALITY
	public editTravel() {
		this.setMode("EDIT");
	}
	public async saveTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let ticket_list = await this.tm.getTN("travel_ticket_list").getData();
		let hotel_list = await this.tm.getTN("travel_hotel_list").getData();
		let journey_list = await this.tm.getTN("travel_journey_list").getData();
		let travel_mode = false;
		if(detail.s_status=="Approved by Travel Desk" && this.login_id.toUpperCase()==detail.employee_id_for.toUpperCase()){
			await this.onCommentingofChangingTravelJourney();
		}
		else{
		if (detail.s_status == "New")
				detail.s_status = "Saved as Draft";
		if (detail.trip_type == "Local" && journey_list.length > 0) {
			for (let i = journey_list.length - 1; i >= 0; i--) {
				await this.tm.getTN("travel_journey_list").getData()[i].deleteP();
			}
		}
		if (detail.trip_type == "Domestic") {
			for (let i = 0; i < journey_list.length; i++) {
				if (journey_list[i].journey_type == "International") {
					travel_mode = true;
					break;
				}
			}
		}
		if (detail.description == undefined || detail.description == '') {
			sap.m.MessageBox.error("Provide Description", { title: "Error", });
		}
		else if (detail.travel_start_date == undefined) {
			sap.m.MessageBox.error("Provide Start Date", { title: "Error", });
		}
		else if (detail.travel_end_date == undefined) {
			sap.m.MessageBox.error("Provide End Date", { title: "Error", });
		}
		else if (detail.trip_type == undefined || detail.trip_type == '') {
			sap.m.MessageBox.error("Provide Travel Type", { title: "Error", });
		}
		else if (detail.ticket_booking_by == "Client" && ticket_list.length > 0) {
			sap.m.MessageBox.confirm("Provided Tickets will be Deleted as No Tickets required for Journey. Press OK to Continue", {
				title: "Ticket not Required in Travel",
				actions: [sap.m.MessageBox.Action.OK,
				sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "OK") {
						this.deleteAllTicket();
					}
				}
			})
		}
		else if (detail.hotel_booking_by == "Client" && hotel_list.length > 0) {
			sap.m.MessageBox.confirm("Provided Hotels will be Deleted as No Hotels required for Journey. Press OK to Continue", {
				title: "Hotel Not Required in Travel",
				actions: [sap.m.MessageBox.Action.OK,
				sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "OK") {
						this.deleteAllHotel();
					}
				}
			})
		}
		else if (travel_mode == true) {
			sap.m.MessageBox.confirm("As Travel Type Provided Domestic, International Journeys will get Deleted. Press OK to Continue", {
				title: "Domestic Travel cannot have International Journeys",
				actions: [sap.m.MessageBox.Action.OK,
				sap.m.MessageBox.Action.CANCEL],
				onClose: (oAction) => {
					if (oAction == "OK") {
						this.deleteInternationalJourney();
					}
				}
			})
		}
		else if (this.role_id == "TD") {
			let td_check = false;
			if (detail.s_status == "Approved by Team Head" || detail.s_status == "Approved by Travel Desk" || detail.s_status == "Travel Completed" || detail.s_status == "Clarification Provided" || detail.s_status == "Re Opened") {
				td_check = true;
				let journey_list = await this.tm.getTN("travel_journey_list").getData();
				let vacation_list = await this.tm.getTN("travel_vacation_list").getData();
				let journey_check = false;
				let vacation_check = false;
				for (let i = 0; i < journey_list.length; i++) {
					if (new Date(journey_list[i].vacation_from)?.getTime() < new Date(detail.travel_start_datee)?.getTime()) {
						journey_check = true;
					}
					else if (new Date(journey_list[i].vacation_to)?.getTime() > new Date(detail.travel_end_date)?.getTime()) {
						journey_check = true;
					}
				}
				if (journey_list.length == 0 && detail.trip_type != "Local") {
					sap.m.MessageBox.error("No Journey Entry Found", { title: "Error", });
				}
				else if (journey_check == true) {
					sap.m.MessageBox.error("Please Add Journey Dates in-between Start Date and End Date", { title: "Error", });
				}
				else {
					// await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
					await this.retrySave("Saved Successfully", "Save Failed")
				}
			}
			if (td_check == false) {
				// await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
				await this.retrySave("Saved Successfully", "Save Failed");
			}
		}
		else {
			// await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
			await this.retrySave("Saved Successfully", "Save Failed");
		}
	}
	}
	public async discardChangesTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		await this.transaction.rollback();
		let journey = await detail.r_travel_journey.fetch()
		await this.tm.getTN("relation_screen_length").setProperty('journey', journey.length);
		this.setMode("DISPLAY");
		if (detail.s_status == "New")
			await this.navTo(({ TS: true, H: true, S: "p_travel_page", SS: "pa_travel_list" }));
	}
	public async submitTravel() {
		let project_id_array = [];
		let notif_to = "";
		let notif_cc = new Set();
		let entity_profit = new Set();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let journey_list = await this.tm.getTN("travel_journey_list").getData();
		let project_list = await this.tm.getTN("travel_project_list").getData();
		let vacation_list = await this.tm.getTN("travel_vacation_list").getData();
		let journey_check = false;
		let vacation_check = false;
		let split_check = false;
		let journey_pd_check = false;
		let role_store = this.role_id;
		let pc_store = this.UserOrg[0].profit_centre;
		let emp_designation = await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: detail.employee_id_for, fdate: new Date().getTime(), tdate: new Date().getTime() });
		for (let i = 0; i < journey_list.length; i++) {
			if (new Date(journey_list[i].departure)?.getTime() < new Date(detail.travel_start_datee)?.getTime() || new Date(journey_list[i].departure)?.getTime() > new Date(detail.travel_end_date)?.getTime()) {
				journey_check = true;
			}
		}
		if (detail.r_travel_project.length > 0) {
			let total_percent = 0;
			for (let i = 0; i < detail.r_travel_project.length; i++) {
				total_percent = total_percent + detail.r_travel_project[i].split_percent
			}
			if (total_percent != 100) {
				split_check = true;
			}
		}
		if (journey_list.length != 0 && detail.trip_type != "Local"){
			//let so = await project_list[0].r_project_so;
			let so = await await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true,so:project_list[0].so });
			for(let i=0;i<journey_list.length;i++){
				if(journey_list[i].to_location!=journey_list[0].from_location && journey_list[i].per_diem_amount==0 && so[0].type!="NBS" && so[0].type!="ISP" && so[0].type!="PSL"){
					sap.m.MessageBox.error("Journey "+journey_list[i].to_location+" Not Maintained in SO of the Project", { title: "Error", });
					journey_pd_check=true;
					break;
				}
			}
		}
		if (journey_list.length == 0 && detail.trip_type != "Local") {
			sap.m.MessageBox.error("No Journey Entry Found", { title: "Error", });
		}
		else if (journey_pd_check==true) {
			
		}
		else if (project_list.length == 0) {
			sap.m.MessageBox.error("No Project Details Found", { title: "Error", });
		}
		else if (journey_check == true) {
			sap.m.MessageBox.error("Please Add Journey Dates in-between Start Date and End Date", { title: "Error", });
		}
		else if (emp_designation.length == 0) {
			sap.m.MessageBox.error("Please Ask HR to add Designation", { title: "Error", });
		}
		else if (detail.description == undefined || detail.description == '') {
			sap.m.MessageBox.error("Provide Description", { title: "Error", });
		}
		else if (split_check == true) {
			sap.m.MessageBox.error("Overall Project Split to be 100%", { title: "Error", });
		}
		else if (detail.total_per_diem_cal == '' && detail.trip_type=="Local" && detail.employee_role_type=="DELIVERY") {
			sap.m.MessageBox.error("Local Location Per Diem not Maintained in SO", { title: "Error", });
		}
		else if (detail.totalamount == ''&& detail.trip_type=="Local" && detail.employee_role_type=="DELIVERY") {
			sap.m.MessageBox.error("Local Location Per Diem not Maintained in SO", { title: "Error", });
		}
		else {
			if (detail.created_by != detail.employee_id_for) {
				let role_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { employee_id: detail.employee_id_for, page_name: "Travel Page", loadAll: true });
				if (role_list.length) {
					role_store = role_list[0].assyned_role;
					let userorg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
					pc_store = userorg[0].profit_centre;
				}
				else {
					let emp_designation_name = await this.transaction.getExecutedQuery('d_o2c_designation_master', { designation_id: emp_designation[0].designation, loadAll: true });
					role_store = emp_designation_name[0].name;
					let userorg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
					pc_store = userorg[0].profit_centre;
				}
			}
			detail.s_status = "Submitted";
			detail.submitted_on = new Date();
			let workflow_list = detail.r_travel_workflow[0];
			workflow_list.s_status = "Submitted";
			workflow_list.approved_on = new Date();
			if (role_store != "TEAM_HEAD" && role_store != "SALES" && role_store != "TD" && role_store != "SM") {
				for (let i = 0; i < project_list.length; i++) {
					project_id_array[i] = project_list[i].project_id;
				}
				let task_list = await this.transaction.getExecutedQuery('q_travel_expense_pm', { project_search_id: project_id_array, loadAll: true });
				for (let i = 0; i < task_list.length; i++) {
					if (!entity_profit.has(task_list[i].project_manager.toUpperCase()) && task_list[i].project_manager.toUpperCase() != detail.employee_id_for.toUpperCase()) {
						entity_profit.add(task_list[i].project_manager.toUpperCase());
						notif_cc.add(task_list[i].project_manager);
					}
				}
				const entityProfitArray = Array.from(entity_profit);
				for (let i = 0; i < entity_profit.size; i++) {
					await this.tm.getTN("travel_workflow_list").createEntityP({ role: "PM", approver: entityProfitArray[i], created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
				if (entity_profit.size == 0) {
					let team_head_list = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { profit_center: pc_store, loadAll: true });
					let team_head = team_head_list[0].team_head;
					notif_cc.add(team_head_list[0].team_head);
					await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TEAM_HEAD", approver: team_head, created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
			}
			else if (role_store == "TEAM_HEAD") {
				let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
			else if (role_store == "SM") {
				let team_head_list = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { profit_center: pc_store, loadAll: true });
				let team_head = team_head_list[0].team_head;
				if(this.login_id.toUpperCase()!=team_head.toUpperCase()){
					notif_cc.add(team_head_list[0].team_head);
					await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TEAM_HEAD", approver: team_head, created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
				else{
					let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
					await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
			}
			else if (role_store == "SALES") {
				let sales_manager_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "SM", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < sales_manager_list.length; i++) {
					notif_cc.add(sales_manager_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "SM", created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
			else if (role_store == "TD") {
				let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: pc_store }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
			notif_to = detail.created_by;
			const notif_cc_array = Array.from(notif_cc);
			for (let i = 0; i < notif_cc_array.length; i++) {
				notif_cc_array[i] = notif_cc_array[i].toLowerCase();
			}
			await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
			await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
			await this.tm.getTN('notification_search').setProperty('approver', null);
			await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
			await this.tm.getTN('notification_search').setProperty('type', "Submit");
			await this.tm.getTN('notification_search').executeP();
			await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
			await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
			// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
			await this.retrySave("Saved Successfully", "Save Failed");
		}
	}
	public async approveTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let notif_to = "";
		let count = 0;
		let notif_cc = new Set();
		let workflow_list = await this.transaction.getExecutedQuery('d_o2c_expense_workflow', { request_id: detail.request_id, loadAll: true, skipMap: true });
		let workflow_transnode = await this.tm.getTN("travel_workflow_list").getData();
		if (this.role_id == "TEAM_HEAD") {
			let inprocess_count = 0;
			let profit_center = ""
			for (let i = 0; i < workflow_list.length; i++) {
				if (workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Approved";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Approved";
					workflow_transnode[i].approved_on = new Date();
					profit_center = workflow_list[i].profit_center
					notif_cc.add(workflow_list[i].approver);
				}
				else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					inprocess_count = inprocess_count + 1;
					notif_cc.add(workflow_list[i].approver);
				}
			}
			if (inprocess_count == 0) {
				detail.s_status = "Approved by Team Head"
				let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
		}
		else if (this.role_id == "SM") {
			//let workflow_list = detail.r_travel_workflow;
			let inprocess_count = 0;
			let profit_center = ""
			let approver_flag=false;
			for (let i = 0; i < workflow_list.length; i++) {
				if (workflow_list[i].role == "SM" && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].approver = this.UserInfo[0].employee_id;
					workflow_list[i].s_status = "Approved";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].approver = this.UserInfo[0].employee_id;
					workflow_transnode[i].s_status = "Approved";
					workflow_transnode[i].approved_on = new Date();
					profit_center = workflow_list[i].profit_center;
					notif_cc.add(workflow_list[i].approver);
					approver_flag=true
				}
				else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].role == "SM" && workflow_list[i].s_status == "In-Progress") {
					inprocess_count = inprocess_count + 1;
					notif_cc.add(workflow_list[i].approver);
					approver_flag=true
				}
			}
			if(approver_flag==false){
				for (let i = 0; i < workflow_list.length; i++) {
					if (workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
						workflow_list[i].s_status = "Approved";
						workflow_list[i].approved_on = new Date();
						workflow_transnode[i].s_status = "Approved";
						workflow_transnode[i].approved_on = new Date();
						profit_center = workflow_list[i].profit_center
						notif_cc.add(workflow_list[i].approver);
					}
					else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
						inprocess_count = inprocess_count + 1;
						notif_cc.add(workflow_list[i].approver);
					}
				}	
			}
			if (inprocess_count == 0) {
				let team_head_list = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { profit_center: profit_center, loadAll: true });
				let team_head = team_head_list[0].team_head;
				if(this.login_id.toUpperCase()!=team_head.toUpperCase()){
				detail.s_status = "Approved by Sales Manager"
				notif_cc.add(team_head);
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TEAM_HEAD", approver: team_head, created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
				else{
					detail.s_status = "Approved by Team Head"
					let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
				}
			}
		}
		else if (this.role_id == "TD") {
			//let workflow_list = detail.r_travel_workflow;
			let inprocess_count = 0;
			for (let i = 0; i < workflow_list.length; i++) {
				if (workflow_list[i].role == "TD" && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].approver = this.UserInfo[0].employee_id;
					workflow_list[i].s_status = "Approved";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].approver = this.UserInfo[0].employee_id;
					workflow_transnode[i].s_status = "Approved";
					workflow_transnode[i].approved_on = new Date();
				}
				else if (workflow_list[i].approver != this.UserInfo[0].employee_id && workflow_list[i].role == "TD" && workflow_list[i].s_status == "In-Progress") {
					inprocess_count = inprocess_count + 1;
				}
				if (inprocess_count == 0) {
					let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
					for (let i = 0; i < travel_desk_list.length; i++) {
						notif_cc.add(travel_desk_list[i].employee_id);
					}
					detail.s_status = "Approved by Travel Desk";
				}
			}
			//await this.ExpenseAutoPerDiem()
		}
		else {
			//let workflow_list = detail.r_travel_workflow;
			let inprocess_count = 0;
			let profit_center = ""
			for (let i = 0; i < workflow_list.length; i++) {
				if (workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].role == "PM" && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Approved";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Approved";
					workflow_transnode[i].approved_on = new Date();
					profit_center = workflow_list[i].profit_center
					notif_cc.add(workflow_list[i].approver);
				}
				else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].role == "PM" && workflow_list[i].s_status == "In-Progress") {
					inprocess_count = inprocess_count + 1;
					count = count + 1;
					notif_cc.add(workflow_list[i].approver);
				}
			}
			if (inprocess_count == 0) {
				let team_head_list = await this.transaction.getExecutedQuery('d_o2c_profit_centre', { profit_center: profit_center, loadAll: true });
				let team_head = team_head_list[0].team_head;
				let pm_flag=false;
				for(let i=0;i<workflow_list.length;i++){
					if(workflow_list[i].approver.toUpperCase()==team_head.toUpperCase() && workflow_list[i].s_status == "Approved"){
						pm_flag=true;
						break;
					}
				}
				if(pm_flag==false){
				notif_cc.add(team_head);
				detail.s_status = "Approved by Project Manager"
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TEAM_HEAD", approver: team_head, created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
			else{
				detail.s_status = "Approved by Team Head"
				let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: "TD", created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			}
		}
		}
		notif_to = detail.created_by;
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		if (this.role_id == "TD")
			await this.tm.getTN('notification_search').setProperty('type', "ApproveTD");
		else if (this.role_id != "TD" && this.role_id != "SM" && this.role_id != "TEAM_HEAD" && count != 0)
			await this.tm.getTN('notification_search').setProperty('type', "ApprovePM");
		else
			await this.tm.getTN('notification_search').setProperty('type', "Approve");
		await this.tm.getTN('notification_search').executeP();
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		// await this.tm.commitP("Saved Successfully", "Save Failed", true, true);
		await this.retrySave("Saved Successfully", "Save Failed");
		await this.tm.getTN('travel_workflow_list').refresh();
	}
	public async rejectTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		//let workflow_list = detail.r_travel_workflow;
		let workflow_list = await this.transaction.getExecutedQuery('d_o2c_expense_workflow', { request_id: detail.request_id, loadAll: true, skipMap: true });
		let workflow_transnode = await this.tm.getTN("travel_workflow_list").getData();
		let notif_to = ""
		let notif_cc = new Set()
		for (let i = 0; i < workflow_list.length; i++) {
			if (this.role_id != "TD" && this.role_id != "SM") {
				if (workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Rejected";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Rejected";
					workflow_transnode[i].approved_on = new Date();
					notif_cc.add(workflow_list[i].approver);
				}
				else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Rejected by Other";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Rejected by Other";
					workflow_transnode[i].approved_on = new Date();
					notif_cc.add(workflow_list[i].approver);
				}
			}
			else {
				if (workflow_list[i].role == this.role_id && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Rejected";
					workflow_list[i].approved_on = new Date();
					workflow_list[i].approver = this.UserInfo[0].employee_id;
					workflow_transnode[i].s_status = "Rejected";
					workflow_transnode[i].approved_on = new Date();
					workflow_transnode[i].approver = this.UserInfo[0].employee_id;
					notif_cc.add(workflow_list[i].approver);
				}
			}
		}
		detail.s_status = "Rejected";
		notif_to = detail.created_by;
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "Reject");
		await this.tm.getTN('notification_search').executeP();
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}
	public async returnBackTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		//let workflow_list = detail.r_travel_workflow;
		let workflow_list = await this.transaction.getExecutedQuery('d_o2c_expense_workflow', { request_id: detail.request_id, loadAll: true, skipMap: true });
		let workflow_transnode = await this.tm.getTN("travel_workflow_list").getData();
		let notif_to = ""
		let notif_cc = new Set()
		let creator_role = ""
		let profit_center = ""
		for (let i = 0; i < workflow_list.length; i++) {
			if (this.role_id != "TD" && this.role_id != "SM") {
				if (workflow_list[i].approver.toUpperCase() == this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Returned Back";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Returned Back";
					workflow_transnode[i].approved_on = new Date();
					profit_center = workflow_list[i].profit_center
					notif_cc.add(workflow_list[i].approver);
				}
				else if (workflow_list[i].approver.toUpperCase() != this.UserInfo[0].employee_id.toUpperCase() && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Returned Back";
					workflow_list[i].approved_on = new Date();
					workflow_transnode[i].s_status = "Returned Back";
					workflow_transnode[i].approved_on = new Date();
					profit_center = workflow_list[i].profit_center
					notif_cc.add(workflow_list[i].approver);
				}
			}
			else {
				if (workflow_list[i].role == this.role_id && workflow_list[i].s_status == "In-Progress") {
					workflow_list[i].s_status = "Returned Back";
					workflow_list[i].approved_on = new Date();
					workflow_list[i].approver = this.UserInfo[0].employee_id;
					workflow_transnode[i].s_status = "Returned Back";
					workflow_transnode[i].approved_on = new Date();
					workflow_transnode[i].approver = this.UserInfo[0].employee_id;
					profit_center = workflow_list[i].profit_center
					notif_cc.add(workflow_list[i].approver);
				}
			}
			if (workflow_list[i].s_status == "Submitted") {
				creator_role = workflow_list[i].role;
				profit_center = workflow_list[i].profit_center
			}
		}
		detail.s_status = "Clarification Required";
		notif_to = detail.created_by;
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "Return");
		await this.tm.getTN('notification_search').executeP();
		await this.tm.getTN("travel_workflow_list").createEntityP({ role: creator_role, approver: detail.created_by, created_on: new Date(), s_status: "In-Progress", profit_center: profit_center }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}
	public async clarificationProvidedforTravel() {
		let notif_to = ""
		let notif_cc = new Set()
		let returner_list = new Set();
		let returner_role = "";
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		//let workflow_list = detail.r_travel_workflow;
		let workflow_list = await this.transaction.getExecutedQuery('d_o2c_expense_workflow', { request_id: detail.request_id, loadAll: true, skipMap: true });
		let workflow_transnode = await this.tm.getTN("travel_workflow_list").getData();
		for (let i = 0; i < workflow_list.length; i++) {
			if (workflow_list[i].s_status == "Returned Back") {
				workflow_list[i].s_status = "Returned-Back";
				workflow_transnode[i].s_status = "Returned-Back";
				returner_list.add(workflow_list[i].approver);
				notif_cc.add(workflow_list[i].approver);
				returner_role = workflow_list[i].role;
			}
			else if (workflow_list[i].s_status == "In-Progress") {
				workflow_list[i].s_status = "Clarification Provided";
				workflow_list[i].approved_on = new Date();
				workflow_transnode[i].s_status = "Clarification Provided";
				workflow_transnode[i].approved_on = new Date();
			}
		}
		const returnerArray = Array.from(returner_list);
		for (let i = 0; i < returnerArray.length; i++) {
			if (returner_role != "TD" && returner_role != "SM")
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: returner_role, approver: returnerArray[i], created_on: new Date(), s_status: "In-Progress", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			else
				await this.tm.getTN("travel_workflow_list").createEntityP({ role: returner_role, created_on: new Date(), s_status: "In-Progress", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		}
		detail.s_status = "Clarification Provided";
		notif_to = detail.created_by;
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "Clarity");
		await this.tm.getTN('notification_search').executeP();
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}
	public async cancelTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		await this.tm.getTN("travel_workflow_list").createEntityP({ role: this.role_id, approved_on: new Date(), s_status: "Cancelled", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		detail.description = "Cancelled";
		detail.deleteP();
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
		let notif_to = ""
		notif_to = detail.created_by;
		let notif_cc = new Set()
		if (detail.created_by.toLowerCase() != detail.employee_id_for.toLowerCase()) {
			notif_cc.add(detail.employee_id_for.toLowerCase());
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc);
		await this.tm.getTN('notification_search').setProperty('type', "Cancel");
		await this.tm.getTN('notification_search').executeP();
		await this.navTo(({ TS: true, H: true, S: "p_travel_page", SS: "pa_travel_list" }));
	}
	public async completeTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		detail.s_status = "Travel Completed";
		let notif_cc = new Set()
		let notif_to = detail.created_by;
		let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
		for (let i = 0; i < travel_desk_list.length; i++) {
			notif_cc.add(travel_desk_list[i].employee_id);
		}
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "Complete");
		await this.tm.getTN('notification_search').executeP();
		await this.tm.getTN("logged_employee").setProperty('pending_for_approval', "false");
		await this.tm.getTN("logged_employee").setProperty('pending_for_comment', "false");
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}
	public async closeTAF() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let notif_cc = new Set()
		let notif_to = detail.created_by;
		let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
		for (let i = 0; i < travel_desk_list.length; i++) {
			notif_cc.add(travel_desk_list[i].employee_id);
		}
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		let expense_check = 0;
		let expense_list = await this.transaction.getExecutedQuery('d_o2c_expense_header', { travel_request_id: detail.request_id, loadAll: true });
		for (let i = 0; i < expense_list.length; i++) {
			if (expense_list[i].expense_status != "Paid" && expense_list[i].expense_status != "Rejected" && expense_list[i].expense_status != "Cancelled") {
				expense_check = expense_check + 1;
			}
		}
		if (expense_check == 0) {
			await this.tm.getTN("travel_workflow_list").createEntityP({ approver: this.UserInfo[0].employee_id, role: "TD", created_on: new Date(), approved_on: new Date(), s_status: "Closed", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			detail.s_status = "Travel Closed";
			await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
			await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
			await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
			await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
			await this.tm.getTN('notification_search').setProperty('type', "Closed");
			await this.tm.getTN('notification_search').executeP();
			// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
			await this.retrySave("Saved Successfully", "Save Failed");
		}
		else {
			sap.m.MessageBox.error(expense_check + " Expenses are yet to be Settled", {
				title: "Error",
			});
		}
	}
	public async reopenTravel() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		await this.tm.getTN("travel_workflow_list").createEntityP({ approver: this.UserInfo[0].employee_id, role: "TD", created_on: new Date(), approved_on: new Date(), s_status: "Re Opened", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		detail.s_status = "Re Opened";
		let notif_to = detail.created_by;
		let notif_cc = new Set()
		if (detail.created_by.toLowerCase() != detail.employee_id_for.toLowerCase()) {
			notif_cc.add(detail.employee_id_for.toLowerCase());
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc);
		await this.tm.getTN('notification_search').setProperty('type', "ReOpened");
		await this.tm.getTN('notification_search').executeP();
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}
	public async cancelTravelbyTD() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		await this.tm.getTN("travel_workflow_list").createEntityP({ approver: this.UserInfo[0].employee_id, role: "TD", created_on: new Date(), approved_on: new Date(), s_status: "Cancelled", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		detail.s_status = "Cancelled";
		let notif_to = detail.created_by;
		let notif_cc = new Set()
		if (detail.created_by.toLowerCase() != detail.employee_id_for.toLowerCase()) {
			notif_cc.add(detail.employee_id_for.toLowerCase());
		}
		let expense = await detail.r_travel_expense.fetch()
		for (let i = 0; i < expense.length; i++) {
			if (expense[i].expense_status != "Cancelled" && expense[i].expense_status != "Rejected") {
				expense[i].expense_status = "Cancelled"
			}
		}
		await this.tm.getTN('notification_search').setProperty('notif_to', notif_to);
		await this.tm.getTN('notification_search').setProperty('approver', this.UserInfo[0].employee_id);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc);
		await this.tm.getTN('notification_search').setProperty('type', "CancelTD");
		await this.tm.getTN('notification_search').executeP();
		// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
		await this.retrySave("Saved Successfully", "Save Failed");
	}

	//COMMENTING
	public async commentingTravel() {
		let t_mode = this.getMode();
		let other_comment = this.tm.getTN("other_travel_comment").getData().comment;
		let date = new Date();
		if (other_comment) {
			await this.tm.getTN("travel_comment_list").createEntityP({ comment: other_comment, user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, true, false);
			await this.tm.getTN("other_travel_comment").setProperty('comment', null);
			if (t_mode != 'CREATE') {
				if (t_mode != 'EDIT') {
					// await this.tm.commitP("Saved Successfully", "Save Failed", false, false);
					await this.retrySave("Saved Successfully", "Save Failed");
					this.setMode('DISPLAY');
				}
				else {
					this.setMode('EDIT');
				}
			}
			else {
				this.setMode('CREATE');
			}
		}
		else {
			sap.m.MessageBox.error("Please Write Comment", {
				title: "Error",
			});
		}
	}
	//MANUPULATING DATAS
	public async onpovaluehelp(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_project_list/", ''));
		let detail = await this.tm.getTN("travel_project_list").getData()[index];
		await this.tm.getTN("po_search").setProperty('project_id', detail.project_id);
		await this.tm.getTN("po_search").executeP();
		// if(this.role_id!="TD"){
		// let polist = await this.tm.getTN("po_list").getData();
		// polist.push({
		// 	'po_no': "PO not Maintained",
		// })}

	}
	public async onpovaluehelpselect() {
		await this.tm.getTN("po_search").setProperty('project_id', undefined);
		await this.tm.getTN("po_search").executeP();
	}
	public async exchange_rate_change(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_forex_list/", ''));
		await this.tm.getTN("travel_forex_list").setActive(index);
		const selected = this.tm.getTN("travel_forex_list").getData()[index];
		//const selected = await this.getActiveControlById(null, "s_forex_update").getSelectedIndices();
		let exchangedata = await this.transaction.getExecutedQuery('q_exchange_rate', { loadAll: true, 'project_currency': selected.currency_code, 'project_created_date': selected.s_created_on, partialSelected: ['currency_rate'] });
		if (exchangedata && exchangedata.length == 1)
			selected.exchange_rate = exchangedata[0].currency_rate;
		else
			selected.exchange_rate = 0;
	}
	public async onTransactionChange() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let transaction_list = detail.r_travel_transaction;
		let ticket_list = detail.r_travel_ticket_book;
		let hotel_list = detail.r_travel_hotel_book;
		const currencyTotals: { [key: string]: number } = {};
		for (let i = 0; i < transaction_list.length; i++) {
			const { currency_code, transaction_amount } = transaction_list[i];
			const amount = parseFloat(transaction_amount);
		
			currencyTotals[currency_code] = (currencyTotals[currency_code] || 0) + amount;
		}
		for (let i = 0; i < ticket_list.length; i++) {
			const { currency_code, booking_amount } = ticket_list[i];
			const amount = parseFloat(booking_amount);
		
			currencyTotals[currency_code] = (currencyTotals[currency_code] || 0) + amount;
		}
		for (let i = 0; i < hotel_list.length; i++) {
			const { currency_code, booking_amount } = hotel_list[i];
			const amount = parseFloat(booking_amount);
		
			currencyTotals[currency_code] = (currencyTotals[currency_code] || 0) + amount;
		}
		const totalsTransaction = Object.entries(currencyTotals)
			.map(([currency, amount]) => `${currency}: ${amount.toFixed(2)}`)
			.join(', ');
		detail.totaltransaction = totalsTransaction
		const Totals = await this.StringtoObject(detail.totalamount);
		const remainingPerDiem: { [key: string]: number } = {};
		for (let currency in { ...Totals, ...currencyTotals }) {
			const Amount = Totals[currency] || 0;
			const transactionAmount = currencyTotals[currency] || 0;
			remainingPerDiem[currency] = Amount - transactionAmount;
		}
		const totalsString = Object.entries(remainingPerDiem)
			.map(([currency, amount]) => `${currency}: ${amount.toFixed(2)}`)
			.join(', ');
		detail.remainingbalance = totalsString;
	}
	public async StringtoObject(stringAmount: string) {
		const currencyTotals: { [key: string]: number } = {};
		const currencyPairs = stringAmount.split(', ');
		for (let pair of currencyPairs) {
			const [currency, amount] = pair.split(': ');
			currencyTotals[currency] = parseFloat(amount);
		}
		return currencyTotals;
	}
	public async ExpenseAutoPerDiem() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let data = await this.tm.getTN("travel_journey_list").getData()
		let vac = await this.tm.getTN("vacation_list").getData()
		let proj = await this.tm.getTN("travel_project_list").getData()
		let role_store = this.role_id
		if (this.login_id.toUpperCase() != detail.employee_id_for.toUpperCase()) {
			let emp_designation = await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: detail.employee_id_for, fdate: new Date().getTime(), tdate: new Date().getTime() });
			if (emp_designation.length > 0) {
				let emp_designation_name = await this.transaction.getExecutedQuery('d_o2c_designation_master', { designation_id: emp_designation[0].designation, loadAll: true });
				role_store = emp_designation_name[0].name.toUpperCase();
			}
		}
		let userorg = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
		let exchangedata = await this.transaction.getExecutedQuery('q_exchange_rate', { loadAll: true, 'project_created_date': new Date(), partialSelected: ['currency_rate'] });
		if (detail.trip_type == "Domestic" || detail.trip_type == "International") {
			let start_location = data[0].from_location;
			let per_diem = 0;
			for (let i = 0; i < data.length; i++) {
				let differenceInDays = 0
				let vacationInDays = 0;
				if (i < data.length - 1 && start_location != data[i].to_location) {
					const differenceInTime = data[i + 1].departure.getTime() - data[i].departure.getTime();
					differenceInDays = differenceInTime / (1000 * 3600 * 24);
				}
				else if (start_location == data[i].to_location && i < data.length - 1) {
					differenceInDays = 0
				}
				else if (start_location == data[i].to_location && i == data.length - 1) {
					differenceInDays = 1
				}
				else if (i == data.length - 1 && start_location != data[i].to_location) {
					const differenceInTime = detail.travel_end_date.getTime() - data[i].departure.getTime();
					differenceInDays = 1 + differenceInTime / (1000 * 3600 * 24);
				}
				for (let j = 0; j < vac.length; j++) {
					if (vac[j].start_date && vac[j].end_date != null) {
						if (data[i + 1]) {
							if (data[i].departure.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() < data[i + 1].departure.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - vac[j].start_date.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() > vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() < data[i + 1].departure.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() <= vac[j].start_date.getTime() && data[i + 1].departure.getTime() > vac[j].start_date.getTime() && vac[j].end_date.getTime() >= data[i + 1].departure.getTime()) {
								const differenceInTime = data[i + 1].departure.getTime() - vac[j].start_date.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24);
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() <= vac[j].end_date.getTime() && vac[j].end_date.getTime() >= data[i + 1].departure.getTime()) {
								const differenceInTime = data[i + 1].departure.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24);
							}
							else if (data[i].departure.getTime() == vac[j].end_date.getTime()) {
								vacationInDays = vacationInDays + 1
							}
						}
						else {
							if (data[i].departure.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() < detail.travel_end_date.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - vac[j].start_date.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() < detail.travel_end_date.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() <= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() == detail.travel_end_date.getTime()) {
								const differenceInTime = detail.travel_end_date.getTime() - vac[j].start_date.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() >= detail.travel_end_date.getTime()) {
								const differenceInTime = detail.travel_end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() == vac[j].end_date.getTime()) {
								vacationInDays = vacationInDays + 1
							}
						}
					}
				}
				differenceInDays = differenceInDays - vacationInDays;
				vacationInDays = 0;
				if (start_location == data[i].to_location) {
					per_diem = data[i].per_diem_amount * differenceInDays;
				}
				else {
					per_diem = data[i].per_diem_amount * differenceInDays;
				}
				let end_date;
				if (data[i + 1]) {
					end_date = data[i + 1].departure
				}
				else {
					if (data[i].departure.getTime() <= detail.travel_end_date.getTime()) {
						end_date = detail.travel_end_date
					}
				}
				if (data[i].to_location != start_location) {
					const description = "Expense for Travel " + detail.request_id + " for " + data[i].to_location + " from " + this.formatDate(data[i].departure) + " to " + this.formatDate(end_date)
					const filteredData = exchangedata.filter(item => item.currency_code === data[i].currency_code);
					const exchange_rate = filteredData[0].currency_rate
					const re_imburse = exchange_rate * per_diem
					const amount = data[i].currency_code + ":" + per_diem
					let expense = await this.tm.getTN("travel_expense_detail").createEntityP({ descript: description, created_by: detail.employee_id_for, employee_for: detail.employee_id_for, expense_status: "Saved as Draft", travel_request_id: detail.request_id, total_amount: amount, journey_id: data[i].journey_id,employee_role_type:detail.employee_role_type }, "Creation Successful", "Creation Failed", null, "First", true, true, false)
					await expense.r_expense_receipt.newEntityP(0, { receipt_type: "per_diem_d", receipt_date: new Date(), receipt_amount: Math.floor(per_diem), expense_amount: Math.floor(per_diem), currency_code: data[i].currency_code, exchange_rate: exchange_rate, reimbursement_amount: re_imburse, journey_id: data[i].journey_id})
					await expense.r_workflow_log.newEntityP(0, { role: role_store, approver: this.UserInfo[0].employee_id, s_status: "In-Progress", profit_center: userorg[0].profit_centre });
					for (let j = 0; j < proj.length; j++)
						await expense.r_expense_project.newEntityP(0, { project_id: proj[j].project_id, project_name: proj[j].project_name, split_percent: proj[j].split_percent, bill_to_customer: proj[j].bill_to_customer,po_no:proj[j].po_no,so:proj[j].so })
				}
			}
		}
		else if (detail.trip_type == "Local") {
			let vacationInDays = 0
			for (let j = 0; j < vac.length; j++) {
				if (vac[j].start_date && vac[j].end_date != null) {
					if (detail.travel_start_date.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() <= detail.travel_end_date.getTime()) {
						const differenceInTime = vac[j].end_date.getTime() - vac[j].start_date.getTime();
						vacationInDays = differenceInTime / (1000 * 3600 * 24) + 1;
					}
				}
			}
			let differenceInTime = detail.travel_end_date.getTime() - detail.travel_start_date.getTime();
			let differenceInDays = (differenceInTime / (1000 * 3600 * 24) + 1) - vacationInDays;
			let projectlist=  await this.tm.getTN("travel_project_list").getData();
			const projectIds = projectlist.map(project => project.project_id);
			let pd_list = await this.transaction.getExecutedQuery('q_so_reimb_expense', { project_id: projectIds,loadAll: true});
			let so_currency=await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so_guid: pd_list[0].so_guid, loadAll: true });
			const currencyMap = so_currency.map(item => [item.so_guid, item.currency]);
				const pdList = pd_list.map(item => {
  				const perdiem = item.applicable_reimb && item.applicable_reimb > 0 ? item.applicable_reimb : item.standard_reimb;
  				const currency = currencyMap[item.so_guid] || "N/A"; // Fetch currency based on so_guid
  				return [perdiem, currency, item.travel_type, item.city]; // Properly store the currency
			});
			//let pd_list = await this.transaction.getExecutedQuery('d_o2c_pd_master', { business_area: business_area, travel_type: "Local", loadAll: true });
			const item = { currency_code: pdList[0].currency, per_diem_amount: pdList[0].perdiem }
			const { currency_code, per_diem_amount } = item;
			let per_diem = per_diem_amount * differenceInDays;
			let end_date = detail.travel_end_date;
			const description = "Expense for Travel " + detail.request_id + " for Local from " + this.formatDate(detail.travel_start_date) + " to " + this.formatDate(end_date)
			const filteredData = exchangedata.filter(item => item.currency_code === "INR");
			const exchange_rate = filteredData[0].currency_rate
			const re_imburse = exchange_rate * per_diem
			const amount = "INR: " + per_diem
			let expense = await this.tm.getTN("travel_expense_detail").createEntityP({ descript: description, created_by: detail.employee_id_for, employee_for: detail.employee_id_for, expense_status: "Saved as Draft", travel_request_id: detail.request_id, total_amount: amount, journey_id: detail.request_id,employee_role_type:detail.employee_role_type }, "Creation Successful", "Creation Failed", null, "First", true, true, false)
			await expense.r_expense_receipt.newEntityP(0, { receipt_type: "per_diem_d", receipt_date: new Date(), receipt_amount: per_diem, expense_amount: per_diem, currency_code: "INR", exchange_rate: exchange_rate, reimbursement_amount: re_imburse, journey_id: detail.request_id })
			await expense.r_workflow_log.newEntityP(0, { role: this.role_id, approver: this.UserInfo[0].employee_id, s_status: "In-Progress", profit_center: userorg[0].profit_centre });
			for (let j = 0; j < proj.length; j++)
				await expense.r_expense_project.newEntityP(0, { project_id: proj[j].project_id, project_name: proj[j].project_name, split_percent: proj[j].split_percent, bill_to_customer: proj[j].bill_to_customer,po_no:proj[j].po_no })
		}
		let expense = await detail.r_travel_expense.fetch()
		await this.tm.getTN("relation_screen_length").setProperty('expense', expense.length);
		//await this.ontransaction();
	}
	// public async ontransaction(){
	// 	let index = await this.tm.getTN("travel_list").getActiveIndex();
	// 	let detail = await this.tm.getTN("travel_list").getData()[index];
	// 	if(detail.r_travel_ticket_book.length>0){

	// 	}
	// 	if(detail.r_travel_hotel_book.length>0){
			
	// 	}
	// }
	public async onsoenter(oEvent){
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_project_list/", ''));
		let project = await this.tm.getTN("travel_project_list").getData()[index];
		let so_list = await this.transaction.getExecutedQuery('d_o2c_so_hdr', {so: project.so});
		let soGuid = so_list[0].so_guid;
        await this.navTo(({TS:true,H:true,S: 'p_so', AD: soGuid }));
	}
	public async onprojectenter(oEvent){
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_project_list/", ''));
		let project = await this.tm.getTN("travel_project_list").getData()[index];
		let projectData = await this.transaction.getExecutedQuery('d_o2c_project_header', {project_id: project.project_id});
        await this.navTo(({ TS: true, H: true, S: 'p_project', AD: projectData[0].project_guid }));
	}
	public formatDate(date: Date): string {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = String(date.getFullYear()).slice(-2);

		return `${day}/${month}/${year}`;
	}
	public async onTicketBookingChange() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		if (detail.ticket_booking_by == "Client")
			detail.ticket_booking_by = "Company";
		else {
			if (detail.r_travel_ticket_book.length > 0) {
				sap.m.MessageBox.error("Please Remove Ticket Details before Changing to Clients", { title: "Error", });
			}
			else
				detail.ticket_booking_by = "Client";
		}
		await this.tm.getTN("ticket_booked_by").setProperty('name', detail.ticket_booking_by);
	}
	public async onHotelBookingChange() {
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		if (detail.hotel_booking_by == "Client")
			detail.hotel_booking_by = "Company";
		else {
			if (detail.r_travel_hotel_book.length > 0) {
				sap.m.MessageBox.error("Please Remove Hotel Details before Changing to Clients", { title: "Error", });
			}
			else
				detail.hotel_booking_by = "Client";
		}
		await this.tm.getTN("hotel_booked_by").setProperty('name', detail.hotel_booking_by);
	}
	public async onTravelTypeChange() {
		const index = await this.tm.getTN("travel_list").getActiveIndex();
		const detail = await this.tm.getTN("travel_list").getData()[index];
		if (detail.trip_type === "International") {
			const doc_detail = await this.transaction.getExecutedQuery('d_o2c_employee_doc', {
				employee_id: this.UserInfo[0].employee_id,
				doc_type: "DC03",
				loadAll: true
			});
			let passportList = await this.tm.getTN("travel_passport_list").getData();
			if (doc_detail?.length > 0 && passportList.length === 0) {
				await this.tm.getTN("travel_passport_list").createEntityP({
					full_name: doc_detail[0].name_on_doc,
					passport_no: doc_detail[0].document_number,
					issue_date: doc_detail[0].issue_date,
					expiry_date: doc_detail[0].expiry_date,
					dob: this.UserInfo[0].date_of_birth,
					place_of_issue: doc_detail[0].place_of_issue,
					contact_no: this.UserInfo[0].phone_number
				}, "Passport Details Added", "Failed", null, "First", true, true, false);
			} else if (doc_detail?.length > 0 && passportList.length === 1) {
				passportList[0].full_name = doc_detail[0].name_on_doc;
				passportList[0].passport_no = doc_detail[0].document_number;
				passportList[0].issue_date = doc_detail[0].issue_date;
				passportList[0].expiry_date = doc_detail[0].expiry_date;
				passportList[0].dob = this.UserInfo[0].date_of_birth;
				passportList[0].place_of_issue = doc_detail[0].place_of_issue;
				passportList[0].contact_no = this.UserInfo[0].phone_number;
			} else {
				detail.trip_type = null;
				detail.total_per_diem_cal = null
				detail.totalamount = null;
				detail.totaladvance = null;
				sap.m.MessageBox.error("Your passport information is currently missing. Please contact HR to provide the necessary details to ensure eligibility for international travel.", { title: "Error" });
				return;
			}
		}
	
		const userorg = await this.transaction.getExecutedQuery('d_o2c_employee_org', {
			employee_id: detail.employee_id_for,
			is_primary: true,
			loadAll: true
		});
		const business_area = userorg[0].business_area;	
		await this.tm.getTN('pd_travel_search').setProperty('business_area', business_area);
		if (detail.trip_type == "International")
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', ["International", "Domestic", "Local"]);
		else if (detail.trip_type == "Domestic")
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', ["Local", "Domestic"]);
		else
			await this.tm.getTN("pd_travel_search").setProperty('travel_type', detail.trip_type);
		await this.tm.getTN('pd_travel_search').executeP();
		await this.total_perdiem_calculation();
	}
	public async ticketcancellation(){
		let notif_cc=new Set()
		let detail=await this.tm.getTN("travel_detail").getData()
		const index = await this.getActiveControlById(null,'s_ticket_list').getSelectedIndices();
		for(let i=0;i<index.length;i++){
			let ticket = await this.tm.getTN("travel_ticket_list").getData()[index[i]];
			ticket.s_status="Pending";
		}
		// await this.tm.commitP("Ticket Cancellation Initiated", "Save Failed", true, true);
		await this.retrySave("Ticket Cancellation Initiated", "Save Failed");
		let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
		for (let i = 0; i < travel_desk_list.length; i++) {
			notif_cc.add(travel_desk_list[i].employee_id);
		}
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "TicketCancellationInitiated");
		await this.tm.getTN('notification_search').executeP();
	}
	public async ticketcancellationapproval(index){
		let detail=await this.tm.getTN("travel_detail").getData()
		await this.tm.getTN("travel_ticket_list").getData()[index].deleteP();
		// await this.tm.commitP("Ticket Cancelled", "Save Failed", true, true);
		await this.retrySave("Ticket Cancelled", "Save Failed");
		await this.total_perdiem_calculation();
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.LowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', this.login_id.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('type', "TicketCancellationApprove");
		await this.tm.getTN('notification_search').executeP();
	}
	public async ticketcancellationrejection(index){
		let detail=await this.tm.getTN("travel_detail").getData()
		let transaction = this.tm.getTN("travel_ticket_list").getData()[index];
		transaction.s_status=null;
		// await this.tm.commitP("Ticket Cancellation Rejected", "Save Failed", true, true);
		await this.retrySave("Ticket Cancellation Rejected", "Save Failed");
		await this.total_perdiem_calculation();
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', this.login_id.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('type', "TicketCancellationReject");
		await this.tm.getTN('notification_search').executeP();
	}
	public async hotelcancellation(){
		let notif_cc = new Set();
		let detail=await this.tm.getTN("travel_detail").getData()
		const index = await this.getActiveControlById(null,'s_hotel_list').getSelectedIndices();
		for(let i=0;i<index.length;i++){
			let hotel = await this.tm.getTN("travel_hotel_list").getData()[index[i]];
			hotel.s_status="Pending";
		}
		let travel_desk_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD", page_name: "Travel Page", loadAll: true });
		for (let i = 0; i < travel_desk_list.length; i++) {
			notif_cc.add(travel_desk_list[i].employee_id);
		}
		const notif_cc_array = Array.from(notif_cc);
		for (let i = 0; i < notif_cc_array.length; i++) {
			notif_cc_array[i] = notif_cc_array[i].toLowerCase();
		}
		// await this.tm.commitP("Hotel Cancellation Initiated", "Save Failed", true, true);
		await this.retrySave("Hotel Cancellation Initiated", "Save Failed");
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', notif_cc_array);
		await this.tm.getTN('notification_search').setProperty('type', "HotelCancellationInitiated");
		await this.tm.getTN('notification_search').executeP();
	}
	public async hotelcancellationapproval(index){
		let detail=await this.tm.getTN("travel_detail").getData()
		await this.tm.getTN("travel_hotel_list").getData()[index].deleteP();
		// await this.tm.commitP("Hotel Cancelled", "Save Failed", true, true);
		await this.retrySave("Hotel Cancelled", "Save Failed");
		await this.total_perdiem_calculation();
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', this.login_id.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('type', "HotelCancellationApprove");
		await this.tm.getTN('notification_search').executeP();
	}
	public async hotelcancellationrejection(index){
		let detail=await this.tm.getTN("travel_detail").getData()
		let transaction = this.tm.getTN("travel_hotel_list").getData()[index];
		transaction.s_status=null;
		// await this.tm.commitP("Hotel Cancellation Rejected", "Save Failed", true, true);
		await this.retrySave("Hotel Cancellation Rejected", "Save Failed");
		await this.tm.getTN("notification_search").setProperty('travel', detail.request_id);
		await this.tm.getTN('notification_search').setProperty('notif_to', detail.employee_id_for.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('approver', null);
		await this.tm.getTN('notification_search').setProperty('notif_cc', this.login_id.toLowerCase());
		await this.tm.getTN('notification_search').setProperty('type', "HotelCancellationReject");
		await this.tm.getTN('notification_search').executeP();
	}
	public async onchangeProjectID(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_project_list/", ''));
		let project = await this.tm.getTN("travel_project_list").getData()[index];
		let travelindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[travelindex];
		//let so = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so: project.project_id, loadAll: true });
		let selected_project = await this.transaction.getExecutedQuery('q_travel_project_vh',{project_id:project.project_id,employee:detail.employee_id_for,loadAll:true});
		let so = await selected_project[0].r_project_so.fetch();
		let onsite_check = so[0].onsite_required
		if(onsite_check==true){
			let order_type = so[0].type
			if(order_type =="NBS"||order_type =="PSL"||order_type =="ISP"){
				detail.employee_role_type='SALES'
			}
			else{
				detail.employee_role_type='DELIVERY'
			}
			project.bill_to_customer = so[0].bill_to_customer;
			project.project_name = so[0].project_name;
			project.per_diem = so[0].per_diem_rate;
			project.so=so[0].so;
			if(detail.trip_type=="Local"){
				await this.total_perdiem_calculation();
			}
		}
		else{
			project.project_id = undefined;
			sap.m.MessageBox.error(
				"Please set On-site Rule true and provide the required Fields in Sales Order: "  +so[0].so,
				{ title: "On-Site Rule not Maintained in SO" }
			  );
		}
	}
	public async onemployee_idchange() {
		let role_id;
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let employee = await this.transaction.getExecutedQuery('d_o2c_employee', { employee_id: detail.employee_id_for, loadAll: true });
		let doc_detail = await this.transaction.getExecutedQuery('d_o2c_employee_doc', { employee_id: detail.employee_id_for, doc_type: "DC03", loadAll: true });
		let org_detail = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
		detail.dob = employee[0].date_of_birth;
		detail.employee_team = org_detail[0].profit_centre;
		await this.tm.getTN("travel_project_search").setProperty('employee', employee[0].employee_id);
		await this.tm.getTN("travel_project_search").executeP();
		let emp_designation = await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: detail.employee_for, fdate: new Date().getTime(), tdate: new Date().getTime() });
		let emp_designation_name=await this.transaction.getExecutedQuery('d_o2c_designation_master', { designation_id: emp_designation[0].designation, loadAll: true });
		if (emp_designation_name) {
		role_id = emp_designation_name[0].name;
		}
		let role_list = await this.transaction.getExecutedQuery('d_second_role_assyn', { employee_id: this.login_id, page_name: "Expense Page", loadAll: true });
		if (role_list.length) {
			role_id = role_list[0].assyned_role;
		}
		if(role_id=="SALES" || role_id=="SM"){
			detail.employee_role_type="SALES"
		}
		else{
			detail.employee_role_type="DELIVERY"
		}
		let passport = detail.r_travel_passport[0];
		passport.full_name = doc_detail[0].name_on_doc;
		passport.passport_no = doc_detail[0].document_number;
		passport.issue_date = doc_detail[0].issue_date;
		passport.expiry_date = doc_detail[0].expiry_date;
		passport.dob = employee[0].date_of_birth;
		passport.place_of_issue = doc_detail[0].place_of_issue;
		passport.contact_no = employee[0].phone_number;
	}
	public async onToLocationChange(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_journey_list/", ''));
		let journey = this.tm.getTN("travel_journey_list").getData()[index];
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		journey_list.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
		let start = journey_list[0].from_location;
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		if(journey_list[journey_list.length - 1].to_location==journey_list[0].from_location && journey_list[journey_list.length - 1].departure){
			detail.travel_end_date=journey_list[journey_list.length - 1].departure;
		}
		for (let i = 0; i < journey_list.length - 1; i++) {
			let next_journey = journey_list[i + 1];
			next_journey.from_location = journey_list[i].to_location;
		}
		// let org_list = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
		// let business_area = org_list[0].business_area;
		let projectlist=  await this.tm.getTN("travel_project_list").getData();
		const projectIds = projectlist.map(project => project.project_id);
		let pd_list = await this.transaction.getExecutedQuery('q_so_reimb_expense', { project_id: projectIds,city: journey.to_location, loadAll: true});
		let perdiem=0;
		if (pd_list.length && pd_list.length > 0) {
			//let so_currency=await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so_guid: pd_list[0].so_guid, loadAll: true });
			if(pd_list[0].applicable_reimb &&pd_list[0].applicable_reimb>0){
				perdiem=pd_list[0].applicable_reimb
			}
			else{
				perdiem=pd_list[0].standard_reimb
			}
			if (journey.to_location != start) {
				journey.per_diem_amount = perdiem;
				journey.currency_code = pd_list[0].currency_code;
				journey.journey_type = pd_list[0].travel_type;
			}
			else {
				journey.per_diem_amount = 0;
				journey.currency_code = pd_list[0].currency_code;
				journey.journey_type = pd_list[0].travel_type;
			}
			await this.total_perdiem_calculation();
		}
		else{
			journey.per_diem_amount = 0;
				journey.currency_code = "INR";
				journey.journey_type = detail.trip_type;
		}
		await this.total_perdiem_calculation();
	}
	public async onStartDateChange(){
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		if(new Date().getTime()>detail.travel_start_date?.getTime())
			await this.tm.getTN("no_enter_check").setProperty('check_day',true);
			else
			await this.tm.getTN("no_enter_check").setProperty('check_day',false);
		if(journey_list && journey_list.length>0){
		journey_list.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
		journey_list[0].departure=detail.travel_start_date;}
		await this.total_perdiem_calculation();
	}
	public async onDepartureChange() {
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		journey_list.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
		let start = journey_list[0].from_location;
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		detail.travel_start_date = journey_list[0].departure;
		if (!detail.travel_end_date||journey_list[journey_list.length - 1].departure.getTime() != detail.travel_end_date.getTime()) {
			if(journey_list[journey_list.length - 1].to_location==journey_list[0].from_location)
			detail.travel_end_date = journey_list[journey_list.length - 1].departure
		}
		let org_list = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
		let business_area = org_list[0].business_area;
		let travel_type = detail.trip_type;
		let projectlist=  await this.tm.getTN("travel_project_list").getData();
		const projectIds = projectlist.map(project => project.project_id);
		let pd_list = await this.transaction.getExecutedQuery('q_so_reimb_expense', { project_id: projectIds,loadAll: true});
		//let pd_list = await this.transaction.getExecutedQuery('d_o2c_pd_master', { business_area: business_area, loadAll: true });
		let so_currency=await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so_guid: pd_list[0].so_guid, loadAll: true });
			const currencyMap = so_currency.map(item => [item.so_guid, item.currency]);
			const pdList = pd_list.map(item => {
  			const perdiem = item.applicable_reimb && item.applicable_reimb > 0 ? item.applicable_reimb : item.standard_reimb;
  			const currency = currencyMap[item.so_guid] || "N/A"; // Fetch currency based on so_guid
  			return [perdiem, currency, item.travel_type, item.city]; // Properly store the currency
		});
		for (let i = 0; i < journey_list.length; i++) {
			for (let j = 0; j < pdList.length; j++) {
				if (pdList.length && pdList.length > 0) {
					if (journey_list[i].to_location != start && pdList[j].city == journey_list[i].to_location) {
						journey_list[i].per_diem_amount = pdList[j].perdiem;
						journey_list[i].currency_code = pdList[j].currency;
					}
					else if (journey_list[i].to_location == start && pd_list[j].city == journey_list[i].to_location) {
						journey_list[i].per_diem_amount = 0;
						journey_list[i].currency_code = pdList[j].currency;
					}
				}
			}
		}
		await this.total_perdiem_calculation();
		// per diem calculation
	}
	public async onFromLocationChange() {
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		journey_list.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
		let start = journey_list[0].from_location;
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		let projectlist=  await this.tm.getTN("travel_project_list").getData();
		const projectIds = projectlist.map(project => project.project_id);
		let pd_list = await this.transaction.getExecutedQuery('q_so_reimb_expense', { project_id: projectIds,loadAll: true});
		//let pd_list = await this.transaction.getExecutedQuery('d_o2c_pd_master', { business_area: business_area, loadAll: true });
		let so_currency=await this.transaction.getExecutedQuery('d_o2c_so_hdr', { so_guid: pd_list[0].so_guid, loadAll: true });
			const currencyMap = so_currency.map(item => [item.so_guid, item.currency]);
			const pdList = pd_list.map(item => {
  			const perdiem = item.applicable_reimb && item.applicable_reimb > 0 ? item.applicable_reimb : item.standard_reimb;
  			const currency = currencyMap[item.so_guid] || "N/A"; // Fetch currency based on so_guid
  			return [perdiem, currency, item.travel_type, item.city]; // Properly store the currency
		});
		//let pd_list = await this.transaction.getExecutedQuery('d_o2c_pd_master', { business_area: business_area, loadAll: true });
		for (let i = 0; i < journey_list.length; i++) {
			for (let j = 0; j < pd_list.length; j++) {
				if (pd_list.length && pdList.length > 0) {
					if (journey_list[i].to_location != start &&  pdList[j].city == journey_list[i].to_location) {
						journey_list[i].per_diem_amount = pdList[j].perdiem;
						journey_list[i].currency_code = pdList[j].currency;
						journey_list[i].journey_type = pdList[j].travel_type;
						break;
					}
					else if (journey_list[i].to_location == start && pdList[j].city == journey_list[i].to_location) {
						journey_list[i].per_diem_amount = 0;
						journey_list[i].currency_code = pdList[j].currency;
						journey_list[i].journey_type = pdList[j].travel_type;
						break;
					}
				}
			}
		}
		await this.total_perdiem_calculation();
	}
	public async total_perdiem_calculation() {
		let exchangedata;
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		await this.tm.getTN("completion_date").setProperty('end_date', detail.travel_end_date?.getTime());
					await this.tm.getTN("vacation_search").setProperty('starting_date', detail.travel_start_date);
					await this.tm.getTN("vacation_search").setProperty('ending_date', detail.travel_end_date);
					await this.tm.getTN("vacation_search").setProperty('employee_id', detail.employee_id_for);
					await this.tm.getTN("vacation_search").executeP();
		await this.tm.getTN("completion_date").setProperty('end_date', detail.travel_end_date?.getTime());
		if (detail.s_status == "Approved by Travel Desk") {
			exchangedata = await this.transaction.getExecutedQuery('q_exchange_rate', { loadAll: true, 'project_created_date': new Date(), partialSelected: ['currency_rate'] });
		}
		if (detail.trip_type == "Domestic" || detail.trip_type == "International") {
			let data = await this.tm.getTN("travel_journey_list").getData()
			data.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
			let vac = this.tm.getTN("vacation_list").getData();
			let adv = this.tm.getTN("travel_advance_list").getData();
			let ticket = this.tm.getTN("travel_ticket_list").getData();
			let hotel = this.tm.getTN("travel_hotel_list").getData();
			let start_location = data[0]?.from_location;
			let per_diem = 0;
			let currencyTotals: { [key: string]: number } = {};
			const advanceTotals: { [key: string]: number } = {};
			const totalAmounts: { [key: string]: number } = {};
			const ExpenseTotals: { [key: string]: number } = {};
			const TicketTotals: { [key: string]: number } = {};
			const HotelTotals: { [key: string]: number } = {};
			for (let i = 0; i < data.length; i++) {
				let differenceInDays = 0
				let vacationInDays = 0;
				if (i < data.length - 1 && start_location != data[i].to_location) {
					const differenceInTime = data[i + 1].departure.getTime() - data[i].departure.getTime();
					differenceInDays = differenceInTime / (1000 * 3600 * 24);

				}
				else if (start_location == data[i].to_location && i < data.length - 1) {
					differenceInDays = 0
				}
				else if (start_location == data[i].to_location && i == data.length - 1) {
					differenceInDays = 1
				}
				else if (i == data.length - 1 && start_location != data[i].to_location) {
					const differenceInTime = detail.travel_end_date.getTime() - data[i].departure.getTime();
					differenceInDays = 1 + differenceInTime / (1000 * 3600 * 24);
				}
				for (let j = 0; j < vac.length; j++) {
					if (vac[j].start_date && vac[j].end_date != null) {
						if (data[i + 1]) {
							if (data[i].departure.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() < data[i + 1].departure.getTime()) {
								vacationInDays = vac[j].no_of_days;
							}
							else if (data[i].departure.getTime() > vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() < data[i + 1].departure.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() <= vac[j].start_date.getTime() && data[i + 1].departure.getTime() > vac[j].start_date.getTime() && vac[j].end_date.getTime() >= data[i + 1].departure.getTime()) {
								const differenceInTime = data[i + 1].departure.getTime() - vac[j].start_date.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24);
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() <= vac[j].end_date.getTime() && vac[j].end_date.getTime() >= data[i + 1].departure.getTime()) {
								const differenceInTime = data[i + 1].departure.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24);
							}
							else if (data[i].departure.getTime() == vac[j].end_date.getTime()) {
								vacationInDays = vacationInDays + 1
							}
						}
						else {
							if (data[i].departure.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() < detail.travel_end_date.getTime()) {
								vacationInDays = vac[j].no_of_days;
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() < detail.travel_end_date.getTime()) {
								const differenceInTime = vac[j].end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() <= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() == detail.travel_end_date.getTime()) {
								const differenceInTime = detail.travel_end_date.getTime() - vac[j].start_date.getTime();
								vacationInDays = differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() >= vac[j].start_date.getTime() && data[i].departure.getTime() < vac[j].end_date.getTime() && vac[j].end_date.getTime() >= detail.travel_end_date.getTime()) {
								const differenceInTime = detail.travel_end_date.getTime() - data[i].departure.getTime();
								vacationInDays = vacationInDays + differenceInTime / (1000 * 3600 * 24) + 1;
							}
							else if (data[i].departure.getTime() == vac[j].end_date.getTime()) {
								vacationInDays = vacationInDays + 1
							}
						}
					}
				}
				if(data[i+1] && data[0].from_location==data[i+1].to_location)
					differenceInDays = differenceInDays - vacationInDays +1;
				else if(data[0].from_location==data[i].to_location)
					differenceInDays = differenceInDays - vacationInDays +1;
				else
					differenceInDays = differenceInDays - vacationInDays ;
				vacationInDays = 0;
				const item = data[i];
				let { currency_code, per_diem_amount } = item;
				if (start_location == data[i].to_location) {
					per_diem = data[i].per_diem_amount * differenceInDays;
					currency_code = data[i].currency_code;
				}
				else {
					per_diem = per_diem_amount * differenceInDays;
				}
				let end_date;
				if (data[i + 1]) {
					end_date = data[i + 1].departure
				}
				else {
					if (data[i].departure.getTime() <= detail.travel_end_date.getTime()) {
						end_date = detail.travel_end_date
					}
				}
				if(data[i].is_commute_customer==true){
					const filteredData = exchangedata.filter(item => item.currency_code === data[i - 1].currency_code);
					per_diem= per_diem - (200/filteredData[0].currency_rate)
				}
				else if(data[i].is_commute_customer==true){
					const filteredData = exchangedata.filter(item => item.currency_code === data[i - 1].currency_code);
					per_diem= per_diem - (200/filteredData[0].currency_rate)
				}
				else if(data[i].is_commute_customer==true){
					const filteredData = exchangedata.filter(item => item.currency_code === data[i - 1].currency_code);
					per_diem= per_diem - (200/filteredData[0].currency_rate)
				}
				if (currencyTotals[currency_code]) {
					currencyTotals[currency_code] += per_diem;
				} else {
					currencyTotals[currency_code] = per_diem;
				}
			}
			for (const item of adv) {
				const { currency_code, advance_amount } = item;
				if (currency_code && advance_amount != null) {
					if (currency_code in advanceTotals) {
						advanceTotals[currency_code] += parseFloat(advance_amount);
					} else {
						advanceTotals[currency_code] = parseFloat(advance_amount);
					}
				}
			}
			for (const item of ticket) {
				const { currency_code, booking_amount } = item;
				if (currency_code && booking_amount != null) {
					if (currency_code in TicketTotals) {
						TicketTotals[currency_code] += parseFloat(booking_amount);
					} else {
						TicketTotals[currency_code] = parseFloat(booking_amount);
					}
				}
			}
			for (const item of hotel) {
				const { currency_code, booking_amount } = item;
				if (currency_code && booking_amount != null) {
					if (currency_code in HotelTotals) {
						HotelTotals[currency_code] += parseFloat(booking_amount);
					} else {
						HotelTotals[currency_code] = parseFloat(booking_amount);
					}
				}
			}
			const resultString = Object.entries(currencyTotals)
				.map(([currency_code, per_diem_amount]) => `${currency_code}: ${per_diem_amount}`)
				.join(", ");
				detail.total_per_diem_cal = resultString;
			let expenses_list = await detail.r_travel_expense.fetch()
			let expenses_filteredlist = expenses_list.filter((item) => item.expense_status != "Rejected" && item.expense_status != "Cancelled")
			if (expenses_filteredlist.length !== undefined && expenses_filteredlist.length > 0) {
				let each_expense;
				for (let i = 0; i < expenses_filteredlist.length; i++) {
					each_expense = expenses_filteredlist[i].total_amount;
					const currencyTotals: { [key: string]: number } = {};
					const currencyPairs = each_expense.split(', ');
					for (let pair of currencyPairs) {
						const [currency, amount] = pair.split(': ');
						currencyTotals[currency] = parseFloat(amount);
					}
					let each_expense_object = currencyTotals
					for (const [currency_code, amount] of Object.entries(each_expense_object)) {
						if (ExpenseTotals[currency_code]) {
							ExpenseTotals[currency_code] += parseFloat(amount);
						} else {
							ExpenseTotals[currency_code] = parseFloat(amount);
						}
					}
				}
					currencyTotals= ExpenseTotals;
			}
			const totalsToAdd = [TicketTotals, HotelTotals];
for (const totalObject of totalsToAdd) {
    for (const [currency_code, value] of Object.entries(totalObject)) {
        // Check if value is an object and has a booking_amount property
        const amount = (value && typeof value === 'object' && 'booking_amount' in value)
            ? value.booking_amount
            : value;
        // Add to currencyTotals
        currencyTotals[currency_code] = 
            (currencyTotals[currency_code] || 0) + parseFloat(amount);
    }
}
			for (const currency in currencyTotals) {
				totalAmounts[currency] = currencyTotals[currency];
			}
			const totalAdvanceString = Object.entries(advanceTotals)
				.map(([currency, amount]) => `${currency}: ${amount}`)
				.join(", ");
			detail.totaladvance = totalAdvanceString;

			const totalAmountString = Object.entries(totalAmounts)
				.map(([currency, amount]) => `${currency}: ${amount}`)
				.join(", ");
			detail.totalamount = totalAmountString;
		}
		else if (detail.trip_type == "Local") {
			let vac = this.tm.getTN("vacation_list").getData();
			let adv = this.tm.getTN("travel_advance_list").getData();
			let ticket = this.tm.getTN("travel_ticket_list").getData();
			let hotel = this.tm.getTN("travel_hotel_list").getData();
			let currencyTotals: { [key: string]: number } = {};
			const advanceTotals: { [key: string]: number } = {};
			const ExpenseTotals: { [key: string]: number } = {};
			const totalAmounts: { [key: string]: number } = {};
			const TicketTotals: { [key: string]: number } = {};
			const HotelTotals: { [key: string]: number } = {};
			let vacationInDays = 0;
			for (let j = 0; j < vac.length; j++) {
				if (vac[j].start_date && vac[j].end_date != null) {
					if (detail.travel_start_date.getTime() <= vac[j].start_date.getTime() && vac[j].end_date.getTime() <= detail.travel_end_date.getTime()) {
						vacationInDays =vac[j].no_of_days;
					}
				}
			}
			let weekendCount = 0;
			let tempDate = new Date(detail.travel_start_date);

			while (tempDate <= detail.travel_end_date) {
			const day = tempDate.getDay(); // 0 = Sunday, 6 = Saturday
			if (day === 0 || day === 6) {
				weekendCount++;
			}
			tempDate.setDate(tempDate.getDate() + 1);
			}
			let differenceInTime = detail.travel_end_date.getTime() - detail.travel_start_date.getTime();
			let differenceInDays = (differenceInTime / (1000 * 3600 * 24) + 1) - vacationInDays - weekendCount;
			let org_list = await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: detail.employee_id_for, is_primary: true, loadAll: true });
			let business_area = org_list[0].business_area;
			let location_list = await this.transaction.getExecutedQuery('d_o2c_pd_master', { business_area: business_area,travel_type: 'Local',loadAll: true});
			let location=location_list[0].travelling_location;
			let currency = location_list[0].currency_code;
			let projectlist=  await this.tm.getTN("travel_project_list").getData();
			const projectIds = projectlist.map(project => project.project_id);
			if(projectIds.length>0){
			let pd_list = await this.transaction.getExecutedQuery('q_so_reimb_expense', { project_id: projectIds,city: location,loadAll: true});
			if(pd_list.length==0){
				detail.total_per_diem_cal =''
				detail.totalamount=''
			}
			const item = { currency_code: currency, per_diem_amount: pd_list[0].applicable_reimb && pd_list[0].applicable_reimb > 0 ? pd_list[0].applicable_reimb : pd_list[0].standard_reimb }
			const { currency_code, per_diem_amount } = item;
			let per_diem = per_diem_amount * differenceInDays;
			if (currencyTotals[currency_code]) {
				currencyTotals[currency_code] += per_diem;
			} else {
				currencyTotals[currency_code] = per_diem;
			}
			const resultString = Object.entries(currencyTotals)
				.map(([currency_code, per_diem_amount]) => `${currency_code}: ${per_diem_amount}`)
				.join(", ");
			console.log(resultString);
			detail.total_per_diem_cal = resultString;
			for (const item of adv) {
				const { currency_code, advance_amount } = item;
				if (currency_code && advance_amount != null) {
					if (currency_code in advanceTotals) {
						advanceTotals[currency_code] += parseFloat(advance_amount);
					} else {
						advanceTotals[currency_code] = parseFloat(advance_amount);
					}
				}
			}
			let expenses_list = await detail.r_travel_expense.fetch()
			let expenses_filteredlist = expenses_list.filter((item) => item.expense_status != "Rejected" && item.expense_status != "Cancelled")
			if (expenses_filteredlist.length !== undefined && expenses_filteredlist.length > 0) {
				let each_expense;
				for (let i = 0; i < expenses_filteredlist.length; i++) {
					each_expense = expenses_filteredlist[i].total_amount;
					const currencyTotals: { [key: string]: number } = {};
					const currencyPairs = each_expense.split(', ');
					for (let pair of currencyPairs) {
						const [currency, amount] = pair.split(': ');
						currencyTotals[currency] = parseFloat(amount);
					}
					let each_expense_object = currencyTotals
					for (const [currency_code, amount] of Object.entries(each_expense_object)) {
						if (ExpenseTotals[currency_code]) {
							ExpenseTotals[currency_code] += parseFloat(amount);
						} else {
							ExpenseTotals[currency_code] = parseFloat(amount);
						}
					}
				} 
					currencyTotals= ExpenseTotals;
			}
			const totalsToAdd = [TicketTotals, HotelTotals];

for (const totalObject of totalsToAdd) {
    for (const [currency_code, value] of Object.entries(totalObject)) {
        // Check if value is an object and has a booking_amount property
        const amount = (value && typeof value === 'object' && 'booking_amount' in value)
            ? value.booking_amount
            : value;
        // Add to currencyTotals
        currencyTotals[currency_code] = 
            (currencyTotals[currency_code] || 0) + parseFloat(amount);
    }}
			for (const currency in currencyTotals) {
				totalAmounts[currency] = currencyTotals[currency];
			}
			const totalAdvanceString = Object.entries(advanceTotals)
				.map(([currency, amount]) => `${currency}: ${amount}`)
				.join(", ");
			detail.totaladvance = totalAdvanceString;

			const totalAmountString = Object.entries(totalAmounts)
				.map(([currency, amount]) => `${currency}: ${amount}`)
				.join(", ");
			detail.totalamount = totalAmountString;
		}}
		await this.tm.getTN('travel_detail').refresh();
		await this.onTransactionChange()
	}
	public async onTicketChange() {
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		let is_ticket_required = false;
		for (let i = 0; i < journey_list.length; i++) {
			if (journey_list[i].ticket_required == true) {
				is_ticket_required = true;
				break;
			}
		}
		if (is_ticket_required == true) {
			detail.ticket_booking_by = "Company";
		}
		else if (is_ticket_required == false) {
			detail.ticket_booking_by = "Client";
		}
	}
	public async onHotelChange() {
		let dindex = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[dindex];
		let journey_list = this.tm.getTN("travel_journey_list").getData();
		let is_hotel_required = false;
		for (let i = 0; i < journey_list.length; i++) {
			if (journey_list[i].hotel_required == true) {
				is_hotel_required = true;
				break;
			}
		}
		if (is_hotel_required == true) {
			detail.hotel_booking_by = "Company";
		}
		else if (is_hotel_required == false) {
			detail.hotel_booking_by = "Client";
		}
	}
	public async onnavtolist() {
		//await this.tm.getTN("logged_employee").setData({});
		//await this.tm.getTN("logged_employee").setProperty('show_button', "false");
		//hello
	}
	//FILE MANAGEMENT
	public async transactionuploading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_transaction_list/", ''));
		let transaction = this.tm.getTN("travel_transaction_list").getData()[index];
		await transaction.transaction_attachment.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
		transaction.transaction_attach_name = transaction.transaction_attachment.name;
	}
	public async transactiondownloading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_transaction_list/", ''));
		let document = this.tm.getTN("travel_transaction_list").getData()[index];
		document.transaction_attachment.downloadAttachP();
	}
	public async ticketuploading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_ticket_list/", ''));
		let ticket = this.tm.getTN("travel_ticket_list").getData()[index];
		await ticket.ticket_attach.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
		ticket.ticket_filename = ticket.ticket_attach.name;
	}
	public async ticketdownloading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_ticket_list/", ''));
		let document = this.tm.getTN("travel_ticket_list").getData()[index];
		document.ticket_attach.downloadAttachP();
	}
	public async hoteluploading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_hotel_list/", ''));
		let hotel = this.tm.getTN("travel_hotel_list").getData()[index];
		await hotel.booking_attach.setAttachmentP(oEvent.mParameters.files[0], oEvent.mParameters.files[0].name);
		hotel.hotel_filename = hotel.booking_attach.name;
	}
	public async hoteldownloading(oEvent) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_hotel_list/", ''));
		let document = this.tm.getTN("travel_hotel_list").getData()[index];
		document.booking_attach.downloadAttachP();
	}
	//CONFIRMATION POP-UPS
	public async onCommentingofSubmitingTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		sap.m.MessageBox.confirm("Are You Sure You want to Submit this Travel Request", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.submitTravel();
					oBusyDailog.close();
				}
			}
		})
	}
	public async onCommentingofApproveTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let project_list = await this.tm.getTN("travel_project_list").getData();
		let so = await await this.transaction.getExecutedQuery('d_o2c_so_hdr', { loadAll: true,so:project_list[0].so });
			
		let minticketcount = 0;
		let minhotelcount = 0;
		let pocheck=0;
		for (let i = 0; i < detail.r_travel_journey.length; i++) {
			if (detail.r_travel_journey[i].ticket_required == true) {
				minticketcount = minticketcount + 1;
			}
			if (detail.r_travel_journey[i].hotel_required == true) {
				minhotelcount = minhotelcount + 1;
			}
		}
		for(let i = 0; i < detail.r_travel_project.length; i++){
			if(detail.r_travel_project[i].po_no==undefined||detail.r_travel_project[i].po_no==''||detail.r_travel_project[i].po_no=='PO not Maintained'){
				pocheck=pocheck+1;
			}
		}
		if (this.role_id == "TD" && detail.ticket_booking_by == "Company" && detail.r_travel_ticket_book.length < 1) {
			sap.m.MessageBox.error("Please Provide Ticket Details", { title: "Error", });
		}
		else if (this.role_id == "TD" && detail.hotel_booking_by == "Company" && detail.r_travel_hotel_book.length < 1) {
			sap.m.MessageBox.error("Please Provide Hotel Details", { title: "Error", });
		}
		// else if(this.role_id == "TD" && pocheck !=0 && so[0].type!="NBS" && so[0].type!="ISP" && so[0].type!="PSL"){
		// 	sap.m.MessageBox.error("Please Provide PO Numbers in Project Section", { title: "Error", });
		// }
		else {
			let date = new Date();
			oBusyDailog.open();
			await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			await this.openDialog("pa_approve_dialog");
			oBusyDailog.close();
		}
	}
	public async onCommentingofRejectTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_reject_dialog");
		oBusyDailog.close();
	}
	public async onCommentingofReturnBackTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_return_dialog");
		oBusyDailog.close();
	}
	public async onCommentingofClarificationTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let journey_list = await this.tm.getTN("travel_journey_list").getData();
		let project_list = await this.tm.getTN("travel_project_list").getData();
		let vacation_list = await this.tm.getTN("travel_vacation_list").getData();
		let journey_check = false;
		let vacation_check = false;
		let emp_designation = await this.transaction.getExecutedQuery('q_emp_current_designation', { loadAll: true, des_emp_id: detail.employee_id_for, fdate: new Date().getTime(), tdate: new Date().getTime() });
		for (let i = 0; i < journey_list.length; i++) {
			if (new Date(journey_list[i].departure)?.getTime() < new Date(detail.travel_start_datee)?.getTime() || new Date(journey_list[i].departure)?.getTime() > new Date(detail.travel_end_date)?.getTime()) {
				journey_check = true;
			}
		}
		if (journey_list.length == 0 && detail.trip_type != "Local") {
			sap.m.MessageBox.error("No Journey Entry Found", { title: "Error", });
		}
		else if (project_list.length == 0) {
			sap.m.MessageBox.error("No Project Details Found", { title: "Error", });
		}
		else if (journey_check == true) {
			sap.m.MessageBox.error("Please Add Journey Dates in-between Start Date and End Date", { title: "Error", });
		}
		else if (emp_designation.length == 0) {
			sap.m.MessageBox.error("Please Ask HR to add Designation", { title: "Error", });
		}
		else if (detail.description == undefined || detail.description == '') {
			sap.m.MessageBox.error("Provide Description", { title: "Error", });
		}
		else {
			let date = new Date();
			await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
			await this.openDialog("pa_clarify_dialog");
		}
		oBusyDailog.close();
	}
	public async onCommentingofCancellingTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		sap.m.MessageBox.confirm("Are You Sure You want to Discard this Travel", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.cancelTravel();
					oBusyDailog.close();
				}
			}
		})
	}
	public async onCommentingofTDCancelTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_cancel_td_dialog");
		oBusyDailog.close();
	}
	public async onCommentingofCloseTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_close_dialog");
		oBusyDailog.close();
	}
	public async onCommentingofReOpeningTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_reopen_dialog");
		oBusyDailog.close();
	}
	public async onCommentingofChangingTravelJourney() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let date = new Date();
		await this.tm.getTN("travel_workflow_list").createEntityP({ role: this.role_id, approver: this.UserInfo[0].employee_id, s_status: "In-Progress", profit_center: this.UserOrg[0].profit_centre }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.tm.getTN("travel_comment_list").createEntityP({ user_name: this.full_name, time_of_comment: date, user_id: this.UserInfo[0].employee_id }, "Creation Successful", "Creation Failed", null, "First", false, false, false);
		await this.openDialog("pa_journey_comment");
		oBusyDailog.close();
	}

	//CONFIRMING ACTIONS
	public async confirmApproveTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Approving", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_approve_dialog");
			await this.approveTravel();
		}
		oBusyDailog.close();
	}
	public async confirmRejectTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Rejecting", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_reject_dialog");
			await this.rejectTravel();
		}
		oBusyDailog.close();
	}
	public async confirmReturnBackTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Returning Back", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_return_dialog");
			await this.returnBackTravel();
		}
		oBusyDailog.close();
	}
	public async confirmClarificationTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Providing Clarification", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_clarify_dialog");
			await this.clarificationProvidedforTravel();
		}
		oBusyDailog.close();
	}
	public async confirmCancellingTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Cancelling", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_cancel_dialog");
			await this.cancelTravel();
		}
		oBusyDailog.close();
	}
	public async confirmTDCancelTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Cancelling", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_cancel_td_dialog");
			await this.cancelTravelbyTD();
		}
		oBusyDailog.close();
	}
	public async confirmCloseTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Closing", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_close_dialog");
			await this.closeTAF();
		}
		oBusyDailog.close();
	}
	public async confirmReOpenTravel() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Re Opening", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_reopen_dialog");
			await this.reopenTravel();
		}
		oBusyDailog.close();
	}
	public async confirmChangingTravelJourney() {
		let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
		let index = await this.tm.getTN("travel_list").getActiveIndex();
		let detail = await this.tm.getTN("travel_list").getData()[index];
		let comment = ""
		comment = detail.r_travel_comment[0].comment;
		let trimmedcomment: string = comment?.replace(/^\s+|\s+$/g, '');
		if (trimmedcomment == "" || comment == undefined) {
			sap.m.MessageBox.error("Please provide a Comment before Re Opening", { title: "Error", });
		}
		else {
			await this.setMode("DISPLAY");
			await this.closeDialog("pa_journey_comment");
			await this.submitTravel();
		}
		oBusyDailog.close();
	}
	//CANCELLING POP-UP ACTIONS
	public async cancelApproveTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_approve_dialog");
	}
	public async cancelRejectTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_reject_dialog");
	}
	public async cancelReturnBackTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_return_dialog");
	}
	public async cancelClarificationTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_clarify_dialog");
	}
	public async cancelCancellingTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_cancel_dialog");
	}
	public async canceltdCancellingTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_cancel_td_dialog");
	}
	public async cancelClosingTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_close_dialog");
	}
	public async cancelReOpeningTravel() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_reopen_dialog");
	}
	public async cancelChangingTravelJourney() {
		await this.transaction.rollback();
		this.setMode("DISPLAY");
		await this.closeDialog("pa_journey_comment");
	}
	public async onCommentingofTicketCancellation() {
		let oBusyDailog = new sap.m.BusyDialog();
		sap.m.MessageBox.confirm("Are You Sure You want to Cancel the selected Tickets", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.ticketcancellation();
					oBusyDailog.close();
				}
			}
		})
	}
	public async onApprovingofTicketCancellation(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_ticket_list/", ''));
		sap.m.MessageBox.confirm("Are You Sure You want to Approve the Ticket Cancellation", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.ticketcancellationapproval(index);
					oBusyDailog.close();
				}
			}
		})
	}
	public async onRejectingofTicketCancellation(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_ticket_list/", ''));
		sap.m.MessageBox.confirm("Are You Sure You want to Reject the Ticket Cancellation", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.ticketcancellationrejection(index);
					oBusyDailog.close();
				}
			}
		})
	}
	public async onCommentingofHotelCancellation() {
		let oBusyDailog = new sap.m.BusyDialog();
		sap.m.MessageBox.confirm("Are You Sure You want to Cancel the selected Hotels", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.hotelcancellation();
					oBusyDailog.close();
				}
			}
		})
	}
	public async onApprovingofHotelCancellation(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_hotel_list/", ''));
		sap.m.MessageBox.confirm("Are You Sure You want to Approve the Hotel Cancellation", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.hotelcancellationapproval(index);
					oBusyDailog.close();
				}
			}
		})
	}
	public async onRejectingofHotelCancellation(oEvent) {
		let oBusyDailog = new sap.m.BusyDialog();
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/travel_hotel_list/", ''));
		sap.m.MessageBox.confirm("Are You Sure You want to Reject the Hotel Cancellation", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: (oAction) => {
				if (oAction == "OK") {
					oBusyDailog.open();
					this.hotelcancellationrejection(index);
					oBusyDailog.close();
				}
			}
		})
	}

	public async retrySave(sSuccessMessage: string, sErrMessage: string) {
        // Retry logic for commit operation
        let retryCount = 0;
        const maxRetries = 5;
        let commitSuccess = false;

        while (retryCount < maxRetries && !commitSuccess) {
            try {
                await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
                commitSuccess = true;
            } catch (error) {
                retryCount++;
                console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

                if (retryCount >= maxRetries) {
                    sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
                    throw error;
                }
                // Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            }
        }
    }
}