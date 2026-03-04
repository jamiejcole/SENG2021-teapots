import "dotenv/config";
import { connectDB } from "../db/mongo";
import { OrderModel } from "../models/order.model";
import { InvoiceModel } from "../models/invoice.model";
import { sha256 } from "../models/hash";
import { readFileSync } from "fs";
import path from "path";

async function main() {
  await connectDB();

  // Load sample order XML from your repo
  const orderXmlPath = path.join(__dirname, "../models/sample.xml");
  const orderXml = readFileSync(orderXmlPath, "utf8");

  const orderHash = sha256(orderXml);

  // Minimal “projection” fields (you can improve later by parsing XML properly)
  const orderDoc = await OrderModel.create({
    status: "received",
    ubl: {
      version: "2.4",
      documentType: "Order",
      orderId: "AEG012345",
      issueDate: "2005-06-20",
    },
    parties: {
      buyer: { name: "IYT Corporation" },
      seller: { name: "Consortial" },
    },
    totals: {
      payableAmount: { value: 100.0, currency: "GBP" },
    },
    validation: {
      xsd: { valid: true, errors: [] },
    },
    raw: {
      xml: orderXml,
      sha256: orderHash,
    },
  });

  const invoiceXml = `<?xml version="1.0" encoding="UTF-8"?><Invoice><!-- TODO generate real UBL invoice --></Invoice>`;
  const invoiceHash = sha256(invoiceXml);

  await InvoiceModel.create({
    status: "draft",
    profile: "anz-peppol-billing-3",
    orderId: orderDoc._id,
    ubl: {
      version: "2.4",
      documentType: "Invoice",
      invoiceId: `INV-${orderDoc.ubl?.orderId ?? "UNKNOWN"}`,
      issueDate: new Date().toISOString().slice(0, 10),
      currency: "GBP",
    },
    parties: {
      buyer: { name: "Consortial" },
      seller: { name: "IYT Corporation" },
    },
    totals: {
      payableAmount: { value: 100.0, currency: "GBP" },
    },
    validation: {
      xsd: { valid: false, errors: ["placeholder invoice XML"] },
    },
    raw: {
      xml: invoiceXml,
      sha256: invoiceHash,
    },
  });

  console.log("Seeded 1 order + 1 invoice");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});