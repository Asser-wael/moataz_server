import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import resend from "../config/resend.js";
import dotenv from "dotenv";
import { authMiddleware } from "../middlewares/auth.js";
import Subscription from "../models/Subscription.js";

dotenv.config();

const router = express.Router();

// ✅ REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (password.length < 6) {
            return res.status(400).json({ message: "Password too short", type: "error" });
        }

        const exist = await UserModel.findOne({ email })

        if (exist) {
            return res.json({ message: "User exists!", type: "error" })
        }
        const hashpassword = await bcrypt.hash(password, 10)

        const verifyOtp = Math.floor(100000 + Math.random() * 900000).toString();

        await UserModel.create({
            name,
            email,
            password: hashpassword,
            status: false,
            role: "user",
            verifyOtp,
            verifyOtpExpire: Date.now() + 10 * 60 * 1000
        });
        console.log("OTP =", verifyOtp);
        const result = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verify your email",
            html: `
      <h2>Your verification code</h2>
      <h1>${verifyOtp}</h1>
    `,
        });

        console.log("RESEND RESULT:", result);
        res.status(201).json({ message: "Registered", type: "success" });

    } catch (error) {
        console.log(error)
    }
})
// ✅ VERIFY EMAIL OTP
router.post("/verify-email", authMiddleware, async (req, res) => {
    try {
        const { otp } = req.body;

        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
                , type: "error"

            });
        }

        if (user.status) {
            return res.json({
                message: "Email already verified",
                type: "error"
            });
        }

        if (user.verifyOtp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
                , type: "error"

            });
        }

        if (user.verifyOtpExpire < Date.now()) {
            return res.status(400).json({
                message: "OTP expired"
                , type: "error"
            });
        }

        user.status = true;
        user.verifyOtp = null;
        user.verifyOtpExpire = null;

        await user.save();

        res.json({
            message: "Email verified successfully"
            , type: "success"

        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// ✅ RESEND VERIFY OTP
router.post("/resend-otp", authMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                type: "error"
            });
        }

        if (user.status) {
            return res.json({
                message: "Email already verified",
                type: "error"
            });
        }

        // منع طلب كود جديد قبل ما يعدي وقت معين (اختياري - Rate limit بسيط)
        const RESEND_COOLDOWN = 60 * 1000; // 60 ثانية
        if (user.verifyOtpExpire && user.verifyOtpExpire - (10 * 60 * 1000) + RESEND_COOLDOWN > Date.now()) {
            return res.status(429).json({
                message: "Please wait before requesting a new code",
                type: "error"
            });
        }

        const verifyOtp = Math.floor(100000 + Math.random() * 900000).toString();

        user.verifyOtp = verifyOtp;
        user.verifyOtpExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: user.email,
            subject: "Verify your email",
            html: `
        <h2>Your verification code</h2>
        <h1>${verifyOtp}</h1>
    `,
        });

        res.json({
            message: "Verification code resent",
            type: "success"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.json({ message: "User doesn't exist!", type: "error" })
        }

        const status = await bcrypt.compare(password, user.password)

        if (!status) {
            return res.json({ message: "Invalid credentials!", type: "error" })
        }

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        )
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESHSECRET,
            { expiresIn: "7d" }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.json({
            accessToken,
            message: "Welcome back!",
            type: "success",
        });
    } catch (error) {
        console.log(error)
    }
})

router.post("/send-reset-otp", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.json({
                message: "User not found",
                type: "error",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOtp = otp;
        user.resetOtpExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Password Reset OTP",
            html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
        });

        res.json({
            message: "OTP sent",
            type: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});
// ✅ GET-USER

router.get("/user", authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await UserModel.findById(req.user.id).select("-password");

        res.json(user);
    } catch (error) {
        console.log(error)
    }
});
// // ✅ REFRESH
router.post("/refresh", (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "No refresh token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESHSECRET);

        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken });

    } catch (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
});

// ✅ LOGOUT
router.post("/logout", authMiddleware, async (req, res) => {
      await Subscription.findOneAndDelete({
      user: req.user.id, 
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.json({ message: "Logged out" });
});

export default router;