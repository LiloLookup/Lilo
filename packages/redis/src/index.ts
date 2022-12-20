import {createClient} from "redis";
import dotenv from "dotenv";

dotenv.config();

export const client = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_ADDRESS}:${process.env.REDIS_PORT}`
});

client.on("error", (err) => console.log("Redis Client Error", err));