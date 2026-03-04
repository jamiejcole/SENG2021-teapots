import * as libxml from 'libxmljs2';
import { create } from 'xmlbuilder2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson, mapParty } from '../../../utils/jsonUblTransformer';
import InvoiceSupplement from '../../../types/invoice.types';

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

export function convertJsonToUblInvoice(orderData: OrderData, invoiceSupplement: InvoiceSupplement) {
    /**
     * ## TODO ##
     * Parties:
     * - handle PartyTaxScheme
     * 
     * General:
     * - handle DueDate
     * - handle IssueDate
     * - handle PaymentMeans
     * - handle AllowanceCharge - LOW
     * - handle TaxTotal
     * - handle LegalMonetaryTotal
     * 
     * InvoiceLines:
     * - handle OrderLineReference
     * - handle ClassifiedTaxCategory in Item - DONE???
     * 
     */

    // Get the currency code to use for the Invoice. Priority is ordered as follows:
    // 1. Order Document's `DocumentCurrencyCode` value
    // 2. invoiceSupplement's provided currencyCode
    // 3. fallback to AUD.
    const effectiveCurrency = invoiceSupplement.currencyCode
        || (orderData.DocumentCurrencyCode as string)
        || 'AUD';

    const invoice = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('Invoice', {
            'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
            'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
        });

    const issueDate = invoiceSupplement.issueDate ?? new Date().toISOString().split('T')[0];

    // Define Header Info
    invoice.ele('cbc:UBLVersionID').txt('2.1').up()
           .ele('cbc:CustomizationID').txt('urn:oasis:names:specification:ubl:xpath:Invoice-2.1').up()
           .ele('cbc:ID').txt(`INV-${invoiceSupplement.invoiceNumber ?? Date.now()}`).up()
           .ele('cbc:IssueDate').txt(issueDate).up()
           .ele('cbc:InvoiceTypeCode').txt('380').up()
           .ele('cbc:DocumentCurrencyCode').txt(effectiveCurrency).up();

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
        const item = line.LineItem;
        const lineExtensionAmount = item.LineExtensionAmount?.value || item.LineExtensionAmount || '0';
        const iLine = invoice.ele('cac:InvoiceLine');
        
        iLine.ele('cbc:ID').txt(item.ID).up();

        iLine.ele('cbc:InvoicedQuantity', {
            unitCode: item.Quantity?.['@unitCode'] || 'EA'
        }).txt(item.Quantity?.value || item.Quantity).up();

        iLine.ele('cbc:LineExtensionAmount', {
            currencyID: effectiveCurrency
        }).txt(lineExtensionAmount).up(); // TODO: Handle 0.00
        
        const cacItem = iLine.ele('cac:Item');
        cacItem.ele('cbc:Name').txt(item.Item?.Name).up();

        cacItem.ele('cac:ClassifiedTaxCategory')
            .ele('cbc:ID').txt('S').up() // TODO: Handle other tax codes https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL5305/
            .ele('cbc:Percent').txt((invoiceSupplement.taxRate * 100).toString()).up()
            .ele('cac:TaxScheme')
                .ele('cbc:ID').txt(invoiceSupplement.taxScheme.id).up()
            .up()
        .up();
        cacItem.up();

        iLine.ele('cac:Price')
            .ele('cbc:PriceAmount', {currencyID: effectiveCurrency })
            .txt(item.Price?.PriceAmount?.value || '0.00') // TODO: Handle 0.00
            .up() 
            .up();
        
        iLine.up();
    });

    return invoice.end({ prettyPrint: true });
}

