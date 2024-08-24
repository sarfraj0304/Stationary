const { Router } = require("express");
const { UserItemModel } = require("../Models/UserItems.model");
const { ItemModel } = require("../Models/items.model");

const UserItemRouter = Router();

// get User Item
UserItemRouter.get("/user-item-get", async (req, res) => {
  const { userUid, date, itemUid } = req?.query;
  const items = await ItemModel.find();

  function transformedUsers(userItems) {
    return userItems.map((el) => ({
      ...el.toObject(), // Convert Mongoose document to plain object
      uid: el._id, // Add the custom `uid` field
      items: el?.items?.map((t) => ({
        ...t.toObject(),
        name: items?.find((f) => f._id == t?.itemUid)?.name,
      })),
    }));
  }

  try {
    let filter = {};

    // Build the filter based on the provided query parameters
    if (userUid) {
      filter.user = userUid;
    }
    if (date) {
      filter.date = date;
    }

    let userItems = await UserItemModel.find(filter).populate("user");

    if (itemUid) {
      userItems = userItems.filter((item) =>
        item.items.some((i) => i.itemUid === itemUid)
      );
    }

    return res
      .status(200)
      .json({ statusCode: 200, data: transformedUsers(userItems) });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Post User Item
UserItemRouter.post("/user-item-create", async (req, res) => {
  try {
    // Check if a record already exists for the given user and date
    const existData = await UserItemModel.findOne({
      date: req.body.date,
      user: req.body.user,
    });

    if (existData) {
      return res.status(400).json({
        statusCode: 400,
        msg: "User already has an entry for that date",
      });
    }

    // Validate and reduce quantity/stock for each item in the request body
    for (let i = 0; i < req.body.items.length; i++) {
      const { itemUid, quantity } = req.body.items[i];
      // Find the item in the database
      const item = await ItemModel.findById(itemUid);
      if (!item) {
        return res.status(404).json({
          statusCode: 404,
          msg: `Item with ID ${itemUid} not found.`,
        });
      }

      // Check if the requested quantity exceeds available stock
      if (item.quantity < quantity) {
        return res.status(400).json({
          statusCode: 400,
          msg: `Insufficient stock for item ${item.name}. Requested: ${quantity}, Available: ${item.quantity}.`,
        });
      }
    }

    // Deduct the quantity from stock for each item
    for (let i = 0; i < req.body.items.length; i++) {
      const { itemUid, quantity } = req.body.items[i];
      await ItemModel.findByIdAndUpdate(itemUid, {
        $inc: { quantity: -quantity },
      });
    }

    // Create a new user item record
    const userItem = new UserItemModel({ ...req.body });
    await userItem.save();

    // Send success response
    res.status(201).json({
      statusCode: 201,
      msg: "Item Assigned to User Successfully",
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      statusCode: 500,
      msg: error.message || "Internal Server Error",
    });
  }
});

// Update User Item
UserItemRouter.put("/user-item-update/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;

    // Fetch the existing order
    const existingOrder = await UserItemModel.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        statusCode: 404,
        msg: "Order not found.",
      });
    }

    // Track existing item IDs for removal
    const existingItemIds = existingOrder.items.map((item) =>
      item.itemUid.toString()
    );

    // Process items in the request
    for (let i = 0; i < items.length; i++) {
      const { itemUid, quantity } = items[i];
      const existingItem = existingOrder.items.find(
        (item) => item.itemUid.toString() === itemUid
      );

      const item = await ItemModel.findById(itemUid);
      if (!item) {
        return res.status(404).json({
          statusCode: 404,
          msg: `Item with ID ${itemUid} not found.`,
        });
      }

      if (existingItem) {
        // If item exists in the order, update quantity and stock
        const quantityDifference = quantity - existingItem.quantity;

        if (quantityDifference > 0) {
          if (item.quantity < quantityDifference) {
            return res.status(400).json({
              statusCode: 400,
              msg: `Insufficient stock for item ${item.name}. Requested increase: ${quantityDifference}, Available: ${item.quantity}.`,
            });
          }

          await ItemModel.findByIdAndUpdate(itemUid, {
            $inc: { quantity: -quantityDifference },
          });
        } else if (quantityDifference < 0) {
          await ItemModel.findByIdAndUpdate(itemUid, {
            $inc: { quantity: -quantityDifference }, // Adding a negative difference increases stock
          });
        }

        existingItem.quantity = quantity;
        existingItemIds.splice(existingItemIds.indexOf(itemUid), 1); // Remove from the list of items to be deleted
      } else {
        // If item does not exist in the order, add it and deduct stock
        if (item.quantity < quantity) {
          return res.status(400).json({
            statusCode: 400,
            msg: `Insufficient stock for item ${item.name}. Requested: ${quantity}, Available: ${item.quantity}.`,
          });
        }

        await ItemModel.findByIdAndUpdate(itemUid, {
          $inc: { quantity: -quantity },
        });

        existingOrder.items.push({ itemUid, quantity });
      }
    }

    // Remove items that were not in the updated items list
    for (const itemUid of existingItemIds) {
      const existingItem = existingOrder.items.find(
        (item) => item.itemUid.toString() === itemUid
      );

      // Increase the stock by the quantity of the removed item
      await ItemModel.findByIdAndUpdate(itemUid, {
        $inc: { quantity: existingItem.quantity },
      });

      existingOrder.items = existingOrder.items.filter(
        (item) => item.itemUid.toString() !== itemUid
      );
    }

    // Save the updated order
    await existingOrder.save();

    res.status(200).json({
      statusCode: 200,
      msg: "Order updated successfully",
      order: existingOrder,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      msg: error.message || "Internal Server Error",
    });
  }
});

// delete user item
UserItemRouter.delete("/user-item-delete/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch the existing order
    const existingOrder = await UserItemModel.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        statusCode: 404,
        msg: "Order not found.",
      });
    }

    // Adjust the stock for each item in the order
    for (let i = 0; i < existingOrder.items.length; i++) {
      const { itemUid, quantity } = existingOrder.items[i];

      // Find the item in the database
      const item = await ItemModel.findById(itemUid);
      if (!item) {
        return res.status(404).json({
          statusCode: 404,
          msg: `Item with ID ${itemUid} not found.`,
        });
      }

      // Increase the stock by the quantity that was in the order
      await ItemModel.findByIdAndUpdate(itemUid, {
        $inc: { quantity: quantity },
      });
    }

    // Delete the order
    await UserItemModel.findByIdAndDelete(orderId);

    res.status(200).json({
      statusCode: 200,
      msg: "Order deleted and stock adjusted successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      msg: error.message || "Internal Server Error",
    });
  }
});

module.exports = {
  UserItemRouter,
};
