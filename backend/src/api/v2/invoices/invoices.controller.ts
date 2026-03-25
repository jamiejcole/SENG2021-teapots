import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL, validateCreateInvoiceRequest, generateInvoicePdf } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { OrderData } from "../../../types/order.types";
import { HttpError } from "../../../errors/HttpError";
import { deleteInvoiceById } from "./invoices.service";
import { persistInvoiceRequest } from "../../../db/persistInvoiceRequest";


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
    
    const doc = await generateInvoicePdf(invoiceXml);

    res.set("Content-Type", "application/pdf");
    res.status(201).send(doc);
}
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
