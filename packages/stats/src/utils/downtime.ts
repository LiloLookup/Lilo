import {client} from "@core/redis";
import {hook} from "@core/app";
import {status, statusLegacy} from "minecraft-server-util";
import {MessageBuilder} from "discord-webhook-node";
import {saveData} from "./dataHandling";

export const startMonitoring = async (host: string, port: number, serverStr: string) => {
    let i = 0,
        offline = true;
    const loop = async function () {
        status(host, port).then(() => {
            offline = false;
        }).catch(() => {
            statusLegacy(host, port).then(() => {
                offline = false;
            }).catch(() => {
                offline = true;
            });
        });

        if (i < 4) {
            setTimeout(loop, 3000);
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

            await saveData(host, port, {
                players: {online: null, max: null},
                roundTripLatency: null
            }, `server:${host}:${port}`);

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