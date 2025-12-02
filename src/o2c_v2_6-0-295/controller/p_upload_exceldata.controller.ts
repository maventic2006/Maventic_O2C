import { KloController } from 'kloTouch/jspublic/KloController'; 
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_upload_exceldata")
export default class p_upload_exceldata extends KloController{
	public jsonData;
	public entity_name;
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}
	public async onPageEnter() {
		// this.tm.getTN('/excel').setData({});
		// if (!window['XLSX']) {
		// 	// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
		// 	let path = "kloExternal/xlsx.bundle"
		// 	let data = await import(path)
		// }
	}
	public async getWBFromExcelBinary(blobFile: Blob) {
		// return new Promise((resolve, reject) => {
		// 	let fileReader = new FileReader();
		// 	fileReader.onload = async (data) => {
		// 		let result = data.target.result;
		// 		let workbook = XLSX.read(result, {
		// 			type: "binary",
		// 			cellText: false,
		// 			cellDates: true
		// 		});
		// 		resolve(workbook);
		// 	}
		// 	fileReader.readAsBinaryString(blobFile);
		// })
	}
	public async uploadData(file) {

		// let oWorkBook: any = await this.getWBFromExcelBinary(file);
		// this.jsonData = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
		// this.entity_name = oWorkBook.SheetNames[0];
		
	}
	public async docUpload(oEvent) {
		// let oFile = oEvent.mParameters.files[0];
		// this.uploadData(oFile)
	}
	public async insert(){
		// let entity = await this.transaction.getExecutedQuery(this.entity_name, {})
		// for (let i = 0; i < this.jsonData.length; i++) {
		// 	await entity.newEntityP(0, true, this.jsonData[i])
		// }
		// this.tm.commitP("Inserted Successfully","Insertion Failed",false,true);
		// this.getModel().refresh();
	}
}