import * as libxml from 'libxmljs2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson } from '../../../utils/jsonUblTransformer';
import { InvoiceSupplement } from '../../../types/invoice.types';
import { InvoiceBuilder } from '../../../domain/InvoiceBuilder';

/**
 * Returns a JSON obj based on a UBL XML String.
 */
export async function createFullUblObject(orderXml: string) {
    const xmlDoc = libxml.parseXml(orderXml.trim());
    const root = xmlDoc.root() as libxml.Element;

    if (!root) throw new Error("Invalid XML: No root element found.");

    return {
        rootName: root.name(),
        data: mapElementToJson(root)
    };
}

/**
 * Converts parsed order data and invoice supplement into a UBL 2.1 Invoice XML string.
 */
export function convertJsonToUblInvoice(orderData: OrderData, invoiceSupplement: InvoiceSupplement): string {
    return new InvoiceBuilder(orderData, invoiceSupplement)
        .addHeader()
        .addOrderReference()
        .addParties()
        .addPaymentMeans()
        .addPaymentTerms()
        .addTaxTotal()
        .addLegalMonetaryTotal()
        .addInvoiceLines()
        .build();
}

