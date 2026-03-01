import * as path from 'path';
import * as fs from 'fs';
import libxml from 'libxmljs2';

export function validateUBL(xmlString: string, schemaType: 'Order' | 'Invoice') {
    const schemaPath = path.join(__dirname, `../../../schemas/ubl2.4/xsd/maindoc/UBL-${schemaType}-2.4.xsd`);
    const schemaSource = fs.readFileSync(schemaPath, 'utf8');
    
    const xsdDoc = libxml.parseXml(schemaSource, {
        baseUrl: schemaPath
    });
    const xmlDoc = libxml.parseXml(xmlString);

    const isValid = xmlDoc.validate(xsdDoc);

    if (!isValid) {
        const errors = xmlDoc.validationErrors.map(e => e.message).join(', ');
        throw new Error("XSD Validation Failed: " + errors);
    }

    return true;
}