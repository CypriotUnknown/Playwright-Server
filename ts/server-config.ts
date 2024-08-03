import SecretsManager from "infisical-secrets-manager";

export default async function getServerConfiguration() {
    const headless = await SecretsManager.instance.getSecret({ secretName: "PLAYWRIGHT_HEADLESS" })
        .then(secret => secret.secretValue.toLowerCase() === 'true')
        .catch(_ => true);

    console.log("Headless:", headless);

    return {
        headless,
        port: 9223,
        wsPath: "chromium-pw"
    }
}