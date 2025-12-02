import { EventContext } from "kloBo/EventContext";
import { d_email_helper_entity as d_email_helper_entity_gen } from "o2c_v2/entity_gen/d_email_helper_entity";

export class d_email_helper_entity extends d_email_helper_entity_gen {
    public async onCreate(event: EventContext) {
        const invoiceData = event.getObject();
        const transaction = event.getTxn();
        const invoiceNumber = invoiceData['invoice_number'];
        const emailType = invoiceData['email_type'] || "Invoice Mail";
        const milestoneNumber = invoiceData['milestone_number'];

        const invoiceTableData = await transaction.getExecutedQuery('d_invoice_request_hdr_table', { inv_request_id: invoiceNumber });
        const creditNoteTableData = await transaction.getExecutedQuery('d_o2c_invoice_credit_note', { credit_note_number: invoiceNumber });
        const milestoneTable = await transaction.getExecutedQuery('d_o2c_so_milestone', { billing_milestone: milestoneNumber, expandAll: "r_milestone_item,r_milestone_item/r_item_attachment" });
        const scheduleTable = await transaction.getExecutedQuery('d_o2c_so_schedule', { schedule_no: milestoneNumber, expandAll: "r_schedule_item,r_schedule_item/r_item_attachment" });
        const volumeTable = await transaction.getExecutedQuery('d_o2c_volume_based', { billing_milestone: milestoneNumber, expandAll: "r_volume_item,r_volume_item/r_item_attachment" });
        const customerContactTableData = await transaction.getExecutedQuery('d_o2c_customers_contact', { k_id: invoiceTableData[0]['client_name'] });

        const nodemailer = require('nodemailer');
        const path = require('path');
        const fs = require('fs');
        const { PDFDocument } = require('pdf-lib');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'vardhanjaingfg@gmail.com',
                pass: 'hxrv bpyb mrgi dfbh'
            }
        });

        const invoiceNo = invoiceData['invoice_number'];
        const project_name = invoiceTableData[0]['reg_project_name'];
        const invoiceDate = new Date().toLocaleDateString('en-GB');
        const amountDue = invoiceTableData.reduce((sum, item) => sum + (parseFloat(item['total_invoice']) || 0), 0);
        const milestone_name = invoiceTableData[0]['reg_milestone_name'];
        const first_name = customerContactTableData[0]['contact_name'];
        const description = `${project_name}: ${milestone_name}`;

        const isReminder = emailType === "Reminder Mail";
        const isCreditNote = emailType === "Credit Note Mail";

        // ---------------- Email Content Setup ----------------
        let introText = "";
        let middleText = "";
        let subjectPrefix = "";

        if (isReminder) {
            introText = "This is a gentle reminder regarding your pending invoice. Please find the invoice details below:";
            middleText = "We kindly request you to complete the payment at the earliest. Please let us know if you have any concerns or need assistance.";
            subjectPrefix = "Reminder: ";
        } else if (isCreditNote) {
            introText = "Please find attached your credit note for reference. Details are mentioned below:";
            middleText = "If you have any queries or require clarifications regarding this credit note, kindly let us know.";
            subjectPrefix = "Credit Note: ";
        } else {
            introText = "I hope this message finds you well. Please find below the details of your invoice:";
            middleText = "Kindly review the attached invoice and let us know if you require any further details or clarifications.";
        }

        const htmlContent = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
            <p style="margin: 0 0 20px;">Dear ${first_name},</p>
            <p style="margin: 0 0 20px;">${introText}</p>
            <table style="border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                <tr>
                    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">${isCreditNote ? "Credit Note Number:" : "Invoice Number:"}</td>
                    <td style="padding: 8px 12px;">${invoiceNo}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Date:</td>
                    <td style="padding: 8px 12px;">${invoiceDate}</td>
                </tr>
                ${!isCreditNote ? `
                <tr>
                    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Amount Due:</td>
                    <td style="padding: 8px 12px;">₹${Number(amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                ` : ""}
                <tr>
                    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Description:</td>
                    <td style="padding: 8px 12px;">${description}</td>
                </tr>
            </table>
            <p style="margin: 0 0 20px;">${middleText}</p>
            <p style="margin: 0 0 20px;">We appreciate your continued partnership and look forward to working with you.</p>
            <p style="margin: 0;">Best regards,</p>
            <p style="margin: 4px 0 0;">
                Umesh M<br />
                +91 99163 50369
            </p>
        </div>
        `;

        // ---------------- Collect Files for PDF ----------------
        const filesToMerge = [];
        const mainFile = isCreditNote
            ? creditNoteTableData[0]['credit_note_pdf']
            : invoiceTableData[0]['signed_invoice_pdf'];
        if (mainFile) filesToMerge.push(mainFile);

        if (!isCreditNote) {
            const proposalCopy =
                milestoneTable?.[0]?.r_milestone_item?.[0]?.r_item_attachment?.[0]?.personal_copy ||
                scheduleTable?.[0]?.r_schedule_item?.[0]?.r_item_attachment?.[0]?.personal_copy ||
                volumeTable?.[0]?.r_volume_item?.[0]?.r_item_attachment?.[0]?.personal_copy;
            if (proposalCopy) filesToMerge.push(proposalCopy);

            const signupDoc =
                milestoneTable?.[0]?.signupdoc ||
                scheduleTable?.[0]?.signupdoc ||
                volumeTable?.[0]?.signupdoc;
            if (signupDoc) filesToMerge.push(signupDoc);

            const timesheetUpload =
                milestoneTable?.[0]?.timesheet_upload ||
                scheduleTable?.[0]?.timesheet_upload ||
                volumeTable?.[0]?.timesheet_upload;
            if (timesheetUpload) filesToMerge.push(timesheetUpload);
        }

        // ---------------- Merge PDFs using pdf-lib ----------------
        let mergedPdfBuffer: Buffer | null = null;
        if (filesToMerge.length) {
            try {
                const mergedPdf = await PDFDocument.create();
                for (const fileObj of filesToMerge) {
                    const filePath = path.join(process.cwd(), 'Uploads', 'type', 'subtype', `${fileObj['id']}.${fileObj['extension']}`);
                    if (fs.existsSync(filePath)) {
                        const pdfBytes = fs.readFileSync(filePath);
                        const pdf = await PDFDocument.load(pdfBytes);
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach(page => mergedPdf.addPage(page));
                    }
                }
                mergedPdfBuffer = await mergedPdf.save();
            } catch (err) {
                console.error("Failed to merge PDFs:", err);
            }
        }

        // ---------------- Mail Options ----------------
        const mailOptions: any = {
            from: 'vardhanjaingfg@gmail.com',
            to: 'vardhanjaindit@gmail.com', // TODO: replace with customerContactTableData email field
            subject: `${subjectPrefix}${isCreditNote ? "Credit Note" : "Invoice"} - ${invoiceNo} for ${project_name} : Maventic`,
            html: htmlContent,
            attachments: []
        };

        if (mergedPdfBuffer) {
            mailOptions.attachments.push({
                filename: `${isCreditNote ? "CreditNote" : "Invoice"}_${invoiceNo}_Merged.pdf`,
                content: mergedPdfBuffer,
                contentType: 'application/pdf'
            });
        }

        // ---------------- Send Mail ----------------
        let sendSuccess = false;
        let sendError = null;

        try {
            await transporter.sendMail(mailOptions);
            sendSuccess = true;
        } catch (error) {
            sendError = error;
            console.error('Error sending email for:', invoiceNo, error);
        }

        // ---------------- Update Status ----------------
        for (const lineItem of invoiceTableData) {
            if (sendSuccess) {
                if (isReminder) {
                    const existingRemark = lineItem["remark"] || "";
                    const newRemark = "Reminder Mail Sent";
                    lineItem["remark"] = existingRemark
                        ? `${existingRemark}, ${newRemark}`
                        : newRemark;
                } else {
                    lineItem["status"] = "Email Sent to Customer";
                }
            } else {
                lineItem["status"] = "Error In Sending Mail";
                const existingRemark = lineItem["remark"] || "";
                const errorMessage = `Error sending ${emailType}: ${sendError?.message || sendError?.toString()}`;
                lineItem["remark"] = existingRemark
                    ? `${existingRemark}, ${errorMessage}`
                    : errorMessage;
            }
        }
    }
}