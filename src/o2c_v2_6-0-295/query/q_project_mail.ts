import { q_project_mail as q_project_mail_gen } from "o2c_v2/query_gen/q_project_mail"
export class q_project_mail extends q_project_mail_gen {
    public async projectNotification(oEvent) {
        if (oEvent.object.type == "resourceAdd") {
            let resource_entity = await this.txn.getExecutedQuery("d_o2c_project_resource", { resource_guid: oEvent.object.ResourceArray, loadAll: true });
            let employeeIDArray = resource_entity.map(item => item.employee_id);
            let employee = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: employeeIDArray, loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name'] })
            for (let i = 0; i < resource_entity.length; i++) {
                if (resource_entity[i].s_status == "Pending") {
                    const resourceName = employee.filter((item) => item.employee_id == resource_entity[i].employee_id)
                    this.txn.addNotification('resource_request', resource_entity[i], {
                        resorceMMID: resource_entity[i].employee_id,
                        resourceName: resourceName[0].full_name,
                        lineManager: resource_entity[i].line_manager_name,
                        startDate: resource_entity[i].start_date,
                        endDate: resource_entity[i].end_date,
                        projectName: oEvent.object.ProjectName,
                        percentage: resource_entity[i].percentage,
                        soNo: oEvent.object.SONo
                    }, [resource_entity[i].line_manager_id.toLowerCase()]);

                }
            }
            await this.txn.commitP();

        }

        if (oEvent.object.type == "resourceDeboarding") {
            let resource_entity = await this.txn.getExecutedQuery("d_o2c_project_resource", { resource_guid: oEvent.object.resourceGuid, loadAll: true });
            this.txn.addNotification('resource_deboard', resource_entity[0], {
                resourceName: oEvent.object.resourceName,
                lineManager: oEvent.object.lineManager,
                projectName: oEvent.object.projectName,
                currentDate: oEvent.object.currentDate,
                resourceRole: oEvent.object.resourceRole
            }, [resource_entity[0].line_manager_id.toLowerCase()]);
            await this.txn.commitP();
        }

        if (oEvent.object.type == "approved" || oEvent.object.type == "rejected") {
            let resource_entity = await this.txn.getExecutedQuery("d_o2c_project_resource", { resource_guid: oEvent.object.resourceGuid, loadAll: true });
            let employee = await this.txn.getExecutedQuery("d_o2c_employee", { loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name'] })
            const resourceName = employee.filter((item) => item.employee_id == oEvent.object.resourceId)
            const projectManager = employee.filter((item) => item.employee_id == oEvent.object.projectManager)

            this.txn.addNotification('resourceAction', resource_entity[0], {
                action: oEvent.object.action,
                projectName: oEvent.object.projectName,
                projectManager: projectManager[0].full_name,
                startDate: oEvent.object.startDate,
                endDate: oEvent.object.endDate,
                resourceName: resourceName[0].full_name

            }, [oEvent.object.projectManager.toLowerCase()]);
            await this.txn.commitP();
        }
        if (oEvent.object.type == "invoiceRequest") {
            let employee = await this.txn.getExecutedQuery("d_o2c_employee", { employee_id: oEvent.object.finance, loadAll: true, partialSelected: ['first_name', 'last_name', 'full_name'] })
            this.txn.addNotification('invoice_request', employee[0], {
                financeId: employee[0].full_name,
                soNo: oEvent.object.soNo,
                projectName: oEvent.object.projectName,
                milestoneName: oEvent.object.milestoneName,
                currentDate: oEvent.object.currentDate,
                projectManager: oEvent.object.projectManager
            }, [oEvent.object.finance.toLowerCase()]);
            await this.txn.commitP();
        }

    }


}



//Albia 5Oct 10:31PM