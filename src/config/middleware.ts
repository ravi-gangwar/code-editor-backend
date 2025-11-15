import express from "express";
import passport from "passport";
import { sessionConfig } from "./session";
import { corsConfig } from "./cors";

export const setupMiddleware = (app: express.Application) => {
    app.use(express.json());
    app.use(corsConfig);
    app.use(sessionConfig);
    app.use(passport.initialize());
    app.use(passport.session());
};

