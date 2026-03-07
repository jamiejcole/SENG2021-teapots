import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Get health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "ubl-invoice-generator",
    version: "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;