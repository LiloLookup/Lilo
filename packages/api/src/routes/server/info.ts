import {client} from "@core/redis";
import {Request, Response} from "express";

export const serverInfo = async (req: Request, res: Response) => {
    const host = req.params.address.split(":")[0].toLowerCase(),
        port = parseInt(req.params.address.split(":")[1]) || 25565;

    return res.send({
        notifications: JSON.parse(await client.get("notifications") || "[]").includes(`${host}:${port}`)
    });
}