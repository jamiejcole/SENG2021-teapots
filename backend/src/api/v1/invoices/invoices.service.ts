import * as libxml from 'libxmljs2';
import { create } from 'xmlbuilder2';

export async function createInvoiceObj(orderXml: string) {
    if (!orderXml || typeof orderXml !== 'string') {
        throw new Error('Invalid order XML provided to createInvoiceObj');
    }

    const xmlDoc = libxml.parseXml(orderXml.trim());
    const orderNode = xmlDoc.get("/*[local-name() = 'Order']") as libxml.Element;
    
    if (!orderNode) {
        throw new Error('Provided XML does not contain a top-level Order element');
    }

    const idNode = orderNode.get(".//*[local-name() = 'ID']") as libxml.Element;
    const orderId = idNode ? idNode.text() : `UNKNOWN-ORD`;

    const buyerNameNode = orderNode.get(".//*[local-name() = 'BuyerCustomerParty']//*[local-name() = 'Name']") as libxml.Element;
    const buyerName = buyerNameNode ? buyerNameNode.text() : 'Default Buyer';

    const sellerNameNode = orderNode.get(".//*[local-name() = 'SellerSupplierParty']//*[local-name() = 'Name']") as libxml.Element;
    const sellerName = sellerNameNode ? sellerNameNode.text() : 'Default Seller';

    const invoiceId = `INV-${Date.now()}`;
    const issueDate = new Date().toISOString().split('T')[0];

    console.log(`
        orderId: ${orderId},
        buyerName: ${buyerName},
        sellerName: ${sellerName},
        invoiceId: ${invoiceId},
        issueDate: ${issueDate}
        `);
    throw new Error('bruh');

    const sellerNode = orderNode.doc().get(".//*[local-name() = 'SellerSupplierParty']") || orderNode.doc().get(".//*[local-name() = 'SellerParty']") || orderNode.doc().get(".//*[local-name() = 'Seller']");
    const buyerNode = orderNode.doc().get(".//*[local-name() = 'BuyerCustomerParty']") || orderNode.doc().get(".//*[local-name() = 'BuyerParty']") || orderNode.doc().get(".//*[local-name() = 'Buyer']");

    const sellerXml = sellerNode ? sellerNode.toString() : '';
    const buyerXml = buyerNode ? buyerNode.toString() : '';

    const payableNode = xmlDoc.get("//*[local-name() = 'PayableAmount']");
    const payableAmount = payableNode ? payableNode.toString() : '0.00';

    const orderLineNodes = orderNode.doc().find(".//*[local-name() = 'OrderLine']");
    const linesXml = orderLineNodes.map((ln: any, idx: number) => {
        const lineId = ln.get("*[local-name() = 'ID']")?.text() || `${idx + 1}`;
        const note = ln.get("*[local-name() = 'Note']")?.text() || '';
        const lineItemNode = ln.get(".//*[local-name() = 'LineItem']") || ln.get(".//*[local-name() = 'LineItem']");
        const lineItemXml = lineItemNode ? lineItemNode.toString() : '';

        return `<cac:InvoiceLine>
            <cbc:ID>${escapeXml(lineId)}</cbc:ID>
            ${note ? `<cbc:Note>${escapeXml(note)}</cbc:Note>` : ''}
            ${lineItemXml}
            </cac:InvoiceLine>`;
            }).join('\n');

    const invoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
    <cbc:ID>${escapeXml(invoiceId)}</cbc:ID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    ${sellerXml ? `<cac:AccountingSupplierParty>${sellerXml}</cac:AccountingSupplierParty>` : ''}
    ${buyerXml ? `<cac:AccountingCustomerParty>${buyerXml}</cac:AccountingCustomerParty>` : ''}
    <cac:LegalMonetaryTotal>
        <cbc:PayableAmount>${escapeXml(payableAmount)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    ${linesXml}
    </Invoice>`;

    const pretty = create(invoiceXml).end({ prettyPrint: true });
    return pretty;
}

function escapeXml(str: string) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // eslint-disable-next-line no-useless-escape
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&apos;');
}