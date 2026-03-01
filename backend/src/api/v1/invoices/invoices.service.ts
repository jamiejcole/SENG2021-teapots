import { validateCreateInvoice } from "./invoices.validation";
const { Invoice } = require("ubl-builder");
import { create } from "xmlbuilder2";

export async function createInvoiceObj(orderObj: any) {
    // TODO: Handle all UBL2.4 fields
    // const orderId = orderObj.Order?.cbc?.ID || "UNKNOWN_ORDER";

    // const lines = validateCreateInvoice(orderObj);
    // const invoiceObj = {
    //     Invoice: {
    //         "@xmlns": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    //         "@xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    //         "@xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    //         "cbc:ID": `INV-${orderObj.Order?.['cbc:id'] || 'UNKNOWN'}`,
    //         "cbc:IssueDate": new Date().toISOString().split("T")[0],
    //         "cac:AccountingSupplierParty": orderObj.Order?.['cac:sellersupplierparty'] || {},
    //         "cac:AccountingCustomerParty": orderObj.Order?.['cac:buyercustomerparty'] || {},
    //         "cac:LegalMonetaryTotal": {
    //             "cbc:PayableAmount": orderObj.Order?.['cac:anticipatedmonetarytotal']?.['cbc:payableamount'] || "0.00"
    //         },
    //         "cac:InvoiceLine": lines.map((line: any, idx: number) => ({
    //             "cbc:ID": idx + 1,
    //             "cbc:Note": line['cbc:note'],
    //             "cac:Item": line['cac:lineitem']
    //         }))
    //     }
    // };

    const xml = create({ version: "1.0", encoding: "UTF-8" })
        // .ele(invoiceObj)
        .end({ prettyPrint: true });

    return xml;
}