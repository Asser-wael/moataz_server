import express from "express";
import Checkout from "../models/Checkout.js";
import upload from "../utils/multer.js";
// ✅ صح - فوق مع كل الـ imports
import { authMiddleware, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/* ================= SEND ORDER ================= */
router.post("/resetPassword", async (req, res) => {
  try {
    console.log("1");

    const { email } = req.body;

    const exists = await UserModel.findOne({ email });

    console.log("2");

    if (!exists) {
      return res.status(400).json({
        message: "User not exists",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("3");

    exists.resetOtp = otp;
    exists.resetOtpExpire = Date.now() + 5 * 60 * 1000;

    await exists.save();

    console.log("4");

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Code",
      html: `<h1>${otp}</h1>`,
    });

    console.log("5");

    res.json({
      message: "OTP sent",
    });
  } catch (err) {
    console.log("ERROR =>", err);

    res.status(500).json({
      message: err.message,
    });
  }
});
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
