import  { KloAppService } from "kloBo/KloAppService";

export class getZohoAccessToken extends KloAppService {

    public async onExecute(){
        let zohoCode= this.data.zoho_code
        let zohoClientId = this.data.zoho_client_id
        let zohoClientSecret = this.data.zoho_client_secret
        let zohoRedirectURI = this.data.zoho_redirect_uri
        let zohoGrantType = this.data.zoho_grant_type
    }
}