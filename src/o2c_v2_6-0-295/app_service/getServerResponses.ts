import { KloAppService } from "kloBo/KloAppService";

export class getServerResponses extends KloAppService {

    public async onExecute() {
        let token = this.data.token;
        let email = this.data.email;
        let env = this.data.env;
        let start_date = this.data.start_date;
        let end_date = this.data.end_date;
        let api_id = this.data.api_id;
        let url = this.data.url;
        let apiCount = await this.getApiCount(api_id, email, start_date, end_date, env, token, url);
        return apiCount;
    }

    public async getApiCount(apiId, email, start_date, end_date, env, token, url) {
        const authUrl = `${url}?user=${email}&startingDate=${start_date}&env=${env}&endingDate=${end_date}&apiId=${apiId}`;
        try {
            const response = await fetch(authUrl, {
                method: 'GET',
                headers: {
                    Authorization: token,
                },
            });
            let data = await response.json();
            return data;
        } catch (error) {
            console.error('API Count failed:', error);
            return error;
        }

    }
}