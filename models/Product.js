import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    productName: String,
    productDescription: String,
    productPrice: Number,
    productImage: [String],
    productStock: String,
    productCategory: String,
    accountType: String,
    deal: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

const ProductModel = mongoose.model("products", ProductSchema);

export default ProductModel;