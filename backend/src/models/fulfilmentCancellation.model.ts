import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const FulfilmentCancellationSchema = new Schema(
    {
        fulfilmentCancellationId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        adviceId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        userId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        cancellationReason: {
            type: String,
            required: true,
            trim: true,
        },

        fulfilmentCancellationXml: {
            type: String,
            required: true,
        },

        executedAt: {
            type: String,
            required: true,
        },
    },
    {
        collection: "fulfilment_cancellations",
        timestamps: true,
    }
);

export type FulfilmentCancellationDocument = InferSchemaType<typeof FulfilmentCancellationSchema>;

export const FulfilmentCancellationModel: Model<FulfilmentCancellationDocument> =
    mongoose.models.FulfilmentCancellation ?? mongoose.model("FulfilmentCancellation", FulfilmentCancellationSchema);
