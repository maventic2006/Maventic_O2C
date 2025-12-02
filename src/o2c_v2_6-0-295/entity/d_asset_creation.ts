import {d_asset_creation as d_asset_creation_gen} from "o2c_v2/entity_gen/d_asset_creation"
import { validationUtil } from "o2c_v2/util/validationUtil"
export class d_asset_creation extends d_asset_creation_gen{
    // public async OnValidate(){
    //     if (this.asset_class == "1000") {
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //           { entityPropertyId: "registry_no", msg: "Registry Number is mandatory" },
    //           { entityPropertyId: "registry_date", msg: "Registry Date is mandatory" },
    //           { entityPropertyId: "area", msg: "Area is mandatory" },
    //           { entityPropertyId: "customer_care_no", msg: "Customer Care Number is mandatory" },
    //         ]))
    //       }
    //       if(this.asset_class == "2000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "registry_no", msg: "Registry Number is mandatory" },
    //             { entityPropertyId: "registry_date", msg: "Registry Date is mandatory" },
    //             { entityPropertyId: "area", msg: "Area is mandatory" },
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "3000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "service_vendor", msg: "Service Vendor is mandatory" },
    //             { entityPropertyId: "equipment_number", msg: "Equipment Number is mandatory" },
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care Number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "4000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care Number is mandatory" },
    //             { entityPropertyId: "color", msg: "Color is mandatory" },
    //             { entityPropertyId: "star_rating", msg: "Star Rating is mandatory" },
    //           ]))
    //       }

    //       if(this.asset_class == "5000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care Number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "chasis_no", msg: "Chasis Number is mandatory" },
    //             { entityPropertyId: "engine_no", msg: "Engine Number is mandatory" },
    //             { entityPropertyId: "reg_no", msg: "Reg Number is mandatory" },
    //             { entityPropertyId: "color", msg: "Color is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "6000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "mac_address", msg: "Mac Address is mandatory" },
    //             { entityPropertyId: "service_vendor", msg: "Service Vendor is mandatory" },
    //             { entityPropertyId: "asset_config", msg: "Asset Config is mandatory" },
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "ram", msg: "RAM is mandatory" },
    //             { entityPropertyId: "os", msg: "OS is mandatory" },
    //             { entityPropertyId: "cpu", msg: "CPU is mandatory" },
    //             { entityPropertyId: "color", msg: "Color is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //             { entityPropertyId: "star_rating", msg: "Star Rating is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "7000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "mac_address", msg: "Mac Address is mandatory" },
    //             { entityPropertyId: "service_vendor", msg: "Service Vendor is mandatory" },
    //             { entityPropertyId: "asset_config", msg: "Asset Config is mandatory" },
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "ram", msg: "RAM is mandatory" },
    //             { entityPropertyId: "os", msg: "OS is mandatory" },
    //             { entityPropertyId: "cpu", msg: "CPU is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //             { entityPropertyId: "star_rating", msg: "Star Rating is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "8000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //             { entityPropertyId: "star_rating", msg: "Star Rating is mandatory" },
    //             { entityPropertyId: "color", msg: "Color is mandatory" },
    //           ]))
    //       }
    //       if(this.asset_class == "9000"){
    //         this.errors.concat(validationUtil.validateMandatory(this, [
    //             { entityPropertyId: "asset_config", msg: "Asset Config is mandatory" },
    //             { entityPropertyId: "year_of_make", msg: "Year of making is mandatory" },
    //             { entityPropertyId: "customer_care_no", msg: "Customer Care number is mandatory" },
    //             { entityPropertyId: "version", msg: "Version is mandatory" },
    //             { entityPropertyId: "capacity", msg: "Capacity is mandatory" },
    //             { entityPropertyId: "star_rating", msg: "Star Rating is mandatory" },
    //             { entityPropertyId: "color", msg: "Color is mandatory" },
    //           ]))
    //       }
    //       this.errors.concat(validationUtil.validateMandatory(this, [
    //         { entityPropertyId: "serial_number", msg: "Serial Number is mandatory" },
    //         { entityPropertyId: "model_number", msg: "Model Number is mandatory" },
    //         { entityPropertyId: "asset_capitalization_date", msg: "Asset Capitalization Date is mandatory" },
    //         { entityPropertyId: "depriciation_method", msg: "Depreciation Method is mandatory" },
    //         { entityPropertyId: "life_of_asset", msg: "Life Of Asset is mandatory" },
    //         { entityPropertyId: "net_book_value", msg: "Net Book Value is mandatory" },
    //         { entityPropertyId: "depriciation_rate", msg: "Depreciation Rate is mandatory" },
    //         { entityPropertyId: "accumulated_depriciation", msg: "Accumulated Depriciation is mandatory" },
    //       ]))
    // }
}