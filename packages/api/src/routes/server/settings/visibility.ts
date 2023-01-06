import {client} from "@core/redis";
import {Request, Response} from "express";
import {srvOrigin} from "@core/stats";

export const visibility = async (req: Request, res: Response) => {
    if (!req.params.address || !req.params.token || !req.cookies.id || !req.body.action)
        return res.status(400).send({status: 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.status(401).send({status: 401});

    const host = req.params.address,
        port = (!req.params.address.includes(":") ? 25565 : parseInt(req.params.address.split(":")[1])),
        srvStr = await srvOrigin(host, port);

    if (!await client.exists(`server:${srvStr}`))
        return res.status(404).send({status: 404});

    const publicServers = JSON.parse(await client.get("public") || "[]");
    switch (req.body.action) {
        case "ENABLE":
            publicServers.push(srvStr);
            await client.set("public", JSON.stringify(publicServers));
            break;
        case "DISABLE":
            publicServers.splice(publicServers.indexOf(srvStr), 1);
            if (publicServers.length == 0)
                return await client.del("public");
            await client.set("public", JSON.stringify(publicServers));
            break;
        default:
            return res.status(400).send({status: 400});
    }

    return res.send({status: 200});
}