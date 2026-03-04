import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { OrderData } from "../../../types/order.types";
import InvoiceSupplement from "../../../types/invoice.types";

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    const orderObj = (await service.createFullUblObject(orderXML)).data as OrderData;
    
    const invSup: InvoiceSupplement = {
        invoiceNumber: "123",
        issueDate: "2026-01-01",
        dueDate: "2026-01-01",
        currencyCode: "AUD",
        taxRate: 0.69,
        taxScheme: {
            id: "GST",
            taxTypeCode: "GST"
        },
        paymentMeans: {
            code: "30",
            payeeFinancialAccount: {
                id: "123",
                name: "Joe Mama",
                branchId: "6969"
            }
        },
        customizationId: "urn:www.cenbii.eu:transaction:biicoretrdm001:ver1.0",
        profileId: "urn:www.cenbii.eu:profile:BII01:ver1.0"
    }
    const invoiceXml = await service.convertJsonToUblInvoice(orderObj, invSup);

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