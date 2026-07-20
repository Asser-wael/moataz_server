import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  verifyOtp: String,
  verifyOtpExpire: Date,

  cart: [
    {
      _id: false, 
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      image: String,
      price: Number,
      option: String,
      count: { type: Number, default: 1 },
    },
  ],

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  status: {
    type: Boolean,
    enum: [false, true],
  },
  order: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    },
  ],

  role: {
    type: String,
    enum: ["user", "admin"],
  },
});

const UserModel = mongoose.model("Users", UserSchema);

export default UserModel;