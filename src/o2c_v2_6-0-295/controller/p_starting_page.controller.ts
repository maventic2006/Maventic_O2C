import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import {KloController} from 'kloTouch/jspublic/KloController'
declare let KloUI5:any;
@KloUI5("o2c_v2.controller.p_starting_page")
export default class p_starting_page extends KloController{
	
	public async onPageEnter() {
        const today = new Date();
        let reportingMonth: string;
    
        if (today.getDate() <= 10) {
            reportingMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1).toLocaleString('default', { month: 'long' });
        } else {
            reportingMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
        }
    
        const message = `${reportingMonth} month reports`;
    
        await this.tm.getTN("starting_page_data").setData(message);
    
        FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "starting_page");
    }
    
    public async onPdsContributionNavigation()
    {
        await this.navTo(({ S: "p_o2c_tar_vs_ach_rep"}))
    }
    
	
	
}