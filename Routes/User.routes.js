const { Router } = require("express");
const { UserModel } = require("../Models/user.model");

const UserRouter = Router();
// Get Users
UserRouter.get("/get-user", async (req, res) => {
  try {
    const users = await UserModel.find();
    const transformedUsers = users.map((el) => ({
      ...el.toObject(), // Convert Mongoose document to plain object
      uid: el._id, // Add the custom `uid` field
    }));
    res.status(200).json({
      statusCode: 200,
      data: transformedUsers,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Post Users
UserRouter.post("/create-user", async (req, res) => {
  try {
    const existUser = await UserModel.findOne({ name: req.body.name });
    if (existUser) {
      res.status(400).json({ statusCode: 400, msg: "User Already Exist" });
    } else {
      const user = new UserModel({ ...req.body });
      await user.save();
      res
        .status(201)
        .json({ statusCode: 201, msg: "User Created Successfully" });
    }
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Update Users
UserRouter.put("/update-user/:id", async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate({ _id: req.params.id }, req.body);
    res.status(200).json({ statusCode: 200, msg: "User Updated Successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

// Delete Users
UserRouter.delete("/delete-user/:id", async (req, res) => {
  try {
    await UserModel.findByIdAndDelete({ _id: req.params.id });
    res.status(200).json({ statusCode: 200, msg: "User Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, msg: error });
  }
});

module.exports = {
  UserRouter,
};
