import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      enum: ["cash", "wallet"],
      required: true,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      notes: { type: String, default: "" },
    },

    walletType: String,
    walletName: String,
    walletNumber: String,

    image: {
      type: String,
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
        size: String,
      },
    ],

    totalPrice: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "shipped", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;