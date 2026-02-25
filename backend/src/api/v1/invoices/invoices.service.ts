import { validateCreateInvoice } from "./invoices.validation";
const { Invoice } = require("ubl-builder");

// Business logic layer
export async function createInvoice(input: any) {
    // validate input here
    const invoice = new Invoice('123456789', {});
    invoice.addProperty('xmlns', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
    invoice.addProperty('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');

    return invoice.getXml();
}