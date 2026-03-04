import * as path from 'path';
import * as fs from 'fs';
import libxml from 'libxmljs2';
import { HttpError } from '../../../errors/HttpError';

/**
 * Checks if a passed XML string is valid UBL syntax for an 'Order' or an 'Invoice'.
 * 
 * @param xmlString Request raw XML string
 * @param schemaType Can be 'Order' or 'Invoice'
 * 
 * @throws HttpError if malformed
 * @throws Error if UBL Schema not found
 * 
 * @returns true if successful.
 */
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
        // Removes long extensions from UBL types (deletes all chars inbetween open/close squiggly brackets '{blah}'...)
        const errors = xmlDoc.validationErrors.map(e => e.message.replace(/\s*\{[^}]*\}\s*/g, ""));
        throw new HttpError(400, `UBL XSD Validation Failed:\n${errors}`);
    }

    return true;
}