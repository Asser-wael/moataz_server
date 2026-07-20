import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    walletType: String,
    walletName: String,
    walletNumber: String,
    whats: String,

    image: {
      type: String,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        count: Number,
        image: String,
        option: String,
      },
    ],

    totalPrice: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;