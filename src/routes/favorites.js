import express from "express";
import UserModel from "../models/User.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// GET ALL FAVORITES
router.get("/favorites", authMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id).populate("favorites");

        if (!user) {
            return res.status(404).json({ message: "User not found", type: "error" });
        }

        res.json({
            message: "Favorites fetched successfully",
            type: "success",
            data: user.favorites,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ADD TO FAVORITES
router.post("/favorites/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found", type: "error" });
        }

        const exist = user.favorites.some((id) => id.toString() === productId);

        if (exist) {
            return res.json({ message: "Product already in favorites", type: "error" });
        }

        user.favorites.push(productId);
        await user.save();
        await user.populate("favorites");

        res.json({
            message: "Added to favorites",
            type: "success",
            data: user.favorites,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// REMOVE FROM FAVORITES
router.delete("/favorites/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found", type: "error" });
        }

        user.favorites = user.favorites.filter((id) => id.toString() !== productId);
        await user.save();
        await user.populate("favorites");

        res.json({
            message: "Removed from favorites",
            type: "success",
            data: user.favorites,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// TOGGLE (هيفيدك في زرار القلب في الفرونت، مش هتحتاج تتحقق هو مضاف ولا لأ)
router.post("/favorites/toggle/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found", type: "error" });
        }

        const exist = user.favorites.some((id) => id.toString() === productId);

        if (exist) {
            user.favorites = user.favorites.filter((id) => id.toString() !== productId);
        } else {
            user.favorites.push(productId);
        }

        await user.save();
        await user.populate("favorites");

        res.json({
            message: exist ? "Removed from favorites" : "Added to favorites",
            type: "success",
            data: user.favorites,
            isFavorite: !exist,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;