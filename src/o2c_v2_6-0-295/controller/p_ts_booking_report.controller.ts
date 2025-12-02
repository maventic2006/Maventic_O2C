import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
import { System } from 'kloBo/kloCommon/System/System';
import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_ts_booking_report")
export default class p_ts_booking_report extends KloController{
	
	public async onPageEnter() {
	   await this.tm.getTN("selected_month").setData({});
       await this.tm.getTN("employee_id").setData({});
	}
	
	/*public async onPageModelReady() {
	    //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
	}*/
	
	/*public async onPageExit() {
   	//This event will be called in the source screen whenever the developer navigates to a different screen.
	}*/
    public async onSearch(){

        let selected_month = this.tm.getTN("selected_month").getData().month;
        let employee_id = this.tm.getTN("employee_id").getData();

        const selectedDate = new Date(selected_month);
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        endDate.setDate(endDate.getDate() + 1);


        await this.tm.getTN("booking_search").setProperty('employee_id', employee_id);
        await this.tm.getTN("booking_search").setProperty('start_date', startDate);
        await this.tm.getTN("booking_search").setProperty('end_date', endDate);
        await this.tm.getTN("booking_search").executeP();
    }
    public async onSave(){
        let clist =  this.tm.getTN("booking_list").getData();
        // let list =  this.tm.getTN("booking_detail/r_booking_to_task_tr").getData();
        // let blist =  this.tm.getTN("booking_emp_list").getData()
        
        // let alist =  this.tm.getTN("booking_detail").getData().r_booking_to_task_tr;
        for(let i=0; i<clist.length; i++){
            // clist[i] = new Date(clist[i].booking_date).se;
            clist[i].booking_date = new Date(clist[i].booking_date).setHours(0,0,0,0);
        }
        await this.tm.commitP("Saved", "Saved failed", false, true);
    }
    // public async onServerApiCall(){
    //     var that = this; 
    //     let res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
    //         url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getServerHealth1", true),
    //         method: "GET"
    //     });
    //     let statusCode = res.status;
    //     if(res.data){
    //         const filteredData = res.data.filter(entry => entry.successfulTransactions < entry.failedTransactions);
    //         if(filteredData.length > 0){
    //             const names = filteredData.map(entry => entry.name);
    //             const ids = filteredData.map(entry => entry._id);
    //         }
            
    //     }else{

    //     }
    //     let employee_entity = await this.transaction.getExecutedQuery("d_o2c_employee", {loadAll: true })
    //     let emp_id = await this.transaction.getExecutedQuery("q_server_check", {server_key:"%serverdown%",loadAll: true })
    //     // let check_q = await this.transaction.getQueryP("q_server_check");
    //     // check_q.key_LIKE = "%serverdown%"; 
    //     // let emp_id = await check_q.executeP();



    //     const filteredEmpEntity = employee_entity.filter(entry => 
    //         entry.employee_id.toLowerCase() === emp_ids[0].low_value.toLowerCase()
    //       );

    //     for (let i = 0; i < filteredEmpEntity.length; i++) {

    //         this.transaction.addNotification('server_health_mail', filteredEmpEntity[i], {
    //             first_name: filteredEmpEntity[i].first_name
    //         }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
    //         await this.transaction.commitP();

    //     }
    // }
    public async onServerApiCall(){

        let employee_entity = await this.transaction.getExecutedQuery("d_o2c_employee", {loadAll: true });

        let res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
            url: System.gi_URI().getAppServiceUrl(this.getFlavor(), this.getFlavorVersion(), "getServerHealth1", true),
            method: "GET"
        });
        let statusCode = res.status;
        if(res.isOk){
            // const filteredData = res.data.filter(entry => entry.successfulTransactions < entry.failedTransactions);
            let responseData = res.data.data;
            let currentPercent = await this.transaction.getExecutedQuery("d_general_confg", {key:"response_failed_rate", loadAll: true })
            const filteredData = responseData.filter(entry => 
                entry.failedTransactions > (entry.apiTransactionCount * currentPercent[0].high_value) / 100
            );
            // if(filteredData.length > 0){
                const names = filteredData.map(entry => entry.name);
                const ids = filteredData.map(entry => entry._id);

                // emp to send mail
                let check_q = await this.transaction.getQueryP("d_general_confg");
                check_q.setLoadAll(true);
                check_q.key_LIKE = "%serverfail_count%"; 
                let emp_ids_config = await check_q.executeP();
                const emp_ids = emp_ids_config.map(entry => entry.high_value);

                const filteredEmpEntity = employee_entity.filter(employee =>
                emp_ids.some(id => id.toLowerCase() === employee.employee_id.toLowerCase()));

                for (let i = 0; i < filteredEmpEntity.length; i++) {

                    this.transaction.addNotification('server_failed_count_mail', filteredEmpEntity[i], {
                        first_name: filteredEmpEntity[i].first_name
                    }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
                    await this.transaction.commitP();
        
                } 

            // }
            
        }else{

            let check_q = await this.transaction.getQueryP("d_general_confg");
            check_q.setLoadAll(true);
            check_q.key_LIKE = "%serverdown%"; 
            let emp_ids_config = await check_q.executeP();
            const emp_ids = emp_ids_config.map(entry => entry.high_value);

            const filteredEmpEntity = employee_entity.filter(employee =>
            emp_ids.some(id => id.toLowerCase() === employee.employee_id.toLowerCase()));

            for (let i = 0; i < filteredEmpEntity.length; i++) {

                this.transaction.addNotification('server_health_mail', filteredEmpEntity[i], {
                    first_name: filteredEmpEntity[i].first_name,
                    statusCode: res.statusCode
                }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
                await this.transaction.commitP();
    
            }

        }






        let check_q = await this.transaction.getQueryP("d_general_confg");
        check_q.setLoadAll(true);
            check_q.key_LIKE = "%serverdown%"; 
            let emp_ids_config = await check_q.executeP();
            const emp_ids = emp_ids_config.map(entry => entry.high_value);

            const filteredEmpEntity = employee_entity.filter(employee =>
            emp_ids.some(id => id.toLowerCase() === employee.employee_id.toLowerCase()));

            for (let i = 0; i < filteredEmpEntity.length; i++) {

                this.transaction.addNotification('server_health_mail', filteredEmpEntity[i], {
                    first_name: filteredEmpEntity[i].first_name
                }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
                await this.transaction.commitP();
    
            }

        // for (let i = 0; i < filteredEmpEntity.length; i++) {

        //     this.transaction.addNotification('server_health_mail', filteredEmpEntity[i], {
        //         first_name: filteredEmpEntity[i].first_name
        //     }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
        //     await this.transaction.commitP();

        // }
        // for (let i = 0; i < filteredEmpEntity.length; i++) {

        //     this.transaction.addNotification('server_failed_count_mail', filteredEmpEntity[i], {
        //         first_name: filteredEmpEntity[i].first_name
        //     }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
        //     await this.transaction.commitP();

        // }
        
    }

    // public async onServerApiCall() {
    //     const apiUrl = 'https://api.example.com/endpoint'; // Define the API URL here
    //     try {
    //         const response = await fetch(apiUrl);
    //         if (response.ok) {
    //         console.log(`API is working fine. Status: ${response.status}`);
    //         } else {
    //         console.error(`API returned an error. Status: ${response.status}`);
    //         }
    //     } catch (error) {
    //         console.error(`Failed to call API. Error: ${error.message}`);
    //     }
    // }
	
}