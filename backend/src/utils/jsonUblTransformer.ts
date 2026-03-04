import * as libxml from 'libxmljs2';

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
export function mapParty(parent: any, partyData: any) {
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