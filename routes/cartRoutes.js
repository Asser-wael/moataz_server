import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import UserModel from "../models/Users.js";

const router = express.Router();
router.put("/addToCart/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // من التوكن
        const productId = req.params.id;

        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        
        // check if product already exists
        const existingProduct = user.cart.find(
            (item) => item.productId.toString() === productId
        );
        
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            user.cart.push({
                productId,
                quantity: 1,
            });
        }
        
        await user.save();
        
        return res.status(200).json({
            message: "Product added to cart successfully",
            cart: user.cart,
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Error adding product to cart",
            error: error.message,
            
        });
    }
});
router.delete("/deletFromCart/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // من التوكن
        const productId = req.params.id;
        
        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        
        user.cart = user.cart.filter(
            (i) => i.productId.toString() !== productId
        );
        
        await user.save();
        
        return res.status(200).json({
            message: "Product added to cart successfully",
            cart: user.cart,
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Error adding product to cart",
            error: error.message,
        });
    }
});
router.get("/cart", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await UserModel.findById(userId).populate(
            "cart.productId"
        );
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        
        const totalPrice = user.cart.reduce((acc, item) => {
            return acc + (
                item.productId.productPrice * item.quantity
            );
        }, 0);
        
        return res.status(200).json({
            cart: user.cart,
            totalPrice,
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Error getting cart",
            error: error.message,
        });
    }
});
// router.put("/decreaseFromCart/:id", ...)

router.put("/decreaseFromCart/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // من التوكن
        const productId = req.params.id;
        
        const user = await UserModel.findById(userId);
        
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        
        // البحث عن المنتج داخل السلة
        const existingProduct = user.cart.find(
            (item) => item.productId.toString() === productId
        );
        
        if (existingProduct) {
            if (existingProduct.quantity > 1) {
                // إذا كانت الكمية أكبر من 1، قللها بمقدار 1
                existingProduct.quantity -= 1;
            } else {
                // إذا كانت الكمية 1، احذف المنتج تماماً من السلة
                user.cart = user.cart.filter(
                    (item) => item.productId.toString() !== productId
                );
            }
        } else {
            return res.status(404).json({
                message: "Product not found in cart",
            });
        }
        
        await user.save();
        
        return res.status(200).json({
            message: "Product quantity decreased successfully",
            cart: user.cart,
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Error decreasing product quantity",
            error: error.message,
        });
    }
});
export default router;