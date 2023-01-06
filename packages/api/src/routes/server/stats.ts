import {internalServerErrorHTML, notFoundHTML} from "@core/api";
import {client} from "@core/redis";
import {Request, Response} from "express";

export const serverStats = async (req: Request, res: Response) => {
    const port = parseInt(req.params.address.split(":")[1]) || 25565;

    if (port > 65535 || isNaN(port))
        return res.status(404).send(notFoundHTML);

    let aliases = JSON.parse(await client.get("aliases") || "[]"),
        serverStats;
    
    const host = req.params.address.split(":")[0].toLowerCase(),
        size = parseInt(req.query.size as string) || 0;

    if (aliases.some(alias => alias.topLevel == `${host}:${port}`))
        serverStats = JSON.parse(await client.hGet(`server:${aliases.filter(alias => alias.topLevel == `${host}:${port}`)[0].lowLevel}`, "stats"));
    else
        serverStats = JSON.parse(await client.hGet(`server:${host}:${port}`, "stats"));

    if (!serverStats)
        return res.status(404).send({status: 404});

    let result = [];
    if (size > serverStats.length) {
        for (let i = 1; i <= serverStats.length; i++) {
            result.push({
                time: serverStats[i - 1].time,
                online: serverStats[i - 1].online
            });
        }

        return res.send(serverStats);
    }

    for (let i = 1; i <= size; i++) {
        result.push({
            time: serverStats[serverStats.length - (size + 1) + i].time,
            online: serverStats[serverStats.length - (size + 1) + i].online
        });
    }

    if (port > 65535 || isNaN(port))
        return res.status(404).send({status: 404});
    if (result)
        return res.send(result);

    return res.status(500).send(internalServerErrorHTML);
}