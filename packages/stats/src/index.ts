import {client} from "@core/redis";
import {app} from "@core/api";
import {status, statusLegacy} from "minecraft-server-util";
import {startMonitoring} from "./downtime";
import {MessageBuilder} from "discord-webhook-node";
import {hook} from "@core/app";

export const startService = async () => {
    await client.connect();
    app.listen(3000);
    
    let statusServers = null,
        offlineServers = null,
        server: string;

    const loop = async function () {
        statusServers = JSON.parse(await client.get("status") || "[]");
        offlineServers = JSON.parse(await client.get("offline") || "[]");

        for (server in statusServers) {
            let host = statusServers[server].split(":")[0].toLowerCase(),
                port = parseInt(statusServers[server].split(":")[1]);

            const serverStr = `server:${host}:${port}`;
            status(host, port).then(async (statusResult) => {
                await client.hSet(serverStr, "data", JSON.stringify(statusResult));
                await saveData(host, port, statusResult, serverStr);
                await resolveStatus(host, port, serverStr);
            }).catch(() => {
                statusLegacy(host, port).then(async (statusLegacyResult) => {
                    await client.hSet(serverStr, "data", JSON.stringify(statusLegacyResult));
                    await saveData(host, port, statusLegacyResult, serverStr);
                    await resolveStatus(host, port, serverStr);
                }).catch(async () => {
                    await saveData(host, port, {players: {online: null, max: null}, roundTripLatency: null}, serverStr);
                    await startMonitoring(host, port);
                });
            });
        }

        setTimeout(loop, 45000);
    }

    await loop();

    async function resolveStatus(host: string, port: number, serverStr: string) {
        if (!offlineServers.some(server => server.host == host && server.port == port))
            return;

        const embed = new MessageBuilder()
            .setDescription(`${host}:${port} is back online...`)
            .setTimestamp();

        await hook.send(embed);

        await client.set("offline", JSON.stringify(offlineServers.filter(server => server.host != host || server.port != port)));
    }

    async function saveData(host: string, port: number, rawData: any, serverStr: string) {
        const tzOffset = (new Date()).getTimezoneOffset() * 60000,
            time = (new Date(Date.now() - tzOffset)).toISOString();

        let stats = JSON.parse(await client.hGet(serverStr, "stats") || "[]");
        stats.push({
            time: time,
            online: rawData.players.online,
            rtt: rawData.roundTripLatency ? rawData.roundTripLatency : null,
        });

        await client.hSet(serverStr, "stats", JSON.stringify(stats));
    }
}