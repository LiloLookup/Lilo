import * as Notifications from "@core/notifications";
import {client} from "@core/redis";

export const handle = async (serverStr: string, statusResult: any) => {
    await client.hSet(`server:${serverStr}`, "data", JSON.stringify(statusResult));
    await saveData(serverStr, statusResult);
}

export async function resolveStatus(serverStr: string, offlineServers: any) {
    const host = serverStr.split(":")[0],
        port = parseInt(serverStr.split(":")[1]);

    if (!offlineServers.some(server => server.host == host && server.port == port))
        return;

    await client.set("offline", JSON.stringify(offlineServers.filter(server => server.host != host || server.port != port)));

    const notifications = JSON.parse(await client.get("notifications"));
    if (!notifications.includes(serverStr) && !notifications.includes(`*.${serverStr}`))
        return;

    const aliases = JSON.parse(await client.get("aliases") || "[]"),
        alias = aliases.filter(alias =>
            alias.lowLevel == `${host}:${port}`)[0],
        address = (alias ? alias.topLevel.replace(":25565", "")
            : `${host}${(port == 25565 ? "" : `:${port}`)}`);

    if (!(aliases.some(alias => alias.lowLevel == address)))
        await Notifications.send(`${address} is back online!\nhttps://lilo-lookup.de/server/${host}${port == 25565 ? "" : `:${port}`}`, true, {
            host: host,
            port: port
        });
}

export const saveData = async (serverStr: string, rawData: any) => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000,
        time = (new Date(Date.now() - tzOffset)).toISOString();

    let stats = JSON.parse(await client.hGet(`server:${serverStr}`, "stats") || "[]");
    stats.push({
        time: time,
        online: rawData.players.online,
        rtt: rawData.roundTripLatency ? rawData.roundTripLatency : null,
    });

    await client.hSet(`server:${serverStr}`, "stats", JSON.stringify(stats));
}