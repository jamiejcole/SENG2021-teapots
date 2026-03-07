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

const OrderLineSchema = new Schema(
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

const OrderSchema = new Schema(
    {
        status: {
            type: String,
            enum: ["RECEIVED", "INVOICED", "REJECTED"],
            default: "RECEIVED",
            required: true,
            index: true,
        },

        orderId: {
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

        buyer: {
            type: PartySchema,
            required: true,
        },

        seller: {
            type: PartySchema,
            required: true,
        },

        lines: {
            type: [OrderLineSchema],
            required: true,
            validate: {
                validator: (lines: unknown[]) =>
                    Array.isArray(lines) && lines.length > 0,
                message: "At least one order line is required",
            },
        },

        customizationId: {
            type: String,
            trim: true,
        },

        profileId: {
            type: String,
            trim: true,
        },

        totals: {
            type: MoneySchema,
            required: true,
        },

        orderXml: {
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
        collection: "orders",
        timestamps: true,
    }
);

export type OrderDocument = InferSchemaType<typeof OrderSchema>;

export const OrderModel: Model<OrderDocument> =
    mongoose.models.Order ?? mongoose.model("Order", OrderSchema);