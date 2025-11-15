declare module "connect-pg-simple" {
    import { SessionOptions } from "express-session";
    
    interface ConnectPgSimpleOptions {
        conString?: string;
        tableName?: string;
        createTableIfMissing?: boolean;
        schemaName?: string;
        pruneSessionInterval?: number;
        errorLog?: (error: Error) => void;
    }
    
    function connectPgSimple(session: (options?: SessionOptions) => any): new (options?: ConnectPgSimpleOptions) => any;
    
    export = connectPgSimple;
}

