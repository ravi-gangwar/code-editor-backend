import jwt from "jsonwebtoken";
export const decodePassword = async (password: string) => {
    return jwt.decode(password);
};

export const signToken = async (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string);
};

export const verifyToken = async (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET as string);
};