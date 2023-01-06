import {client} from "@core/redis";
import {Request, Response} from "express";
import Crypto from "node:crypto";

export const postBlog = async (req: Request, res: Response) => {
    if (!req.body.title || !req.body.message || !req.body.time || !req.params.token || !req.cookies.id)
        return res.status(400).send({status: 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.status(401).send({status: 401});

    const id = Crypto.randomBytes(8).toString("hex").slice(0, 8);
    await client.set(`blog:${id}`, JSON.stringify({
        "title": req.body.title,
        "message": req.body.message,
        "time": req.body.time
    }));

    return res.send({status: 200, "id": id});
}