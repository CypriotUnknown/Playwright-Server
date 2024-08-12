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

        if (config?.headless) {
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

    public static async start(config?: { headless: boolean; startLocalInstance?: boolean }): Promise<PlaywrightServer> {
        if (config?.startLocalInstance) {
            const localBrowser = await playwright.chromium.launch({ headless: false });
            const localContext = await localBrowser.newContext();

            this.sharedInstance = new PlaywrightServer(localBrowser, localContext);
            return this.sharedInstance;
        }

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
            const localContext = await localBrowser.newContext({
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
            });
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

    async processURL(request: { url: string, optionalActions?: string[] }) {
        const { url, optionalActions } = request;
        console.log(`\nProcessing url: ${url}`);

        const page = await this.localContext.newPage();

        const flow = async () => {
            const response = await page.goto(url, { waitUntil: 'networkidle' })
                .catch(cause => { throw new Error('BAD URL', { cause }) });

            if (optionalActions) {
                for (let selectorIndex = 0; selectorIndex < optionalActions.length; selectorIndex++) {
                    const action = optionalActions[selectorIndex];
                    console.log(`Clicking selector: '${action}'`);

                    try {
                        await page.locator(action).click();
                        console.log(`Clicked selector: '${action}`);

                    } catch (error) {
                        console.log(`Failed to click action selector '${action}': ${error}`);
                        break;
                    }

                    await page.waitForLoadState('networkidle', { timeout: 60 * 1000 })
                        .catch(error => console.log(`Failed to wait for 'networkidle' for selector '${action}': ${error}`));
                }
            }

            if (response === null) throw new Error('RESPONSE IS NULL !');
            try {
                await response.finished();
                console.log('Response ready');

            } catch (error) {
                throw new Error('RESPONSE DID NOT FINISH', { cause: error });
            }

            try {
                return await page.content();
            } catch (error) {
                throw new Error('COULD NOT GET RESPONSE BODY', { cause: error });
            }
        }

        return await flow()
            .finally(async () => {
                await page.close();
                console.log('--------------------------------------------------\n');
            });
    }
}