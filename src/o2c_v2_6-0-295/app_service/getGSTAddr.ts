import { KloAppService } from "kloBo/KloAppService";

export class getGSTAddr extends KloAppService {

    public async onExecute() {
        let gst=this.data.gstapp;
        let appId=this.data.appId;
        let appsecret=this.data.appSecret;
        let token = await this.ongstchange(appId,appsecret);
        let address = await this.makeAuthenticatedRequest(token,gst)
        return address;
    }
    public async ongstchange(appId,appSecret): Promise<string | null> {
        const authUrl = 'https://gsp.adaequare.com/gsp/authenticate?grant_type=token';
        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    gspappid: appId,
                    gspappsecret: appSecret,
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

    public async makeAuthenticatedRequest(token: string,gst: string): Promise<string | null> {
        const searchUrl = 'https://gsp.adaequare.com/gstn/commonapi/search?action=TP&gstin='.concat(gst);
        const auth="bearer ".concat(token);
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