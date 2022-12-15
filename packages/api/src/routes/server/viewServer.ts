import {defaultServerIcon, notFoundHTML} from "@core/api";
import {client} from "@core/redis";
import {Request, Response} from "express";
import {status, statusLegacy} from "minecraft-server-util";
import FS from "node:fs";

export const viewServer = async (req: Request, res: Response) => {
    let host = req.params.address.split(":")[0].toLowerCase(),
        port = parseInt(req.params.address.split(":")[1]) || 25565;

    let serverData = JSON.parse(await client.hGet(`server:${host}:${port}`, "data"));
    if (port > 65535 || isNaN(port))
        return res.status(404).send(notFoundHTML);

    if (serverData)
        return await displayHTML();

    const serverStr = `server:${host}:${port}`;
    status(host, port).then(async (statusResult) => {
        serverData = statusResult;
        await client.hSet(serverStr, "data", JSON.stringify(statusResult));
        return await displayHTML();
    }).catch(async () => {
        statusLegacy(host, port).then(async (statusLegacyResult) => {
            serverData = statusLegacyResult;
            await client.hSet(serverStr, "data", JSON.stringify(statusLegacyResult));
            return await displayHTML();
        }).catch(() => {
            return res.status(404).send(notFoundHTML);
        });
    });

    async function displayHTML() {
        let statusServers = JSON.parse(await client.get("status") || "[]"),
            serverHTML = FS.readFileSync(`${__dirname}/../../static/server/view.html`, "utf-8");

        if (!statusServers.includes(`${host}:${port}`)) {
            statusServers.push(`${host}:${port}`);
            await client.set("status", JSON.stringify(statusServers));
        }

        serverHTML = serverHTML.replace(/{server_name}/g, `${host}${port != 25565 ? `:${port}` : ""}`);
        serverHTML = serverHTML.replace(/{motd}/g, !serverData.motd.html ? serverData.motd : serverData.motd.html.replace(/\n/g, "<br>"));
        serverHTML = serverHTML.replace(/{favicon}/g, serverData.favicon ? serverData.favicon : defaultServerIcon);
        serverHTML = serverHTML.replace(/{latency}/g, !serverData.roundTripLatency ? "0ms" : `${serverData.roundTripLatency}ms`);
        serverHTML = serverHTML.replace(/{version}/g, !serverData.version.name ? serverData.version.replace(/</g, "&lt;").replace(/>/g, "&gt;")
            : serverData.version.name.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        serverHTML = serverHTML.replace(/{version_number}/g, !serverData.version.protocol ? "" : ` (${serverData.version.protocol})`);
        serverHTML = serverHTML.replace(/{player_count}/g, !serverData.players ? "0/0" : `${serverData.players.online}/${serverData.players.max}`);
        return res.send(serverHTML);
    }
}