import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const TwoFactorSchema = new Schema(
  {
    secret: { type: String, default: null },
    code: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const PasswordResetSchema = new Schema(
  {
    tokenHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    company: {
      type: String,
      default: null,
      trim: true,
    },
    twoFactor: {
      type: TwoFactorSchema,
      default: () => ({}),
    },
    passwordReset: {
      type: PasswordResetSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;
export type UserModel = Model<User>;

export default mongoose.model<User>("User", UserSchema);
