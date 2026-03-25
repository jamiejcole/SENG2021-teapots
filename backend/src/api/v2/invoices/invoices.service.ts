import * as libxml from 'libxmljs2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson } from '../../../utils/jsonUblTransformer';
import { InvoiceSupplement } from '../../../types/invoice.types';
import { InvoiceBuilder } from '../../../domain/InvoiceBuilder';
import mongoose from 'mongoose';
import { InvoiceModel } from '../../../models/invoice.model';
import { InvoicePdfModel } from '../../../models/invoicePdf.model';
import { sha256 } from '../../../models/hash';

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

/**
 * Finds the requested Invoice in the database and deletes invoice and returns deleted invoice document or null if not found or invalid ID.
 */
export async function deleteInvoiceById(invoiceId: string) {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return null;
    }

    const deletedInvoiceObj = await InvoiceModel.findByIdAndDelete(invoiceId);

    return deletedInvoiceObj;
}

function normalizeXml(xml: string): string {
    return xml.trim().replace(/\r\n/g, "\n");
}

export async function storeInvoicePdf(invoiceXml: string, pdfData: Buffer): Promise<string> {
    const invoiceHash = sha256(normalizeXml(invoiceXml));

    await InvoicePdfModel.findOneAndUpdate(
        { invoiceHash },
        {
            $set: {
                invoiceHash,
                contentType: "application/pdf",
                pdfData,
            },
        },
        { upsert: true, new: true }
    ).exec();

    return invoiceHash;
}

export async function findInvoicePdfByHash(invoiceHash: string) {
    const normalizedHash = invoiceHash.trim().toLowerCase();
    const isValidHash = /^[a-f0-9]{64}$/.test(normalizedHash);

    if (!isValidHash) {
        return null;
    }

    return InvoicePdfModel.findOne({ invoiceHash: normalizedHash }).exec();
}
