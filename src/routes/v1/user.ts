import { Router } from "express";
import { login, resetPassword, sendResetPasswordEmail, signup, deleteUser, getUser } from "../../controller/user";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/send-reset-password-email", sendResetPasswordEmail);
authRouter.post("/delete-user", deleteUser);
authRouter.get("/user", getUser);

export default authRouter;
