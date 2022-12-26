import {Webhook, MessageBuilder} from "discord-webhook-node";
import Twit from "twit";
import dotenv from "dotenv";
import process from "node:process";
import {notifications} from "@core/stats";

dotenv.config();

const Discord = new Webhook(process.env.DISCORD_WEBHOOK_URL);
const Twitter = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

Twitter.get("account/verify_credentials", {
    include_entities: false,
    skip_status: true,
    include_email: false
}, onAuthenticated);

export async function send(message, twitter, options = {host: null, port: null}) {
    const embed = new MessageBuilder()
        .setDescription(message)
        .setTimestamp();

    await Discord.send(embed);

    if (twitter && notifications.includes(`${options.host}:${options.port}`))
        Twitter.post("statuses/update", {
            status: message
        });
}

function onAuthenticated(err, res) {
    if (err) throw err;
    console.log("[Twitter] Authenticated.");
}