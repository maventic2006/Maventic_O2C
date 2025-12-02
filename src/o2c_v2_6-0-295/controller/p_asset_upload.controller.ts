import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { AUTHORIZATION_TYPE, KloAjax } from 'kloBo/kloCommon/KloAjaxHandler';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_upload")
export default class p_asset_upload extends KloController {

    public jsonData;
    public jsonDataDoc;
    public jsonDataDesig;
    public jsonDataOrg;
    public jsonDataDesigMastr;
    public jsonDataSales;
    public jsonDataCustomer;
    public jsonDataCustomerDoc;
    public jsonDataCustomerOrg;
    public jsonDataCustomerMap;
    public jsonDataAddress;
    public jsonDataCustomerContact;
    public entity_name;
    public entity_name_customer;
    public entity_name_customer_doc;
    public entity_name_customer_org;
    public entity_name_customer_map;
    public entity_name_address
    public entity_name_customer_contact;
    public jsonDataLeaveHistory;
    public entity_name_leave_history
    public jsonDataLeaveQuota;
    public entity_name_leave_quota;
    public task_assignment;
    public entity_task_assign;
    public mail_json;

    public jsonTag;
    public entity_jsonTag;

    public jsonSalaryData;
    public salarySheetData;


    public jsonScrapping;
    public entity_jsonScrapping;

    public jsonAllocation;
    public entity_jsonAllocation;

    public jsonCreation;
    public entity_jsonCreation;


    public jsonAmc;
    public entity_jsonAmc;

    public loginID;
    public code;
    public _resolveLoginPromise;

    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter() {
        if (!window['XLSX']) {
            // await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
            let path = "kloExternal/xlsx.bundle"
            let data = await import(path)
        }
    }
    public async getWBFromExcelBinary(blobFile: Blob) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onload = async (data) => {
                let result = data.target.result;
                let workbook = XLSX.read(result, {
                    type: "binary",
                    cellText: false,
                    cellDates: true
                });
                resolve(workbook);
            }
            fileReader.readAsBinaryString(blobFile);
        })
    }
    //EMPLOYEE//
    public async docUpload(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonData = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_name = oWorkBook.SheetNames[0];
        // console.log(this.jsonData)
        // console.log(this.entity_name)
    }

    // mAsset SCRAPPING 

    public async uploadData_scraping(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonScrapping = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_jsonScrapping = oWorkBook.SheetNames[0];
        console.log(this.jsonScrapping)
        console.log(this.entity_jsonScrapping)
    }

    public async insertData_scraping() {
        if (this.entity_jsonScrapping === "d_asset_scrapping") {
            let entity = await this.transaction.getExecutedQuery(this.entity_jsonScrapping, {})
            for (let i = 0; i < this.jsonScrapping.length; i++) {

                await entity.newEntityP(0, this.jsonScrapping[i], true)
            }
            try {
                // this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
                await this.retrySave("Inserted Successfully", "Insertion Failed");
            } catch (e) {
                await this.transaction.rollback();
            }
            this.jsonScrapping = [];
            this.entity_jsonScrapping = "";
        }
        else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }
    }

    // allocation



    public async uploadData_allocation(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonAllocation = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_jsonAllocation = oWorkBook.SheetNames[0];
        console.log(this.jsonAllocation)
        console.log(this.entity_jsonAllocation)
    }

    public async insertData_allocation() {
        if (this.entity_jsonAllocation === "d_asset_allocation_request") {
            let entity = await this.transaction.getExecutedQuery(this.entity_jsonAllocation, {})
            for (let i = 0; i < this.jsonAllocation.length; i++) {

                await entity.newEntityP(0, this.jsonAllocation[i], true)
            }
            try {
                // this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
                await this.retrySave("Inserted Successfully", "Insertion Failed");
            } catch (e) {
                await this.transaction.rollback();
            }
            this.jsonAllocation = [];
            this.entity_jsonAllocation = "";
        }
        else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }
    }

    // creation



    public async uploadData_creation(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonCreation = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_jsonCreation = oWorkBook.SheetNames[0];
        console.log(this.jsonCreation)
        console.log(this.entity_jsonCreation)

    }

    public async insertData_creation() {
        if (this.entity_jsonCreation === "d_asset_creation") {
            let entity = await this.transaction.getExecutedQuery(this.entity_jsonCreation, {})
            for (let i = 0; i < this.jsonCreation.length; i++) {

                await entity.newEntityP(0, this.jsonCreation[i], true)
            }
            try {
                // this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
                await this.retrySave("Inserted Successfully", "Insertion Failed");
            } catch (e) {
                await this.transaction.rollback();
            }
            this.jsonCreation = [];
            this.entity_jsonCreation = "";
        }
        else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }
    }


    // amc details



    public async uploadData_amc(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonAmc = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_jsonAmc = oWorkBook.SheetNames[0];
        console.log(this.jsonAmc)
        console.log(this.entity_jsonAmc)
    }

    public async insertData_amc() {
        if (this.entity_jsonAmc === "d_amc_table") {
            let entity = await this.transaction.getExecutedQuery(this.entity_jsonAmc, {})
            for (let i = 0; i < this.jsonAmc.length; i++) {

                await entity.newEntityP(0, this.jsonAmc[i], true)
            }
            try {
                // this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
                await this.retrySave("Inserted Successfully", "Insertion Failed");
            } catch (e) {
                await this.transaction.rollback();
            }
            this.jsonAmc = [];
            this.entity_jsonAmc = "";
        }
        else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }
    }

    //mAsset tag upload

    public async upload_tag(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonTag = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
        this.entity_jsonTag = oWorkBook.SheetNames[0];
        console.log(this.jsonTag)
        console.log(this.entity_jsonTag)

    }
    public async insert_Tag() {
        if (this.entity_jsonTag === "d_asset_creation") {
            let entity = await this.transaction.getExecutedQuery(this.entity_jsonTag, {})
            // Create a Set for fast lookup

            let matchingEntities = [];
            let nonMatchingEntities = [];

            for (let i = 0; i < entity.length; i++) {
                if (this.jsonTag.has(entity[i].asset_number)) {
                    entity[i].tag_number = this.jsonTag[i].tag_number;
                    entity[i].serial_number = this.jsonTag[i].tag_number.serial_number;
                    matchingEntities.push(entity[i]);
                } else {
                    nonMatchingEntities.push(entity[i]);
                }
            }

            console.log("✅ Matching:", matchingEntities);
            console.log("❌ Not Matching:", nonMatchingEntities);

            try {
                // this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
            } catch (e) {
                await this.transaction.rollback();
            }
            this.jsonTag = [];
            this.entity_jsonTag = "";
        }
        else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }
    }

    // Asset Format Download
    public async download_tag_excel() {

        const data = [
            ["asset_number", "tag_number", "serial_number"],
            ["", "", ""]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AssetData");
        XLSX.writeFile(workbook, "asset_upload_template.xlsx");

    }
    public async retrySave(sSuccessMessage: string, sErrMessage: string) {
        // Retry logic for commit operation
        let retryCount = 0;
        const maxRetries = 5;
        let commitSuccess = false;

        while (retryCount < maxRetries && !commitSuccess) {
            try {
                await this.tm.commitP(sSuccessMessage, sErrMessage, true, true);
                commitSuccess = true;
            } catch (error) {
                retryCount++;
                console.log(`Commit attempt ${retryCount} failed:`, error?.stack ?? error?.message ?? error);

                if (retryCount >= maxRetries) {
                    sap.m.MessageToast.show(`Failed to upload after ${maxRetries} attempts. Please try again.`);
                    throw error;
                }
                // Wait before retrying (exponential backoff: 500ms, 1s, 2s, 4s)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            }
        }
    }
}
//25 Nov 12:21PM