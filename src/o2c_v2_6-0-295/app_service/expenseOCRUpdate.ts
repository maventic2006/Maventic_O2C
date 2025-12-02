import  { KloAppService } from "kloBo/KloAppService";

export class expenseOCRUpdate extends KloAppService {

    public async onExecute() {
        let token_object = await this.txn.getExecutedQuery("d_general_confg", { key: "api_ai_ocr_token", loadAll: true })
        let filedata=this.data.base64file;
        let token=token_object[0].low_value;
        let decodedData = await this.expense(token,filedata)
        console.log("Decoded Data:", decodedData)
        return decodedData;
    }
    public async expense(token,filedata): Promise<string | null> {
        const authUrl = 'https://api.maventic.in/mapi/ocr/processPdf';
        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdf_data: filedata,  // Base64 encoded PDF string
                    requested_data: {
                        "Bill_No": "",
                        "Total_Amount": "",
                        "Date": "",
                        "Currency_Code":""
                    }
                }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Data Fetching Failed:', error);
            return null;
        }
    }
}