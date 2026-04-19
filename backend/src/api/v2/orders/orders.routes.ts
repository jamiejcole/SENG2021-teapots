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
 *       400:
 *         description: Invalid request or invalid UBL payload
 *       401:
 *         description: Unauthorized
 */
router.post("/validate", controller.validateOrder);

/**
 * @openapi
 * /api/v2/orders:
 *   get:
 *     summary: Retrieve orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", controller.listOrders);
/**
 * @openapi
 * /api/v2/orders:
 *   post:
 *     summary: Create an order from UBL XML
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         description: Invalid order payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", controller.createOrder);

/**
 * @openapi
 * /api/v2/orders/{orderKey}/xml:
 *   get:
 *     summary: Retrieve the XML for an order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The order key
 *     responses:
 *       200:
 *         description: Order XML retrieved successfully
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:orderKey/xml", controller.getOrderXml);
/**
 * @openapi
 * /api/v2/orders/{orderKey}:
 *   get:
 *     summary: Retrieve an order by key
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The order key
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:orderKey", controller.getOrder);
/**
 * @openapi
 * /api/v2/orders/{orderKey}:
 *   put:
 *     summary: Update an order by key
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The order key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         description: Invalid order payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:orderKey", controller.updateOrder);
/**
 * @openapi
 * /api/v2/orders/{orderKey}:
 *   delete:
 *     summary: Delete an order by key
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The order key
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:orderKey", controller.deleteOrder);

export default router;
