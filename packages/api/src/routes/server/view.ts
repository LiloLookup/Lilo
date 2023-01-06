import {defaultServerIcon, notFoundHTML} from "@core/api";
import {client} from "@core/redis";
import {Request, Response} from "express";
import {status, statusLegacy} from "minecraft-server-util";
import FS from "node:fs";
import {srvOrigin} from "@core/stats";

export const viewServer = async (req: Request, res: Response) => {
    const port = parseInt(req.params.address.split(":")[1]) || 25565;

    if (port > 65535 || isNaN(port))
        return res.status(404).send(notFoundHTML);

    let host = req.params.address.split(":")[0].toLowerCase(),
        aliases = JSON.parse(await client.get("aliases") || "[]"),
        serverData;

    if (aliases.some(alias => alias.topLevel == `${host}:${port}`)) {
        serverData = JSON.parse(await client.hGet(`server:${aliases
            .filter(alias => alias.topLevel == `${host}:${port}`)[0].lowLevel}`, "data"));
    } else {
        serverData = JSON.parse(await client.hGet(`server:${host}:${port}`, "data"));
        await handleSrv();
    }

    if (serverData)
        return await displayHTML();

    let serverStr = `server:${host}:${port}`;
    status(host, port, {timeout: 5000, enableSRV: true}).then(async (statusResult) => {
        serverData = statusResult;

        await handleSrv();
        await client.hSet(serverStr, "data", JSON.stringify(statusResult));
        return await displayHTML();
    }).catch(async () => {
        statusLegacy(host, port, {timeout: 5000, enableSRV: true}).then(async (statusLegacyResult) => {
            serverData = statusLegacyResult;

            await handleSrv();
            await client.hSet(serverStr, "data", JSON.stringify(statusLegacyResult));
            return await displayHTML();
        }).catch(() => {
            return res.status(404).send(notFoundHTML);
        });
    });

    async function handleSrv() {
        if (serverData && serverData.srvRecord &&
            !(aliases.some(alias => alias.topLevel == `${host}:${port}`)) &&
            !(aliases.some(alias => alias.lowLevel == `${host}:${port}`))) {
            serverStr = `server:${serverData.srvRecord.host}:${serverData.srvRecord.port}`;
            aliases.push({
                topLevel: `${host}:${port}`,
                lowLevel: `${serverData.srvRecord.host}:${serverData.srvRecord.port}`
            });

            await client.set("aliases", JSON.stringify(aliases));
        }
    }

    async function displayHTML() {
        let statusServers = JSON.parse(await client.get("status") || "[]"),
            serverHTML = FS.readFileSync(`${__dirname}/../../static/server/view.html`, "utf-8"),
            serverStr = await srvOrigin(host, port);

        if (!statusServers.includes(serverStr)) {
            statusServers.push(serverStr);
            await client.set("status", JSON.stringify(statusServers));
        }

        const alias = JSON.parse(await client.get("aliases")).filter(alias => alias.lowLevel == serverStr)[0];

        serverHTML = serverHTML.replace(/{server_name}/g, (alias ? alias.topLevel.replace(":25565", "")
            : `${host}${(port == 25565 ? "" : `:${port}`)}`));
        serverHTML = serverHTML.replace(/{motd}/g, !serverData.motd.html ? serverData.motd
            : serverData.motd.html.replace(/\n/g, "<br>"));
        serverHTML = serverHTML.replace(/{favicon}/g, serverData.favicon ? serverData.favicon
            : defaultServerIcon);
        serverHTML = serverHTML.replace(/{latency}/g, !serverData.roundTripLatency ? "0ms"
            : `${serverData.roundTripLatency}ms`);
        serverHTML = serverHTML.replace(/{version}/g, !serverData.version.name
            ? serverData.version.replace(/</g, "&lt;").replace(/>/g, "&gt;")
            : serverData.version.name.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        serverHTML = serverHTML.replace(/{version_number}/g, !serverData.version.protocol ? ""
            : ` (${serverData.version.protocol})`);
        serverHTML = serverHTML.replace(/{player_count}/g, !serverData.players ? "0/0"
            : `${serverData.players.online}/${serverData.players.max}`);
        return res.send(serverHTML);
    }
}