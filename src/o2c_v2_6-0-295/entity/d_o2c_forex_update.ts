import { d_o2c_forex_update as d_o2c_forex_update_gen } from "o2c_v2/entity_gen/d_o2c_forex_update";
export class d_o2c_forex_update extends d_o2c_forex_update_gen {
    public get settlement_amount(): number {
        let amount = 0;
        if (this.exchange_rate && this.invoice_amount)
            amount = this.exchange_rate * this.invoice_amount;
        return amount;
    }
}