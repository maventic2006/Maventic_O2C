import { q_invoice_email as q_invoice_email_gen } from "o2c_v2/query_gen/q_invoice_email"
export class q_invoice_email extends q_invoice_email_gen {

    public async onInvoiceMail(oEvent) {
        let invoiceEntity = await this.txn.getExecutedQuery("d_invoice_request_hdr_table", { inv_request_id: oEvent.object.invoice_number })
        let invoiceItemEntity = await this.txn.getExecutedQuery("d_o2c_invoice_item_table", { invoice_number: oEvent.object.invoice_number })
        let customerContactId = await this.txn.getExecutedQuery("d_o2c_customers_contact", { k_id: oEvent.object.customer_id })
        this.txn.addNotification(
            'invoice_customer_email',
            customerContactId[0],
            {
                first_name: customerContactId[0].contact_name,
                invoice_number: invoiceEntity[0].inv_request_id,
                milestone_number: invoiceItemEntity[0].milestone_amount,
                milestone_name: invoiceItemEntity[0].milestone_name,
                project_name: invoiceItemEntity[0].project_name,
                current_date: new Date().toLocaleDateString('en-GB'),
            },
            ['vardhanjaindit@gmail.com'],
            ['vardhan@maventic.com'], // cc_list
            invoiceEntity[0].inv_request_id // ref_id
        );

        await this.txn.commitP();
    }
}

