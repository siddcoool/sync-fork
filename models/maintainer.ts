import mongoose, { Schema, Model, InferSchemaType, HydratedDocument } from "mongoose";

const MaintainerSchema = new Schema(
  {
    label: { type: String, required: true },

    // Identity used for syncfork.md commits so the fork owner is the latest committer.
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },

    // AES-256-GCM encrypted fine-grained PAT. Never exposed to the client.
    patEncrypted: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export type MaintainerDoc = InferSchemaType<typeof MaintainerSchema>;
export type MaintainerHydrated = HydratedDocument<MaintainerDoc>;

export const Maintainer: Model<MaintainerDoc> =
  (mongoose.models.Maintainer as Model<MaintainerDoc>) ||
  mongoose.model<MaintainerDoc>("Maintainer", MaintainerSchema);
