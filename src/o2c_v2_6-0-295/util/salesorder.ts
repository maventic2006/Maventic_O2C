import { KloTransaction } from "kloBo/KloTransaction";
import { parse } from "path";

export class salesorder {
    public static async fnAutoFillExpenseInSO(txn, projectID, poNo, amt, description, expenseID, source) {
        let projectData = await txn.getExecutedQuery("d_o2c_project_header", { loadAll: true, 'project_id': projectID });
        let soData = await txn.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, 'so': projectData[0].so_id, 'expandAll': 'r_so_attachment,r_so_attachment/r_attachmnt_itm,r_so_attachment/r_attachmnt_itm/r_billing_new,r_so_attachment/r_attachmnt_itm/r_schedule_new' });

        if (soData[0].type == "NBS" || soData[0].type == "ISP") {
            return;
        }

        let attachmentData = soData[0].r_so_attachment.filter((item) => item.po_no == poNo);
        let itemData = attachmentData[0].r_attachmnt_itm.filter((item) => item.item_category == "EXPENSE" && item.invoice_type == "ONACT");

        if (itemData.length > 0) {
            const item = itemData[0];

            // Determine the item array to process
            const billingData = item.r_billing_new.length ? item.r_billing_new :
                item.r_schedule_new.length ? item.r_schedule_new :
                    item.r_vol_based_new.length ? item.r_vol_based_new : null;
            let bill_length = billingData.length
            // for (let i = 0; i < billingData.length; i++) {
            //     billingData[i].percentage = parseFloat((billingData[i].amount * 100) / item.item_value).toFixed(2);
            // }

            // Update the respective entity
            const entityData = {
                so_item: item.soitem,
                billing_milestone_name: description,
                amount: amt,
                percentage: parseFloat((amt * 100) / item.item_value).toFixed(2),
                actual_date: new Date(),
                status: "InvReq",
                remark: expenseID,
                source: source
            };

            if (item.r_billing_new.length) {
                await item.r_billing_new.newEntityP(0, entityData, null);
            } else if (item.r_schedule_new.length) {
                entityData.expected_amount = amt;
                entityData.start_date = item.start_date;
                entityData.end_date = new Date();
                await item.r_schedule_new.newEntityP(0, entityData, null);
            } else if (item.r_vol_based_new.length) {
                entityData.milestone_description = description;
                entityData.quantity = 1;
                entityData.milestone_date = new Date();
                entityData.invoice_status = status;
                await item.r_vol_based_new.newEntityP(0, entityData, null);
            }
            let amountcheck = 0
            if (soData[0].reimbursement_rules === "CIP")
                amountcheck = await this.fnExceedExpense(txn, amt, projectID, poNo)
            if (billingData.length == bill_length)
                billingData.push(entityData);
            if (amountcheck != 0 || soData[0].reimbursement_rules === "ACT") {
                let billingAmt = 0;
                for (let i = 0; i < await billingData.length; i++) {
                    billingAmt = parseFloat(billingAmt + parseFloat(billingData[i].amount));
                }
                attachmentData[0].gross_value = (parseFloat(attachmentData[0].gross_value) - parseFloat(item.item_value)).toFixed(2);
                item.rate = parseFloat(billingAmt).toFixed(2);
                item.item_value = parseFloat(billingAmt).toFixed(2);
                attachmentData[0].gross_value = (parseFloat(attachmentData[0].gross_value) + parseFloat(item.item_value)).toFixed(2);
            }

        }


        else {
            if (soData[0].reimbursement_rules === "ACT") {
                attachmentData[0].gross_value = parseFloat(attachmentData[0].gross_value + amt).toFixed(2);

                //let status = (soData[0].reimbursement_rules === "CIP") ? "Invoice Not Required" : "InvReq";
                const itemEntityData = {
                    so_guid: soData[0].so_guid,
                    attachment_id: attachmentData[0].attachment_id,
                    item_category: "EXPENSE",
                    item_pd_or_qty: 1,
                    rate: amt,
                    unit: "AU",
                    item_value: amt,
                    invoice_type: "ONACT",
                    invoice_cycle: "ONACT",
                    start_date: soData[0].project_start_date,
                    end_date: soData[0].project_end_date,
                    remark: expenseID
                };
                await attachmentData[0].r_attachmnt_itm.newEntityP(0, itemEntityData, null);
                const milestoneEntityData = {
                    so_item: attachmentData[0].r_attachmnt_itm[0].so_item,
                    billing_milestone_name: description,
                    amount: amt,
                    percentage: parseFloat((amt * 100) / attachmentData[0].r_attachmnt_itm[0].item_value).toFixed(2),
                    actual_date: new Date(),
                    status: "InvReq"
                };
                await attachmentData[0].r_attachmnt_itm[0].r_billing_new.newEntityP(0, milestoneEntityData, null);


            }

        }

    }
    public static async fnExceedExpense(txn, newExpAmt, projectID, poNo) {
        let projectData = await txn.getExecutedQuery("d_o2c_project_header", { loadAll: true, 'project_id': projectID });
        let soData = await txn.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, 'so': projectData[0].so_id, 'expandAll': 'r_so_attachment,r_so_attachment/r_attachmnt_itm,r_so_attachment/r_attachmnt_itm/r_billing_new,r_so_attachment/r_attachmnt_itm/r_schedule_new' });

        if (soData[0].type == "NBS" || soData[0].type == "ISP") {
            return 0;
        }

        let attachmentData = await soData[0].r_so_attachment.filter((item) => item.po_no == poNo);
        let itemData = await attachmentData[0].r_attachmnt_itm.filter((item) => item.item_category == "EXPENSE" && item.invoice_type == "ONACT");

        if (itemData.length > 0) {
            const item = itemData[0];

            // Determine the item array to process
            const billingData = item.r_billing_new.length ? item.r_billing_new :
                item.r_schedule_new.length ? item.r_schedule_new :
                    item.r_vol_based_new.length ? item.r_vol_based_new : null;
            if (soData[0].reimbursement_rules === "CIP") {
                let billingAmt = 0;
                if(billingData){
                for (let i = 0; i < billingData.length; i++) {
                    billingAmt = parseFloat(billingAmt + parseFloat(billingData[i].amount));
                }
                billingAmt = parseFloat(billingAmt + newExpAmt);
                if (item.item_value >= billingAmt)
                    return 0;
                else
                    return parseFloat(billingAmt - parseFloat(item.item_value));
                }
                else{
                    return 0;
                }

            }
            else if (soData[0].reimbursement_rules === "ACT") {
                return 0;
            }
        }

    }

    public static async addApiAmtinSO(txn, so, poNo, amount, description, milestone_date, item_key) {
        let soData = await txn.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, 'so': so, 'expandAll': 'r_so_attachment,r_so_attachment/r_attachmnt_itm,r_so_attachment/r_attachmnt_itm/r_billing_new,r_so_attachment/r_attachmnt_itm/r_schedule_new' });
        let attachmentData = await soData[0].r_so_attachment.filter((item) => item.po_no == poNo);
        let itemData = await attachmentData[0].r_attachmnt_itm.filter((item) => item.soitem == item_key);
        if (itemData[0].invoice_type == "MONTHLYFIX" || itemData[0].invoice_type == "ONACT") { //Updating the billing plan in SO
            try {
                // Determine key names dynamically based on invoice type
                let startDateKey = itemData[0].invoice_type === "ONACT" ? "start_date" : "start__date";
                let amtKey = itemData[0].invoice_type === "ONACT" ? "amount" : "expected_amount";
                let statusKey = itemData[0].invoice_type == "ONACT" ? "invoice_status" : "status";

                let billingAmt = 0; // Ensure it starts from 0
                let billingData = itemData[0].r_schedule_new;
                for (let i = 0; i < billingData.length; i++) {
                    let remaining_balance = 0;
                    if (itemData[0].invoice_cycle == "MONTHLY") {
                        if (milestone_date >= billingData[i][startDateKey] && milestone_date <= billingData[i].end_date) { //Work only for monthly..
                            remaining_balance = parseFloat(billingData[i][amtKey]) - parseFloat(amount)
                            billingData[i][amtKey] = parseFloat(amount);
                            billingData[i].source = "API";
                            billingData[i][statusKey] = "InvReq";
                        }
                    } else if (itemData[0].invoice_cycle == "QUTRLY" ||
                        itemData[0].invoice_cycle == "HALFYEARLY" ||
                        itemData[0].invoice_cycle == "YEARLY") {
                        if (milestone_date >= billingData[i][startDateKey] && milestone_date <= billingData[i].end_date) { //..
                            if (billingData[i].source == null || billingData[i].source == undefined || billingData[i].source == "") {
                                remaining_balance = parseFloat(billingData[i][amtKey]) - parseFloat(amount)
                                billingData[i][amtKey] = parseFloat(amount);
                                billingData[i].source = "API";
                            } else if (billingData[i].source == "API") {
                                remaining_balance = -parseFloat(amount);
                                billingData[i][amtKey] = parseFloat(billingData[i][amtKey]) + parseFloat(amount);
                                if (billingData[i].end_date.getMonth() == milestone_date.getMonth()) {
                                    billingData[i][statusKey] = "InvReq";
                                }
                            }
                        }
                    }
                    // If remaining_balance is POSITIVE, add it to the last available item AFTER `i`
                    if (remaining_balance > 0) {
                        // Simply use the last index of the array (which is already what we want)
                        let lastIndex = billingData.length - 1;

                        // Only proceed if we're not already at the last index
                        if (i < lastIndex) {
                            // Add remaining_balance to the last index
                            billingData[lastIndex][amtKey] = (parseFloat(billingData[lastIndex][amtKey]) + remaining_balance).toFixed(2);
                        }
                    }

                    // **If remaining_balance is NEGATIVE, deduct it progressively from previous items**
                    if (remaining_balance < 0) {
                        let remaining_to_deduct = Math.abs(remaining_balance); // Convert to positive

                        for (let j = billingData.length - 1; j > i; j--) {
                            if (billingData[j][amtKey] > 0) {
                                let deduction = Math.min(parseFloat(billingData[j][amtKey]), remaining_to_deduct);
                                billingData[j][amtKey] = (parseFloat(billingData[j][amtKey]) - deduction).toFixed(2);
                                remaining_to_deduct -= deduction;

                                if (remaining_to_deduct <= 0) break; // Stop once fully deducted
                            }
                        }
                    }
                    billingAmt += parseFloat(billingData[i][amtKey]) || 0; // Handle NaN cases
                }

                itemData[0].balance_amount = (itemData[0].item_value - billingAmt).toFixed(2); //Updating balance in Item.

            } catch (e) {
                console.log(e);
            }
        }
        // else if (itemData[0].invoice_type == "ONACT") { // Creating the billing plan in Volume.
        //     await itemData[0].r_vol_based_new.newEntityP(0, {
        //         soitem: itemData[0].soitem,
        //         milestone_description: description,
        //         quantity: 1,
        //         amount: amount,
        //         milestone_date: milestone_date,
        //         invoice_status: "InvReq"
        //     }, null)
        //     let billingData = itemData[0].r_vol_based_new;
        //     let billingAmt = 0; // Ensure it starts from 0

        //     for (let i = 0; i < billingData.length; i++) {
        //         billingAmt += parseFloat(billingData[i].amount) || 0; // Handle NaN cases
        //     }

        //     // billingAmt += amt; // Add the additional amount
        //     itemData[0].balance_amount = itemData[0].item_value - billingAmt;

        // }
    }
}
//31/1/25 10:50AM