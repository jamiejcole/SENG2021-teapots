import * as path from 'path';
import * as fs from 'fs';
import libxml from 'libxmljs2';
import { HttpError } from '../../../errors/HttpError';
import { InvoiceSupplement } from '../../../types/invoice.types';

/**
 * Validates createInvoiceRequest data prior to execution
 * 
 * @param body Request body object
 * @throws HttpError 400 if validation fails
 */
export function validateCreateInvoiceRequest(body: any): asserts body is { orderXml: string; invoiceSupplement: InvoiceSupplement } {
    if (!body || typeof body !== 'object') {
        throw new HttpError(400, "Request body must be a JSON object");
    }

    // Validate orderXml
    if (!('orderXml' in body)) {
        throw new HttpError(400, "Request body is missing required field 'orderXml'");
    }
    if (typeof body.orderXml !== 'string') {
        throw new HttpError(400, "'orderXml' must be a string");
    }
    if (!body.orderXml.trim()) {
        throw new HttpError(400, "'orderXml' cannot be empty");
    }

    if (!('invoiceSupplement' in body)) {
        throw new HttpError(400, "Request body is missing required field 'invoiceSupplement'");
    }
    if (typeof body.invoiceSupplement !== 'object' || body.invoiceSupplement === null) {
        throw new HttpError(400, "'invoiceSupplement' must be an object");
    }

    const supplement = body.invoiceSupplement;

    const requiredFields = ['currencyCode', 'taxRate', 'taxScheme', 'paymentMeans'];
    for (const field of requiredFields) {
        if (!(field in supplement)) {
            throw new HttpError(400, `invoiceSupplement is missing required field '${field}'`);
        }
    }

    if (typeof supplement.currencyCode !== 'string') {
        throw new HttpError(400, "invoiceSupplement.currencyCode must be a string");
    }
    if (typeof supplement.taxRate !== 'number') {
        throw new HttpError(400, "invoiceSupplement.taxRate must be a number");
    }
    if (typeof supplement.taxScheme !== 'object' || supplement.taxScheme === null) {
        throw new HttpError(400, "invoiceSupplement.taxScheme must be an object");
    }
    if (typeof supplement.paymentMeans !== 'object' || supplement.paymentMeans === null) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans must be an object");
    }

    if (!('id' in supplement.taxScheme)) {
        throw new HttpError(400, "invoiceSupplement.taxScheme is missing required field 'id'");
    }
    if (!('taxTypeCode' in supplement.taxScheme)) {
        throw new HttpError(400, "invoiceSupplement.taxScheme is missing required field 'taxTypeCode'");
    }

    if (!('code' in supplement.paymentMeans)) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans is missing required field 'code'");
    }
    if (!('payeeFinancialAccount' in supplement.paymentMeans)) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans is missing required field 'payeeFinancialAccount'");
    }

    const account = supplement.paymentMeans.payeeFinancialAccount;
    if (typeof account !== 'object' || account === null) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans.payeeFinancialAccount must be an object");
    }
    if (!('id' in account)) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans.payeeFinancialAccount is missing required field 'id'");
    }
    if (!('name' in account)) {
        throw new HttpError(400, "invoiceSupplement.paymentMeans.payeeFinancialAccount is missing required field 'name'");
    }
}

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

import { existsSync } from 'node:fs';
// @ts-expect-error no-types-for-this-file
import SaxonJS from 'saxon-js';
import puppeteer from 'puppeteer';

const PDF_RENDER_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

function getChromeExecutablePath() {
    const candidatePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_PATH,
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
    ];

    try {
        candidatePaths.push(puppeteer.executablePath());
    } catch {
        // Ignore Puppeteer cache lookup failures here and fall through to the explicit error below.
    }

    const availableCandidates = candidatePaths.filter((candidate): candidate is string => Boolean(candidate));

    const executablePath = availableCandidates.find((candidatePath) => existsSync(candidatePath));

    if (!executablePath) {
        throw new Error(
            'Could not find Chrome executable. Run `npm run install:chrome` locally or set PUPPETEER_EXECUTABLE_PATH to a valid browser binary.'
        );
    }

    return executablePath;
}

export async function generateInvoicePdf(xmlString: string): Promise<Buffer> {
    const sefPath = path.join(__dirname, '../../../schemas/ubl2.4/xslt/s4.sef.json');

    console.log('[invoice-pdf] Starting PDF generation');
    const result = SaxonJS.transform({
        stylesheetLocation: sefPath,
        sourceText: xmlString,
        destination: "serialized"
    }, "sync");

    const htmlResult = result.principalResult;

    const browser = await withTimeout(
        puppeteer.launch({
            headless: true,
            executablePath: getChromeExecutablePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        }),
        PDF_RENDER_TIMEOUT_MS,
        'Puppeteer launch'
    );

    try {
        console.log('[invoice-pdf] Browser launched');
        const page = await withTimeout(browser.newPage(), PDF_RENDER_TIMEOUT_MS, 'Puppeteer newPage');
        console.log('[invoice-pdf] Page created');

        await withTimeout(
            page.setContent(htmlResult, { waitUntil: 'domcontentloaded' }),
            PDF_RENDER_TIMEOUT_MS,
            'Puppeteer setContent'
        );
        console.log('[invoice-pdf] HTML loaded');

        const pdfBuffer = await withTimeout(
            page.pdf({ format: 'A4', printBackground: true }),
            PDF_RENDER_TIMEOUT_MS,
            'Puppeteer pdf generation'
        );
        console.log('[invoice-pdf] PDF generated');

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close().catch((error) => {
            console.error('[invoice-pdf] Failed to close browser cleanly:', error);
        });
    }
}
