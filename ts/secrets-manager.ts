import path from "path";
import { TokenObject } from "./models/secret-tokens";
import axios, { AxiosError } from "axios";
import { exit } from "process";
import { config as setupENV } from 'dotenv';
import { Workspaces } from "./models/workspace";
import { Convert } from "./models/secret-response.js";

export default class SecretsManager {
    private static theInstance: SecretsManager | null = null;
    private tokenObject: TokenObject | null = null;
    private INFISICAL_TOKEN: string = "";
    private CLIENT_SECRET: string = "";
    private CLIENT_ID: string = "";
    private INFISICAL_ADDRESS: string = "";
    private INFISICAL_ORG_ID: string = "";
    private SECRETS_PROJECT_NAME: string = "";
    private workspaceId: string = "";

    private constructor() {
        setupENV({ path: path.resolve(".env") })

        const { INFISICAL_TOKEN, CLIENT_SECRET, CLIENT_ID, INFISICAL_ADDRESS, INFISICAL_ORG_ID, SECRETS_PROJECT_NAME } = process.env;
        if (INFISICAL_TOKEN && CLIENT_SECRET && CLIENT_ID && INFISICAL_ADDRESS && INFISICAL_ORG_ID && SECRETS_PROJECT_NAME) {
            this.INFISICAL_TOKEN = INFISICAL_TOKEN;
            this.CLIENT_SECRET = CLIENT_SECRET;
            this.CLIENT_ID = CLIENT_ID;
            this.INFISICAL_ADDRESS = INFISICAL_ADDRESS;
            this.INFISICAL_ORG_ID = INFISICAL_ORG_ID;
            this.SECRETS_PROJECT_NAME = SECRETS_PROJECT_NAME;
        } else {
            console.log("Couldn't find Infisical credentials in the environment");
            exit(1)
        }
    }

    private get authHeader() {
        return {
            "Authorization": `Bearer ${this.tokenObject!.accessToken}`,
            "Content-Type": 'application/json'
        }
    }

    static get instance(): SecretsManager {
        if (!SecretsManager.theInstance) {
            SecretsManager.theInstance = new SecretsManager()
        }

        return SecretsManager.theInstance;
    }

    async setupAccessTokens(refresh: boolean = false) {
        const secretsEndpoint = this.INFISICAL_ADDRESS + path.join("api", "v1", "auth", "universal-auth", "login")
        const headers = { "Content-Type": "application/json" }
        const postData = {
            clientId: this.CLIENT_ID,
            clientSecret: this.CLIENT_SECRET
        }

        try {
            const { data } = await axios.post(secretsEndpoint, postData, { headers })
            this.tokenObject = JSON.parse(JSON.stringify(data))

            if (!refresh) {
                console.log('Setting workspace id...');
                await this.setupWorkspaceId();
            }

            this.setTimeoutLong(this.tokenObject!.expiresIn * 1000, async () => await this.setupAccessTokens(true))
        } catch (er) {
            console.log(er);
            exit(1)
        }
    }

    private async setupWorkspaceId() {
        const secretsEndpoint = this.INFISICAL_ADDRESS + path.join("api", "v2", "organizations", this.INFISICAL_ORG_ID, "workspaces")
        return await axios.get(secretsEndpoint, { headers: this.authHeader })
            .then(r => {
                const workspaces = (JSON.parse(JSON.stringify(r.data)) as Workspaces).workspaces;
                const workspace = workspaces.find(w => w.name === this.SECRETS_PROJECT_NAME);
                this.workspaceId = workspace!._id;
            })
    }

    async updateBrowserURL(browserURL: string) {
        const secretsEndpoint = this.INFISICAL_ADDRESS + path.join("api", "v3", "secrets", "raw", "CHROME_URL")
        const patchData = JSON.stringify({
            environment: "dev",
            secretValue: browserURL,
            workspaceId: this.workspaceId
        })

        try {
            const r = await axios.patch(secretsEndpoint, patchData, { headers: this.authHeader })
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.data.type === 'secret_not_found_error') {
                    return await this.createBrowserURLSecret(browserURL)
                        .then(r => r.status)
                        .catch(e => console.log(e))
                }
            } else {
                throw error
            }
        }
    }

    async createBrowserURLSecret(browserURL: string) {
        const secretsEndpoint = this.INFISICAL_ADDRESS + path.join("api", "v3", "secrets", "raw", "CHROME_URL")
        const createData = {
            environment: "dev",
            secretValue: browserURL,
            workspaceId: this.workspaceId,
            type: "shared"
        }

        return await axios.post(secretsEndpoint, createData, { headers: this.authHeader })
    }

    async getSecret(secretName: string) {

        let secretsEndpoint = this.INFISICAL_ADDRESS + path.join("api", "v3", "secrets", "raw", secretName);

        const params = new URLSearchParams();
        params.set("workspaceId", this.workspaceId);
        params.set("environment", "dev");

        secretsEndpoint += `?${params.toString()}`

        const r = await axios.get(secretsEndpoint, {
            headers: this.authHeader
        });

        const infisicalResponseModel = Convert.toInfisicalSecretResponse(JSON.stringify(r.data))

        return infisicalResponseModel.secret.secretValue;

    }

    async serverConfiguration() {
        const headlessString = await this.getSecret("PLAYWRIGHT_HEADLESS").then(s => s.trim().toLowerCase())
        return {
            headless: headlessString === "true",
            port: 9223,
            wsPath: "chromium-pw"
        }
    }

    private setTimeoutLong(delay: number, callback: () => void) {
        const maxDelay = 2147483647; // Maximum delay supported by setTimeout

        // If delay is less than or equal to maxDelay, use regular setTimeout
        if (delay <= maxDelay) {
            setTimeout(callback, delay);
        } else {
            // Otherwise, recursively call setTimeout with maxDelay until the remaining delay is less than or equal to maxDelay
            setTimeout(() => {
                this.setTimeoutLong(delay - maxDelay, callback);
            }, maxDelay);
        }
    }

}