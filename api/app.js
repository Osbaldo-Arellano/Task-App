const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose");
const app = express();
let cors = require("cors");

/* Mongoose models */
const { List, Task } = require("./db/models");

// Load middleware
app.use(bodyParser.json());
app.use(cors());

/**
 * ------------------------------------ ROUTES FOR TASKS ------------------------------------
 */

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

app.patch("/lists/:id", (req, res) => {
  List.findByIdAndUpdate(
    {
      _id: req.params.id,
    },
    {
      $set: req.body,
    }
  ).then(() => {
    res.sendStatus(200);
  });
});

app.delete("/lists/:id", (req, res) => {
  List.findOneAndDelete({
    _id: req.params.id,
  }).then((removedList) => {
    res.send(removedList);
  });
});

/**
 * ------------------------------------ ROUTES FOR TASKS ------------------------------------
 */

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks from a list
 *  */
app.get("/lists/:listId/tasks", (req, res) => {
  Task.find({
    _listId: req.params.listId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: Get single tasks from a list
 *  */
app.get("/lists/:listId/tasks/:taskId", (req, res) => {
  Task.findOne({
    _id: req.params.taskId,
    _listId: req.params.listId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task
 *  */
app.post("/lists/:listId/tasks", (req, res) => {
  let newTask = new Task({
    title: req.body.title,
    _listId: req.params.listId,
  });
  newTask.save().then((task) => {
    res.send(task);
  });
});

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Get all tasks from a list
 *  */
app.patch("/lists/:listId/tasks/:taskId", (req, res) => {
  Task.findOneAndUpdate(
    {
      _id: req.params.taskId,
      _listId: req.params.listId,
    },
    {
      $set: req.body,
    }
  ).then(() => {
    res.sendStatus(200);
  });
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete task from a list
 *  */
app.delete("/lists/:listId/tasks/:taskId", (req, res) => {
  Task.findOneAndDelete({
    _id: req.params.taskId,
    _listId: req.params.listId,
  }).then((removedTask) => {
    res.send(removedTask);
  });
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
