import {q_o2c_logged_sal_reimburse as q_o2c_logged_sal_reimburse_gen} from "o2c_v2/query_gen/q_o2c_logged_sal_reimburse"
export class q_o2c_logged_sal_reimburse extends q_o2c_logged_sal_reimburse_gen{
    public async finYearCal(Parameters :eventContext){
        const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // January = 0
  Parameters.object.fy_year= month >= 3
    ? `${year}`
    : `${year - 1}`;
    }
}