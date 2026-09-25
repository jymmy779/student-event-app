import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, "0.0.0.0", () => console.log(`API listening on http://0.0.0.0:${port}`));
function shutdown() { server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
