// This file consolidates all models to make it easier to import them from other files
const { List } = require("./list");
const { Task } = require("./task");
const { User } = require("./user");

module.exports = {
  Task,
  List,
  User,
};
