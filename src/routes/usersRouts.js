import express from "express";
import UserModel from "../models/User.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();

router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.json({
    message: "Users fetched successfully",
    type: "success",
    data: users,
  });
});

router.delete("/admin/deleteUser/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await createNotification({
    title: "User Deleted",
    message: `${user.name} has been removed`,
    type: "warning",
    data: { userId: user._id },
  });

  res.json(req.params.id);
});

router.put("/admin/changeStatus/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await UserModel.findByIdAndUpdate(req.params.id, req.body);

  res.json({
    message: "User updated successfully",
    type: "success",
    id: req.params.id,
  });
});

export default router;