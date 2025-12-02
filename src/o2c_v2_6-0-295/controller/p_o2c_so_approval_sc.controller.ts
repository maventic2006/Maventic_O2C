import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_so_attachment } from 'o2c_v2/entity_gen/d_o2c_so_attachment';
import { d_o2c_so_hdr } from 'o2c_v2/entity/d_o2c_so_hdr';
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_o2c_so_approval_sc")
export default class p_o2c_so_approval_sc extends KloController{
	public onInit() {
	}
	public onBeforeRendering() {
		
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	/* public  onAfterAllRendered()
	{
	 this.filterlistapp();
	}
	public async screenEnter(screenIds: string[]){
	await this.filterlistapp();
	}*/
		
	
   /* public async onNav(oEvent:sap.ui.base.Event){ 
		await this.navToByEventss(oEvent,'pa_header_details');
        
       }
	   public async onDownloadAttachment(oEvent:sap.ui.base.Event)
	{
		let sPath: string = (<sap.m.Input>oEvent.getSource()).getBindingContext(this.transaction_name).getPath();
		let document: d_o2c_so_attachment = this.tm.$M.getProperty(sPath);
        document.attach_copy.downloadAttachP();
	}
	public async onDownloadPersonalAttach(oEvent:sap.ui.base.Event)
	{
		let sPath: string = (<sap.m.Input>oEvent.getSource()).getBindingContext(this.transaction_name).getPath();
		let document: d_o2c_so_attachment = this.tm.$M.getProperty(sPath);
        document.personal_copy.downloadAttachP();
	}
	public async approve(){
		
		let c=0;
		let entity_1 = await this.tm.getTN('o2c_so_hdr_detail').getData();
		let entity_status_hdr = await this.tm.getTN('status_hdr_list').getData();
		let entity_status_itm =await this.tm.getTN('status_itm_list').getData();
		let user=await this.transaction.$USER.login_id;
		for(let i=0;i<entity_status_itm.length;i++){
		if((entity_status_itm[i].approved_by)==(user).toUpperCase())
		{
			entity_status_itm[i].status="Approved"
            
		}
		if(entity_status_itm[i].status=="Approved"){
          c++;
		}
	    }
		if(entity_status_itm.length==(c+1) && entity_1.type=="SO")
		{
			entity_status_hdr[0].status="Pending with FI"
		}
		if(entity_status_itm.length==c)
		{
			entity_status_hdr[0].status="Approved";
			entity_1.s_status="Approved"
		}
	    await this.onSave();
		//await this.filterlistapp();
		await this.navToScreenss("p_o2c_so_approval_sc",'pa_o2c_so_hdr_search'); 
		//let list =<KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('q_test',{});
        //await this.tm.getTN("/o2c_so_hdr_list").setData(list);
        //await this.tm.getTN("/o2c_so_hdr_list").Refresh()
		await this.tm.getTN("status_wise").getData().executeP()
		}
	
	public async onSave(){
		await this.tm.commitP("Approved Successfully","Save failed",true,true);
	}
	public async filterlistapp(){
		let user=this.transaction.$USER.login_id;
	
        
		let x=[]
		let hdrlist=[]
		let itmlist = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', {'approved_by':user,'status':"Pending"})
		for(let i=0;i< itmlist.length;i++){
			let req_no= itmlist[i].req_no;
			debugger
			if(user.toUpperCase()=="MM271"){
				hdrlist = await this.transaction.getExecutedQuery('d_o2c_so_status_hrd', { 'req_no':req_no,'status':"Pending with FI"})
				
			}
			else{
				hdrlist = await this.transaction.getExecutedQuery('d_o2c_so_status_hrd', { 'req_no':req_no})
			}
			try{
			let so_no=hdrlist[0].so 
			let hdr = await this.transaction.getExecutedQuery('d_o2c_so_hdr', { 'so':so_no})
           // x[i]=hdr[0];
		   x.push(hdr[0])
			}
			catch(e){}
		}
		//let list =<KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery('q_test',{});
        //await this.tm.getTN("/o2c_so_hdr_list").setData(list);
		await this.tm.getTN('o2c_so_hdr_list').setData(x);

	}
	//edit
	public async onEdits(oEvent:sap.ui.base.Event){ 
		await this.navToByEventss(oEvent,'pa_header_details');
        this.setMode("EDIT");
       }
	   public async onDisplays(oEvent:sap.ui.base.Event){ 
		this.setMode("DISPLAY");
		await this.navToByEventss(oEvent,'pa_header_details');
	}  */
	
}