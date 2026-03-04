import mongoose, { Schema , InferSchemaType, Model } from 'mongoose';

const MoneySchema = new Schema(
    {
        value: { type: Number, required: true },
        currency: { type: String, required: true },
    },

    {_id: false}
)

const PartySchema = new Schema(
    {
        name: { type: String},
        ids: { type: [String], default: undefined},
    },
    {_id: false}
)

const OrderSchema = new Schema(
    {
        createdAt: { type: Date, default: () => new Date(), index: true},

        status: { 
            type: String, 
            enum: ['received', 'invoiced', 'rejected'],
            default: 'received',
            index: true,
        },

        ubl: {
            version: { type: String, default: "2.4" },
            documentType: { type: String, default: "Order" },
            orderId: { type: String, index: true },
            issueDate: { type: String }, // YYYY-MM-DD
            customizationId: { type: String },
            profileId: { type: String },
        },

        parties: {
            buyer: { type: PartySchema },
            seller: { type: PartySchema },
        },

        totals: {
            payableAmount: { type: MoneySchema, required: true },
        },

        validation: {
            xsd: {
                valid: { type: Boolean, default: false },
                errors: { type: [String], default: [] },
            },

            schematron: {
                valid: { type: Boolean },
                errors: { type: [String], default: undefined },
            }
        },

        raw: {
            xml: { type: String, required: true },
            sha256: { type: String, required: true, unique: true },
        }
    },

    { collection: 'orders' },
)

export type OrderDocument = InferSchemaType<typeof OrderSchema>;
export const OrderModel: Model<OrderDocument> =
    mongoose.models.Order ?? mongoose.model("Order", OrderSchema);