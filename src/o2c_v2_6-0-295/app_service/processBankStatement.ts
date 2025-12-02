import { KloAppService } from "kloBo/KloAppService";

export class processBankStatement extends KloAppService {
    public async onExecute() {
        const endpoint = 'https://api.maventic.in/mapi/ocr/processBankstatement';
        const token = this.data.accessToken;  // Ideally you pass it through this.data
        const bankStatement = this.data.bankStatement; // base64 string of CSV content or whatever you’re passing

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bankStatement: bankStatement
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                return {
                    status: "Failed",
                    message: `Request failed with status ${response.status}`,
                    details: errorBody
                };
            }

            const result = await response.json();
            return {
                status: "Success",
                data: result
            };
        } catch (error) {
            return {
                status: "Error",
                message: "Error while processing bank statement",
                error: error.toString()
            };
        }
    }
}
