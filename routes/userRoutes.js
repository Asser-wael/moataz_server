import express from "express";
import { authMiddleware, adminMiddleware, optionalAuth } from "../middleware/auth.js";
import UserModel from "../models/Users.js";
import mongoose from "mongoose";
import ProductModel from "../models/Product.js";
const router = express.Router();

// ✅ GET_USER
router.get("/user", optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const user = await UserModel.findById(req.user.id).select("-password");

  res.json(user);
});
// ✅ GET_USERS
router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.json(users);
});
// ✅ Delete User
router.delete("/admin/deleteUser/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await UserModel.findByIdAndDelete(req.params.id)
  res.json(users);
});

// ✅ GET random products
router.get("/getProducts/random", async (req, res) => {
  try {
    const Products = await ProductModel.aggregate([{ $sample: { size: 8 } }]);
    res.json(Products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ getProdectForUser
router.get("/getProdect/:id", async (req, res) => {
  try {
    const findProduct = await ProductModel.findById(req.params.id);
    if (!findProduct) return res.json({ message: "prodect not found!" });
    res.json(findProduct);
  } catch (err) {
    res.status(500).json({ message: "Error updating product" });
  }
});
// ✅ GET products by category
router.get("/getProducts/random/:category", async (req, res) => {
  try {
    const productCategory = req.params.category;
    const Products = await ProductModel.aggregate([
      {
        $match: {
          productCategory: { $regex: `^${productCategory}$`, $options: "i" },
          // _id: { $ne: new mongoose.Types.ObjectId(req.params.id) }
        }
      },
      { $sample: { size: 8 } }
    ]);
    res.json(Products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/getProducts/deal", async (req, res) => {
  try {
    const products = await ProductModel.aggregate([
      {
        $match: {
          deal: true
        }
      },
      { $sample: { size: 8 } }
    ]);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/getAllDeals", async (req, res) => {
  try {
    const products = await ProductModel.aggregate([
      {
        $match: {
          deal: true
        }
      },
    ]).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/getAllProducts", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const search = req.query.search || "";

    const query = search
      ? {
        productName: { $regex: search, $options: "i" }
      }
      : {};

    const products = await ProductModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await ProductModel.countDocuments(query);

    res.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
export default router;