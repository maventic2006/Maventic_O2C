import { EventContext } from "kloBo/EventContext";
import { d_invoice_e_signing_helper as d_invoice_e_signing_helper_gen } from "o2c_v2/entity_gen/d_invoice_e_signing_helper";

export class d_invoice_e_signing_helper extends d_invoice_e_signing_helper_gen {
    public async onCreate(event: EventContext) {
        const invoiceData = event.getObject();
        const transaction = event.getTxn();
        const invoiceNumber = invoiceData['invoice_number'];
        const password = invoiceData['password'];
        const pfxFileRecords = await transaction.getExecutedQuery('d_invoice_pfx_master', {});
        const invoiceTableData = await transaction.getExecutedQuery('d_invoice_request_hdr_table', { inv_request_id: invoiceNumber });
        const invoiceItemTableData = await transaction.getExecutedQuery('d_invoice_list_hdr_table', { inv_request_id: invoiceNumber });

        if (pfxFileRecords[0] && invoiceTableData.length > 0) {
            const path = require("path");
            const fs = require("fs");

            const pfxFile = pfxFileRecords[0]['pfx_file'];
            const pfxFileId = pfxFile['id'];
            const pfxFilePath = process.cwd() + path.sep + 'Uploads' + path.sep + 'type' + path.sep + 'subtype' + path.sep + pfxFileId + '.' + pfxFile.extension;

            const pfxFileBuffer = fs.readFileSync(pfxFilePath);

            for (const lineItem of invoiceTableData) {
                try {
                    const invoiceFile = lineItem['invoice_pdf'];
                    const invoiceFileId = invoiceFile['id'];
                    const invoiceFilePath = process.cwd() + path.sep + 'Uploads' + path.sep + 'type' + path.sep + 'subtype' + path.sep + invoiceFileId + '.' + invoiceFile.extension;

                    await this.waitForFilePresent(invoiceFilePath, fs);

                    const invoiceFileBuffer = fs.readFileSync(invoiceFilePath);
                    const signedPdf = await this.pdfSigning(invoiceFileBuffer, pfxFileBuffer, password);

                    const signedPdfPath = process.cwd() + path.sep + 'Uploads' + path.sep + 'type' + path.sep + 'subtype' + path.sep + invoiceFileId + 'signed.' + invoiceFile.extension;
                    fs.writeFileSync(signedPdfPath, signedPdf);

                    if (!lineItem["signed_invoice_pdf"]) {
                        lineItem["signed_invoice_pdf"] = {};
                    }
                    lineItem["signed_invoice_pdf"]['id'] = invoiceFileId + 'signed';

                    const originalName = invoiceFile['name'];
                    const nameParts = originalName.split('.');
                    if (nameParts.length > 1) {
                        nameParts[nameParts.length - 2] += '_signed';
                        lineItem["signed_invoice_pdf"]['name'] = nameParts.join('.');
                    } else {
                        lineItem["signed_invoice_pdf"]['name'] = originalName + '_signed';
                    }

                    lineItem["status"] = "E Signing Successful";
                } catch (error) {
                    lineItem["status"] = "Error in E Signing";
                }
            }

            for (const item of invoiceItemTableData) {
                try {
                    const invoiceFile = item['invoice_pdf'];
                    const invoiceFileId = invoiceFile['id'];
                    const invoiceFilePath = process.cwd() + path.sep + 'Uploads' + path.sep + 'type' + path.sep + 'subtype' + path.sep + invoiceFileId + '.' + invoiceFile.extension;

                    await this.waitForFilePresent(invoiceFilePath, fs);

                    const invoiceFileBuffer = fs.readFileSync(invoiceFilePath);
                    const signedPdf = await this.pdfSigning(invoiceFileBuffer, pfxFileBuffer, password);

                    const signedPdfPath = process.cwd() + path.sep + 'Uploads' + path.sep + 'type' + path.sep + 'subtype' + path.sep + invoiceFileId + 'signed.' + invoiceFile.extension;
                    fs.writeFileSync(signedPdfPath, signedPdf);

                    if (!item["signed_invoice_pdf"]) {
                        item["signed_invoice_pdf"] = {};
                    }
                    item["signed_invoice_pdf"]['id'] = invoiceFileId + 'signed';

                    const originalName = invoiceFile['name'];
                    const nameParts = originalName.split('.');
                    if (nameParts.length > 1) {
                        nameParts[nameParts.length - 2] += '_signed';
                        item["signed_invoice_pdf"]['name'] = nameParts.join('.');
                    } else {
                        item["signed_invoice_pdf"]['name'] = originalName + '_signed';
                    }

                    item["status"] = "E Signing Successful";
                } catch (error) {
                    item["status"] = "Error in E Signing";
                }
            }
        }
    }

    public async waitForFilePresent(filePath: string, fsLib: any) {
        const maxRetries = 1200;
        const initialInterval = 1000;
        const maxInterval = 2 * 60 * 1000;
        let retryCount = 0;

        let resolveFn: (value: string) => void;
        let rejectFn: (reason?: any) => void;

        const filePresencePromise = new Promise<string>((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });

        const interval = setInterval(() => {
            if (fsLib.existsSync(filePath)) {
                clearInterval(interval);
                resolveFn("successful");
            } else {
                retryCount++;
                if (retryCount >= maxRetries) {
                    clearInterval(interval);
                    rejectFn(new Error(`File ${filePath} not found after ${maxRetries} retries.`));
                }
            }
        }, Math.min(initialInterval * Math.pow(2, retryCount), maxInterval));

        await filePresencePromise;
    }

    public async pdfSigning(pdfBuffer: Buffer | Uint8Array, pfxBuffer: Buffer | Uint8Array, password: string, signerName = "RAJESH KUMAR AGARWALA") {
        const forge = require('node-forge');
        const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

        const toUint8Array = async (input: any) => {
            if (input instanceof Uint8Array) return input;
            if (Buffer.isBuffer(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
            if (input.arrayBuffer) return new Uint8Array(await input.arrayBuffer());
            throw new Error('Unsupported input type');
        };

        const pdfBytes = await toUint8Array(pdfBuffer);
        const pfxBytes = await toUint8Array(pfxBuffer);

        const p12Der = forge.util.createBuffer(pfxBytes);
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

        const certificate = certBags[forge.pki.oids.certBag][0].cert;
        const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${day}/${month}/${year} ${hour}:${minute}`;

        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        const x = width - 130;
        const y = 95;

        page.drawRectangle({
            x: x - 5,
            y: y - 5,
            width: 130,
            height: 55,
            color: rgb(1, 1, 1),
            opacity: 0.7,
            borderWidth: 0
        });

        page.drawText("Digitally signed by:", {
            x,
            y: y + 35,
            size: 7,
            font,
            color: rgb(0, 0, 0)
        });

        page.drawText(signerName, {
            x,
            y: y + 22,
            size: 8,
            font: boldFont,
            color: rgb(0, 0, 0)
        });

        page.drawText(`Date: ${timestamp}`, {
            x,
            y: y + 9,
            size: 7,
            font,
            color: rgb(0, 0, 0)
        });

        page.drawText("Authorized Signature", {
            x,
            y: y - 4,
            size: 7,
            font,
            color: rgb(0, 0, 0)
        });

        const signedPdf = await pdfDoc.save();
        return signedPdf;
    }
}

