import { KloEntitySet } from 'kloBo/KloEntitySet';
import { UserInfo } from 'kloBo/Adm/UserInfo';
import { KloController } from 'kloTouch/jspublic/KloController';
import { d_o2c_so_attachment} from 'o2c_v2/entity_gen/d_o2c_so_attachment';
import {  d_o2c_so_hdr} from 'o2c_v2/entity/d_o2c_so_hdr';
import {  d_o2c_so_status_hrd } from 'o2c_v2/entity_gen/d_o2c_so_status_hrd';
import { d_o2c_so_status_itm } from 'o2c_v2/entity_gen/d_o2c_so_status_itm';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_so_app_flow")
export default class p_o2c_so_app_flow extends KloController{
	public fileup; // variable for taking file data
	public filenm; // variable for taking file name
	public comment_create;
	public entity_status_itm;
	public approve_flag=0;
	public reject_flag=0;
	public button_flag=false;
	
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter(){
		this.setMode("REVIEW");
		//executing query
		this.tm.getTN("query_status_based").setProperty('status','Pending');
        await this.tm.getTN("query_status_based").executeP()

		this.tm.getTN("other_comment").setData({});
		this.tm.getTN("other_comment").getData().user_name = UserInfo.getActiveUser().r_first_name;
		

		//setting the status data
		 this.tm.getTN("mmid_node").setData({status_itm:"Pending"})
		 
		let roleid =(await this.transaction.get$Role()).role_id;
        this.tm.getTN("role_id").setData({});
        this.tm.getTN("role_id").setData({roler:roleid});
		
	}
	
	public async onNav() {
		await this.navTo(({S:"p_o2c_so_app_flow",SS:'pa_header_details'}));
	}
	public async navHomePage() {
		await this.navTo(({S:'p_sales_dashboard'}));
	}
	public async onDownloadCommunicationAttachment(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/comment_list/", ''));
		let document: d_o2c_so_comment = this.tm.getTN("comment_list").getData()[index];
		document.attachment.downloadAttachP();
	}

	public async onDownloadAttachment(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/so_attachment_list/", ''));
		let document: d_o2c_so_attachment = this.tm.getTN("so_attachment_list").getData()[index];
		document.attach_copy.downloadAttachP();
	}
	public async onDownloadPersonalAttach(oEvent: sap.ui.base.Event) {
		let sPath: string = this.getPathFromEvent(oEvent);
		let index = parseInt(sPath.replace("/so_attachment_list/", ''));
		let document: d_o2c_so_attachment = this.tm.getTN("so_attachment_list").getData()[index];
		document.personal_copy.downloadAttachP();
	}
	
	public async approve() {

			let c = 0;
			let entity_1 = await this.tm.getTN('o2c_so_hdr_detail').getData();
			//This query is used to remove the return back status in Pending, Pending with FI, Pending with MD ,(App,Rej) and return back in status hdr table
			let pending_status_hrd = <KloEntitySet<d_o2c_so_status_hrd>>await this.transaction.getExecutedQuery('q_pending_status', { loadAll: true, psoo:entity_1.so});
			let status_hdr_req_no=pending_status_hrd[0].req_no;
			this. entity_status_itm = <KloEntitySet<d_o2c_so_status_itm>>await this.transaction.getExecutedQuery('d_o2c_so_status_itm', { loadAll: true,'so': entity_1.so, 'req_no':status_hdr_req_no })
			let user = ((await this.transaction.get$User()).login_id);
			//set status in status itm tables
			   for (let i = 0; i < this.entity_status_itm.length; i++) {
				
				if ((this.entity_status_itm[i].approved_by).toUpperCase() == (user).toUpperCase())  {
					this.entity_status_itm[i].status = "Approved"
				}
	
				//count how much team head approve it 
				if (this.entity_status_itm[i].status == "Approved") {
					c++;
				}
			
			}
			
			
			let entity_profit = this.tm.getTN('profit_center_list').getData();//some issue in this line
			if ((entity_profit.length)== c && entity_1.type == "SO") {
				pending_status_hrd[0].status = "Pending with FI"
			}
	
			
			//await this.tm.commitP("Approved Successfully", "Save failed", true, true);
			this.approve_flag=1;
			await this.status_check();
			console.log("after changing status")
			this.navTo(({S:"p_o2c_so_app_flow", SS:'pa_o2c_so_hdr_search'}));
			this.onrefreshfun();
			this.setMode("REVIEW");
		}
	
	

	public async onReject() {
		
		let entity_1 = await this.tm.getTN('o2c_so_hdr_detail').getData();
		//This query is used to remove the return back status in Pending, Pending with FI, Pending with MD ,(App,Rej) and return back in status hdr table
       		let pending_status_hrd = <KloEntitySet<d_o2c_so_status_hrd>>await this.transaction.getExecutedQuery('q_pending_status', { loadAll: true, psoo:entity_1.so});
		let status_hdr_req_no=pending_status_hrd[0].req_no;
		this.entity_status_itm = <KloEntitySet<d_o2c_so_status_itm>>await this.transaction.getExecutedQuery('d_o2c_so_status_itm', {loadAll: true,'so': entity_1.so, 'req_no':status_hdr_req_no })
		let user = (await this.transaction.get$User()).login_id;

		for (let i = 0; i < this.entity_status_itm.length; i++) {
			if ((this.entity_status_itm[i].approved_by).toUpperCase()== (user).toUpperCase()) {
				this.entity_status_itm[i].status = "Rejected"
			}
			// team head to be reject it 
			else{
				if(this.entity_status_itm[i].status=="Pending")
				this.entity_status_itm[i].status = ""
			}
		}
		this.reject_flag=1
		//await this.tm.commitP("Rejected Successfully", "Save failed", true, true);
	    await this.status_check()
	    this.navTo(({S:"p_o2c_so_app_flow", SS:'pa_o2c_so_hdr_search'}));
	    this.onrefreshfun();
		this.setMode("REVIEW");
	}

	public async onreturn_back(oEvent){

		let back_count = 0;
		let entity_1 = await this.tm.getTN('o2c_so_hdr_detail').getData();
		//This query is used to remove the return back status in Pending, Pending with FI, Pending with MD ,(App,Rej) and return back in status hdr table
		let entity_status_hdr = <KloEntitySet<d_o2c_so_status_hrd>>await this.transaction.getExecutedQuery('q_pending_status', { loadAll: true, psoo:entity_1.so});
		let status_hdr_req_no=entity_status_hdr[0].req_no;
		this. entity_status_itm = <KloEntitySet<d_o2c_so_status_itm>>await this.transaction.getExecutedQuery('d_o2c_so_status_itm', {loadAll: true,'so': entity_1.so,'req_no': status_hdr_req_no})
		console.log(this.entity_status_itm);
		let user = (await this.transaction.get$User()).login_id;

		for (let i = 0; i < this.entity_status_itm.length; i++) {
			if ((this.entity_status_itm[i].approved_by).toUpperCase() == (user).toUpperCase()) {
				this.entity_status_itm[i].status = "Return Back"
			}
			else{
				if(this.entity_status_itm[i].status=="Pending")
				this.entity_status_itm[i].status =""
			}
			//count how much team head return back it 
			if (this.entity_status_itm[i].status == "Return Back") {
				back_count++;	
			}
		}
		if(back_count>0){
			entity_status_hdr[0].status = "Return Back";
			 entity_1.s_status = "Return Back"
			 entity_status_hdr[0].final_action_by=user;
		}
		await this.tm.commitP("Return Back Successfully", "Save failed", true, true);
		 this.navTo(({S:"p_o2c_so_app_flow", SS:'pa_o2c_so_hdr_search'}));
		 console.log("Navigating")
		//await this.onNavBack(oEvent);
		 this.onrefreshfun();
		 this.setMode("REVIEW");
		
	}
	
	public async status_check() {
		let entity_1 = await this.tm.getTN('o2c_so_hdr_detail').getData();
		let user = ((await this.transaction.get$User()).login_id);
		//let entity_status_hdr = await this.tm.getTN('/status_hdr_list').getData();

		//This query is used to remove the return back status in Pending, Pending with FI, Pending with MD ,(App,Rej) and return back in status hdr table
        let entity_status_hdr = <KloEntitySet<d_o2c_so_status_hrd>>await this.transaction.getExecutedQuery('q_pending_status', { loadAll: true, psoo:entity_1.so});
		let pending=0;
		//let pending = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', { 'so': entity_1.so, 'status': "Pending", 'so_role': "Team" })
		for (let pending_count=0;pending_count<this. entity_status_itm.length;pending_count++){
			if((this.entity_status_itm[pending_count].status=="Pending")&&(this.entity_status_itm[pending_count].so_role=="Team"))
			pending++;
		}
		
		if (pending==0) {
			let reject=0;
			//let reject = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', { 'so': entity_1.so, 'status': "Rejected" })
			for (let reject_count=0;reject_count<this. entity_status_itm.length;reject_count++){
				if(this.entity_status_itm[reject_count].status=="Rejected")
				reject++;
			}
			if (reject) {
				entity_status_hdr[0].status = "Rejected";
				entity_1.s_status = "Rejected"
				entity_status_hdr[0].final_action_by=user;
				console.log(entity_status_hdr[0].status )
			}
			else {
				let pendingFI=0;
				//let pendingFI = await this.transaction.getExecutedQuery('d_o2c_so_status_itm', { 'so': entity_1.so, 'status': "Pending", 'so_role': "Finance" })
				for (let pendingfi_count=0;pendingfi_count<this. entity_status_itm.length;pendingfi_count++){
					if((this.entity_status_itm[pendingfi_count].status=="Pending")&&(this.entity_status_itm[pendingfi_count].so_role=="FINANCE"))
					pendingFI++;
				}
				if (pendingFI==0) {
					entity_status_hdr[0].status = "Approved";
					entity_1.s_status = "Approved";
					entity_status_hdr[0].final_action_by=user;
				}
			}
		}
			await this.onSave();
		
	}

	public async onSave() {
		if(this.approve_flag==1){
		await this.tm.commitP("Approved Successfully", "Approved failed", true, true);
		}
		if(this.reject_flag==1){
			await this.tm.commitP("Rejected Successfully", "Rejected failed", true, true);
		}
		//await this.tm.getTN('so_other').setData(false);
		console.log("Save")
	}
	public async oSave(){
		await this.tm.commitP("Save Successfully", "Save failed", true, true);	
	}
	public async onDisplay(oEvent:sap.ui.base.Event) {
		 this.setMode("DISPLAY");
		//await this.navTo(({S:"p_o2c_so_app_flow", SS:'pa_header_details'}));
	    await this.navTo(({SS:'pa_header_details'}),oEvent)
	}
	public async onGetData(oEvent: sap.ui.base.Event) {
		let path = oEvent.oSource.oPropagatedProperties.oBindingContexts.d_o2c_so_hdr.sPath;
		let index = parseInt(path.replace("/item_detail_list/", ''));
		this.tm.getTN('item_detail_list').setActive(index);
	}
	public async filter_approval() {
	
		this.tm.getTN("query_status_based").setProperty('status','Approved');
        await this.tm.getTN("query_status_based").executeP()
		
		await this.tm.getTN("mmid_node").setData({status_itm:"Approved"});
		await this.tm.getTN("o2c_so_hdr_list").applysortP("SO","ASC");

	}
	public async filter_rejection() {
		
		this.tm.getTN("query_status_based").setProperty('status','Rejected');
        await this.tm.getTN("query_status_based").executeP()
		
		await this.tm.getTN("mmid_node").setData({status_itm:"Rejected"});
		await this.tm.getTN("o2c_so_hdr_list").applysortP("SO","ASC");
		

	}
	public async filter_pending() {
		
		this.tm.getTN("query_status_based").setProperty('status','Pending');
        await this.tm.getTN("query_status_based").executeP()
		
		await this.tm.getTN("mmid_node").setData({status_itm:"Pending"});
		await this.tm.getTN("o2c_so_hdr_list").applysortP("SO","ASC");
	}
	public async filterback(){
		
		this.tm.getTN("query_status_based").setProperty('status','Return Back');
        await this.tm.getTN("query_status_based").executeP()
		
		await this.tm.getTN("mmid_node").setData({status_itm:"Return Back"});
		await this.tm.getTN("o2c_so_hdr_list").applysortP("SO","ASC");

	}
	public async onCreateComment()
	{
		await this.tm.getTN('so_other').setData(true);
		
		await this.tm.getTN("o2c_so_hdr_detail/r_comment").createEntityP({}, "Creation Successful", "Creation Failed", null, "First", true, true, false);
		await this.getDate();
		await this.current_time();
		await this.get_name()
		
	}
	public async current_time()
	{
	
		let time = this.tm.getTN('comment_details').getData();
		time.curr_time = new Date().toLocaleTimeString();
	}
	public async getDate()
	{
	
		let date = this.tm.getTN('comment_details').getData();
		date.mime_type = new Date().toLocaleDateString();
	}
	public get_name()
	{
		let full_name = this.tm.getTN('comment_details').getData();
		let last_name = UserInfo.getActiveUser().r_last_name
		if(last_name == null)
		{
			full_name.user_name = UserInfo.getActiveUser().r_first_name
		}
		else 
			full_name.user_name = UserInfo.getActiveUser().r_first_name+UserInfo.getActiveUser().r_last_name;
	}
	public async onSend()
	{
		let entity = this.tm.getTN("comment_details").getData();
		entity.file_name = entity.attachment.name;
		
		await this.onSave();
		
	}
	public onEdit(){
		this.setMode("EDIT");
	}
	public async other_commant() {
		this.setMode("EDIT");
		let other_comment = this.tm.getTN("other_comment").getData().comment;
		let full_name;
		let last_name = UserInfo.getActiveUser().r_last_name;
		if (last_name == null) {
			full_name = UserInfo.getActiveUser().r_first_name
		}
		else
			full_name = UserInfo.getActiveUser().r_first_name +" "+ UserInfo.getActiveUser().r_last_name;
		let date = new Date().toLocaleDateString();
		let time = new Date().toLocaleTimeString();
		if(other_comment){
		this.comment_create = await this.tm.getTN("comment_list").getData().newEntityP(0, { s_object_type: -1, comment: other_comment, user_name: full_name, curr_time: time, mime_type: date, file_name: this.filenm }, true);
		
		await this.tm.getTN("other_comment").setProperty('comment', null);
		await this.comment_create.attachment.setAttachmentP(this.fileup, this.filenm);
		await this.tm.getTN("other_comment").setProperty('attachment_url', null);
		this.filenm = null;
		this.fileup = null;
	}
	else{
		sap.m.MessageBox.error("Please Write Comment", {
		title: "Error",
		});
	}
		
	}
	public async documentUpload(oEvent) {
		this.fileup = oEvent.mParameters.files[0];
		this.filenm = oEvent.mParameters.files[0].name;
	}
	// refresh the listssssss..
	public async onrefreshfun(){
		this.tm.getTN("query_status_based").setProperty('status','Pending');
        await this.tm.getTN("query_status_based").executeP()
	}
	public onBack(){
		this.setMode("REVIEW")
	}
     
	public check(oEvent){
		if(oEvent.mParameters.selectedKey == 'pa_communication'){
			console.log("Check")
		}

	}
	
		
	}
		//loadAll true
		
	
	
	//endsussssscheck.........
	

