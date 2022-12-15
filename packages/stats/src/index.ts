import {client} from "@core/redis";
import {app} from "@core/api";
import {status, statusLegacy} from "minecraft-server-util";

import {startMonitoring} from "./utils/downtime";
import {handle, resolveStatus} from "./utils/dataHandling";

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

            status(host, port).then(async (statusResult) => {
                await handle(host, port, statusResult);
                await resolveStatus(host, port, offlineServers);
            }).catch(() => {
                statusLegacy(host, port).then(async (statusLegacyResult) => {
                    await handle(host, port, statusLegacyResult);
                    await resolveStatus(host, port, offlineServers);
                }).catch(async () => {
                    await startMonitoring(host, port);
                });
            });
        }

        setTimeout(loop, 60000);
    }

    await loop();
}