const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    name: { type: "String", required: true },
  },
  { timestamps: true, versionKey: false }
);

const UserModel = mongoose.model("users", UserSchema);
module.exports = {
  UserModel,
};
