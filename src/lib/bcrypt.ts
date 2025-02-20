import bcrypt from "bcrypt";

export const hashedPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
};
