import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_pa_emp_history")
export default class p_pa_emp_history extends KloController{
	
	
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/


    public async onPageEnter(oEvent) {
	    //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
	

		// let qInstance = await this.transaction.getQueryP("q_pa_history_transient"); //this way you can get instance of any query

		

        
		
		// qInstance.setLoadAll(true);
        // // await qInstance.executeP(); //execute here

        let a = []

        let data = {
            total_cost: 0,
            fixed: 0,
            company_bonus: 0,
            total_hike_per: 10.5,
            bonus_ammount: 5000,
            billable_pd: 100,
            next_pa_date: new Date(),
            end_date: new Date(),
            start_date: new Date(),
            designation: "Developer",
            financial_year: "2025 - 2026",
            employee_name: "mayank",
            employee_id: "mm0776",
            pa_his_guid: "planningItem.category_planing_guid"
        };
        a.push(data)
       
        // await qInstance.setResults(a);
        // await qInstance.executeP()

        await this.tm.getTN('pa_his_other').setData(data)

    
    
    }
	
}