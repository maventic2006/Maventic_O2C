import  { KloAppService } from "kloBo/KloAppService";

export class getServerHealth1 extends KloAppService {

    public async onExecute(){
        // Write your code here
        let token = await this.onServerResponse();
        return token;
    }
    public async onServerResponse() {
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
            return  {data, statusCode, isOk} ;
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
            
    }
}