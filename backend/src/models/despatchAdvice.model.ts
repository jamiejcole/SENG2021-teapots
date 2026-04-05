import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const DespatchAdviceSchema = new Schema(
    {
        adviceId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        userId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        despatchAdviceXml: {
            type: String,
            required: true,
        },

        orderXml: {
            type: String,
            required: true,
        },

        executedAt: {
            type: Number,
            required: true,
        },
    },
    {
        collection: "despatch_advices",
        timestamps: true,
    }
);

export type DespatchAdviceDocument = InferSchemaType<typeof DespatchAdviceSchema>;

export const DespatchAdviceModel: Model<DespatchAdviceDocument> =
    mongoose.models.DespatchAdvice ?? mongoose.model("DespatchAdvice", DespatchAdviceSchema);
