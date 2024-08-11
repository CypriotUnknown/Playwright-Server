import SecretsManager from "infisical-secrets-manager";
import playwright from 'playwright';
import { exit } from 'process';
import { AxiosError } from "axios";
import Utilities from "./utilities/utilities.js";

export default class PlaywrightServer {
    private static sharedInstance?: PlaywrightServer;
    private constructor(private localBrowser: playwright.Browser, private localContext: playwright.BrowserContext) { }

    private static async getServerConfiguration(config?: { headless: boolean; }) {
        let headless: boolean;

        if (config) {
            headless = config.headless;
        } else {
            headless = await SecretsManager.instance.getSecret({ secretName: "PLAYWRIGHT_HEADLESS" })
                .then(secret => secret.secretValue.toLowerCase() === 'true')
                .catch(_ => true);
        }

        const portString = process.env.PLAYWRIGHT_PORT ?? '9223';
        const port = parseInt(portString);

        if (isNaN(port)) {
            console.log(`INVALID PLAYWRIGHT PORT: '${portString}'`);
            return exit(1);
        }

        const playwrightConfiguration = {
            headless,
            port,
            wsPath: "chromium-pw"
        };

        console.log({ playwrightConfiguration });

        return playwrightConfiguration;
    }

    public static async start(config?: { headless: boolean; }): Promise<PlaywrightServer> {
        try {
            const serverConfig = await this.getServerConfiguration(config);
            const browserServer = await playwright.chromium.launchServer(serverConfig);
            const internalBrowserURL = browserServer.wsEndpoint();
            const publicBrowserURL = internalBrowserURL
                .replace("localhost", Utilities.shared.localIpAddress);
            await SecretsManager.instance.configure({ defaultEnvironmentSlug: 'dev' });

            await SecretsManager.instance.updateSecret({
                secretName: 'CHROME_URL',
                secretValue: publicBrowserURL,
                createIfNotFound: true
            });

            const localBrowser = await playwright.chromium.connect(internalBrowserURL);
            const localContext = await localBrowser.newContext();
            this.sharedInstance = new PlaywrightServer(localBrowser, localContext);

            console.log(`Started browser server.\nPublic url: ${publicBrowserURL}\nInternal url: ${internalBrowserURL}`);
            return this.sharedInstance;
        } catch (error) {
            console.log('FATAL ERROR - COULD NOT START SERVER:\n');

            if (error instanceof AxiosError) {
                console.log(error.response?.data.message);
            } else {
                console.log(error);
            }

            exit(1);
        }
    }

    async processURL(url: string) {
        const page = await this.localContext.newPage();

        const flow = async () => {
            const response = await page.goto(url, { waitUntil: 'networkidle' })
                .catch(cause => { throw new Error('BAD URL', { cause }) });

            if (response === null) throw new Error('RESPONSE IS NULL !');
            try {
                await response.finished();
            } catch (error) {
                throw new Error('RESPONSE DID NOT FINISH', { cause: error });
            }

            try {
                return await response.body()
                    .then(buff => buff.toString());
            } catch (error) {
                throw new Error('COULD NOT GET RESPONSE BODY', { cause: error });
            }
        }

        return await flow()
            .finally(async () => await page.close());
    }
}