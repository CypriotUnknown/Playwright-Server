import os from 'os';
import { exit } from 'process';

export default class Utilities {
    private constructor() { }
    private static sharedInstance?: Utilities;

    public static get shared(): Utilities {
        if (this.sharedInstance === undefined) this.sharedInstance = new Utilities();
        return this.sharedInstance;
    }

    get localIpAddress(): string {
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
}