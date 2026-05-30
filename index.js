import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();




// ==============================
// MIDDLEWARES
// ==============================
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ==============================
// UPLOADS FOLDER
// ==============================
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use("/uploads", express.static(uploadDir));

// ==============================
// DATABASE
// ==============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected successfully"))
  .catch(err => console.log("DB Connection Error:", err));

// ==============================
// ROUTES
// ==============================
app.use(authRoutes);
app.use(userRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(orderRoutes);

// ==============================
// PORT
// ==============================
const PORT = process.env.PORT || 3001;
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});