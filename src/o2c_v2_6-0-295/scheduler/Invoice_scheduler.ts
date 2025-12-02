import kloScheduler from 'kloBo/kloScheduler/KloScheduler';
import { KloTransaction } from 'kloBo/KloTransaction';

export class Invoice_scheduler extends kloScheduler {
  public async onExecute() {
    return new Promise((res) => {
      setTimeout(async () => {
        let txn: KloTransaction = this.eventContext.getTxn();

        try {
          const invoiceList = await txn.getExecutedQuery('d_o2c_employee_salary_hdr', {
            loadAll: true,
          })
          res(invoiceList);
        } catch (error) {
          res({
            status: "error",
            message: error.message,
          });
        }
      }, 30000);
    });
  }
}
