import { Router } from "express";
import * as controller from "./orders.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/orders/create:
 *   post:
 *     summary: Create an order using the external Microslop API and retrieve its UBL XML
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *       500:
 *         description: Internal server error
 */
router.post("/create", controller.createOrder);

export default router;