import { q_allocation_notification as q_allocation_notification_gen } from "o2c_v2/query_gen/q_allocation_notification"
export class q_allocation_notification extends q_allocation_notification_gen {

    public async onAllocationCreations(oEvent) {

        if (oEvent.object.type == "allocationRequest") {

            if (oEvent.object.employee && oEvent.object.employee != '') {

                let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee, loadAll: true })
                for (let i = 0; i < employee_entity.length; i++) {
                    this.txn.addNotification('allocation_request_mail', employee_entity[i], {
                        first_name: employee_entity[i].first_name,
                        request_number: oEvent.object.request_number
                    }, [employee_entity[i].employee_id.toLowerCase()]);
                }
                await this.txn.commitP();
                
            }
        }
        if (oEvent.object.type == "allocationLevelApproval") {
            if (oEvent.object.employee && oEvent.object.employee != '') {
                let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee, loadAll: true })

                this.txn.addNotification('allo_level_aprv_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);

                await this.txn.commitP();
            }
        }
        if (oEvent.object.type == "allocationFinalApproval") {
            if (oEvent.object.employee && oEvent.object.employee != '') {
                let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee, loadAll: true })

                this.txn.addNotification('allo_final_aprv_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number
                }, [employee_entity[0].employee_id.toLowerCase()]);

                await this.txn.commitP();
            }
        }
        if (oEvent.object.type == "allocationApprEmp") {

            if (oEvent.object.employee && oEvent.object.employee != '') {
                let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee, loadAll: true })

                this.txn.addNotification('allocation_appr_emp_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    asset_number: oEvent.object.asset_number,
                    tag_number: oEvent.object.tag_number,
                    asset_description: oEvent.object.asset_description
                }, [employee_entity[0].employee_id.toLowerCase()]);

                await this.txn.commitP();
            }
        }
        if (oEvent.object.type == "allocationRejection") {
            if (oEvent.object.employee && oEvent.object.employee != '') {
                let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.employee, loadAll: true })

                this.txn.addNotification('allocation_reject_mail', employee_entity[0], {
                    first_name: employee_entity[0].first_name,
                    request_number: oEvent.object.request_number,
                    status: oEvent.object.status,
                }, [employee_entity[0].employee_id.toLowerCase()]);

                await this.txn.commitP();
            }
        }
        if (oEvent.object.type == "assetMailSch") {
            let notif_cc = new Set();
            const today = new Date();
            // let txn: KloTransaction = this.eventContext.getTxn();

            let transfer_entity = await this.txn.getExecutedQuery("d_o2c_asset_transfer_request", { status: "Approved", approve_status: "Transferring", transfer_sub_type: "TEMP", loadAll: true });

            let allCompanyCode = new Set();
            for (let i = 0; i < transfer_entity.length; i++) {
                allCompanyCode.add(transfer_entity[i].company_code);
            }
            let companyArray = Array.from(allCompanyCode);

            //company wise
            for (let i = 0; i < companyArray.length; i++) {

                const filteredItems = transfer_entity.filter(transfer_entity =>
                    new Date(transfer_entity.expected_return_date) < today &&
                    transfer_entity.company_code === companyArray[i]
                );

                let desig_mstr_entity = [];
                if (filteredItems.length) {
                    desig_mstr_entity = await this.txn.getExecutedQuery("d_o2c_designation_master", { company_code: filteredItems[0].company_code, name: ["INF_TECH_MGR", "IT"], loadAll: true });
                }
                let designation_ids = [];
                for (let i = 0; i < desig_mstr_entity.length; i++) {
                    designation_ids.push(desig_mstr_entity[i].designation_id);
                }

                let emp_desig = []
                if (designation_ids.length > 0) {
                    emp_desig = await this.txn.getExecutedQuery("d_o2c_employee_designation", { designation: designation_ids, loadAll: true });
                }
                let employees = [];
                for (let i = 0; i < emp_desig.length; i++) {
                    employees.push(emp_desig[i].employee_id);
                }

                let employee_entity = [];
                if (emp_desig.length > 0) {
                    employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employees, loadAll: true });
                }
                let transferRequest = filteredItems.map(item => item.request_number);
                let assetNumber = filteredItems.map(item => item.asset_number);
                let returnDate = filteredItems.map(item => item.expected_return_date);

                for (let i = 0; i < employee_entity.length; i++) {
                    this.txn.addNotification('asset_response_mail_sch', employee_entity[i], {
                        first_name: employee_entity[i].first_name,
                        transfer_request: transferRequest,
                        return_date: returnDate,
                        asset_number: assetNumber
                        // first_name: employee_entity[i].first_name,
                        // transfer_request: "AS345",
                        // return_date: new Date(),
                        // asset_number: "7634"

                    }, [employee_entity[i].employee_id.toLowerCase()]);

                    await this.txn.commitP();
                }

            }
        }
        if (oEvent.object.type == "assetPiResMail") {
            // public async assetPiResMail() {
            //     return new Promise(res => {
            //         setTimeout(async () => {
            let empIdSet = new Set();
            const today = new Date();
            // let txn: KloTransaction = this.eventContext.getthis.transaction();
            let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee", { loadAll: true })
            let pi_entity = await this.txn.getExecutedQuery("d_asset_pi_header", { status: "Pending", loadAll: true });
            const filteredItems = pi_entity.filter(pi_entity => new Date(pi_entity.pi_date) > today);

            for (let i = 0; i < filteredItems.length; i++) {
                empIdSet.add(filteredItems[i].assign_to_id);
            }
            // Convert the Set to an array
            let empArray = Array.from(empIdSet);
            for (let i = 0; i < empArray.length; i++) {

                let filteredItemsByEmp = filteredItems.filter(filteredItems => filteredItems.assign_to_id == empArray[i]);
                let piDocNumbers = filteredItemsByEmp.map(item => item.pi_doc_number);
                let piDocDate = filteredItemsByEmp.map(item => item.pi_date);
                let filteredEmpEntity = employee_entity.filter(employee_entity => employee_entity.employee_id == empArray[i]);

                this.txn.addNotification('asset_pi_response_mail_sc', filteredEmpEntity[i], {
                    first_name: filteredEmpEntity[i].first_name,
                    pi_number: piDocNumbers,
                    verification_date: piDocDate
                    // request_number: oEvent.object.request_number
                }, [filteredEmpEntity[i].employee_id.toLowerCase()]);

                await this.txn.commitP();
            }
            //              res('asset_pi_response_mail' + new Date().toLocaleString())
            //         }, 30000)
            //     })
            // }
        }

    }
    public async onAllocationCreation() {

    }

}