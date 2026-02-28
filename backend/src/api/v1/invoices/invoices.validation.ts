// TODO: Handle proper validation
import * as path from 'path';
import * as fs from 'fs';
const { Schema } = require('node-schematron');

export function validateCreateInvoice(orderObj: any) {
    const schemaPath = path.join(__dirname, '../../../utils/ubl_validation.xml');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schema = Schema.fromString(schemaContent);

    const results = schema.validateString(
	`<xml foo="err">
	<thunder foo="bar" />
</xml>`,
	{ debug: true }
);

    console.log(results, "\n\n");

    let lines = orderObj.order?.['cac:orderline'];
    if (!lines) {
        throw new Error("At least one order line is required to generate invoice");
    }

    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    if (lines.length === 0) {
        throw new Error("At least one order line is required to generate invoice");
    }

    return lines;
}
