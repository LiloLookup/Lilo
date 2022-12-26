import {client} from "@core/redis";
import {Request, Response} from "express";

export const notifications = async (req: Request, res: Response) => {
    if (!req.params.address || !req.body.action)
        return res.send({"status": 404});

    const notifications = JSON.parse(await client.get("notifications") || "[]");
    switch (req.body.action) {
        case "ENABLE":
            notifications.push(`${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`);
            await client.set("notifications", JSON.stringify(notifications));
            break;
        case "DISABLE":
            notifications.splice(notifications.indexOf(`${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`), 1);
            await client.set("notifications", JSON.stringify(notifications));
            break;
    }

    return res.send({"status": 200});
}