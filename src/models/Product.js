import mongoose from "mongoose";

const editionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  priceOffer: {
    type: Number,
    default: 0,
  },
  count: {
    type: Number,
    required: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
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
      default: true,
    },

    account: [editionSchema],

    GameplayType: {
      type: String,
      required: true
    },
    comment: [
      {
        name: String,
        comment: String,
        stars: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);