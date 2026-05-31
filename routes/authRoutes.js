import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/Users.js";
import dotenv from "dotenv";
import * as Brevo from "@getbrevo/brevo";

dotenv.config();

const router = express.Router();

/* ================= BREVO SETUP ================= */
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey =
  process.env.BREVO_API_KEY;

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
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

/* ================= LOGIN ================= */
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
      secure: false,
      sameSite: "lax",
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RESET PASSWORD ================= */
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

    // ===== SEND EMAIL VIA BREVO =====
    const emailData = new Brevo.SendSmtpEmail();

    emailData.subject = "Password Reset Code";
    emailData.to = [{ email }];
    emailData.sender = {
      name: "Moataz Store",
      email: "no-reply@moataz.com",
    };

    emailData.htmlContent = `
      <div style="font-family:Arial">
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(emailData);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ================= VERIFY OTP ================= */
router.post("/verifyOtp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpire = null;

    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
