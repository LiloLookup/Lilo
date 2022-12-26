import {startService} from "@core/stats";
import * as Notifications from "@core/notifications";
import dotenv from "dotenv";

dotenv.config();

(async () => {
    await startService();
    await Notifications.send("Lilo is now ready!", false);
})();