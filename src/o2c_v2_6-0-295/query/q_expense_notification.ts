import {q_expense_notification as q_expense_notification_gen} from "o2c_v2/query_gen/q_expense_notification"
export class q_expense_notification extends q_expense_notification_gen{
    public async onSubmitNotif(oEvent) {
        let url_list = await this.txn.getExecutedQuery("d_general_confg", { key: 'server_url', loadAll: true })
        if (oEvent.object.type == "Submit") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.notif_to, loadAll: true })
            this.txn.addNotification('expense_submit', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                request: oEvent.object.expense,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Approve") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_approve', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "ApprovePM") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_approve_pm', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "ApproveFIN") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_approve_fin', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Reject") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_reject', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Return") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_return', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Clarity") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_clarify', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Paid") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_paid', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Cancel") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.notif_to, loadAll: true })
            let employee_id = oEvent.object.notif_to
            this.txn.addNotification('expense_cancel', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                request: oEvent.object.expense,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "CancelFIN") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_cancel_fin', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "reminder") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('expense_reminder', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.expense,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
    }
}