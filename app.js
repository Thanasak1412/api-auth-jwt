require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const createError = require("http-errors");

const app = express();
const PORT = 3000 || process.env.PORT;

const authRoutes = require("./routes/auth");
require("./models/initRedis");

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/user", authRoutes);

// Handle Error
app.use(async (req, res, next) => next(createError.NotFound()));
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status,
      message: err.message,
    },
  });
});

// connect DB
mongoose
  .connect(process.env.CONNECT_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(`${err} did not connect`));
