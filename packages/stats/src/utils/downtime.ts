import {client} from "@core/redis";
import {status, statusLegacy} from "minecraft-server-util";
import {MessageBuilder} from "discord-webhook-node";
import {hook} from "@core/app";

export const startMonitoring = async (host: string, port: number) => {
    let i = 0,
        offline = true;
    const serverStr = `server:${host}:${port}`,
        loop = async function () {
            status(host, port).then(async (statusResult) => {
                await client.hSet(serverStr, "data", JSON.stringify(statusResult));
                offline = false;
            }).catch(() => {
                statusLegacy(host, port).then(async (statusLegacyResult) => {
                    await client.hSet(serverStr, "data", JSON.stringify(statusLegacyResult));
                    offline = false;
                }).catch(() => {
                    offline = true;
                });
            });

            if (i < 4) {
                setTimeout(loop, 3000);
            } else if (!offline) {
                const embed = new MessageBuilder()
                    .setDescription(`${host}:${port} is experiencing packet losses...`)
                    .setTimestamp();

                await hook.send(embed);
            } else {
                const offlineServers = JSON.parse(await client.get("offline") || "[]");
                if (offlineServers.some(server => server.host == host && server.port == port))
                    return;

                offlineServers.push({"host": host, "port": port});
                await client.set("offline", JSON.stringify(offlineServers));

                const embed = new MessageBuilder()
                    .setDescription(`${host}:${port} went offline...`)
                    .setTimestamp();

                await hook.send(embed);
            }

            i++;
        }

    await loop();
}