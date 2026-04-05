import { Router } from "express";
import * as controller from "./orders.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v2/orders/validate:
 *   post:
 *     summary: Validate UBL Order XML payload
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
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
 *         description: Unauthorized - missing or invalid authentication
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

router.post("/", controller.createOrder);
router.get("/", controller.listOrders);
router.get("/:orderId/xml", controller.getOrderXml);
router.get("/:orderId", controller.getOrder);
router.put("/:orderId", controller.updateOrder);
router.delete("/:orderId", controller.deleteOrder);

export default router;
