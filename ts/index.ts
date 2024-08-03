import playwright from 'playwright'
import { AxiosError } from 'axios';
import os from 'os';
import { exit } from 'process';
import SecretsManager from 'infisical-secrets-manager';
import getServerConfiguration from './server-config.js';

async function start() {
    const localIp = getLocalIp()

    try {
        await SecretsManager.instance.configure({ defaultEnvironmentSlug: 'dev' });
        const serverConfig = await getServerConfiguration();
        const browserServer = await playwright.chromium.launchServer(serverConfig);

        const browserURL = browserServer.wsEndpoint().replace("localhost", localIp);
        await SecretsManager.instance.updateSecret({
            secretName: 'CHROME_URL',
            secretValue: browserURL,
            createIfNotFound: true
        });

        console.log(`Started browser server at: ${browserURL}`);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log(error.response?.data.message);
        } else {
            console.log(error);
        }
    }
}

function getLocalIp(): string {
    try {
        // Get the network interfaces
        const networkInterfaces = os.networkInterfaces();

        // Find the IPv4 address of the local network interface
        const localIpAddress = Object.values(networkInterfaces)
            .flat()
            .filter(interfaceInfo => interfaceInfo!.family === 'IPv4' && !interfaceInfo!.internal)
            .map(interfaceInfo => interfaceInfo!.address)
            .find(Boolean); // Find the first non-empty IPv4 address

        return localIpAddress!;
    } catch (error) {
        console.log('Failed to get local ip address !\n', error);
        exit(1);
    }
}

start()
