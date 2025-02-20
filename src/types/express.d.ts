import { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
    userId: string;
}

declare module "express-serve-static-core" {
    interface Request {
        user?: CustomJwtPayload;
    }
} 