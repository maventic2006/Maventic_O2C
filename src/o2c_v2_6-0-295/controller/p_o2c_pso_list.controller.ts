import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_pso_list")
export default class p_o2c_pso_list extends KloController {

    public async onPageEnter() {
        let role = (await this.transaction.get$Role()).role_id;
        let user = (await this.transaction.get$User()).login_id;

        const currentDate = new Date();
        const threeMonthsBefore = new Date();
        threeMonthsBefore.setMonth(currentDate.getMonth() - 3);

        let querySearch = this.tm.getTN("provisional_so_search");
        // await querySearch.setProperty('current_date_check', currentDate);
        // await querySearch.setProperty('three_months_before', threeMonthsBefore);
        await querySearch.setProperty('type','PS');
        await querySearch.setProperty('s_status','Approved');

        await querySearch.executeP();
    }

    public async onPreviousButtonNavigation() {
        await this.navTo(({ S: "p_pds_contri_report" }))
    }
    public async onNextButtonNavigation() {
        await this.navTo(({ S: "p_emp_line_graph" }))
    }
}