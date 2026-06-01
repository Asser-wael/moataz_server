import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/Users.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/* ================= EMAIL TRANSPORT ================= */
/* ================= EMAIL TRANSPORT ================= */
/* ================= EMAIL TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  // استخدام آي بي IPv4 مباشر لسيرفر Gmail لتخطي مشكلة الـ ENETUNREACH
  host: "74.125.134.108", 
  port: 465,               // سننتقل لمنفذ 465 الأكثر استقراراً مع الـ IP المباشر
  secure: true,            // يجب أن تكون true مع منفذ 465
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  connectionTimeout: 15000, // زيادة المهلة لـ 15 ثانية لحين إتمام الاتصال الآمن
  greetingTimeout: 15000,
  tls: {
    // هذا السطر مهم جداً لأننا نستخدم IP مباشر وليس اسم الدومين
    rejectUnauthorized: false 
  }
});
// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });
    const hashPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      name,
      email,
      password: hashPassword,
    });

    res.status(201).json({ message: "Registered" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESHSECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ture,
      sameSite: "none",
    });

    res.json({ accessToken });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ RESET PASSWARD
router.post("/resetPassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not exists" });
    }

    // OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    // ✅ SEND EMAIL
    const info = await transporter.sendMail({
      from: `"Moataz Store" <${process.env.EMAIL}>`,
      to: email,
      subject: "Password Reset Code",
      html: `
        <div style="font-family: Arial">
          <h2>Password Reset Code</h2>
          <h1 style="letter-spacing:5px">${otp}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    console.log("EMAIL SENT:", info.messageId);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.log("MAIL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/verifyOtp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // check OTP
    if (user.resetOtp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // check expiry
    if (user.resetOtpExpire < Date.now()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // clear OTP
    user.resetOtp = null;
    user.resetOtpExpire = null;

    await user.save();

    res.json({
      message: "Password updated"
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// ✅ REFRESH
router.post("/refresh", (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_REFRESHSECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const accessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });

  } catch (err) {
    res.sendStatus(500);
  }
});

// ✅ LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: ture,
  });
  res.json({ message: "Logged out" });
});

export default router;
