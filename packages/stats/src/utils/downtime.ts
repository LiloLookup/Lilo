import {client} from "@core/redis";
import {hook} from "@core/app";
import {status, statusLegacy} from "minecraft-server-util";
import {MessageBuilder} from "discord-webhook-node";

import {handle, saveData} from "./dataHandling";
import {defaultServerIcon} from "@core/api";

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
            } else if (!offline) {
                const noNotify = await client.hExists("no_notify", serverStr),
                    wildcardNoNotify = await client.hExists("no_notify", `server:*.${host.substring(host.indexOf(".") + 1)}:${port}`);

                if (noNotify || wildcardNoNotify)
                    return;

                const embed = new MessageBuilder()
                    .setDescription(`${host}:${port} is experiencing packet losses...`)
                    .setTimestamp();

                await hook.send(embed);
            } else {
                const offlineServers = JSON.parse(await client.get("offline") || "[]"),
                    noNotify = await client.hExists("no_notify", serverStr),
                    wildcardNoNotify = await client.hExists("no_notify", `server:*.${host.substring(host.indexOf(".") + 1)}:${port}`);
                if (offlineServers.some(server => server.host == host && server.port == port))
                    return;

                offlineServers.push({"host": host, "port": port});
                await client.set("offline", JSON.stringify(offlineServers));

                await saveData(host, port, {players: {online: null, max: null}, roundTripLatency: null});
                await client.hSet(`server:${host}:${port}`, "last_data", JSON.stringify(await client.hGet(`server:${host}:${port}`, "data")));
                await client.hSet(`server:${host}:${port}`, "data", JSON.stringify({
                    "motd": {
                        "html": `<span style="color: #FF0000; font-weight: bold;">OFFLINE</span>`
                    },
                    "favicon": defaultServerIcon,
                    "players": {
                        "online": 0,
                        "max": 0,
                    },
                    "roundTripLatency": -1,
                    "version": {
                        "name": "OFFLINE",
                        "protocol": 0
                    }
                }));

                if (noNotify || wildcardNoNotify)
                    return;

                const embed = new MessageBuilder()
                    .setDescription(`${host}:${port} went offline...`)
                    .setTimestamp();

                await hook.send(embed);
            }

            i++;
        }

    await loop();
}