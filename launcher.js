const {spawn} = require("node:child_process");

const ts_node = spawn("ts-node", ["-r", "tsconfig-paths/register", "apps/nuro/src/index.ts"]);
ts_node.stdout.on("data", (data) => {
    console.log(Buffer.from(data).toString("utf8"));
});

ts_node.stderr.on("data", (data) => {
    console.error(Buffer.from(data).toString("utf8"));
});