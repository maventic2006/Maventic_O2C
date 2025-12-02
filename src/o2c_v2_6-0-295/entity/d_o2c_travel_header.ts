import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_o2c_travel_header as d_o2c_travel_header_gen } from "o2c_v2/entity_gen/d_o2c_travel_header";
export class d_o2c_travel_header extends d_o2c_travel_header_gen {
    public get days_since_last_action(): number{
        let last_work_day;
        let workflow_list = this.r_travel_workflow
        if (workflow_list.length != 0 && this.s_status != "Saved as Draft"&& this.s_status != "New"&& this.s_status!="Approved by Travel Desk") {
            if(workflow_list[0].approved_on){
                last_work_day = new Date().getTime()-workflow_list[0].approved_on.getTime();
                return Math. trunc(last_work_day/(1000 * 60 * 60 * 24))
            }
            else{
                last_work_day = new Date().getTime()-workflow_list[0].created_on.getTime();
                return Math. trunc(last_work_day/(1000 * 60 * 60 * 24))
            }
        }
    }
    public get total_advance(): number {
        let total = 0;
        let advance_list = this.r_travel_advance
        if (advance_list.length != 0) {
            for(let i=0;i<advance_list.length;i++){
                if(advance_list[i].advance_amount!=null)
                total=total+parseFloat(advance_list[i].advance_amount);
            }
        };
        return total;
    }
    public get total_per_diem(): number {
        let total = 0;
        let project_list = this.r_travel_project
        if (project_list.length != 0) {
            for(let i=0;i<project_list.length;i++){
                if(project_list[i].per_diem!=null)
                total=total+parseFloat(project_list[i].per_diem);
            }
        };
        return total;
    }
    public get total_amount(): number {
        let total = 0;
        let project_list = this.r_travel_project
        if (project_list.length != 0) {
            for(let i=0;i<project_list.length;i++){
                if(project_list[i].per_diem!=null)
                total=total+parseFloat(project_list[i].per_diem);
            }
        };
        let advance_list = this.r_travel_advance
        if (advance_list.length != 0) {
            for(let i=0;i<advance_list.length;i++){
                if(advance_list[i].advance_amount!=null)
                total=total+parseFloat(advance_list[i].advance_amount);
            }
        };
        return total;
    }
    public get transient_pending_with(): string {
        let pending_with="";
        let workflow_list = this.r_travel_workflow
        if (workflow_list.length != 0 && this.s_status!="Saved as Draft" && this.s_status!="New" && this.s_status!="Approved by Travel Desk") {
            for(let i=0;i<workflow_list.length;i++){
                if(workflow_list[i].s_status=="In-Progress"){
                pending_with=workflow_list[i].role
                break;
                }
            }
        };
        return pending_with;
    }
    public get no_of_days(): number {
        if (!this.travel_start_date || !this.travel_end_date) {
            return 0; // Return 0 if dates are missing
        }
    
        const start = new Date(this.travel_start_date);
        const end = new Date(this.travel_end_date);
    
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 0; // Return 0 if dates are invalid
        }
    
        const difference = end.getTime() - start.getTime();
        return (1+Math.round(difference / (1000 * 60 * 60 * 24)));
    }
    public get project_list(): string {
        const projects=this.r_travel_project;
        if(projects && projects.length>0){
            const projectNames = projects.map(p => p.project_name).join(", ");
            return projectNames
        }
        else
        return '';
    }
}