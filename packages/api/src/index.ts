import Express, {Request, Response} from "express";

export const app = Express();

import {server} from "./routes/server";
import {stats} from "./routes/stats";

app.use(Express.static(`${__dirname}/static`));

app.get("/server/:address", async function (req: Request, res: Response) {
    await server(req, res);
});

app.get("/server/:address/stats", async function (req: Request, res: Response) {
    await stats(req, res);
});