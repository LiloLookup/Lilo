import {client} from "@core/redis";
import {Request, Response} from "express";

export const deleteServer = async (req: Request, res: Response) => {
    if (!req.params.address || !req.params.token || !req.cookies.id)
        return res.send({"status": 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.send({"status": 401});

    if (!await client.exists(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`))
        return res.send({"status": 404});

    const serverStr = `server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`;
    await client.set("status", JSON.stringify(JSON.parse(await client.get("status") || "[]")
        .filter(server => server != serverStr.replace("server:", ""))));
    await client.del(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`);
    return res.send({"status": 200});
}