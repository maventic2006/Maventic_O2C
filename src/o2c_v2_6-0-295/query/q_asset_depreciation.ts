
import { KloQueryForRule } from "kloBo/KloQueryForRule";
import { q_asset_depreciation as q_asset_depreciation_gen } from "o2c_v2/query_gen/q_asset_depreciation"
export class q_asset_depreciation extends q_asset_depreciation_gen {

    public async depreciation_search(Parameters) {

        let object = <KloQueryForRule>Parameters.getObject();
        let txn = Parameters.getTxn();

        object.setLoadAll(true);
        object.setExpandAll("r_asset_max_depreciation")

        const [startYearStr, endYearStr] = Parameters.object.fiscal_year?.split("-") || [];
        let startYear = parseInt(startYearStr, 10);
        let endYear = parseInt(endYearStr, 10);
        if (!startYearStr && !endYearStr && !Parameters.object.period) {
            Parameters.object.f_start_date = null;
            Parameters.object.f_end_date = null;
            Parameters.object.period = null;
        }
        else if (!Parameters.object.period && (startYearStr && endYearStr)) {
            // Default fiscal year range
            Parameters.object.f_start_date = new Date(`${startYear}-04-01`);
            Parameters.object.f_end_date = new Date(`${endYear}-03-31`);
        }
        else if (Parameters.object.period && (startYearStr && endYearStr)) {
            let allAssetNumbers = [];
            
            let qInstance = await txn.getQueryP("q_asset_depreciation_period"); //this way you can get instance of any query

            qInstance.setProperty("period", Parameters.object.period);
            qInstance.setProperty("fiscal_year", Parameters.object.fiscal_year);
            qInstance.setLoadAll(true);

            let es = await qInstance.executeP(); //execute here
            for (let i = 0; i < es.length; i++) {
                allAssetNumbers.push(es[i].asset_number)
            }

            console.log(allAssetNumbers)

            Parameters.object.exclude_asset = allAssetNumbers

            const monthIndex = parseInt(Parameters.object.period, 10) - 1;
            const actualMonth = (monthIndex + 3) % 12; // Fiscal to calendar month conversion
            const actualYear = actualMonth >= 3 ? startYear : startYear + 1

            Parameters.object.f_start_date = new Date(actualYear, actualMonth, 1);               // 1st day of the month
            Parameters.object.f_end_date = new Date(actualYear, actualMonth + 1, 0);

        }
    }
}