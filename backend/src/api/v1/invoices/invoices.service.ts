import * as libxml from 'libxmljs2';

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
