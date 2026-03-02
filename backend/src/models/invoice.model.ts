import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const MoneySchema = new Schema(
    { value: { type: Number }, currency: { type: String } },
    { _id: false }
);

const PartySchema = new Schema(
    { name: { type: String }, ids: { type: [String], default: undefined } },
    { _id: false }
);

const InvoiceSchema = new Schema(
    {
        createdAt: { type: Date, default: () => new Date(), index: true },

        status: {
            type: String,
            enum: ["draft", "final", "void"],
            default: "draft",
            required: true,
            index: true,
        },

        profile: {
            type: String,
            enum: ["peppol-billing-3", "anz-peppol-billing-3"],
            default: "anz-peppol-billing-3",
            required: true,
            index: true,
        },

        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        ubl: {
            version: { type: String, default: "2.4" },
            documentType: { type: String, default: "Invoice" },
            invoiceId: { type: String, index: true },
            issueDate: { type: String},
            currency: { type: String},
        },

        parties: {
            supplier: { type: PartySchema },
            customer: { type: PartySchema },
        },

        totals: {
            payableAmount: { type: MoneySchema },
            taxTotal: { type: MoneySchema },
        },

        validation: {
            xsd: {
                valid: { type: Boolean, required: true },
                errors: { type: [String], default: [] },
            },
            schematron: {
                valid: { type: Boolean },
                errors: { type: [String], default: undefined },
            },
        },

        raw: {
            xml: { type: String, required: true },
            sha256: { type: String, required: true, unique: true },
        },
    },
    { collection: "invoices" }
);

export type InvoiceDocument = InferSchemaType<typeof InvoiceSchema>;
export const InvoiceModel: Model<InvoiceDocument> =
    mongoose.models.Invoice ?? mongoose.model("Invoice", InvoiceSchema);