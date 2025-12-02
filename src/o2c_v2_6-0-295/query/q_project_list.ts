import { q_project_list as q_project_list_gen } from "o2c_v2/query_gen/q_project_list"
export class q_project_list extends q_project_list_gen {
    public async projectSearch(Parameters) {
            this.setLoadAll(true);
            if(Parameters.object.s_status === undefined || Parameters.object.s_status === null || Parameters.object.s_status === ""){
                Parameters.object.s_status =  ["Created", "Active", "Delivery Closed","Billing Closed"];
            }
    }
}
//26-11-2024