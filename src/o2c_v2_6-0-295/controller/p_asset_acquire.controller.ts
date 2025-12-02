import { KloEntitySet } from 'kloBo_7-2-76';
import {KloController} from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_asset_acquire")
export default class p_asset_acquire extends KloController{
	public userid
	
	public async onPageEnter() {

		this.userid = (await this.transaction.get$User()).login_id;
		if (this.userid) {

			this.tm.getTN("search").setProperty('user_id', this.userid);

			await this.tm.getTN("search").executeP();
		} else {

			this.tm.getTN("search").setProperty('user_id', "this.userid");

			await this.tm.getTN("search").executeP();
		}


		this.tm.getTN('mantees_dropdown').setData({});


		this.tm.getTN('mantees_select').setData({});

		let vi = true;
		let size;
		let employeeArray = []
		let current_date = new Date();
		current_date.setHours(0, 0, 0, 0);
		let tempsize = 0;
		let tempArray = [this.userid = (await this.transaction.get$User()).login_id];
		tempArray[0] = this.userid;

		let mp = new Map();

		let flag = true;

		while (vi) {
			let managerList = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('q_line_manager_h_list', { line_manager: tempArray, loadAll: true })
			tempArray = [];
			for (let employee of managerList) {
				size = mp.set(employee.employee_id, employee.employee_id)
				if (size.size > tempsize) {
					employeeArray.push({ employee_id: employee.employee_id, employee_name: employee.full_name });
					tempArray.push(employee.employee_id);
				}
				tempsize = size.size;
			}
			
			if (managerList.length == 0) {
				vi = false;
			}
		}


		employeeArray.push({ employee_id: this.userid, employee_name: this.userid });
		this.tm.getTN('mantees_dropdown').setData(employeeArray);


	}
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
	

	public async on_mantee_select() {

		let oBusyDailog = new sap.m.BusyDialog().setText("Data Fetching...");
		oBusyDailog.open();
		let mantees = await this.tm.getTN('mantees_select').getData()

		

			if(mantees.mantees ==''){
				this.tm.getTN("search").setProperty('user_id', this.userid);

				await this.tm.getTN("search").executeP();
			}else{
				this.tm.getTN("search").setProperty('user_id', mantees.mantees);

				await this.tm.getTN("search").executeP();
			}
			oBusyDailog.setText("Fetched");
			if(await this.tm.getTN("acquire_list").getData().length == 0){
				sap.m.MessageToast.show("No Data Available.", { duration: 5000 });

			}
			oBusyDailog.close()
	}

}