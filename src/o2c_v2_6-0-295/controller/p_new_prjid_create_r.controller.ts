import { KloEntitySet } from 'kloBo_7-2-126';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_project_header } from 'o2c_v2/entity/d_o2c_project_header';
import { d_o2c_so_hdr } from 'o2c_v2/entity/d_o2c_so_hdr';
import { d_o2c_so_profit } from 'o2c_v2/entity_gen/d_o2c_so_profit';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_new_prjid_create_r")
export default class p_new_prjid_create_r extends KloController {
    public jsonData = [];

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
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

    //To download the excel of the SO PC list
    public async downloadReport() {
        let busyDialog = new sap.m.BusyDialog({
            text: "Please Wait..."
        });
        busyDialog.open();

        if (!window.XLSX) {
            let path = "kloExternal/xlsx.bundle";
            await import(path);
        }

        let jsonData = [];

        let all_so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, expandAll: 'r_profit_center,r_project', s_status: "Approved" });
        for (let i = 0; i < all_so.length; i++) {
            let curr_so_pc_list = all_so[i].r_profit_center;
            let curr_so_prj_list = all_so[i].r_project;
            // Check for duplicate profit_center
            let profitCenters = curr_so_pc_list.map(pc => pc.profit_center);
            let uniqueProfitCenters = new Set(profitCenters);

            if (uniqueProfitCenters.size !== profitCenters.length) {
                for (let j = 0; j < curr_so_pc_list.length; j++) {
                    let filter_prj = curr_so_prj_list.filter((prj) => prj.profit_center == curr_so_pc_list[j].profit_center);
                    jsonData.push({
                        'pc_number': curr_so_pc_list[j].pc_number,
                        'so': all_so[i].so,
                        'profit_center': curr_so_pc_list[j].profit_center,
                        'percentage': curr_so_pc_list[j].percentage,
                        'pds': curr_so_pc_list[j].pds,
                        'project_pds': curr_so_pc_list[j].project_pds,
                        'project_lead': curr_so_pc_list[j].project_lead,
                        'project_manager': curr_so_pc_list[j].project_manager,
                        'team_head': curr_so_pc_list[j].team_head,
                        'project_id': filter_prj.length > 0 ? filter_prj[0].project_id : '',
                        'primary_profit_center': curr_so_pc_list[j].primary_profit_center,
                        'project_creation': (curr_so_pc_list.filter((item) => item.profit_center == curr_so_pc_list[j].profit_center).length == 1) ? filter_prj[0].project_id : ''
                    })
                }
            }
        }

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();

        // Set column widths
        worksheet['!cols'] = [
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Set header styles
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1"];
        headerCells.forEach(cell => {
            worksheet[cell].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                }
            };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, `${(new Date()).toLocaleString('en-US', { month: 'long' })} Report Data`);

        // Write workbook to a file
        const filePath = `${(new Date()).toLocaleString('en-US', { month: 'long' })} Project ID Update Report.xlsx`;
        XLSX.writeFile(workbook, filePath, { bookSST: true });
        busyDialog.close();
    }

    public async uploadReport(oEvent) {
        let oFile = oEvent.mParameters.files[0];
        let oWorkBook: any = await this.getWBFromExcelBinary(oFile);
        this.jsonData = XLSX.utils.sheet_to_json(oWorkBook.Sheets[oWorkBook.SheetNames[0]])
    }

    public async updateReport() {
        let oBusyDailog = new sap.m.BusyDialog().open();
        let all_so_pc_list = <KloEntitySet<d_o2c_so_profit>>await this.transaction.getExecutedQuery("d_o2c_so_profit", { loadAll: true });
        for (let i = 0; i < all_so_pc_list.length; i++) {
            let curr_so_pc = this.jsonData.filter(item => item.pc_number == all_so_pc_list[i].pc_number);
            if (curr_so_pc.length) {
                if (curr_so_pc[0].project_creation == "NEW" || curr_so_pc[0].project_creation == null) {
                    let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
                        loadAll: true, 'profit_center': curr_so_pc[0].profit_center, 'profit_center_pds': Math.round(parseFloat(curr_so_pc[0].pds))
                    });
                    let managementReservePerc = 0, contigencyReservePerc = 0;
                    if (rsrvMatrixData.length) {
                        managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(curr_so_pc[0].pds)) / 100));
                        contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(curr_so_pc[0].pds)) / 100));
                    }
                    let new_prj = await this.transaction.createEntityP('d_o2c_project_header', {
                        s_object_type: -1,
                        so_id: curr_so_pc[0].so,
                        total_project_pds: curr_so_pc[0].pds,//totalPDS,
                        mreserve_new: managementReservePerc.toFixed(2),
                        mcontig_new: contigencyReservePerc.toFixed(2),
                        available_pds_new: (parseFloat(parseFloat(curr_so_pc[0].pds) - managementReservePerc - contigencyReservePerc).toFixed(2)),
                        booked_pds_new: 0,
                        profit_center: curr_so_pc[0].profit_center,
                        s_status: "Created"
                    });

                    all_so_pc_list[i].project_id = new_prj.project_id;
                } else {
                    let rsrvMatrixData = await this.transaction.getExecutedQuery('q_rsvr_values', {
                        loadAll: true, 'profit_center': curr_so_pc[0].profit_center, 'profit_center_pds': Math.round(parseFloat(curr_so_pc[0].pds))
                    });
                    let managementReservePerc = 0, contigencyReservePerc = 0;
                    if (rsrvMatrixData.length) {
                        managementReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].management_reserve) * parseFloat(curr_so_pc[0].pds)) / 100));
                        contigencyReservePerc = (parseFloat((parseFloat(rsrvMatrixData[0].contigency_reserve) * parseFloat(curr_so_pc[0].pds)) / 100));
                    }
                    all_so_pc_list[i].project_id = curr_so_pc[0].project_creation;
                    let prj = <KloEntitySet<d_o2c_project_header>>await this.transaction.getExecutedQuery("d_o2c_project_header", { loadAll: true, project_id: curr_so_pc[0].project_creation });
                    prj[0].total_project_pds = curr_so_pc[0].pds;
                    prj[0].mreserve_new = managementReservePerc.toFixed(2);
                    prj[0].mcontig_new = contigencyReservePerc.toFixed(2);
                    prj[0].available_pds_new = (parseFloat(parseFloat(curr_so_pc[0].pds) - managementReservePerc - contigencyReservePerc).toFixed(2))

                }
            }
        }
        await this.tm.commitP("Updated Successfully!", "Update Failed", false, false);
        oBusyDailog.close();
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


    public async updateProjectIDforUniquePC() {
        let all_so = <KloEntitySet<d_o2c_so_hdr>>await this.transaction.getExecutedQuery("d_o2c_so_hdr", { loadAll: true, expandAll: 'r_profit_center,r_project', s_status: ["Approved","Closed"] });
        for (let i = 0; i < all_so.length; i++) {
            let curr_so_pc_list = all_so[i].r_profit_center;
            let curr_so_prj_list = all_so[i].r_project;
            if (curr_so_prj_list.length && curr_so_pc_list.length) {
                // Check for duplicate profit_center
                let profitCenters = curr_so_pc_list.map(pc => pc.profit_center);
                let uniqueProfitCenters = new Set(profitCenters);

                if (uniqueProfitCenters.size == profitCenters.length) {
                    for (let j = 0; j < curr_so_pc_list.length; j++) {
                        let filter_prj = curr_so_prj_list.filter((prj) => prj.profit_center == curr_so_pc_list[j].profit_center);
                        curr_so_pc_list[j].project_id = filter_prj[0].project_id;
                    }
                }
            }
        }

        await this.tm.commitP("Save Successful", "Save Failed", false, false);
    }
}