import { KloEntitySet } from "kloBo/KloEntitySet";
import { q_travel_notification as q_travel_notification_gen } from "o2c_v2/query_gen/q_travel_notification"
export class q_travel_notification extends q_travel_notification_gen {

    public async onSubmitNotif(oEvent) {
        let url_list = await this.txn.getExecutedQuery("d_general_confg", { key: 'server_url', loadAll: true })
        if (oEvent.object.type == "Submit") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.notif_to, loadAll: true })
            this.txn.addNotification('travel_submit', employee_entity[0], {
                first_name: employee_entity[0].first_name,
                request: oEvent.object.travel,
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
            this.txn.addNotification('travel_approve', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
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
            this.txn.addNotification('travel_approve_pm', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "ApproveTD") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('travel_approve_td', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
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
            this.txn.addNotification('travel_reject', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
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
            this.txn.addNotification('travel_return', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
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
            this.txn.addNotification('travel_clarify', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Complete") {
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.notif_to, loadAll: true })
            let first_name = employee_entity[0].first_name;
            this.txn.addNotification('travel_complete', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Closed") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('travel_closed', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "Cancel") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('travel_cancel', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "CancelTD") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('travel_cancel_td', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "ReOpened") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('travel_reopen', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "TicketCancellationInitiated") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_tckt_cncl_initiation', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "TicketCancellationApprove") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_tckt_cncl_appr', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "TicketCancellationReject") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_tckt_cncl_rjct', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "HotelCancellationInitiated") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_htl_cncl_initiation', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "HotelCancellationApprove") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_htl_cncl_appr', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
        else if (oEvent.object.type == "HotelCancellationReject") {
            let employee_id = [oEvent.object.notif_to, oEvent.object.approver]
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employee_id, loadAll: true })
            let submitter_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.notif_to.toLowerCase()));
            let approver_data = employee_entity.filter(item => (item.employee_id.toLowerCase() === oEvent.object.approver.toLowerCase()));
            let first_name = submitter_data[0].first_name;
            let approver = approver_data[0].first_name.concat(" ", approver_data[0].last_name, " - ", approver_data[0].employee_id)
            this.txn.addNotification('trvl_htl_cncl_rjct', employee_entity[0], {
                first_name: first_name,
                request: oEvent.object.travel,
                approver: approver,
                tracking_url:url_list[0].low_value
            }, [oEvent.object.notif_to.toLowerCase()], oEvent.object.notif_cc);
            await this.txn.commitP();
        }
    }
}