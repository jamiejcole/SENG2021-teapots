import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import libxml from "libxmljs2";
import { HttpError } from "../../../errors/HttpError";

const DOCUMENT_TYPE_TO_SCHEMA: Record<string, string> = {
    order: "UBL-Order-2.4.xsd",
    receipt: "UBL-ReceiptAdvice-2.4.xsd",
    despatch: "UBL-DespatchAdvice-2.4.xsd",
    "order-cancel": "UBL-OrderCancellation-2.4.xsd",
    "order-change": "UBL-OrderChange-2.4.xsd",
    "fulfilment-cancel": "UBL-FulfilmentCancellation-2.4.xsd",
};

export async function validateDocument(req: Request, res: Response) {
    const documentType = req.params["document-type"] as string;
    const xmlBody = req.body;

    if (!documentType || !DOCUMENT_TYPE_TO_SCHEMA[documentType]) {
        throw new HttpError(
            400,
            `Invalid document type '${documentType}'. Must be one of: ${Object.keys(DOCUMENT_TYPE_TO_SCHEMA).join(", ")}`
        );
    }

    if (!xmlBody || typeof xmlBody !== "string" || !xmlBody.trim()) {
        throw new HttpError(400, "Request body must be a non-empty XML string");
    }

    const executedAt = Math.floor(Date.now() / 1000);
    const schemaFileName = DOCUMENT_TYPE_TO_SCHEMA[documentType];
    const schemaPath = path.join(__dirname, `../../../schemas/ubl2.4/xsd/maindoc/${schemaFileName}`);

    let xmlDoc;
    try {
        xmlDoc = libxml.parseXml(xmlBody.trim());
    } catch (err: any) {
        const errorMessage = err.message?.replace(/\n/g, "").trim() ?? "XML parse error";
        return res.status(200).json({
            valid: false,
            errors: [`XML Syntax Error: ${errorMessage}`],
            "executed-at": executedAt,
        });
    }

    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Internal Server Error: Schema not found at ${schemaPath}`);
    }

    const schemaSource = fs.readFileSync(schemaPath, "utf8");
    const xsdDoc = libxml.parseXml(schemaSource, { baseUrl: schemaPath });
    const isValid = xmlDoc.validate(xsdDoc);

    if (!isValid) {
        const errors = xmlDoc.validationErrors.map((e) =>
            e.message.replace(/\s*\{[^}]*\}\s*/g, "")
        );
        return res.status(200).json({
            valid: false,
            errors,
            "executed-at": executedAt,
        });
    }

    return res.status(200).json({
        valid: true,
        errors: [],
        "executed-at": executedAt,
    });
}
