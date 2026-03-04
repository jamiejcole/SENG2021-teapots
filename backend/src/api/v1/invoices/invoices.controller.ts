import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    const orderObj = (await service.createFullUblObject(orderXML)).data;
    const invoiceXml = await service.convertJsonToUblInvoice(orderObj);

    // res.set("Content-Type", "application/xml");
    res.status(201).send(invoiceXml);
});

export async function validateInvoice(req: Request, res: Response) {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    res.status(200).json({
        message: "UBL Order is valid!"
    });
}