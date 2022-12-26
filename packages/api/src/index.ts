import {client} from "@core/redis";
import Express, {Request, Response} from "express";
import Cookies from "cookie-parser";
import dotenv from "dotenv";
import FS from "node:fs";
import process from "node:process";

export const app = Express();

import {viewServer} from "./routes/server/view";
import {serverStats} from "./routes/server/stats";
import {viewBlog} from "./routes/blog/view";
import {postBlog} from "./routes/blog/post";
import {callback} from "./routes/auth/callback";
import {globalStats} from "./routes/stats/stats";
import {randomServer} from "./routes/server/random";
import {serverlist} from "./routes/serverlist/serverlist";
import {deleteServer} from "./routes/server/settings/delete";
import {serverInfo} from "./routes/server/info";
import {notifications} from "./routes/server/settings/notifications";

dotenv.config();

export const defaultServerIcon = process.env.DEFAULT_SERVER_ICON,
    unauthorizedHTML = FS.readFileSync(`${__dirname}/static/401.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    notFoundHTML = FS.readFileSync(`${__dirname}/static/404.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    internalServerErrorHTML = FS.readFileSync(`${__dirname}/static/500.html`, "utf-8").replace(/{favicon}/g, defaultServerIcon),
    compareHTML = FS.readFileSync(`${__dirname}/static/server/compare/index.html`, "utf-8"),
    comparingHTML = FS.readFileSync(`${__dirname}/static/server/compare/view.html`, "utf-8"),
    createBlogHTML = FS.readFileSync(`${__dirname}/static/blog/create.html`, "utf-8"),
    adminHTML = FS.readFileSync(`${__dirname}/static/admin/view.html`, "utf-8"),
    serverSettings = FS.readFileSync(`${__dirname}/static/server/settings/view.html`, "utf-8");

app.get("*/view.html", async function (req: Request, res: Response) {
    return res.status(404).send(notFoundHTML);
});

app.get("/server/compare", async function (req: Request, res: Response) {
    if (!req.query.s)
        return res.send(compareHTML);
    else
        return res.send(comparingHTML);
});

app.use(Express.static(`${__dirname}/static`));
app.use(Cookies());

app.get("/server/:address", async function (req: Request, res: Response) {
    await viewServer(req, res);
});

app.get("/server/:address/stats", async function (req: Request, res: Response) {
    await serverStats(req, res);
});

app.get("/server/:address/info", async function (req: Request, res: Response) {
    await serverInfo(req, res);
});

app.get("/server/:address/settings", async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    if (!await client.exists(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`))
        return res.status(401).send(notFoundHTML);

    return res.send(serverSettings);
});

app.post("/server/:address/notifications", Express.json(), async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    await notifications(req, res);
});

app.delete("/server/:address/delete", Express.json(), async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    await deleteServer(req, res);
});

app.get("/blog/:id", async function (req: Request, res: Response) {
    await viewBlog(req, res);
});

app.get("/blog/create", async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    return res.send(createBlogHTML);
});

app.post("/blog/post", Express.json(), async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    await postBlog(req, res);
});

app.get("/stats", async function (req: Request, res: Response) {
    await globalStats(req, res);
});

app.get("/admin", async function (req: Request, res: Response) {
    if (!await isLoggedIn(req))
        return res.status(401).send(unauthorizedHTML);

    res.send(adminHTML);
});

app.get("/auth/login", async function (req: Request, res: Response) {
    return res.redirect(process.env.DISCORD_OAUTH_URL);
});

app.get("/auth/logout", async function (req: Request, res: Response) {
    if (!req.cookies.id || !req.cookies.access_token)
        return res.status(401).send(unauthorizedHTML);

    if (!await client.exists(`discord:${req.cookies.id}`))
        return res.status(404).send(notFoundHTML);

    res.cookie("id", "", {maxAge: 0});
    res.cookie("access_token", "", {maxAge: 0});
    res.redirect("/");
});

app.get("/auth/callback", async function (req: Request, res: Response) {
    await callback(req, res);
});

app.get("/api/server/random", async function (req: Request, res: Response) {
    await randomServer(req, res);
});

app.get("/api/servers", async function (req: Request, res: Response) {
    await serverlist(req, res)
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