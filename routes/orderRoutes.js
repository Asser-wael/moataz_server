import express from "express";
import Checkout from "../models/Checkout.js";
import upload from "../utils/multer.js";
// ✅ صح - فوق مع كل الـ imports
import { authMiddleware, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/* ================= SEND ORDER ================= */
router.post(
  "/sendOrder",
  optionalAuth,
  upload.single("photo"),
  async (req, res) => {
    try {
      const userId = req.user?.id || null;

      let cart = [];

      try {
        cart = JSON.parse(req.body.currentCart || "[]");
      } catch {
        return res.status(400).json({ message: "Invalid cart" });
      }
      const isValid = cart.every(
        (item) =>
          item.productId &&
          typeof item.quantity === "number" &&
          item.quantity > 0
      );
      if (!isValid) {
        return res.status(400).json({
          message: "Invalid cart structure",
        });
      }

      const order = await Checkout.create({
        userId,
        cart,
        name: req.body.name,
        phoneNum: req.body.phoneNum,
        photo: req.file
          ? `https://moataz-client.vercel.app/uploads/${req.file.filename}`
          : "",
        totalPrice: Number(req.body.totalPrice) || 0,
      });

      res.status(201).json({
        success: true,
        order,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
/* ================= MY ORDERS ================= */
router.get("/myorder", authMiddleware, async (req, res) => {
  try {
    const orders = await Checkout.find({ userId: req.user.id })
      .populate("cart.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN ================= */
import { adminMiddleware } from "../middleware/auth.js";

router.get("/allOrders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Checkout.find()
      .populate("userId")
      .populate("cart.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE STATUS ================= */
router.put("/updateStatus", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await Checkout.findByIdAndUpdate(
      req.body.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(order);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;