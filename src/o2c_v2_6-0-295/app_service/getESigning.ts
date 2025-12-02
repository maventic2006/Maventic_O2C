import { KloAppService } from "kloBo/KloAppService";
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const nodeSignpdf = require('node-signpdf');
const fs = require('fs');

export class getESigning extends KloAppService {
  public async onExecute() {
    try {
      const { pdfData, certPassword, reason, location, name } = this.data;
      const certBase64 = this.data.certFile;
      const signatureData = {
        name: name || "Authorized Signatory",
        company: this.data.company || "Company Name"
      };

      // Ensure the Base64 strings are properly formatted
      let pdfDataFixed = pdfData.replace(/\s/g, ''); // Remove any whitespace
      let certBase64Fixed = certBase64.replace(/\s/g, ''); // Remove any whitespace

      // Add padding if necessary
      const addPadding = (str) => {
        const padLength = str.length % 4;
        if (padLength > 0) {
          return str + '='.repeat(4 - padLength);
        }
        return str;
      };
      
      pdfDataFixed = addPadding(pdfDataFixed);
      certBase64Fixed = addPadding(certBase64Fixed);

      // Decode the base64 strings to buffers
      let certBuffer;
      try {
        certBuffer = Buffer.from(certBase64Fixed, 'base64');
      } catch (error) {
        console.error("Error decoding certificate:", error);
        return { success: false, error: "Invalid certificate format" };
      }

      let pdfBuffer;
      try {
        pdfBuffer = Buffer.from(pdfDataFixed, 'base64');
      } catch (error) {
        console.error("Error decoding PDF:", error);
        return { success: false, error: "Invalid PDF format" };
      }

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Set up the fonts for the signature
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Calculate positions for signature elements
      const boxWidth = 250;
      const boxHeight = 120;
      const signatureX = width - boxWidth - 50;
      const signatureY = 100;
      
      // Draw signature box
      firstPage.drawRectangle({
        x: signatureX,
        y: signatureY - boxHeight + 20,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      // Add "Digital Signature" header
      firstPage.drawText("Digital Signature", {
        x: signatureX + 5,
        y: signatureY + 5,
        size: 14,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Add signature line
      firstPage.drawLine({
        start: { x: signatureX + 5, y: signatureY - 20 },
        end: { x: signatureX + boxWidth - 5, y: signatureY - 20 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Add name text
      firstPage.drawText(signatureData.name, {
        x: signatureX + 5,
        y: signatureY - 35,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Add company text
      firstPage.drawText(signatureData.company, {
        x: signatureX + 5,
        y: signatureY - 50,
        size: 10,
        font: helveticaRegular,
        color: rgb(0, 0, 0),
      });
      
      // Add certificate information
      firstPage.drawText(`Certificate: ${name || "Digital Certificate"}`, {
        x: signatureX + 5,
        y: signatureY - 65,
        size: 8,
        font: helveticaRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Add location if provided
      if (location) {
        firstPage.drawText(`Location: ${location}`, {
          x: signatureX + 5,
          y: signatureY - 75,
          size: 8,
          font: helveticaRegular,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      
      // Add reason if provided
      if (reason) {
        firstPage.drawText(`Reason: ${reason}`, {
          x: signatureX + 5,
          y: signatureY - 85,
          size: 8,
          font: helveticaRegular,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      
      // Add date of signing
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      firstPage.drawText(`Date: ${currentDate} ${currentTime}`, {
        x: signatureX + 5,
        y: signatureY - 95,
        size: 8,
        font: helveticaRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Add verification text
      firstPage.drawText("Digitally signed with valid certificate", {
        x: signatureX + 5,
        y: signatureY - 105,
        size: 8,
        font: helveticaRegular,
        color: rgb(0, 0.5, 0),
      });
      
      // Save the PDF with visual signature
      const preparedPdfBytes = await pdfDoc.save();

      try {
        // Create instance of SignPdf and call sign method for cryptographic signature
        const signPDF = new nodeSignpdf.SignPdf();
        const signedPdfBuffer = signPDF.sign(Buffer.from(preparedPdfBytes), certBuffer, { 
          passphrase: certPassword,
          reason: reason || "Document Signing",
          location: location || "Digital Location",
          signatureLength: 8192 // Provide more space for signature
        });

        // Return the signed PDF as Base64
        return { 
          success: true, 
          signedPdf: signedPdfBuffer.toString('base64')
        };
      } catch (error) {
        console.error("Error signing PDF:", error);
        return { 
          success: false, 
          error: "Failed to sign PDF. Verify certificate password."
        };
      }
    } catch (error) {
      console.error("Error in e-signing service:", error);
      return { 
        success: false, 
        error: error.message || "Unknown error occurred"
      };
    }
  }
}