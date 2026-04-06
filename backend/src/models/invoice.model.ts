import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const AddressSchema = new Schema(
    {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const PartySchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        id: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        address: { type: AddressSchema, required: true },
    },
    { _id: false }
);

const InvoiceLineSchema = new Schema(
    {
        lineId: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0.000001 },
        unitCode: { type: String, trim: true },
        unitPrice: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const MoneySchema = new Schema(
    {
        subTotal: { type: Number, required: true, min: 0 },
        taxTotal: { type: Number, required: true, min: 0 },
        payableAmount: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const ActivityEntrySchema = new Schema(
    {
        at: { type: Date, default: () => new Date() },
        type: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        meta: { type: Schema.Types.Mixed },
    },
    { _id: false }
);

const InvoiceSchema = new Schema(
    {
        /** Ownership for multi-tenant list/dashboard (optional for legacy rows). */
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null,
        },

        /**
         * Business lifecycle for dashboard and email workflow.
         * Extends legacy `status` (GENERATED/UPDATED) which reflects XML regeneration.
         */
        lifecycleStatus: {
            type: String,
            enum: ["DRAFT", "SAVED", "VALIDATED", "SENT", "SEND_FAILED", "PAID", "OVERDUE"],
            default: "SAVED",
            index: true,
        },

        activity: {
            type: [ActivityEntrySchema],
            default: [],
        },

        sentTo: { type: String, trim: true, lowercase: true },
        sentAt: { type: Date },
        lastError: { type: String, trim: true },
        /** SHA-256 of normalized invoice XML when PDF was stored via /invoices/pdf */
        pdfInvoiceHash: { type: String, trim: true, lowercase: true },

        status: {
            type: String,
            enum: ["GENERATED", "UPDATED"],
            default: "GENERATED",
            required: true,
            index: true,
        },

        invoiceId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },

        issueDate: {
            type: String,
            required: true,
            trim: true,
        },

        currency: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        seller: {
            type: PartySchema,
            required: true,
        },

        buyer: {
            type: PartySchema,
            required: true,
        },

        lines: {
            type: [InvoiceLineSchema],
            required: true,
            validate: {
                validator: (lines: unknown[]) =>
                    Array.isArray(lines) && lines.length > 0,
                message: "At least one invoice line is required",
            },
        },

        orderReference: {
            orderId: { type: String, trim: true },
        },

        despatchReference: {
            despatchId: { type: String, trim: true },
        },

        paymentTerms: {
            type: String,
            trim: true,
        },

        totals: {
            type: MoneySchema,
            required: true,
        },

        invoiceXml: {
            type: String,
            required: true,
        },

        xmlSha256: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    {
        collection: "invoices",
        timestamps: true,
    }
);

export type InvoiceDocument = InferSchemaType<typeof InvoiceSchema>;

export const InvoiceModel: Model<InvoiceDocument> =
    mongoose.models.Invoice ?? mongoose.model("Invoice", InvoiceSchema);