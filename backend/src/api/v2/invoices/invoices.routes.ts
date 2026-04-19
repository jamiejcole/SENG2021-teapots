import { Router } from "express";
import * as controller from "./invoices.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all invoice routes
router.use(authMiddleware);

/**
 * @openapi
 * /api/v2/invoices/dashboard-stats:
 *   get:
 *     summary: Retrieve invoice dashboard statistics
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/dashboard-stats", controller.getDashboardStats);

/**
 * @openapi
 * /api/v2/invoices:
 *   get:
 *     summary: Retrieve stored invoices
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stored invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InvoiceRecord'
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", controller.listStoredInvoices);

/**
 * @openapi
 * /api/v2/invoices/pdf:
 *   post:
 *     summary: Create a PDF from a UBL XML Invoice Document
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
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
router.post("/pdf", controller.createPdf);

/**
 * @openapi
 * /api/v2/invoices/email:
 *   post:
 *     summary: Send invoice email with public PDF link using Mailgun template
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceXml, to]
 *             properties:
 *               invoiceXml:
 *                 type: string
 *               to:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Invoice email sent successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/email", controller.emailInvoice);

/**
 * @openapi
 * /api/v2/invoices:
 *   post:
 *     summary: Create an invoice from UBL Order XML
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
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
router.post("/", controller.createInvoice);

/**
 * @openapi
 * /api/v2/invoices/validate:
 *   post:
 *     summary: Validate UBL Invoice XML payload
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
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
router.post("/validate", controller.validateInvoice);

/**
 * @openapi
 * /api/v2/invoices/preview:
 *   post:
 *     summary: Build a preview invoice XML without persisting it
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceRequest'
 *     responses:
 *       200:
 *         description: Invoice preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreviewInvoiceResponse'
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
 */
router.post("/preview", controller.previewInvoice);

/**
 * @openapi
 * /api/v2/invoices/{invoiceId}/validate:
 *   post:
 *     summary: Validate a stored invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stored invoice to validate
 *     responses:
 *       200:
 *         description: Stored invoice is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:invoiceId/validate", controller.validateOneStoredInvoice);

/**
 * @openapi
 * /api/v2/invoices/{invoiceId}/regenerate:
 *   post:
 *     summary: Regenerate a stored invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stored invoice to regenerate
 *     responses:
 *       200:
 *         description: Stored invoice regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:invoiceId/regenerate", controller.regenerateStoredInvoice);

/**
 * @openapi
 * /api/v2/invoices/{invoiceId}:
 *   patch:
 *     summary: Patch a stored invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stored invoice to patch
 *     responses:
 *       200:
 *         description: Stored invoice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         description: Invalid invoice payload or invoice ID
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
 */
router.patch("/:invoiceId", controller.patchStoredInvoice);

/**
 * @openapi
 * /api/v2/invoices/{invoiceId}:
 *   get:
 *     summary: Retrieve a stored invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stored invoice to retrieve
 *     responses:
 *       200:
 *         description: Stored invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceRecord'
 *       401:
 *         description: Unauthorized - missing or invalid authentication
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
 */
router.get("/:invoiceId", controller.getStoredInvoice);

/**
 * @openapi
 * /api/v2/invoices/{invoiceId}:
 *   delete:
 *     summary: Delete an invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - BearerAuth: []
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
 *         description: Unauthorized - missing or invalid authentication
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
