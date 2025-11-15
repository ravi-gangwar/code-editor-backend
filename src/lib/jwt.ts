import jwt from "jsonwebtoken";

export const signToken = async (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string);
};