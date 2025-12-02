import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_org } from "o2c_v2/entity/d_o2c_employee_org";
import { q_emp_filter  as q_emp_filter_gen} from "o2c_v2/query_gen/q_emp_filter"
export class q_emp_filter extends q_emp_filter_gen{

public async mailSend(oEvent)
{
    console.log(oEvent);
    // let entity = this.tm.getTN("employee_store").getData()
    // let emp_array = [];
    // for(let i=0;i<entity.length;i++)
    // {
    //     if(entity[i].send_reminder == true)
    // {
    //     emp_array.push(entity[i].employee_id);
    // }
    // }
    
    // let employee_entity = await this.txn.getExecutedQuery("d_o2c_employee",{employee_id: Parameters.object.send_reminder})
    // for(let i=0;i<employee_entity.length;i++)
    // {
    //     this.txn.addNotification('employee_invitatoin', employee_entity[i], {
    //         first_name: employee_entity[i].first_name, employee_id: employee_entity[i].employee_id, phone_number: employee_entity[i].phone_number, personal_mail: employee_entity[i].personal_mail, main_url: employee_entity[i].main_url
    //     }, [employee_entity[i].employee_id.toLowerCase()]);
    // }
}
}