import { KloEntitySet } from 'kloBo_7-2-84';
import {KloController} from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
import { d_o2c_employee_org } from 'o2c_v2/entity_gen/d_o2c_employee_org';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_pa_category_plan")
export default class p_pa_category_plan extends KloController{

    public userid;
	
	public async onPageEnter() {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	
    	this.userid = (await this.transaction.get$User()).login_id;
    //     let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.transaction.getExecutedQuery('d_o2c_employee_org', { employee_id: this.userid, loadAll: true })


    //      // Retrieving business Center of the login Employee
    //     const emp_org_business = new Map();
    //     let emp_org_business_array = [];
	// 	for (let emp_item of emp_org) {
	// 		emp_org_business.set(emp_item.business_area, await emp_item.business_area_vh.description)
    //         emp_org_business_array.push({ key: emp_item.business_area, value: await emp_item.business_area_vh.additional_desc });
	// 	}
    //    // converting business area map to array
    //     emp_org_business_array = Array.from(emp_org_business, ([b_key, b_value]) => ({ b_key, b_value }));

    //     console.log(emp_org_business_array)
    //     console.log(emp_org)

    //     // Retrieving Profit Center of the login Employee
    //     const emp_org_profit = new Map();
    //     let emp_org_profit_array = [];
	// 	for (let emp_item of emp_org) {
	// 		emp_org_profit.set(emp_item.profit_centre, await emp_item.profit_centre_vh.description)
	// 	}

    //     emp_org_profit_array = Array.from(emp_org_profit, ([b_key, b_value]) => ({ b_key, b_value }));

    //     console.log(emp_org_profit_array)
    //     // setting business area to other type transnode


    await this.tm.getTN('search_other').setData({})
    this.tm.getTN('search_other').setProperty("business_area","MVB2")


    }
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	
}