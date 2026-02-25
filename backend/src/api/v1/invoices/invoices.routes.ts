import { Router } from "express";
const { Invoice } = require("ubl-builder");

const router = Router();

router.get("/", (req, res) => {
    const invoice = new Invoice('123456789', {});
    invoice.addProperty('xmlns', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
    invoice.addProperty('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');

    res.set('Content-Type', 'text/xml');
    res.send(invoice.getXml());
});

export default router;