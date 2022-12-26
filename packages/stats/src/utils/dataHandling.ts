import * as Notifications from "@core/notifications";
import {client} from "@core/redis";

export const handle = async (host: string, port: number, statusResult: any) => {
    await client.hSet(`server:${host}:${port}`, "data", JSON.stringify(statusResult));
    await saveData(host, port, statusResult);
}

export async function resolveStatus(host: string, port: number, offlineServers: any) {
    if (!offlineServers.some(server => server.host == host && server.port == port))
        return;

    await client.set("offline", JSON.stringify(offlineServers.filter(server => server.host != host || server.port != port)));

    const notifications = JSON.parse(await client.get("notifications"));
    if (!notifications.includes(`${host}:${port}`) && !notifications.includes(`*.${host}:${port}`))
        return;

    await Notifications.send(`${host}:${port} is back online!\nhttps://lilo.northernsi.de/server/${host}${port == 25565 ? "" : `:${port}`}`, true, {host: host, port: port});
}

export const saveData = async (host: string, port: number, rawData: any) => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000,
        time = (new Date(Date.now() - tzOffset)).toISOString(),
        serverStr = `server:${host}:${port}`;

    let stats = JSON.parse(await client.hGet(serverStr, "stats") || "[]");
    stats.push({
        time: time,
        online: rawData.players.online,
        rtt: rawData.roundTripLatency ? rawData.roundTripLatency : null,
    });

    await client.hSet(serverStr, "stats", JSON.stringify(stats));
}