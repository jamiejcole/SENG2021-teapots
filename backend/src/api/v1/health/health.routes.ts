import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "pay-invoice-generator",
    version: "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;