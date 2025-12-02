import { error } from 'console';
import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_holiday_calendar_hdr } from 'o2c_v2/entity/d_o2c_holiday_calendar_hdr';
import { d_o2c_designation_master } from 'o2c_v2/entity_gen/d_o2c_designation_master';
import { d_o2c_employee_designation } from 'o2c_v2/entity_gen/d_o2c_employee_designation';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_holiday_calend")
export default class p_o2c_holiday_calend extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public async onAfterRendering() {
	
	}
	
	public onExit() {
	}
	/*public async screenEnter(screenIds: string[]){
	 this.setMode("REVIEW");
	 }*/

	 //To avoid old relation is coming in newly created entity
	 public async onAfterSubScreenRender(){
		 await this.tm.getTN("o2c_holid_detail").setActive(); 
	 }
	 public async onPageEnter(){
		let roleid = (await this.transaction.get$Role()).role_id;
        let employeeid = (await this.transaction.get$User()).login_id; 
        await this.tm.getTN("button_visible").setData({});
        let emp_designation = <KloEntitySet<d_o2c_employee_designation>>await this.transaction.getExecutedQuery('q_emp_current_designation', {loadAll: true, des_emp_id: employeeid, fdate: new Date().getTime(), tdate: new Date().getTime() });
        if(emp_designation.length>0){
        let emp_designation_name =<KloEntitySet<d_o2c_designation_master>> await this.transaction.getExecutedQuery('d_o2c_designation_master', {loadAll: true,'designation_id': emp_designation[0].designation});
        let name = emp_designation_name[0].name.toUpperCase();
        roleid = name;
		}
		await this.tm.getTN("button_visible").setProperty('roler',roleid);
		this.setMode("REVIEW");
	 }
			 
		 
	 //duplicate id
	 public async duplicate_id(){
		let entity= this.tm.getTN('o2c_holid_detail').getData();
		//let id=entity.holiday_calender_id;
        //entity.holiday_calender_id=id.toUpperCase();
		let q=await this.transaction.getExecutedQuery('d_o2c_holiday_calendar_hdr',{loadAll: true,'holiday_calender_id':entity.holiday_calender_id})
		if(q.length){
 			//sap.m.MessageToast.show("This Holiday ID is already exist",{duration:400});
			 sap.m.MessageBox.error("This Calendar ID is already exist", {title: "Error", actions:[sap.m.MessageBox.Action.CANCEL ],
                onClose:(oAction)=>{ 
			if(oAction=="CANCEL"){ 
				entity.holiday_calender_id=null
				this.tm.getTN("o2c_holid_detail").refresh()
			}}})
		}
	 }
   
   public async createHoliday(){
    await this.navTo(({S:"p_o2c_holiday_calend",SS:"pa_creation"}));
	
	await this.tm.getTN("o2c_holida_list").createEntityP({},null,"Creation Failed",null,"First",true,true);
    //await this.tm.getTN("o2c_holid_detail/r_holiday").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
	}
	public async onSave(){
		await this.tm.getTN("o2c_holid_detail").getData().validateP();
		await this.tm.getTN("relation_holiday").refresh();
		let holiday_data=await this.tm.getTN("relation_holiday").getData().length;
		if(holiday_data==0){
			sap.m.MessageBox.error("You have not enter any holiday , Please enter the holiday before saving", {title: "Error", actions:[sap.m.MessageBox.Action.CANCEL ],
			})
		}
		else{
		await this.tm.commitP("Successfully Saved","Save failed",true,true);
		//await this.transaction.commitP()
		console.log("Check mode")
		if(this.getMode()=="DISPLAY"){
		await this.tm.getTN("relation_holiday").applysortP("holiday_date","ASC")
		sap.m.MessageBox.confirm("Are you sure you want to stay in this page", {
            title: "Confirm",
            actions: [ sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO ],
                onClose:(oAction)=>{ 
                    if(oAction=="YES"){
                    
                    this.navTo(({S:"p_o2c_holiday_calend",SS:'pa_creation'}));
				   }
				   if(oAction=="NO"){
                    
                     this.navTo(({S:'p_calendar'}));
				   }

                }})
			}
		}
			
			
		}
		
		
	 
	public async cancel(){
	
			await this.transaction.rollback();
			await this.tm.getTN("o2c_holid_detail").refresh();
		    await this.navTo(({S:"p_o2c_holiday_calend",SS:'pa_o2c_button'}));
			this.setMode("REVIEW");

	   }
	   public async onEdit(oEvent:sap.ui.base.Event){
		await this.navTo(({SS:'pa_creation'}),oEvent)
	
        this.setMode("EDIT");
       }
	   public async detail_Edit(){ 
        this.setMode("EDIT");
	   }

	   public async onDisplay(oEvent:sap.ui.base.Event){ 
		this.setMode("DISPLAY");
		await this.navTo(({SS:'pa_creation'}),oEvent)
	   }
	   

	  /*  public async onAddSerial(){
		let entity=this.tm.getTN('/relation_holiday').getData()
	    let total_row=this.tm.getTN('/relation_holiday').getLength()
	    for(let inital=0;inital<total_row;inital++){
			entity[inital].serial_no=inital+1;
		}
		//await this.tm.commitP("Successfully Saved","Save failed",true,true);
		await this.transaction.commitP()
			
	} */
	public async onDelete(){
		
		
		let detail:d_o2c_holiday_calendar_hdr=this.tm.getTN('o2c_holid_detail').getData();
		let q = await this.transaction.getExecutedQuery('d_o2c_office_calendar',{loadAll: true,'holiday_calender_id':detail.holiday_calender_id})
		if(q.length){
			sap.m.MessageBox.warning("This Holiday Calendar ID cannot be deleted because it is used in the office calendar", {
				title: "Warning"})
		}
		else{
		//confirmination box for delete
		sap.m.MessageBox.confirm("Are you sure you want to delete this calendar", {
            title: "Confirm",
            actions: [ sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO ],
                onClose:(oAction)=>{ 
                    if(oAction=="YES"){
                    
                    this.delete();
				   }
				   if(oAction=="NO"){
					this.navTo(({S:"p_o2c_holiday_calend",SS:'pa_creation'})); 
                     
				   }

        }})
		
	}
   }
   public async delete(){
	let detail:d_o2c_holiday_calendar_hdr=this.tm.getTN('o2c_holid_detail').getData();
	debugger
	let rel_data_list=await detail.r_holiday.fetch();
	for(let i=(rel_data_list.length-1);i>=0;i--){
		await rel_data_list[i].deleteP();
		}
		await detail.deleteP()
	
		await this.navTo(({S:'p_o2c_holiday_calend',SS:'pa_o2c_button'}));
		await this.tm.commitP("Deleted Successfully","Save failed",true,true);
   }
	public async homepage(){
	await this.navTo(({S:'p_o2c_holiday_calend',SS:'pa_o2c_button'}));
	this.setMode("REVIEW");

     }
	 public async dashboard(){
		this.navTo(({S:'p_calendar'}));
	 }
	 public async addHoliday()
	 {
		let holiday_id=await this.tm.getTN("o2c_holid_detail").getData().holiday_calender_id;
		if(holiday_id)
		await this.tm.getTN("o2c_holid_detail/r_holiday").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
	    else
		sap.m.MessageBox.warning("Please first enter the calendar detail", {
			title: "Warning"})
	}
}
//loadAll true