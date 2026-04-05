import { Router } from "express";
import * as controller from "./orders.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/orders/create:
 *   post:
 *     summary: Create an order using the external Microslop API and retrieve its UBL XML
 *     tags: [Orders]
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *       500:
 *         description: Internal server error
 */
router.post("/create", controller.createOrder);


/**
 * @openapi
 * /api/v1/orders/validate:
 *   post:
 *     summary: Validate UBL Order XML payload
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateOrderRequest'
 *     responses:
 *       200:
 *         description: UBL Order is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid request or invalid UBL payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/validate", controller.validateOrder);

export default router;