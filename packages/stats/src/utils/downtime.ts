import {client} from "@core/redis";
import * as Notifications from "@core/notifications";
import {status, statusLegacy} from "minecraft-server-util";

import {handle, saveData} from "./dataHandling";

export const startMonitoring = async (host: string, port: number) => {
    let i = 0,
        offline = true;
    const serverStr = `server:${host}:${port}`,
        loop = async function () {
            status(host, port).then(async (statusResult) => {
                if (!offline)
                    await handle(host, port, statusResult);
                offline = false;
            }).catch(() => {
                statusLegacy(host, port).then(async (statusLegacyResult) => {
                    if (!offline)
                        await handle(host, port, statusLegacyResult);
                    offline = false;
                }).catch(() => {
                    offline = true;
                });
            });

            if (i < 4) {
                setTimeout(loop, 2000);
            } else if (offline) {
                const offlineServers = JSON.parse(await client.get("offline") || "[]");
                if (offlineServers.some(server => server.host == host && server.port == port))
                    return;

                offlineServers.push({"host": host, "port": port});
                await client.set("offline", JSON.stringify(offlineServers));

                await saveData(host, port, {players: {online: null, max: null}, roundTripLatency: null});
                await client.hSet(serverStr, "last_data", JSON.stringify(await client.hGet(serverStr, "data")));
                await client.hSet(serverStr, "last_seen", Date.now());
                await client.hSet(serverStr, "data", JSON.stringify({
                    motd: {
                        html: `<span style="color: #FF0000; font-weight: bold;">OFFLINE</span>`
                    },
                    favicon: JSON.parse(await client.hGet(serverStr, "data")).favicon,
                    players: {
                        online: 0,
                        max: 0,
                    },
                    roundTripLatency: -1,
                    version: {
                        name: "OFFLINE",
                        protocol: 0
                    }
                }));

                const notifications = JSON.parse(await client.get("notifications"));
                if (!notifications.includes(`${host}:${port}`) && !notifications.includes(`*.${host}:${port}`))
                    return;

                await Notifications.send(`${host}:${port} went offline...\nhttps://lilo.northernsi.de/server/${host}${port == 25565 ? "" : `:${port}`}`, true, {host: host, port: port});
            }

            i++;
        }

    await loop();
}