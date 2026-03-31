import dotenv from "dotenv";
import {connectDB} from "./db/mongo"

dotenv.config();

import app from "./app";

async function startServer() {
  await connectDB();
  const PORT = Number(process.env.PORT ?? 3000);
  app.listen(PORT, () => {
    console.log(`* API running on http://0.0.0.0:${PORT}`);
  });
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();