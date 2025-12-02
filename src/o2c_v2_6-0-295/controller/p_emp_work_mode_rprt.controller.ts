import { KloEntitySet } from 'kloBo_7-2-219/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_emp_work_mode_rprt")
export default class p_emp_work_mode_rprt extends KloController {
    public jsonEmployeeData;
    public entity_name;
    public async onPageEnter() {
        //     //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
        if (!window['XLSX']) {
            // await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
            let path = "kloExternal/xlsx.bundle"
            let data = await import(path)
        }
    }

    /*public async onPageModelReady() {
        //This event will be called when the model is created and the transnodes are initialized, but the Data is not set to the model yet.
    }*/

    /*public async onPageExit() {
          //This event will be called in the source screen whenever the developer navigates to a different screen.
    }*/
    public async downloadExcelFormat() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait, Data is fetching..."
        });
        busyDialog.open();

        // Check if XLSX is loaded, if not, dynamically import it
        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        // Sample data that needs to be added to the first sheet (d_o2c_employee_salary_hdr)
        let jsonDataHdr = [];
        jsonDataHdr.push({
            'employee_id': '',
            'work_mode': '',

        });

        // Create the first sheet (d_o2c_employee_salary_hdr)
        const worksheetHdr = XLSX.utils.json_to_sheet(jsonDataHdr);
        const workbook = XLSX.utils.book_new();

        // Set column widths for the first sheet
        worksheetHdr['!cols'] = [
            { width: 20 },
            { width: 20 },
        ];

        // Set header styles for the first sheet
        const headerCellsHdr = ["A1", "B1"];
        headerCellsHdr.forEach(cell => {
            worksheetHdr[cell].s = { fill: { fgColor: { rgb: "FFFF00" } } }; // Yellow background for header
        });

        // Append the first sheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheetHdr, "d_o2c_employee");


        // Write the workbook to a file
        const filePath = 'work_format.xlsx';
        XLSX.writeFile(workbook, filePath, { bookSST: true });

        // Close the busy dialog after download completes
        busyDialog.close();
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

    public async docUpload(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonEmployeeData = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]]);
        this.entity_name = oWorkBook.SheetNames[0];
    }

    public async insertWorkMode(blobFile: Blob) {
        let oBusyDailog = new sap.m.BusyDialog().open();

        // Employee Salary data from Sheet 1
        if (this.entity_name === "d_o2c_employee") {
            let q = <KloEntitySet<d_o2c_employee>>await this.transaction.getExecutedQuery('d_o2c_employee', { loadAll: true })

            for (let i = 0; i < this.jsonEmployeeData.length; i++) {
                let empData = q.find((item) => item.employee_id == this.jsonEmployeeData[i].employee_id);
                if(empData)
                empData.work_mode =  this.jsonEmployeeData[i].work_mode;
            
            try {
                // Commit the transaction
                await this.tm.commitP("Inserted Successfully", "Insertion Failed", false, true);
            } catch (e) {
                await this.transaction.rollback();
            }
        }
        } else {
            sap.m.MessageToast.show("Wrong DB entry", { duration: 400 });
        }


        // Close the busy dialog
        oBusyDailog.close();
    }
}