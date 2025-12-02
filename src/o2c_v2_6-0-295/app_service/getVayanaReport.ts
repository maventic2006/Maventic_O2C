import { KloAppService } from "kloBo/KloAppService";
import jszip = require("kloExternal/jszip.min");
// const pako = require("pako");
// const Papa = require("papaparse");

export class getVayanaReport extends KloAppService {
    public async onExecute() {
        // let auth_url = this.data.auth_url;
        // let handle = this.data.handle;
        // let handle_type = this.data.handle_type;
        // let password = this.data.password;
        // let token_duration = this.data.token_duration;
        let task_id = this.data.task_id;
        let token = this.data.token;
        let report_url = this.data.report_url;
        // let to_date = this.data.to_date;
        let org_id = this.data.org_id;

        try {
            const status = await this.getReport(task_id, token, org_id, report_url);

            return status; // return the result for inspection
        } catch (err) {
            console.error("Execution failed:", err);
            throw err;
        }
    }

    public async getReport(task_id, token, org_id, report_url) {

        const reportUrl = `${report_url}${task_id}`;
        
        try {
            const response = await fetch(reportUrl, {
                method: "GET",
                headers: {
                    "X-FLYNN-N-ORG-ID": org_id,
                    "X-FLYNN-N-USER-TOKEN": token,
                    "Accept": "application/zip"
                },

            });

            if (!response.ok) {
                console.error("Download failed:", response.statusText);
                return null;
            }
            const buffer = await response.arrayBuffer(); // Get binary ZIP
            const zip = await jszip.loadAsync(buffer);

            for (const fileName of Object.keys(zip.files)) {
                if (fileName.endsWith(".csv")) {
                    const file = zip.files[fileName];
                    // Read as text (already uncompressed by JSZip)
                    const csvText = await file.async("string");

                    // Use native CSV parser
                    const parsedData = this.parseCSV(csvText);
                    return parsedData;
                }

            }
        } catch (error) {
            console.error("Status fetch error:", error);
            return null;
        }
    }

    public parseCSV(csvText) {
        const lines = csvText.trim().split("\n");
        const headers = lines[0].split(",");

        return lines.slice(1).map(line => {
            const values = line.split(",");
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i]?.trim();
            });
            return obj;
        });
    }

}

