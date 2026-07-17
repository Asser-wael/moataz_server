import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

import cookieParser from "cookie-parser";

//  ROUTS
import authRouts from "./routes/authRouts.js"
import usersRouts from "./routes/usersRouts.js"
import customuseRouts from "./routes/customuseRouts.js"
import productsRoutes from "./routes/productsRoutes.js"
import orderRouts from "./routes/orderRouts.js"
import  adminDashboard  from "./routes/dashboardRouts.js";
import  notificationsRoute  from "./routes/notificationsRoute.js";

dotenv.config();

const app = express();
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
const server = http.createServer(app);
app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

await connectDB();

initSocket(server);

app.get("/", (req, res) => {
  res.json({ message: "clothesserver API" });
});

const PORT = process.env.PORT || 3001;



app.use(authRouts)
app.use(usersRouts)
app.use(productsRoutes)
app.use(customuseRouts)
app.use(orderRouts)
app.use(adminDashboard)
app.use(notificationsRoute)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});