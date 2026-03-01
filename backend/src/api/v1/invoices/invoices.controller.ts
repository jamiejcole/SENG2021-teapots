import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL } from "./invoices.validation";

export async function createInvoice(req: Request, res: Response) {
    try {
        const orderXML: string = req.body;

        validateUBL(orderXML, "Order");

        const invoiceXml = await service.createInvoiceObj(orderXML);

        res.set("Content-Type", "application/xml");
        res.status(201).send(invoiceXml);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: err.message || "Unexpected server error",
        });
    }
}

export async function validateInvoice(req: Request, res: Response) {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    res.status(200).json({
        message: "UBL Order is valid!"
    });
}