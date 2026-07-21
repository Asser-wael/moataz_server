import express from "express";
import CategoryModel from "../models/Category.js";
import PopularModel from "../models/popular.js"; 
import upload from "../middlewares/upload.js";

const router = express.Router();

// CATEGORIES
router.get("/getAllCategories", async (req, res) => {
  const data = await CategoryModel.find();
  res.json({ data });
});

router.post("/addNewCategory", upload.single("image"), async (req, res) => {
  const cat = await CategoryModel.create({
    name: req.body.name,
    image: req.file?.filename,
  });

  res.json({ data: cat, message: "Created", type: "success" });
});

router.delete("/deleteCategory/:id", async (req, res) => {
  await CategoryModel.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted", type: "success" });
});

// POPULAR PRODUCTS
router.get("/getPopularProducts", async (req, res) => {
  const data = await PopularModel.find().populate("id");

  console.log(data);
  
  // for (const i of data) {
  //   const 
  // }
  res.json({ data });
});

router.post("/addPopular", async (req, res) => {
  const exists = await PopularModel.findOne({ id: req.body.id });

  if (exists) {
    return res.json({ message: "Already exists", type: "error" });
  }

  const pop = await PopularModel.create({ id: req.body.id });

  res.json({
    popularProduct: pop,
    message: "Added",
    type: "success",
  });
});

router.delete("/deletePopular/:id", async (req, res) => {
  await PopularModel.deleteOne({ id: req.params.id });
  res.json({ message: "Removed", type: "success" });
});

export default router;