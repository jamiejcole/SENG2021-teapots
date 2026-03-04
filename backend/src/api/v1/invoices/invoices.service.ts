import * as libxml from 'libxmljs2';
import { create } from 'xmlbuilder2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson, mapParty } from '../../../utils/jsonUblTransformer';

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

export function convertJsonToUblInvoice(orderData: OrderData) {
    /**
     * ## TODO ##
     * Parties:
     * - handle PartyTaxScheme
     * 
     * General:
     * - handle DueDate
     * - handle PaymentMeans
     * - handle AllowanceCharge
     * - handle TaxTotal
     * - handle LegalMonetaryTotal
     * 
     * InvoiceLines:
     * - handle OrderLineReference
     * - handle ClassifiedTaxCategory in Item
     * 
     */

    const invoice = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('Invoice', {
            'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
            'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
        });

    // Define Header Info
    invoice.ele('cbc:UBLVersionID').txt('2.1').up()
           .ele('cbc:CustomizationID').txt('urn:oasis:names:specification:ubl:xpath:Invoice-2.1').up()
           .ele('cbc:ID').txt(`INV-${Date.now()}`).up()
           .ele('cbc:IssueDate').txt(new Date().toISOString().split('T')[0]).up()
           .ele('cbc:InvoiceTypeCode').txt('380').up()
           .ele('cbc:DocumentCurrencyCode').txt((orderData.DocumentCurrencyCode as string) || 'USD').up();

    // Link to order ID
    if (orderData.ID) {
        invoice.ele('cac:OrderReference')
            .ele('cbc:ID').txt(orderData.ID as string).up()
        .up();
    }

    // Map Parties
    // SellerSupplierParty -> AccountingSupplierParty
    // BuyerCustomerParty -> AcountingCustomerParty
    mapParty(invoice.ele('cac:AccountingSupplierParty'), orderData.SellerSupplierParty?.Party);
    mapParty(invoice.ele('cac:AccountingCustomerParty'), orderData.BuyerCustomerParty?.Party);

    // Map OrderLines to InvoiceLines
    const orderLines = Array.isArray(orderData.OrderLine) ? orderData.OrderLine : [orderData.OrderLine];
    
    orderLines.forEach((line: any) => {
        console.log(orderLines);
        const item = line.LineItem;
        const iLine = invoice.ele('cac:InvoiceLine');
        
        iLine.ele('cbc:ID').txt(item.ID).up();

        iLine.ele('cbc:InvoicedQuantity', {
            unitCode: item.Quantity?.['@unitCode'] || 'EA'
        }).txt(item.Quantity?.value || item.Quantity).up();

        iLine.ele('cbc:LineExtensionAmount', {
            currencyID: item.LineExtensionAmount?.['@currencyID'] || 'AUD'
        }).txt(item.LineExtensionAmount?.value || '0.00').up(); // TODO: Handle 0.00
        
        const cacItem = iLine.ele('cac:Item');
        cacItem.ele('cbc:Name').txt(item.Item?.Name).up();
        cacItem.up();

        iLine.ele('cac:Price')
            .ele('cbc:PriceAmount', {currencyID: item.Price?.PriceAmount?.['@currencyID'] || 'AUD' })
            .txt(item.Price?.PriceAmount?.value || '0.00') // TODO: Handle 0.00
            .up() 
            .up();
        
        iLine.up();
    });

    return invoice.end({ prettyPrint: true });
}

