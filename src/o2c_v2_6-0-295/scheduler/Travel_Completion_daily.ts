import kloScheduler from 'kloBo/kloScheduler/KloScheduler'
import { KloEntitySet } from 'kloBo/KloEntitySet'
import { KloTransaction } from 'kloBo/KloTransaction'
import { d_o2c_travel_header } from 'o2c_v2/entity_gen/d_o2c_travel_header'
import { d_o2c_travel_journey } from 'o2c_v2/entity_gen/d_o2c_travel_journey'
import { d_second_role_assyn } from 'o2c_v2/entity_gen/d_second_role_assyn'
export class Travel_Completion_daily extends kloScheduler {
    public async onExecute() {
        return new Promise(res => {
            setTimeout(async () => {
                let notif_cc = new Set();
                const today = new Date();
                const fourDaysAgo = new Date(today.setDate(today.getDate() - 4));
                let txn: KloTransaction = this.eventContext.getTxn()
                let employee_entity = await txn.getExecutedQuery("d_o2c_employee", {loadAll: true })
                let travel_list = <KloEntitySet<d_o2c_travel_header>>await txn.getExecutedQuery('d_o2c_travel_header', { s_status:"Approved by Travel Desk",loadAll:true})
                let journey_list = <KloEntitySet<d_o2c_travel_journey>>await txn.getExecutedQuery('d_o2c_travel_journey', {loadAll:true})
                let travel_desk_list = <KloEntitySet<d_second_role_assyn>>await txn.getExecutedQuery('d_second_role_assyn', { assyned_role: "TD",page_name: "Travel Page", loadAll: true });
				for (let i = 0; i < travel_desk_list.length; i++) {
					notif_cc.add(travel_desk_list[i].employee_id);
				}
                const notif_cc_array = Array.from(notif_cc);
			for (let i = 0; i < notif_cc_array.length; i++) {
				notif_cc_array[i] = notif_cc_array[i].toLowerCase();
			}
                let rightnow=(new Date())?.getTime()
                for (let i = 0; i < travel_list.length; i++) {
                    if(travel_list[i].travel_end_date){
                        if((travel_list[i].travel_end_date).getTime()<rightnow){
                            const filtered_journey=journey_list.applyFilterP("request_id",travel_list[i].request_id)
                            if(filtered_journey.length && filtered_journey.length>1 && filtered_journey[0].from_location==filtered_journey[filtered_journey.length-1].to_location){
                            const filteredData = employee_entity.filter(item => item.employee_id === travel_list[i].employee_id_for);
                            travel_list[i].s_status="Travel Completed";
            let first_name = filteredData[0].first_name;
            txn.addNotification('travel_complete', filteredData[0], {
                first_name: first_name,
                request: travel_list[i].request_id,
            }, [travel_list[i].employee_id_for.toLowerCase()],notif_cc_array);
                        }
                    }
                }
            }
                for(let j=0;j<journey_list.length;j++){
                    if(journey_list[j].mail_sent!=true &&fourDaysAgo.getTime()>=journey_list[j].departure.getTime()&&journey_list[j].ticket_required!=true){
                        const filteredTravel = travel_list.filter(item => item.request_id === journey_list[j].request_id);
                        if(filteredTravel.length>0){
                        if(filteredTravel[0].s_status=="Approved by Travel Desk"){
                        const filteredData = employee_entity.filter(item => item.employee_id === filteredTravel[0].employee_id_for);
                        journey_list[j].mail_sent=true;
            let first_name = filteredData[0].first_name;
            txn.addNotification('ticket_reminder', filteredData[0], {
                first_name: first_name,
                from_location: journey_list[j].from_location,
                to_location: journey_list[j].to_location,
                request: filteredTravel[0].request_id,
            }, [filteredTravel[0].employee_id_for.toLowerCase()],notif_cc_array);
                    }
                }}}
                await txn.commitP()
                 res('travel_daily_completion' + new Date().toLocaleString())
            }, 30000)
        })
    }
}