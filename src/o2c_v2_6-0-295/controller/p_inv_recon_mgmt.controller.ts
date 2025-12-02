import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_inv_recon_mgmt")
export default class p_inv_recon_mgmt extends KloController {

    public async onPageEnter() {
        //This event will be called whenever the screen enters the visible area by means of navigation (Both front and back navigation).
    }

    public async startNewRecon() {
        let selectedFile: File | null = null;

        const reconNameInputId = "reconNameInput";
        const reconDescriptionInputId = "reconDescriptionInput";
        const fileUploaderId = "reconFileUploader";

        const dialog = new sap.m.Dialog({
            title: "Create New Reconciliation",
            type: "Message",
            contentWidth: "400px",
            content: [
                new sap.m.VBox({
                    items: [
                        new sap.m.Label({ text: "Recon Name *", design: "Bold" }),
                        new sap.m.Input(reconNameInputId, {
                            placeholder: "Enter reconciliation name",
                            width: "100%"
                        }),
                        new sap.m.Label({ text: "Recon Description *", design: "Bold", class: "sapUiMediumMarginTop" }),
                        new sap.m.Input(reconDescriptionInputId, {
                            placeholder: "Enter description",
                            width: "100%"
                        }),
                        new sap.m.Label({ text: "Upload File (CSV) *", design: "Bold", class: "sapUiMediumMarginTop" }),
                        new sap.ui.unified.FileUploader(fileUploaderId, {
                            placeholder: "Choose CSV file",
                            fileType: ["csv"],
                            sameFilenameAllowed: false,
                            maximumFilenameLength: 55,
                            maximumFileSize: 10,
                            change: (oEvent: sap.ui.base.Event) => {
                                const files = oEvent.getParameter("files") as File[];
                                const file = files?.[0];
                                if (file) {
                                    const mimeType = file.type;
                                    const validMimeTypes = [
                                        "text/csv",
                                        "application/vnd.ms-excel", // some browsers report CSV as this
                                        ""
                                    ];
                                    if (!validMimeTypes.includes(mimeType)) {
                                        sap.m.MessageToast.show("Please upload a valid CSV file.");
                                        (sap.ui.getCore().byId(fileUploaderId) as sap.ui.unified.FileUploader).clear();
                                        selectedFile = null;
                                    } else {
                                        selectedFile = file;
                                    }
                                }
                            }
                        })
                    ]
                })
            ],
            beginButton: new sap.m.Button({
                text: "Create Reconciliation",
                type: "Emphasized",
                press: async () => {
                    const reconName = (sap.ui.getCore().byId(reconNameInputId) as sap.m.Input).getValue().trim();
                    const reconDescription = (sap.ui.getCore().byId(reconDescriptionInputId) as sap.m.Input).getValue().trim();

                    if (!reconName || !reconDescription || !selectedFile) {
                        sap.m.MessageToast.show("All fields and file upload are required.");
                        return;
                    }

                    try {
                        const newRecon = await this.tm.getTN("inv_recon_mgmt_list").createEntityP({
                            s_object_type: -1,
                            recon_name: reconName,
                            recon_description: reconDescription,
                            upload_date: new Date()
                        }, "Created Successfully", "Creation Failed", null, "First", true, true);

                        const fileBlob = new Blob([selectedFile], { type: selectedFile.type || "text/csv" });
                        await newRecon.upload_file.setAttachmentP(fileBlob, selectedFile.name);

                        await this.tm.commitP();
                        sap.m.MessageToast.show("Reconciliation created successfully.");
                        dialog.close();
                    } catch (err) {
                        console.error("Error creating reconciliation:", err);
                        sap.m.MessageBox.error("Failed to create reconciliation. Please try again.");
                    }
                }
            }),
            endButton: new sap.m.Button({
                text: "Cancel",
                press: () => dialog.close()
            }),
            afterClose: () => dialog.destroy()
        });

        dialog.addStyleClass("sapUiSizeCompact");
        dialog.open();
    }

    public async downloadAttachDocument(oEvent: sap.ui.base.Event) {
        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/inv_recon_mgmt_list/", ''));

        const listData = await this.tm.getTN("inv_recon_mgmt_list").getData();
        await listData[index].upload_file.downloadAttachP();
    }
}