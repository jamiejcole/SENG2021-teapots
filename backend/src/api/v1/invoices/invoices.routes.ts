import { Router } from "express";
import * as controller from "./invoices.controller";
const router = Router();

/**
 * @openapi
 * /api/v1/invoices:
 *   post:
 *     summary: Create an invoice from UBL Order XML
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
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
router.post("/", controller.createInvoice);

/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     summary: Retrieve a list of invoices
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Invoices fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceListResponse'
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
router.get("/", controller.listInvoices);

/**
 * @openapi
 * /api/v1/invoices/validate:
 *   post:
 *     summary: Validate UBL Invoice XML payload
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateInvoiceRequest'
 *     responses:
 *       200:
 *         description: UBL Invoice is valid
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
router.post("/validate", controller.validateInvoice);

/**
 * @openapi
 * /api/v1/invoices/pdf:
 *   post:
 *     summary: Create a PDF from a UBL XML Invoice document
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/xml:
 *           schema:
 *             type: string
 *           example: |
 *             <?xml version="1.0" encoding="UTF-8"?>
 *             <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
 *               <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">INV-001</cbc:ID>
 *             </Invoice>
 *     responses:
 *       201:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid invoice XML payload
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
router.post("/pdf", controller.createPdf);

/**
 * @openapi
 * /api/v1/invoices/{invoiceId}:
 *   get:
 *     summary: Retrieve an invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the invoice to retrieve
 *     responses:
 *       200:
 *         description: Invoice fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceRecord'
 *       400:
 *         description: Invalid invoice ID format
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
 *       404:
 *         description: Invoice not found
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
router.get("/:invoiceId", controller.getInvoice);

/**
 * @openapi
 * /api/v1/invoices/{invoiceId}:
 *   put:
 *     summary: Update an invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the invoice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceRequest'
 *     responses:
 *       200:
 *         description: Invoice XML successfully updated
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
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
 *       404:
 *         description: Invoice not found
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
router.put("/:invoiceId", controller.updateInvoice);

/**
 * @openapi
 * /api/v1/invoices/{invoiceId}:
 *   delete:
 *     summary: Delete an invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the invoice to delete
 *     responses:
 *       204:
 *         description: Invoice successfully deleted
 *       400:
 *         description: Invalid invoice ID format
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
 *       404:
 *         description: Invoice not found
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
router.delete("/:invoiceId", controller.deleteInvoice);

export default router;