import express from "express";
import OrderModel from "../models/Order.js";
import { getIO } from "../config/socket.js";
import upload from "../middlewares/upload.js";
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from "../middlewares/auth.js";
import ProductModel from "../models/Product.js";
import { createNotification } from "../services/notificationService.js";
import UserModel from "../models/User.js";
import { sendPushToAdmins } from "../utils/sendPush.js";

const router = express.Router();

router.get("/admin/orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("cart.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});

router.get("/admin/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id).populate("cart.productId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching single order:", error);
    res.status(500).json({ message: "Error retrieving order" });
  }
});

// ✅ NEW: أوردرز اليوزر المسجل
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.user.id })
      .populate("cart.productId")
      .sort({ createdAt: -1 });

    res.json({
      message: "Orders fetched successfully",
      type: "success",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});

// checkOut بقى شغال للـ guest وللـ user المسجل مع بعض
router.post("/checkOut", optionalAuthMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { walletType, walletName, walletNumber, whats } = req.body;

    const io = getIO();

    const user = await UserModel.findById(req.user?.id);

    const cart = user
      ? user.cart
      : JSON.parse(req.body.cart || "[]");


    if (!cart || cart.length === 0) {
      return res.status(400).json({
        message: "السلة فارغة",
        type: "error",
      });
    }


    for (const item of cart) {

      const product = await ProductModel.findById(
        item.productId || item._id
      );


      if (!product) {
        return res.status(404).json({
          message: "المنتج غير موجود",
          type: "error",
        });
      }


      const account = product.account.find(
        (s) => s.name === item.option
      );


      if (!account) {
        return res.status(400).json({
          message: `الخيار ${item.option} غير موجود للمنتج ${product.name}`,
          type: "error",
        });
      }


      if (account.count < item.count) {

        return res.status(400).json({
          message:
            account.count === 0
              ? `المنتج ${product.name} خلص من المخزون`
              : `المتوفر من ${product.name} فقط ${account.count}`,
          type: "error",
        });
      }


      account.count -= item.count;


      if (account.count <= 3) {
        io.to("admin").emit("warning", {
          id: product._id,
          name: product.name,
          count: account.count,
        });

        await createNotification({
          title: "مخزون منخفض!",
          message: `المنتج ${product.name} أوشك على النفاذ`,
          type: "warning",
        });
      }


      await product.save();
    }


    const image = req.file?.filename;


    const totalPrice = cart.reduce(
      (sum, item) => sum + item.price * item.count,
      0
    );


    const order = await OrderModel.create({
      userId: req.user?.id || null,
      paymentMethod: "wallet",
      whats,
      walletType,
      walletName,
      walletNumber,
      image,
      cart,
      totalPrice,
    });


    io.to("admin").emit("newOrder", order);


    await sendPushToAdmins({
      title: "طلب جديد",
      body: `طلب جديد بقيمة ${totalPrice} جنيه من ${user?.name || "زائر"}`,
    });


    await createNotification({
      title: "طلب جديد",
      message: "قام عميل بعمل طلب جديد",
      type: "success",
    });


    return res.status(200).json({
      message: "تم إرسال طلبك بنجاح وفي انتظار مراجعة الإيصال",
      type: "success",
      order,
    });


  } catch (error) {

    console.error("Checkout Error:", error);

    return res.status(500).json({
      message: "حدث خطأ أثناء معالجة الطلب",
      type: "error",
    });
  }
});
router.put("/updateOrderStatus", async (req, res) => {
  try {
    const { id, status } = req.body;

    const order = await OrderModel.findByIdAndUpdate(id, { status }, { returnDocument: "after" });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const io = getIO();
    io.to(`order-${order._id}`).emit("order-status-updated", {
      orderId: order._id,
      status: order.status,
    });

    await createNotification({
      title: "Order Updated",
      message: `Order #${order._id.toString().slice(-6)} is now ${status}`,
      type: "info",
      data: {
        orderId: order._id,
        status,
      },
    });

    res.json({
      message: "Order updated successfully",
      type: "success",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "update error" });
  }
});

export default router;