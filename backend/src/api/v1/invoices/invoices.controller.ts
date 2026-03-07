import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL, validateCreateInvoiceRequest, generateInvoicePdf } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { OrderData } from "../../../types/order.types";
import { HttpError } from "../../../errors/HttpError";

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    validateCreateInvoiceRequest(req.body);
    const { orderXml, invoiceSupplement } = req.body;

    validateUBL(orderXml, "Order");

    const orderObj = (await service.createFullUblObject(orderXml)).data as OrderData;
    const invoiceXml = await service.convertJsonToUblInvoice(orderObj, invoiceSupplement);

    validateUBL(invoiceXml, 'Invoice');
    res.contentType("application/xml");
    res.status(201).send(invoiceXml);
});

export async function validateInvoice(req: Request, res: Response) {
    const { orderXml } = req.body;
        
    if (!orderXml || typeof orderXml !== 'string' || !orderXml.trim()) {
        throw new HttpError(400, "Request body must include 'orderXml' as a non-empty string");
    }
    
    res.contentType("application/json");

    validateUBL(orderXml, "Order");

    res.status(200).json({
        message: "UBL Order is valid!"
    });
}

export async function createPdf(req: Request, res: Response) {
    const invoiceXml = req.body;
    
    const doc = await generateInvoicePdf(invoiceXml);

    res.set("Content-Type", "application/pdf");
    res.status(201).send(doc);
}