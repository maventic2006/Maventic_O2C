
import { KloQueryForRule } from "kloBo/KloQueryForRule";
import {q_pa_business_search as q_pa_business_search_gen} from "o2c_v2/query_gen/q_pa_business_search"
export class q_pa_business_search extends q_pa_business_search_gen{

    public async business_pa_search(oEvent) {

        let object = <KloQueryForRule>oEvent.getObject();
        object.setLoadAll(true)
      
    }
}