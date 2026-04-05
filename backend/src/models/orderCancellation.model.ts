import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const OrderCancellationSchema = new Schema(
    {
        cancellationId: {
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

        cancellationDocument: {
            type: String,
            required: true,
        },

        cancellationReason: {
            type: String,
            required: true,
            trim: true,
        },

        executedAt: {
            type: String,
            required: true,
        },
    },
    {
        collection: "order_cancellations",
        timestamps: true,
    }
);

export type OrderCancellationDocument = InferSchemaType<typeof OrderCancellationSchema>;

export const OrderCancellationModel: Model<OrderCancellationDocument> =
    mongoose.models.OrderCancellation ?? mongoose.model("OrderCancellation", OrderCancellationSchema);
