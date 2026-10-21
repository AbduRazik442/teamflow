
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      required: true,
      default: "member",
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

membershipSchema.index(
  { workspace: 1, user: 1 },
  { unique: true }
);

membershipSchema.index({ user: 1, status: 1 });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;