import * as path from 'path';
import * as fs from 'fs';
import libxml from 'libxmljs2';
import { HttpError } from '../../../errors/HttpError';

export function validateUBL(xmlString: string, schemaType: 'Order' | 'Invoice') {
    if (typeof xmlString !== 'string' || !xmlString.trim().startsWith('<')) {
        throw new HttpError(400, "Malformed request, body must be a valid XML string.");
    }

    const schemaPath = path.join(__dirname, `../../../schemas/ubl2.4/xsd/maindoc/UBL-${schemaType}-2.4.xsd`);

    let xmlDoc;
    try {
        xmlDoc = libxml.parseXml(xmlString.trim());
    } catch (err: any) {
        throw new HttpError(400, `XML Syntax Error: ${err.message.replace(/\n/g, '').trim()}`)
    }

    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Internal Server Error: Schema not found at ${schemaPath}`);
    }
    
    const schemaSource = fs.readFileSync(schemaPath, 'utf8');
    const xsdDoc = libxml.parseXml(schemaSource, { baseUrl: schemaPath });

    const isValid = xmlDoc.validate(xsdDoc);

    if (!isValid) {
        const errors = xmlDoc.validationErrors.map(e => e.message).join(', ');
        throw new HttpError(400, `UBL XSD Validation Failed: ${errors}`);
    }

    return true;
}