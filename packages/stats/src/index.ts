import {client} from "@core/redis";
import {app} from "@core/api";
import {status, statusLegacy} from "minecraft-server-util";
import {startMonitoring} from "./utils/downtime";
import {handle, saveData} from "./utils/dataHandling";

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
                await handle(host, port, serverStr, statusResult, offlineServers);
            }).catch(() => {
                statusLegacy(host, port).then(async (statusLegacyResult) => {
                    await handle(host, port, serverStr, statusLegacyResult, offlineServers);
                }).catch(async () => {
                    await startMonitoring(host, port, serverStr);
                });
            });
        }

        setTimeout(loop, 45000);
    }

    await loop();
}