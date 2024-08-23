const { Router } = require("express");
const { ItemModel } = require("../Models/items.model");

const ItemRouter = Router();
// Get Item
ItemRouter.get("/get-item", async (req, res) => {
  try {
    const items = await ItemModel.find();
    const transformedUsers = items.map((el) => ({
      ...el.toObject(), // Convert Mongoose document to plain object
      uid: el._id, // Add the custom `uid` field
    }));
    res.status(200).json({ statusCode: 200, data: transformedUsers });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Post Item
ItemRouter.post("/create-item", async (req, res) => {
  try {
    const existItem = await ItemModel.findOne({ name: req.body.name });
    if (existItem) {
      res.status(400).json({ statusCode: 400, msg: "Item Already Exist" });
    } else {
      const item = new ItemModel({ ...req.body });
      await item.save();
      res
        .status(201)
        .json({ statusCode: 201, msg: "Item Created Successfully" });
    }
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Update Item
ItemRouter.put("/update-item/:id", async (req, res) => {
  try {
    const { name, quantity } = req.body;
    if (!name) {
      res.status(400).json({ statusCode: 400, msg: "Name not found" });
    } else if (!quantity) {
      res.status(400).json({ statusCode: 400, msg: "Quantity not found" });
    }
    await ItemModel.findByIdAndUpdate(
      { _id: req.params.id },
      {
        name,
        quantity,
      }
    );
    res.status(200).json({ statusCode: 200, msg: "Item Updated Successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Delete Item
ItemRouter.delete("/delete-item/:id", async (req, res) => {
  try {
    await ItemModel.findByIdAndDelete({ _id: req.params.id });
    res.status(200).json({ statusCode: 200, msg: "Item Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

module.exports = {
  ItemRouter,
};
