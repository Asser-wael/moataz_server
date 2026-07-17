import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    Category: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      default: false,
    },
    availability: {
      type: Boolean,
      default: false,
    },


    image: {
      type: String,
    },

    sizes: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
        },
        priceOffer: {
          type: Number,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    comment: [
      {
        name: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: false,
        },
        stars: {
          type: Number,
          required: false,
        },
      },
    ],
    colors: [
      String
    ],
  },
  {
    timestamps: true,
  }
);


const ProductModel = mongoose.model("Product", ProductSchema);

export default ProductModel;