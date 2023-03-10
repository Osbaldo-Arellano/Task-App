const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose");
const app = express();
let cors = require("cors");
const jwt = require("jsonwebtoken");

/* Mongoose models */
const { List, Task, User } = require("./db/models");

/**
 * ------------------------------------ MIDDLEWARE ------------------------------------
 */

// Load middleware
app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE"
  );

  res.header(
    "Access-Control-Expose-Headers",
    "x-access-token, x-refresh-token, _id"
  );
  next();
});

// Check if request has a valid JWT token
let authenticate = (req, res, next) => {
  let token = req.header("x-access-token");

  jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
    if (err) {
      res.status(401).send(err);
    } else {
      req.user_id = decoded._id;
      next();
    }
  });
};

// Verify request token middleware (verifies the session)
let verifySession = (req, res, next) => {
  let refreshToken = req.header("x-refresh-token");
  let _id = req.header("_id");

  User.findByIdAndToken(_id, refreshToken)
    .then((user) => {
      if (!user) {
        return Promise.reject({
          error: "User not found. Check refresh token and id.",
        });
      }

      // The user was found.
      // Need to check is session has expired
      req.user_id = user._id;
      req.userObject = user;
      req.refreshToken = refreshToken;
      let isSessionValid = false;

      user.sessions.forEach((session) => {
        if (session.token == refreshToken) {
          if (User.hasRefreshTokenExpired(session.expiresAt) == false) {
            isSessionValid = true;
          }
        }
      });

      if (isSessionValid) {
        next();
      } else {
        return Promise.reject({
          error: "Refresh token has expired or the session is invalid >:-(",
        });
      }
    })
    .catch((err) => {
      res.status(401).send(err);
    });
};

/**
 * ------------------------------------ ROUTES FOR TASKS ------------------------------------
 */

/**
 * GET /lists
 * Purpose: Get all lists from the DB
 */
app.get("/lists", authenticate, (req, res) => {
  List.find({
    _userId: req.user_id,
  })
    .then((lists) => {
      res.send(lists);
    })
    .catch((err) => {
      res.send(err);
    });
});

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post("/lists", authenticate, (req, res) => {
  // Create a new list and return the new list to the user
  // List information fields are passes via JSON request body
  let title = req.body.title;

  let newList = new List({
    title,
    _userId: req.user_id,
  });
  newList.save().then((listDoc) => {
    res.send(listDoc);
  });
});

/**
 * PATCH /lists/:id
 * Purpose: updates a list by listId and userid
 */
app.patch("/lists/:id", authenticate, (req, res) => {
  console.log(req.user_id);
  List.findByIdAndUpdate(
    {
      _id: req.params.id,
      _userId: req.user_id,
    },
    {
      $set: req.body,
    }
  ).then(() => {
    res.send({
      message: "List updated successfully.",
    });
  });
});

/**
 * DELETE /lists/:id
 * Purpose: delete list by listId and userid
 */
app.delete("/lists/:id", authenticate, (req, res) => {
  List.findOneAndDelete({
    _id: req.params.id,
    _userId: req.user_id,
  }).then((removedList) => {
    console.log(removedList);
    res.send(removedList);

    // Delete all tasks from a list
    deleteTasksFromList(removedList._id);
  });
});

/**
 * ------------------------------------ ROUTES FOR TASKS ------------------------------------
 */

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks from a list
 *  */
app.get("/lists/:listId/tasks", authenticate, (req, res) => {
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
app.post("/lists/:listId/tasks", authenticate, (req, res) => {
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      if (list) {
        return true;
      }
      return false;
    })
    .then((canCreateTask) => {
      if (canCreateTask) {
        let newTask = new Task({
          title: req.body.title,
          _listId: req.params.listId,
        });
        newTask.save().then((task) => {
          res.send(task);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update tasks from a list
 *  */
app.patch("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      if (list) {
        return true;
      }
      return false;
    })
    .then((canUpdateTask) => {
      if (canUpdateTask) {
        Task.findOneAndUpdate(
          {
            _id: req.params.taskId,
            _listId: req.params.listId,
          },
          {
            $set: req.body,
          }
        ).then(() => {
          res.send({ message: "Updated sucessfully" });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete task from a list
 *  */
app.delete("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id,
  })
    .then((list) => {
      if (list) {
        return true;
      }
      return false;
    })
    .then((canDeleteTask) => {
      if (canDeleteTask) {
        Task.findOneAndDelete({
          _id: req.params.taskId,
          _listId: req.params.listId,
        }).then((removedTask) => {
          res.send(removedTask);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * ------------------------------------ ROUTES FOR USERS ------------------------------------
 */

/**
 * POST /users
 * Purpose: sign up
 */
app.post("/users", (req, res) => {
  let body = req.body;
  let newUser = new User(body);

  newUser
    .save()
    .then(() => {
      return newUser.createSession();
    })
    .then((refreshToken) => {
      // Session created successfully - refresh token returned
      // now we generate an access token for the user
      return newUser.generateAccessAuthToken().then((accessToken) => {
        return { accessToken, refreshToken };
      });
    })
    .then((authTokens) => {
      res
        .header("x-refresh-token", authTokens.refreshToken)
        .header("x-access-token", authTokens.accessToken)
        .send(newUser);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

/**
 * POST /users/login
 * Purpose: login user
 */
app.post("/users/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  User.findByCredentials(email, password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          // Session has been created
          // now generate access auth token for the user
          return user.generateAccessAuthToken().then((accessToken) => {
            // auth token generated. Return object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          res
            .header("x-refresh-token", authTokens.refreshToken)
            .header("x-access-token", authTokens.accessToken)
            .send(user);
        });
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

/**
 * GET users/me/access-token
 * Purpose: generate and return an access token
 */
app.get("/users/me/access-token", verifySession, (req, res) => {
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res.header("x-access-token", accessToken).send({ accessToken });
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

/**
 * ------------------------------------ HELPER METHODS------------------------------------
 */
let deleteTasksFromList = (_listId) => {
  Task.deleteMany({
    _listId,
  }).then(() => {
    console.log("Tasks from ListId " + _listId + " were deleted.");
  });
};

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
