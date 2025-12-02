import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_credit_note")
export default class p_o2c_credit_note extends KloController {

    /*public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }*/

    public async onNavigateToCreditNoteItemScreen(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/credit_note_header_list/", ''))
        await this.tm.getTN("credit_note_header_list").setActive(index);
        await this.navTo(({ S: "p_o2c_credit_note", SS: "pa_credit_note_item" }))
    }

    public async creditNotePDFDownload(oEvent) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/credit_note_header_list/", ''))

        let creditNoteData = await this.tm.getTN("credit_note_header_list").getData();

        await creditNoteData[index].credit_note_pdf.downloadAttachP();
    }
}