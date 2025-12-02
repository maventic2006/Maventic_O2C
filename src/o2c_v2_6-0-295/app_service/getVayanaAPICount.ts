import { KloAppService } from "kloBo/KloAppService";

export class getVayanaAPICount extends KloAppService {
    public async onExecute() {
        let auth_url = this.data.auth_url;
        let handle = this.data.handle;
        let handle_type = this.data.handle_type;
        let password = this.data.password;
        let token_duration = this.data.token_duration;
        let task_url = this.data.task_url;
        let from_date = this.data.from_date;
        let to_date = this.data.to_date;
        let org_id = this.data.org_id;

        try {
            const token = await this.getAuthToken(auth_url, handle, password, handle_type, token_duration);
            if (!token) throw new Error("Token generation failed");

            const taskData = await this.getTaskID(token, task_url, from_date, to_date, org_id);
            return {
                token: token,
                task_data: taskData
            }; // return the result for inspection
        } catch (err) {
            console.error("Execution failed:", err);
            throw err;
        }
    }

    public async getAuthToken(auth_url, handle, password, handle_type, token_duration): Promise<string | null> {
        const authUrl = auth_url;
        const requestBody = {
            handle: handle,
            password: password,
            handleType: handle_type,
            tokenDurationInMins: token_duration
        };

        try {
            const response = await fetch(authUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            return data.data.token;
        } catch (error) {
            console.error("Token fetch error:", error);
            return error;
        }
    }

    public async getTaskID(token: string, task_url, from_date, to_date, org_id): Promise<any> {
        const reportUrl = `${task_url}?from-date=${from_date}&to-date=${to_date}&email=true`;

        try {
            const response = await fetch(reportUrl, {
                method: "GET",
                headers: {
                    "X-FLYNN-N-ORG-ID": org_id,
                    "X-FLYNN-N-USER-TOKEN": token
                }
            });

            const data = await response.json();
            return data.data["task-id"]; // could be report or task status
        } catch (error) {
            console.error("API Count fetch error:", error);
            return error;
        }
    }
}
