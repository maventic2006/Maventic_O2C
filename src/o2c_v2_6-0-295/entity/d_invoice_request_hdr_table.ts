import { d_invoice_request_hdr_table as d_invoice_request_hdr_table_gen } from "o2c_v2/entity_gen/d_invoice_request_hdr_table"
export class d_invoice_request_hdr_table extends d_invoice_request_hdr_table_gen {
    public get milestone_name(): string {
        const stored = this.g("milestone_name", "string");
        if (stored) return stored;

        return this.r_invoice_milestone?.[0]?.billing_milestone_name
            ?? this.r_invoice_schedule?.[0]?.description
            ?? this.r_invoice_volume?.[0]?.milestone_description
            ?? "";
    }

    public set milestone_name(value: string) {
        this.s("milestone_name", value, "string", false, false);
    }


    public get milestone_date(): Date {
        return this.r_invoice_milestone?.[0]?.actual_date
            ?? this.r_invoice_schedule?.[0]?.actual_date
            ?? this.r_invoice_volume?.[0]?.milestone_date

    }

    public get milestone_amount(): string {
        return this.r_invoice_milestone?.[0]?.amount?.toString()
            ?? this.r_invoice_schedule?.[0]?.expected_amount?.toString()
            ?? this.r_invoice_volume?.[0]?.amount?.toString()
            ?? "0";
    }

    public get trans_invoice_description(): string {
        const stored = this.g("trans_invoice_description", "string");
        if (stored) return stored;

        return this.r_invoice_milestone?.[0]?.invoice_description?.toString()
            ?? this.r_invoice_schedule?.[0]?.invoice_description?.toString()
            ?? this.r_invoice_volume?.[0]?.invoice_description?.toString()
            ?? "0";
    }

    public set trans_invoice_description(value: string) {
        this.s("trans_invoice_description", value, "string", false, false);
    }

    public get rate(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.rate?.toString()
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.rate?.toString()
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.rate?.toString()
            ?? "0";
    }

    public get quantity(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.item_pd_or_qty?.toString()
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.item_pd_or_qty?.toString()
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.item_pd_or_qty?.toString()
            ?? "0";
    }
    public get billing_type(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.item_category?.toString()
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.item_category?.toString()
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.item_category?.toString()
            ?? "0";
    }
    public get client_name(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.bill_to_customer
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.bill_to_customer
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.bill_to_customer
            ?? "";
    }
    public get bill_to_location(): string {
        const address = this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.r_so_header_address[0]
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.r_so_header_address[0]
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.r_so_header_address[0]
            ?? null;

        if (address) {
            return `${address.address_1 || ""} ${address.address_2 || ""} ${address.care_of || ""} ${address.city || ""} ${address.district || ""} ${address.geo_location || ""} ${address.iso_code || ""} ${address.pincode || ""} ${address.state || ""}`.trim();
        }

        return "";
    }

    public get project_name(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.project_name
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.project_name
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.project_name
            ?? "";
    }
    public get currency(): string {
        return this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.currency
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.currency
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.currency
            ?? "";
    }

    public get primary_profit_center(): string {
        const findProfitCenter = (source?: any) => {
            const profitCenters = source?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.r_profit_center
                ?? source?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.r_profit_center
                ?? source?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.r_profit_center;

            return profitCenters?.find((pc: any) => pc.primary_profit_center)?.profit_center
                ?? profitCenters?.[0]?.profit_center;
        };

        return findProfitCenter(this.r_invoice_milestone)
            ?? findProfitCenter(this.r_invoice_schedule)
            ?? findProfitCenter(this.r_invoice_volume)
            ?? "";
    }



    public get trans_customer_gstin(): string {
        return (
            this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.r_so_customer_map?.[0]?.gstin_vat
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.r_so_customer_map?.[0]?.gstin_vat
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.r_so_customer_map?.[0]?.gstin_vat
            ?? ""
        );
    }

    public get trans_billing_mode(): string {
        return (
            this.r_invoice_milestone?.[0]?.r_milestone_item?.[0]?.r_item_header?.[0]?.r_so_customer?.[0]?.billing_mode
            ?? this.r_invoice_schedule?.[0]?.r_schedule_item?.[0]?.r_item_header?.[0]?.r_so_customer?.[0]?.billing_mode
            ?? this.r_invoice_volume?.[0]?.r_volume_item?.[0]?.r_item_header?.[0]?.r_so_customer?.[0]?.billing_mode
            ?? ""
        );
    }

    public get transient_credit_note_amt(): string {
        let total = 0;

        if (this.r_invoice_credit_note && Array.isArray(this.r_invoice_credit_note)) {
            for (const item of this.r_invoice_credit_note) {
                const amount = parseFloat(item.credit_note_total_amount) || 0;
                total += amount;
            }
        }

        return total.toFixed(2);
    }



}