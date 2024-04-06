export interface InfisicalSecretResponseModel {
    secret: InfisicalSecretModel;
}

export interface InfisicalSecretModel {
    _id: string;
    version: number;
    workspace: string;
    type: string;
    environment: string;
    secretKey: string;
    secretValue: string;
    secretComment: string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toInfisicalSecretResponse(json: string): InfisicalSecretResponseModel {
        return JSON.parse(json);
    }

    public static infisicalSecretResponseToJson(value: InfisicalSecretResponseModel): string {
        return JSON.stringify(value);
    }
}
