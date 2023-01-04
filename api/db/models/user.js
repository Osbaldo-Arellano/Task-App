const mongoose = require("mongoose");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { resolve } = require("path");
const bcrypt = require("bcryptjs");
const { response } = require("express");
const e = require("express");

// JWT secret
const jwtSecret = "48362958244696381304fasdfassacgfklh8111620505";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  sessions: [
    {
      token: {
        type: String,
        required: true,
        exipresAt: {
          type: Number,
          required: true,
        },
      },
    },
  ],
});

// Overwriting the deafult toJson method to not return password and sessions (sensitive info)
UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  return _.omit(userObject, ["password", "sessions"]);
};

UserSchema.methods.generateAccessAuthToken = function () {
  const user = this;
  return new Promise((resolve, reject) => {
    // Create the JSON Web Token and return that
    jwt.sign(
      { _id: user._id.toHexString() },
      jwtSecret,
      { expiresIn: "15m" },
      (err, token) => {
        if (!err) {
          resolve(token);
        } else {
          // there is an error
          reject();
        }
      }
    );
  });
};

UserSchema.methods.generateRefreshAuthToken = function () {
  // Genrates a 64byte string
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (!err) {
        let token = buf.toString("hex");

        return resolve(token);
      }
    });
  });
};

UserSchema.methods.createSession = function () {
  let user = this;

  return user
    .generateRefreshAuthToken()
    .then((refreshToken) => {
      return saveSessionToDatabase(user, refreshToken);
    })
    .then((refreshToken) => {
      return refreshToken;
    })
    .catch((err) => {
      return Promise.reject("Failed to save session to database. \n");
    });
};

UserSchema.statics.findByIdAndToken = function (_id, token) {
  // This method is used in auth middleware
  const User = this;

  return User.findOne({
    _id,
    "sessions.token": token,
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  let User = this;

  return User.findOne({ email }).then((user) => {
    if (!user) {
      return Promise.reject();
    } else {
      return new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            resolve(user);
          } else {
            reject();
          }
        });
      });
    }
  });
};

UserSchema.statics.hasRefreshTokenExpired = (exipresAt) => {
  let secondsSinceEpoch = Date.now() / 1000;
  if (exipresAt > secondsSinceEpoch) return false;
  else return true;
};

// Middleware
UserSchema.pre("save", function (next) {
  // Runs when a User document is saved
  let user = this;
  let costFactor = 10;

  if (user.isModified("password")) {
    bcrypt.genSalt(costFactor, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

let saveSessionToDatabase = (user, refreshToken) => {
  // Save session to database
  return new Promise((resolve, reject) => {
    let exipresAt = generateRefreshAuthTokenExpiryTime();
    user.sessions.push({ token: refreshToken, exipresAt });

    user
      .save()
      .then(() => {
        // Session saved
        return resolve(refreshToken);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

let generateRefreshTokenExpiryTime = () => {
  let daysUntilExpire = "10";
  let secondsUntilExpire = daysUntilExpire * 24 * 60 * 60;
  return Date.now() / 1000 + secondsUntilExpire;
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };