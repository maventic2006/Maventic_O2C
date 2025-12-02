import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { KloStandards } from "kloTouch/jspublic/KloStandards";
import { d_o2c_employee_org as d_o2c_employee_org_gen } from "o2c_v2/entity_gen/d_o2c_employee_org";
import { validationUtil } from "o2c_v2/util/validationUtil";
export class d_o2c_employee_org extends d_o2c_employee_org_gen {
    public async OnValidate() {
        // let org =<KloEntitySet<d_o2c_employee_org>> await this.txn.getExecutedQuery("d_o2c_employee_org",{employee_id: this.employee_id});
        // this.txn.
        let role = (await this.txn.get$Role()).role_id;
        if (!this.functional_area && role === "MANAGER") {
            this.errors.push(new ValidationError(this, "functional_area", "106", "Functional Area is missing."));
        }
        // let flag = false;
        // if(this.is_primary == true){
        //     flag = true;
        // }
        // if(org){
        //     for(let i=0;i<org.length && flag == false;i++){
        //         if(org[i].is_primary == true){
        //             flag = true;
        //         }
        //     } 
        // }
        // if(flag == false){
        //     this.errors.push(new ValidationError(this,"is_primary","107","Atleast one organisation should be primary"));
        // }
        this.errors.concat(validationUtil.validateDate(this, [
            { start_date: "active_from", end_date: "active_till", msg: "Active Till should be greater than Active From" }
        ]))
    }

    public async access_tkn_org(oEvent) {
        const txn = oEvent.getTxn();
        try {
            await txn.recalculateUserAccessToken([this.employee_id])
        } catch (e) {
            this.error(`Failed to recalculate Access token to the id : ${this.employee_id} => ${e.message}`)
        }
    }
    public async onUpdateOrg(oEvent) {
        const txn = oEvent.getTxn();
        try {
            const hasPermission = await txn.hasPermission("manage_employee_lmi");
            if (!hasPermission) {
                const validationError = new ValidationError(this, "line_manager", "110", "Line manager can't be edited.");
                KloStandards.openValidationErrorPopup([validationError]);
                throw new ValidationError(this, "business_area", "110", "Employee Org can't be edited,only it is editable by Finance.");
            }
        } catch (error) {
            throw error; // Let CAP handle the error and return it to the UI
        }

    }
}