   import { NextFunction, Request, Response } from "express";
   import jwt, { JwtPayload } from "jsonwebtoken";

   interface CustomJwtPayload extends JwtPayload {
       userId: string;
   }

   const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
       try {
            const token = JSON.parse(req.headers.authorization ?? "");
            if (!token) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
           const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
           if (typeof decoded === "object" && "userId" in decoded) {
               req.user = decoded as CustomJwtPayload;
               next();
           } else {
               res.status(401).json({ message: "Invalid token" });
           }
       } catch (error) {
           res.status(401).json({ message: "Invalid token" });
       }
   };

   export default authMiddleware;