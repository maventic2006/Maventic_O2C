import { FileLoaderUtils } from 'kloBo/Utils/FileLoaderUtils';
import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_ending_page")
export default class p_ending_page extends KloController {

    public async onPageEnter() {
        FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "ending_page");
    }

}