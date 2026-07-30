import express from "express";
import NotificationModel from "../models/Notification.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin/notifications", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });
        res.json({
            message: "Notifications fetched successfully",
            type: "success",
            data: notifications,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error retrieving notifications" });
    }
});

router.put("/admin/notifications/:id/read", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const notification = await NotificationModel.findByIdAndUpdate(
            req.params.id,
            { read: true },
            {
                returnDocument: "after",
            }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({
            message: "Notification marked as read",
            type: "success",
            data: notification,
        });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Error updating notification" });
    }
});

router.put("/admin/notifications/read-all", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await NotificationModel.updateMany({ read: false }, { read: true });
        res.json({ message: "All notifications marked as read", type: "success" });
    } catch (error) {
        console.error("Error updating notifications:", error);
        res.status(500).json({ message: "Error updating notifications" });
    }
});

router.delete("/admin/notifications/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await NotificationModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification deleted", type: "success", id: req.params.id });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Error deleting notification" });
    }
});

router.post("/admin/notifications/subscribe", authMiddleware, (req, res) => {
    try {
        const { subscription } = req.body;

        if (!subscription?.endpoint || !subscription?.keys) {
            return res.status(400).json({
                success: false,
                message: "بيانات الاشتراك ناقصة",
            });
        }

        await Subscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                user: req.user.id,
                role: req.user.role === "admin" ? "admin" : "user",
                endpoint: subscription.endpoint,
                keys: subscription.keys,
            },
            {
                upsert: true,
                returnDocument: "after",
            }
        );

        res.json({ success: true, message: "Subscribed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})



export default router;