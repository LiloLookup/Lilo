import {hook} from "@core/app";
import {client} from "@core/redis";
import {MessageBuilder} from "discord-webhook-node";

export const handle = async (host: string, port: number, statusResult: any, offlineServers: any) => {
    await client.hSet(`server:${host}:${port}`, "data", JSON.stringify(statusResult));
    await saveData(host, port, statusResult);
    await resolveStatus(host, port, offlineServers);
}

async function resolveStatus(host: string, port: number, offlineServers: any) {
    if (!offlineServers.some(server => server.host == host && server.port == port))
        return;

    await client.set("offline", JSON.stringify(offlineServers.filter(server => server.host != host || server.port != port)));

    const noNotify = await client.hExists("no_notify", `server:${host}:${port}`),
        wildcardNoNotify = await client.hExists("no_notify", `server:*.${host.match(/\./g).length >= 2
            ? host.substring(host.indexOf(".") + 1) : host}:${port}`);

    if (noNotify || wildcardNoNotify)
        return;

    const embed = new MessageBuilder()
        .setDescription(`${host}:${port} is back online...`)
        .setTimestamp();

    await hook.send(embed);
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