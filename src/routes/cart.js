import express from "express";
import UserModel from "../models/User.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

const findItemIndex = (cart, { _id, option }) =>
  cart.findIndex(
    (item) =>
      item.productId?.toString() === _id?.toString() &&
      item.option === option
  );

// بيوحد شكل الكارت الراجع من السيرفر عشان يطابق شكل الجست كارت في الفرونت (_id = product id)
const formatCart = (cart) =>
  cart.map((item) => ({
    _id: item.productId,
    name: item.name,
    image: item.image,
    price: item.price,
    option: item.option,
    count: item.count,
  }));

// GET CART
router.get("/cart", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    res.json({
      message: "Cart fetched successfully",
      type: "success",
      data: formatCart(user.cart),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD
router.post("/cart/add", authMiddleware, async (req, res) => {
  try {
    const { _id, name, image, price, option, count } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    const index = findItemIndex(user.cart, { _id, option });

    if (index !== -1) {
      user.cart[index].count += count || 1;
    } else {
      user.cart.push({
        productId: _id,
        name,
        image,
        price,
        option,
        count: count || 1,
      });
    }

    await user.save();
    res.json({ message: "Added to cart", type: "success", data: formatCart(user.cart) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// INCREASE
router.put("/cart/increase", authMiddleware, async (req, res) => {
  try {
    const { _id, option } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    const index = findItemIndex(user.cart, { _id, option });
    if (index === -1) return res.status(404).json({ message: "Item not found", type: "error" });

    user.cart[index].count += 1;
    await user.save();

    res.json({ message: "Cart updated", type: "success", data: formatCart(user.cart) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DECREASE
router.put("/cart/decrease", authMiddleware, async (req, res) => {
  try {
    const { _id, option } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    const index = findItemIndex(user.cart, { _id, option });
    if (index === -1) return res.status(404).json({ message: "Item not found", type: "error" });

    if (user.cart[index].count > 1) {
      user.cart[index].count -= 1;
    } else {
      user.cart.splice(index, 1);
    }

    await user.save();
    res.json({ message: "Cart updated", type: "success", data: formatCart(user.cart) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// REMOVE ITEM
router.delete("/cart/remove", authMiddleware, async (req, res) => {
  try {
    const { _id, option } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    user.cart = user.cart.filter(
      (item) =>
        !(
          item.productId?.toString() === _id?.toString() &&
          item.option === option
        )
    );

    await user.save();
    res.json({ message: "Item removed", type: "success", data: formatCart(user.cart) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// CLEAR
router.delete("/cart/clear", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", type: "error" });

    user.cart = [];
    await user.save();

    res.json({ message: "Cart cleared", type: "success", data: [] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;