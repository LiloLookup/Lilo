import {client} from "@core/redis";
import {app} from "@core/api";
import {status, statusLegacy} from "minecraft-server-util";
import dotenv from "dotenv";

import {startMonitoring} from "./utils/downtime";
import {handle, resolveStatus, saveData} from "./utils/dataHandling";

dotenv.config();

export let notifications = null;

export const startService = async () => {
    await client.connect();
    app.listen(process.env.LILO_PORT);

    let statusServers = null,
        offlineServers = null,
        aliases = null,
        server: string;

    const loop = async function () {
        notifications = JSON.parse(await client.get("notifications") || "[]");
        statusServers = JSON.parse(await client.get("status") || "[]");
        offlineServers = JSON.parse(await client.get("offline") || "[]");
        aliases = JSON.parse(await client.get("aliases") || "[]");

        for (server in statusServers) {
            let host = statusServers[server].split(":")[0].toLowerCase(),
                port = parseInt(statusServers[server].split(":")[1]),
                serverStr = await srvOrigin(host, port);

            status(host, port, {timeout: 5000, enableSRV: false}).then(async (statusResult) => {
                if (statusResult.srvRecord &&
                    !(aliases.some(alias => alias.topLevel == `${host}:${port}`)) &&
                    !(aliases.some(alias => alias.lowLevel == `${host}:${port}`))) {
                    const srvServer = await client.exists(`server:${statusResult.srvRecord.host}:${statusResult.srvRecord.port}`);
                    if (!srvServer && serverStr != `${statusResult.srvRecord.host}:${statusResult.srvRecord.port}`)
                        await client.rename(`server:${host}:${port}`, `server:${statusResult.srvRecord.host}:${statusResult.srvRecord.port}`);
                }

                await handle(serverStr, statusResult);
                await resolveStatus(serverStr, offlineServers);
            }).catch(() => {
                statusLegacy(host, port, {timeout: 5000, enableSRV: false}).then(async (statusLegacyResult) => {
                    if (statusLegacyResult.srvRecord &&
                        !(aliases.some(alias => alias.topLevel == `${host}:${port}`)) &&
                        !(aliases.some(alias => alias.lowLevel == `${host}:${port}`))) {
                        const srvServer = await client.hGet(`server:${statusLegacyResult.srvRecord.host}:${statusLegacyResult.srvRecord.port}`, "data");
                        if (!srvServer && `${host}:${port}` != `${statusLegacyResult.srvRecord.host}:${statusLegacyResult.srvRecord.port}`)
                            await client.rename(`server:${host}:${port}`, `server:${statusLegacyResult.srvRecord.host}:${statusLegacyResult.srvRecord.port}`);
                    }

                    await handle(serverStr, statusLegacyResult);
                    await resolveStatus(serverStr, offlineServers);
                }).catch(async () => {
                    const lastSeeen = parseInt(await client.hGet(`server:${host}:${port}`, "last_seen")) || Date.now();
                    if (lastSeeen && Date.now() - lastSeeen > 7 * 24 * 60 * 60 * 1000) {
                        await client.set("status", JSON.stringify(JSON.parse(await client.get("status") || "[]")
                            .filter(server => server != serverStr)));
                        await client.del(`server:${host}${port}`);
                        return;
                    }

                    await saveData(`${host}:${port}`, {players: {online: 0, max: 0}, roundTripLatency: -1});
                    await startMonitoring(serverStr);
                });
            });
        }

        setTimeout(loop, 60000);
    }

    await loop();
}

export const srvOrigin = async (host: string, port: number) => {
    const aliases = JSON.parse(await client.get("aliases") || "[]"),
        alias = aliases.filter(alias => alias.topLevel == `${host}:${port}`);

    if (!alias || alias.length == 0)
        return `${host}:${port}`;

    if (aliases.some(alias => alias.lowLevel == `${host}:${port}`))
        return `${host}:${port}`;
    return `${alias[0].lowLevel.split(":")[0]}:${alias[0].lowLevel.split(":")[1]}`;
}