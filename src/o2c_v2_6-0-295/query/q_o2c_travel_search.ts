import { q_o2c_travel_search as q_o2c_travel_search_gen } from "o2c_v2/query_gen/q_o2c_travel_search"
export class q_o2c_travel_search extends q_o2c_travel_search_gen {

    public async onQueryfire(Parameters :eventContext) {
        let role_id="";
        let login_id="";
        let salesarray = ["Submitted"]
		let array = ["Submitted", "Approved by Team Head","Re Opened", "Approved by Travel Desk", "Travel Completed", "Travel Closed"]
        role_id = (await this.txn.get$Role()).role_id;
        login_id = (await this.txn.get$User()).login_id;
		let role_list = await this.txn.getExecutedQuery('d_second_role_assyn', { employee_id: login_id, loadAll: true });
		if (role_list.length) {
			role_id = role_list[0].assyned_role;//testing
		}
		let approver_check=true;
		let approver_role_check=true;
		if(Parameters.object.approver==undefined||Parameters.object.approver==""){
			approver_check=false
		}
		if(Parameters.object.approver_role==undefined||Parameters.object.approver_role==""){
			approver_role_check=false
		}
        if(approver_check==false && approver_role_check==false){
		if (role_id == "TD"||role_id == "FINANCE") {
			Parameters.object.is_travel_desk=array;
			Parameters.object.workflow_status=undefined
		}
		else if (role_id == "SM") {
			Parameters.object.is_travel_desk=salesarray;
			Parameters.object.workflow_status=undefined 
		}
		else {
			Parameters.object.is_travel_desk=" .. ";
			Parameters.object.workflow_status=undefined
		}}
		else{
			Parameters.object.is_travel_desk="  .. ";
			Parameters.object.workflow_status='In-Progress'
		}
    }
}