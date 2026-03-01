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