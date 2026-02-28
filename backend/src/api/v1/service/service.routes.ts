import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    service: "Invoice Generation Service",
    version: "1.0.0",
    supportedInputs: [
      "application/xml",
      "application/json"
    ],
    outputFormat: "application/xml",
    ublVersion: "2.1"
  });
});

export default router;