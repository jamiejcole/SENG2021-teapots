import { Request, Response, NextFunction } from "express";
import * as service from "./invoices.service";
import { validateCreateInvoice } from "./invoices.validation";

export async function createInvoice(req: Request, res: Response) {
    try {
        const orderObj = req.body;
        validateCreateInvoice(orderObj);

        const invoiceXml = await service.createInvoiceObj(orderObj);

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