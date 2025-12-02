import { q_o2c_expense as q_o2c_expense_gen } from "o2c_v2/query_gen/q_o2c_expense"
export class q_o2c_expense extends q_o2c_expense_gen {

    public async onQueryfire(Parameters :eventContext) {
        let role_id="";
        let login_id="";
        let salesarray = ["Submitted"]
		let array = ["Clarification Required","Clarification Provided","Submitted","Approved by Project Manager","Approved by Team Head","Approved by Finance","Paid","Ready for Payment"]
        role_id = (await this.txn.get$Role()).role_id;
        login_id = (await this.txn.get$User()).login_id;
		let role_list = await this.txn.getExecutedQuery('d_second_role_assyn', { employee_id: login_id, loadAll: true });
		if (role_list.length) {
			role_id = role_list[0].assyned_role;
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
			Parameters.object.is_finance=array;
			Parameters.object.is_saved_as_draft="Saved as Draft";
			Parameters.object.is_sales=" .. ";
			Parameters.object.workflow_status=undefined 
		}
		else if (role_id == "SM") {
			Parameters.object.is_sales=salesarray;
			Parameters.object.is_saved_as_draft=" .. ";
			Parameters.object.is_finance=" .. ";
			Parameters.object.workflow_status=undefined 
		}
		else {
			Parameters.object.is_saved_as_draft=" .. ";
			Parameters.object.is_finance=" .. ";
			Parameters.object.is_sales=" .. ";
			Parameters.object.workflow_status=undefined 
		}}
		else{
			Parameters.object.is_saved_as_draft=" .. ";
			Parameters.object.is_finance=" .. ";
			Parameters.object.is_sales=" .. ";
			Parameters.object.workflow_status='In-Progress'
		}
    }
}