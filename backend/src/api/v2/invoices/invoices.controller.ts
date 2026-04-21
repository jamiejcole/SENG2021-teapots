import { Request, Response } from "express";
import * as service from "./invoices.service";
import {
    validateUBL,
    validateCreateInvoiceRequest,
    validateInvoiceSupplementShape,
    generateInvoicePdf,
} from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { HttpError } from "../../../errors/HttpError";
import { persistInvoiceRequest } from "../../../db/persistInvoiceRequest";
import { sendInvoiceReadyEmail } from "../../../utils/mailgun.service";
import type { InvoiceSupplement } from "../../../types/invoice.types";
import * as libxml from "libxmljs2";
function extractInvoiceEmailData(invoiceXml: string) {
    const doc = libxml.parseXml(invoiceXml.trim());
    const ns = {
        inv: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    };

    const getText = (xpath: string) => {
        const node = doc.get(xpath, ns) as unknown as libxml.Element | null;
        return node?.text()?.trim() || "";
    };

    const invoiceNumber = getText("/inv:Invoice/cbc:ID") || `INV-${Date.now()}`;
    const dueDate = getText("/inv:Invoice/cbc:DueDate") || new Date().toISOString().slice(0, 10);
    const currency = getText("/inv:Invoice/cbc:DocumentCurrencyCode") || "AUD";
    const payableAmount = getText("/inv:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount");
    const amount = payableAmount ? `${currency} $${payableAmount}` : `${currency} $0.00`;

    return { invoiceNumber, dueDate, amount };
}

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) {
        throw new HttpError(401, "Authentication required");
    }
    return uid;
}

function mongoIdParam(param: string | string[] | undefined): string {
    if (typeof param === "string" && param) return param;
    if (Array.isArray(param) && param[0]) return param[0];
    return "";
}

export const listStoredInvoices = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const rows = await service.listInvoicesForUser(userId);
    res.status(200).json({ invoices: rows });
});

export const previewInvoice = asyncHandler(async (req: Request, res: Response) => {
    validateCreateInvoiceRequest(req.body);
    const { orderXml, invoiceSupplement } = req.body;

    const { invoiceXml } = await service.buildInvoiceXmlFromOrderXml(orderXml, invoiceSupplement);

    res.status(200).json({
        invoiceXml,
        previewOnly: true,
    });
});

type StudioDraftRequest = {
    businessName?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessAddress?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    jobSummary?: string;
    notes?: string;
    paymentNotes?: string;
    extraNotes?: string;
    accountName?: string;
    accountNumber?: string;
    bsb?: string;
    taxRate?: number;
    theme?: 'light' | 'dark';
    lineItems?: Array<{ id?: string; name?: string; details?: string; quantity?: number; rate?: number }>;
};

/**
 * Normalizes Invoice Studio JSON body for preview, UBL order serialization, and generation.
 */
function normalizeStudioDraftRequestBody(body: unknown): {
    draft: {
        businessName: string;
        businessPhone: string;
        businessEmail: string;
        businessAddress: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        customerAddress: string;
        invoiceNumber: string;
        issueDate: string;
        dueDate?: string;
        jobSummary: string;
        notes: string;
        paymentNotes: string;
        extraNotes: string;
        accountName: string;
        accountNumber: string;
        bsb: string;
        taxRate: number;
        lineItems: Array<{ id: string; name: string; details: string; quantity: number; rate: number }>;
    };
    theme: 'light' | 'dark';
} {
    if (!body || typeof body !== 'object') {
        throw new HttpError(400, 'Request body must be a JSON object');
    }

    const raw = body as StudioDraftRequest;

    if (!raw.businessName?.trim() || !raw.customerName?.trim() || !raw.invoiceNumber?.trim()) {
        throw new HttpError(400, 'Studio draft must include businessName, customerName, and invoiceNumber');
    }

    if (!Array.isArray(raw.lineItems) || raw.lineItems.length === 0) {
        throw new HttpError(400, 'Studio draft must include at least one line item');
    }

    return {
        draft: {
            businessName: raw.businessName,
            businessPhone: raw.businessPhone ?? '',
            businessEmail: raw.businessEmail ?? '',
            businessAddress: raw.businessAddress ?? '',
            customerName: raw.customerName,
            customerPhone: raw.customerPhone ?? '',
            customerEmail: raw.customerEmail ?? '',
            customerAddress: raw.customerAddress ?? '',
            invoiceNumber: raw.invoiceNumber,
            issueDate: raw.issueDate ?? new Date().toISOString().slice(0, 10),
            dueDate: raw.dueDate,
            jobSummary: raw.jobSummary ?? '',
            notes: raw.notes ?? '',
            paymentNotes: raw.paymentNotes ?? '',
            extraNotes: raw.extraNotes ?? '',
            accountName: raw.accountName ?? raw.businessName,
            accountNumber: raw.accountNumber ?? '',
            bsb: raw.bsb ?? '',
            taxRate: typeof raw.taxRate === 'number' && Number.isFinite(raw.taxRate) ? raw.taxRate : 0.1,
            lineItems: raw.lineItems.map((lineItem, index) => ({
                id: lineItem.id ?? String(index + 1),
                name: lineItem.name ?? 'Item',
                details: lineItem.details ?? lineItem.name ?? 'Item',
                quantity: typeof lineItem.quantity === 'number' && Number.isFinite(lineItem.quantity) ? lineItem.quantity : 1,
                rate: typeof lineItem.rate === 'number' && Number.isFinite(lineItem.rate) ? lineItem.rate : 0,
            })),
        },
        theme: raw.theme === 'dark' ? 'dark' : 'light',
    };
}

export const previewStudioInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { draft, theme } = normalizeStudioDraftRequestBody(req.body);

    const html = await service.buildStudioPreviewHtml(draft, theme);

    res.status(200).contentType('text/html').send(html);
});

/**
 * Build UBL Order XML + invoice supplement from an Invoice Studio draft (same inputs as studio-preview).
 * Used with POST /invoices to generate — mirrors loading order XML from /orders then supplementing on /generate.
 */
export const studioBuildOrderPayload = asyncHandler(async (req: Request, res: Response) => {
    const { draft } = normalizeStudioDraftRequestBody(req.body);
    const payload = service.studioDraftToOrderXmlAndSupplement(draft);
    res.status(200).json(payload);
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const stats = await service.getDashboardForUser(userId);
    res.status(200).json(stats);
});

export const getStoredInvoice = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const invoiceId = mongoIdParam(req.params.invoiceId);
    const doc = await service.getInvoiceForUser(invoiceId, userId);
    if (!doc) {
        throw new HttpError(404, "Invoice not found");
    }
    res.status(200).json(doc);
});

export const patchStoredInvoice = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const invoiceId = mongoIdParam(req.params.invoiceId);
    const body = req.body as { lifecycleStatus?: string; paymentTermsNote?: string };
    const updated = await service.patchInvoiceMetadata(invoiceId, userId, body);
    if (!updated) {
        throw new HttpError(404, "Invoice not found");
    }
    res.status(200).json(updated);
});

export const validateOneStoredInvoice = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const invoiceId = mongoIdParam(req.params.invoiceId);
    const updated = await service.recordStoredInvoiceValidated(invoiceId, userId);
    if (!updated) {
        throw new HttpError(404, "Invoice not found or has no XML");
    }
    res.status(200).json(updated);
});

export const regenerateStoredInvoice = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const invoiceId = mongoIdParam(req.params.invoiceId);
    if (!req.body || typeof req.body !== "object" || !("invoiceSupplement" in req.body)) {
        throw new HttpError(400, "Request body must include 'invoiceSupplement'");
    }
    validateInvoiceSupplementShape((req.body as { invoiceSupplement: unknown }).invoiceSupplement);
    const { invoiceSupplement } = req.body as { invoiceSupplement: InvoiceSupplement };
    const updated = await service.regenerateInvoiceForUser(invoiceId, userId, invoiceSupplement);
    if (!updated) {
        throw new HttpError(404, "Invoice not found");
    }
    res.status(200).json(updated);
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    validateCreateInvoiceRequest(req.body);
    const { orderXml, invoiceSupplement } = req.body;
    const { orderObj, invoiceXml } = await service.buildInvoiceXmlFromOrderXml(orderXml, invoiceSupplement);

    const userId = req.user?.userId;
    const storedId = await persistInvoiceRequest({
        orderXml,
        orderObj,
        invoiceXml,
        invoiceSupplement,
        userId,
    });
    if (storedId) {
        res.set("X-Stored-Invoice-Id", storedId);
    }
    res.contentType("application/xml");
    res.status(201).send(invoiceXml);
});

export async function validateInvoice(req: Request, res: Response) {
    const { invoiceXml } = req.body;

    if (!invoiceXml || typeof invoiceXml !== "string" || !invoiceXml.trim()) {
        throw new HttpError(400, "Request body must include 'invoiceXml' as a non-empty string");
    }

    res.contentType("application/json");

    validateUBL(invoiceXml, "Invoice");

    res.status(200).json({
        message: "UBL Invoice is valid!",
    });
}

export async function createPdf(req: Request, res: Response) {
    const invoiceXml = req.body;

    if (!invoiceXml || typeof invoiceXml !== "string" || !invoiceXml.trim()) {
        throw new HttpError(400, "Request body must be a non-empty XML string");
    }

    validateUBL(invoiceXml, "Invoice");

    const doc = await generateInvoicePdf(invoiceXml);
    const invoiceHash = await service.storeInvoicePdf(invoiceXml, doc);
    const baseUrl = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const publicPdfUrl = `${baseUrl}/invoices/${invoiceHash}.pdf`;

    if (req.user?.userId) {
        await service.linkPdfHashToInvoiceIfOwned(req.user.userId, invoiceXml, invoiceHash);
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${invoiceHash}.pdf"`);
    res.set("X-Invoice-Url", publicPdfUrl);
    res.set("X-Invoice-Pdf-Hash", invoiceHash);
    res.status(201).send(doc);
}

export const getPublicInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
    const { invoiceHash } = req.params;

    if (!invoiceHash || typeof invoiceHash !== "string") {
        throw new HttpError(400, "Invoice hash is required");
    }

    const invoicePdf = await service.findInvoicePdfByHash(invoiceHash);

    if (!invoicePdf) {
        throw new HttpError(404, "Invoice PDF not found");
    }

    res.set("Content-Type", invoicePdf.contentType || "application/pdf");
    res.set("Content-Disposition", `inline; filename="${invoicePdf.invoiceHash}.pdf"`);
    res.set("Cache-Control", "public, max-age=86400");
    res.status(200).send(invoicePdf.pdfData);
});

export const emailInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { invoiceXml, to, storedInvoiceId } = req.body as {
        invoiceXml?: string;
        to?: string;
        storedInvoiceId?: string;
    };
    const startedAt = Date.now();
    const userId = req.user?.userId;

    if (!invoiceXml || typeof invoiceXml !== "string" || !invoiceXml.trim()) {
        throw new HttpError(400, "Request body must include 'invoiceXml' as a non-empty string");
    }

    if (!to || typeof to !== "string" || !to.trim()) {
        throw new HttpError(400, "Request body must include 'to' as a non-empty string");
    }

    const email = to.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new HttpError(400, "Invalid recipient email address");
    }

    console.log(`[invoice-email] Start email send for ${email}`);
    validateUBL(invoiceXml, "Invoice");

    console.log("[invoice-email] Generating PDF attachment");
    const pdfBuffer = await generateInvoicePdf(invoiceXml);
    console.log("[invoice-email] PDF attachment generated");

    const { invoiceNumber, dueDate, amount } = extractInvoiceEmailData(invoiceXml);
    const attachments = [
        {
            data: pdfBuffer,
            filename: `${invoiceNumber}.pdf`,
            contentType: "application/pdf",
        },
        {
            data: Buffer.from(invoiceXml, "utf8"),
            filename: `${invoiceNumber}.xml`,
            contentType: "application/xml",
        },
    ];

    try {
        console.log("[invoice-email] Sending Mailgun message");
        await sendInvoiceReadyEmail(
            email,
            {
                amount,
                dueDate,
                invoiceNumber,
            },
            attachments
        );
        console.log(`[invoice-email] Email sent in ${Date.now() - startedAt}ms`);

        if (storedInvoiceId && userId) {
            await service.applyEmailOutcomeToInvoice(storedInvoiceId, userId, "SENT", { to: email });
        }

        res.status(200).json({
            message: "Invoice email sent",
            to: email,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (storedInvoiceId && userId) {
            await service.applyEmailOutcomeToInvoice(storedInvoiceId, userId, "SEND_FAILED", { error: msg });
        }
        throw err;
    }
});

export async function deleteInvoice(req: Request, res: Response) {
    const userId = requireUserId(req);
    const invoiceId = mongoIdParam(req.params.invoiceId);

    if (!invoiceId) {
        throw new HttpError(400, "Invoice ID is required as a non-empty string");
    }

    const deletedInvoiceObj = await service.deleteInvoiceByIdForUser(invoiceId, userId);

    if (!deletedInvoiceObj) {
        throw new HttpError(404, "Invoice not found");
    }

    res.status(204).send();
}
