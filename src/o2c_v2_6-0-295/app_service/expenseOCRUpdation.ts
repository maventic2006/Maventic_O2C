import { KloAppService } from "kloBo/KloAppService";

export class getZohoInvoiceGeneration extends KloAppService {
    public async onExecute() {
        let filedata=this.data.base64file;
        let token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImludGVybmFsLm1hdmVudGljLTFAbWF2ZW50aWMuY29tIiwicm9sZSI6InVzZXIiLCJhcGlJYXQiOjE3NDQyNzI2MzksImFwaXRva2VuIjp7ImlzQXBpVG9rZW4iOnRydWV9LCJjcmVhdGVkQnkiOiJhZG1pbkBtYXZlbnRpYy5jb20iLCJlbnYiOiJzYW5kYm94IiwiaWF0IjoxNzQ0MjcyNjM5LCJleHAiOjE3NTk4MjQ2Mzl9.UeSPi8aDjQBTi4GH5Ff-uEWKm_i2d_hQeWprcPPIM-c';
        let decodedData = await this.expense(token,filedata)
        return decodedData;
    }
    public async expense(token,filedata): Promise<string | null> {
        const authUrl = 'https://api.maventic.in/mapi/ocr/processPdf';
        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdf_data: filedata,  // Base64 encoded PDF string
                    requested_data: {
                        "Bill No": "",
                        "Total": "",
                        "Date": ""
                    }
                }),
            });
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error('Data Fetching Failed:', error);
            return null;
        }
    }
}