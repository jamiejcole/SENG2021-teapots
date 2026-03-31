import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const InvoicePdfSchema = new Schema(
  {
    invoiceHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    contentType: {
      type: String,
      required: true,
      default: "application/pdf",
    },
    pdfData: {
      type: Buffer,
      required: true,
    },
  },
  {
    collection: "invoice_pdfs",
    timestamps: true,
  }
);

export type InvoicePdfDocument = InferSchemaType<typeof InvoicePdfSchema>;

export const InvoicePdfModel: Model<InvoicePdfDocument> =
  mongoose.models.InvoicePdf ?? mongoose.model("InvoicePdf", InvoicePdfSchema);
