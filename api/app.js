const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose");
const app = express();
/* Mongoose models */
const { List, Task } = require("./db/models");

// Load middleware
app.use(bodyParser.json());

/* ROUTE HANDLERS */

/* LIST ROUTES */

/**
 * GET /lists
 * Purpose: Get all lists from the DB
 */
app.get("/lists", (req, res) => {
  // Return array of all the lists in the DB
  List.find({}).then((lists) => {
    res.send(lists);
  });
});

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post("/lists", (req, res) => {
  // Create a new list and return the new list to the user
  // List information fields are passes via JSON request body
  let title = req.body.title;

  let newList = new List({
    title,
  });
  newList.save().then((listDoc) => {
    res.send(listDoc);
  });
});

app.patch("/lists/:id", (req, res) => {});

app.delete("/list/:id", (req, res) => {});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
