import {internalServerErrorHTML, unauthorizedHTML} from "@core/api";
import {client} from "@core/redis";
import Axios from "axios";
import dotenv from "dotenv";
import JWT from "jsonwebtoken";
import process from "node:process";
import Crypto from "node:crypto";

dotenv.config();

export const callback = async (req: any, res: any): Promise<any> => {
    const code = req.query.code as string;

    if (!code)
        return res.status(500).send(internalServerErrorHTML);

    try {
        const formData = new URLSearchParams({
            client_id: process.env.DISCORD_OAUTH_CLIENT_ID,
            client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: `https://${req.headers.host}/auth/callback`
        });

        const response = await Axios.post("https://discord.com/api/v8/oauth2/token", formData.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip"
            }
        });

        const {access_token} = response.data;
        if (!response.data)
            return res.status(500).send(internalServerErrorHTML);

        const userResponse = await Axios.get("https://discord.com/api/v8/users/@me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Accept-Encoding": "gzip"
            },
        });

        const {id} = userResponse.data,
            allowedUsers = JSON.parse(await client.get("discord:admins") || "[]");
        if (!allowedUsers.includes(id))
            return res.status(401).send(unauthorizedHTML);

        const accessTokens = JSON.parse(await client.hGet(`discord:${id}`, "access_tokens") || "[]"),
            tokenSecret = Crypto.randomBytes(8).toString("hex").slice(0, 2048),
            accessToken = await JWT.sign({user_id: id}, tokenSecret);
        accessTokens.push({"accessToken": accessToken, "tokenSecret": tokenSecret});

        await client.hSet(`discord:${id}`, "data", JSON.stringify(userResponse.data));
        await client.hSet(`discord:${id}`, "access_tokens", JSON.stringify(accessTokens));

        res.cookie("id", id, {expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 365))});
        res.cookie("access_token", accessToken, {expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 365))});

        res.redirect(`http://${req.headers.host}/admin`);
    } catch (err) {
        console.log(err);
        return res.status(500).send(internalServerErrorHTML);
    }
};