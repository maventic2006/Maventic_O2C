import {q_o2c_emp_current_desig as q_o2c_emp_current_desig_gen} from "o2c_v2/query_gen/q_o2c_emp_current_desig"
export class q_o2c_emp_current_desig extends q_o2c_emp_current_desig_gen{
    public async currentDesignation(Parameters) {
        this.setLoadAll(true);
        Parameters.object.from_date=new Date();
        Parameters.object.to_date=new Date();
}
}