import { KloAppService } from "kloBo/KloAppService";

export class getVayanaTaskStatus extends KloAppService {
    public async onExecute() {
        // let auth_url = this.data.auth_url;
        // let handle = this.data.handle;
        // let handle_type = this.data.handle_type;
        // let password = this.data.password;
        // let token_duration = this.data.token_duration;
        let task_id = this.data.task_id;
        let token = this.data.token;
        let status_url = this.data.status_url;
        // let to_date = this.data.to_date;
        let org_id = this.data.org_id;

        try {
            const status = await this.getTaskStatus(task_id, token, org_id, status_url);

            return status; // return the result for inspection
        } catch (err) {
            console.error("Execution failed:", err);
            throw err;
        }
    }

    public async getTaskStatus(task_id, token, org_id, status_url): Promise<string | null> {
        const statusUrl = `${status_url}${task_id}`;

        try {
            const response = await fetch(statusUrl, {
                method: "GET",
                headers: {
                    "X-FLYNN-N-ORG-ID": org_id,
                    "X-FLYNN-N-USER-TOKEN": token
                },

            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Status fetch error:", error);
            return error;
        }
    }


}
