import {client} from "@core/redis";
import {Request, Response} from "express";
import Crypto from "node:crypto";

export const postBlog = async (req: Request, res: Response) => {
    const id = Crypto.randomBytes(8).toString("hex").slice(0, 8);
    await client.set(`blog:${id}`, JSON.stringify({
        "title": req.body.title,
        "message": req.body.message,
        "time": req.body.time
    }));

    return res.send({"status": 200, "id": id});
}