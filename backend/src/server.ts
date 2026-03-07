import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function startServer() {
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
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