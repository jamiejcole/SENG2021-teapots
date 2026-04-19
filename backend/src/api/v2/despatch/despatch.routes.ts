import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as controller from "./despatch.controller";

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/v2/despatch/create:
 *   post:
 *     summary: Create a despatch document
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Despatch created successfully
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
 */
router.post("/create", controller.createDespatch);
/**
 * @openapi
 * /api/v2/despatch/list:
 *   get:
 *     summary: List despatch documents
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Despatch documents retrieved successfully
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
router.get("/list", controller.listDespatch);
/**
 * @openapi
 * /api/v2/despatch/retrieve/{despatchId}:
 *   get:
 *     summary: Retrieve a despatch by ID
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: despatchId
 *         required: true
 *         schema:
 *           type: string
 *         description: The despatch ID
 *     responses:
 *       200:
 *         description: Despatch retrieved successfully
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
 *         description: Despatch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/retrieve/:despatchId", controller.retrieveDespatch);
/**
 * @openapi
 * /api/v2/despatch/{despatchId}:
 *   delete:
 *     summary: Delete a despatch by ID
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: despatchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Despatch deleted successfully
 *       404:
 *         description: Despatch not found
 */
router.delete("/:despatchId", controller.deleteDespatch);
/**
 * @openapi
 * /api/v2/despatch/email:
 *   post:
 *     summary: Email a despatch document
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Despatch email sent successfully
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
 */
router.post("/email", controller.emailDespatch);
/**
 * @openapi
 * /api/v2/despatch/cancel/order:
 *   post:
 *     summary: Create an order cancellation despatch request
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order cancellation request created successfully
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
 */
router.post("/cancel/order", controller.cancelOrderPost);

/**
 * @openapi
 * /api/v2/despatch/cancel/order:
 *   get:
 *     summary: List order cancellation despatch requests
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order cancellation requests retrieved successfully
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
router.get("/cancel/order", controller.cancelOrderList);
/**
 * @openapi
 * /api/v2/despatch/cancel/fulfilment:
 *   post:
 *     summary: Create a fulfilment cancellation despatch request
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fulfilment cancellation request created successfully
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
 */
router.post("/cancel/fulfilment", controller.cancelFulfilmentPost);

/**
 * @openapi
 * /api/v2/despatch/cancel/fulfilment:
 *   get:
 *     summary: List fulfilment cancellation despatch requests
 *     tags: [Despatch]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fulfilment cancellation requests retrieved successfully
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
router.get("/cancel/fulfilment", controller.cancelFulfilmentList);

export default router;
