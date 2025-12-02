import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { d_o2c_employee_doc as d_o2c_employee_doc_gen } from "o2c_v2/entity_gen/d_o2c_employee_doc";
import { d_o2c_employee } from "./d_o2c_employee";
export class d_o2c_employee_doc extends d_o2c_employee_doc_gen {
    public async OnValidate() {
        let q = <KloEntitySet<d_o2c_employee>>await this.txn.getExecutedQuery('d_o2c_employee', { 'employee_id': this.employee_id,loadAll: true })
        // let errors: ValidationError[]=await super.OnValidate();
        let adr_pattern = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
        // let voter_pattern = /^[A-Z]{3}[0-9]{7}$/;
        let pan_pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!this.document_number && q[0].s_status !== "Draft" && q[0].status != "Draft") {
            this.errors.push(new ValidationError(this, "document_number", "101", "Document number is mandatory"));
        }
        if (this.doc_type == "DC02" && q[0].s_status !== "Draft") {
            if (!adr_pattern.test(this.document_number) && q[0].s_status !== "Draft" && q[0].status != "Draft") {
                this.errors.push(new ValidationError(this, "document_number", "102", "Adhaar is not proper"));
            }
        } else if (this.doc_type == "DC01" && q[0].s_status !== "Draft") {
            if (!pan_pattern.test(this.document_number) && q[0].s_status !== "Draft" && q[0].status != "Draft") {
                this.errors.push(new ValidationError(this, "document_number", "103", "PAN ID is not proper"));
            }
        }
        if (!this.file_location.hasAttachment && q[0].s_status !== "Draft" && q[0].status != "Draft") {
            this.errors.push(new ValidationError(this, "file_location", "104", "File Upload is mandatory."));
        }
        // return errors;
    }
}