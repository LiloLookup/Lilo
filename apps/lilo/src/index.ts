import {KVBase} from "@core/kvb";
import {startService} from "@core/stats";
import * as Notifications from "@core/notifications";
import dotenv from "dotenv";

dotenv.config();

/*
    **WARNING**: This branch will crash when reaching the first execution
    of a yet unimplemented function in our kvb fork. This isn't a "high"
    priority yet, as we need to investigate & fix another issue at first.
*/

export const kvb = new KVBase({
    bunOptions: {
        filename: "lilo.sqlite"
    }
});

(async () => {
    await startService();
    await Notifications.send("Lilo is now ready!", false);
})();