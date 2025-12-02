import {d_o2c_project_resource as d_o2c_project_resource_gen} from "o2c_v2/entity_gen/d_o2c_project_resource"
export class d_o2c_project_resource extends d_o2c_project_resource_gen{
    public async createMail(oEvent) {
        // if (oEvent.object.type == "resourceAdd") {
        //     let resource_entity = await this.txn.getExecutedQuery("d_o2c_project_resource", { resource_guid: oEvent.object.ResourceArray, loadAll: true });
        //     debugger;
        //     for (let i = 0; i < resource_entity.length; i++) {
        //         this.txn.addNotification('resource_request', {
        //             lineManager: resource_entity[i].line_manager_name,
        //             startDate: resource_entity[i].start_date,
        //             endDate: resource_entity[i].end_date,
        //             projectName: oEvent.object.ProjectName,
        //             percentage: resource_entity[i].percentage,
        //             soNo: oEvent.object.SONo
        //         }, [resource_entity[i].line_manager_id.toLowerCase()]);
               
        //     }
        //     await this.txn.commitP();


        // }

    }
}