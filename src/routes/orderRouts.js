import express from "express";
import OrderModel from "../models/Order.js";
import { getIO } from "../config/socket.js";
import upload from "../middlewares/upload.js";
import { authMiddleware, cashierMiddleware } from "../middlewares/auth.js";
import ProductModel from "../models/Product.js";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();

router.get("/admin/orders", authMiddleware, cashierMiddleware, async (req, res) => {
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

router.get("/admin/orders/:id", authMiddleware, cashierMiddleware, async (req, res) => {
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

router.post("/checkOut", upload.single("image"), async (req, res) => {
  try {
    const {
      paymentMethod,
      fullName,
      phone,
      address,
      city,
      notes,
      walletType,
      walletName,
      walletNumber,
    } = req.body;

    const cart = JSON.parse(req.body.cart);
    const io = getIO();

    for (const item of cart) {
      const product = await ProductModel.findById(item._id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const size = product.sizes.find((s) => s.name === item.size);

      if (!size) {
        return res.status(404).json({
          message: `Size ${item.size} not found`,
        });
      }

      if (size.count <= 0) {
        return res.status(400).json({
          message: `${product.name} (${size.name}) is out of stock`,
        });
      }

      if (size.count < item.count) {
        return res.status(400).json({
          message: `Only ${size.count} left of ${product.name} (${size.name})`,
        });
      }

      size.count -= item.count;

      if (size.count <= 3) {
        io.to("admin").emit("warning", {
          id: product._id,
          name: product.name,
          size: size.name,
          count: size.count,
        });

        await createNotification({
          title: "Low Stock",
          message: `${product.name} (${size.name}) has only ${size.count} left`,
          type: "warning",
          data: {
            productId: product._id,
            size: size.name,
            remaining: size.count,
          },
        });
      }

      await product.save();
    }

    const image = req.file?.filename;

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.count, 0);

    const order = await OrderModel.create({
      paymentMethod,
      shippingAddress: { fullName, phone, address, city, notes },
      walletType,
      walletName,
      walletNumber,
      image,
      cart,
      totalPrice,
    });

    io.to("admin").emit("newOrder", order);

    await createNotification({
      title: "New Order",
      message: `${fullName} placed a new order.`,
      type: "success",
      data: {
        orderId: order._id,
        total: totalPrice,
      },
    });

    res.status(200).json({
      message: "Order placed successfully",
      type: "success",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "order error" });
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