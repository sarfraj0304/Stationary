const mongoose = require("mongoose");

const ItemSchema = mongoose.Schema(
  {
    name: { type: "String", required: true },
    quantity: { type: "Number", required: true },
    actualQuantity: { type: "Number", required: true },
  },
  { timestamps: true, versionKey: false }
);

const ItemModel = mongoose.model("items", ItemSchema);

module.exports = {
  ItemModel,
};
