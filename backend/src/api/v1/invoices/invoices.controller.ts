import { Request, Response } from "express";
import * as service from "./invoices.service";
import { validateUBL } from "./invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { OrderData } from "../../../types/order.types";
import { InvoiceSupplement } from "../../../types/invoice.types";

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    const orderObj = (await service.createFullUblObject(orderXML)).data as OrderData;
    
    const invSup: InvoiceSupplement = {
        invoiceNumber: "123",
        issueDate: "2026-01-01",
        dueDate: "2026-01-01",
        currencyCode: "AUD",
        taxRate: 0.1,
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
        paymentTerms: {
            note: "30 days omg"
        }
    }
    const invoiceXml = await service.convertJsonToUblInvoice(orderObj, invSup);
    

    // res.set("Content-Type", "application/xml");
    res.status(201).send(invoiceXml);

    const val = validateUBL(invoiceXml, 'Invoice');
    console.log(`* GENERATED UBL INVOICE VALIDATION STATUS: ${val}`);
});

export async function validateInvoice(req: Request, res: Response) {
    const orderXML: string = req.body;
    validateUBL(orderXML, "Order");

    res.status(200).json({
        message: "UBL Order is valid!"
    });
}