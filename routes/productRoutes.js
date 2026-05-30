import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import ProductModel from "../models/Product.js";
import upload from "../utils/multer.js"; 

const router = express.Router();

router.get(
  "/admin/products",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const products = await ProductModel.find();
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({
        message: "Error get products",
        error: error.message,
      });
    }
  }
);

router.get(
  "/admin/products/viewProduct/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);

      // ✅ FIXED
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      return res.status(200).json(product);
    } catch (error) {
      // ✅ FIXED
      return res.status(500).json({
        message: "Error get product",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/admin/products/deleteProduct/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await ProductModel.findByIdAndDelete(req.params.id);

      // ✅ FIXED
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      return res
        .status(200)
        .json({ product, message: "delete successfully" });
    } catch (error) {
      return res.status(500).json({
        message: "Error deleting product",
        error: error.message,
      });
    }
  }
);

router.post(
  "/admin/products/createProduct",
  authMiddleware,
  adminMiddleware,
  upload.array("productImages", 5),
  async (req, res) => {
    try {
      const {
        productName,
        productDescription,
        deal,
        productPrice,
        productStock,
        productCategory,
        accountType,
      } = req.body;

      // ✅ FIXED
      const imageUrls =
        req.files?.map(
          (file) => `https://moataz-client.vercel.app/uploads/${file.filename}`
        ) || [];

      const product = await ProductModel.create({
        productName,
        productDescription,
        productPrice: Number(productPrice),
        productImage: imageUrls,
        productStock,
        productCategory,
        accountType,
        deal,
      });

      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({
        message: "Error creating product",
      });
    }
  }
);

router.put(
  "/admin/products/updateProduct/:id",
  authMiddleware,
  adminMiddleware,
  upload.array("productImages", 5),
  async (req, res) => {
    try {
      const { id } = req.params;

      let updatedData = { ...req.body };

      if (req.files && req.files.length > 0) {
        const images = req.files.map(
          (file) => `https://moataz-client.vercel.app/uploads/${file.filename}`
        );

        updatedData.productImage = images;
      }

      const product = await ProductModel.findByIdAndUpdate(id, updatedData, {
        returnDocument: "after",
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (err) {
      res.status(500).json({
        message: "Error updating product",
        error: err.message,
      });
    }
  }
);

export default router;