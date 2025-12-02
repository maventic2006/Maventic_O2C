import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_admin_expense_page")
export default class p_admin_expense_page extends KloController{
	public async oldDataCorrection(){
        let oBusyDailog = new sap.m.BusyDialog();
		oBusyDailog.open();
        let list=await this.tm.getTN("list").getData();
        let project=await this.transaction.getExecutedQuery('d_o2c_expense_travel_project', {expandAll:"r_travel_project_so", loadAll: true });
        for(let i=0;i<list.length;i++){
            if(!list[i].category_id){
            if(list[i].travel_request_id){
                list[i].category_id='TRAVEL'
            }
            else{
                list[i].category_id='NON_TRAVEL'
            }
            let filteredProjects = project.filter(project => project.request_id === list[i].request_id);
            if(filteredProjects.length>0 && filteredProjects[0].r_travel_project_so && filteredProjects[0].r_travel_project_so.length>0)
            list[i].order_type=filteredProjects[0].r_travel_project_so[0].type
            list[i].employee_role_type='ALL'
        //    let receipt=list[i].r_expense_receipt
        // for(let j=0;j<receipt.length;j++){
        //     if(receipt[j].receipt_type=='food_s'||receipt[j].receipt_type=='food_d'){
        //         receipt[j].receipt_type='Food'
        //     }
        //     else if(receipt[j].receipt_type=='s_accomodation_s'){
        //         receipt[j].receipt_type='Self Accomodation'
        //     }
        //     else if(receipt[j].receipt_type=='miscellaneous_s'){
        //         receipt[j].receipt_type='Client Gift'
        //     }
        //     else if(receipt[j].receipt_type=='s_two_wheeler_s'||receipt[j].receipt_type=='d_two_wheeler_s'){
        //         receipt[j].receipt_type='Self Two-wheeler'
        //     }
        //     else if(receipt[j].receipt_type=='s_car_s'||receipt[j].receipt_type=='d_car_s'){
        //         receipt[j].receipt_type='Self Car'
        //     }
        //     else if(receipt[j].receipt_type=='flight_d'||receipt[j].receipt_type=='flight_s'){
        //         receipt[j].receipt_type='Flight'
        //     }
        //     else if(receipt[j].receipt_type=='train_d'||receipt[j].receipt_type=='train_s'){
        //         receipt[j].receipt_type='Train'
        //     }
        //     else if(receipt[j].receipt_type=='visa_d'||receipt[j].receipt_type=='visa_s'){
        //         receipt[j].receipt_type='Visa'
        //     }
        //     else if(receipt[j].receipt_type=='hotel_s'||receipt[j].receipt_type=='hotel_d'){
        //         receipt[j].receipt_type='Hotel'
        //     }
        //     else if(receipt[j].receipt_type=='taxi_s'||receipt[j].receipt_type=='taxi_d'){
        //         receipt[j].receipt_type='Taxi'
        //     }
        //     else if(receipt[j].receipt_type=='toll_s'||receipt[j].receipt_type=='toll_d'){
        //         receipt[j].receipt_type='Toll'
        //     }
        //     else if(receipt[j].receipt_type=='per_diem_d'){
        //         receipt[j].receipt_type='Per Diem'
        //     }
        //     else if(receipt[j].receipt_type=='taxi_s'||receipt[j].receipt_type=='taxi_d'){
        //         receipt[j].receipt_type='Taxi'
        //     }
        // }
        }}
        await this.tm.commitP("Expense Saved Successfully", "Receipts Save Failed", true, true);
        await this. oldReceiptCorrection();
        await this.tm.commitP("Receipts Saved Successfully", "Receipts Save Failed", true, true);
        oBusyDailog.close();
    }
	public async oldReceiptCorrection(){
        let receipt=await this.transaction.getExecutedQuery('d_o2c_expense_receipt', {loadAll: true });
        for(let i=0;i<receipt.length;i++){
            if(receipt[i].receipt_type=='food_s'||receipt[i].receipt_type=='food_d'){
                receipt[i].receipt_type='Food'
            }
            else if(receipt[i].receipt_type=='s_accomodation_s'){
                receipt[i].receipt_type='Self Accomodation'
            }
            else if(receipt[i].receipt_type=='miscellaneous_s'){
                receipt[i].receipt_type='Client Gift'
            }
            else if(receipt[i].receipt_type=='s_two_wheeler_s'||receipt[i].receipt_type=='d_two_wheeler_s'){
                receipt[i].receipt_type='Self Two-wheeler'
            }
            else if(receipt[i].receipt_type=='s_car_s'||receipt[i].receipt_type=='d_car_s'){
                receipt[i].receipt_type='Self Car'
            }
            else if(receipt[i].receipt_type=='flight_d'||receipt[i].receipt_type=='flight_s'){
                receipt[i].receipt_type='Flight'
            }
            else if(receipt[i].receipt_type=='train_d'||receipt[i].receipt_type=='train_s'){
                receipt[i].receipt_type='Train'
            }
            else if(receipt[i].receipt_type=='visa_d'||receipt[i].receipt_type=='visa_s'){
                receipt[i].receipt_type='Visa'
            }
            else if(receipt[i].receipt_type=='hotel_s'||receipt[i].receipt_type=='hotel_d'){
                receipt[i].receipt_type='Hotel'
            }
            else if(receipt[i].receipt_type=='taxi_s'||receipt[i].receipt_type=='taxi_d'){
                receipt[i].receipt_type='Taxi'
            }
            else if(receipt[i].receipt_type=='toll_s'||receipt[i].receipt_type=='toll_d'){
                receipt[i].receipt_type='Toll'
            }
            else if(receipt[i].receipt_type=='per_diem_d'){
                receipt[i].receipt_type='Per Diem'
            }
            else if(receipt[i].receipt_type=='taxi_s'||receipt[i].receipt_type=='taxi_d'){
                receipt[i].receipt_type='Taxi'
            }
        }
    }
    public async oldProjectCorrection(){
        let oBusyDailog = new sap.m.BusyDialog();
        oBusyDailog.open();
        let project=await this.transaction.getExecutedQuery('d_o2c_expense_travel_project', { loadAll: true });
        let list= await this.tm.getTN('list').getData();
        for(let i=0;i<list.length;i++){
            let current_expense=list[i];
            const filteredProjects = project.filter(project => project.request_id === current_expense.request_id);
            if(filteredProjects.length>0){
                let receipt_list = await current_expense.r_expense_receipt;
                for(let j=0;j<receipt_list.length;j++){
                    let receipt_project_list=await receipt_list[j].r_receipt_project.fetch();
                    if(receipt_project_list.length==0)
                    for(let k=0;k<filteredProjects.length;k++){
                        await receipt_list[j].r_receipt_project.newEntityP(0, { request_id:receipt_list[j].receipt_id, project_id: filteredProjects[k].project_id, project_name: filteredProjects[k].project_name, split_percent: filteredProjects[k].split_percent, po_no: filteredProjects[k].po_no, bill_to_customer: filteredProjects[k].bill_to_customer, so: filteredProjects[k].so, receipt_expense_id: filteredProjects[k].request_id})
                    }
                }
            }
            for(let l=0;l<filteredProjects.length;l++)
                await filteredProjects[l].deleteP();
        }
        await this.tm.commitP("Expense Saved Successfully", "Receipts Save Failed", true, true);
        oBusyDailog.close();
    }
    public async receiptWiseApprovalFix(){
        let oBusyDailog = new sap.m.BusyDialog();
        oBusyDailog.open();
        let list= await this.tm.getTN('list').getData();
        for(let i=0;i<list.length;i++){
            let current_expense=list[i];
            let receipt_list = await current_expense.r_expense_receipt;
            for(let j=0;j<receipt_list.length;j++){
                if(current_expense.expense_status=="Clarification Provided"||current_expense.expense_status=="Clarification Required"||current_expense.expense_status=="Approved by Project Manager"||current_expense.expense_status=="Approved by Sales Manager"||current_expense.expense_status=="Submitted"||current_expense.expense_status=="Approved by Team Head"){
                    if(receipt_list[j].verification_check==true){
                        receipt_list[j].receipt_appr_status="Approved";
                    }
                    else
                        receipt_list[j].receipt_appr_status="Pending";
                }
                else if(current_expense.expense_status=="Paid"||current_expense.expense_status=="Approved by Finance"){
                    receipt_list[j].receipt_appr_status="Approved";
                }
            }
        }
        await this.tm.commitP("Receipts Saved Successfully", "Receipts Save Failed", true, true);
        oBusyDailog.close();
    }
}