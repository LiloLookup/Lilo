import {internalServerErrorHTML} from "@core/api";
import {kvb} from "@core/app";
import {Request, Response} from "express";
import FS from "node:fs";

export const globalStats = async (req: Request, res: Response) => {
    const servers = await kvb.keys("server:*"),
        monitoredServers = JSON.parse(await kvb.get("status") || "[]"),
        offlineServers = JSON.parse(await kvb.get("offline") || "[]"),
        blogPosts = await kvb.keys("blog:*"),
        registeredUsers = await kvb.keys("discord:[^admins]*");

    if (!servers || !monitoredServers || !offlineServers || !blogPosts || !registeredUsers)
        return res.status(500).send(internalServerErrorHTML);

    let statsHTML = FS.readFileSync(`${__dirname}/../../static/stats/view.html`, "utf-8");
    statsHTML = statsHTML.replace(/{servers}/g, servers.length.toString());
    statsHTML = statsHTML.replace(/{monitored}/g, monitoredServers.length.toString());
    statsHTML = statsHTML.replace(/{offline}/g, offlineServers.length.toString());
    statsHTML = statsHTML.replace(/{blogposts}/g, blogPosts.length.toString());
    statsHTML = statsHTML.replace(/{users}/g, registeredUsers.length.toString());
    return res.send(statsHTML);
}