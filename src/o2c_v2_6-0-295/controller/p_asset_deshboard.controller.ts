import { KloEntitySet } from 'kloBo/KloEntitySet';
import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_asset_creation } from 'o2c_v2/entity_gen/d_asset_creation';
import { d_o2c_asset_clubbing } from 'o2c_v2/entity_gen/d_o2c_asset_clubbing';

declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_asset_deshboard")

export default class p_asset_deshboard extends KloController {
    public path;
    public child_added_asset;
    public addonclub;


    public onInit() {
        try {
            FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "o2c_base");
        } catch (error) {
            sap.m["MessageToast"].show("Error while loading CSS file. Please check the console.");
            throw error;
        }
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter(oEvent) {
       
        let querySearch = this.tm.getTN("search");
		querySearch.getData().setLoadAll(true);
        await querySearch.executeP();
        let getActiveIndex = await this.tm.getTN('asset_list').getActiveIndex()
        await this.tm.getTN('asset_list').setActive(getActiveIndex)

        let asset_list = await this.tm.getTN('asset_list').getActiveData()

        if (asset_list.assigned_to != null && asset_list.assigned_to != undefined && asset_list.assigned_to != "") {
            this.tm.getTN("emp_sub_search").setProperty('employee', asset_list.assigned_to);
            await this.tm.getTN("emp_sub_search").executeP();
        } else {
            this.tm.getTN("emp_sub_search").setProperty('employee', "none");
            await this.tm.getTN("emp_sub_search").executeP();
        }

        this.tm.getTN("asset_sub_search").setProperty('asset_number', asset_list.asset_number);
        await this.tm.getTN("asset_sub_search").executeP();




        await this.tm.getTN("amc_detail").setData({})                       // Setting data in other type node of amc list
        await this.amc_list(`/asset_list/${getActiveIndex}`);
        await this.tm.getTN("asset_list").refresh();         // Fetching Amc data
    }
    public async navToDetails(oEvent) {
        let oBusyDailog = new sap.m.BusyDialog().setText("fetching data...");
        oBusyDailog.open();
        this.path = this.getPathFromEvent(oEvent);
        await this.navTo(({ SS: 'pa_detail' }), oEvent)
        await this.amc_list(this.path)

        let asset_list = await this.tm.getTN('asset_list').getActiveData()

        if (asset_list.assigned_to != null && asset_list.assigned_to != undefined && asset_list.assigned_to != "") {
            this.tm.getTN("emp_sub_search").setProperty('employee', asset_list.assigned_to);
            await this.tm.getTN("emp_sub_search").executeP();
        } else {
            this.tm.getTN("emp_sub_search").setProperty('employee', "none");
            await this.tm.getTN("emp_sub_search").executeP();
        }

        this.tm.getTN("asset_sub_search").setProperty('asset_number', asset_list.asset_number);
        await this.tm.getTN("asset_sub_search").executeP();

        oBusyDailog.close();
        // Fetching Amc data on navigation

    }

    public async amc_list(path) {
        let current_date = new Date(), amc_list = [], extended_date = new Date();
        extended_date.setMonth(extended_date.getMonth() + 1);
        extended_date.setHours(0, 0, 0, 0);
        current_date.setHours(0, 0, 0, 0)

        let chartData = await this.tm.getTN('asset_list').getProperty(parseInt(path.replace("/asset_list/", '')));
        let amc_data = await chartData.r_asset_amc;

        if (amc_data.length) {
            for (let j=1,i = 0; j <= amc_data.length; i++,j++) {
                if (amc_data[i].end_date.getTime() < extended_date.getTime() && amc_data[i].end_date.getTime() > current_date) {
                    let x = await amc_data[i].document_type_vh.additional_desc;
                    amc_list.push({ "document_type": amc_data[i].document_type, "status": "Expiring soon" })
                } else if (amc_data[i].end_date.getTime() > current_date) {
                    let x = await amc_data[i].document_type_vh.additional_desc;
                    amc_list.push({ "document_type": amc_data[i].document_type, "status": "Active" })
                } else if (amc_data[i].end_date.getTime() <= current_date) {
                    let x = await amc_data[i].document_type_vh.additional_desc;
                    amc_list.push({ "document_type": amc_data[i].document_type, "status": "Not Active" })
                }
            }
            await this.tm.getTN('amc_detail').setData(amc_list);
            amc_list = [];
        } else {
            await this.tm.getTN('amc_detail').setData({});
        }
    }

    public async addon_dialog(oEvent, param) {
        await this.openDialog(param.dialog_pa);
    }
    //  REFRESH AMC DETAIL IN DASHBOARD 
    public async amc_refresh(oEvent) {
        if (this.path) {
            await this.amc_list(this.path)
        }
        else {
            let getActiveIndex = await this.tm.getTN('asset_list').getActiveIndex()
            await this.amc_list(`/asset_list/${getActiveIndex}`);
        }
    }
    //  LINK TO OPEN ASSET DETAIL
    public async link_page(oEvent, param) {


        let AssetNumber = await this.tm.getTN('asset_detail').getData().asset_number;
        //passing asset number to asset detail screen
        await this.navTo(({ H: true, TS: true, S: param.page_name, AssetNumber }));


    }

    //  LINK TO OPEN ASSET DETAIL
    public async addon_asset_detail(oEvent, param) {
        let path = this.getPathFromEvent(oEvent);
        this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))


        let AssetNumber = await this.tm.getTN(param.trans_node).getActiveData().child_asset_number;
        //passing asset number to asset detail screen
        await this.navTo(({ H: true, TS: true, S: param.page_name, AssetNumber }));


    }

    //Download child tag number

    //  public async addon_child_tag_no(oEvent, param) {

    //         let path = this.getPathFromEvent(oEvent);
    //         this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
    //         const margin = 10;
    //         const pageWidth = 210;
    //         const pageHeight = 297;

    //         //passing asset number to asset detail screen
    //         try {
    //             let tag_no = await this.tm.getTN(param.trans_node).getActiveData();
    //             // let tag_no = tag_n.toString()
    //             let qrGenerator = await import("kloExternal/bwip-js-min");
    //             let jspdf = await import("kloExternal/jspdf.min");
    //             let qrCanvas = document.createElement("canvas");

    //             qrGenerator.toCanvas(qrCanvas, {
    //                 bcid: "qrcode",
    //                 includetext: true,
    //                 textxalign: "center",
    //                 height: 20,
    //                 scale: 2,
    //                 text: tag_no.child_tag_number,
    //             });

    //             let imgData = qrCanvas.toDataURL("image/png");
    //             const pdf = new jspdf("p", "mm", "a4");
    //             pdf.rect(3, 3, 110, 50);

    //             pdf.setFontSize(10);
    //             pdf.setFont("helvetica", "bold");


    //             pdf.text("Business Area:",38,15);
    //             pdf.text(tag_no.business_area,66,15);

    //             pdf.text("Asset Number:",38,25);
    //             pdf.text(tag_no.child_asset_number.toString(),66,25);

    //             pdf.text("Tag Number:",38,35);
    //             pdf.text(tag_no.child_tag_number,66,35);

    //             pdf.text("If lost or found please contact : 9999999999",10,45);



    //             pdf.addImage(imgData, "PNG", 10, 10);
    //             await pdf.save(tag_no.child_tag_number);
    //         } catch (error) {
    //             console.error("Error generating the QR code PDF:", error);
    //         }



    //     }
    //
    public async add_child() {
        // need to be check code optimization
        this.setMode("CREATE")
        let asset_data = await this.tm.getTN('asset_addon_list').getActiveData();
        let par_asset = await this.tm.getTN('asset_list').getActiveData();
        this.tm.getTN("club_asset_search").setProperty("company_code", par_asset.company_code);
        this.tm.getTN("club_asset_search").setProperty("business_area", par_asset.business_area);
        await this.tm.getTN("club_asset_search").executeP();

        let active_asset = await this.tm.getTN('asset_list').getActiveData();
        this.child_added_asset = <KloEntitySet<d_o2c_asset_clubbing>>await this.transaction.getExecutedQuery('d_o2c_asset_clubbing', { 'child_asset_number': active_asset.asset_number, loadAll: true });


        if (this.child_added_asset.length == 0) {
            this.addonclub = await this.tm.getTN('asset_addon_list').createEntityP({ s_object_type: -1 }, null, null, null, "First", false, false, false);

        }
        else {
            // sap.m.MessageBox.success(`This is the child asset of the parent asset number ${this.child_added_asset[0].parent_asset_number} therefore, clubbing is not possible.`, {
            //     title: "Success",
            //     actions: [sap.m.MessageBox.Action.OK],
            //     onClose: null
            // })
            sap.m.MessageToast.show(`This is the child asset of the parent asset number ${this.child_added_asset[0].parent_asset_number} therefore, clubbing is not possible.`, { duration: 4000 });

            this.setMode("DISPLAY")

        }


    }

    // add on list save

    public async addOnSave(oEvent, param) {
        //await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true)
        await this.retrySave("Save Successful", "Error While Saving !!!");


        await this.closeDialog(param.dialog_pa);

    }


    // DOWNLOAD ATTECHMENT 
    public async onDownloadAttech(oEvent, param) {
        let path = this.getPathFromEvent(oEvent);
        this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
        //await this.tm.getTN("o2c_leave_approval_details").getData().r_manag_attch[0].attachment_url.downloadAttachP();
        let docdownload = await this.tm.getTN(param.trans_node).getActiveData()
        //.getProperty('r_manag_attch');\
        // let a = await docdownload.gatepass_attachment.getAttachmentBlobP()

        if (param.trans_node == "asset_allocation_list") {
            if (param.reciept == "view_reciept") {

                await docdownload.signed_attachment.downloadAttachP();
            } else {
                await docdownload.attachment.downloadAttachP();

            }

        } else if (param.trans_node == "asset_gatepass_list") {
            await docdownload.gatepass_attachment.downloadAttachP();

        }

    }
    // upload attachment 

    public async upload_attachment(oEvent, param) {
        this.tm.getTN(param.trans_node).setActive(parseInt(oEvent.oSource.oParent.sId.replace(`${oEvent.oSource.oParent.oParent.sId}` + "-rows-row", '')))
        let purchase_file = oEvent.mParameters.files[0];
        let purchase_file_name = oEvent.mParameters.files[0].name;
        let docdownload = await this.tm.getTN(param.trans_node).getActiveData()

        await docdownload.signed_attachment.setAttachmentP(purchase_file, purchase_file_name);
        //await this.tm.commitP("Uploaded successfully ", "Error While Uploading !!!", true, true)
        await this.retrySave("Uploaded successfully ", "Error While Uploading !!!");


    }

    // public async downloadQRCode(oEvent, param) {
    //     let path = this.getPathFromEvent(oEvent);

    //     if (path != undefined) {
    //         this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
    //     }

    //     if (param.trans_node == "asset_addon_list") {
    //         this.tm.getTN(param.trans_node).setActive(parseInt(path.replace(`/${param.trans_node}/`, '')))
    //     }

    //     try {
    //         // let tag_no = await this.tm.getTN('asset_detail').getData().tag_number;
    //         let tag_no = await this.tm.getTN(param.trans_node).getActiveData();

    //         let qrGenerator = await import("kloExternal/bwip-js-min");


    //         let jsPDFModule = await import("kloExternal/jspdf.min");
    //         const jspdf = jsPDFModule.default;


    //         let qrCanvas = document.createElement("canvas");

    //         qrGenerator.toCanvas(qrCanvas, {
    //             bcid: "qrcode",
    //             includetext: true,
    //             textxalign: "center",
    //             height: 20,
    //             scale: 2,
    //             text: param.trans_node == "asset_addon_list" ? tag_no.child_tag_number : tag_no.tag_number,
    //         });

    //         let imgData = qrCanvas.toDataURL("image/png");
    //         const pdf = new jspdf("p", "mm", [25,50]);
    //         pdf.rect(5, 5, 100, 50);
            

    //         pdf.setFontSize(10);
    //         pdf.setFont("helvetica", "bold");


    //         pdf.text("Business Area:", 38, 15);
    //         pdf.text(param.trans_node == "asset_addon_list" ? tag_no.business_area : tag_no.business_area, 66, 15);

    //         pdf.text("Asset Number:", 38, 25);
    //         pdf.text(param.trans_node == "asset_addon_list" ? tag_no.child_asset_number.toString() : tag_no.asset_number.toString(), 66, 25);

    //         pdf.text("Tag Number:", 10, 40);
    //         pdf.text(param.trans_node == "asset_addon_list" ? tag_no.child_tag_number : tag_no.tag_number, 38, 40);

    //         pdf.text("If lost or found please contact : 8296969824", 10, 50);
    //         //pdf.addImage(imgData, "PNG", 10, 10);
    //         // pdf.addImage(imgData, "PNG", 10, 10, 23, 23);
    //         pdf.addImage(imgData, "PNG", 1, 1, 2, 2);


    //         await pdf.save(param.trans_node == "asset_addon_list" ? tag_no.child_tag_number : tag_no.tag_number);
    //     } catch (error) {
    //         console.error("Error generating the QR code PDF:", error);
    //     }


    // }



    //Bulk Tag Generation



    public async downloadQRCode(oEvent, param) {
        try {
            let path = this.getPathFromEvent(oEvent);
    
            if (path !== undefined) {
                this.tm.getTN(param.trans_node).setActive(
                    parseInt(path.replace(`/${param.trans_node}/`, ""))
                );
            }
    
            if (param.trans_node === "asset_addon_list") {
                this.tm.getTN(param.trans_node).setActive(
                    parseInt(path.replace(`/${param.trans_node}/`, ""))
                );
            }
    
            let tag_no = await this.tm.getTN(param.trans_node).getActiveData();
    
            let qrGenerator = await import("kloExternal/bwip-js-min");
            let jsPDFModule = await import("kloExternal/jspdf.min");
            const jspdf = jsPDFModule.default;
    
            // Sticker size: 60mm wide × 25mm high (landscape)
            const pdf = new jspdf("l", "mm", [25, 60]);
    
            const qrSize = 18;
            const x = 1;  // padding left
            const y = 2;  // padding top
    
            // Generate QR code
            let qrCanvas = document.createElement("canvas");
            qrGenerator.toCanvas(qrCanvas, {
                bcid: "qrcode",
                text: param.trans_node === "asset_addon_list" ? tag_no.child_tag_number : tag_no.tag_number,
                scale: 2,
                includetext: false,
            });
    
            let imgData = qrCanvas.toDataURL("image/png");
    
            // Add QR code
            pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);
    
            // Add text to the right of QR code
            let textX = x + qrSize + 2;
            let textY = y + 4;
    
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
    
            pdf.text(`Business Area: ${tag_no.business_area}`, textX, textY);
    
            textY += 5;
            pdf.text(
                `Asset: ${
                    param.trans_node === "asset_addon_list"
                        ? tag_no.child_asset_number
                        : tag_no.asset_number
                }`,
                textX,
                textY
            );
    
            pdf.setFontSize(7);
            textY += 5;
            pdf.text("If Lost or Found Please Contact:", textX, textY);
    
            textY += 4;
            pdf.text("Call: +91 8296969824", textX, textY);
    
            // Small tag number at bottom
            pdf.setFontSize(6);
            pdf.text(
                `${
                    param.trans_node === "asset_addon_list"
                        ? tag_no.child_tag_number
                        : tag_no.tag_number
                }`,
                2,
                24
            );
    
            // Save as Tag Number
            await pdf.save(
                param.trans_node === "asset_addon_list"
                    ? tag_no.child_tag_number
                    : tag_no.tag_number
            );
        } catch (error) {
            console.error("Error generating the QR code PDF:", error);
        }
    }
    


    public async bulkdownloadQRCode(oEvent, param) {
        try {
            const selected = await this.getActiveControlById(null, "s_asset_list").getSelectedIndices();
            let assetData = [];
    
            if (selected.length > 0) {
                assetData = await Promise.all(selected.map(async index => {
                    const data = await this.tm.getTN("asset_list").getData()[index];
                    return {
                        asset_number: data.asset_number,
                        tag_number: data.tag_number,
                        business_area: data.business_area,
                    };
                }));
            }
    
            const qrGenerator = await import("kloExternal/bwip-js-min");
            const jsPDFModule = await import("kloExternal/jspdf.min");
            const jspdf = jsPDFModule.default;
    
            // Paper size: landscape, one sticker = full 120mm × 25mm
            const pdf = new jspdf("l", "mm", [25, 60]);
    
            const labelWidth = 120;
            const labelHeight = 25;
            const qrSize = 18;
            const paddingX = 1;
            const paddingY = 1;
    
            for (let i = 0; i < assetData.length; i++) {
                if (i > 0) pdf.addPage(); // Each label on a new page
    
                const data = assetData[i];
                const x = paddingX;
                const y = paddingY;
    
                const qrCanvas = document.createElement("canvas");
                qrGenerator.toCanvas(qrCanvas, {
                    bcid: "qrcode",
                    scale: 2,
                    includetext: false,
                    text: data.tag_number,
                });
                const imgData = qrCanvas.toDataURL("image/png");
    
                // Optional border for the label
                // pdf.setDrawColor(150);
                // pdf.rect(.5, .5, 59, 24);
    
                // Add QR code
                pdf.addImage(imgData, "PNG", x+0, y + 2, qrSize, qrSize);
    
                // Add text on right of QR code
                const textX = x + qrSize + 1;
                let textY = y + 3;
    
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(0);
                pdf.text(`Business Area: ${data.business_area}`, textX+1, textY+1);
    
                textY += 5;
                pdf.text(`Asset: ${data.asset_number}`, textX+1, textY+1);
    
                pdf.setFontSize(7);
                textY += 5;
                pdf.text("If Lost or Found Please Contact:", textX+1, textY+1);
               
                pdf.setFontSize(7);
                textY += 4;
                pdf.text("Call: +91 8147069399", textX+1, textY);
    
                textY += 3;
                pdf.setFontSize(6);
                pdf.text(`${data.tag_number}`, 1, textY+3);
               
            }
    
            await pdf.save("One_QR_Per_Row_Sticker.pdf");
        } catch (error) {
            console.error("Error generating barcode stickers:", error);
        }
    }
    

    
    //     try {
    //         const selected = await this.getActiveControlById(null, "s_asset_list").getSelectedIndices();
    //         let assetData = [];
    
    //         if (selected.length > 0) {
    //             assetData = await Promise.all(selected.map(async index => {
    //                 const data = await this.tm.getTN("asset_list").getData()[index];
    //                 return {
    //                     asset_number: data.asset_number,
    //                     tag_number: data.tag_number,
    //                     business_area: data.business_area,
    //                 };
    //             }));
    //         }
    
    //         let prnContent = "";
    
    //         for (const data of assetData) {
    //             // ZPL Example - Customize as per your printer specs
    //             prnContent += `
    // ^XA
    // ^FO30,30^BQN,2,5^FDQA,${data.tag_number}^FS
    // ^FO180,30^A0N,25,25^FDAsset: ${data.asset_number}^FS
    // ^FO180,60^A0N,25,25^FDTag: ${data.tag_number}^FS
    // ^FO180,90^A0N,25,25^FDBusiness Area: ${data.business_area}^FS
    // ^FO180,120^A0N,25,25^FDCall: +91 8147069399^FS
    // ^XZ
    // `;
    //         }
    
    //         // Download as .prn
    //         const blob = new Blob([prnContent], { type: "text/plain;charset=utf-8" });
    //         const link = document.createElement("a");
    //         link.href = URL.createObjectURL(blob);
    //         link.download = "Asset_QRCodes.prn";
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    
    //     } catch (error) {
    //         console.error("Error generating PRN file:", error);
    //     }
    // }
    


    

    // prd movement 

    public async onAddonAdd(oEvent) {

        console.log(oEvent)
        let asset_data = await this.tm.getTN('asset_addon_list').getActiveData()
        console.log(asset_data)
        let par_asset = await this.tm.getTN('asset_list').getActiveData();
        //jegyfhu


        if (asset_data.child_asset_number != par_asset.asset_number) {


            let tag_no = <KloEntitySet<d_asset_creation>>await this.transaction.getExecutedQuery('d_asset_creation', { 'asset_number': asset_data.child_asset_number, loadAll: true });
            this.addonclub.child_tag_number = tag_no[0].tag_number;
            this.addonclub.asset_name = tag_no[0].asset_description;
            this.addonclub.business_area = tag_no[0].business_area;
            this.addonclub.company_code = tag_no[0].company_code;
            this.addonclub.parent_tag_number = par_asset.tag_number;

            //await this.tm.commitP("Save Successful", "Error While Saving !!!", true, true)
            await this.retrySave("Save Successful", "Error While Saving !!!");



        } else {
            sap.m.MessageToast.show("Active asset Cannot club with own asset.", { duration: 3000 });

            await this.rollBack()
        }



    }
    public async on_close_btn() {
        await this.rollBack();
        this.setMode("DISPLAY")
    }

    public async request_tracker(oEvent, param) {

        await this.navTo(({ H: true, TS: true, S: param.page_name }));

    }
    public async afterSearch(){
        this.tm.getTN("search_count").setData(this.getSearchTokensCount("s_asset_search"));
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
//25 Nov 11:09AM