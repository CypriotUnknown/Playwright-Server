export type Workspaces = {
    workspaces: Workspace[];
}

export type Workspace = {
    _id: string;
    name: string;
    autoCapitalization: boolean;
    organization: string;
    environments: Environment[];
    __v: number;
}

export type Environment = {
    _id: string;
    name: string;
    slug: string;
}
