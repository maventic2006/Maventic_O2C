import  { KloAppService } from "kloBo/KloAppService";

export class getIRNFetching extends KloAppService {

    public async onExecute(){
        const gst = this.data.gstNumber;
        const clientId = this.data.appId;
        const clientSecret = this.data.appSecret;
        const user_name = this.data.user_name;
        const password = this.data.password;
        const irn = this.data.irn;

        const token = await this.onGeneratingAccessToken(clientId, clientSecret);
        const irnDetails = await this.getIRNDetails(token, gst, user_name, password, irn)

        return irnDetails;

    }

    public async onGeneratingAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
        const authUrl = 'https://gsp.adaequare.com/gsp/authenticate?action=GSP&grant_type=token';

        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    gspappid: clientId,
                    gspappsecret: clientSecret,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to authenticate. Status: ${response.status}`);
            }

            const data = await response.json();
            return data.access_token || null;
        } catch (error) {
            return null;
        }
    }

    public async getIRNDetails(token: string, gst: string, user_name: string, password: string, irn: string): Promise<string | null> {
        const searchUrl = `https://gsp.adaequare.com/test/enriched/ei/api/invoice/irn?irn=${irn}`;;
        const auth = `Bearer ${token}`;
        const requestId = Math.random().toString(36).substring(2, 10);

        try {
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user_name': user_name,
                    'password': password,
                    'gstin': gst,
                    'requestid': requestId,
                    'Authorization': auth
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return result ? JSON.stringify(result) : null;
        } catch (error) {
            return null;
        }
    }
}