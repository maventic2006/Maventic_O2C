import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_calendar")
export default class p_calendar extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter(){
		let roleid =(await this.transaction.get$Role()).role_id;
        this.tm.getTN("control_office").setData({});
        this.tm.getTN("control_office").setData({roler:roleid});
	}
    public async navScreen(){
        this.navTo(({S:'p_o2c_holiday_calend'}));
        
    }
	public navScreenOffice(){
		this.navTo(({S:'p_o2c_office_calenda'}));
        
    }
	
}