import { Request, Response, NextFunction } from "express";
import * as service from "./invoices.service";

export async function createInvoice(req: Request, res: Response) {
    try {
        const xmlString = await service.createInvoice(req.body);
        res.set("Content-Type", "application/xml");
        res.status(201).send(xmlString);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: "Unexpected server error",
        });
    }
}