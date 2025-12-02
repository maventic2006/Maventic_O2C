import { KloAppService } from "kloBo/KloAppService";

export class zohoCreditNoteGeneration extends KloAppService {

    public async onExecute() {
        const zohoRefreshToken = this.data.zohoRefreshToken;
        const zohoClientId = this.data.zohoClientId;
        const zohoClientSecret = this.data.zohoClientSecret;
        const zohoRedirectURI = this.data.zohoRedirectURI;
        const zohoGrantType = this.data.zohoGrantType;
        const organizationId = this.data.organizationId;
        const zohoExternalID = this.data.zohoExternalID;
        const lineItems = this.data.lineItems;
        const creditnote_number = this.data.creditnote_number;
        const creditnote_date = this.data.creditnote_date;
        const reference_invoice_number = this.data.reference_invoice_number;
        const invoice_id = this.data.invoice_id;
        const notes = this.data.notes;

        try {
            // Validate invoice_id
            if (!invoice_id) {
                return {
                    status: "Failed",
                    message: "Zoho Invoice ID is required but not provided"
                };
            }

            // Generate access token
            const token = await this.onGeneratingAccessToken(
                zohoRefreshToken,
                zohoClientId,
                zohoClientSecret,
                zohoRedirectURI,
                zohoGrantType
            );

            if (!token) {
                return {
                    status: "Failed",
                    message: "Failed to generate Zoho access token"
                };
            }

            // Create credit note in Zoho
            const creditNoteData = await this.onCreditNoteGeneration(
                token,
                organizationId,
                zohoExternalID,
                lineItems,
                creditnote_number,
                creditnote_date,
                reference_invoice_number,
                invoice_id,
                notes,
            );

            return creditNoteData;

        } catch (error) {
            console.error("Error in Zoho credit note generation:", error);
            return {
                status: "Failed",
                message: error.message || "Unknown error occurred"
            };
        }
    }

    public async onGeneratingAccessToken(
        refreshToken: string,
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        grantType: string
    ) {
        const authUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=${grantType}`;

        try {
            const response = await fetch(authUrl, { method: 'POST' });

            if (!response.ok) {
                console.error(`Failed to generate access token: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return data.access_token || null;

        } catch (error) {
            console.error("Error generating Zoho access token:", error);
            return null;
        }
    }

    public async onCreditNoteGeneration(
        token: string,
        organizationId: string,
        zohoExternalID: string,
        lineItems: any[],
        creditnote_number: string,
        creditnote_date: Date | string,
        reference_invoice_number: string,
        invoice_id: string,
        notes: string,
    ) {
        const creditNoteUrl = `https://www.zohoapis.in/books/v3/creditnotes?organization_id=${organizationId}`;

        // Format date to YYYY-MM-DD
        let formattedDate = "";
        if (creditnote_date) {
            const dateObj = creditnote_date instanceof Date ? creditnote_date : new Date(creditnote_date);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
        }

        // Build request body for Zoho credit note API
        const requestBody: any = {
            customer_id: zohoExternalID,
            creditnote_number: creditnote_number,
            invoice_id: invoice_id,
            date: formattedDate,
            line_items: lineItems.map(item => ({
                name: item.name,
                description: item.description,
                rate: item.rate,
                quantity: item.quantity,
                hsn_or_sac: item.hsn_or_sac,
            })),
            reference_number: reference_invoice_number,
            notes: notes || `Credit note for invoice ${reference_invoice_number}`,
        };


        try {
            const response = await fetch(creditNoteUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Zoho Credit Note Generation Failed: ${response.status} - ${errorText}`);

                return {
                    status: "Failed",
                    message: `Zoho API Error: ${response.status} - ${errorText}`
                };
            }

            const result = await response.json();

            // Check if Zoho returned an error
            if (result.code !== 0) {
                return {
                    status: "Failed",
                    message: result.message || "Zoho credit note creation failed"
                };
            }

            return {
                status: "Success",
                creditnote: result.creditnote,
                message: "Credit note created successfully in Zoho"
            };

        } catch (error) {
            console.error("Error calling Zoho credit note API:", error);
            return {
                status: "Failed",
                message: error.message || "Error calling Zoho API"
            };
        }
    }
}