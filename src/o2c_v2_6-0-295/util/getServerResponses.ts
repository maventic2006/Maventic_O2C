export class getServerResponses {
    public static async getmApiCount(apiId, email, start_date, end_date, env, token, url) {
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

    public static async getServerResponse() {
        const authUrl = 'https://api.maventic.in/mapi/util/server-status';
        try {
            const response = await fetch(authUrl, {
                // method: 'GET',
                // headers: {
                //     'Content-Type': 'application/json',
                // },
            });
            const statusCode = response.status;
            const data = await response.json();
            const isOk = response.ok;

            console.log(statusCode);
            return { data, statusCode, isOk };
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }
}