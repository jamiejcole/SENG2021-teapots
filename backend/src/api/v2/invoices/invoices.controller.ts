import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL, validateCreateInvoiceRequest, generateInvoicePdf } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { OrderData } from "../../../types/order.types";
import { HttpError } from "../../../errors/HttpError";
import { deleteInvoiceById } from "./invoices.service";
import { persistInvoiceRequest } from "../../../db/persistInvoiceRequest";
import { sendInvoiceReadyEmail } from "../../../utils/mailgun.service";
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


export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    validateCreateInvoiceRequest(req.body);
    const { orderXml, invoiceSupplement } = req.body;

    validateUBL(orderXml, "Order");

    const orderObj = (await service.createFullUblObject(orderXml)).data as OrderData;

    const invoiceXml = await service.convertJsonToUblInvoice(orderObj, invoiceSupplement);

    validateUBL(invoiceXml, 'Invoice');

    await persistInvoiceRequest({ orderXml, orderObj, invoiceXml, invoiceSupplement });
    res.contentType("application/xml");
    res.status(201).send(invoiceXml);
});

export async function validateInvoice(req: Request, res: Response) {
    const { invoiceXml } = req.body;
        
    if (!invoiceXml || typeof invoiceXml !== 'string' || !invoiceXml.trim()) {
        throw new HttpError(400, "Request body must include 'invoiceXml' as a non-empty string");
    }
    
    res.contentType("application/json");

    validateUBL(invoiceXml, "Invoice");

    res.status(200).json({
        message: "UBL Invoice is valid!"
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

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${invoiceHash}.pdf"`);
    res.set("X-Invoice-Url", publicPdfUrl);
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
    const { invoiceXml, to } = req.body as { invoiceXml?: string; to?: string };

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

    validateUBL(invoiceXml, "Invoice");

    const pdfBuffer = await generateInvoicePdf(invoiceXml);

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

    await sendInvoiceReadyEmail(email, {
        amount,
        dueDate,
        invoiceNumber,
    }, attachments);

    res.status(200).json({
        message: "Invoice email sent",
        to: email,
    });
});

export async function deleteInvoice(req: Request, res: Response) {
    const { invoiceId } = req.params

    if (!invoiceId || typeof invoiceId !== 'string') {
        throw new HttpError(400, "Invoice ID is required as a non-empty string");
    }
    
    const deletedInvoiceObj = await deleteInvoiceById(invoiceId)

    if (!deletedInvoiceObj) {
        throw new HttpError(404, "Invoice not found")
    }

    res.status(204).send();
}
