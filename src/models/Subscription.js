import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String,
  },
}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);