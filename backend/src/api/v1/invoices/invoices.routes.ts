import { Router } from "express";
import * as controller from "./invoices.controller";
const router = Router();

router.post("/pdf", controller.createPdf);

/**
 * @openapi
 * /api/v1/invoices:
 *   post:
 *     summary: Create an invoice from UBL Order XML
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceRequest'
 *     responses:
 *       201:
 *         description: Invoice XML generated successfully
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request or invalid UBL payload
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
router.post("/", controller.createInvoice);

/**
 * @openapi
 * /api/v1/invoices/validate:
 *   post:
 *     summary: Validate UBL Order XML payload
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateInvoiceRequest'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/validate", controller.validateInvoice);

export default router;