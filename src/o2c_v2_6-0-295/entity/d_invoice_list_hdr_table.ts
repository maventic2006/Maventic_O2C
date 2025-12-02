import { d_invoice_list_hdr_table as d_invoice_list_hdr_table_gen } from "o2c_v2/entity_gen/d_invoice_list_hdr_table"
export class d_invoice_list_hdr_table extends d_invoice_list_hdr_table_gen {


    public get age_of_invoice(): string {
        if (!this.invoice_date) return '';

        const today = new Date();
        const invoiceDate = new Date(this.invoice_date);

        // Reset time part to avoid partial day issues
        today.setHours(0, 0, 0, 0);
        invoiceDate.setHours(0, 0, 0, 0);

        const diffInMs = today.getTime() - invoiceDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        return diffInDays.toString();
    }

    public get number_of_clubbed_invoices(): string {
        if (!this.r_invoice_list_request || !Array.isArray(this.r_invoice_list_request)) {
            return '0';
        }

        return this.r_invoice_list_request.length.toString();
    }

    public get expected_payment(): string {
        const total = Number(this.total_invoice ?? 0);
        const tds = Number(this.r_invoice_customer?.[0]?.tds_value ?? 0);

        const expected = total - (tds / 100) * total;
        return expected.toFixed(2);
    }

    public get transient_credit_note_amt(): string {
        let total = 0;

        if (Array.isArray(this.r_invoice_list_request)) {
            for (const invoice of this.r_invoice_list_request) {
                if (Array.isArray(invoice.r_invoice_credit_note)) {
                    for (const creditNote of invoice.r_invoice_credit_note) {
                        const amount = parseFloat(creditNote.credit_note_total_amount) || 0;
                        total += amount;
                    }
                }
            }
        }

        return total.toFixed(2);
    }



}