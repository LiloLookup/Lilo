import {client} from "@core/redis";
import {Request, Response} from "express";

export const deleteServer = async (req: Request, res: Response) => {
    if (!req.params.address || !await client.exists(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`))
        return res.send({"status": 404});

    const serverStr = `server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`;
    await client.set("status", JSON.stringify(JSON.parse(await client.get("status") || "[]")
        .filter(server => server != serverStr.replace("server:", ""))));
    await client.del(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`);
    return res.send({"status": 200});
}