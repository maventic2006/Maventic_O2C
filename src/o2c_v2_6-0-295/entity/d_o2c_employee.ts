import { ValidationError } from "kloBo/_BoRestricted/query/QueryVars";
import { d_o2c_employee_designation } from "o2c_v2/entity/d_o2c_employee_designation";
import { d_o2c_designation_master } from "o2c_v2/entity_gen/d_o2c_designation_master";
import { d_idseries } from "o2c_v2/entity_gen/d_idseries";
import { d_o2c_employee as d_o2c_employee_gen } from "o2c_v2/entity_gen/d_o2c_employee";
// import { AdmServer } from 'kloBolServer/Adm/AdmUser2'
import { EventContext } from "kloBo/EventContext";
import { KloEntity } from "kloBo/KloEntity";
import { KloEntitySet } from "kloBo/KloEntitySet";
import { validationUtil } from "o2c_v2/util/validationUtil";
import { d_o2c_employee_org } from "o2c_v2/entity_gen/d_o2c_employee_org";
import {KloStandards} from "kloTouch/jspublic/KloStandards"
export class d_o2c_employee extends d_o2c_employee_gen {

    public get first_name():string {return this.g("first_name","string");}
    public set first_name(new_value:string) {
        this.s("first_name",new_value,"string",false,false);
        this.full_name = [this.first_name, this.last_name].filter(Boolean).join(" ");
    }

    public get last_name():string {return this.g("last_name","string");}
    public set last_name(new_value:string) {
        this.s("last_name",new_value,"string",false,false);
        this.full_name = [this.first_name, this.last_name].filter(Boolean).join(" ");
    }
    
    // maintaining Idseriess
    public async onCreateEntity(oEvent) {
        let newid = <d_o2c_employee>oEvent.getObject();
        debugger;
        try {

            if (!this.employee_id || this.employee_id == "####") {

                //This code needs to be changed after confirmation if we can avoid the creation of IDs on save.
                // let idquery = await this.txn.getQueryP('d_idseries')
                // idquery.setLoadAll(true);
                // let employeeid = await idquery.executeP();
                // let id = <d_idseries>(await employeeid.newEntityP(0, { s_object_type: 'employeeid' }, null));
                let emp_org = <KloEntitySet<d_o2c_employee_org>>await this.txn.getExecutedQuery('d_o2c_employee_org', { employee_id: this.s_created_by, loadAll: true });
                let id_config = await this.txn.getQueryP('d_o2c_id_confg');
                id_config.setLoadAll(true);
                let id_comp_code = await id_config.executeP()
                let regex = /[^a-z]/gi; // only count letters
                let str;

                if (emp_org) {
                    for (let i = 0; i < id_comp_code.length; i++) {
                        if (emp_org[0].company_code == id_comp_code[i].company_code && id_comp_code[i].type == "emp") {
                            let id = <d_idseries>(await this.txn.createEntityP("d_idseries", { s_object_type: id_comp_code[i].object_name }));
                            str = id.a_id;
                            let key_alphabet = str.replace(regex, "")
                            str = key_alphabet + str.split(key_alphabet)[1].padStart((id_comp_code[i].key_length - key_alphabet.length), "0");
                        }
                    }
                }

                // str = 'MM' + str.split('MM')[1].padStart(4, "0")
                //

                let approvequery = await this.txn.getQueryP('d_o2c_employee_approval_flow');
                approvequery.setLoadAll(true);
                let approvedetail = await approvequery.executeP();
                newid.full_name = newid.first_name + " " + newid.last_name;
                let emporglist = await newid.r_employee_org.fetch();
                let roleid = await this.txn.$SYSTEM.roleID;
                let i;
                for (i = 0; i < emporglist.length; i++) {
                    if (emporglist[i].is_primary == true) {
                        break;
                    }
                }
                let company_code = emporglist[i].company_code;
                let business_area = emporglist[i].business_area;
                let profit_center = emporglist[i].profit_centre;
                await approvedetail.newEntityP(0, { employee_id: str, pending_with_level: 0, approval_cycle: 1, approval_status: "Pending", business_area: business_area, company_code: company_code, profit_center: profit_center, insert_datetime: this.s_created_on, pending_with_role: roleid }, null);
                newid.pending_with = roleid;
                newid.employee_id = str;
                newid.r_employee_org[0].employee_id = str;
            } else {
                newid.employee_id = this.employee_id;
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    // maintaining userssss
    // testing.......
    public async onCreateUser(oEvent: EventContext) {
        this.info("On Create User Method called.")

        let admuser = await import('kloBolServer/Adm/AdmUser2')
        let data = <d_o2c_employee>oEvent.getObject();
        let adm = new admuser.AdmServer(this.txn);
        try {
            data.txn.addNotification('employee_invitatoin', this, {
                first_name: data.first_name, employee_id: data.employee_id, phone_number: data.phone_number, personal_mail: data.official_mail, main_url: data.main_url
            }, [data.employee_id.toLowerCase()]);
            this.info("Creating the user....");
            await adm.pushUser({
                r_first_name: data.first_name, r_login_id: data.employee_id.toLowerCase(), r_bp_id: "BP001",
                r_user_id: data.employee_id.toLowerCase(), r_email: data.official_mail, r_mobile_no: data.phone_number,
                r_designation: 'O2C_Employee', r_user_type: 'REG', r_manage_grp: "COMMON", r_last_name: data.last_name
            });
            this.info("User creation done. Starting the user activation.")
            let userPresentInKeyCloak = await adm.userExistsInAuthenticator(data.employee_id.toLowerCase())
            if (userPresentInKeyCloak) {
                await adm.activateUser(data.employee_id.toLowerCase());
            } else {
                await adm.approveUser(data.employee_id.toLowerCase());
            }

            // await adm.activateUser(data.employee_id.toLowerCase())
            this.info("User activation done...")
        } catch (e) {
            this.error(e);
            throw new Error(e);
        }
    }

    //Official Mail 
    public async officialMailUpdate(oEvent: EventContext) {
        this.info("Mail Update Method called.")
        let admuser = await import('kloBolServer/Adm/AdmUser2')
        let data = <d_o2c_employee>oEvent.getObject();
        let adm = new admuser.AdmServer(this.txn);
        // let prev_data = await data.fromP()
        // if (prev_data.official_mail != data.official_mail) {
        await adm.pushUser({
            r_first_name: data.first_name, r_last_name: data.last_name, r_login_id: data.employee_id.toLowerCase(), r_bp_id: "BP001",
            r_user_id: data.employee_id.toLowerCase(), r_email: data.official_mail, r_mobile_no: data.phone_number,
            r_user_type: 'REG', r_manage_grp: "COMMON"
        });
        // }
    }




    public async leave_build(oEvent) {

    }



    // LEAVE CREATION
    public async leave_creation(oEvent) {
        this.info("Leave Creation Method called.");
        let prev_data = await this.fromP()
        let valid_till = new Date(new Date().getFullYear(), 11, 31);
        let valid_from = new Date(new Date().getFullYear(), 0, 1)

        let leaveQuotaData = await this.txn.getExecutedQuery('d_o2c_emp_leave_quota', { 'employee_id': this.employee_id, loadAll: true });
        if (this.s_status == "Approved") {
            if (this.s_status == "Approved" && leaveQuotaData.length == 0) {
                try {
                    let entity = <d_o2c_employee>oEvent.getObject();
                    let businessArea = await this.txn.getExecutedQuery('d_o2c_employee_org', { 'employee_id': entity.employee_id, 'is_primary': true, loadAll: true });
                    //let designation = await entity.r_o2c_emp_designation.fetch();
                    let categoryData = await this.txn.getExecutedQuery('d_o2c_leave_category', { 'company_code': businessArea[0].company_code, 'business_area': businessArea[0].business_area, loadAll: true });
                    for (let i = 0; i < categoryData.length; i++) {
                        // CASUAL LEAVES
                        let currentDate = new Date();
                        if (categoryData[i].leave_types == "Casual" && categoryData[i].is_earned_leave == false) {
                            if (this.type == "T02") {
                                let alligentLeave = 0;
                                for (let alligent of categoryData) {
                                    if (alligent.leave_types == "Allegiant" && categoryData[i].is_earned_leave == false) {
                                        let diffTime = Math.abs(currentDate.getTime() - this.confirmation_date.getTime());
                                        let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        const exprience = Math.floor(days / 365);
                                        if (exprience <= 3) {
                                            for (let k = 1; k < exprience; k++) {
                                                alligentLeave = alligentLeave + (parseFloat(alligent.quota) / 3);
                                            }
                                        } else {
                                            alligentLeave = alligent.quota;
                                        }
                                    }
                                }
                                let quota, assin_quota = 0;
                                if (this.confirmation_date.getFullYear() >= currentDate.getFullYear()) {
                                    if (this.confirmation_date.getDate() <= 15) {
                                        quota = categoryData[i].quota / 12;
                                    } else if (this.confirmation_date.getDate() >= 15) {
                                        quota = categoryData[i].quota / 24;
                                    }
                                    let monthlyLeave = categoryData[i].quota / 12;
                                    for (let i = this.confirmation_date.getMonth() + 1; i <= 11; i++) {
                                        quota = quota + monthlyLeave;
                                    }
                                } else {
                                    quota = categoryData[i].quota;
                                }
                                assin_quota = quota;
                                quota = quota + alligentLeave;
                                await this.txn.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: valid_till, valid_from: valid_from, used_leave: 0, unused_leave: quota, seq_id: this.employee_id, no_of_days: quota, lmi: this.line_manager, employee_id: this.employee_id, company_code: businessArea[0].company_code, category_id: categoryData[i].category_id, business_area: categoryData[i].business_area, category_description: categoryData[i].category_description, leave_types: categoryData[i].leave_types, extended: 0, requested_leave: 0, allegiant_leave: alligentLeave, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: assin_quota });
                            }
                        }
                        // TRAINEE CASUAL
                        else if (categoryData[i].leave_types == "Trainee_c" && categoryData[i].is_earned_leave == false) {
                            if (this.type == "T01" && this.is_fresher == true) {
                                let diffTime = Math.abs(this.confirmation_date.getTime() - this.joining_date.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                let month = Math.floor(days / 30);
                                let quota = (parseFloat(categoryData[i].quota) / 12) * (month)
                                await this.txn.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: this.confirmation_date, valid_from: this.joining_date, used_leave: 0, unused_leave: quota, seq_id: this.employee_id, no_of_days: quota, lmi: this.line_manager, employee_id: this.employee_id, company_code: businessArea[0].company_code, category_id: categoryData[i].category_id, business_area: categoryData[i].business_area, category_description: categoryData[i].category_description, leave_types: categoryData[i].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: quota });
                            }
                        }
                        // PROVISION CASUAL
                        else if (categoryData[i].leave_types == "Probation_c" && categoryData[i].is_earned_leave == false) {
                            if (this.type == "T01" && this.is_fresher == false) {
                                let diffTime = Math.abs(this.confirmation_date.getTime() - this.joining_date.getTime());
                                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                let month = Math.floor(days / 30);
                                let quota = (parseFloat(categoryData[i].quota) / 12) * (month)
                                await this.txn.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: this.confirmation_date, valid_from: this.joining_date, used_leave: 0, unused_leave: quota, seq_id: this.employee_id, no_of_days: quota, lmi: this.line_manager, employee_id: this.employee_id, company_code: businessArea[0].company_code, category_id: categoryData[i].category_id, business_area: categoryData[i].business_area, category_description: categoryData[i].category_description, leave_types: categoryData[i].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: quota });
                            }
                        }
                        // SICK LEAVE 
                        else if (categoryData[i].leave_types == "Sick" && categoryData[i].is_earned_leave == false) {
                            let quota = 0;
                            if (this.joining_date.getFullYear() >= currentDate.getFullYear()) {
                                let monthlyLeave = (parseFloat(categoryData[i].quota) - 2) / 10;
                                for (let i = this.joining_date.getMonth(); i <= 11; i++) {
                                    if (i == 0 || i == 6) {
                                        quota = quota + 1;
                                    } else {
                                        quota = quota + monthlyLeave;
                                    }
                                }
                            } else {
                                quota = categoryData[i].quota;
                            }
                            await this.txn.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: valid_till, valid_from: this.joining_date, used_leave: 0, unused_leave: quota, seq_id: this.employee_id, no_of_days: quota, lmi: this.line_manager, employee_id: this.employee_id, company_code: businessArea[0].company_code, category_id: categoryData[i].category_id, business_area: categoryData[i].business_area, category_description: categoryData[i].category_description, leave_types: categoryData[i].leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: 0, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: quota });
                        }
                    }
                } catch (e) { console.log(e) }
            }
            // ON LINE MANAGER CHANGE OR EMPLOYEE CONFIRMATION DATE OR TYPE CHANGE
            else if ((this.s_status == "Approved" && leaveQuotaData[0].lmi != this.line_manager) || (this.confirmation_date.getTime() != prev_data.confirmation_date) || (this.type != prev_data.type)) {
                if (this.s_status == "Approved" && leaveQuotaData[0].lmi != this.line_manager) {
                    for (let i = 0; i < leaveQuotaData.length; i++) {
                        leaveQuotaData[i].lmi = this.line_manager;
                    }
                    let leaveHistory = await this.txn.getExecutedQuery('d_o2c_leave_management', { 'employee_id': this.employee_id, leave_status: "Applied", loadAll: true });
                    for (let i = 0; i < leaveHistory.length; i++) {
                        leaveHistory[i].lmi = this.line_manager;
                    }
                }
                if ((this.confirmation_date.getTime() != prev_data.confirmation_date) && this.type == prev_data.type) {
                    if (this.type == "T01" && this.is_fresher == true) {
                        await this.isProvisional('Trainee_c');
                    } else if (this.type == "T01") {
                        await this.isProvisional('Probation_c');
                    }
                } else if ((this.confirmation_date.getTime() == prev_data.confirmation_date) && (this.type != prev_data.type)) {
                    await this.afterEmpConfirm(prev_data, valid_till);
                } else if ((this.confirmation_date.getTime() != prev_data.confirmation_date) && (this.type != prev_data.type)) {
                    if (this.type == "T01" && this.is_fresher == true) {
                        await this.isProvisional('Trainee_c');
                    } else if (this.type == "T01") {
                        await this.isProvisional('Probation_c');
                    }
                    await this.afterEmpConfirm(prev_data, valid_till);
                }
            }
        }

        //
    }
    // MANAGING LEAVE IF CONFIRMATION DATE CHANGE
    public async isProvisional(lv_type) {
        let currdiffTime = Math.abs(this.confirmation_date.getTime() - this.joining_date.getTime());
        let days = Math.ceil(currdiffTime / (1000 * 60 * 60 * 24));
        let curr_month = Math.floor(days / 30);
        let cmp_bsn = await this.txn.getExecutedQuery('d_o2c_employee_org', { 'employee_id': this.employee_id, 'is_primary': true, loadAll: true });
        let category_leave_quota = await this.txn.getExecutedQuery('d_o2c_leave_category', { 'company_code': cmp_bsn[0].company_code, 'business_area': cmp_bsn[0].business_area, 'leave_types': lv_type, loadAll: true });
        let provisional_leave = await this.txn.getExecutedQuery('d_o2c_emp_leave_quota', { 'employee_id': this.employee_id, 'company_code': cmp_bsn[0].company_code, 'business_area': cmp_bsn[0].business_area, 'leave_types': lv_type, loadAll: true });
        let current_lv = (parseFloat(category_leave_quota[0].quota) / 12) * (curr_month)
        if (parseFloat(current_lv) > parseFloat(provisional_leave[0].assign_quota)) {
            let diff_lv = parseFloat(current_lv) - parseFloat(provisional_leave[0].assign_quota);
            provisional_leave[0].assign_quota = current_lv;
            provisional_leave[0].no_of_days = current_lv;
            provisional_leave[0].valid_to = new Date(this.confirmation_date)
            if (parseFloat(provisional_leave[0].extended) == 0) {
                provisional_leave[0].unused_leave = parseFloat(provisional_leave[0].unused_leave) + parseFloat(diff_lv);

            } else if (parseFloat(provisional_leave[0].extended) > 0) {
                let tempextended = parseFloat(provisional_leave[0].extended)
                provisional_leave[0].extended = parseFloat(provisional_leave[0].extended) - parseFloat(diff_lv)
                if (parseFloat(provisional_leave[0].extended) >= 0) {
                    provisional_leave[0].used_leave = parseFloat(provisional_leave[0].used_leave) + parseFloat(diff_lv)

                } else if (parseFloat(provisional_leave[0].extended) < 0) {
                    provisional_leave[0].used_leave = parseFloat(provisional_leave[0].used_leave) + tempextended
                    provisional_leave[0].unused_leave = parseFloat(provisional_leave[0].unused_leave) + (parseFloat(provisional_leave[0].no_of_days) - parseFloat(provisional_leave[0].used_leave))
                    provisional_leave[0].extended = parseFloat("0")
                }
            }
        } else if (parseFloat(current_lv) < parseFloat(provisional_leave[0].assign_quota)) {
            let diff = parseFloat(provisional_leave[0].assign_quota) - parseFloat(current_lv);
            provisional_leave[0].assign_quota = current_lv;
            provisional_leave[0].no_of_days = current_lv;
            provisional_leave[0].valid_to = new Date(this.confirmation_date)
            if (parseFloat(provisional_leave[0].used_leave) <= parseFloat(current_lv)) {
                provisional_leave[0].unused_leave = parseFloat(provisional_leave[0].unused_leave) - parseFloat(diff)
            } else if (parseFloat(provisional_leave[0].used_leave) > parseFloat(current_lv)) {
                let used_lv = parseFloat(provisional_leave[0].used_leave);
                provisional_leave[0].used_leave = parseFloat(current_lv)
                provisional_leave[0].extended = parseFloat(provisional_leave[0].extended) + (parseFloat(used_lv) - parseFloat(current_lv))
                provisional_leave[0].unused_leave = parseFloat("0")
            }
        }
    }
    // AFTER LEAVE CONFIRM
    public async afterEmpConfirm(prev_data, valid_till) {
        if (this.type == "T02" && prev_data.type == "T01") {
            let cas_quota_earned = 0.00;
            let cmp_bsn_per = await this.txn.getExecutedQuery('d_o2c_employee_org', { 'employee_id': this.employee_id, 'is_primary': true, loadAll: true });
            let category_data = await this.txn.getExecutedQuery('d_o2c_leave_category', { 'company_code': cmp_bsn_per[0].company_code, 'business_area': cmp_bsn_per[0].business_area, 'leave_types': 'Casual', loadAll: true });
            let current_date = new Date();
            current_date.setHours(0, 0, 0, 0);
            let category_leave_quota_cas;
            let category_leave_quota_earned;
            for (let i = 0; i < category_data.length; i++) {
                if (category_data[i].is_earned_leave == false) {
                    category_leave_quota_cas = category_data[i];
                }
                if (category_data[i].is_earned_leave == true) {
                    category_leave_quota_earned = category_data[i];
                }
            }
            let per_casual = await this.txn.getExecutedQuery('d_o2c_emp_leave_quota', { 'employee_id': this.employee_id, 'category_id': category_leave_quota_cas.category_id });
            if (per_casual.length == 0) {
                /* casual leave days calculation  */
                // let currdiffTime = Math.abs(valid_till.getTime() - this.confirmation_date.getTime());
                // let days = Math.ceil(currdiffTime / (1000 * 60 * 60 * 24));
                // let month = Math.floor(days / 30);
                // let rem_days = (days) - (month * 30)

                let month = this.monthsBetween(this.confirmation_date, valid_till);

                let cas_quota = (parseFloat(category_leave_quota_cas.quota) / 12) * (month);
                if (this.confirmation_date.getDate() < 15) {
                    cas_quota = cas_quota + ((parseFloat(category_leave_quota_cas.quota) / 12));
                } else if (this.confirmation_date.getDate() > 15) {
                    cas_quota = cas_quota + ((parseFloat(category_leave_quota_cas.quota) / 24));
                }

                /* casual leave days calculation  */
                /* earned leave days calculation  */

                // let diffrence_time = Math.abs(current_date.getTime() - this.confirmation_date.getTime());
                // let days_btw_conf_curr = Math.ceil(diffrence_time / (1000 * 60 * 60 * 24));
                // let month_btw_conf_curr = Math.floor(days_btw_conf_curr / 30);
                // let rem_btw_conf_curr = (days_btw_conf_curr) - (month_btw_conf_curr * 30)


                if (current_date.getTime() >= new Date(this.confirmation_date).getTime()) {
                    let month_btw_conf_curr = this.monthsBetween(this.confirmation_date, current_date);

                    cas_quota_earned = (parseFloat(category_leave_quota_earned.quota) / 12) * (month_btw_conf_curr)

                    if (this.confirmation_date.getDate() < 15) {
                        cas_quota_earned = cas_quota_earned + ((parseFloat(category_leave_quota_earned.quota) / 12))
                    }
                }

                /* earned leave days calculation  */
                let core_cas_quota = cas_quota;

                cas_quota = parseFloat(cas_quota) + parseFloat(cas_quota_earned);

                await this.txn.createEntityP('d_o2c_emp_leave_quota', { s_object_type: -1, valid_to: valid_till, valid_from: this.confirmation_date, used_leave: 0, unused_leave: cas_quota, seq_id: this.employee_id, no_of_days: cas_quota, lmi: this.line_manager, employee_id: this.employee_id, company_code: cmp_bsn_per[0].company_code, category_id: category_leave_quota_cas.category_id, business_area: cmp_bsn_per[0].business_area, category_description: category_leave_quota_cas.category_description, leave_types: category_leave_quota_cas.leave_types, extended: 0, requested_leave: 0, allegiant_leave: 0, earned_leave: cas_quota_earned, carry_forward: 0, rem_carry_forward: 0, used_carry_forward: 0, assign_quota: core_cas_quota, carry_forward_till: new Date(new Date().getFullYear(), 2, 31) });
            }
        }
    }

    public monthsBetween(date1, date2) {
        // Ensure the earlier date is date1
        if (date1.getTime() > date2.getTime()) {
            [date1, date2] = [date2, date1];
        }

        const year1 = date1.getFullYear();
        const month1 = date1.getMonth();
        const year2 = date2.getFullYear();
        const month2 = date2.getMonth();

        // Calculate the total number of months between the two dates
        const totalMonths = (year2 - year1) * 12 + (month2 - month1);

        return totalMonths;
    }
    //Leave management close

    /*Validation Function to validate the entity data.*/
    public async OnValidate() {
        /*Storing the login id and getting the data of entity which has been stored in the Db.*/
        let userid = (await this.txn.get$User()).login_id;
        let entity = <KloEntitySet<d_o2c_employee>>await this.txn.getExecutedQuery("d_o2c_employee", { "employee_id": this.employee_id, "skipMap": true, loadAll: true });

        /*Validating the phone no and mail.*/
        this.errors.concat(validationUtil.validatePattern(this, [
            { pattern: /^[0-9]{10}$/, entityPropertyId: "phone_number", msg: "Phone number is not correct.", errorCode: "101" },
            { pattern: /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/, entityPropertyId: "personal_mail", msg: "Personal mail is not correct.", errorCode: "102" }
        ]));


        /*Validating the confirmation date, dob, father name and marital status.*/
        if (!this.confirmation_date) {
            this.errors.push(new ValidationError(this, "confirmation_date", "103", "Confirmation Date is missing."));
        }
        if (this.confirmation_date) {
            this.errors.concat(validationUtil.validateDate(this, [
                { start_date: "joining_date", end_date: "confirmation_date", msg: "Confirmation Date must be greater than joining date", errorCode: "106" }
            ]));
        }
        if (entity.length) {
            if (!this.date_of_birth && this.s_status !== "Draft" && userid !== this.s_created_by && this.s_status == "Pending" && this.status != "Draft") {
                this.errors.push(new ValidationError(this, "date_of_birth", "108", "Date of Birth is missing."));
            }
            if (!this.father_name && this.s_status !== "Draft" && userid !== this.s_created_by && this.s_status == "Pending" && this.status != "Draft") {
                this.errors.push(new ValidationError(this, "father_name", "109", "Father Name is missing."));
            }
            if (!this.maritial_status && this.s_status !== "Draft" && userid !== this.s_created_by && this.s_status == "Pending" && this.status != "Draft") {
                this.errors.push(new ValidationError(this, "maritial_status", "110", "Marital Status is missing."));
            }
        }
        if (this.is_active == false && !this.last_working_day) {
            this.errors.push(new ValidationError(this, "last_working_day", "111", "Last Working Day is missing."));
        }
    }
    public async access_tkn_lmi(oEvent) {
        this.info("recalculating user access token.");
        const txn = oEvent.getTxn();
        if (this.trans_lmi) {
            try {
                await txn.recalculateUserAccessToken();
            } catch (e) {
                this.error(`Failed to recalculate Access token to the id : ${this.employee_id} => ${e.message}`);
            }
        }
    }
    public async onUpdateLMI(oEvent) {
        this.info("Updating Line Manager");
        const txn = oEvent.getTxn();
        let emp_data = <KloEntitySet<d_o2c_employee>>await txn.getExecutedQuery('d_o2c_employee', { employee_id: this.employee_id, partialSelected: 'line_manager', skipMap: true });
        if (emp_data[0].line_manager.toLowerCase() !== this.line_manager.toLowerCase()) {
            try {
                const hasPermission = await txn.hasPermission("manage_employee_lmi");
                if (!hasPermission) {
                    const validationError = new ValidationError(this, "line_manager", "110", "Line manager can't be edited.");
                    KloStandards.openValidationErrorPopup([validationError]);
                    throw new ValidationError(this, "line_manager", "110", "Line manager can't be edited.");
                }
                this.trans_lmi = true;
            } catch (error) {
                throw error; // Let CAP handle the error and return it to the UI
            }
        }
    }
    /////
}