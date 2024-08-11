import express, { Express, json } from 'express';
import PlaywrightServer from './playwright-server';

export default class APIServer {
    private static sharedInstance?: APIServer;
    private constructor(private playwrightServer: PlaywrightServer, private app: Express) {

    }
    public static start(playwrightServer: PlaywrightServer) {
        this.sharedInstance = new APIServer(playwrightServer, express());
        this.sharedInstance.setupServer();
        return this.sharedInstance;
    }

    private setupServer() {
        this.app.use(json());
        this.app.post('/render', async (req, res) => {
            if (req.body?.url === undefined) return res.status(400).send('NO URL IN REQUEST BODY !');

            try {
                const body = await this.playwrightServer.processURL(req.body.url);
                return res.status(200).send(body);
            } catch (err) {
                const error = (err as Error);
                return res.status(500).send(error.message);
            }
        });

        const port = process.env.API_SERVER_PORT ?? '9999';
        this.app.listen(port, () => {
            console.log(`API SERVER LISTENING AT: ${port}`);
        });
    }
}