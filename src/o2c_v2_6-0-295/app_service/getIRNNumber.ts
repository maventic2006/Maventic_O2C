import { KloAppService } from "kloBo/KloAppService";
export class getIRNNumber extends KloAppService {

    public async onExecute() {
        let gst = this.data.gstapp;
        let clientId = this.data.appId;
        let clientSecret = this.data.appSecret;
        let token = await this.onGeneratingAccessToken(clientId, clientSecret);
        // let address = await this.makeAuthenticatedRequest(token, gst)
        return token;
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
            console.log(data);
            const token = data.access_token;
            return token;
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }

    public async makeAuthenticatedRequest(token: string, gst: string): Promise<string | null> {
        const searchUrl = 'https://gsp.adaequare.com/gstn/commonapi/search?action=TP&gstin='.concat(gst);
        const auth = "bearer ".concat(token);
        try {
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Authorization': auth,
                    'Content-Type': 'application/json',
                }
            });
            const result = await response.json();
            const data = result.data;
            const decoded = atob(data);
            return decoded;
        } catch (error) {
            console.error('Authenticated request failed:', error);
        }
    }
}