import {d_o2c_travel_transaction as d_o2c_travel_transaction_gen} from "o2c_v2/entity_gen/d_o2c_travel_transaction"
export class d_o2c_travel_transaction extends d_o2c_travel_transaction_gen{
    public get transient_employee_id(): string {
        let employee_id="";
        let travel_list = this.r_transaction_travel
        if (travel_list.length != 0) {
            employee_id = travel_list[0].employee_id_for
        };
        return employee_id;
    }
        public get transient_project(): string {
        const projects=this.r_transaction_project;
        if(projects && projects.length>0){
            const projectNames = projects.map(p => p.project_name).join(", ");
            return projectNames
        }
        else
        return '';
    }
}