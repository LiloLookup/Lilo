import {client} from "@core/redis";
import Express, {Request, Response} from "express";
import Cookies from "cookie-parser";
import dotenv from "dotenv";
import FS from "node:fs";
import process from "node:process";

export const app = Express();

import {viewServer} from "./routes/server/viewServer";
import {serverStats} from "./routes/server/serverStats";
import {viewBlog} from "./routes/blog/viewBlog";
import {postBlog} from "./routes/blog/postBlog";
import {callback} from "./routes/auth/callback";
import {globalStats} from "./routes/stats/globalStats";
import {featuredServer} from "./routes/landing/featuredServer";

dotenv.config();

export const createBlogHTML = FS.readFileSync(`${__dirname}/static/blog/create.html`, "utf-8"),
    defaultServerIcon = require("../../../settings.json").default_icon,
    unauthorizedHTML = FS.readFileSync(`${__dirname}/static/401.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    notFoundHTML = FS.readFileSync(`${__dirname}/static/404.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    internalServerErrorHTML = FS.readFileSync(`${__dirname}/static/500.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    indexHTML = FS.readFileSync(`${__dirname}/static/index.html`, "utf-8");

app.use(Express.static(`${__dirname}/static`));
app.use(Cookies());

app.get("/server", async function (req: Request, res: Response) {
    return res.send(indexHTML);
});

app.get("/server/:address", async function (req: Request, res: Response) {
    await viewServer(req, res);
});

app.get("/server/:address/stats", async function (req: Request, res: Response) {
    await serverStats(req, res);
});

app.get("/blog/create", async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    return res.send(createBlogHTML);
});

app.get("/blog/:id", async function (req: Request, res: Response) {
    await viewBlog(req, res);
});

app.post("/blog/post", Express.json(), async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    await postBlog(req, res);
});

app.get("/stats", Express.json(), async function (req: Request, res: Response) {
    await globalStats(req, res);
});

app.get("/api/featuredServer", Express.json(), async function (req: Request, res: Response) {
    await featuredServer(req, res);
});

app.get("/auth/login", async function (req: Request, res: Response) {
    return res.redirect(process.env.DISCORD_OAUTH_URL);
});

app.get("/auth/callback", async function (req: Request, res: Response) {
    await callback(req, res);
});

app.get("/logout", async function (req: Request, res: Response) {
    if (!req.cookies.id || !req.cookies.access_token)
        return res.status(401).send(unauthorizedHTML);

    if (!await client.exists(`discord:${req.cookies.id}`))
        return res.status(404).send(notFoundHTML);

    res.cookie("id", "", {maxAge: 0});
    res.cookie("access_token", "", {maxAge: 0});
    res.redirect("/");
});

app.get("*", async function (req: Request, res: Response) {
    return res.status(404).send(notFoundHTML);
});

export async function isLoggedIn(req) {
    if (!req.cookies.id || !req.cookies.access_token)
        return false;

    const id = req.cookies.id,
        access_token = req.cookies.access_token;

    const accessTokens = JSON.parse(await client.hGet(`discord:${id}`, "access_tokens") || "[]");
    return accessTokens.some(token => token.accessToken == access_token);
}