import NotificationModel from "../models/Notification.js";
import { getIO } from "../config/socket.js";

export const createNotification = async ({ title, message, type = "info", data = {}, room = "admin" }) => {
  try {
    const notification = await NotificationModel.create({ title, message, type, data });

    const io = getIO();
    io.to(room).emit("notification", notification);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};