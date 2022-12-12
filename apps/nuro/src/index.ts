import {startService} from "@core/stats";
import {Webhook, MessageBuilder} from "discord-webhook-node";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

export const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

(async () => {
    await startService();
    const embed = new MessageBuilder()
        .setDescription(`Nuro is now ready!`)
        .setTimestamp();
    
    await hook.send(embed);
})();