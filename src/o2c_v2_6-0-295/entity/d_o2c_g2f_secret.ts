import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_o2c_g2f_secret as d_o2c_g2f_secret_gen } from "o2c_v2/entity_gen/d_o2c_g2f_secret"
export class d_o2c_g2f_secret extends d_o2c_g2f_secret_gen {
  public async secretKeyCreation() {
    //❌Below code is move to APP Services as the creation is happening in the controller earlier for remove creation access we have do this
    
    // let employeeSecretKeyData = await this.txn.getExecutedQuery("d_o2c_g2f_secret", { loadAll: true, user_id: this.user_id });
    // if (employeeSecretKeyData.length==0) {
    //   const speakeasy = require("speakeasy");
    //   // Step 1: Generate a secret key for the user
    //   const secret = speakeasy.generateSecret({
    //     name: this.user_id,
    //   });
    //   this.secret_key = secret.base32;
    //   // console.log("employee_id:", this.user_id);
    //   // console.log("Secret:", secret.base32);
    // }
    // else {
    //   throw new ValidationError(this, "user_id", "110", "This user secret key is already created");
    // }
  }
  public async onValidateTotp() {

  }
}