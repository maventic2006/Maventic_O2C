import {d_expense_perdiem_dcl as d_expense_perdiem_dcl_gen} from "o2c_v2/entity_gen/d_expense_perdiem_dcl"
export class d_expense_perdiem_dcl extends d_expense_perdiem_dcl_gen{
    public get project(): string {
        const projects=this.r_perdiem_project
        if(projects && projects.length>0){
            const projectNames = projects.map(p => p.project_name).join(", ");
            return projectNames
        }
        else
        return '';
    }
    public get employee(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        return travel[0].employee_id_for
    }
    else
    return '';
    }
    public get transient_po_no(): string {
        const projects=this.r_perdiem_project
        if(projects && projects.length>0){
            const poNo = projects.map(p => p.po_no).join(", ");
            return poNo
        }
        else
        return '';
    }
    public get transient_customer(): string {
        const projects=this.r_perdiem_project
        if (projects && projects.length > 0) {
            const customerNames = [];
             for(let i=0;i<projects.length;i++){
                let so=projects[i].r_travel_project_so;
                if(so[0] && so[0].r_so_customer){let customer = so[0].r_so_customer;
                if(customer[0] && customer[0].customer_name){let customer_name=customer[0].customer_name
                if (customer_name) {
                    customerNames.push(customer_name);
                }}}
             }
            const uniqueNames = customerNames.filter((name, index, self) => self.indexOf(name) === index);
            const customerNameString = uniqueNames.join(", ");
            return customerNameString
        }
        else
        return '';
    }
    public get transient_employee_name(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        const employee = travel[0].r_travel_employee
        if(employee && employee.length>0){
        return employee[0].full_name
    }}
    else
    return '';
    }
    public get transient_ac(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        const employee = travel[0].r_travel_employee
        if(employee && employee.length>0){
        return employee[0].account_number
    }}
    else
    return '';
    }
    public get transient_ifsc(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        const employee = travel[0].r_travel_employee
        if(employee && employee.length>0){
        return employee[0].ifsc_code
    }}
    else
    return '';
    }
    public get transient_bank_name(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        const employee = travel[0].r_travel_employee
        if(employee && employee.length>0){
        return employee[0].bank_name
    }}
    else
    return '';
    }
    public get transient_email(): string {
        const travel=this.r_perdiem_travel
        if(travel && travel.length>0){
        const employee = travel[0].r_travel_employee
        if(employee && employee.length>0){
        return employee[0].personal_mail;
    }}
    else
    return '';
    }
    public get transaction_trans_id(): string {
        const expense=this.r_perdiem_expense
        if(expense[0] && expense[0].transaction_id)
        return expense[0].transaction_id;
        else
        return null;
    }
    public get transient_expense_status(): string {
        const expense=this.r_perdiem_expense
        if(expense[0] && expense[0].expense_status)
        return expense[0].expense_status;
        else
        return null;
    }
    public get transient_expense_bank_name(): string {
        const expense=this.r_perdiem_expense
        if(expense[0] && expense[0].bank_name)
        return expense[0].bank_name?expense[0].bank_name:undefined;
        else
        return null;
    } 
    public get transaction_trans_date(): Date {
        const expense=this.r_perdiem_expense
        if(expense[0] && expense[0].transaction_date)
        return expense[0].transaction_date?expense[0].transaction_date:undefined;
    }
}
    // public get transient_trans_amount(): string {
    //     const projects=this.r_perdiem_project
    //     if(projects && projects.length>0){
    //         const poNo = projects.map(p => p.po_no).join(", ");
    //         return poNo
    //     }
    //     else
    //     return '';
    // }
    // public get transaction_trans_date(): string {
    //     const projects=this.r_perdiem_project
    //     if(projects && projects.length>0){
    //         const poNo = projects.map(p => p.po_no).join(", ");
    //         return poNo
    //     }
    //     else
    //     return '';
    // }
