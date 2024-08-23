const mongoose = require("mongoose");

const UserItemSchema = mongoose.Schema(
  {
    date: { type: String, required: true },
    items: [
      {
        itemUid: {
          type: String,
          required: true,
        },
        name: { type: String },
        quantity: { type: Number, required: true },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true, versionKey: false }
);

const UserItemModel = mongoose.model("userItem", UserItemSchema);
module.exports = {
  UserItemModel,
};
