import * as libxml from 'libxmljs2';
import { create } from 'xmlbuilder2';
import { OrderData } from '../../../types/order.types';

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
 * Recursively convert a XML Element to a JSON obj.
 */
function mapElementToJson(element: libxml.Element): any {
    const obj: any = {};

    element.attrs().forEach(attr => {
        obj[`@${attr.name()}`] = attr.value();
    });

    const children = element.childNodes().filter(node => node.type() === 'element') as libxml.Element[];
    if (children.length === 0) {
        const text = element.text().trim();
        return Object.keys(obj).length > 0 ? { ...obj, value: text } : text;
    }

    children.forEach(child => {
        const name = child.name();
        const value = mapElementToJson(child);

        if (obj[name]) {
            if (!Array.isArray(obj[name])) {
                obj[name] = [obj[name]];
            }
            obj[name].push(value);
        } else {
            obj[name] = value;
        }
    });

    return obj;
}

export function convertJsonToUblInvoice(orderData: OrderData) {
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
        iLine.ele('cbc:InvoicedQuantity', { unitCode: item.Quantity?.['@unitCode'] || 'EA' }).txt(item.Quantity?.value || item.Quantity).up();
        iLine.ele('cbc:LineExtensionAmount', { currencyID: 'USD' }).txt(item.LineExtensionAmount?.value || '0.00').up();
        
        const cacItem = iLine.ele('cac:Item');
        cacItem.ele('cbc:Name').txt(item.Item?.Name).up();
        cacItem.up();

        iLine.ele('cac:Price')
            .ele('cbc:PriceAmount', { currencyID: 'USD' }).txt(item.Price?.PriceAmount?.value || '0.00').up()
        .up();
        
        iLine.up();
    });

    return invoice.end({ prettyPrint: true });
}

/**
 * Helper to map Party details
 */
function mapParty(parent: any, partyData: any) {
    if (!partyData) return;
    const party = parent.ele('cac:Party');
    autoMapUbl(party, partyData);
    party.up();
}

/**
 * Recursively builds UBL XML from a mapped JSON object
 */
function autoMapUbl(parent: any, data: any) {
    if (typeof data !== 'object' || data === null) return;

    for (const [key, value] of Object.entries(data)) {
        if (key === 'value' || key.startsWith('@')) continue;

        const isAggregate = typeof value === 'object' && value !== null;
        const prefix = isAggregate ? 'cac' : 'cbc';
        const tagName = `${prefix}:${key}`;

        const instances = Array.isArray(value) ? value : [value];

        instances.forEach((item) => {
            // Get attributes for this specific instance
            const attrs: any = {};
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(k => {
                    if (k.startsWith('@')) attrs[k.substring(1)] = item[k];
                });
            }

            const node = parent.ele(tagName, attrs);

            if (typeof item === 'object' && item !== null) {
                if ('value' in item) {
                    node.txt(item.value);
                } else {
                    autoMapUbl(node, item);
                }
            } else {
                node.txt(String(item));
            }
            node.up();
        });
    }
}