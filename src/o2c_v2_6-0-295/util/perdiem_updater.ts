import { KloTransaction } from "kloBo/KloTransaction";
import { parse } from "path";

export class perdiem_updater {
    public static async fixPerDieminExpense(txn,soid,traveltype,newPerDiemRate){
        const receiptData = await txn.getExecutedQuery("q_receipt_change_pd", {
            loadAll: true,
            so_id: soid,
            expandAll: "r_receipt_expense"
          });
      
          if (!receiptData?.length) {
            return { status: "no_data", message: "No receipts found for this Sales Order." };
          }
      
          const expenseTotals: Record<string, string> = {};
      
          // Process each receipt
          for (const receipt of receiptData) {
            let totalINR = 0;
            const exchangeRate =
              receipt.exchange_rate && receipt.exchange_rate !== 0
                ? receipt.exchange_rate
                : 1;
      
            // --- LOCAL TRAVEL CASE ---
            if (traveltype === "Local" && receipt.r_local_perdiem?.length) {
              for (const dec of receipt.r_local_perdiem) {
                dec.per_amount = newPerDiemRate;
      
                // Only add if claim is true
                if (dec.claim === true) {
                  totalINR += newPerDiemRate;
                }
      
                await txn.updateTN("d_local_pd_declaration", dec);
              }
            }
      
            // --- OUTSTATION / NORMAL TRAVEL CASE ---
            else if (receipt.r_receipt_per_diem?.length) {
              for (const dec of receipt.r_receipt_per_diem) {
                dec.per_amount = newPerDiemRate;
      
                if (dec.claim === true) {
                  totalINR += newPerDiemRate;
                }
      
                await txn.updateTN("d_expense_perdiem_dcl", dec);
              }
            }
      
            // --- UPDATE RECEIPT ---
            receipt.receipt_amount = totalINR;
            receipt.expense_amount = totalINR;
            receipt.reimbursement_amount = totalINR * exchangeRate;
      
            await txn.updateTN("expense_receipt_list", receipt);
      
            // --- UPDATE EXPENSE TOTALS ---
            const parentExpense = receipt.r_receipt_expense?.[0];
            if (parentExpense) {
              const expId = parentExpense.expense_id;
      
              // Parse "100USD,500INR"
              const prevTotal = parentExpense.total_expense_amount || "";
              const currencyParts = prevTotal.split(",").map((s) => s.trim());
              const currMap: Record<string, number> = {};
      
              for (const c of currencyParts) {
                const match = c.match(/(\d+)([A-Z]+)/);
                if (match) currMap[match[2]] = parseFloat(match[1]);
              }
      
              // Add new total
              currMap["INR"] = (currMap["INR"] || 0) + totalINR;
              currMap["USD"] = (currMap["USD"] || 0) + totalINR / exchangeRate;
      
              // Rebuild
              const newTotalStr = Object.entries(currMap)
                .map(([curr, amt]) => `${amt}${curr}`)
                .join(", ");
      
              parentExpense.total_expense_amount = newTotalStr;
              parentExpense.total_reimbursement_amount = newTotalStr;
      
              await txn.updateTN("expense_list", parentExpense);
      
              expenseTotals[expId] = newTotalStr;
            }
          }
      
          return {
            status: "success",
            message: "Per diem declarations, receipts, and expenses updated successfully.",
            updated_expenses: expenseTotals,
          };
        }
    }