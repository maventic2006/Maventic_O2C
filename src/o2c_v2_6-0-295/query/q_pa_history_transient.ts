import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_pa_history_transient as q_pa_history_transient_gen } from "o2c_v2/query_gen/q_pa_history_transient"
export class q_pa_history_transient extends q_pa_history_transient_gen {

    public categoryData = [];


    public async pa_emp_history(oEvent) {

        let object = <KloQueryForRule>oEvent.getObject();
        object.setLoadAll(true)
        let txn = oEvent.getTxn();

        // q_pa_history_log1
        //q_emp_salary_data_1
        
        const [qInstance_log, qInstance_cur] = await Promise.all([
            txn.getQueryP('q_pa_history_log'),
            txn.getQueryP('q_emp_salary_data')
        ]);

        qInstance_log.setLoadAll(true);
        qInstance_log.setProperty("employee_id", oEvent.object.employee_id);

         qInstance_cur.setLoadAll(true);
         qInstance_cur.setProperty("employee_id", oEvent.object.employee_id);

        const [esLog, esCur] = await Promise.all([
            qInstance_log.executeP(),
             qInstance_cur.executeP()
        ]);

        await this.dataFit(esLog, esCur, object)
        object.skipDBQueryExecution();
    }

    public async dataFit(es_log, es_cur, object) {
        const results = [];

        const processData = (entries, isLog = false) => {
            for (const entry of entries) {
                const benefits = isLog ? entry.r_salary_hdr_item_log : entry.r_salary_hdr_items;

                const data = {
                    pa_his_guid: isLog ? entry.hdr_log_id : entry.hdr_id,
                    employee_id: entry.employee_id,
                    employee_name: entry.employee_id, // Replace with actual name if needed
                    fixed: entry.fixed,
                    ctc: entry.ctc,
                    start_date: new Date(entry.from_date).getTime(),
                    end_date: new Date(entry.to_date).getTime(),
                    total_hike_per: entry.total_cost_hike_perc,
                    total_cost: entry.total_cost,
                    designation: "designation", // Placeholder
                    performance_bonus: 0,
                    company_bonus: 0,
                    retention_bonus: 0,
                };

                for (const benefit of benefits) {
                    switch (benefit.benefit_id) {
                        case "B11":
                            data.performance_bonus = benefit.actual_amount;
                            break;
                        case "B13":
                            data.company_bonus = benefit.actual_amount;
                            break;
                        case "B12":
                            data.retention_bonus = benefit.actual_amount;
                            break;
                    }
                }

                results.push(data);
            }
        };

        processData(es_log, true);
        processData(es_cur, false);

        await object.setResults(results);
        console.log(results);

    }



}