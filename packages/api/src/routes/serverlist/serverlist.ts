import {defaultServerIcon} from "@core/api";
import {client} from "@core/redis";
import {Request, Response} from "express";

export const serverlist = async (req: Request, res: Response) => {
    const monitoredServers = JSON.parse(await client.get("status") || "[]");

    let servers = [];
    for (let server in monitoredServers) {
        let host = monitoredServers[server].split(":")[0],
            port = monitoredServers[server].split(":")[1],
            serverData = JSON.parse(await client.hGet(`server:${monitoredServers[server]}`, "data"));

        servers.push({
            server_name: `${host}${port != "25565" ? `:${port}` : ""}`,
            motd: !serverData.motd.html ? serverData.motd : serverData.motd.html.replace(/\n/g, "<br>"),
            favicon: serverData.favicon ? serverData.favicon : defaultServerIcon,
            latency: !serverData.roundTripLatency ? "0ms" : `${serverData.roundTripLatency}ms`,
            version: !serverData.version.name ? serverData.version.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                : serverData.version.name.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            version_name: !serverData.version.protocol ? "" : ` (${serverData.version.protocol})`,
            player_count: !serverData.players ? "0/0" : `${serverData.players.online}/${serverData.players.max}`
        });
    }

    return res.send(servers);
}