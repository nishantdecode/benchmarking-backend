const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Hasher = require("./helpers/hasher.helper");
const { JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY } =
  process.env;

const schema = new mongoose.Schema(
  {
    name: {
      first: {
        type: String,
        required: true,
      },
      last: {
        type: String,
      },
    },
    loginID: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["User", "Admin", "SuperAdmin"],
      default: "User",
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  var user = this;

  if (user.isModified("password")) {
    const salt = Hasher.getSalt(10);
    const hash = Hasher.hash(user.password, salt);
    user.password = hash;
  }
  next();
});

schema.methods.verifyPassword = function (password, currentPass) {
  return new Promise((resolve, reject) => {
    Hasher.compare(password, currentPass)
      .then((isMatch) => resolve(isMatch))
      .catch((err) => reject(err));
  });
};

schema.methods.verifyToken = function (token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return err;
  }
};

schema.methods.decodeToken = function (token) {
  return jwt.decode(token);
};

schema.methods.verifyRefreshToken = function (token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (err) {
    return err;
  }
};

schema.methods.generateToken = (data) => {
  return jwt.sign({ ...data }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

schema.methods.generateRefreshToken = function (data) {
  return jwt.sign({ ...data }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
};

const User = mongoose.model("User", schema);

module.exports.User = User;
