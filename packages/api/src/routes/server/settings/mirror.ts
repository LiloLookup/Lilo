import {client} from "@core/redis";
import {Request, Response} from "express";

export const mirror = async (req: Request, res: Response) => {
    if (!req.params.address || !req.params.token || !req.cookies.id || !req.body.address || !req.body.origin)
        return res.status(400).send({status: 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.status(401).send({status: 401});

    const aliases = JSON.parse(await client.get("aliases") || "[]"),
        address = (req.body.address.split(":").length > 1 ? req.body.address : `${req.body.address}:25565`),
        origin = (req.body.origin.split(":").length > 1 ? req.body.origin : `${req.body.origin}:25565`),
        originAlias = aliases.filter(alias => alias.topLevel == origin)[0].lowLevel;

    switch (req.body.action) {
        case "ADD":
            if (aliases.some(alias => alias.topLevel == address))
                return res.send({status: 200});

            aliases.push({
                topLevel: address,
                lowLevel: originAlias
            });

            await client.set("aliases", JSON.stringify(aliases));
            await client.del(`server:${address}`);
            break;
        case "REMOVE":
            aliases.splice(aliases.indexOf(req.body.address), 1);
            if (aliases.length == 0)
                return await client.del("aliases");
            await client.set("aliases", JSON.stringify(aliases));
            break;
        default:
            return res.status(400).send({status: 400});
    }

    return res.send({status: 200});
}