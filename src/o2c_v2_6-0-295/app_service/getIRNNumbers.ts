import { KloAppService } from "kloBo/KloAppService";

export class getIRNNumbers extends KloAppService {

    public async onExecute() {
        // Extract data from request
        let clientId = this.data.appId;
        let clientSecret = this.data.appSecret;
        let gst = this.data.gstNumber;
        let user_name = this.data.user_name;
        let password = this.data.password;
        let requestBody = this.data.requestBody; // Use the complete request body from caller
        
        // Generate access token
        let token = await this.onGeneratingAccessToken(clientId, clientSecret);
        if (!token) {
            return { success: false, message: "Failed to generate access token" };
        }

        // Make authenticated request with the token and request body
        let result = await this.makeAuthenticatedRequest(token, gst, user_name, password, requestBody);
        return result;
    }

    public async onGeneratingAccessToken(clientId, clientSecret): Promise<string | null> {
        const authUrl = 'https://gsp.adaequare.com/gsp/authenticate?action=GSP&grant_type=token';
        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    gspappid: clientId,
                    gspappsecret: clientSecret,
                },
            });
            const data = await response.json();
            const token = data.access_token;
            return token;
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }

    public async makeAuthenticatedRequest(
        token,
        gst,
        user_name,
        password,
        requestBody
    ): Promise<any> {
        const searchUrl = 'https://gsp.adaequare.com/test/enriched/ei/api/invoice';
        const auth = `Bearer ${token}`;
        const requestId = Math.random().toString(36).substring(2, 10);

        try {
            const response = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user_name': user_name,
                    'password': password,
                    'gstin': gst,
                    'requestid': requestId,
                    'Authorization': auth
                },
                body: JSON.stringify(requestBody)
            });


            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Authenticated request failed:', error);
            return { success: false, message: "Failed to generate E-Invoice", error: error.message };
        }
    }
}