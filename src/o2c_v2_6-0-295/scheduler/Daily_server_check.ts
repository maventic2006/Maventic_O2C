import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloTransaction } from 'kloBo/KloTransaction'
import { getServerResponses } from 'o2c_v2/util/getServerResponses'
// import { System } from 'kloBo/kloCommon/System/System';
export class Daily_server_check extends kloScheduler {
    public async onExecute() {
        debugger;
        return new Promise(res => {
            setTimeout(async () => {
                try {

                    let txn: KloTransaction = this.eventContext.getTxn();
                    // let employee_entity = await txn.getExecutedQuery("d_o2c_employee", {employee_id:"mm0719",loadAll: true })
                    let employee_entity = await txn.getExecutedQuery("d_o2c_employee", { loadAll: true });
                    let currentPercent = await txn.getExecutedQuery("d_general_confg", { key: "response_failed_rate", loadAll: true });

                    // let System = await import('kloBo/kloCommon/System/System');
                    // let res = await KloAjax.getInstance().perFormAction(AUTHORIZATION_TYPE.RUNTIME, {
                    //     url: System.System.gi_URI().getAppServiceUrl(this.operatingFlavor, this.operatingFlavorVersion, "getServerHealth1", true),
                    //     method: "GET"
                    // });
                    let res = await getServerResponses.getServerResponse();
                    // let statusCode = res.status;
                    if (res.data) {
                        // const filteredData = res.data.filter(entry => entry.successfulTransactions < entry.failedTransactions);
                        const filteredData = res.data.data.filter(entry =>
                            entry.failedTransactions > (entry.apiTransactionCount * parseFloat(currentPercent[0].high_value)) / 100
                        );
                        // if (filteredData.length > 0) {
                        const names = filteredData.map(entry => entry.name);
                        const ids = filteredData.map(entry => entry._id);

                        // emp to send mail
                        let check_q = await txn.getQueryP("d_general_confg");
                        check_q.key_LIKE = "%serverdown_count%";
                        let emp_ids_config = await check_q.executeP();
                        let emp_ids = [];
                        emp_ids_config.forEach(entry => {
                            emp_ids.push(entry.high_value);
                        });

                        const filteredEmpEntity = employee_entity.filter(employee =>
                            emp_ids.some(id => id.toLowerCase() === employee.employee_id.toLowerCase()));

                        for (let i = 0; i < filteredEmpEntity.length; i++) {

                            txn.addNotification('server_failed_count_mail', filteredEmpEntity[i], {
                                first_name: filteredEmpEntity[i].first_name
                            }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
                            await txn.commitP();

                        }

                        // }

                    } else {

                        let check_q = await txn.getQueryP("d_general_confg");
                        check_q.key_LIKE = "%serverdown%";
                        let emp_ids_config = await check_q.executeP();
                        const emp_ids = emp_ids_config.map(entry => entry.low_value);

                        const filteredEmpEntity = employee_entity.filter(employee =>
                            emp_ids.some(id => id.toLowerCase() === employee.employee_id.toLowerCase()));

                        for (let i = 0; i < filteredEmpEntity.length; i++) {

                            txn.addNotification('server_health_mail', filteredEmpEntity[i], {
                                first_name: filteredEmpEntity[i].first_name
                            }, [filteredEmpEntity[i].employee_id.toLowerCase()]);
                            await txn.commitP();

                        }

                    }
                } catch (error) {
                    console.error('Error in Server Check scheduler', error);
                    res('daily_server_check' + new Date().toLocaleString())
                }

            }, 30000)
        })
    }
}