import {client} from "@core/redis";
import {Request, Response} from "express";

export const notifications = async (req: Request, res: Response) => {
    if (!req.params.address || !req.params.token || !req.cookies.id || !req.body.action)
        return res.send({"status": 400});

    if (!JSON.parse(await client.hGet(`discord:${req.cookies.id}`, "access_tokens"))
        .some(accessObj => accessObj.accessToken == req.cookies.access_token))
        return res.send({"status": 401});

    if (!await client.exists(`server:${req.params.address}${!req.params.address.includes(":") ? ":25565" : ""}`))
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