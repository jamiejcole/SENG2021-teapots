import * as libxml from 'libxmljs2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson } from '../../../utils/jsonUblTransformer';
import { InvoiceSupplement } from '../../../types/invoice.types';
import { InvoiceBuilder } from '../../../domain/InvoiceBuilder';
import mongoose from 'mongoose';
import { InvoiceModel } from '../../../models/invoice.model';

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

/**
 * Finds the requested Invoice in the database and returns it.
 */
export async function getInvoiceById(invoiceId: string) {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return null;
    }

    const fetchedInvoiceObj = await InvoiceModel.findById(invoiceId);

    return fetchedInvoiceObj;
}

/**
 * Retrieves all Invoices in the database.
 */
export async function getAllInvoices() {
    const fetchedInvoices = await InvoiceModel.find();

    return fetchedInvoices;
}

export async function updateInvoiceById(
    invoiceId: string,
    orderXml: string,
    orderObj: OrderData,
    invoiceXml: string,
    invoiceSupplement: InvoiceSupplement
) {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return null;
    }

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        invoiceId,
        {
            orderXml,
            orderObj,
            invoiceXml,
            invoiceSupplement
        },
        { new: true }
    );

    return updatedInvoice;
}