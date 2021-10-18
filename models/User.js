const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    min: 3,
    max: 255,
    required: true,
  },
  password: {
    type: String,
    min: 3,
    max: 1024,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
