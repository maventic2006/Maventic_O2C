import { KloAppService } from "kloBo/KloAppService";

export class getZohoCustomerCreation extends KloAppService {

    public async onExecute() {
        let zohoRefreshToken = this.data.zohoRefreshToken;
        let zohoClientId = this.data.zohoClientId;
        let zohoClientSecret = this.data.zohoClientSecret;
        let zohoRedirectURI = this.data.zohoRedirectURI;
        let zohoGrantType = this.data.zohoGrantType;
        let customerName = this.data.customerName;
        let organizationId = this.data.organizationId;
        let gstNumber = this.data.gstNumber;
        
        let customerAddress = this.data.customerAddress;
        let customerCity = this.data.customerCity;
        let customerPinCode = this.data.customerPinCode;
        let customerContactPerson = this.data.customerContactPerson;
        let customerContactNumber = this.data.customerContactNumber;
        let customerContactEmailAddress = this.data.customerContactEmailAddress;
        let customerContactDesignation = this.data.customerContactDesignation;

        let customerWebsite = this.data.customerWebsite
        let customerPaymentTerms= this.data.customerPaymentTerms
    
        let token = await this.onGeneratingAccessToken(
            zohoRefreshToken,
            zohoClientId,
            zohoClientSecret,
            zohoRedirectURI,
            zohoGrantType
        );
    
        let customerData = await this.onCustomerGeneration(
            token, 
            organizationId, 
            customerName, 
            gstNumber, 
            customerAddress, 
            customerCity, 
            customerPinCode, 
            customerContactPerson, 
            customerContactNumber, 
            customerContactEmailAddress, 
            customerContactDesignation,
            customerWebsite,
            customerPaymentTerms
        );
    
        return customerData;
    }
    
    public async onGeneratingAccessToken(
        refreshToken: string,
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        grantType: string
    ): Promise<string | null> {
        const authUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=${grantType}`;
        try {
            const response = await fetch(authUrl, {
                method: 'POST'
            });
            const data = await response.json();
            return data.access_token || null;
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }

    public async onCustomerGeneration(
        token: string, 
        organizationId: number, 
        customerName: string, 
        gstNumber: string, 
        customerAddress: string, 
        customerCity: string, 
        customerPinCode: number,
        customerContactPerson: string, 
        customerContactNumber: string, 
        customerContactEmailAddress: string, 
        customerContactDesignation: string,
        customerWebsite:string,
        customerPaymentTerms:number
    ): Promise<any> {
        const invoiceUrl = `https://www.zohoapis.in/books/v3/contacts?organization_id=${organizationId}`;
    
        const requestBody = {
            "contact_name": customerName,
            "company_name": customerName,
            "tax_details": {
                "gst_number": gstNumber
            },
            "website": customerWebsite,
            "payment_terms":customerPaymentTerms,
            payment_terms_label: `NET ${customerPaymentTerms}`,
            "billing_address": {
                "attention": customerContactPerson,
                "address": customerAddress,
                "city": customerCity,
                "phone": customerContactNumber,
                "zip": customerPinCode
            },
            "shipping_address": {
                "attention": customerContactPerson,
                "address": customerAddress,
                "city": customerCity,
                "phone": customerContactNumber,
                "zip": customerPinCode
            }
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
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Invoice generation failed:', error);
            return null;
        }
    }
    
}