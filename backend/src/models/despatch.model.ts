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

const DespatchLineSchema = new Schema(
    {
        lineId: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0.000001 },
        unitCode: { type: String, trim: true },
    },
    { _id: false }
);

const DespatchSchema = new Schema(
    {
        despatchId: { type: String, required: true, unique: true, trim: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        orderId: { type: String, required: true, trim: true, index: true },

        despatchStatus: {
            type: String,
            enum: ["not_despatched", "despatched", "partially_despatched", "fulfilment_cancelled"],
            default: "despatched",
            index: true,
        },

        despatchDate: { type: String, required: true, trim: true },

        carrierName: { type: String, trim: true },
        trackingId: { type: String, trim: true },
        notes: { type: String, trim: true },

        supplierParty: { type: PartySchema, required: true },
        deliveryParty: { type: PartySchema, required: true },

        lines: {
            type: [DespatchLineSchema],
            required: true,
            validate: {
                validator: (lines: unknown[]) => Array.isArray(lines) && lines.length > 0,
                message: "At least one despatch line is required",
            },
        },

        despatchXml: { type: String },
    },
    {
        collection: "despatches",
        timestamps: true,
    }
);

export type DespatchDocument = InferSchemaType<typeof DespatchSchema>;

export const DespatchModel: Model<DespatchDocument> =
    mongoose.models.Despatch ?? mongoose.model("Despatch", DespatchSchema);
