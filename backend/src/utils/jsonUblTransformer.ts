import * as libxml from 'libxmljs2';
import { DEFAULT_PARTY_TAX_SCHEME } from '../types/invoice.types';
import { PartyTaxScheme } from '../types/invoice.types';

/**
 * Recursively convert a XML Element to a JSON obj.
 */
export function mapElementToJson(element: libxml.Element): any {
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

/**
 * Helper to map Party details
 */
export function mapParty(parent: any, partyData: any, taxSchemeOverride?: PartyTaxScheme) {
    if (!partyData) return;
    
    const party = parent.ele('cac:Party');

    const earlyKeys = ['EndpointID', 'PartyIdentification', 'PartyName', 'PostalAddress', 'PhysicalLocation'];
    const earlyData = Object.fromEntries(
        Object.entries(partyData).filter(([key]) => earlyKeys.includes(key))
    );
    autoMapUbl(party, earlyData);

    const endpointId = partyData.EndpointID?.value || partyData.EndpointID;
    const companyId = taxSchemeOverride?.companyId ?? endpointId;
    const taxSchemeId = taxSchemeOverride?.taxSchemeId ?? DEFAULT_PARTY_TAX_SCHEME.taxSchemeId;

    if (companyId) {
        const pts = party.ele('cac:PartyTaxScheme');
        pts.ele('cbc:CompanyID').txt(companyId).up();
        pts.ele('cac:TaxScheme')
           .ele('cbc:ID').txt(taxSchemeId).up()
        .up();
        pts.up();
    }

    const lateKeys = ['PartyLegalEntity', 'Contact', 'Person'];
    const lateData = Object.fromEntries(
        Object.entries(partyData).filter(([key]) => lateKeys.includes(key))
    );
    autoMapUbl(party, lateData);

    party.up();
}

/**
 * Recursively builds UBL XML from a mapped JSON object
 */
function autoMapUbl(parent: any, data: any) {
    if (typeof data !== 'object' || data === null) return;

    for (const [key, value] of Object.entries(data)) {
        if (key === 'value' || key.startsWith('@')) continue;

        const isCbc = typeof value !== 'object' || (value !== null && 'value' in (value as any));
        const prefix = isCbc ? 'cbc' : 'cac';
        const tagName = `${prefix}:${key}`;

        const instances = Array.isArray(value) ? value : [value];

        instances.forEach((item) => {
            const attrs: any = {};
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(k => {
                    if (k.startsWith('@')) attrs[k.substring(1)] = item[k];
                });
            }

            const node = parent.ele(tagName, attrs);

            if (typeof item === 'object' && item !== null) {
                if ('value' in item) {
                    node.txt(String(item.value));
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