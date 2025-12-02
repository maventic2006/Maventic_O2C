import { KloAppService } from "kloBo/KloAppService";

export class getZohoInvoiceGeneration extends KloAppService {
    public async onExecute() {
        let zohoRefreshToken = this.data.zohoRefreshToken;
        let zohoClientId = this.data.zohoClientId;
        let zohoClientSecret = this.data.zohoClientSecret;
        let zohoRedirectURI = this.data.zohoRedirectURI;
        let zohoGrantType = this.data.zohoGrantType;
        let organizationId = this.data.organizationId;
        let zohoExternalID = this.data.zohoExternalID;
        let lineItems = this.data.lineItems;
        let invoice_number = this.data.invoice_number;

        let token = await this.onGeneratingAccessToken(
            zohoRefreshToken,
            zohoClientId,
            zohoClientSecret,
            zohoRedirectURI,
            zohoGrantType
        );

        let invoiceData = await this.onInvoiceGeneration(
            token,
            organizationId,
            zohoExternalID,
            lineItems,
            invoice_number
        );

        return invoiceData;
    }

    public async onGeneratingAccessToken(refreshToken, clientId, clientSecret, redirectUri, grantType) {
        const authUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=${grantType}`;
        try {
            const response = await fetch(authUrl, { method: 'POST' });
            const data = await response.json();
            return data.access_token || null;
        } catch {
            return null;
        }
    }

    public async onInvoiceGeneration(token, organizationId, zohoExternalID, lineItems, invoice_number) {
        const invoiceUrl = `https://www.zohoapis.in/books/v3/invoices?organization_id=${organizationId}`;

        const requestBody = {
            customer_id: zohoExternalID,
            invoice_number: invoice_number,
            line_items: lineItems
        };

        try {
            const response = await fetch(invoiceUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                return {
                    status: "Failed",
                    message: `Zoho Invoice Generation Failed: ${response.status}`
                };
            }

            const result = await response.json();
            return result;
        } catch {
            return null;
        }
    }
}
