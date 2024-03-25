import playwright from 'playwright'
import SecretsManager from './secrets-manager.js'
import { AxiosError } from 'axios';


async function start() {
    await SecretsManager.instance.setupAccessTokens();

    try {
        const r = await playwright.chromium.launchServer(SecretsManager.instance.serverConfiguration)

        await SecretsManager.instance.updateBrowserURL(r.wsEndpoint())
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log(error.response?.data.message);
        } else {
            console.log(error);
        }
    }
}


start()
