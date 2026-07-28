import express from "express";
import ProductModel from "../models/Product.js";
import Notification from "../models/Notification.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import fs from "fs";
const router = express.Router();

// GET ALL
router.get("/getAllProducts", async (req, res) => {
    try {
        const products = await ProductModel.find();
        res.json({
            message: "Products fetched successfully",
            type: "success",
            data: products
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET OFFERS
router.get("/getOffers", async (req, res) => {
    try {
        const products = await ProductModel.aggregate([
            { $match: { offer: true } },
            { $sample: { size: 8 } }
        ]);
        res.json({ data: products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/getAllOffers", async (req, res) => {
    try {
        const products = await ProductModel.aggregate([
            { $match: { offer: true } },
        ]);
        res.json({ data: products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET ONE
router.get("/viewProduct/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        res.json({
            message: "Product fetched successfully",
            type: "success",
            data: product
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE
router.delete("/removeProduct/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);

        if (product?.image) {
            fs.unlink(`uploads/${product.image}`, () => { });
        }

        await ProductModel.findByIdAndDelete(req.params.id); // ✅ كانت MealModel (خطأ)

        await Notification.create({
            title: "Product Deleted",
            message: `${product.name} has been deleted`,
            type: "error",
        });
        res.json({
            message: "Product deleted successfully",
            type: "success",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ADD
router.post("/addProduct", upload.single("image"), async (req, res) => {
    try {

        
        console.log(JSON.parse(req.body.account));
        
        const product = await ProductModel.create({
            name: req.body.name,
            description: req.body.description,
            Category: req.body.Category,
            GameplayType: req.body.GameplayType,
            availability: req.body.availability == "true",
            offer: req.body.offer === "true",
            image: req.file?.filename,
            account: JSON.parse(req.body.account || "[]"),
            colors: JSON.parse(req.body.colors || "[]"),
            
        });
        await createNotification({
            title: "New Product",
            message: `${product.name} added successfully`,
            type: "success",
            data: {
                productId: product._id,
            },
     } );
        console.log(4);
        res.json({
            message: "Product created successfully",
            type: "success",
            data: product,
        });
        console.log(5);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// EDIT
router.put("/editProduct/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            account: JSON.parse(req.body.account || "[]"),
            colors: JSON.parse(req.body.colors || "[]"),
        };

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const product = await ProductModel.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
        });

        res.json({
            message: "Product updated successfully",
            type: "success",
            data: product,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", type: "error" });
    }
});
//review
export const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, comment, stars } = req.body;

        if (!name || !comment) {
            return res.status(400).json({
                message: "Name and comment are required",
            });
        }

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        product.comment.push({
            name,
            comment,
            stars,
        });

        await product.save();

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};
router.post("/review/:id", addReview);
export default router;
