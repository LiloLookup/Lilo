import {client} from "@core/redis";
import {srvOrigin} from "@core/stats";
import {Request, Response} from "express";

export const deleteServer = async (req: Request, res: Response) => {
    if (!req.params.address || !req.params.token || !req.cookies.id)
        return res.status(400).send({status: 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.status(401).send({status: 401});

    const host = req.params.address,
        port = (!req.params.address.includes(":") ? 25565 : parseInt(req.params.address.split(":")[1])),
        srvStr = await srvOrigin(host, port),
        aliases = JSON.parse(await client.get("aliases")).filter(alias => alias.lowLevel != srvStr.replace("server:", ""));

    if (!await client.exists(`server:${srvStr}`))
        return res.status(404).send({status: 404});

    await client.set("status", JSON.stringify(JSON.parse(await client.get("status") || "[]")
        .filter(server => server != srvStr)));
    await client.del(`server:${srvStr}`);
    await client.set("aliases", JSON.stringify(aliases));

    return res.send({status: 200});
}