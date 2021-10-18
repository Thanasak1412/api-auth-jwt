require("dotenv").config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const { authSchema } = require("../validations/validationSchema");
const client = require("../models/initRedis");

const signup = async (req, res, next) => {
  try {
    const { email, password } = await authSchema.validateAsync(req.body);
    const oldUser = await User.findOne({ email });

    if (oldUser) throw createError.Conflict(`${email} is already.`);
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ email, password: hashedPassword });
    const accessToken = await jwt.sign(
      { user },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "15s" }
    );
    const refreshToken = await jwt.sign(
      { user },
      process.env.SECRET_REFRESH_TOKEN
    );

    client.set(user.id, refreshToken, "EX", 15, (err, reply) => {
      if (err) {
        console.log(err);
        throw createError.InternalServerError();
      }
      res.status(200).json({ user, accessToken, refreshToken });
    });
  } catch (error) {
    if (error.isJoi === true) error.status = 422;
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw createError.BadRequest();
    const oldUser = await User.findOne({ email });

    if (!oldUser) throw createError.Conflict(`${email} is not a valid`);
    const isPassword = await bcrypt.compare(password, oldUser.password);

    if (!isPassword) throw createError.Conflict(`Password is incorrect`);
    const accessToken = await jwt.sign(
      { oldUser },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "15s" }
    );
    const refreshToken = await jwt.sign(
      { oldUser },
      process.env.SECRET_REFRESH_TOKEN
    );

    client.set(
      oldUser.id,
      refreshToken,
      "EX",
      365 * 24 * 60 * 60,
      (err, reply) => {
        if (err) {
          console.log(err);
          throw createError.InternalServerError();
        }
        res.status(200).json({
          user: oldUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) throw createError.BadRequest();
    jwt.verify(
      refreshToken,
      process.env.SECRET_REFRESH_TOKEN,
      async (err, { oldUser }) => {
        if (err) return next(createError.Unauthorized());

        client.get(oldUser._id, async (err, reply) => {
          if (err) throw createError.InternalServerError();
          console.log("oldUser.id", oldUser.id);
          const accessToken = await jwt.sign(
            { oldUser },
            process.env.SECRET_ACCESS_TOKEN,
            { expiresIn: "20s" }
          );
          const refreshToken = await jwt.sign(
            { oldUser },
            process.env.SECRET_REFRESH_TOKEN
          );
          client.set(
            oldUser._id,
            refreshToken,
            "EX",
            365 * 24 * 60 * 60,
            (err, token) => {
              if (err) throw createError.InternalServerError();
              res.json({ accessToken, refreshToken });
            }
          );
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

const logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) throw createError.BadRequest();

    jwt.verify(
      refreshToken,
      process.env.SECRET_REFRESH_TOKEN,
      (err, { oldUser }) => {
        if (err) throw createError.Unauthorized();
        client.DEL(oldUser._id, (err, result) => {
          if (err) throw createError.Unauthorized();

          console.log(result);
          res.sendStatus(204);
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, refreshToken, logout };
