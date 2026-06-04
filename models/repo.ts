import mongoose, { Schema, Model, InferSchemaType, HydratedDocument } from "mongoose";

export type SyncStatus = "never" | "success" | "error" | "conflict";

const RepoSchema = new Schema(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    defaultBranch: { type: String, required: true },
    upstreamOwner: { type: String, required: true },
    upstreamRepo: { type: String, required: true },

    // AES-256-GCM encrypted fine-grained PAT. Never exposed to the client.
    patEncrypted: { type: String, required: true, select: false },

    // Identity used for the syncfork.md commit so the fork owner is the latest committer.
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },

    lastSyncedAt: { type: Date, default: null },
    lastSyncStatus: {
      type: String,
      enum: ["never", "success", "error", "conflict"],
      default: "never",
    },
    lastSyncMessage: { type: String, default: "" },
    lastCommitUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

RepoSchema.index({ owner: 1, repo: 1 }, { unique: true });

export type RepoDoc = InferSchemaType<typeof RepoSchema>;
export type RepoHydrated = HydratedDocument<RepoDoc>;

export const Repo: Model<RepoDoc> =
  (mongoose.models.Repo as Model<RepoDoc>) ||
  mongoose.model<RepoDoc>("Repo", RepoSchema);
