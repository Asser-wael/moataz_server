import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  resetOtp: String,
  resetOtpExpire: Date,

  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
});

const UserModel = mongoose.model("users", UserSchema);

export default UserModel;