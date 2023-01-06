import {client} from "@core/redis";
import * as Notifications from "@core/notifications";
import {status, statusLegacy} from "minecraft-server-util";

import {handle, saveData} from "./dataHandling";

export const startMonitoring = async (serverStr: string) => {
    let i = 0,
        offline = true;
    const host = serverStr.split(":")[0],
        port = parseInt(serverStr.split(":")[1]),
        loop = async function () {
            status(host, port, {timeout: 5000, enableSRV: true}).then(async (statusResult) => {
                if (!offline)
                    await handle(serverStr, statusResult);
                offline = false;
            }).catch(() => {
                statusLegacy(host, port, {timeout: 5000, enableSRV: true}).then(async (statusLegacyResult) => {
                    if (!offline)
                        await handle(serverStr, statusLegacyResult);
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

                await saveData(serverStr, {players: {online: 0, max: 0}, roundTripLatency: -1});
                await client.hSet(`server:${serverStr}`, "last_data", JSON.stringify(await client.hGet(`server:${serverStr}`, "data")));
                await client.hSet(`server:${serverStr}`, "last_seen", Date.now());
                await client.hSet(`server:${serverStr}`, "data", JSON.stringify({
                    motd: {
                        html: `<span style="color: #FF0000; font-weight: bold;">OFFLINE</span>`
                    },
                    favicon: JSON.parse(await client.hGet(`server:${serverStr}`, "data")).favicon,
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
                if (!notifications.includes(serverStr) && !notifications.includes(`*.${serverStr}`))
                    return;

                const aliases = JSON.parse(await client.get("aliases") || "[]"),
                    alias = aliases.filter(alias =>
                        alias.lowLevel == `${host}:${port}`)[0],
                    address = (alias ? alias.topLevel.replace(":25565", "")
                        : `${host}${(port == 25565 ? "" : `:${port}`)}`);

                if (!(aliases.some(alias => alias.lowLevel == address)))

                    await Notifications.send(`${address} went offline...\nhttps://lilo-lookup.de/server/${serverStr}`, true, {
                        host: host,
                        port: port
                    });
            }

            i++;
        }

    await loop();
}