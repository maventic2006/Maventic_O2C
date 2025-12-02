import { d_o2c_project_header as d_o2c_project_header_gen } from "o2c_v2/entity_gen/d_o2c_project_header"
export class d_o2c_project_header extends d_o2c_project_header_gen {
    public get trans_status(): string {
        let BillingMilestoneTableData = [], ProjectMilestoneStatus = [], flag = false, projectStatus = "";
        let so = this.r_project_so;
        if (so.length) {
            let attachment = so[0].r_so_attachment;
            let projectMilestone = this.r_project_milestone;

            for (let i = 0; i < attachment.length; i++) {
                let item = attachment[i].r_attachmnt_itm;
                for (let j = 0; j < item.length; j++) {
                    let milestone = item[j].r_billing_new;
                    let schedule = item[j].r_schedule_new;
                    let volume = item[j].r_vol_based_new;
                    for (let k = 0; k < milestone.length; k++) {
                        BillingMilestoneTableData.push(milestone[k].status)
                    }
                    for (let k = 0; k < schedule.length; k++) {
                        BillingMilestoneTableData.push(schedule[k].status)
                    }
                    for (let k = 0; k < volume.length; k++) {
                        BillingMilestoneTableData.push(volume[k].invoice_status)
                    }
                }
            }

            for (let i = 0; i < projectMilestone.length; i++) {
                ProjectMilestoneStatus.push(projectMilestone[i].s_status)
            }


            if (this.s_status == "Hold") {
                return "Hold";
            }
            if (this.s_status == "Archived") {
                return "Archived";
            }
            else {
                const billingMilestoneStatusSet = Array.from(new Set(BillingMilestoneTableData));
                const projectMilestoneStatusSet = Array.from(new Set(ProjectMilestoneStatus));
                if (billingMilestoneStatusSet.length == 1 && billingMilestoneStatusSet[0] == "Invoiced") {
                    flag = true;
                    projectStatus = "Billing Closed";


                }
                if (projectMilestoneStatusSet.length == 1 && projectMilestoneStatusSet[0] == "Closed") {
                    flag = true;
                    projectStatus = "Delivery Closed";


                }

                if ((billingMilestoneStatusSet.length == 1 && billingMilestoneStatusSet[0] == "Invoiced") && (projectMilestoneStatusSet.length == 1 && projectMilestoneStatusSet[0] == "Closed")) {
                    flag = true;
                    projectStatus = "Completed";
                    //so[0].s_status = "Closed";
                    //this.txn.commitP();
                    //project_info[0].trans_status = project_info[0].s_status;


                }
                else {
                    if (flag == false) {
                        if (this.s_status != "Created")
                            projectStatus = "Active";
                        if (this.s_status == "Created")
                            projectStatus = "Created";
                    }

                }


            }
        }
        return projectStatus;
    }

    // public get s_status(): string {
    //     let BillingMilestoneTableData = [], ProjectMilestoneStatus = [], flag = false, projectStatus = "";
    //     let so = this.r_project_so;
    //     if (so.length) {
    //         let attachment = so[0].r_so_attachment;
    //         for (let i = 0; i < attachment.length; i++) {
    //             let item = attachment[i].r_attachmnt_itm;
    //             for (let j = 0; j < item.length; j++) {
    //                 let milestone = item[j].r_billing_new;
    //                 let schedule = item[j].r_schedule_new;
    //                 let volume = item[j].r_vol_based_new;
    //                 for (let k = 0; k < milestone.length; k++) {
    //                     BillingMilestoneTableData.push(milestone[k].status)
    //                 }
    //                 for (let k = 0; k < schedule.length; k++) {
    //                     BillingMilestoneTableData.push(schedule[k].status)
    //                 }
    //                 for (let k = 0; k < volume.length; k++) {
    //                     BillingMilestoneTableData.push(volume[k].invoice_status)
    //                 }
    //             }
    //         }

    //         let projectMilestone = this.r_project_milestone;
    //         for (let i = 0; i < projectMilestone.length; i++) {
    //             ProjectMilestoneStatus.push(projectMilestone[i].s_status)
    //         }


    //         if (this.s_status == "Hold") {
    //             return "Hold";
    //         }
    //         if (this.s_status == "Archived") {
    //             return "Archived";
    //         }
    //         else {
    //             const billingMilestoneStatusSet = Array.from(new Set(BillingMilestoneTableData));
    //             const projectMilestoneStatusSet = Array.from(new Set(ProjectMilestoneStatus));
    //             if (billingMilestoneStatusSet.length == 1 && billingMilestoneStatusSet[0] == "Invoiced") {
    //                 flag = true;
    //                 projectStatus = "Billing Closed";


    //             }
    //             if (projectMilestoneStatusSet.length == 1 && projectMilestoneStatusSet[0] == "Closed") {
    //                 flag = true;
    //                 projectStatus = "Delivery Closed";


    //             }

    //             if ((billingMilestoneStatusSet.length == 1 && billingMilestoneStatusSet[0] == "Invoiced") && (projectMilestoneStatusSet.length == 1 && projectMilestoneStatusSet[0] == "Closed")) {
    //                 flag = true;
    //                 projectStatus = "Completed";
    //                 //so[0].s_status = "Closed";
    //                 //this.txn.commitP();
    //                 //project_info[0].trans_status = project_info[0].s_status;


    //             }
    //             else {
    //                 if (flag == false) {
    //                     if (this.s_status != "Created")
    //                         projectStatus = "Active";
    //                     if (this.s_status == "Created")
    //                         projectStatus = "Created";
    //                 }

    //             }
    //             return projectStatus;

    //         }
    //     }
    // }

    // public get trans_prj_name(): string {
    //     return this.r_project_so[0]?.project_name;
    // }

    // public set trans_prj_name(new_value: string) { this.s("trans_prj_name", new_value, "string", false, false) }

    // public get trans_order_type(): string {
    //     return this.r_project_so[0]?.type;
    // }

    // public set trans_order_type(new_value: string) { this.s("trans_order_type", new_value, "string", false, false) }

    // public get trans_bill_to_cust(): string {
    //     return this.r_project_so[0]?.bill_to_customer;
    // }

    // public set trans_bill_to_cust(new_value: string) { this.s("trans_bill_to_cust", new_value, "string", false, false) }

    // public get trans_currency(): string {
    //     return this.r_project_so[0]?.currency;
    // }

    // public set trans_currency(new_value: string) { this.s("trans_currency", new_value, "string", false, false) }

    public get trans_po(): string {
        return this.r_project_so[0]?.transient_po;
    }

    public set trans_po(new_value: string) { this.s("trans_po", new_value, "string", false, false) }

    public async soStatusChange() {
        //     if(this.trans_status=="Completed"){
        //         let so = this.r_project_so;
        //         so[0].s_status = "Closed";
        //         await this.txn.commitP();

        //     }
    }


}
//Albia 2 Oct 11:28PM